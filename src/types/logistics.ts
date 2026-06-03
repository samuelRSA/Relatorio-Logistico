export type CompanyId = 1 | 2 | 3;
export type OperationType = 'VENDA' | 'TRANSFERENCIA' | 'BONIFICAÇÃO';
export type ManagementCategory = 'Comercial' | 'Abastecimento' | 'Incentivo';

export interface Company {
  id: CompanyId;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  city: string;
  uf: string;
  seller: string;
}

export interface TransportCost {
  cte1: number;
  cte2: number;
  additionalValue: number;
  /**
   * Legacy mirror of `additionalValue` kept for compatibility with older raw files.
   * Do not use this field in calculations.
   */
  accessoryExpenses?: number;
}

export interface OperationalCost {
  storage: number;
  handling: number;
  transfer: number;
}

export interface Invoice {
  id: string;
  nf: string;
  date: string;
  customerId: string;
  customer: string;
  city: string;
  uf: string;
  companyId: CompanyId;
  company: string;
  operationType: OperationType;
  managementCategory: ManagementCategory;
  seller: string;
  revenue: number;
  grossWeight: number;
  netWeight: number;
  transport: TransportCost;
  operational: OperationalCost;
}

export interface LogisticsIndicators {
  originalRevenue: number;
  recognizedRevenue: number;
  revenue: number;
  transportCost: number;
  operationalCost: number;
  totalLogisticsCost: number;
  logisticsResult: number;
  logisticsIndex: number;
  grossFreightPerKg: number;
  netFreightPerKg: number;
  totalLogisticsCostPerKg: number;
  accessoryExpenseShare: number;
}

export interface EnrichedInvoice extends Invoice, LogisticsIndicators {}

export interface FilterState {
  period: {
    start: string;
    end: string;
  };
  companyIds: CompanyId[];
  ufs: string[];
  cities: string[];
  customers: string[];
  operationTypes: OperationType[];
  managementCategories: ManagementCategory[];
  sellers: string[];
}

export interface FilterOptions {
  companies: Company[];
  ufs: string[];
  cities: string[];
  customers: string[];
  operationTypes: OperationType[];
  managementCategories: ManagementCategory[];
  sellers: string[];
}

export interface RankingItem {
  label: string;
  value: number;
  secondary?: number;
}

export interface RouteCost {
  route: string;
  city: string;
  uf: string;
  cost: number;
  freightPerKg: number;
}

export interface QuadrantPoint {
  customer: string;
  revenue: number;
  logisticsIndex: number;
  logisticsResult: number;
}
