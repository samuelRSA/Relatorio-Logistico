export interface BrazilUfMapMetric {
  uf: string;
  revenue: number;
  transportCost: number;
  operationalCost: number;
  totalLogisticsCost: number;
  logisticsResult: number;
  logisticsIndex: number;
  invoiceCount: number;
}

export interface BrazilMapDatum extends BrazilUfMapMetric {
  name: string;
  value: number;
  selected: boolean;
}
