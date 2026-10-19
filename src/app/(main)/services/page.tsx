'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, Building2Icon, ClockIcon, SearchIcon, SearchXIcon } from 'lucide-react';
import { categories } from '@/data/categories';
import { EmptyState } from '@/components/ui';

export default function ServicesPage() {
  const [q, setQ] = useState('');
  const list = categories.filter((c) =>
    [c.name, c.description, c.department, ...c.subcategories].join(' ').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">Service directory</h1>
          <p className="mt-1 text-muted">Find the right service, the department responsible and its response target.</p>
        </div>
        <label className="relative md:w-80">
          <span className="sr-only">Search services</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. pothole, sewer, noise"
            className="field h-11 pl-9"
          />
        </label>
      </div>

      {list.length === 0 ? (
        <div className="card mt-8">
          <EmptyState
            icon={SearchXIcon}
            title={`No services match “${q}”`}
            body="Try a simpler word, or choose “Other Public Services” and we’ll route it for you."
          />
        </div>
      ) : (
        <ul className="card mt-8 divide-y divide-line">
          {list.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.id} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_auto] md:items-center md:p-6">
                <div className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-bold text-ink">{c.name}</h2>
                    <p className="mt-0.5 text-sm text-muted">{c.description}</p>
                    <p className="mt-2 text-xs text-muted">{c.subcategories.join(' · ')}</p>
                  </div>
                </div>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2Icon className="h-4 w-4 text-muted" aria-hidden="true" />
                    <dt className="sr-only">Department</dt>
                    <dd className="font-medium text-ink">{c.department}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                    <dt className="sr-only">Response target</dt>
                    <dd className="text-muted">
                      First response within <span className="font-semibold text-ink">{c.responseTarget}</span>
                    </dd>
                  </div>
                </dl>
                <Link href={`/portal/submit?category=${c.id}`} className="btn-secondary">
                  Report <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">Response targets are configurable by administrators and shown here as examples.</p>
    </div>
  );
}