'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRightIcon, FilePlus2Icon, InboxIcon, LayoutGridIcon, ListIcon,
  RefreshCwIcon, SearchIcon, SearchXIcon, WifiOffIcon, XIcon,
} from 'lucide-react';
import { getMyRequests, type ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { PageHeader, EmptyState, Pagination, Skeleton } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { RequestSummaryCard } from '@/components/RequestSummaryCard';
import { formatDate, relativeTime } from '@/utils/format';
import { errorMessage } from '@/utils/errors';

const PER_PAGE = 6;
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'] as const;

type ViewMode = 'grid' | 'table';
type SortMode = 'newest' | 'oldest' | 'updated';
type Chip = { label: string; clear: () => void };

function MyRequests() {
  const params = useSearchParams();
  const lookups = useLookups();

  const [items, setItems] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [dept, setDept] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [view, setView] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getMyRequests());
    } catch (err) {
      setError(errorMessage(err, 'We could not load your requests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The header search box sends people here with ?q=
  useEffect(() => {
    setQ(params.get('q') ?? '');
    setPage(1);
  }, [params]);

  const deptOptions = useMemo(() => {
    const ids = Array.from(new Set(items.map((r) => r.assigned_department).filter((d): d is number => d != null)));
    return ids.map((id) => ({ id: String(id), name: lookups.departmentName(id) ?? `Department ${id}` }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, lookups.departments]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter(
      (r) =>
        (!needle || r.ref_number.toLowerCase().includes(needle) || r.title.toLowerCase().includes(needle)) &&
        (!status || r.status === status) &&
        (!category || String(r.category) === category) &&
        (!dept || String(r.assigned_department) === dept),
    );
    return list.sort((a, b) =>
      sort === 'oldest'
        ? a.submitted_at.localeCompare(b.submitted_at)
        : sort === 'updated'
        ? b.updated_at.localeCompare(a.updated_at)
        : b.submitted_at.localeCompare(a.submitted_at),
    );
  }, [items, q, status, category, dept, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const chips = [
    status && { label: status, clear: () => setStatus('') },
    category && {
      label: lookups.categoryName(Number(category)),
      clear: () => setCategory(''),
    },
    dept && {
      label: deptOptions.find((d) => d.id === dept)?.name ?? 'Department',
      clear: () => setDept(''),
    },
  ].filter(Boolean) as Chip[];

  const resetFilters = () => {
    setStatus('');
    setCategory('');
    setDept('');
    setPage(1);
  };

  const resetAll = () => {
    setQ('');
    resetFilters();
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="My requests"
        description="Every issue you’ve reported, with its latest status."
        actions={
          <Link href="/portal/submit" className="btn-primary">
            <FilePlus2Icon className="h-4 w-4" /> New request
          </Link>
        }
      />

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search by reference or title</span>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by reference or title"
              className="field h-10"
              style={{ paddingLeft: 36 }}
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="field h-10 lg:w-36"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              aria-label="Filter by service"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="field h-10 lg:w-40"
            >
              <option value="">All services</option>
              {lookups.categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>

            <select
              aria-label="Filter by department"
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setPage(1);
              }}
              className="field h-10 lg:w-44"
            >
              <option value="">All departments</option>
              {deptOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              aria-label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="field h-10 lg:w-40"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="updated">Last updated</option>
            </select>
          </div>

          <div className="hidden rounded-lg border border-line p-0.5 md:flex" role="group" aria-label="View">
            {(
              [
                ['grid', LayoutGridIcon],
                ['table', ListIcon],
              ] as const
            ).map(([v, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                aria-label={`${v} view`}
                className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150 ${
                  view === v ? 'bg-brand-50 text-brand' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  c.clear();
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-100"
              >
                {c.label} <XIcon className="h-3 w-3" aria-label="Remove filter" />
              </button>
            ))}
            <button type="button" onClick={resetFilters} className="text-xs font-semibold text-muted hover:text-ink">
              Clear all
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="card mt-5">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load your requests"
            body={error}
            action={
              <button type="button" className="btn-primary" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <div className="card mt-5">
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
        </div>
      ) : (
        <>
          <p className="mt-5 text-sm text-muted" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'request' : 'requests'}
          </p>

          {filtered.length === 0 ? (
            <div className="card mt-3">
              <EmptyState
                icon={SearchXIcon}
                title="No requests match your search"
                body="Try a different reference number or remove some filters."
                action={
                  <button type="button" className="btn-secondary" onClick={resetAll}>
                    Reset filters
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <div className={`mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${view === 'table' ? 'md:hidden' : ''}`}>
                {shown.map((r) => (
                  <RequestSummaryCard key={r.id} r={r} categoryName={lookups.categoryName(r.category)} />
                ))}
              </div>

              {view === 'table' && (
                <div className="card mt-3 hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-canvas text-left text-xs font-semibold text-muted">
                      <tr>
                        {['Reference', 'Title', 'Service', 'Location', 'Submitted', 'Status', 'Last update', ''].map(
                          (h, i) => (
                            <th key={`${h}-${i}`} className="px-4 py-3">
                              {h || <span className="sr-only">Actions</span>}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {shown.map((r) => (
                        <tr key={r.id} className="hover:bg-canvas/60">
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold">{r.ref_number}</td>
                          <td className="max-w-[260px] truncate px-4 py-3.5 font-medium text-ink">{r.title}</td>
                          <td className="px-4 py-3.5 text-muted">{lookups.categoryName(r.category)}</td>
                          <td className="px-4 py-3.5 text-muted">{r.ward}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-muted">{formatDate(r.submitted_at)}</td>
                          <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-muted">{relativeTime(r.updated_at)}</td>
                          <td className="px-4 py-3.5">
                            <Link href={`/portal/requests/${r.id}`} className="inline-flex items-center font-semibold text-brand">
                              View <ChevronRightIcon className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="card mt-4">
                <Pagination page={page} pages={pages} total={filtered.length} onChange={setPage} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function MyRequestsPage() {
  return (
    <Suspense fallback={null}>
      <MyRequests />
    </Suspense>
  );
}