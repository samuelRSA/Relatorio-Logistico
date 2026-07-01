import type { Company, EnrichedInvoice, FilterOptions } from '@/types/logistics';

const companyCatalog: Company[] = [
  { id: 1, name: 'Matriz Telemassas' },
  { id: 2, name: 'Filial Telemassas' },
  { id: 4, name: 'Yup Revenda' },
];

const uniqueSorted = <T extends string | number>(values: T[]): T[] =>
  Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

const normalizeText = (value: string | number): string =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();

const companyByNormalizedValue = new Map<string, Company>(
  companyCatalog.flatMap((company) => [
    [normalizeText(company.id), company],
    [normalizeText(company.name), company],
  ]),
);

export const normalizeCompany = (value: string | number): Company | null =>
  companyByNormalizedValue.get(normalizeText(value)) ?? null;

const mapCompanyOptions = (invoices: EnrichedInvoice[]): Company[] => {
  const companiesById = new Map<number, Company>();

  invoices.forEach((invoice) => {
    const company = normalizeCompany(invoice.companyId) ?? normalizeCompany(invoice.company);
    if (company) {
      companiesById.set(company.id, company);
    }
  });

  return companyCatalog.filter((company) => companiesById.has(company.id));
};

export const mapFilterOptions = (invoices: EnrichedInvoice[]): FilterOptions => ({
  companies: mapCompanyOptions(invoices),
  competences: uniqueSorted(invoices.map((invoice) => invoice.competence)),
  ufs: uniqueSorted(invoices.map((invoice) => invoice.uf)),
  cities: uniqueSorted(invoices.map((invoice) => invoice.city)),
  customers: uniqueSorted(invoices.map((invoice) => invoice.customer)),
  operationTypes: uniqueSorted(invoices.map((invoice) => invoice.operationType)),
  managementCategories: uniqueSorted(invoices.map((invoice) => invoice.managementCategory)),
  sellers: uniqueSorted(invoices.map((invoice) => invoice.seller)),
});
