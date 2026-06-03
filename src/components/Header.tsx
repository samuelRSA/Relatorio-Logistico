import { Activity, Database, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDashboardData } from '@/context/useDashboardData';
import type { NavigationItem, PageId } from '@/types/navigation';
import { formatCurrency, formatPercent } from '@/utils/formatters';

interface HeaderProps {
  activePage: PageId;
  navigation: NavigationItem[];
}

export function Header({ activePage, navigation }: HeaderProps) {
  const { indicators, filteredInvoices } = useDashboardData();
  const filteredCount = filteredInvoices.length;
  const current = navigation.find((item) => item.id === activePage);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-graphite-950/72 px-8 py-5 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-signal-blue">
            Logistic Intelligence Center
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white">{current?.label}</h1>
          <p className="mt-1 text-sm text-slate-400">{current?.description}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <HeaderMetric icon={Database} label="NFs filtradas" value={String(filteredCount)} />
          <HeaderMetric icon={Activity} label="Resultado" value={formatCurrency(indicators.logisticsResult)} />
          <HeaderMetric icon={Moon} label="Índice" value={formatPercent(indicators.logisticsIndex)} />
        </div>
      </div>
    </header>
  );
}

interface HeaderMetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function HeaderMetric({ icon: Icon, label, value }: HeaderMetricProps) {
  return (
    <div className="glass-panel min-w-40 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon className="h-4 w-4 text-signal-amber" />
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
