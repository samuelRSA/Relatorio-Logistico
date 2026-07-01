import { useMemo, type ReactNode } from 'react';
import { DashboardDataContext } from '@/context/useDashboardData';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { buildDashboardData } from '@/utils/dashboardData';

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const invoices = useGlobalFilterStore((state) => state.invoices);
  const filters = useGlobalFilterStore((state) => state.filters);
  const excludedClients = useGlobalFilterStore((state) => state.excludedClients);

  const dashboardData = useMemo(
    () => buildDashboardData(invoices, filters, excludedClients),
    [excludedClients, filters, invoices],
  );

  return <DashboardDataContext.Provider value={dashboardData}>{children}</DashboardDataContext.Provider>;
}
