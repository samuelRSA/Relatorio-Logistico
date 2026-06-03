import type { EnrichedInvoice, FilterState, LogisticsIndicators } from '@/types/logistics';
import { aggregateIndicators } from '@/utils/aggregations';
import { applyFilters } from '@/utils/filtering';

export interface DashboardData {
  filteredInvoices: EnrichedInvoice[];
  indicators: LogisticsIndicators;
}

export const buildDashboardData = (invoices: EnrichedInvoice[], filters: FilterState): DashboardData => {
  const filteredInvoices = applyFilters(invoices, filters);
  const indicators = aggregateIndicators(filteredInvoices);

  return {
    filteredInvoices,
    indicators,
  };
};
