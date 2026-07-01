import { useMemo } from 'react';
import { Package, Scale, Truck, Warehouse, Weight } from 'lucide-react';
import { ChartCard } from '@/components/ChartCard';
import { EChart } from '@/components/EChart';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/Skeleton';
import { useDashboardData } from '@/context/useDashboardData';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { topCustomersByOperationalCost } from '@/utils/aggregations';
import { formatCurrency, formatDecimal } from '@/utils/formatters';
import {
  operationalCompositionOption,
  operationalEvolutionOption,
  operationalRankingOption,
} from '@/features/operations/charts/operationsChartOptions';

export default function OperationsPage() {
  const { filteredInvoices: invoices, indicators } = useDashboardData();
  const openDrilldown = useGlobalFilterStore((state) => state.openDrilldown);

  const storage = useMemo(() => invoices.reduce((sum, invoice) => sum + invoice.operational.storage, 0), [invoices]);
  const handling = useMemo(() => invoices.reduce((sum, invoice) => sum + invoice.operational.handling, 0), [invoices]);
  const transfer = useMemo(() => invoices.reduce((sum, invoice) => sum + invoice.operational.transfer, 0), [invoices]);
  const monthly = useMemo(() => {
    const grouped = invoices.reduce<Record<string, number>>((acc, invoice) => {
      const month = invoice.date.slice(0, 7);
      acc[month] = (acc[month] ?? 0) + invoice.operationalCost;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [invoices]);
  const ranking = useMemo(() => topCustomersByOperationalCost(invoices), [invoices]);

  if (invoices.length === 0) {
    return (
      <EmptyState
        title="Sem operação logística no filtro atual"
        description="Ajuste os filtros para reabrir a composição operacional."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-white">Indicadores Operacionais de Custo Logístico</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Frete/Kg Bruto"
            value={formatCurrency(indicators.grossFreightPerKg)}
            helper="CTE1 + CTE2 + adicional / peso bruto"
            accent="bg-signal-blue/20"
            icon={Weight}
            trendLabel="Filtro atual"
            tooltip="Calculado exclusivamente por (Vlr CTE1 + Vlr CTE2 + Valor Adicional) / Peso Bruto."
            onClick={() => openDrilldown('gross-freight-per-kg')}
          />
          <KpiCard
            title="Frete/Kg Líquido"
            value={formatCurrency(indicators.netFreightPerKg)}
            helper="CTE1 + CTE2 + adicional / peso líquido"
            accent="bg-signal-amber/20"
            icon={Scale}
            trendLabel="Filtro atual"
            tooltip="Calculado exclusivamente por (Vlr CTE1 + Vlr CTE2 + Valor Adicional) / Peso Líquido."
            onClick={() => openDrilldown('net-freight-per-kg')}
          />
          <KpiCard
            title="Custo Armazenagem"
            value={formatCurrency(storage)}
            helper="Soma direta da base filtrada"
            accent="bg-signal-mint/20"
            icon={Warehouse}
            trendLabel="Filtro atual"
            tooltip="Utiliza exclusivamente o campo Custo Armazenagem da base filtrada."
            onClick={() => openDrilldown('storage-cost')}
          />
          <KpiCard
            title="Custo Movimentação"
            value={formatCurrency(handling)}
            helper="Soma direta da base filtrada"
            accent="bg-white/10"
            icon={Package}
            trendLabel="Filtro atual"
            tooltip="Utiliza exclusivamente o campo Custo Movimentação da base filtrada."
            onClick={() => openDrilldown('handling-cost')}
          />
          <KpiCard
            title="Custo Transferência"
            value={formatCurrency(transfer)}
            helper="Soma direta da base filtrada"
            accent="bg-signal-mint/20"
            icon={Truck}
            trendLabel="Filtro atual"
            tooltip="Utiliza exclusivamente o campo C. Transferência / C. Transferencia da base filtrada e compõe o Custo Operacional."
            onClick={() => openDrilldown('transfer-cost')}
          />
          <KpiCard
            title="Custo Logístico Total/Kg"
            value={formatCurrency(indicators.totalLogisticsCostPerKg)}
            helper="Custo logístico total / peso bruto"
            accent="bg-signal-coral/20"
            icon={Truck}
            trendLabel="Filtro atual"
            tooltip="Calculado por Custo Logístico Total / Peso Bruto, com divisão por zero retornando 0."
            onClick={() => openDrilldown('total-logistics-cost-per-kg')}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <ChartCard title="Composição Operacional" description="Armazenagem, movimentação e transferência" className="xl:col-span-2">
          <EChart option={operationalCompositionOption(storage, handling, transfer)} />
        </ChartCard>
        <ChartCard title="Evolução Operacional" description="Evolução mensal do custo logístico operacional" className="relative pt-12 xl:col-span-3">
          <div className="absolute right-5 top-5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
            Últimos 3 meses
          </div>
          <EChart option={operationalEvolutionOption(monthly)} />
        </ChartCard>
        <ChartCard
          title="Top 10 Clientes por Custo Operacional"
          description="Armazenagem + movimentação + transferência por cliente"
          className="xl:col-span-3"
        >
          <EChart option={operationalRankingOption(ranking)} height={360} />
        </ChartCard>
        <ChartCard title="Quantidade em Kg Movimentado" description="Peso bruto operacional por cliente" className="xl:col-span-2">
          <div className="space-y-2">
            <div className="grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 border-b border-white/10 px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <span>Rank</span>
              <span>Cliente</span>
              <span className="text-right">Kg Movimentado</span>
            </div>
            {ranking.map((item) => (
              <div
                key={item.customer}
                className="grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-sm"
              >
                <span className="font-semibold text-slate-200">{item.rank}º</span>
                <span className="min-w-0 truncate text-slate-300" title={item.customer}>
                  {item.customer}
                </span>
                <span className="shrink-0 text-right font-semibold text-white">{formatWeight(item.operationalGrossWeight)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>
    </div>
  );
}

function formatWeight(value: number): string {
  return `${formatDecimal(value)} kg`;
}
