import type { Company, EnrichedInvoice, FilterOptions } from '@/types/logistics';

export const companies: Company[] = [
  { id: 1, name: 'Matriz Telemassas' },
  { id: 2, name: 'Filial Telemassas' },
  { id: 3, name: 'Yup Revenda' },
];

const uniqueSorted = <T extends string | number>(values: T[]): T[] =>
  Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

export const mapFilterOptions = (invoices: EnrichedInvoice[]): FilterOptions => ({
  companies,
  ufs: uniqueSorted(invoices.map((invoice) => invoice.uf)),
  cities: uniqueSorted(invoices.map((invoice) => invoice.city)),
  customers: uniqueSorted(invoices.map((invoice) => invoice.customer)),
  operationTypes: uniqueSorted(invoices.map((invoice) => invoice.operationType)),
  managementCategories: uniqueSorted(invoices.map((invoice) => invoice.managementCategory)),
  sellers: uniqueSorted(invoices.map((invoice) => invoice.seller)),
});
