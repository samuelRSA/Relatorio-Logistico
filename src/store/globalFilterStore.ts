import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import { logisticsService } from '@/services/logisticsService';
import { mapFilterOptions } from '@/services/mappers/filterMapper';
import type { EnrichedInvoice, FilterOptions, FilterState } from '@/types/logistics';
import { defaultFilters } from '@/utils/filtering';

type ArrayFilterKey = Exclude<keyof FilterState, 'period'>;
type ArrayFilterValue<K extends ArrayFilterKey> = FilterState[K][number];

interface GlobalFilterStore {
  invoices: EnrichedInvoice[];
  filterOptions: FilterOptions;
  filters: FilterState;
  excludedClients: string[];
  selectedInvoice: EnrichedInvoice | null;
  drilldownContext: string | null;
  isDrawerOpen: boolean;
  isLoading: boolean;
  loadData: () => Promise<void>;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleArrayFilter: <K extends ArrayFilterKey>(key: K, value: ArrayFilterValue<K>) => void;
  clearFilter: <K extends keyof FilterState>(key: K) => void;
  clearAllFilters: () => void;
  resetFilters: () => void;
  resetFiltersOnTabChange: () => void;
  setExcludedClients: (clients: string[]) => void;
  toggleExcludedClient: (client: string) => void;
  removeExcludedClient: (client: string) => void;
  clearExcludedClients: () => void;
  setSelectedInvoice: (invoice: EnrichedInvoice | null) => void;
  openDrilldown: (context: string) => void;
  closeDrawer: () => void;
}
const emptyOptions: FilterOptions = {
  companies: [],
  competences: [],
  ufs: [],
  cities: [],
  customers: [],
  operationTypes: [],
  managementCategories: [],
  sellers: [],
};

const areArraysEqual = <T,>(left: T[], right: T[]): boolean =>
  left.length === right.length && left.every((value, index) => Object.is(value, right[index]));

const normalizeArray = <T extends string | number>(values: T[]): T[] =>
  Array.from(new Set(values)).sort((left, right) => String(left).localeCompare(String(right), 'pt-BR'));

const normalizeFilterValue = <K extends keyof FilterState>(value: FilterState[K]): FilterState[K] =>
  Array.isArray(value) ? (normalizeArray(value as unknown as (string | number)[]) as FilterState[K]) : value;

const areFiltersEqual = (left: FilterState, right: FilterState): boolean =>
  left.period.start === right.period.start &&
  left.period.end === right.period.end &&
  areArraysEqual(left.competences ?? [], right.competences ?? []) &&
  areArraysEqual(left.companyIds, right.companyIds) &&
  areArraysEqual(left.ufs, right.ufs) &&
  areArraysEqual(left.cities, right.cities) &&
  areArraysEqual(left.customers, right.customers) &&
  areArraysEqual(left.operationTypes, right.operationTypes) &&
  areArraysEqual(left.managementCategories, right.managementCategories) &&
  areArraysEqual(left.sellers, right.sellers);


export const useGlobalFilterStore = create<GlobalFilterStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        invoices: [],
        filterOptions: emptyOptions,
        filters: defaultFilters,
        excludedClients: [],
        selectedInvoice: null,
        drilldownContext: null,
        isDrawerOpen: false,
        isLoading: true,
        async loadData() {
          set({ isLoading: true });
          const invoices = await logisticsService.getInvoices();
          const filterOptions = mapFilterOptions(invoices);
          const currentFilters = get().filters;
          const filters =
            currentFilters.operationTypes.length > 0
              ? {
                  ...currentFilters,
                  operationTypes: [],
                }
              : currentFilters;
          set({
            invoices,
            filterOptions,
            filters,
            isLoading: false,
          });
        },
        setFilter(key, value) {
          const current = get().filters;
          const normalizedValue = normalizeFilterValue(value);
          if (Object.is(current[key], normalizedValue)) {
            return;
          }

          const filters = { ...current, [key]: normalizedValue };
          if (areFiltersEqual(current, filters)) {
            return;
          }

          set({ filters });
        },
        toggleArrayFilter(key, value) {
          const current = get().filters[key] as ArrayFilterValue<typeof key>[];

          const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

          get().setFilter(key, normalizeArray(next) as FilterState[typeof key]);
        },
        clearFilter(key) {
          const current = get().filters;

          if (key === 'period') {
            if (current.period.start === defaultFilters.period.start && current.period.end === defaultFilters.period.end) {
              return;
            }

            set({
              filters: {
                ...current,
                period: defaultFilters.period,
              },
            });
            return;
          }

          if ((current[key] as string[]).length === 0) {
            return;
          }

          set({
            filters: {
              ...current,
              [key]: [],
            },
          });
        },
        clearAllFilters() {
          const current = get().filters;
          if (areFiltersEqual(current, defaultFilters)) {
            return;
          }

          set({ filters: defaultFilters });
        },
        resetFilters() {
          get().clearAllFilters();
        },
        resetFiltersOnTabChange() {
          const current = get();
          const filters = {
            ...defaultFilters,
            period: current.filters.period,
            competences: current.filters.competences ?? [],
          };

          if (
            areFiltersEqual(current.filters, filters) &&
            !current.isDrawerOpen &&
            !current.selectedInvoice &&
            !current.drilldownContext
          ) {
            return;
          }

          set({
            filters,
            selectedInvoice: null,
            drilldownContext: null,
            isDrawerOpen: false,
          });
        },
        setExcludedClients(clients) {
          const excludedClients = normalizeArray(clients);
          const current = get();
          if (areArraysEqual(current.excludedClients, excludedClients)) {
            return;
          }

          if (current.selectedInvoice && excludedClients.includes(current.selectedInvoice.customer)) {
            set({ excludedClients, selectedInvoice: null, isDrawerOpen: false, drilldownContext: null });
            return;
          }

          set({ excludedClients });
        },
        toggleExcludedClient(client) {
          if (!client) {
            return;
          }

          const current = get().excludedClients;
          const excludedClients = current.includes(client)
            ? current.filter((item) => item !== client)
            : normalizeArray([...current, client]);

          get().setExcludedClients(excludedClients);
        },
        removeExcludedClient(client) {
          const current = get().excludedClients;
          if (!current.includes(client)) {
            return;
          }

          set({ excludedClients: current.filter((item) => item !== client) });
        },
        clearExcludedClients() {
          if (get().excludedClients.length === 0) {
            return;
          }

          set({ excludedClients: [] });
        },
        setSelectedInvoice(invoice) {
          if (get().selectedInvoice?.id === invoice?.id && get().isDrawerOpen === Boolean(invoice)) {
            return;
          }

          set({ selectedInvoice: invoice, isDrawerOpen: Boolean(invoice), drilldownContext: null });
        },
        openDrilldown(context) {
          if (get().drilldownContext === context && get().isDrawerOpen) {
            return;
          }

          set({ drilldownContext: context, selectedInvoice: null, isDrawerOpen: true });
        },
        closeDrawer() {
          if (!get().isDrawerOpen && !get().selectedInvoice && !get().drilldownContext) {
            return;
          }

          set({ isDrawerOpen: false, selectedInvoice: null, drilldownContext: null });
        },
      }),
      {
        name: 'lic-global-filter-session',
        partialize: (state) => ({ filters: state.filters, excludedClients: state.excludedClients }),
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);
export const selectFilters = (state: GlobalFilterStore) => state.filters;
export const selectFilterOptions = (state: GlobalFilterStore) => state.filterOptions;
