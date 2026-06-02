import { useMemo } from 'react';
import { Gauge, PackageSearch, Percent, Route, Scale } from 'lucide-react';
import { ChartCard } from '@/components/ChartCard';
import { EChart } from '@/components/EChart';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/Skeleton';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { cityCostHeatmap, groupSum } from '@/utils/aggregations';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { heatmapCityCostOption, routeRankingOption, weightFreightScatterOption } from '@/features/transportation/charts/transportationChartOptions';

export default function TransportationPage() {
  const invoices = useGlobalFilterStore((state) => state.filteredInvoices);
  const indicators = useGlobalFilterStore((state) => state.indicators);
  const routeData = useMemo(
    () => groupSum(invoices, (invoice) => `${invoice.uf} > ${invoice.city}`, (invoice) => invoice.transportCost).slice(0, 10),
    [invoices],
  );
  const heatmapData = useMemo(() => cityCostHeatmap(invoices), [invoices]);

  if (invoices.length === 0) {
    return <EmptyState title="Sem transporte no filtro atual" description="Ajuste os filtros para visualizar o custo de frete terceirizado." />;
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-5 gap-4">
        <KpiCard title="Custo Transporte" value={formatCurrency(indicators.transportCost)} helper="CTE1 + CTE2 + despesas" accent="bg-signal-coral/25" icon={Route} />
        <KpiCard title="Frete Médio" value={formatCurrency(indicators.transportCost / invoices.length)} helper="Custo médio por NF" accent="bg-signal-blue/20" icon={Gauge} />
        <KpiCard title="Frete/Kg Bruto" value={formatCurrency(indicators.grossFreightPerKg)} helper="Base peso bruto" accent="bg-signal-amber/20" icon={Scale} />
        <KpiCard title="Frete/Kg Líquido" value={formatCurrency(indicators.netFreightPerKg)} helper="Base peso líquido" accent="bg-signal-mint/20" icon={PackageSearch} />
        <KpiCard title="% Despesas Acessórias" value={formatPercent(indicators.accessoryExpenseShare)} helper="Sobre custo transporte" accent="bg-white/10" icon={Percent} />
      </section>

      <section className="grid grid-cols-2 gap-5">
        <ChartCard title="Heatmap Cidade x Custo" description="Concentração de custo por destino logístico">
          <EChart option={heatmapCityCostOption(heatmapData)} />
        </ChartCard>
        <ChartCard title="Dispersão Peso x Frete/Kg" description="Frete por kg bruto versus peso transportado">
          <EChart option={weightFreightScatterOption(invoices)} />
        </ChartCard>
        <ChartCard title="Ranking Rotas Mais Caras" description="Rotas com maior custo de transporte" className="col-span-2">
          <EChart option={routeRankingOption(routeData)} height={360} />
        </ChartCard>
      </section>
    </div>
  );
}
