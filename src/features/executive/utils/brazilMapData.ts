import type { EnrichedInvoice, FilterState } from '@/types/logistics';
import type { BrazilMapDatum, BrazilUfMapMetric } from '@/features/executive/types/map';
import { aggregateIndicators } from '@/utils/aggregations';
import { applyFilters } from '@/utils/filtering';

const BRAZIL_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

const emptyMetric = (uf: string): BrazilUfMapMetric => ({
  uf,
  revenue: 0,
  transportCost: 0,
  operationalCost: 0,
  totalLogisticsCost: 0,
  logisticsIndex: 0,
  invoiceCount: 0,
});

export const buildBrazilMapData = (
  invoices: EnrichedInvoice[],
  filters: FilterState,
  excludedClients: string[] = [],
): BrazilMapDatum[] => {
  const mapFilters = { ...filters, ufs: [] };
  const normallyFilteredInvoices = applyFilters(invoices, mapFilters);
  const invoicesIgnoringUf =
    excludedClients.length === 0
      ? normallyFilteredInvoices
      : normallyFilteredInvoices.filter((invoice) => !excludedClients.includes(invoice.customer));
  const grouped = invoicesIgnoringUf.reduce<Record<string, EnrichedInvoice[]>>((acc, invoice) => {
    acc[invoice.uf] ??= [];
    acc[invoice.uf].push(invoice);
    return acc;
  }, {});
  const counts = invoicesIgnoringUf.reduce<Record<string, number>>((acc, invoice) => {
    acc[invoice.uf] = (acc[invoice.uf] ?? 0) + 1;
    return acc;
  }, {});

  const groupedMetrics = Object.fromEntries(
    Object.entries(grouped).map(([uf, ufInvoices]) => [uf, aggregateIndicators(ufInvoices)]),
  ) as Record<string, ReturnType<typeof aggregateIndicators>>;

  return BRAZIL_STATES.map((uf) => {
    const indicators = groupedMetrics[uf];
    const base = emptyMetric(uf);

    if (!indicators) {
      return {
        ...base,
        name: uf,
        value: 0,
      };
    }

    return {
      ...base,
      name: uf,
      value: Number.isFinite(indicators.logisticsIndex) ? indicators.logisticsIndex : 0,
      revenue: indicators.revenue,
      transportCost: indicators.transportCost,
      operationalCost: indicators.operationalCost,
      totalLogisticsCost: indicators.totalLogisticsCost,
      logisticsIndex: indicators.logisticsIndex,
      invoiceCount: counts[uf] ?? 0,
    };
  });
};

export const selectBrazilMapMetrics = (data: BrazilMapDatum[], activeUfs: string[]): BrazilMapDatum[] => {
  if (activeUfs.length === 0) {
    return [];
  }

  const lookup = new Map(data.map((item) => [item.uf, item]));
  return activeUfs.map((uf) => lookup.get(uf)).filter((item): item is BrazilMapDatum => Boolean(item));
};
