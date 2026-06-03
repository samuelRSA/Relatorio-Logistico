import { ChartCard } from '@/components/ChartCard';
import { useDashboardData } from '@/context/useDashboardData';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { EnrichedInvoice, RankingItem } from '@/types/logistics';
import { groupSum, topCustomersByLogisticsIndex } from '@/utils/aggregations';
import { formatCurrency, formatDecimal, formatPercent } from '@/utils/formatters';

const safeDivide = (value: number, divisor: number): number => (divisor === 0 ? 0 : value / divisor);

type DrawerMode = 'currency' | 'percent' | 'decimal';

interface OperationalMetricConfig {
  title: string;
  formula: string;
  value: (invoices: EnrichedInvoice[]) => number;
  composition: (invoices: EnrichedInvoice[]) => { label: string; value: number; mode?: DrawerMode }[];
  rankingValue: (invoice: EnrichedInvoice) => number;
  mode?: DrawerMode;
}

const metricConfigs: Record<string, OperationalMetricConfig> = {
  'gross-freight-per-kg': {
    title: 'Frete/Kg Bruto',
    formula: '(Vlr CTE1 + Vlr CTE2 + Valor Adicional) / Peso Bruto',
    value: (invoices) =>
      safeDivide(
        invoices.reduce((sum, item) => sum + item.transportCost, 0),
        invoices.reduce((sum, item) => sum + item.grossWeight, 0),
      ),
    composition: (invoices) => buildFreightComposition(invoices, 'gross'),
    rankingValue: (invoice) => invoice.grossFreightPerKg,
  },
  'net-freight-per-kg': {
    title: 'Frete/Kg Líquido',
    formula: '(Vlr CTE1 + Vlr CTE2 + Valor Adicional) / Peso Líquido',
    value: (invoices) =>
      safeDivide(
        invoices.reduce((sum, item) => sum + item.transportCost, 0),
        invoices.reduce((sum, item) => sum + item.netWeight, 0),
      ),
    composition: (invoices) => buildFreightComposition(invoices, 'net'),
    rankingValue: (invoice) => invoice.netFreightPerKg,
  },
  'storage-cost': {
    title: 'Custo Armazenagem',
    formula: 'SUM(Custo Armazenagem)',
    value: (invoices) => invoices.reduce((sum, item) => sum + item.operational.storage, 0),
    composition: (invoices) => [
      {
        label: 'Custo Armazenagem',
        value: invoices.reduce((sum, item) => sum + item.operational.storage, 0),
      },
      { label: 'Quantidade NF', value: invoices.length, mode: 'decimal' },
    ],
    rankingValue: (invoice) => invoice.operational.storage,
  },
  'handling-cost': {
    title: 'Custo Movimentação',
    formula: 'SUM(Custo Movimentação)',
    value: (invoices) => invoices.reduce((sum, item) => sum + item.operational.handling, 0),
    composition: (invoices) => [
      {
        label: 'Custo Movimentação',
        value: invoices.reduce((sum, item) => sum + item.operational.handling, 0),
      },
      { label: 'Quantidade NF', value: invoices.length, mode: 'decimal' },
    ],
    rankingValue: (invoice) => invoice.operational.handling,
  },
  'total-logistics-cost-per-kg': {
    title: 'Custo Logístico Total/Kg',
    formula: '(Custo Transporte + Custo Operacional) / Peso Bruto',
    value: (invoices) =>
      safeDivide(
        invoices.reduce((sum, item) => sum + item.totalLogisticsCost, 0),
        invoices.reduce((sum, item) => sum + item.grossWeight, 0),
      ),
    composition: (invoices) => [
      {
        label: 'Custo Transporte',
        value: invoices.reduce((sum, item) => sum + item.transportCost, 0),
      },
      {
        label: 'Custo Operacional',
        value: invoices.reduce((sum, item) => sum + item.operationalCost, 0),
      },
      {
        label: 'Armazenagem',
        value: invoices.reduce((sum, item) => sum + item.operational.storage, 0),
      },
      {
        label: 'Movimentação',
        value: invoices.reduce((sum, item) => sum + item.operational.handling, 0),
      },
      {
        label: 'Transferência',
        value: invoices.reduce((sum, item) => sum + item.operational.transfer, 0),
      },
      {
        label: 'Peso Bruto',
        value: invoices.reduce((sum, item) => sum + item.grossWeight, 0),
        mode: 'decimal',
      },
    ],
    rankingValue: (invoice) => invoice.totalLogisticsCostPerKg,
  },
};

