import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import { logisticsService } from '@/services/logisticsService';
import { mapFilterOptions } from '@/services/mappers/filterMapper';
import type {
  EnrichedInvoice,
  FilterOptions,
  FilterState,
  LogisticsIndicators,
} from '@/types/logistics';
import { aggregateIndicators } from '@/utils/aggregations';
import { applyFilters, defaultFilters, filterCacheKey } from '@/utils/filtering';

type ArrayFilterKey = Exclude<keyof FilterState, 'period'>;
type ArrayFilterValue<K extends ArrayFilterKey> = FilterState[K][number];

interface AggregationCacheEntry {
  filteredInvoices: EnrichedInvoice[];
  indicators: LogisticsIndicators;
}

interface GlobalFilterStore {
  invoices: EnrichedInvoice[];
  filteredInvoices: EnrichedInvoice[];
  filterOptions: FilterOptions;
  filters: FilterState;
  indicators: LogisticsIndicators;
  aggregationCache: Record<string, AggregationCacheEntry>;
  selectedInvoice: EnrichedInvoice | null;
  drilldownContext: string | null;
  isDrawerOpen: boolean;
  isLoading: boolean;
  loadData: () => Promise<void>;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleArrayFilter: <K extends ArrayFilterKey>(key: K, value: ArrayFilterValue<K>) => void;
  resetFilters: () => void;
  setSelectedInvoice: (invoice: EnrichedInvoice | null) => void;
  openDrilldown: (context: string) => void;
  closeDrawer: () => void;
}

const emptyIndicators = aggregateIndicators([]);
const emptyOptions: FilterOptions = {
  companies: [],
  ufs: [],
  cities: [],
  customers: [],
  operationTypes: [],
  managementCategories: [],
  sellers: [],
};

const deriveState = (
  invoices: EnrichedInvoice[],
  filters: FilterState,
  cache: Record<string, AggregationCacheEntry>,
) => {
  const key = filterCacheKey(filters);
  const cached = cache[key];

  if (cached) {
    return {
      filteredInvoices: cached.filteredInvoices,
      indicators: cached.indicators,
      aggregationCache: cache,
    };
  }

  const filteredInvoices = applyFilters(invoices, filters);
  const indicators = aggregateIndicators(filteredInvoices);

  return {
    filteredInvoices,
    indicators,
    aggregationCache: {
      ...cache,
      [key]: { filteredInvoices, indicators },
    },
  };
};

export const useGlobalFilterStore = create<GlobalFilterStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        invoices: [],
        filteredInvoices: [],
        filterOptions: emptyOptions,
        filters: defaultFilters,
        indicators: emptyIndicators,
        aggregationCache: {},
        selectedInvoice: null,
        drilldownContext: null,
        isDrawerOpen: false,
        isLoading: true,
        async loadData() {
          set({ isLoading: true });
          const invoices = await logisticsService.getInvoices();
          const filterOptions = mapFilterOptions(invoices);
          const derived = deriveState(invoices, get().filters, {});
          set({
            invoices,
            filterOptions,
            ...derived,
            isLoading: false,
          });
        },
        setFilter(key, value) {
          const filters = { ...get().filters, [key]: value };
          const derived = deriveState(get().invoices, filters, get().aggregationCache);
          set({ filters, ...derived });
        },
        toggleArrayFilter(key, value) {
          const current = get().filters[key] as ArrayFilterValue<typeof key>[];

          const next = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value];

          get().setFilter(key, next as FilterState[typeof key]);
        },
        resetFilters() {
          const derived = deriveState(get().invoices, defaultFilters, get().aggregationCache);
          set({ filters: defaultFilters, ...derived });
        },
        setSelectedInvoice(invoice) {
          set({ selectedInvoice: invoice, isDrawerOpen: Boolean(invoice), drilldownContext: null });
        },
        openDrilldown(context) {
          set({ drilldownContext: context, selectedInvoice: null, isDrawerOpen: true });
        },
        closeDrawer() {
          set({ isDrawerOpen: false, selectedInvoice: null, drilldownContext: null });
        },
      }),
      {
        name: 'lic-global-filter-session',
        partialize: (state) => ({ filters: state.filters }),
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);

export const selectFilteredInvoices = (state: GlobalFilterStore) => state.filteredInvoices;
export const selectIndicators = (state: GlobalFilterStore) => state.indicators;
export const selectFilters = (state: GlobalFilterStore) => state.filters;
export const selectFilterOptions = (state: GlobalFilterStore) => state.filterOptions;
