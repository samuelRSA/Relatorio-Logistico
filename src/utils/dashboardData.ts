import type { EnrichedInvoice, FilterState, LogisticsIndicators } from '@/types/logistics';
import { aggregateIndicators } from '@/utils/aggregations';
import { applyFilters } from '@/utils/filtering';

export interface DashboardData {
  filteredInvoices: EnrichedInvoice[];
  indicators: LogisticsIndicators;
}

export const buildDashboardData = (
  invoices: EnrichedInvoice[],
  filters: FilterState,
  excludedClients: string[] = [],
): DashboardData => {
  const normallyFilteredInvoices = applyFilters(invoices, filters);
  const filteredInvoices =
    excludedClients.length === 0
      ? normallyFilteredInvoices
      : normallyFilteredInvoices.filter((invoice) => !excludedClients.includes(invoice.customer));
  const indicators = aggregateIndicators(filteredInvoices);

  return {
    filteredInvoices,
    indicators,
  };
};
