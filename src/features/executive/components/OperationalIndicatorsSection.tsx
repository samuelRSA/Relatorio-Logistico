import { memo, useCallback, useMemo } from 'react';
import { CircleDollarSign, Package, Scale, Truck, Warehouse } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { EnrichedInvoice } from '@/types/logistics';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const safeDivide = (value: number, divisor: number): number => (divisor === 0 ? 0 : value / divisor);

type MonthlyGroup = {
  revenue: number;
  transportCost: number;
  operationalCost: number;
  totalLogisticsCost: number;
  grossWeight: number;
  netWeight: number;
  storage: number;
  handling: number;
};

type MetricKey = 'grossFreightPerKg' | 'netFreightPerKg' | 'storageCost' | 'handlingCost' | 'totalLogisticsCostPerKg';

function OperationalIndicatorsSectionComponent({ invoices }: { invoices: EnrichedInvoice[] }) {
  const openDrilldown = useGlobalFilterStore((state) => state.openDrilldown);

  const monthlyGroups = useMemo(() => buildMonthlyGroups(invoices), [invoices]);
  const months = useMemo(() => Object.keys(monthlyGroups).sort(), [monthlyGroups]);

  const metrics = useMemo(() => {
    const values = {
      grossFreightPerKg: months.map((month) => safeDivide(monthlyGroups[month].transportCost, monthlyGroups[month].grossWeight)),
      netFreightPerKg: months.map((month) => safeDivide(monthlyGroups[month].transportCost, monthlyGroups[month].netWeight)),
      storageCost: months.map((month) => monthlyGroups[month].storage),
      handlingCost: months.map((month) => monthlyGroups[month].handling),
      totalLogisticsCostPerKg: months.map((month) => safeDivide(monthlyGroups[month].totalLogisticsCost, monthlyGroups[month].grossWeight)),
    } satisfies Record<MetricKey, number[]>;

    return values;
  }, [months, monthlyGroups]);

  const totals = useMemo(() => {
    return invoices.reduce(
      (acc, invoice) => ({
        storage: acc.storage + invoice.operational.storage,
        handling: acc.handling + invoice.operational.handling,
        transport: acc.transport + invoice.transportCost,
        logisticsCost: acc.logisticsCost + invoice.totalLogisticsCost,
        grossWeight: acc.grossWeight + invoice.grossWeight,
        netWeight: acc.netWeight + invoice.netWeight,
      }),
      {
        storage: 0,
        handling: 0,
        transport: 0,
        logisticsCost: 0,
        grossWeight: 0,
        netWeight: 0,
      },
    );
  }, [invoices]);

  const handleGrossDrilldown = useCallback(() => openDrilldown('gross-freight-per-kg'), [openDrilldown]);
  const handleNetDrilldown = useCallback(() => openDrilldown('net-freight-per-kg'), [openDrilldown]);
  const handleStorageDrilldown = useCallback(() => openDrilldown('storage-cost'), [openDrilldown]);
  const handleHandlingDrilldown = useCallback(() => openDrilldown('handling-cost'), [openDrilldown]);
  const handleTotalDrilldown = useCallback(() => openDrilldown('total-logistics-cost-per-kg'), [openDrilldown]);

  const cards = useMemo(
    () => [
      {
        title: 'FRETE / KG BRUTO',
        helper: 'Base do transporte por peso bruto',
        icon: Scale,
        value: formatCurrency(safeDivide(totals.transport, totals.grossWeight)),
        totalLabel: `Total: ${formatCurrency(totals.transport)}`,
        trendLabel: buildTrendLabel(metrics.grossFreightPerKg),
        sparklineValues: metrics.grossFreightPerKg,
        onClick: handleGrossDrilldown,
        tooltip: 'Frete / kg bruto calculado pela fórmula oficial do período filtrado.',
      },
      {
        title: 'FRETE / KG LÍQUIDO',
        helper: 'Base do transporte por peso líquido',
        icon: Truck,
        value: formatCurrency(safeDivide(totals.transport, totals.netWeight)),
        totalLabel: `Total: ${formatCurrency(totals.transport)}`,
        trendLabel: buildTrendLabel(metrics.netFreightPerKg),
        sparklineValues: metrics.netFreightPerKg,
        onClick: handleNetDrilldown,
        tooltip: 'Frete / kg líquido calculado pela fórmula oficial do período filtrado.',
      },
      {
        title: 'C. ARMAZENAGEM',
        helper: 'Custo operacional de armazenagem',
        icon: Warehouse,
        value: formatCurrency(totals.storage),
        totalLabel: `Total: ${formatCurrency(totals.storage)}`,
        trendLabel: buildTrendLabel(metrics.storageCost),
        sparklineValues: metrics.storageCost,
        onClick: handleStorageDrilldown,
        tooltip: 'Custo de armazenagem real da base filtrada.',
      },
      {
        title: 'C. MOVIMENTAÇÃO',
        helper: 'Custo operacional de movimentação',
        icon: Package,
        value: formatCurrency(totals.handling),
        totalLabel: `Total: ${formatCurrency(totals.handling)}`,
        trendLabel: buildTrendLabel(metrics.handlingCost),
        sparklineValues: metrics.handlingCost,
        onClick: handleHandlingDrilldown,
        tooltip: 'Custo de movimentação real da base filtrada.',
      },
      {
        title: 'CUSTO LOGÍSTICO TOTAL / KG',
        helper: 'Custo total dividido por peso bruto',
        icon: CircleDollarSign,
        value: formatCurrency(safeDivide(totals.logisticsCost, totals.grossWeight)),
        totalLabel: `Total: ${formatCurrency(totals.logisticsCost)}`,
        trendLabel: buildTrendLabel(metrics.totalLogisticsCostPerKg),
        sparklineValues: metrics.totalLogisticsCostPerKg,
        onClick: handleTotalDrilldown,
        tooltip: 'Custo logístico total por kg calculado com divisão segura.',
      },
    ],
    [
      handleGrossDrilldown,
      handleHandlingDrilldown,
      handleNetDrilldown,
      handleStorageDrilldown,
      handleTotalDrilldown,
      metrics.grossFreightPerKg,
      metrics.handlingCost,
      metrics.netFreightPerKg,
      metrics.storageCost,
      metrics.totalLogisticsCostPerKg,
      totals.grossWeight,
      totals.handling,
      totals.logisticsCost,
      totals.netWeight,
      totals.storage,
      totals.transport,
    ],
  );

  return (
    <section className="glass-panel flex h-full flex-col rounded-3xl border border-amber-400/20 bg-[linear-gradient(145deg,rgba(28,22,12,.92),rgba(12,14,18,.86))] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-amber-200">
            NOVO
          </div>
          <h2 className="mt-3 font-display text-lg font-semibold text-white">Indicadores Operacionais de Custo Logístico</h2>
          <p className="mt-1 text-sm text-slate-400">Métricas operacionais médias do período</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-5">
        {cards.map((card) => (
          <KpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            helper={card.helper}
            accent="bg-white/10"
            icon={card.icon}
            onClick={card.onClick}
            tooltip={card.tooltip}
            trendLabel={card.trendLabel}
            sparklineValues={card.sparklineValues}
            totalLabel={card.totalLabel}
          />
        ))}
      </div>

      <p className="mt-auto pt-4 text-xs text-slate-500">Clique em qualquer card para ver o detalhamento completo</p>
    </section>
  );
}

