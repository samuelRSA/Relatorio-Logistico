import { memo, useMemo } from 'react';
import { ChartCard } from '@/components/ChartCard';
import type { RankingItem } from '@/types/logistics';
import { formatPercent } from '@/utils/formatters';

function TopCustomersRankingCardComponent({ data }: { data: RankingItem[] }) {
  const maxValue = useMemo(() => Math.max(...data.map((item) => item.value), 0.00001), [data]);

  return (
    <ChartCard
      title="Top 10 Clientes com Maior Índice Logístico"
      description="Ranking por índice logístico (%)"
      className="min-h-[430px]"
    >
      <div className="flex h-full min-h-[340px] flex-col">
        <div className="mb-3 grid grid-cols-[36px_minmax(0,1fr)_minmax(200px,240px)] gap-3 border-b border-white/10 pb-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          <span>#</span>
          <span>Cliente</span>
          <span className="text-right">Índice</span>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          {data.map((item, index) => {
            const width = Math.max((item.value / maxValue) * 100, 6);
            return (
              <div
                key={item.label}
                className="grid grid-cols-[36px_minmax(0,1fr)_minmax(200px,240px)] items-center gap-3 rounded-2xl border border-white/0 px-0 py-1.5 transition hover:border-white/10 hover:bg-white/[0.03]"
              >
                <div className="text-sm font-semibold text-slate-400">{index + 1}</div>
                <div
                  className="min-w-0 text-sm leading-5 text-slate-200"
                  title={item.label}
                  style={{ wordBreak: 'break-word' }}
                >
                  {item.label}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-signal-amber to-signal-coral transition-all duration-300"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="min-w-[56px] text-right text-sm font-semibold text-white">
                    {formatPercent(item.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}

export const TopCustomersRankingCard = memo(TopCustomersRankingCardComponent);
