import type {
  EnrichedInvoice,
  LogisticsIndicators,
  QuadrantPoint,
  RankingItem,
  RouteCost,
} from '@/types/logistics';

const safeDivide = (value: number, divisor: number): number => (divisor === 0 ? 0 : value / divisor);

export const aggregateIndicators = (invoices: EnrichedInvoice[]): LogisticsIndicators => {
  const totals = invoices.reduce(
    (acc, invoice) => ({
      originalRevenue: acc.originalRevenue + invoice.originalRevenue,
      recognizedRevenue: acc.recognizedRevenue + invoice.recognizedRevenue,
      transportCost: acc.transportCost + invoice.transportCost,
      operationalCost: acc.operationalCost + invoice.operationalCost,
      totalLogisticsCost: acc.totalLogisticsCost + invoice.totalLogisticsCost,
      logisticsResult: acc.logisticsResult + invoice.logisticsResult,
      grossWeight: acc.grossWeight + invoice.grossWeight,
      netWeight: acc.netWeight + invoice.netWeight,
      additionalValue: acc.additionalValue + invoice.transport.additionalValue,
    }),
    {
      originalRevenue: 0,
      recognizedRevenue: 0,
      transportCost: 0,
      operationalCost: 0,
      totalLogisticsCost: 0,
      logisticsResult: 0,
      grossWeight: 0,
      netWeight: 0,
      additionalValue: 0,
    },
  );

  return {
    originalRevenue: totals.originalRevenue,
    recognizedRevenue: totals.recognizedRevenue,
    revenue: totals.recognizedRevenue,
    transportCost: totals.transportCost,
    operationalCost: totals.operationalCost,
    totalLogisticsCost: totals.totalLogisticsCost,
    logisticsResult: totals.logisticsResult,
    logisticsIndex: safeDivide(totals.totalLogisticsCost, totals.recognizedRevenue),
    grossFreightPerKg: safeDivide(totals.transportCost, totals.grossWeight),
    netFreightPerKg: safeDivide(totals.transportCost, totals.netWeight),
    totalLogisticsCostPerKg: safeDivide(totals.totalLogisticsCost, totals.grossWeight),
    accessoryExpenseShare: safeDivide(totals.additionalValue, totals.transportCost),
  };
};

export const groupSum = (
  invoices: EnrichedInvoice[],
  getKey: (invoice: EnrichedInvoice) => string,
  getValue: (invoice: EnrichedInvoice) => number,
): RankingItem[] => {
  const grouped = invoices.reduce<Record<string, number>>((acc, invoice) => {
    const key = getKey(invoice);
    acc[key] = (acc[key] ?? 0) + getValue(invoice);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

export const topCustomersByLogisticsIndex = (invoices: EnrichedInvoice[]): RankingItem[] => {
  const grouped = invoices.reduce<Record<string, { cost: number; revenue: number }>>((acc, invoice) => {
    acc[invoice.customer] ??= { cost: 0, revenue: 0 };
    acc[invoice.customer].cost += invoice.totalLogisticsCost;
    acc[invoice.customer].revenue += invoice.recognizedRevenue;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, values]) => ({
      label,
      value: safeDivide(values.cost, values.revenue),
      secondary: values.cost,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

export const monthlyRevenueCost = (invoices: EnrichedInvoice[]): RankingItem[] => {
  const grouped = invoices.reduce<Record<string, { revenue: number; cost: number }>>((acc, invoice) => {
    const key = invoice.date.slice(0, 7);
    acc[key] ??= { revenue: 0, cost: 0 };
    acc[key].revenue += invoice.recognizedRevenue;
    acc[key].cost += invoice.totalLogisticsCost;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value: value.revenue, secondary: value.cost }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const cityCostHeatmap = (invoices: EnrichedInvoice[]): RouteCost[] =>
  groupSum(invoices, (invoice) => `${invoice.city}/${invoice.uf}`, (invoice) => invoice.transportCost).map(
    (item) => {
      const [city, uf] = item.label.split('/');
      return {
        route: item.label,
        city,
        uf,
        cost: item.value,
        freightPerKg: safeDivide(
          item.value,
          invoices
            .filter((invoice) => `${invoice.city}/${invoice.uf}` === item.label)
            .reduce((sum, invoice) => sum + invoice.grossWeight, 0),
        ),
      };
    },
  );

export const quadrantPoints = (invoices: EnrichedInvoice[]): QuadrantPoint[] => {
  const grouped = invoices.reduce<Record<string, { revenue: number; cost: number; result: number }>>(
    (acc, invoice) => {
      acc[invoice.customer] ??= { revenue: 0, cost: 0, result: 0 };
      acc[invoice.customer].revenue += invoice.recognizedRevenue;
      acc[invoice.customer].cost += invoice.totalLogisticsCost;
      acc[invoice.customer].result += invoice.logisticsResult;
      return acc;
    },
    {},
  );

  return Object.entries(grouped).map(([customer, values]) => ({
    customer,
    revenue: values.revenue,
    logisticsIndex: safeDivide(values.cost, values.revenue),
    logisticsResult: values.result,
  }));
};
