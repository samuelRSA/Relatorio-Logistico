import type { Invoice, LogisticsIndicators } from '@/types/logistics';

const safeDivide = (value: number, divisor: number): number => (divisor === 0 ? 0 : value / divisor);

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();

export const normalizeOperationType = (operationType: string): string => normalizeText(operationType);

export const isOperationalWeightOperation = (operationType: string): boolean =>
  ['VENDA', 'BONIFICACAO'].includes(normalizeOperationType(operationType));

export const isOperationalWeightInvoice = (invoice: Invoice): boolean => isOperationalWeightOperation(invoice.operationType);

export const isTransportChargeableInvoice = (invoice: Invoice): boolean =>
  ['VENDA', 'BONIFICACAO'].includes(normalizeOperationType(invoice.operationType));

export const getRecognizedRevenue = (invoice: Invoice): number => {
  const normalizedOperationType = normalizeOperationType(invoice.operationType);
  return normalizedOperationType === 'VENDA' ? invoice.revenue : 0;
};

export const getTransportCost = (invoice: Invoice): number =>
  isTransportChargeableInvoice(invoice)
    ? invoice.transport.cte1 + invoice.transport.cte2 + invoice.transport.additionalValue
    : 0;

export const getTotalLogisticsCost = (invoice: Invoice): number => getTransportCost(invoice) + getOperationalCost(invoice);

export const getOperationalCost = (invoice: Invoice): number =>
  invoice.operational.storage + invoice.operational.handling + invoice.operational.transfer;

export const calculateIndicators = (invoice: Invoice): LogisticsIndicators => {
  const transportCost = getTransportCost(invoice);
  const operationalCost = getOperationalCost(invoice);
  const totalLogisticsCost = getTotalLogisticsCost(invoice);
  const recognizedRevenue = getRecognizedRevenue(invoice);
  const logisticsIndex = safeDivide(totalLogisticsCost, recognizedRevenue);
  const operationalGrossWeight = isOperationalWeightInvoice(invoice) ? invoice.grossWeight : 0;
  const operationalNetWeight = isOperationalWeightInvoice(invoice) ? invoice.netWeight : 0;

  return {
    originalRevenue: invoice.revenue,
    recognizedRevenue,
    revenue: recognizedRevenue,
    transportCost,
    operationalCost,
    totalLogisticsCost,
    logisticsIndex,
    grossFreightPerKg: safeDivide(transportCost, operationalGrossWeight),
    netFreightPerKg: safeDivide(transportCost, operationalNetWeight),
    totalLogisticsCostPerKg: safeDivide(totalLogisticsCost, operationalGrossWeight),
    accessoryExpenseShare: safeDivide(invoice.transport.additionalValue, transportCost),
    operationalGrossWeight,
  };
};
