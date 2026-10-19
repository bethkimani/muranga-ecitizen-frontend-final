import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon, MapPinIcon } from 'lucide-react';
import type { ApiRequest } from '@/api/requests';
import { StatusBadge } from '@/components/StatusBadge';
import { relativeTime } from '@/utils/format';

export function RequestSummaryCard({
  r,
  categoryName,
}: {
  r: ApiRequest;
  categoryName: string;
}) {
  return (
    <Link
      href={`/portal/requests/${r.id}`}
      className="group block rounded-2xl border border-line bg-white p-4 transition-shadow duration-150 hover:shadow-pop"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-muted">{r.ref_number}</span>
        <StatusBadge status={r.status} />
      </div>
      <h3 className="mt-2 line-clamp-2 font-bold text-ink">{r.title}</h3>
      <p className="mt-1 text-sm text-muted">{categoryName}</p>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <MapPinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{r.ward}, {r.sub_county}</span>
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
        <span className="text-muted">Updated {relativeTime(r.updated_at)}</span>
        <span className="inline-flex items-center font-semibold text-brand">
          View <ChevronRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}