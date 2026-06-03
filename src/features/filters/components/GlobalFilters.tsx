import { memo, startTransition, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { CompanyId } from '@/types/logistics';
import { applyFilters } from '@/utils/filtering';

const uniqueSorted = (values: string[]): string[] => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'pt-BR'));

export function GlobalFilters() {
  const invoices = useGlobalFilterStore((state) => state.invoices);
  const filters = useGlobalFilterStore((state) => state.filters);
  const options = useGlobalFilterStore((state) => state.filterOptions);
  const setFilter = useGlobalFilterStore((state) => state.setFilter);
  const toggleArrayFilter = useGlobalFilterStore((state) => state.toggleArrayFilter);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const availableCities = useMemo(() => {
    const cityBaseFilters = { ...filters, cities: [] };
    return uniqueSorted(applyFilters(invoices, cityBaseFilters).map((invoice) => invoice.city));
  }, [filters, invoices]);

  const visibleCities = useMemo(
    () => uniqueSorted([...availableCities, ...filters.cities]),
    [availableCities, filters.cities],
  );

  const availableCustomers = useMemo(() => {
    const customerBaseFilters = { ...filters, customers: [] };
    return uniqueSorted(applyFilters(invoices, customerBaseFilters).map((invoice) => invoice.customer));
  }, [filters, invoices]);

  const visibleCustomers = useMemo(
    () =>
      uniqueSorted([...availableCustomers, ...filters.customers]).filter((customer) =>
        customer.toLowerCase().includes(debouncedSearch.toLowerCase()),
      ),
    [availableCustomers, debouncedSearch, filters.customers],
  );

  const handlePeriodStartChange = useCallback(
    (value: string) => setFilter('period', { ...filters.period, start: value }),
    [filters.period, setFilter],
  );
  const handlePeriodEndChange = useCallback(
    (value: string) => setFilter('period', { ...filters.period, end: value }),
    [filters.period, setFilter],
  );
  const handleToggleCompany = useCallback((value: CompanyId) => toggleArrayFilter('companyIds', value), [toggleArrayFilter]);
  const handleToggleCity = useCallback((value: string) => toggleArrayFilter('cities', value), [toggleArrayFilter]);
  const handleToggleCustomer = useCallback((value: string) => toggleArrayFilter('customers', value), [toggleArrayFilter]);
  const handleToggleOperationType = useCallback(
    (value: string) => toggleArrayFilter('operationTypes', value as never),
    [toggleArrayFilter],
  );
  const handleToggleManagementCategory = useCallback(
    (value: string) => toggleArrayFilter('managementCategories', value as never),
    [toggleArrayFilter],
  );
  const handleToggleSeller = useCallback((value: string) => toggleArrayFilter('sellers', value), [toggleArrayFilter]);
  const handleToggleUf = useCallback(
    (uf: string) => {
      if (!uf) return;
      startTransition(() => {
        toggleArrayFilter('ufs', uf);
      });
    },
    [toggleArrayFilter],
  );

  return (
    <div className="mt-4 flex-1 overflow-y-auto pr-1">
      <div className="space-y-4 pb-6">
        <FilterBlock title="Período">
          <div className="grid grid-cols-2 gap-2">
            <DateInput label="Início" value={filters.period.start} onChange={handlePeriodStartChange} />
            <DateInput label="Fim" value={filters.period.end} onChange={handlePeriodEndChange} />
          </div>
        </FilterBlock>

        <FilterBlock title="Empresa">
          {options.companies.map((company) => (
            <CheckPill
              key={company.id}
              label={company.name}
              active={filters.companyIds.includes(company.id)}
              onClick={() => handleToggleCompany(company.id as CompanyId)}
            />
          ))}
        </FilterBlock>

        <FilterBlock title="UF">
          <div className="grid grid-cols-4 gap-2">
            {options.ufs.map((uf) => (
              <CheckPill key={uf} label={uf} active={filters.ufs.includes(uf)} onClick={() => handleToggleUf(uf)} />
            ))}
          </div>
        </FilterBlock>

        <FilterBlock title="Cidade">
          <OptionList values={visibleCities} selected={filters.cities} onToggle={handleToggleCity} />
        </FilterBlock>

        <FilterBlock title="Cliente">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente"
            className="mb-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-signal-blue/60"
          />
          <OptionList values={visibleCustomers} selected={filters.customers} onToggle={handleToggleCustomer} />
        </FilterBlock>

        <FilterBlock title="Tipo Operação">
          <OptionList values={options.operationTypes} selected={filters.operationTypes} onToggle={handleToggleOperationType} />
        </FilterBlock>

        <FilterBlock title="Categoria Gerencial">
          <OptionList
            values={options.managementCategories}
            selected={filters.managementCategories}
            onToggle={handleToggleManagementCategory}
          />
        </FilterBlock>

        <FilterBlock title="Vendedor">
          <OptionList values={options.sellers} selected={filters.sellers} onToggle={handleToggleSeller} />
        </FilterBlock>
      </div>
    </div>
  );
}

const FilterBlock = memo(function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
});

const DateInput = memo(function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-2 text-xs text-white outline-none focus:border-signal-blue/60"
      />
    </label>
  );
});

const OptionList = memo(function OptionList({
  values,
  selected,
  onToggle,
}: {
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
      {values.map((value) => (
        <CheckPill key={value} label={value} active={selected.includes(value)} onClick={() => onToggle(value)} />
      ))}
    </div>
  );
});

const CheckPill = memo(function CheckPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl px-3 py-2 text-left text-xs transition ${
        active
          ? 'bg-signal-blue/20 text-white ring-1 ring-signal-blue/40'
          : 'bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white'
      }`}
    >
      {label}
    </button>
  );
});
