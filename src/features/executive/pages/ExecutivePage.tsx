import { useMemo } from 'react';
import { BadgeDollarSign, Boxes, ChartNoAxesCombined, CircleDollarSign, Route, Wallet } from 'lucide-react';
import { ChartCard } from '@/components/ChartCard';
import { EChart } from '@/components/EChart';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/Skeleton';
import { BrazilLogisticMap } from '@/features/executive/components/BrazilLogisticMap';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { monthlyRevenueCost, topCustomersByLogisticsIndex } from '@/utils/aggregations';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import {
  customerCostRankingOption,
  revenueCostComboOption,
  weightIndexScatterOption,
} from '@/features/executive/charts/executiveChartOptions';

export default function ExecutivePage() {
  const indicators = useGlobalFilterStore((state) => state.indicators);
  const invoices = useGlobalFilterStore((state) => state.filteredInvoices);
  const openDrilldown = useGlobalFilterStore((state) => state.openDrilldown);

  const comboData = useMemo(() => monthlyRevenueCost(invoices), [invoices]);
  const expensiveCustomers = useMemo(() => topCustomersByLogisticsIndex(invoices), [invoices]);

  if (invoices.length === 0) {
    return <EmptyState title="Sem notas no filtro atual" description="Ajuste os filtros globais para recompor a leitura logística." />;
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-6 gap-4">
        <KpiCard title="Receita Total" value={formatCurrency(indicators.revenue)} helper="Base operacional filtrada" accent="bg-signal-blue/25" icon={Wallet} />
        <KpiCard title="Custo Transporte Total" value={formatCurrency(indicators.transportCost)} helper="Clique para composição" accent="bg-signal-coral/25" icon={Route} onClick={() => openDrilldown('transport-cost')} />
        <KpiCard title="Custo Operacional" value={formatCurrency(indicators.operationalCost)} helper="Armazenagem + movimentação" accent="bg-signal-amber/25" icon={Boxes} />
        <KpiCard title="Custo Logístico Total" value={formatCurrency(indicators.totalLogisticsCost)} helper="Transporte + operacional" accent="bg-white/10" icon={CircleDollarSign} />
        <KpiCard title="Resultado Logístico" value={formatCurrency(indicators.logisticsResult)} helper="Clique para rankings" accent="bg-signal-mint/20" icon={BadgeDollarSign} onClick={() => openDrilldown('logistics-result')} />
        <KpiCard title="Índice Logístico %" value={formatPercent(indicators.logisticsIndex)} helper="Custo logístico / receita" accent="bg-signal-blue/20" icon={ChartNoAxesCombined} />
      </section>

      <section className="grid grid-cols-2 gap-5">
        <ChartCard title="Receita x Custo Logístico" description="Barras de receita com linha de custo logístico">
          <EChart option={revenueCostComboOption(comboData)} />
        </ChartCard>
        <ChartCard title="Mapa Interativo Brasil" description="Intensidade de custo regional por UF">
          <BrazilLogisticMap />
        </ChartCard>
        <ChartCard title="Top 10 Clientes Mais Caros" description="Ranking por Índice Logístico (%)">
          <EChart option={customerCostRankingOption(expensiveCustomers)} />
        </ChartCard>
        <ChartCard title="Dispersão Peso x Índice Logístico" description="Identificação de fretes inviáveis e distorções">
          <EChart option={weightIndexScatterOption(invoices)} />
        </ChartCard>
      </section>
    </div>
  );
}
