export type CompanyId = 1 | 2 | 3 | 4;
export type OperationType = 'VENDA' | 'TRANSFERENCIA' | 'BONIFICAÇÃO' | 'REFATURAMENTO' | 'RETIRADA';
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
  competence: string;
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
  logisticsIndex: number;
  grossFreightPerKg: number;
  netFreightPerKg: number;
  totalLogisticsCostPerKg: number;
  accessoryExpenseShare: number;
  operationalGrossWeight: number;
}

export interface EnrichedInvoice extends Invoice, LogisticsIndicators {}

export interface FilterState {
  period: {
    start: string;
    end: string;
  };
  competences: string[];
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
  competences: string[];
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

export interface MonthlyLogisticsTrend {
  competence: string;
  label: string;
  recognizedRevenue: number;
  totalLogisticsCost: number;
  logisticsIndex: number;
  invoiceCount: number;
  operationalGrossWeight: number;
}

export interface RouteCost {
  route: string;
  city: string;
  uf: string;
  cost: number;
  freightPerKg: number;
}

export interface CityTransportCost {
  city: string;
  uf: string;
  cost: number;
  invoiceCount: number;
  grossWeight: number;
  freightPerKg: number;
}

export interface CityFreightByInvoiceCost {
  city: string;
  uf: string;
  freightPerKgConsolidated: number;
  freightPerKgAverage: number;
  transportCost: number;
  grossWeight: number;
  averageWeight: number;
  minWeight: number;
  invoiceCount: number;
  participation: number;
}

export interface WeightFreightBucket {
  label: string;
  freightPerKg: number;
  averageWeight: number;
  invoiceCount: number;
  transportCost: number;
}

export interface UfTransportCost {
  uf: string;
  cost: number;
  grossWeight: number;
  invoiceCount: number;
  freightPerKg: number;
  participation: number;
}

export interface UfFreightByInvoiceCost {
  uf: string;
  freightPerKgAverage: number;
  freightPerKgConsolidated: number;
  transportCost: number;
  grossWeight: number;
  averageWeight: number;
  minWeight: number;
  invoiceCount: number;
  participation: number;
}

export interface RouteRankingItem {
  route: string;
  origin: string;
  destination: string;
  cost: number;
  freightPerKg: number;
  grossWeight: number;
  invoiceCount: number;
}

export interface QuadrantPoint {
  customer: string;
  revenue: number;
  logisticsIndex: number;
  totalLogisticsCost: number;
}

export interface CustomerOperationalCost {
  customer: string;
  rank: number;
  totalOperationalCost: number;
  storage: number;
  handling: number;
  transfer: number;
  invoiceCount: number;
  grossWeight: number;
  operationalGrossWeight: number;
  operationalCostPerKg: number;
  participation: number;
}
