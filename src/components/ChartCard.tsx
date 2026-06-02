import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className = '' }: ChartCardProps) {
  return (
    <section className={`glass-panel rounded-3xl p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}
