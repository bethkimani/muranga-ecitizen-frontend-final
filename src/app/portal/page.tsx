'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  ArrowRightIcon, BookOpenIcon, ChevronRightIcon, FilePlus2Icon, FolderOpenIcon,
  InboxIcon, LifeBuoyIcon, RefreshCwIcon, SearchCheckIcon, WifiOffIcon,
} from 'lucide-react';
import { getMyRequests, type ApiRequest } from '@/api/requests';
import { displayName } from '@/api/auth';
import { useCurrentUser } from '@/components/RequireRole';
import { useLookups } from '@/hooks/useLookups';
import { StatusBadge } from '@/components/StatusBadge';
import { RequestSummaryCard } from '@/components/RequestSummaryCard';
import { EmptyState, Skeleton } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
import { formatDate, greeting, relativeTime } from '@/utils/format';

type Event = ApiRequest['timeline'][number];

const latestEvent = (r: ApiRequest): Event | undefined =>
  [...r.timeline].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

export default function PortalDashboardPage() {
  const user = useCurrentUser();
  const lookups = useLookups();

  const [items, setItems] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getMyRequests());
    } catch (err) {
      setError(errorMessage(err, 'We could not load your dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((r) => r.status === 'Pending').length,
      progress: items.filter((r) => r.status === 'In Progress').length,
      resolved: items.filter((r) => r.status === 'Resolved').length,
      rejected: items.filter((r) => r.status === 'Rejected').length,
    }),
    [items],
  );

  const chart = [
    { name: 'Pending', value: counts.pending, color: '#C98212' },
    { name: 'In Progress', value: counts.progress, color: '#2563EB' },
    { name: 'Resolved', value: counts.resolved, color: '#16834A' },
    { name: 'Rejected', value: counts.rejected, color: '#8A938C' },
  ];

  const stats = [
    { label: 'Total requests', value: counts.total, accent: 'text-ink' },
    { label: 'Pending', value: counts.pending, accent: 'text-warning-ink' },
    { label: 'In progress', value: counts.progress, accent: 'text-info' },
    { label: 'Resolved', value: counts.resolved, accent: 'text-success' },
  ];

  const recent = useMemo(
    () => [...items].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)).slice(0, 5),
    [items],
  );

  const featured = useMemo(
    () =>
      [...items]
        .filter((r) => r.status === 'In Progress')
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0],
    [items],
  );
  const featuredEvent = featured ? latestEvent(featured) : undefined;

  const updates = useMemo(
    () =>
      items
        .flatMap((r) => r.timeline.map((e) => ({ ...e, requestId: r.id, ref: r.ref_number })))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 3),
    [items],
  );

  const firstName = (displayName(user) || '').split(' ')[0];

  return (
    <div className="mx-auto max-w-[1400px]">
      <section className="flex flex-col gap-5 rounded-2xl bg-brand-dark p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1.5 text-white/80">
            Welcome to your public service dashboard. What would you like to report today?
          </p>
        </div>
        <Link
          href="/portal/submit"
          className="btn h-12 bg-gold px-6 text-[15px] text-ink hover:bg-[#E2B946] inline-flex items-center gap-2"
        >
          <FilePlus2Icon className="h-5 w-5" aria-hidden="true" /> Submit New Request
        </Link>
      </section>

      {error ? (
        <div className="card mt-6">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load your dashboard"
            body={`${error} Your requests are safe — this only affects what’s shown here.`}
            action={
              <button type="button" className="btn-primary" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white p-5">
                <dt className="text-sm font-medium text-muted">{s.label}</dt>
                <dd className={`mt-2 text-3xl font-extrabold ${s.accent}`}>
                  {loading ? <Skeleton className="h-9 w-12" /> : s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              {featured && (
                <Link
                  href={`/portal/requests/${featured.id}`}
                  className="group block rounded-2xl border border-brand/30 bg-white p-5 transition-shadow duration-150 hover:shadow-pop"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-brand">Latest update on your request</p>
                    <span className="text-xs text-muted">
                      {relativeTime(featuredEvent?.created_at ?? featured.updated_at)}
                    </span>
                  </div>
                  <p className="mt-2 font-bold text-ink">{featuredEvent?.title ?? featured.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {featuredEvent?.body ?? featured.status_note ?? ''}
                  </p>
                  <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand">
                    {featured.ref_number} · View timeline{' '}
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </p>
                </Link>
              )}

              <section className="card overflow-hidden" aria-labelledby="recent">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h2 id="recent" className="font-bold text-ink">Recent requests</h2>
                  <Link href="/portal/requests" className="text-sm font-semibold text-brand hover:text-brand-dark">
                    View all
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3 p-5">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <EmptyState
                    icon={InboxIcon}
                    title="No requests yet"
                    body="When you report an issue, you’ll be able to follow its progress here."
                    action={
                      <Link href="/portal/submit" className="btn-primary inline-flex items-center gap-2">
                        <FilePlus2Icon className="h-4 w-4" /> Report your first issue
                      </Link>
                    }
                  />
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-sm">
                        <thead className="bg-canvas text-left text-xs font-semibold text-muted">
                          <tr>
                            <th className="px-5 py-3">Reference</th>
                            <th className="px-3 py-3">Service</th>
                            <th className="px-3 py-3">Submitted</th>
                            <th className="px-3 py-3">Location</th>
                            <th className="px-3 py-3">Department</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {recent.map((r) => (
                            <tr key={r.id} className="transition-colors duration-150 hover:bg-canvas/60">
                              <td className="px-5 py-3.5 font-mono text-xs font-semibold text-ink">{r.ref_number}</td>
                              <td className="px-3 py-3.5 text-ink">{lookups.categoryName(r.category)}</td>
                              <td className="whitespace-nowrap px-3 py-3.5 text-muted">{formatDate(r.submitted_at)}</td>
                              <td className="px-3 py-3.5 text-muted">{r.ward}</td>
                              <td className="px-3 py-3.5 text-muted">
                                {lookups.departmentName(r.assigned_department) ?? (
                                  <span className="italic">Awaiting assignment</span>
                                )}
                              </td>
                              <td className="px-3 py-3.5"><StatusBadge status={r.status} /></td>
                              <td className="px-5 py-3.5 text-right">
                                <Link
                                  href={`/portal/requests/${r.id}`}
                                  className="inline-flex items-center gap-0.5 whitespace-nowrap font-semibold text-brand hover:text-brand-dark"
                                >
                                  View <ChevronRightIcon className="h-4 w-4" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid gap-3 p-4 md:hidden">
                      {recent.slice(0, 3).map((r) => (
                        <RequestSummaryCard key={r.id} r={r} categoryName={lookups.categoryName(r.category)} />
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>

            <aside className="min-w-0 space-y-6">
              <section className="card p-5" aria-labelledby="dist">
                <h2 id="dist" className="font-bold text-ink">Status of my requests</h2>
                {loading ? (
                  <Skeleton className="mx-auto mt-4 h-40 w-40 rounded-full" />
                ) : items.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">Your status breakdown will appear after your first request.</p>
                ) : (
                  <div className="mt-2 flex items-center gap-4">
                    <div className="relative h-36 w-36 shrink-0">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={chart} dataKey="value" innerRadius={44} outerRadius={64} paddingAngle={2} stroke="none">
                            {chart.map((c) => (
                              <Cell key={c.name} fill={c.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E1E7E3', fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-ink">{counts.total}</span>
                        <span className="text-[11px] text-muted">total</span>
                      </div>
                    </div>
                    <ul className="min-w-0 flex-1 space-y-2 text-sm">
                      {chart.map((c) => (
                        <li key={c.name} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-muted">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                            {c.name}
                          </span>
                          <span className="font-bold text-ink">{c.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <section className="card" aria-labelledby="notes">
                <div className="px-5 pt-5">
                  <h2 id="notes" className="font-bold text-ink">Recent updates</h2>
                </div>
                {loading ? (
                  <div className="space-y-3 p-5">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : updates.length === 0 ? (
                  <p className="px-5 pb-5 pt-2 text-sm text-muted">
                    Official updates on your requests will appear here.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-line">
                    {updates.map((n) => (
                      <li key={`${n.requestId}-${n.id}`}>
                        <Link
                          href={`/portal/requests/${n.requestId}`}
                          className="flex gap-3 px-5 py-3 hover:bg-canvas/60"
                        >
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink">{n.title}</p>
                            <p className="text-xs text-muted">
                              {n.ref} · {relativeTime(n.created_at)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card p-5" aria-labelledby="quick">
                <h2 id="quick" className="font-bold text-ink">Quick actions</h2>
                <ul className="mt-3 space-y-1">
                  {[
                    { to: '/portal/track', icon: SearchCheckIcon, label: 'Track a request by reference' },
                    { to: '/portal/requests', icon: FolderOpenIcon, label: 'See all my requests' },
                    { to: '/portal/services', icon: BookOpenIcon, label: 'Browse the service directory' },
                    { to: '/portal/help', icon: LifeBuoyIcon, label: 'Get help or contact support' },
                  ].map((q) => {
                    const Icon = q.icon;
                    return (
                      <li key={q.to}>
                        <Link
                          href={q.to}
                          className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas"
                        >
                          <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
                          {q.label}
                          <ChevronRightIcon className="ml-auto h-4 w-4 text-muted" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}