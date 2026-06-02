import type { Invoice, LogisticsIndicators } from '@/types/logistics';

const safeDivide = (value: number, divisor: number): number => (divisor === 0 ? 0 : value / divisor);

export const getTransportCost = (invoice: Invoice): number =>
  invoice.transport.cte1 + invoice.transport.cte2 + invoice.transport.additionalValue;

export const getOperationalCost = (invoice: Invoice): number =>
  invoice.operational.storage + invoice.operational.handling;

export const calculateIndicators = (invoice: Invoice): LogisticsIndicators => {
  const transportCost = getTransportCost(invoice);
  const operationalCost = getOperationalCost(invoice);
  const totalLogisticsCost = transportCost + operationalCost;
  const logisticsResult = invoice.revenue - totalLogisticsCost;
  const logisticsIndex = safeDivide(totalLogisticsCost, invoice.revenue);
  const freightBase =
    invoice.transport.cte1 + invoice.transport.cte2 + invoice.transport.additionalValue;

  return {
    revenue: invoice.revenue,
    transportCost,
    operationalCost,
    totalLogisticsCost,
    logisticsResult,
    logisticsIndex,
    grossFreightPerKg: safeDivide(freightBase, invoice.grossWeight),
    netFreightPerKg: safeDivide(freightBase, invoice.netWeight),
    totalLogisticsCostPerKg: safeDivide(totalLogisticsCost, invoice.grossWeight),
    accessoryExpenseShare: safeDivide(invoice.transport.accessoryExpenses, transportCost),
  };
};
