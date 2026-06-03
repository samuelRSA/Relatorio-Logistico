import React, { Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MainLayout } from '../layouts/MainLayout';
import { Drawer } from '@/components/Drawer';
import { DrawerContent } from '@/components/DrawerContent';
import { DashboardDataProvider } from '@/context/DashboardDataProvider';
import { PageSkeleton } from '@/components/Skeleton';
import { navigationItems } from '@/shared/navigation';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { PageId } from '@/types/navigation';

const ExecutivePage = React.lazy(() => import('@/features/executive/pages/ExecutivePage'));
const TransportationPage = React.lazy(() => import('@/features/transportation/pages/TransportationPage'));
const OperationsPage = React.lazy(() => import('@/features/operations/pages/OperationsPage'));
const ProfitabilityPage = React.lazy(() => import('@/features/profitability/pages/ProfitabilityPage'));
const InvoicesPage = React.lazy(() => import('@/features/invoices/pages/InvoicesPage'));

const pageMap: Record<PageId, React.LazyExoticComponent<React.ComponentType>> = {
  executive: ExecutivePage,
  transportation: TransportationPage,
  operations: OperationsPage,
  profitability: ProfitabilityPage,
  invoices: InvoicesPage,
};

export function App() {
  const [activePage, setActivePage] = useState<PageId>('executive');
  const loadData = useGlobalFilterStore((state) => state.loadData);
  const closeDrawer = useGlobalFilterStore((state) => state.closeDrawer);
  const isDrawerOpen = useGlobalFilterStore((state) => state.isDrawerOpen);
  const ActivePage = pageMap[activePage];

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <DashboardDataProvider>
      <MainLayout activePage={activePage} navigation={navigationItems} onNavigate={setActivePage}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Suspense fallback={<PageSkeleton />}>
              <ActivePage />
            </Suspense>
          </motion.div>
        </AnimatePresence>
        <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} title="Drill-down logístico">
          <DrawerContent />
        </Drawer>
      </MainLayout>
    </DashboardDataProvider>
  );
}
