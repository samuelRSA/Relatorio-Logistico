import { useState } from 'react';
import type { ReactNode } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { CompanyId } from '@/types/logistics';

export function GlobalFilters() {
  const filters = useGlobalFilterStore((state) => state.filters);
  const options = useGlobalFilterStore((state) => state.filterOptions);
  const setFilter = useGlobalFilterStore((state) => state.setFilter);
  const toggleArrayFilter = useGlobalFilterStore((state) => state.toggleArrayFilter);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const visibleCustomers = options.customers.filter((customer) =>
    customer.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  return (
    <div className="mt-4 flex-1 overflow-y-auto pr-1">
      <div className="space-y-4 pb-6">
        <FilterBlock title="Período">
          <div className="grid grid-cols-2 gap-2">
            <DateInput
              label="Início"
              value={filters.period.start}
              onChange={(value) => setFilter('period', { ...filters.period, start: value })}
            />
            <DateInput
              label="Fim"
              value={filters.period.end}
              onChange={(value) => setFilter('period', { ...filters.period, end: value })}
            />
          </div>
        </FilterBlock>

        <FilterBlock title="Empresa">
          {options.companies.map((company) => (
            <CheckPill
              key={company.id}
              label={company.name}
              active={filters.companyIds.includes(company.id)}
              onClick={() => toggleArrayFilter('companyIds', company.id as CompanyId)}
            />
          ))}
        </FilterBlock>

        <FilterBlock title="UF">
          <div className="grid grid-cols-4 gap-2">
            {options.ufs.map((uf) => (
              <CheckPill
                key={uf}
                label={uf}
                active={filters.ufs.includes(uf)}
                onClick={() => toggleArrayFilter('ufs', uf)}
              />
            ))}
          </div>
        </FilterBlock>

        <FilterBlock title="Cidade">
          <OptionList
            values={options.cities}
            selected={filters.cities}
            onToggle={(value) => toggleArrayFilter('cities', value)}
          />
        </FilterBlock>

        <FilterBlock title="Cliente">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente"
            className="mb-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-signal-blue/60"
          />
          <OptionList
            values={visibleCustomers}
            selected={filters.customers}
            onToggle={(value) => toggleArrayFilter('customers', value)}
          />
        </FilterBlock>

        <FilterBlock title="Tipo Operação">
          <OptionList
            values={options.operationTypes}
            selected={filters.operationTypes}
            onToggle={(value) => toggleArrayFilter('operationTypes', value)}
          />
        </FilterBlock>

        <FilterBlock title="Categoria Gerencial">
          <OptionList
            values={options.managementCategories}
            selected={filters.managementCategories}
            onToggle={(value) => toggleArrayFilter('managementCategories', value)}
          />
        </FilterBlock>

        <FilterBlock title="Vendedor">
          <OptionList
            values={options.sellers}
            selected={filters.sellers}
            onToggle={(value) => toggleArrayFilter('sellers', value)}
          />
        </FilterBlock>
      </div>
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DateInput({
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
}

function OptionList<T extends string>({
  values,
  selected,
  onToggle,
}: {
  values: T[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
      {values.map((value) => (
        <CheckPill
          key={value}
          label={value}
          active={selected.includes(value)}
          onClick={() => onToggle(value)}
        />
      ))}
    </div>
  );
}

function CheckPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
}
