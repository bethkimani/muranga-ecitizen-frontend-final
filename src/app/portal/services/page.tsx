'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon, Building2Icon, ClockIcon, RefreshCwIcon,
  SearchIcon, SearchXIcon, WifiOffIcon,
} from 'lucide-react';
import { useLookups } from '@/hooks/useLookups';
import { categoryIcon } from '@/utils/categoryIcon';
import { EmptyState, Skeleton } from '@/components/ui';

export default function PortalServicesPage() {
  const lookups = useLookups();
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();

  const rows = lookups.categories.map((c) => ({
    ...c,
    departmentLabel: lookups.departments.find((d) => d.id === c.department)?.name ?? '',
  }));

  const list = rows.filter((c) =>
    [c.name, c.description, c.departmentLabel].join(' ').toLowerCase().includes(needle),
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">Service directory</h1>
          <p className="mt-1 text-muted">
            Find the right service, the department responsible and its response target.
          </p>
        </div>
        <label className="relative md:w-80">
          <span className="sr-only">Search services</span>
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. water, roads, waste"
            className="field h-11"
            style={{ paddingLeft: 36 }}
          />
        </label>
      </div>

      {lookups.loading ? (
        <div className="card mt-8 space-y-4 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : lookups.error ? (
        <div className="card mt-8">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load the services"
            body={lookups.error}
            action={
              <button type="button" className="btn-primary" onClick={lookups.reload}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="card mt-8">
          <EmptyState
            icon={SearchXIcon}
            title={q ? `No services match “${q}”` : 'No services available'}
            body={q ? 'Try a simpler word.' : 'Services will appear here once the county adds them.'}
          />
        </div>
      ) : (
        <ul className="card mt-8 divide-y divide-line">
          {list.map((c) => {
            const Icon = categoryIcon(c.name);
            return (
              <li key={c.id} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_auto] md:items-center md:p-6">
                <div className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-bold text-ink">{c.name}</h2>
                    {c.description && <p className="mt-0.5 text-sm text-muted">{c.description}</p>}
                  </div>
                </div>

                <dl className="space-y-1.5 text-sm">
                  {c.departmentLabel && (
                    <div className="flex items-center gap-2">
                      <Building2Icon className="h-4 w-4 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Department</dt>
                      <dd className="font-medium text-ink">{c.departmentLabel}</dd>
                    </div>
                  )}
                  {c.responseTarget && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Response target</dt>
                      <dd className="text-muted">
                        First response within <span className="font-semibold text-ink">{c.responseTarget}</span>
                      </dd>
                    </div>
                  )}
                </dl>

                <Link href={`/portal/submit?category=${c.id}`} className="btn-secondary">
                  Report <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}