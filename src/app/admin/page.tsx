'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowRightIcon, CalendarIcon, ChevronRightIcon, DownloadIcon, InboxIcon, RefreshCwIcon, WifiOffIcon,
} from 'lucide-react';
import { getAllRequests } from '@/api/adminRequests';
import type { ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { ChartCard, Legend, chartColors, tooltipStyle } from '@/components/ChartCard';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui';
import { errorMessage } from '@/utils/errors';

const DAY = 86_400_000;
const OPEN = (r: ApiRequest) => r.status !== 'Resolved' && r.status !== 'Rejected';

function startOf(range: string): Date {
  const d = new Date();
  if (range === '30d') d.setDate(d.getDate() - 30);
  else if (range === '90d') d.setDate(d.getDate() - 90);
  else if (range === '6m') d.setMonth(d.getMonth() - 6);
  else return new Date(d.getFullYear(), 0, 1);
  return d;
}

function avgDays(list: ApiRequest[]): number | null {
  const done = list.filter((r) => r.status === 'Resolved');
  if (done.length === 0) return null;
  const total = done.reduce((s, r) => s + (new Date(r.updated_at).getTime() - new Date(r.submitted_at).getTime()), 0);
  return Math.round((total / done.length / DAY) * 10) / 10;
}

// Optional field: only used if your API returns a deadline for each request.
const slaOf = (r: ApiRequest): number | null => {
  const v = (r as unknown as Record<string, unknown>).sla_due;
  return typeof v === 'string' && v ? new Date(v).getTime() : null;
};

function csvCell(v: unknown) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

export default function AdminOverviewPage() {
  const lookups = useLookups();
  const [all, setAll] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('6m');
  const [dept, setDept] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAll(await getAllRequests());
    } catch (err) {
      setError(errorMessage(err, 'We could not load the requests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deptOf = useCallback(
    (r: ApiRequest) => {
      const c = lookups.categories.find((x) => String(x.id) === String(r.category));
      return c ? String(c.department ?? '') : '';
    },
    [lookups.categories],
  );
  const deptName = useCallback(
    (id: string) => lookups.departments.find((d) => String(d.id) === id)?.name ?? 'Unassigned',
    [lookups.departments],
  );

  const data = useMemo(() => {
    const now = Date.now();
    const start = startOf(range);
    const span = now - start.getTime();
    const prevStart = start.getTime() - span;
    const byDept = (r: ApiRequest) => !dept || deptOf(r) === dept;

    const inRange = all.filter((r) => byDept(r) && new Date(r.submitted_at) >= start);
    const prev = all.filter((r) => {
      const t = new Date(r.submitted_at).getTime();
      return byDept(r) && t >= prevStart && t < start.getTime();
    });

    const hasSla = all.some((r) => slaOf(r) !== null);
    const overdue = inRange.filter((r) => OPEN(r) && slaOf(r) !== null && (slaOf(r) as number) < now);

    const avg = avgDays(inRange);
    const prevAvg = avgDays(prev);

    // Volume per month
    const months: { key: string; label: string; received: number; resolved: number }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    while (cursor <= endMonth) {
      months.push({
        key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
        label: cursor.toLocaleString('en', { month: 'short' }),
        received: 0,
        resolved: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const keyOf = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}`;
    };
    inRange.forEach((r) => {
      const m = months.find((x) => x.key === keyOf(r.submitted_at));
      if (m) m.received += 1;
      if (r.status === 'Resolved') {
        const mr = months.find((x) => x.key === keyOf(r.updated_at));
        if (mr) mr.resolved += 1;
      }
    });

    // Workload per department
    const map = new Map<string, { name: string; open: number; overdue: number }>();
    inRange.filter(OPEN).forEach((r) => {
      const id = deptOf(r);
      const row = map.get(id) ?? { name: deptName(id), open: 0, overdue: 0 };
      row.open += 1;
      const s = slaOf(r);
      if (s !== null && s < now) row.overdue += 1;
      map.set(id, row);
    });
    const workload = Array.from(map.values()).sort((a, b) => b.open - a.open).slice(0, 8);

    // Needs attention
    const attention = (hasSla ? overdue : inRange.filter(OPEN))
      .slice()
      .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
      .slice(0, 8);

    return {
      inRange, hasSla, overdueCount: overdue.length, avg, prevAvg, months, workload, attention,
      counts: {
        total: inRange.length,
        pending: inRange.filter((r) => r.status === 'Pending').length,
        inProgress: inRange.filter((r) => r.status === 'In Progress').length,
        resolved: inRange.filter((r) => r.status === 'Resolved').length,
      },
    };
  }, [all, range, dept, deptOf, deptName]);

  const exportCsv = () => {
    const head = ['Reference', 'Title', 'Status', 'Category', 'Ward', 'Sub-county', 'Submitted', 'Last updated'];
    const rows = data.inRange.map((r) => [
      r.ref_number, r.title, r.status, lookups.categoryName(r.category), r.ward, r.sub_county, r.submitted_at, r.updated_at,
    ]);
    const csv = [head, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const n = (v: number) => v.toLocaleString('en-US');
  const volume = [
    { label: 'Total requests', value: n(data.counts.total), tone: 'text-ink' },
    { label: 'Pending', value: n(data.counts.pending), tone: 'text-warning-ink' },
    { label: 'In progress', value: n(data.counts.inProgress), tone: 'text-info' },
    { label: 'Resolved', value: n(data.counts.resolved), tone: 'text-success' },
  ];
  const delta = data.avg !== null && data.prevAvg !== null ? Math.round((data.avg - data.prevAvg) * 10) / 10 : null;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="County service overview"
        description="How requests are flowing across departments."
        actions={
          <>
            <label className="relative">
              <span className="sr-only">Date range</span>
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <select value={range} onChange={(e) => setRange(e.target.value)} className="field h-10 w-44" style={{ paddingLeft: 36 }}>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="6m">Last 6 months</option>
                <option value="ytd">Year to date</option>
              </select>
            </label>
            <select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} className="field h-10 w-48">
              <option value="">All departments</option>
              {lookups.departments.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
            <button type="button" onClick={exportCsv} disabled={loading || data.inRange.length === 0} className="btn-secondary h-10">
              <DownloadIcon className="h-4 w-4" /> Export
            </button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load the overview"
            body={error}
            action={
              <button type="button" className="btn-primary" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_2fr]">
            <Link
              href="/admin/requests"
              className="group rounded-2xl bg-danger p-5 text-white transition-[background-color] duration-150 hover:bg-[#a51f1f]"
            >
              <p className="text-sm font-semibold text-white/85">Overdue requests</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight">{data.hasSla ? data.overdueCount : '—'}</p>
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-white/90">
                {data.hasSla ? 'Review now' : 'No deadlines set yet'}{' '}
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </p>
            </Link>

            <div className="rounded-2xl bg-brand-dark p-5 text-white">
              <p className="text-sm font-semibold text-white/80">Average resolution time</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight">
                {data.avg ?? '—'}
                {data.avg !== null && <span className="ml-1 text-xl font-bold text-white/70">days</span>}
              </p>
              <p className="mt-2 text-sm text-gold">
                {delta === null
                  ? 'No resolved requests to compare yet'
                  : delta === 0
                  ? 'Same as previous period'
                  : `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta)} days vs previous period`}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {volume.map((v) => (
                <div key={v.label} className="bg-white p-5">
                  <dt className="text-sm font-medium text-muted">{v.label}</dt>
                  <dd className={`mt-1 text-2xl font-extrabold ${v.tone}`}>{v.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <ChartCard title="Request volume" description="Received vs resolved per month">
              <Legend items={[{ label: 'Received', color: chartColors.gold }, { label: 'Resolved', color: chartColors.green }]} />
              <div className="mt-3 h-64">
                <ResponsiveContainer>
                  <AreaChart data={data.months} margin={{ left: -16, right: 8, top: 8 }}>
                    <CartesianGrid stroke={chartColors.grid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: chartColors.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: chartColors.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Area type="monotone" dataKey="received" name="Received" stroke={chartColors.gold} strokeWidth={2} fill={chartColors.gold} fillOpacity={0.12} />
                    <Area type="monotone" dataKey="resolved" name="Resolved" stroke={chartColors.green} strokeWidth={2} fill={chartColors.green} fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Department workload" description={data.hasSla ? 'Open and overdue cases' : 'Open cases'}>
              <Legend
                items={[
                  { label: 'Open', color: chartColors.green },
                  ...(data.hasSla ? [{ label: 'Overdue', color: chartColors.red }] : []),
                ]}
              />
              <div className="mt-3 h-64">
                {data.workload.length === 0 ? (
                  <p className="pt-16 text-center text-sm text-muted">No open requests in this period.</p>
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={data.workload} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <CartesianGrid stroke={chartColors.grid} horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: chartColors.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fill: chartColors.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} cursor={{ fill: '#F5F7F5' }} />
                      <Bar dataKey="open" name="Open" stackId="a" fill={chartColors.green} barSize={14} />
                      {data.hasSla && <Bar dataKey="overdue" name="Overdue" stackId="a" fill={chartColors.red} radius={[0, 4, 4, 0]} barSize={14} />}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <section className="card mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-bold text-ink">Needs attention</h2>
                <p className="text-sm text-muted">
                  {data.hasSla ? 'Open requests past their service deadline' : 'Open requests waiting the longest'}
                </p>
              </div>
              <Link href="/admin/requests" className="text-sm font-semibold text-brand">All requests</Link>
            </div>

            {data.attention.length === 0 ? (
              <EmptyState icon={InboxIcon} title="Nothing needs attention" body="No open requests in this period." />
            ) : (
              <ul className="divide-y divide-line">
                {data.attention.map((r) => {
                  const waiting = Math.floor((Date.now() - new Date(r.submitted_at).getTime()) / DAY);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/officer/cases/${r.id}`}
                        className="grid gap-2 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas/70 md:grid-cols-[150px_1fr_180px_120px_110px_20px] md:items-center md:gap-4"
                      >
                        <span className="font-mono text-xs font-semibold text-muted">{r.ref_number}</span>
                        <span className="truncate text-sm font-semibold text-ink">{r.title}</span>
                        <span className="truncate text-sm text-muted">{deptName(deptOf(r))}</span>
                        <StatusBadge status={r.status} />
                        <span className="text-xs font-semibold text-danger">{waiting} days waiting</span>
                        <ChevronRightIcon className="hidden h-4 w-4 text-muted md:block" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}