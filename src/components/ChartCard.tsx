import React from 'react';
import { SampleDataTag } from '@/components/ui';

export const chartColors = {
  green: '#00843D',
  forest: '#075B32',
  gold: '#D4A72C',
  blue: '#2563EB',
  red: '#C62828',
  amber: '#C98212',
  grid: '#E9EEEA',
  axis: '#647067',
};

export const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: '1px solid #E1E7E3',
    fontSize: 12,
    boxShadow: '0 8px 24px -8px rgba(7,91,50,0.2)',
  },
  labelStyle: { fontWeight: 700, color: '#171717' },
};

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function ChartCard({ title, description, children, className = '', actions }: ChartCardProps) {
  return (
    <section className={`card flex flex-col p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-bold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <SampleDataTag />
        </div>
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-xs font-medium text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}