import React from 'react';
import Link from 'next/link';
import { CalendarIcon, ChevronRightIcon, MapPinIcon } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { categories } from '@/data/categories';
import { formatDate, relativeTime } from '@/utils/format';
import type { ServiceRequest } from '@/types/request';

export function RequestCard({ request: r, to }: { request: ServiceRequest; to: string }) {
  const cat = categories.find((c) => c.id === r.category)!;
  const Icon = cat.icon;
  return (
    <Link
      href={to}
      className="group flex h-full flex-col rounded-2xl border border-line bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-brand/40 hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs font-semibold text-muted">{r.ref}</span>
        <StatusBadge status={r.status} />
      </div>
      <h3 className="mt-2 line-clamp-2 font-bold leading-snug text-ink">{r.title}</h3>
      <div className="mt-3 space-y-1.5 text-xs text-muted">
        <p className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {cat.name}
        </p>
        <p className="flex items-center gap-1.5">
          <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {r.ward}, {r.subCounty}
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Submitted {formatDate(r.submitted)}
        </p>
      </div>
      <div className="flex-1" aria-hidden="true" />
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="text-xs text-muted" suppressHydrationWarning>
          Updated {relativeTime(r.updated)}
        </span>
        <span className="flex items-center gap-0.5 text-sm font-semibold text-brand">
          View details{' '}
          <ChevronRightIcon
            className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}