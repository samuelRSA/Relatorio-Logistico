import { Boxes, ChartNoAxesCombined, FileText, LineChart, Truck } from 'lucide-react';
import type { NavigationItem } from '@/types/navigation';
import { ENABLE_PROFITABILITY_PAGE } from '@/shared/featureFlags';

const baseNavigationItems: NavigationItem[] = [
  {
    id: 'executive',
    label: 'Visão Gerencial',
    description: 'Saúde gerencial logística',
    icon: ChartNoAxesCombined,
  },
  {
    id: 'transportation',
    label: 'Transporte',
    description: 'Frete terceirizado',
    icon: Truck,
  },
  {
    id: 'operations',
    label: 'Operação Logística',
    description: 'Custos operacionais',
    icon: Boxes,
  },
  {
    id: 'profitability',
    label: 'Rentabilidade Logística',
    description: 'Eficiência por operação',
    icon: LineChart,
  },
  {
    id: 'invoices',
    label: 'Análise Detalhada NF',
    description: 'Investigação granular',
    icon: FileText,
  },
];

export const navigationItems: NavigationItem[] = baseNavigationItems.filter(
  (item) => ENABLE_PROFITABILITY_PAGE || item.id !== 'profitability',
);
