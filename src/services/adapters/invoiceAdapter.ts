import type { EnrichedInvoice, Invoice } from '@/types/logistics';
import { calculateIndicators } from '@/utils/logisticsRules';

export const enrichInvoice = (invoice: Invoice): EnrichedInvoice => ({
  ...invoice,
  ...calculateIndicators(invoice),
});
