import type { LucideIcon } from 'lucide-react';

export type PageId = 'executive' | 'transportation' | 'operations' | 'profitability' | 'invoices';

export interface NavigationItem {
  id: PageId;
  label: string;
  description: string;
  icon: LucideIcon;
}
