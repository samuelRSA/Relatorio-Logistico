import type {
  CityTransportCost,
  CityFreightByInvoiceCost,
  EnrichedInvoice,
  LogisticsIndicators,
  QuadrantPoint,
  RankingItem,
  RouteRankingItem,
  RouteCost,
  CustomerOperationalCost,
  UfTransportCost,
  UfFreightByInvoiceCost,
  WeightFreightBucket,
  MonthlyLogisticsTrend,
} from '@/types/logistics';
import { isOperationalWeightInvoice, isTransportChargeableInvoice } from '@/utils/logisticsRules';

const safeDivide = (value: number, divisor: number): number => (divisor === 0 ? 0 : value / divisor);

export const aggregateIndicators = (invoices: EnrichedInvoice[]): LogisticsIndicators => {
  const totals = invoices.reduce(
    (acc, invoice) => ({
      originalRevenue: acc.originalRevenue + invoice.originalRevenue,
      recognizedRevenue: acc.recognizedRevenue + invoice.recognizedRevenue,
      transportCost: acc.transportCost + invoice.transportCost,
      operationalCost: acc.operationalCost + invoice.operationalCost,
      totalLogisticsCost: acc.totalLogisticsCost + invoice.totalLogisticsCost,
      grossWeight: acc.grossWeight + invoice.grossWeight,
      netWeight: acc.netWeight + invoice.netWeight,
      additionalValue: acc.additionalValue + invoice.transport.additionalValue,
      chargeableGrossWeight: acc.chargeableGrossWeight + (isOperationalWeightInvoice(invoice) ? invoice.grossWeight : 0),
      chargeableNetWeight: acc.chargeableNetWeight + (isOperationalWeightInvoice(invoice) ? invoice.netWeight : 0),
    }),
    {
      originalRevenue: 0,
      recognizedRevenue: 0,
      transportCost: 0,
      operationalCost: 0,
      totalLogisticsCost: 0,
      grossWeight: 0,
      netWeight: 0,
      additionalValue: 0,
      chargeableGrossWeight: 0,
      chargeableNetWeight: 0,
    },
  );

  return {
    originalRevenue: totals.originalRevenue,
    recognizedRevenue: totals.recognizedRevenue,
    revenue: totals.recognizedRevenue,
    transportCost: totals.transportCost,
    operationalCost: totals.operationalCost,
    totalLogisticsCost: totals.totalLogisticsCost,
    logisticsIndex: safeDivide(totals.totalLogisticsCost, totals.recognizedRevenue),
    grossFreightPerKg: safeDivide(totals.transportCost, totals.chargeableGrossWeight),
    netFreightPerKg: safeDivide(totals.transportCost, totals.chargeableNetWeight),
    totalLogisticsCostPerKg: safeDivide(totals.totalLogisticsCost, totals.chargeableGrossWeight),
    accessoryExpenseShare: safeDivide(totals.additionalValue, totals.transportCost),
    operationalGrossWeight: totals.chargeableGrossWeight,
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

const formatCompetenceLabel = (competence: string): string => {
  const [year, month] = competence.split('-').map(Number);
  if (!year || !month) {
    return competence;
  }

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '');

  return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}/${String(year).slice(-2)}`;
};

export const monthlyLogisticsTrend = (invoices: EnrichedInvoice[]): MonthlyLogisticsTrend[] => {
  const grouped = invoices.reduce<
    Record<string, { recognizedRevenue: number; totalLogisticsCost: number; invoiceCount: number; operationalGrossWeight: number }>
  >((acc, invoice) => {
    const key = invoice.competence || invoice.date.slice(0, 7);
    acc[key] ??= { recognizedRevenue: 0, totalLogisticsCost: 0, invoiceCount: 0, operationalGrossWeight: 0 };
    acc[key].recognizedRevenue += invoice.recognizedRevenue;
    acc[key].totalLogisticsCost += invoice.totalLogisticsCost;
    acc[key].invoiceCount += 1;
    acc[key].operationalGrossWeight += invoice.operationalGrossWeight;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([competence, value]) => ({
      competence,
      label: formatCompetenceLabel(competence),
      recognizedRevenue: value.recognizedRevenue,
      totalLogisticsCost: value.totalLogisticsCost,
      logisticsIndex: safeDivide(value.totalLogisticsCost, value.recognizedRevenue),
      invoiceCount: value.invoiceCount,
      operationalGrossWeight: value.operationalGrossWeight,
    }))
    .sort((a, b) => a.competence.localeCompare(b.competence));
};

export const cityCostHeatmap = (invoices: EnrichedInvoice[]): RouteCost[] =>
  groupSum(
    invoices.filter(isTransportChargeableInvoice),
    (invoice) => `${invoice.city}/${invoice.uf}`,
    (invoice) => invoice.transportCost,
  ).map(
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
            .reduce((sum, invoice) => sum + (isOperationalWeightInvoice(invoice) ? invoice.grossWeight : 0), 0),
        ),
      };
    },
  );

export const topCityTransportCosts = (invoices: EnrichedInvoice[]): CityTransportCost[] => {
  const grouped = invoices.filter(isTransportChargeableInvoice).reduce<
    Record<string, { city: string; uf: string; cost: number; invoiceCount: number; grossWeight: number }>
  >((acc, invoice) => {
    const key = `${invoice.city}/${invoice.uf}`;
    acc[key] ??= { city: invoice.city, uf: invoice.uf, cost: 0, invoiceCount: 0, grossWeight: 0 };
    acc[key].cost += invoice.transportCost;
    acc[key].invoiceCount += 1;
    acc[key].grossWeight += invoice.grossWeight;
    return acc;
  }, {});

  return Object.values(grouped)
    .map((item) => ({
      ...item,
      freightPerKg: safeDivide(item.cost, item.grossWeight),
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);
};

export const topCityFreightByInvoiceCosts = (invoices: EnrichedInvoice[]): CityFreightByInvoiceCost[] => {
  const chargeableInvoices = invoices.filter(isTransportChargeableInvoice);
  const totalCost = chargeableInvoices.reduce((sum, invoice) => sum + invoice.transportCost, 0);
  const grouped = chargeableInvoices.reduce<
    Record<
      string,
      {
        city: string;
        uf: string;
        transportCost: number;
        grossWeight: number;
        freightPerKgSum: number;
        minWeight: number;
        invoiceCount: number;
      }
    >
  >((acc, invoice) => {
    const key = `${invoice.city}/${invoice.uf}`;
    acc[key] ??= {
      city: invoice.city,
      uf: invoice.uf,
      transportCost: 0,
      grossWeight: 0,
      freightPerKgSum: 0,
      minWeight: Number.POSITIVE_INFINITY,
      invoiceCount: 0,
    };

    const freightPerKg = safeDivide(invoice.transportCost, invoice.grossWeight);
    acc[key].transportCost += invoice.transportCost;
    acc[key].grossWeight += invoice.grossWeight;
    acc[key].freightPerKgSum += freightPerKg;
    acc[key].minWeight = Math.min(acc[key].minWeight, invoice.grossWeight);
    acc[key].invoiceCount += 1;
    return acc;
  }, {});

  return Object.values(grouped)
    .map((item) => ({
      city: item.city,
      uf: item.uf,
      freightPerKgConsolidated: safeDivide(item.transportCost, item.grossWeight),
      freightPerKgAverage: safeDivide(item.freightPerKgSum, item.invoiceCount),
      transportCost: item.transportCost,
      grossWeight: item.grossWeight,
      averageWeight: safeDivide(item.grossWeight, item.invoiceCount),
      minWeight: Number.isFinite(item.minWeight) ? item.minWeight : 0,
      invoiceCount: item.invoiceCount,
      participation: safeDivide(item.transportCost, totalCost),
    }))
    .sort((a, b) => b.freightPerKgConsolidated - a.freightPerKgConsolidated)
    .slice(0, 10);
};

export const ufTransportCosts = (invoices: EnrichedInvoice[]): UfTransportCost[] => {
  const chargeableInvoices = invoices.filter(isTransportChargeableInvoice);
  const totalCost = chargeableInvoices.reduce((sum, invoice) => sum + invoice.transportCost, 0);
  const grouped = chargeableInvoices.reduce<Record<string, { uf: string; cost: number; grossWeight: number; invoiceCount: number }>>(
    (acc, invoice) => {
      acc[invoice.uf] ??= { uf: invoice.uf, cost: 0, grossWeight: 0, invoiceCount: 0 };
      acc[invoice.uf].cost += invoice.transportCost;
      acc[invoice.uf].grossWeight += invoice.grossWeight;
      acc[invoice.uf].invoiceCount += 1;
      return acc;
    },
    {},
  );

  return Object.values(grouped)
    .map((item) => ({
      ...item,
      freightPerKg: safeDivide(item.cost, item.grossWeight),
      participation: safeDivide(item.cost, totalCost),
    }))
    .sort((a, b) => b.freightPerKg - a.freightPerKg);
};

export const ufFreightByInvoiceCosts = (invoices: EnrichedInvoice[]): UfFreightByInvoiceCost[] => {
  const chargeableInvoices = invoices.filter(isTransportChargeableInvoice);
  const totalCost = chargeableInvoices.reduce((sum, invoice) => sum + invoice.transportCost, 0);
  const grouped = chargeableInvoices.reduce<
    Record<
      string,
      {
        uf: string;
        transportCost: number;
        grossWeight: number;
        freightPerKgSum: number;
        minWeight: number;
        invoiceCount: number;
      }
    >
  >((acc, invoice) => {
    acc[invoice.uf] ??= {
      uf: invoice.uf,
      transportCost: 0,
      grossWeight: 0,
      freightPerKgSum: 0,
      minWeight: Number.POSITIVE_INFINITY,
      invoiceCount: 0,
    };

    const freightPerKg = safeDivide(invoice.transportCost, invoice.grossWeight);
    acc[invoice.uf].transportCost += invoice.transportCost;
    acc[invoice.uf].grossWeight += invoice.grossWeight;
    acc[invoice.uf].freightPerKgSum += freightPerKg;
    acc[invoice.uf].minWeight = Math.min(acc[invoice.uf].minWeight, invoice.grossWeight);
    acc[invoice.uf].invoiceCount += 1;
    return acc;
  }, {});

  return Object.values(grouped)
    .map((item) => ({
      uf: item.uf,
      freightPerKgAverage: safeDivide(item.freightPerKgSum, item.invoiceCount),
      freightPerKgConsolidated: safeDivide(item.transportCost, item.grossWeight),
      transportCost: item.transportCost,
      grossWeight: item.grossWeight,
      averageWeight: safeDivide(item.grossWeight, item.invoiceCount),
      minWeight: Number.isFinite(item.minWeight) ? item.minWeight : 0,
      invoiceCount: item.invoiceCount,
      participation: safeDivide(item.transportCost, totalCost),
    }))
    .sort((a, b) => b.freightPerKgAverage - a.freightPerKgAverage);
};

const WEIGHT_BUCKETS: Array<{ label: string; min: number; max?: number }> = [
  { label: '0–100 kg', min: 0, max: 100 },
  { label: '101–300 kg', min: 101, max: 300 },
  { label: '301–500 kg', min: 301, max: 500 },
  { label: '501–1.000 kg', min: 501, max: 1000 },
  { label: '1.001–3.000 kg', min: 1001, max: 3000 },
  { label: 'Acima de 3.000 kg', min: 3001 },
];

export const weightFreightBuckets = (invoices: EnrichedInvoice[]): WeightFreightBucket[] => {
  const chargeableInvoices = invoices.filter(isTransportChargeableInvoice);
  const grouped = WEIGHT_BUCKETS.map((bucket) => {
    const bucketInvoices = chargeableInvoices.filter((invoice) =>
      bucket.max ? invoice.grossWeight >= bucket.min && invoice.grossWeight <= bucket.max : invoice.grossWeight >= bucket.min,
    );
    const totalWeight = bucketInvoices.reduce((sum, invoice) => sum + invoice.grossWeight, 0);
    const totalCost = bucketInvoices.reduce((sum, invoice) => sum + invoice.transportCost, 0);
    const invoiceCount = bucketInvoices.length;

    return {
      label: bucket.label,
      freightPerKg: safeDivide(totalCost, totalWeight),
      averageWeight: safeDivide(totalWeight, invoiceCount),
      invoiceCount,
      transportCost: totalCost,
    };
  });

  return grouped;
};

export const routeRankingDetails = (invoices: EnrichedInvoice[]): RouteRankingItem[] =>
  Object.entries(
    invoices.filter(isTransportChargeableInvoice).reduce<
      Record<string, { route: string; origin: string; destination: string; cost: number; grossWeight: number; invoiceCount: number }>
    >((acc, invoice) => {
      const origin = invoice.uf;
      const destination = invoice.city;
      const route = `${origin} > ${destination}`;
      acc[route] ??= { route, origin, destination, cost: 0, grossWeight: 0, invoiceCount: 0 };
      acc[route].cost += invoice.transportCost;
      acc[route].grossWeight += invoice.grossWeight;
      acc[route].invoiceCount += 1;
      return acc;
    }, {}),
  )
    .map(([, item]) => ({
      ...item,
      freightPerKg: safeDivide(item.cost, item.grossWeight),
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

export const quadrantPoints = (invoices: EnrichedInvoice[]): QuadrantPoint[] => {
  const grouped = invoices.reduce<Record<string, { revenue: number; cost: number }>>(
    (acc, invoice) => {
      acc[invoice.customer] ??= { revenue: 0, cost: 0 };
      acc[invoice.customer].revenue += invoice.recognizedRevenue;
      acc[invoice.customer].cost += invoice.totalLogisticsCost;
      return acc;
    },
    {},
  );

  return Object.entries(grouped).map(([customer, values]) => ({
    customer,
    revenue: values.revenue,
    logisticsIndex: safeDivide(values.cost, values.revenue),
    totalLogisticsCost: values.cost,
  }));
};

export const topCustomersByOperationalCost = (invoices: EnrichedInvoice[]): CustomerOperationalCost[] => {
  const grouped = invoices.reduce<
    Record<
      string,
      {
        customer: string;
        storage: number;
        handling: number;
        transfer: number;
        invoiceCount: number;
        grossWeight: number;
        operationalGrossWeight: number;
      }
    >
  >((acc, invoice) => {
    acc[invoice.customer] ??= {
      customer: invoice.customer,
      storage: 0,
      handling: 0,
      transfer: 0,
      invoiceCount: 0,
      grossWeight: 0,
      operationalGrossWeight: 0,
    };

    acc[invoice.customer].storage += invoice.operational.storage;
    acc[invoice.customer].handling += invoice.operational.handling;
    acc[invoice.customer].transfer += invoice.operational.transfer;
    acc[invoice.customer].invoiceCount += 1;
    acc[invoice.customer].grossWeight += invoice.grossWeight;
    acc[invoice.customer].operationalGrossWeight += isOperationalWeightInvoice(invoice) ? invoice.grossWeight : 0;
    return acc;
  }, {});

  const totalOperationalCost = Object.values(grouped).reduce(
    (sum, item) => sum + item.storage + item.handling + item.transfer,
    0,
  );

  return Object.values(grouped)
    .map((item) => {
      const operationalCost = item.storage + item.handling + item.transfer;
      return {
        customer: item.customer,
        rank: 0,
        totalOperationalCost: operationalCost,
        storage: item.storage,
        handling: item.handling,
        transfer: item.transfer,
        invoiceCount: item.invoiceCount,
        grossWeight: item.grossWeight,
        operationalGrossWeight: item.operationalGrossWeight,
        operationalCostPerKg: safeDivide(operationalCost, item.operationalGrossWeight),
        participation: safeDivide(operationalCost, totalOperationalCost),
      };
    })
    .sort((a, b) => b.totalOperationalCost - a.totalOperationalCost)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))
    .slice(0, 10);
};
