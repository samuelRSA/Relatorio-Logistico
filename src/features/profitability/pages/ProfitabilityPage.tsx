import { useMemo } from 'react';
import { ChartCard } from '@/components/ChartCard';
import { EChart } from '@/components/EChart';
import { EmptyState } from '@/components/Skeleton';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { groupSum, quadrantPoints } from '@/utils/aggregations';
import { paretoCustomersOption, profitabilityQuadrantOption } from '@/features/profitability/charts/profitabilityChartOptions';

export default function ProfitabilityPage() {
  const invoices = useGlobalFilterStore((state) => state.filteredInvoices);
  const paretoData = useMemo(
    () => groupSum(invoices, (invoice) => invoice.customer, (invoice) => invoice.logisticsResult),
    [invoices],
  );
  const quadrants = useMemo(() => quadrantPoints(invoices), [invoices]);

  if (invoices.length === 0) {
    return <EmptyState title="Sem rentabilidade no filtro atual" description="Ajuste os filtros para recompor a matriz logística." />;
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      <ChartCard title="Pareto Clientes" description="Concentração do resultado logístico por cliente">
        <EChart option={paretoCustomersOption(paretoData)} height={420} />
      </ChartCard>
      <ChartCard title="Matriz Quadrante" description="Receita versus índice logístico por cliente">
        <EChart option={profitabilityQuadrantOption(quadrants)} height={420} />
      </ChartCard>
    </div>
  );
}
