import { useMemo } from 'react';
import { ChartCard } from '@/components/ChartCard';
import { useDashboardData } from '@/context/useDashboardData';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { EnrichedInvoice, RankingItem } from '@/types/logistics';
import { groupSum, topCustomersByLogisticsIndex } from '@/utils/aggregations';
import { formatCurrency, formatDecimal, formatPercent } from '@/utils/formatters';
import { isTransportChargeableInvoice } from '@/utils/logisticsRules';

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
  'transfer-cost': {
    title: 'Custo TransferÃªncia',
    formula: 'SUM(C. TransferÃªncia)',
    value: (invoices) => invoices.reduce((sum, item) => sum + item.operational.transfer, 0),
    composition: (invoices) => [
      {
        label: 'Custo TransferÃªncia',
        value: invoices.reduce((sum, item) => sum + item.operational.transfer, 0),
      },
      { label: 'Quantidade NF', value: invoices.length, mode: 'decimal' },
    ],
    rankingValue: (invoice) => invoice.operational.transfer,
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
  const chargeableInvoices = useMemo(() => invoices.filter(isTransportChargeableInvoice), [invoices]);

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
      </div>
    );
  }

  if (context && metricConfigs[context]) {
    return <OperationalIndicatorDrawer config={metricConfigs[context]} invoices={chargeableInvoices} />;
  }

  if (context === 'transport-cost') {
    const cte1 = chargeableInvoices.reduce((sum, item) => sum + item.transport.cte1, 0);
    const cte2 = chargeableInvoices.reduce((sum, item) => sum + item.transport.cte2, 0);
    const additional = chargeableInvoices.reduce((sum, item) => sum + item.transport.additionalValue, 0);
    const cityRanking = groupSum(chargeableInvoices, (item) => `${item.city}/${item.uf}`, (item) => item.transportCost).slice(0, 5);
    const clientRanking = groupSum(chargeableInvoices, (item) => item.customer, (item) => item.transportCost).slice(0, 5);

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

  const totalCostByCustomer = groupSum(invoices, (item) => item.customer, (item) => item.totalLogisticsCost).slice(0, 5);
  const cityRanking = groupSum(invoices, (item) => `${item.city}/${item.uf}`, (item) => item.totalLogisticsCost).slice(0, 5);
  const costlyCustomers = topCustomersByLogisticsIndex(invoices).slice(0, 5);

  return (
    <div className="space-y-5">
      <Ranking title="Clientes com maior custo logístico" rows={totalCostByCustomer} mode="currency" />
      <Ranking title="Ranking cidades por custo logístico" rows={cityRanking} mode="currency" />
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
  const transferCost = invoices.reduce((sum, invoice) => sum + invoice.operational.transfer, 0);
  const operationalCost = invoices.reduce((sum, invoice) => sum + invoice.operationalCost, 0);
  const logisticsCost = invoices.reduce((sum, invoice) => sum + invoice.totalLogisticsCost, 0);
  const totalGrossWeight = invoices.reduce((sum, invoice) => sum + invoice.grossWeight, 0);
  const transferCount = invoices.length;
  const transferOperationalShare = safeDivide(transferCost, operationalCost);
  const transferLogisticsShare = safeDivide(transferCost, logisticsCost);
  const transferOperationalPerKg = safeDivide(transferCost, totalGrossWeight);

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
      {config.title === 'Custo Transferência' ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
          <h3 className="font-display text-lg font-semibold text-white">Detalhamento da transferência</h3>
          <div className="mt-4 space-y-2">
            <DetailRow label="C. Transferência" value={formatCurrency(transferCost)} />
            <DetailRow label="Custo Operacional" value={formatCurrency(operationalCost)} />
            <DetailRow label="Custo Logístico Total" value={formatCurrency(logisticsCost)} />
            <DetailRow label="Quantidade NF" value={formatDecimal(transferCount)} />
            <DetailRow label="Peso Bruto" value={formatDecimal(totalGrossWeight)} />
            <DetailRow label="Participação no Custo Operacional" value={formatPercent(transferOperationalShare)} />
            <DetailRow label="Participação no Custo Logístico Total" value={formatPercent(transferLogisticsShare)} />
            <DetailRow label="C. Transferência/Kg" value={formatCurrency(transferOperationalPerKg)} />
          </div>
        </section>
      ) : null}
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
