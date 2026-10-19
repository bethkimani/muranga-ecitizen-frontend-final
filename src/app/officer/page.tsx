'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlarmClockIcon, ChevronRightIcon, InboxIcon, Loader2Icon, MapPinIcon, SearchIcon } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui';
import { useCurrentUser } from '@/components/RequireRole';
import { getMyRequests, type ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { categoryIcon } from '@/utils/categoryIcon';
import { deadlineLabel, dueAt, priorityOf } from '@/utils/deadline';
import { relativeTime } from '@/utils/format';

type Queue = 'assigned' | 'new' | 'priority' | 'deadline' | 'recent';
type BadgeStatus = React.ComponentProps<typeof StatusBadge>['status'];

const DAY = 86_400_000;
const isOpen = (r: ApiRequest) => r.status === 'Pending' || r.status === 'In Progress';

function OfficerWorkspace() {
  const user = useCurrentUser();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lookups = useLookups();

  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState('');
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  });

  const urlQ = params.get('q') ?? '';
  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    let alive = true;
    getMyRequests()
      .then((r) => alive && setRequests(r))
      .catch(() => alive && setLoadError('Could not load cases. Check that the backend is running, then reload.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const target = (r: ApiRequest) =>
    lookups.categories.find((c) => String(c.id) === String(r.category))?.responseTarget;
  const due = (r: ApiRequest) => dueAt(r, target(r));

  const near = (r: ApiRequest) => {
    const d = due(r);
    return isOpen(r) && d !== null && d < Date.now() + 2 * DAY;
  };
  const isPriority = (r: ApiRequest) => isOpen(r) && ['Urgent', 'High'].includes(priorityOf(r));

  const hasPriority = requests.some((r) => priorityOf(r));

  const queues: { id: Queue; label: string; tone?: string; filter: (r: ApiRequest) => boolean }[] = [
    { id: 'assigned', label: 'Assigned to me', filter: (r) => r.assigned_officer === user.id && isOpen(r) },
    { id: 'new', label: 'Awaiting assignment', filter: (r) => r.assigned_officer === null && isOpen(r) },
    ...(hasPriority ? [{ id: 'priority' as Queue, label: 'Priority cases', filter: isPriority }] : []),
    { id: 'deadline', label: 'Near or past deadline', tone: 'text-danger', filter: near },
    { id: 'recent', label: 'Recently updated', filter: () => true },
  ];

  const queueParam = params.get('queue');
  const active: Queue = queues.some((x) => x.id === queueParam) ? (queueParam as Queue) : 'assigned';
  const queue = queues.find((x) => x.id === active) ?? queues[0];
  const searching = urlQ.trim().length > 0;

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    queues.forEach((x) => {
      out[x.id] = x.id === 'recent' ? Math.min(8, requests.length) : requests.filter(x.filter).length;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, lookups.categories, user.id]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = requests
      .filter((r) => searching || queue.filter(r))
      .filter(
        (r) =>
          (!needle || `${r.ref_number} ${r.title} ${r.ward}`.toLowerCase().includes(needle)) &&
          (!cat || String(r.category) === cat),
      );
    if (active === 'deadline' && !searching) {
      out = [...out].sort((a, b) => (due(a) ?? 0) - (due(b) ?? 0));
    } else {
      out = [...out].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    }
    if (active === 'recent' && !searching) out = out.slice(0, 8);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, active, q, cat, searching, lookups.categories, user.id]);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-4xl">
          {greeting}, {user.first_name || user.username}
        </h1>
        <p className="mt-1 text-muted">
          You have <span className="font-semibold text-ink">{counts.assigned ?? 0} open case{counts.assigned === 1 ? '' : 's'}</span>
          , and <span className="font-semibold text-danger">{counts.deadline ?? 0}</span> are near or past their deadline.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" role="tablist" aria-label="Case queues">
        {queues.map((x) => {
          const sel = !searching && x.id === active;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={sel}
              onClick={() => router.push(x.id === 'assigned' ? pathname : `${pathname}?queue=${x.id}`)}
              className={`rounded-2xl border bg-white p-5 text-left transition-colors duration-150 ${
                sel ? 'border-brand ring-2 ring-brand' : 'border-line hover:border-brand/40'
              }`}
            >
              <p className={`text-4xl font-extrabold ${x.tone ?? 'text-ink'}`}>{loading ? '–' : counts[x.id] ?? 0}</p>
              <p className={`mt-2 text-sm font-semibold ${sel ? 'text-brand' : 'text-muted'}`}>{x.label}</p>
            </button>
          );
        })}
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center md:p-5">
          <h2 className="text-lg font-bold text-ink sm:mr-auto">{searching ? `Results for “${urlQ}”` : queue.label}</h2>
          <label className="relative">
            <span className="sr-only">Search cases</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reference, title or ward" className="field h-11 sm:w-72" style={{ paddingLeft: 36 }} />
          </label>
          <select aria-label="Filter by category" value={cat} onChange={(e) => setCat(e.target.value)} className="field h-11 sm:w-52">
            <option value="">All categories</option>
            {lookups.categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading cases…
          </div>
        ) : loadError ? (
          <p role="alert" className="p-6 text-sm text-danger">{loadError}</p>
        ) : list.length === 0 ? (
          <EmptyState icon={InboxIcon} title="Nothing here" body="When cases match, they’ll appear here." />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((r) => {
              const name = lookups.categoryName(r.category);
              const Icon = categoryIcon(name);
              const p = priorityOf(r);
              const d = due(r);
              const dl = d !== null && isOpen(r) ? deadlineLabel(d) : null;
              return (
                <li key={r.id}>
                  <Link
                    href={`/officer/cases/${r.id}`}
                    className="group flex flex-col gap-3 px-4 py-4 transition-colors duration-150 hover:bg-canvas/70 md:flex-row md:items-center md:gap-5 md:px-5"
                  >
                    <div className="flex min-w-0 flex-1 gap-4">
                      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-ink">{r.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                          <span className="font-mono font-semibold">{r.ref_number}</span>
                          <span className="flex items-center gap-0.5">
                            <MapPinIcon className="h-3 w-3" aria-hidden="true" />
                            {r.ward}, {r.sub_county}
                          </span>
                          <span>Updated {relativeTime(r.updated_at)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:shrink-0">
                      {p && <PriorityBadge priority={p as never} />}
                      <StatusBadge status={r.status as BadgeStatus} />
                      {r.assigned_officer === null && isOpen(r) && (
                        <span className="whitespace-nowrap text-xs font-semibold text-warning-ink">Unassigned</span>
                      )}
                      {dl && (
                        <span className={`flex w-24 items-center gap-1 whitespace-nowrap text-sm font-semibold ${dl.cls}`}>
                          <AlarmClockIcon className="h-4 w-4" aria-hidden="true" /> {dl.text}
                        </span>
                      )}
                      <ChevronRightIcon className="ml-auto h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 md:ml-0" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function OfficerPage() {
  return (
    <Suspense fallback={null}>
      <OfficerWorkspace />
    </Suspense>
  );
}