export function DrawerContent() {
  const invoice = useGlobalFilterStore((state) => state.selectedInvoice);
  const context = useGlobalFilterStore((state) => state.drilldownContext);
  const { filteredInvoices: invoices } = useDashboardData();

  if (invoice) {
    return (
      <div className="space-y-4">
        <DetailRow label="NF" value={invoice.nf} />
        <DetailRow label="Cliente" value={invoice.customer} />
        <DetailRow label="Cidade/UF" value={`${invoice.city}/${invoice.uf}`} />
        <DetailRow label="Receita Reconhecida" value={formatCurrency(invoice.revenue)} />
        {invoice.originalRevenue !== invoice.revenue ? (
          <DetailRow label="Receita Original" value={formatCurrency(invoice.originalRevenue)} />
        ) : null}
        <DetailRow label="CTE1" value={formatCurrency(invoice.transport.cte1)} />
        <DetailRow label="CTE2" value={formatCurrency(invoice.transport.cte2)} />
        <DetailRow label="Valor adicional" value={formatCurrency(invoice.transport.additionalValue)} />
        <DetailRow label="Armazenagem" value={formatCurrency(invoice.operational.storage)} />
        <DetailRow label="Movimentação" value={formatCurrency(invoice.operational.handling)} />
        <DetailRow label="TransferÃªncia" value={formatCurrency(invoice.operational.transfer)} />
        <DetailRow label="Frete/Kg bruto" value={formatCurrency(invoice.grossFreightPerKg)} />
        <DetailRow label="Frete/Kg líquido" value={formatCurrency(invoice.netFreightPerKg)} />
        <DetailRow label="Custo logístico total/Kg" value={formatCurrency(invoice.totalLogisticsCostPerKg)} />
        <DetailRow label="Índice logístico" value={formatPercent(invoice.logisticsIndex)} />
        <DetailRow label="Resultado logístico" value={formatCurrency(invoice.logisticsResult)} />
      </div>
    );
  }

  if (context && metricConfigs[context]) {
    return <OperationalIndicatorDrawer config={metricConfigs[context]} invoices={invoices} />;
  }

  if (context === 'transport-cost') {
    const cte1 = invoices.reduce((sum, item) => sum + item.transport.cte1, 0);
    const cte2 = invoices.reduce((sum, item) => sum + item.transport.cte2, 0);
    const additional = invoices.reduce((sum, item) => sum + item.transport.additionalValue, 0);
    const cityRanking = groupSum(invoices, (item) => `${item.city}/${item.uf}`, (item) => item.transportCost).slice(0, 5);
    const clientRanking = groupSum(invoices, (item) => item.customer, (item) => item.transportCost).slice(0, 5);

    return (
      <div className="space-y-5">
        <ChartCard title="Composição transporte" description="CTE1, CTE2 e valor adicional">
          <DetailRow label="CTE1" value={formatCurrency(cte1)} />
          <DetailRow label="CTE2" value={formatCurrency(cte2)} />
          <DetailRow label="Valor adicional" value={formatCurrency(additional)} />
        </ChartCard>
        <Ranking title="Cidades mais caras" rows={cityRanking} mode="currency" />
        <Ranking title="Clientes com maior custo" rows={clientRanking} mode="currency" />
      </div>
    );
  }

  const profitable = groupSum(invoices, (item) => item.customer, (item) => item.logisticsResult).slice(0, 5);
  const deficit = [...invoices]
    .filter((item) => item.logisticsResult < 0)
    .sort((a, b) => a.logisticsResult - b.logisticsResult)
    .slice(0, 5)
    .map((item) => ({ label: `${item.customer} - NF ${item.nf}`, value: item.logisticsResult }));
  const cityRanking = groupSum(invoices, (item) => `${item.city}/${item.uf}`, (item) => item.logisticsResult).slice(0, 5);
  const costlyCustomers = topCustomersByLogisticsIndex(invoices).slice(0, 5);

  return (
    <div className="space-y-5">
      <Ranking title="Clientes mais rentáveis" rows={profitable} mode="currency" />
      <Ranking title="Operações deficitárias" rows={deficit} mode="currency" emptyText="Nenhuma operação deficitária no filtro atual." />
      <Ranking title="Ranking cidades" rows={cityRanking} mode="currency" />
      <Ranking title="Clientes críticos por índice" rows={costlyCustomers} mode="percent" />
    </div>
  );
}

