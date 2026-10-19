'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2Icon, MapPinIcon, SearchIcon, SearchXIcon } from 'lucide-react';
import { requests } from '@/data/requests';
import { categories } from '@/data/categories';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusStepper } from '@/components/StatusStepper';
import { formatDate, relativeTime } from '@/utils/format';
import type { ServiceRequest } from '@/types/request';

export default function TrackPage() {
  const [ref, setRef] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'found' | 'missing' | 'invalid'>('idle');
  const [result, setResult] = useState<ServiceRequest | null>(null);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const v = ref.trim().toUpperCase();
    if (!/^MCG-\d{4}-\d{6}$/.test(v)) return setState('invalid');
    setState('loading');
    setTimeout(() => {
      const r = requests.find((x) => x.ref === v);
      setResult(r ?? null);
      setState(r ? 'found' : 'missing');
    }, 600);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 md:py-20">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Track a request</h1>
      <p className="mt-2 text-muted">
        Enter the reference number you received when you submitted your request. No sign-in needed.
      </p>
      
      <form onSubmit={search} className="mt-6 flex flex-col gap-2 sm:flex-row" noValidate>
        <label className="relative flex-1">
          <span className="sr-only">Request reference</span>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            value={ref}
            onChange={(e) => {
              setRef(e.target.value);
              if (state === 'invalid') setState('idle');
            }}
            placeholder="MCG-2026-004812"
            className={`field h-12 pl-11 font-mono text-base uppercase ${state === 'invalid' ? 'field-error' : ''}`}
            aria-invalid={state === 'invalid'}
            aria-describedby="ref-help"
          />
        </label>
        <button className="btn-primary h-12 px-6" disabled={state === 'loading'}>
          {state === 'loading' ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null} Track
        </button>
      </form>
      
      <p
        id="ref-help"
        className={`mt-2 text-xs ${state === 'invalid' ? 'font-medium text-danger' : 'text-muted'}`}
        role={state === 'invalid' ? 'alert' : undefined}
      >
        {state === 'invalid'
          ? 'That doesn’t look like a reference. It should look like MCG-2026-004812.'
          : 'Try the demo reference MCG-2026-004812.'}
      </p>

      <div aria-live="polite">
        {state === 'missing' && (
          <div className="card mt-8 flex flex-col items-center p-8 text-center">
            <SearchXIcon className="h-8 w-8 text-muted" aria-hidden="true" />
            <h2 className="mt-3 font-bold text-ink">No request found</h2>
            <p className="mt-1 text-sm text-muted">
              Check the reference for typos. References are shown on your confirmation screen and in your notifications.
            </p>
          </div>
        )}

        {state === 'found' && result && (
          <div className="card mt-8 overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div>
                <p className="font-mono text-xs font-semibold text-muted">{result.ref}</p>
                <h2 className="mt-1 font-bold text-ink">
                  {categories.find((c) => c.id === result.category)?.name} · {result.subcategory}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {result.ward}, {result.subCounty}
                </p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div className="p-5">
              <StatusStepper status={result.status} />
            </div>

            <dl className="grid grid-cols-3 gap-4 border-t border-line bg-canvas/60 p-5 text-sm">
              <div>
                <dt className="text-muted">Submitted</dt>
                <dd className="font-semibold text-ink">{formatDate(result.submitted)}</dd>
              </div>
              <div>
                <dt className="text-muted">Department</dt>
                <dd className="font-semibold text-ink">{result.department ?? 'Pending'}</dd>
              </div>
              <div>
                <dt className="text-muted">Last update</dt>
                <dd className="font-semibold text-ink">{relativeTime(result.updated)}</dd>
              </div>
            </dl>

            <div className="border-t border-line p-5 text-sm text-muted">
              For full updates and to message the department,{' '}
              <Link href="/signin" className="font-semibold text-brand">
                sign in to your account
              </Link>
              .
            </div>
          </div>
        )}
      </div>
    </div>
  );
}