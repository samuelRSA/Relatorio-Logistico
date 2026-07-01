import type { EnrichedInvoice, FilterState } from '@/types/logistics';

export const defaultFilters: FilterState = {
  period: {
    start: '2026-01-01',
    end: '2026-12-31',
  },
  competences: [],
  companyIds: [],
  ufs: [],
  cities: [],
  customers: [],
  operationTypes: [],
  managementCategories: [],
  sellers: [],
};

const hasSelection = <T>(values: T[]): boolean => values.length > 0;

export const applyFilters = (invoices: EnrichedInvoice[], filters: FilterState): EnrichedInvoice[] =>
  invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.date);
    const start = new Date(filters.period.start);
    const end = new Date(filters.period.end);
    const competences = filters.competences ?? [];

    return (
      invoiceDate >= start &&
      invoiceDate <= end &&
      (!hasSelection(competences) || competences.includes(invoice.competence)) &&
      (!hasSelection(filters.companyIds) || filters.companyIds.includes(invoice.companyId)) &&
      (!hasSelection(filters.ufs) || filters.ufs.includes(invoice.uf)) &&
      (!hasSelection(filters.cities) || filters.cities.includes(invoice.city)) &&
      (!hasSelection(filters.customers) || filters.customers.includes(invoice.customer)) &&
      (!hasSelection(filters.operationTypes) || filters.operationTypes.includes(invoice.operationType)) &&
      (!hasSelection(filters.managementCategories) ||
        filters.managementCategories.includes(invoice.managementCategory)) &&
      (!hasSelection(filters.sellers) || filters.sellers.includes(invoice.seller))
    );
  });

export const filterCacheKey = (filters: FilterState): string => JSON.stringify(filters);
