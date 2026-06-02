import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  helper: string;
  accent: string;
  icon: LucideIcon;
  onClick?: () => void;
  trendLabel?: string;
  tooltip?: string;
}

export function KpiCard({ title, value, helper, accent, icon: Icon, onClick, trendLabel, tooltip }: KpiCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={tooltip ?? helper}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="glass-panel group min-h-32 rounded-3xl p-5 text-left transition hover:border-white/20 hover:shadow-[0_28px_80px_rgba(101,183,255,.16)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <div className="mt-4 font-display text-2xl font-semibold text-white">{value}</div>
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-signal-blue to-signal-amber transition group-hover:w-5/6" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs text-slate-400">{helper}</p>
        {trendLabel ? (
          <span className="shrink-0 rounded-full border border-signal-mint/20 bg-signal-mint/10 px-2 py-1 text-[11px] font-semibold text-signal-mint">
            {trendLabel}
          </span>
        ) : null}
      </div>
      {onClick ? (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-signal-blue transition group-hover:text-white">
          Ver detalhes
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </motion.button>
  );
}
