'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRightIcon, Loader2Icon, SearchCheckIcon, SearchXIcon, WifiOffIcon,
} from 'lucide-react';
import { getMyRequests, type ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusStepper } from '@/components/StatusStepper';
import { EmptyState } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';

function TrackRequest() {
  const router = useRouter();
  const params = useSearchParams();
  const lookups = useLookups();
  const refParam = (params.get('ref') ?? '').trim();

  const [input, setInput] = useState(refParam);
  const [result, setResult] = useState<ApiRequest | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async (value: string) => {
    const ref = value.trim().toUpperCase();
    if (!ref) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const all = await getMyRequests();
      setResult(all.find((r) => r.ref_number.toUpperCase() === ref) ?? null);
    } catch (err) {
      setResult(null);
      setError(errorMessage(err, 'We could not look up that reference.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Run automatically when the page is opened with ?ref=...
  useEffect(() => {
    if (refParam) {
      setInput(refParam);
      search(refParam);
    }
  }, [refParam, search]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    router.replace(`/portal/track?ref=${encodeURIComponent(v)}`);
    // If the URL already has this ref, the effect won't re-run, so search directly.
    if (v === refParam) search(v);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-[28px]">Track a request</h1>
      <p className="mt-1 text-muted">
        Enter the reference number you received when you submitted, for example MCG-2026-004812.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 p-4 md:p-5">
        <label htmlFor="track-ref" className="text-sm font-semibold text-ink">
          Reference number
        </label>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
          <input
            id="track-ref"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="MCG-2026-004812"
            autoComplete="off"
            className="field h-11 flex-1 font-mono"
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary h-11 px-6">
            {loading ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" /> Searching…
              </>
            ) : (
              <>
                <SearchCheckIcon className="h-4 w-4" /> Track
              </>
            )}
          </button>
        </div>
      </form>

      {searched && !loading && (
        <div className="mt-6">
          {error ? (
            <div className="card">
              <EmptyState
                icon={WifiOffIcon}
                title="Something went wrong"
                body={error}
                action={
                  <button type="button" className="btn-primary" onClick={() => search(input)}>
                    Try again
                  </button>
                }
              />
            </div>
          ) : !result ? (
            <div className="card">
              <EmptyState
                icon={SearchXIcon}
                title="No request found"
                body="Check the reference number and try again. It starts with MCG- and you can find it on your confirmation page."
              />
            </div>
          ) : (
            <div className="card p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-muted">{result.ref_number}</span>
                <StatusBadge status={result.status} size="md" />
              </div>
              <h2 className="mt-2 text-xl font-extrabold text-ink">{result.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {lookups.categoryName(result.category)} · {result.ward}, {result.sub_county}
              </p>

              <div className="mt-5 border-t border-line pt-5">
                <StatusStepper status={result.status} />
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted">Submitted</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatDateTime(result.submitted_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted">Last updated</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatDateTime(result.updated_at)}</dd>
                </div>
              </dl>

              <Link
                href={`/portal/requests/${result.id}`}
                className="btn-primary mt-6 inline-flex h-11 items-center gap-2"
              >
                View full details <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackRequestPage() {
  return (
    <Suspense fallback={null}>
      <TrackRequest />
    </Suspense>
  );
}