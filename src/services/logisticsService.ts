import { enrichInvoice } from '@/services/adapters/invoiceAdapter';
import { MockInvoiceRepository } from '@/services/repositories/invoiceRepository';
import type { EnrichedInvoice } from '@/types/logistics';

const repository = new MockInvoiceRepository();

export const logisticsService = {
  async getInvoices(): Promise<EnrichedInvoice[]> {
    const invoices = await repository.findAll();
    return invoices.map(enrichInvoice);
  },
};
