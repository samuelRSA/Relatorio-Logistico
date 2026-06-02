import { useMemo } from 'react';
import { Package, Scale, Truck, Warehouse, Weight } from 'lucide-react';
import { ChartCard } from '@/components/ChartCard';
import { EChart } from '@/components/EChart';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/Skeleton';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { groupSum } from '@/utils/aggregations';
import { formatCurrency } from '@/utils/formatters';
import {
  operationalCompositionOption,
  operationalEvolutionOption,
  operationalRankingOption,
} from '@/features/operations/charts/operationsChartOptions';

export default function OperationsPage() {
  const invoices = useGlobalFilterStore((state) => state.filteredInvoices);
  const indicators = useGlobalFilterStore((state) => state.indicators);
  const openDrilldown = useGlobalFilterStore((state) => state.openDrilldown);
  const storage = invoices.reduce((sum, invoice) => sum + invoice.operational.storage, 0);
  const handling = invoices.reduce((sum, invoice) => sum + invoice.operational.handling, 0);
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
  const ranking = useMemo(
    () => groupSum(invoices, (invoice) => invoice.customer, (invoice) => invoice.operationalCost).slice(0, 10),
    [invoices],
  );

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
        <h2 className="mb-4 font-display text-xl font-semibold text-white">
          Indicadores Operacionais de Custo Logístico
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
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
            title="Custo Logístico Total/Kg"
            value={formatCurrency(indicators.totalLogisticsCostPerKg)}
            helper="Transporte + operacional / peso bruto"
            accent="bg-signal-coral/20"
            icon={Truck}
            trendLabel="Filtro atual"
            tooltip="Calculado por (Custo Transporte + Custo Operacional) / Peso Bruto, com divisão por zero retornando 0."
            onClick={() => openDrilldown('total-logistics-cost-per-kg')}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5">
        <ChartCard title="Composição Operacional" description="Armazenagem versus movimentação">
          <EChart option={operationalCompositionOption(storage, handling)} />
        </ChartCard>
        <ChartCard title="Evolução Operacional" description="Evolução mensal do custo logístico operacional">
          <EChart option={operationalEvolutionOption(monthly)} />
        </ChartCard>
        <ChartCard title="Ranking de Custo Operacional por Cliente" description="Clientes com maior custo operacional" className="col-span-2">
          <EChart option={operationalRankingOption(ranking)} height={360} />
        </ChartCard>
      </section>
    </div>
  );
}
