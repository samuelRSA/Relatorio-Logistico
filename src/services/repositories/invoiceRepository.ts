import rawInvoices from '@/mock-data/invoices.json';
import type { Invoice } from '@/types/logistics';

type RawInvoice = Omit<Invoice, 'competence' | 'transport' | 'operational'> & {
  competence?: string;
  transport: Invoice['transport'] & {
  };
  operational: Partial<Invoice['operational']> & Record<
    'transfer' | 'C. Transferência' | 'C. Transferencia' | 'C Transferência' | 'C Transferencia' | 'Transferência' | 'Transferencia',
    unknown
  >;
};

const toFiniteNumber = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const readTransferValue = (operational: RawInvoice['operational']): unknown =>
  operational.transfer ??
  operational['C. Transferência'] ??
  operational['C. Transferencia'] ??
  operational['C Transferência'] ??
  operational['C Transferencia'] ??
  operational['Transferência'] ??
  operational['Transferencia'];

const normalizeInvoice = (invoice: RawInvoice): Invoice => {
  const transport = invoice.transport ?? {};
  const operational = invoice.operational ?? {};
  const competence = invoice.competence || invoice.date.slice(0, 7);

  return {
    ...invoice,
    competence,
    transport: {
      cte1: toFiniteNumber(transport.cte1),
      cte2: toFiniteNumber(transport.cte2),
      additionalValue: toFiniteNumber(transport.additionalValue),
      accessoryExpenses: toFiniteNumber(transport.accessoryExpenses ?? transport.additionalValue),
    },
    operational: {
      storage: toFiniteNumber(operational.storage),
      handling: toFiniteNumber(operational.handling),
      transfer: toFiniteNumber(readTransferValue(operational)),
    },
  };
};

export interface InvoiceRepository {
  findAll(): Promise<Invoice[]>;
}

export class MockInvoiceRepository implements InvoiceRepository {
  async findAll(): Promise<Invoice[]> {
    return (rawInvoices as RawInvoice[]).map(normalizeInvoice);
  }
}
