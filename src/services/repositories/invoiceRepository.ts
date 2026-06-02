import rawInvoices from '@/mock-data/invoices.json';
import type { Invoice } from '@/types/logistics';

export interface InvoiceRepository {
  findAll(): Promise<Invoice[]>;
}

export class MockInvoiceRepository implements InvoiceRepository {
  async findAll(): Promise<Invoice[]> {
    return rawInvoices as Invoice[];
  }
}
