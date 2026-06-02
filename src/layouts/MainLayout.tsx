import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import type { NavigationItem, PageId } from '@/types/navigation';

interface MainLayoutProps {
  activePage: PageId;
  navigation: NavigationItem[];
  onNavigate: (pageId: PageId) => void;
  children: ReactNode;
}

export function MainLayout({ activePage, navigation, onNavigate, children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} navigation={navigation} onNavigate={onNavigate} />
      <div className="ml-80 flex min-h-screen flex-1 flex-col">
        <Header activePage={activePage} navigation={navigation} />
        <main className="flex-1 px-8 pb-8 pt-6">{children}</main>
      </div>
    </div>
  );
}
