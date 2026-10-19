'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon, Building2Icon, CalendarIcon, ClockIcon, InfoIcon,
  MapPinIcon, RefreshCwIcon, UserIcon, WifiOffIcon,
} from 'lucide-react';
import { getMyRequests, getRequest, type ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { EmptyState, Skeleton } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusStepper } from '@/components/StatusStepper';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { MapPicker } from '@/components/submit/MapPicker';
import { categoryIcon } from '@/utils/categoryIcon';
import { parseCoords } from '@/utils/coords';
import { errorMessage, isNotFound } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';
import type { TimelineEvent } from '@/types/request';

async function fetchOne(param: string): Promise<ApiRequest> {
  if (/^\d+$/.test(param)) return getRequest(param);
  // A reference number in the URL: find it among the user's own requests
  const all = await getMyRequests();
  const hit = all.find((x) => x.ref_number === param);
  if (!hit) throw Object.assign(new Error('Not found'), { status: 404 });
  return hit;
}

export default function RequestDetailPage() {
  const params = useParams();
  const param = decodeURIComponent((params?.ref as string) ?? '');
  const lookups = useLookups();

  const [r, setR] = useState<ApiRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      setR(await fetchOne(param));
    } catch (err) {
      if (isNotFound(err)) setNotFound(true);
      else setError(errorMessage(err, 'We could not load this request.'));
    } finally {
      setLoading(false);
    }
  }, [param]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <h1 className="text-2xl font-bold text-ink">Request not found</h1>
        <p className="mt-2 text-muted">
          We couldn’t find a request of yours matching <span className="font-mono font-semibold">{param}</span>.
        </p>
        <Link href="/portal/requests" className="btn-primary mt-6 inline-flex">
          Back to my requests
        </Link>
      </div>
    );
  }

  if (error || !r) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load this request"
            body={error || 'Please try again.'}
            action={
              <button type="button" className="btn-primary" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const cat = lookups.findCategory(r.category);
  const catName = cat?.name ?? lookups.categoryName(r.category);
  const CatIcon = categoryIcon(catName);
  const dept = lookups.departmentName(r.assigned_department);
  const pin = parseCoords(r.coordinates);

  const events: TimelineEvent[] = r.timeline.length
    ? r.timeline.map((e) => ({
        id: String(e.id),
        date: e.created_at,
        title: e.title,
        body: e.body,
        author: e.author_name,
        kind: e.kind as TimelineEvent['kind'],
      }))
    : [
        {
          id: 'submitted',
          date: r.submitted_at,
          title: 'Request submitted',
          body: `Your request was received and given reference ${r.ref_number}.`,
          author: 'Portal',
          kind: 'submitted' as TimelineEvent['kind'],
        },
      ];

  const upcoming =
    r.status === 'Pending'
      ? ['Assigned to department', 'Work in progress', 'Resolved']
      : r.status === 'In Progress'
      ? ['Resolved']
      : [];

  const details = [
    { icon: CatIcon, k: 'Service', v: catName },
    {
      icon: MapPinIcon,
      k: 'Location',
      v: `${r.landmark}\n${r.ward} Ward, ${r.sub_county} Sub-county${r.coordinates ? `\n${r.coordinates}` : ''}`,
    },
    { icon: Building2Icon, k: 'Assigned department', v: dept ?? 'Awaiting assignment' },
    {
      icon: UserIcon,
      k: 'Assigned officer',
      v: r.assigned_officer ? 'An officer has been assigned' : 'Not yet assigned',
    },
    { icon: CalendarIcon, k: 'Submitted', v: formatDateTime(r.submitted_at) },
    { icon: ClockIcon, k: 'Last updated', v: formatDateTime(r.updated_at) },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link
        href="/portal/requests"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" /> My requests
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-muted">{r.ref_number}</span>
          <StatusBadge status={r.status} size="md" />
        </div>
        <h1 className="mt-2 max-w-3xl text-2xl font-extrabold tracking-tight text-ink md:text-[28px]">{r.title}</h1>
      </header>

      <div className="card mt-6 p-5 md:px-8 md:py-6">
        <StatusStepper status={r.status} />
        {r.status === 'Rejected' && r.status_note && (
          <div className="mt-5 flex gap-3 rounded-xl bg-canvas p-4 text-sm text-[#3A433D]">
            <InfoIcon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">Why this request was closed</p>
              <p className="mt-0.5">{r.status_note}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5 md:p-6">
            <h2 className="font-bold text-ink">Description</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-[#3A433D]">{r.description}</p>

            {r.evidence.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-bold text-ink">Uploaded evidence</h3>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {r.evidence.map((e, i) => (
                    <a key={e.id} href={e.image_url} target="_blank" rel="noreferrer">
                      <img
                        src={e.image_url}
                        alt={`Evidence photo ${i + 1} for ${r.title}`}
                        className="aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-line"
                      />
                    </a>
                  ))}
                </div>
              </>
            )}
          </section>

          {pin && (
            <section className="card p-5 md:p-6" aria-labelledby="where">
              <h2 id="where" className="font-bold text-ink">Pinned location</h2>
              <div className="mt-3">
                <MapPicker pin={pin} readOnly />
              </div>
            </section>
          )}

          <section className="card p-5 md:p-6" aria-labelledby="activity">
            <h2 id="activity" className="font-bold text-ink">Activity and official updates</h2>
            <p className="mt-0.5 text-sm text-muted">Updates published by the county appear here.</p>
            <div className="mt-6">
              <ActivityTimeline events={events} upcoming={upcoming} />
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="card p-5">
            <h2 className="font-bold text-ink">Details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              {details.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.k} className="flex gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-muted">{d.k}</dt>
                      <dd className="mt-0.5 whitespace-pre-line break-words font-medium text-ink">{d.v}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="font-bold text-ink">What happens next?</h2>
            <p className="mt-2 leading-relaxed text-muted">
              {r.status === 'Pending' &&
                (cat?.responseTarget
                  ? `The county reviews new requests and aims to respond within ${cat.responseTarget}.`
                  : 'The county reviews new requests and will assign yours to the right department.')}
              {r.status === 'In Progress' &&
                'The department is working on this. You’ll see an update here when it publishes progress or marks the request resolved.'}
              {r.status === 'Resolved' &&
                'The county has marked this request resolved. If the issue returns, submit a new request and mention this reference.'}
              {r.status === 'Rejected' &&
                'This request is closed. You can submit a new request if your circumstances change.'}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}