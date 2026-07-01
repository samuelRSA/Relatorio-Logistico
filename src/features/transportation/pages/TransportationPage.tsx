import { useCallback, useMemo } from 'react';
import { Gauge, Percent, Route, Scale } from 'lucide-react';
import { ChartCard } from '@/components/ChartCard';
import { EChart } from '@/components/EChart';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/Skeleton';
import { useDashboardData } from '@/context/useDashboardData';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { topCityFreightByInvoiceCosts, ufFreightByInvoiceCosts, ufTransportCosts } from '@/utils/aggregations';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { isTransportChargeableInvoice } from '@/utils/logisticsRules';
import {
  topCityTransportOption,
  ufFreightConsolidatedOption,
  ufMonthlyFreightTrendOption,
  ufTransportTotalOption,
} from '@/features/transportation/charts/transportationChartOptions';

const safeDivide = (value: number, divisor: number): number => (divisor === 0 ? 0 : value / divisor);

export default function TransportationPage() {
  const { filteredInvoices: invoices, indicators } = useDashboardData();
  const selectedUfs = useGlobalFilterStore((state) => state.filters.ufs);
  const toggleArrayFilter = useGlobalFilterStore((state) => state.toggleArrayFilter);

  const transportInvoices = useMemo(() => invoices.filter(isTransportChargeableInvoice), [invoices]);
  const selectedTransportInvoices = useMemo(
    () =>
      selectedUfs.length > 0 ? transportInvoices.filter((invoice) => selectedUfs.includes(invoice.uf)) : transportInvoices,
    [selectedUfs, transportInvoices],
  );
  const topCityData = useMemo(() => topCityFreightByInvoiceCosts(selectedTransportInvoices), [selectedTransportInvoices]);
  const ufAverageData = useMemo(() => ufFreightByInvoiceCosts(transportInvoices), [transportInvoices]);
  const ufData = useMemo(() => ufTransportCosts(transportInvoices), [transportInvoices]);
  const ufMonthlyFreightTrendData = useMemo(() => {
    const grouped = selectedTransportInvoices.reduce<
      Record<string, { competence: string; uf: string; transportCost: number; grossWeight: number; invoiceCount: number }>
    >((acc, invoice) => {
      const competence = invoice.competence || invoice.date.slice(0, 7);
      const key = `${competence}|${invoice.uf}`;

      acc[key] ??= { competence, uf: invoice.uf, transportCost: 0, grossWeight: 0, invoiceCount: 0 };
      acc[key].transportCost += invoice.transportCost;
      acc[key].grossWeight += invoice.grossWeight;
      acc[key].invoiceCount += 1;

      return acc;
    }, {});

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        freightPerKg: safeDivide(item.transportCost, item.grossWeight),
      }))
      .sort((a, b) => a.competence.localeCompare(b.competence) || a.uf.localeCompare(b.uf, 'pt-BR'));
  }, [selectedTransportInvoices]);
  const monthlyFreightTrendCompetenceCount = useMemo(
    () => new Set(ufMonthlyFreightTrendData.map((item) => item.competence)).size,
    [ufMonthlyFreightTrendData],
  );

  const topCityOption = useMemo(() => topCityTransportOption(topCityData), [topCityData]);
  const ufFreightConsolidatedOptionValue = useMemo(
    () => ufFreightConsolidatedOption(ufAverageData, selectedUfs),
    [selectedUfs, ufAverageData],
  );
  const ufMonthlyFreightTrendOptionValue = useMemo(
    () => ufMonthlyFreightTrendOption(ufMonthlyFreightTrendData, selectedUfs),
    [selectedUfs, ufMonthlyFreightTrendData],
  );
  const ufTransportTotalOptionValue = useMemo(
    () => ufTransportTotalOption(ufData, selectedUfs),
    [selectedUfs, ufData],
  );

  const topCityTitle =
    selectedUfs.length === 0
      ? 'Top 10 Cidades com Maior Frete/Kg Consolidado'
      : selectedUfs.length === 1
        ? `Top 10 Cidades da UF ${selectedUfs[0]} com Maior Frete/Kg Consolidado`
        : 'Top 10 Cidades das UFs selecionadas com Maior Frete/Kg Consolidado';

  const topCityDescription =
    selectedUfs.length === 0
      ? 'Custo transporte total dividido pelo peso bruto total da cidade'
      : selectedUfs.length === 1
        ? `Custo transporte total dividido pelo peso bruto total das cidades da UF ${selectedUfs[0]}`
        : 'Custo transporte total dividido pelo peso bruto total das cidades das UFs selecionadas';

  const handleSelectUf = useCallback(
    (params: unknown) => {
      const event = params as { data?: { uf?: string }; name?: string };
      const uf = event.data?.uf ?? event.name;
      if (!uf) return;
      toggleArrayFilter('ufs', uf);
    },
    [toggleArrayFilter],
  );

  if (transportInvoices.length === 0) {
    return <EmptyState title="Sem transporte no filtro atual" description="Ajuste os filtros para visualizar o custo de frete terceirizado." />;
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-4 gap-4">
        <KpiCard title="Custo Transporte" value={formatCurrency(indicators.transportCost)} helper="CTE1 + CTE2 + despesas" accent="bg-signal-coral/25" icon={Route} />
        <KpiCard title="Frete Médio" value={formatCurrency(safeDivide(indicators.transportCost, transportInvoices.length))} helper="Custo médio por NF" accent="bg-signal-blue/20" icon={Gauge} />
        <KpiCard title="Frete/Kg Bruto" value={formatCurrency(indicators.grossFreightPerKg)} helper="Base peso bruto" accent="bg-signal-amber/20" icon={Scale} />
        <KpiCard title="% Despesas Acessórias" value={formatPercent(indicators.accessoryExpenseShare)} helper="Sobre custo transporte" accent="bg-white/10" icon={Percent} />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title={topCityTitle} description={topCityDescription}>
          <EChart option={topCityOption} />
        </ChartCard>
        <ChartCard title="Frete/Kg Consolidado por UF" description="Custo transporte total dividido pelo peso bruto total da UF">
          <EChart option={ufFreightConsolidatedOptionValue} onEvents={{ click: handleSelectUf }} />
        </ChartCard>
        <ChartCard
          title="Evolução do Frete/Kg por UF no Período"
          description="Evolução mensal do frete/kg consolidado por estado"
        >
          {monthlyFreightTrendCompetenceCount < 2 ? (
            <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center text-sm text-slate-400">
              Selecione pelo menos 2 competências para visualizar a evolução.
            </div>
          ) : (
            <EChart option={ufMonthlyFreightTrendOptionValue} height={360} />
          )}
        </ChartCard>
        <ChartCard title="Custo Transporte Total por UF" description="Concentração do custo de transporte por estado">
          <EChart option={ufTransportTotalOptionValue} onEvents={{ click: handleSelectUf }} height={360} />
        </ChartCard>
      </section>
    </div>
  );
}