function buildMonthlyGroups(invoices: EnrichedInvoice[]): Record<string, MonthlyGroup> {
  return invoices.reduce<Record<string, MonthlyGroup>>((acc, invoice) => {
    const month = invoice.date.slice(0, 7);
    acc[month] ??= {
      revenue: 0,
      transportCost: 0,
      operationalCost: 0,
      totalLogisticsCost: 0,
      grossWeight: 0,
      netWeight: 0,
      storage: 0,
      handling: 0,
    };

    acc[month].revenue += invoice.revenue;
    acc[month].transportCost += invoice.transportCost;
    acc[month].operationalCost += invoice.operationalCost;
    acc[month].totalLogisticsCost += invoice.totalLogisticsCost;
    acc[month].grossWeight += invoice.grossWeight;
    acc[month].netWeight += invoice.netWeight;
    acc[month].storage += invoice.operational.storage;
    acc[month].handling += invoice.operational.handling;
    return acc;
  }, {});
}

function buildTrendLabel(values: number[]): string | undefined {
  if (values.length < 2) {
    return undefined;
  }

  const previous = values[values.length - 2];
  const current = values[values.length - 1];
  if (previous === 0) {
    return undefined;
  }

  const delta = (current - previous) / previous;
  const direction = delta >= 0 ? '↑' : '↓';
  return `${direction} ${formatPercent(Math.abs(delta))}`;
}

export const OperationalIndicatorsSection = memo(OperationalIndicatorsSectionComponent);
