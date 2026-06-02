export type PageId = 'executive' | 'transportation' | 'operations' | 'profitability' | 'invoices';

export interface NavigationItem {
  id: PageId;
  label: string;
  description: string;
}
