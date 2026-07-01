import { startTransition, useCallback, useMemo } from 'react';
import { Boxes, ChartNoAxesCombined, CircleDollarSign, Route, Wallet, Weight } from 'lucide-react';
import { ChartCard } from '@/components/ChartCard';
import { EChart } from '@/components/EChart';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/Skeleton';
import { useDashboardData } from '@/context/useDashboardData';
import { BrazilLogisticMap } from '@/features/executive/components/BrazilLogisticMap';
import { OperationalIndicatorsSection } from '@/features/executive/components/OperationalIndicatorsSection';
import { TopCustomersRankingCard } from '@/features/executive/components/TopCustomersRankingCard';
import { buildBrazilMapData, selectBrazilMapMetrics } from '@/features/executive/utils/brazilMapData';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { monthlyLogisticsTrend, topCustomersByLogisticsIndex } from '@/utils/aggregations';
import { formatCurrency, formatDecimal, formatPercent } from '@/utils/formatters';
import { logisticsCostIndexByCompetenceOption } from '@/features/executive/charts/executiveChartOptions';

export default function ExecutivePage() {
  const { indicators, filteredInvoices: invoices } = useDashboardData();
  const allInvoices = useGlobalFilterStore((state) => state.invoices);
  const filters = useGlobalFilterStore((state) => state.filters);
  const excludedClients = useGlobalFilterStore((state) => state.excludedClients);
  const toggleArrayFilter = useGlobalFilterStore((state) => state.toggleArrayFilter);
  const clearFilter = useGlobalFilterStore((state) => state.clearFilter);
  const openDrilldown = useGlobalFilterStore((state) => state.openDrilldown);
  const activeUfs = filters.ufs;

  const logisticsTrendData = useMemo(() => monthlyLogisticsTrend(invoices), [invoices]);
  const expensiveCustomers = useMemo(() => topCustomersByLogisticsIndex(invoices), [invoices]);
  const logisticsTrendOption = useMemo(
    () => logisticsCostIndexByCompetenceOption(logisticsTrendData),
    [logisticsTrendData],
  );
  const mapFilters = useMemo(
    () => ({
      period: filters.period,
      competences: filters.competences ?? [],
      companyIds: filters.companyIds,
      ufs: [],
      cities: filters.cities,
      customers: filters.customers,
      operationTypes: filters.operationTypes,
      managementCategories: filters.managementCategories,
      sellers: filters.sellers,
    }),
    [
      filters.cities,
      filters.companyIds,
      filters.competences,
      filters.customers,
      filters.managementCategories,
      filters.operationTypes,
      filters.period,
      filters.sellers,
    ],
  );
  const mapDataByUF = useMemo(
    () => buildBrazilMapData(allInvoices, mapFilters, excludedClients),
    [allInvoices, excludedClients, mapFilters],
  );
  const selectedUfData = useMemo(() => selectBrazilMapMetrics(mapDataByUF, activeUfs), [activeUfs, mapDataByUF]);

  const handleTransportDrilldown = useCallback(() => openDrilldown('transport-cost'), [openDrilldown]);
  const handleSelectUf = useCallback(
    (uf: string) => {
      if (!uf) return;
      startTransition(() => {
        toggleArrayFilter('ufs', uf);
      });
    },
    [toggleArrayFilter],
  );
  const handleClearUf = useCallback(() => {
    if (activeUfs.length === 0) return;
    startTransition(() => {
      clearFilter('ufs');
    });
  }, [activeUfs.length, clearFilter]);

  if (invoices.length === 0) {
    return <EmptyState title="Sem notas no filtro atual" description="Ajuste os filtros globais para recompor a leitura logística." />;
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <KpiCard title="Faturamento" value={formatCurrency(indicators.revenue)} helper="Base operacional filtrada" accent="bg-signal-blue/25" icon={Wallet} />
        <KpiCard title="Custo Transporte Total" value={formatCurrency(indicators.transportCost)} helper="Clique para composição" accent="bg-signal-coral/25" icon={Route} onClick={handleTransportDrilldown} />
        <KpiCard title="Custo Operacional" value={formatCurrency(indicators.operationalCost)} helper="Armazenagem + movimentação + transferência" accent="bg-signal-amber/25" icon={Boxes} />
        <KpiCard title="Custo Logístico Total" value={formatCurrency(indicators.totalLogisticsCost)} helper="Transporte + operacional" accent="bg-white/10" icon={CircleDollarSign} />
        <KpiCard
          title="Peso Bruto Operacional"
          value={`${formatDecimal(indicators.operationalGrossWeight)} kg`}
          helper="VENDA + BONIFICAÇÃO"
          accent="bg-signal-mint/20"
          icon={Weight}
          tooltip="Peso bruto considerado nos indicadores logísticos. Exclui TRANSFERENCIA para evitar distorção, pois o custo de transferência já é rateado em C. Transferência."
        />
        <KpiCard title="Índice Logístico %" value={formatPercent(indicators.logisticsIndex)} helper="Custo logístico / receita" accent="bg-signal-blue/20" icon={ChartNoAxesCombined} />
      </section>

      <section className="grid grid-cols-2 items-stretch gap-5">
        <ChartCard
          title="Custo Logístico e Índice por Competência"
          description="Evolução mensal do custo logístico e sua participação sobre a receita"
        >
          <EChart option={logisticsTrendOption} />
        </ChartCard>
        <ChartCard title="Mapa Interativo Brasil" description="Intensidade de custo regional por UF">
          <BrazilLogisticMap
            data={mapDataByUF}
            activeUfs={activeUfs}
            selectedMetrics={selectedUfData}
            onSelectUf={handleSelectUf}
            onClearUf={handleClearUf}
          />
        </ChartCard>
        <TopCustomersRankingCard data={expensiveCustomers} />
        <OperationalIndicatorsSection invoices={invoices} />
      </section>
    </div>
  );
}
