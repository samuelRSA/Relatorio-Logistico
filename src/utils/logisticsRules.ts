import type { Invoice, LogisticsIndicators } from '@/types/logistics';

const safeDivide = (value: number, divisor: number): number => (divisor === 0 ? 0 : value / divisor);

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();

export const normalizeOperationType = (operationType: string): string => normalizeText(operationType);

export const getRecognizedRevenue = (invoice: Invoice): number => {
  const normalizedOperationType = normalizeOperationType(invoice.operationType);
  return normalizedOperationType === 'VENDA' ? invoice.revenue : 0;
};

export const getTransportCost = (invoice: Invoice): number =>
  invoice.transport.cte1 + invoice.transport.cte2 + invoice.transport.additionalValue;

export const getOperationalCost = (invoice: Invoice): number =>
  invoice.operational.storage + invoice.operational.handling + invoice.operational.transfer;

export const calculateIndicators = (invoice: Invoice): LogisticsIndicators => {
  const transportCost = getTransportCost(invoice);
  const operationalCost = getOperationalCost(invoice);
  const totalLogisticsCost = transportCost + operationalCost;
  const recognizedRevenue = getRecognizedRevenue(invoice);
  const logisticsResult = recognizedRevenue - totalLogisticsCost;
  const logisticsIndex = safeDivide(totalLogisticsCost, recognizedRevenue);

  return {
    originalRevenue: invoice.revenue,
    recognizedRevenue,
    revenue: recognizedRevenue,
    transportCost,
    operationalCost,
    totalLogisticsCost,
    logisticsResult,
    logisticsIndex,
    grossFreightPerKg: safeDivide(transportCost, invoice.grossWeight),
    netFreightPerKg: safeDivide(transportCost, invoice.netWeight),
    totalLogisticsCostPerKg: safeDivide(totalLogisticsCost, invoice.grossWeight),
    accessoryExpenseShare: safeDivide(invoice.transport.additionalValue, transportCost),
  };
};
