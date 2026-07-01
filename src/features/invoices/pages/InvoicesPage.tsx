import { useMemo, useRef, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ExpandedState,
  type Header,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { EmptyState } from '@/components/Skeleton';
import { useDashboardData } from '@/context/useDashboardData';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { EnrichedInvoice } from '@/types/logistics';
import { formatCurrency, formatDecimal, formatPercent } from '@/utils/formatters';

const columnHelper = createColumnHelper<EnrichedInvoice>();

export default function InvoicesPage() {
  const { filteredInvoices: invoices } = useDashboardData();
  const setSelectedInvoice = useGlobalFilterStore((state) => state.setSelectedInvoice);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'expand',
        size: 42,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              row.toggleExpanded();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ),
      }),
      columnHelper.accessor('nf', { header: 'NF' }),
      columnHelper.accessor('customer', { header: 'Cliente' }),
      columnHelper.accessor('city', { header: 'Cidade' }),
      columnHelper.accessor('uf', { header: 'UF' }),
      columnHelper.accessor('company', { header: 'Empresa' }),
      columnHelper.accessor('operationType', { header: 'Tipo Operação' }),
      columnHelper.accessor('managementCategory', { header: 'Categoria Gerencial' }),
      columnHelper.accessor('revenue', { header: 'Receita Reconhecida', cell: (info) => formatCurrency(info.getValue()) }),
      columnHelper.accessor('grossWeight', { header: 'Peso Bruto', cell: (info) => `${formatDecimal(info.getValue())} kg` }),
      columnHelper.accessor('netWeight', { header: 'Peso Líquido', cell: (info) => `${formatDecimal(info.getValue())} kg` }),
      columnHelper.accessor('grossFreightPerKg', { header: 'Frete/Kg Bruto', cell: (info) => formatCurrency(info.getValue()) }),
      columnHelper.accessor('netFreightPerKg', { header: 'Frete/Kg Líquido', cell: (info) => formatCurrency(info.getValue()) }),
      columnHelper.accessor('transportCost', { header: 'Custo Transporte', cell: (info) => formatCurrency(info.getValue()) }),
      columnHelper.accessor('operationalCost', { header: 'Custo Operacional', cell: (info) => formatCurrency(info.getValue()) }),
      columnHelper.accessor('logisticsIndex', { header: 'Índice Logístico', cell: (info) => formatPercent(info.getValue()) }),
    ],
    [],
  );

  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting, globalFilter, expanded },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 100 } },
  });

  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 8,
  });

  if (invoices.length === 0) {
    return <EmptyState title="Sem NFs no filtro atual" description="A tabela inteligente será recomposta assim que houver notas dentro dos filtros globais." />;
  }

  return (
    <section className="glass-panel rounded-3xl p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">Análise Detalhada NF</h2>
          <p className="mt-1 text-sm text-slate-400">Busca, filtros globais, paginação, ordenação, expansão e virtualização.</p>
        </div>
        <label className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Buscar na tabela"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-signal-blue/60"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-[1900px] text-left text-sm">
            <thead className="bg-white/[0.05] text-xs uppercase tracking-wider text-slate-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <SortableHeader key={header.id} header={header} />
                  ))}
                </tr>
              ))}
            </thead>
          </table>
          <div ref={parentRef} className="max-h-[590px] overflow-auto">
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    className="absolute left-0 min-w-[1900px] border-b border-white/5 transition hover:bg-signal-blue/10"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedInvoice(row.original)}
                      className="grid cursor-pointer grid-cols-[42px_90px_220px_150px_70px_210px_170px_190px_130px_130px_130px_150px_150px_160px_160px_150px_170px] items-center"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <div key={cell.id} className="truncate px-4 py-4 text-slate-300">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}
                    </div>
                    {row.getIsExpanded() ? (
                      <div className="grid grid-cols-6 gap-3 bg-white/[0.025] px-14 py-4 text-xs text-slate-400">
                        <MiniMetric label="CTE1" value={formatCurrency(row.original.transport.cte1)} />
                        <MiniMetric label="CTE2" value={formatCurrency(row.original.transport.cte2)} />
                        <MiniMetric label="Adicional" value={formatCurrency(row.original.transport.additionalValue)} />
                        <MiniMetric label="Armazenagem" value={formatCurrency(row.original.operational.storage)} />
                        <MiniMetric label="Movimentação" value={formatCurrency(row.original.operational.handling)} />
                        <MiniMetric label="TransferÃªncia" value={formatCurrency(row.original.operational.transfer)} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
        <div>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40">
            Anterior
          </button>
          <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40">
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-graphite-950/40 px-3 py-2">
      <div className="text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}

function SortableHeader({ header }: { header: Header<EnrichedInvoice, unknown> }) {
  const sorted = header.column.getIsSorted();

  return (
    <th
      style={{ width: header.getSize() }}
      className="cursor-pointer select-none px-4 py-3"
      onClick={header.column.getToggleSortingHandler()}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      <span className="ml-1 text-signal-amber">{sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : ''}</span>
    </th>
  );
}
