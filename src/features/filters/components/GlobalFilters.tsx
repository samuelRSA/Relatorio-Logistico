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
  const excludedClients = useGlobalFilterStore((state) => state.excludedClients);
  const setFilter = useGlobalFilterStore((state) => state.setFilter);
  const toggleArrayFilter = useGlobalFilterStore((state) => state.toggleArrayFilter);
  const toggleExcludedClient = useGlobalFilterStore((state) => state.toggleExcludedClient);
  const clearExcludedClients = useGlobalFilterStore((state) => state.clearExcludedClients);
  const [search, setSearch] = useState('');
  const [exclusionSearch, setExclusionSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const debouncedExclusionSearch = useDebouncedValue(exclusionSearch);
  const selectedCompetences = filters.competences ?? [];

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

  const visibleExcludedCustomerOptions = useMemo(
    () =>
      options.customers
        .filter((customer) => !excludedClients.includes(customer))
        .filter((customer) => customer.toLowerCase().includes(debouncedExclusionSearch.toLowerCase())),
    [debouncedExclusionSearch, excludedClients, options.customers],
  );

  const handleClearCompetences = useCallback(() => setFilter('competences', []), [setFilter]);
  const handleToggleCompetence = useCallback(
    (value: string) => toggleArrayFilter('competences', value),
    [toggleArrayFilter],
  );
  const handleToggleCompany = useCallback((value: CompanyId) => toggleArrayFilter('companyIds', value), [toggleArrayFilter]);
  const handleToggleCity = useCallback((value: string) => toggleArrayFilter('cities', value), [toggleArrayFilter]);
  const handleToggleCustomer = useCallback((value: string) => toggleArrayFilter('customers', value), [toggleArrayFilter]);
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
  const handleToggleExcludedClient = useCallback(
    (client: string) => {
      if (!client) return;
      startTransition(() => {
        toggleExcludedClient(client);
      });
    },
    [toggleExcludedClient],
  );

  return (
    <div className="mt-4 flex-1 overflow-y-auto pr-1">
      <div className="space-y-4 pb-6">
        {excludedClients.length > 0 ? (
          <section className="rounded-2xl border border-signal-amber/20 bg-signal-amber/10 p-3">
            <div className="text-xs font-semibold text-signal-amber">
              ExclusÃµes ativas: {formatExclusionSummary(excludedClients)}
            </div>
            <button
              type="button"
              onClick={clearExcludedClients}
              className="mt-2 text-xs font-semibold text-slate-300 transition hover:text-white"
            >
              Limpar exclusÃµes
            </button>
          </section>
        ) : null}
        <FilterBlock title="Período">
          <div className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-slate-500">Competência</span>
            <div className="grid grid-cols-3 gap-2">
              <CheckPill label="Todos" active={selectedCompetences.length === 0} onClick={handleClearCompetences} />
              {options.competences.map((competence) => (
                <CheckPill
                  key={competence}
                  label={formatCompetenceLabel(competence)}
                  active={selectedCompetences.includes(competence)}
                  onClick={() => handleToggleCompetence(competence)}
                />
              ))}
            </div>
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

        <FilterBlock title="Vendedor">
          <OptionList values={options.sellers} selected={filters.sellers} onToggle={handleToggleSeller} />
        </FilterBlock>

        <FilterBlock title="ExclusÃµes">
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Excluir Cliente</h4>
            <input
              value={exclusionSearch}
              onChange={(event) => setExclusionSearch(event.target.value)}
              placeholder="Buscar cliente"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-signal-amber/60"
            />
            {excludedClients.length > 0 ? (
              <div className="space-y-2">
                {excludedClients.map((client) => (
                  <CheckPill
                    key={client}
                    label={`${client} x`}
                    active={true}
                    onClick={() => handleToggleExcludedClient(client)}
                  />
                ))}
              </div>
            ) : null}
            <OptionList
              values={visibleExcludedCustomerOptions}
              selected={excludedClients}
              onToggle={handleToggleExcludedClient}
            />
          </div>
        </FilterBlock>
      </div>
    </div>
  );
}

function formatExclusionSummary(excludedClients: string[]): string {
  if (excludedClients.length === 1) {
    return excludedClients[0];
  }

  return `${excludedClients[0]} + ${excludedClients.length - 1} clientes`;
}

function formatCompetenceLabel(competence: string): string {
  const [year, month] = competence.split('-').map(Number);
  if (!year || !month) {
    return competence;
  }

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '');

  return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}/${String(year).slice(-2)}`;
}

const FilterBlock = memo(function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
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
