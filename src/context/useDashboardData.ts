import { createContext, useContext } from 'react';
import type { DashboardData } from '@/utils/dashboardData';

export const DashboardDataContext = createContext<DashboardData | null>(null);

export function useDashboardData(): DashboardData {
  const value = useContext(DashboardDataContext);

  if (!value) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }

  return value;
}