function OperationalIndicatorDrawer({
  config,
  invoices,
}: {
  config: OperationalMetricConfig;
  invoices: EnrichedInvoice[];
}) {
  const value = config.value(invoices);
  const monthly = monthlyOperationalEvolution(invoices, config.value);
  const clientRanking = groupSum(invoices, (item) => item.customer, config.rankingValue).slice(0, 5);
  const ufRanking = groupSum(invoices, (item) => item.uf, config.rankingValue).slice(0, 5);
  const relatedRecords = [...invoices]
    .sort((a, b) => config.rankingValue(b) - config.rankingValue(a))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <ChartCard title={config.title} description="Memória de cálculo: custo logístico total dividido pelo peso bruto">
        <DetailRow label="Valor principal" value={formatValue(value, config.mode ?? 'currency')} />
        <DetailRow label="Fórmula" value={config.formula} />
      </ChartCard>
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <h3 className="font-display text-lg font-semibold text-white">Composição do indicador</h3>
        <div className="mt-4 space-y-2">
          {config.composition(invoices).map((row) => (
            <DetailRow key={row.label} label={row.label} value={formatValue(row.value, row.mode ?? 'currency')} />
          ))}
        </div>
      </section>
      <Ranking title="Evolução do período" rows={monthly} mode={config.mode ?? 'currency'} />
      <Ranking title="Ranking relacionado por cliente" rows={clientRanking} mode={config.mode ?? 'currency'} />
      <Ranking title="Detalhamento operacional por UF" rows={ufRanking} mode={config.mode ?? 'currency'} />
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <h3 className="font-display text-lg font-semibold text-white">Registros relacionados</h3>
        <div className="mt-4 space-y-2">
          {relatedRecords.map((invoice) => (
            <div key={invoice.id} className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">{invoice.nf}</span>
                <span className="text-xs text-slate-500">{invoice.city}/{invoice.uf}</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{invoice.customer}</div>
              <div className="mt-1 text-sm font-semibold text-slate-200">{formatValue(config.rankingValue(invoice), config.mode ?? 'currency')}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildFreightComposition(invoices: EnrichedInvoice[], weightMode: 'gross' | 'net') {
  return [
    { label: 'CTE1', value: invoices.reduce((sum, item) => sum + item.transport.cte1, 0) },
    { label: 'CTE2', value: invoices.reduce((sum, item) => sum + item.transport.cte2, 0) },
    { label: 'Valor adicional', value: invoices.reduce((sum, item) => sum + item.transport.additionalValue, 0) },
    {
      label: weightMode === 'gross' ? 'Peso Bruto' : 'Peso Líquido',
      value: invoices.reduce((sum, item) => sum + (weightMode === 'gross' ? item.grossWeight : item.netWeight), 0),
      mode: 'decimal' as const,
    },
  ];
}

function monthlyOperationalEvolution(
  invoices: EnrichedInvoice[],
  getValue: (invoices: EnrichedInvoice[]) => number,
): RankingItem[] {
  const grouped = invoices.reduce<Record<string, EnrichedInvoice[]>>((acc, invoice) => {
    const month = invoice.date.slice(0, 7);
    acc[month] ??= [];
    acc[month].push(invoice);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, monthInvoices]) => ({ label, value: getValue(monthInvoices) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-right font-display text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function Ranking({
  title,
  rows,
  mode,
  emptyText = 'Sem registros no filtro atual.',
}: {
  title: string;
  rows: { label: string; value: number }[];
  mode: DrawerMode;
  emptyText?: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-2">
        {rows.length === 0 ? <p className="text-sm text-slate-500">{emptyText}</p> : null}
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 text-sm">
            <span className="truncate text-slate-400" title={row.label}>
              {row.label}
            </span>
            <span className="font-semibold text-white">{formatValue(row.value, mode)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatValue(value: number, mode: DrawerMode) {
  if (mode === 'currency') return formatCurrency(value);
  if (mode === 'percent') return formatPercent(value);
  return formatDecimal(value);
}
