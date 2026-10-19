'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { InboxIcon, RefreshCwIcon, SearchIcon, SearchXIcon, WifiOffIcon } from 'lucide-react';
import { getAllRequests } from '@/api/adminRequests';
import type { ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { categoryIcon } from '@/utils/categoryIcon';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui';

const tabs = [
  { label: 'Departments', to: '/admin/departments' },
  { label: 'Service categories & rules', to: '/admin/categories' },
  { label: 'Locations and wards', to: '/admin/locations' },
];

const isOpen = (r: ApiRequest) => r.status !== 'Resolved' && r.status !== 'Rejected';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lookups = useLookups();

  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [countsFailed, setCountsFailed] = useState(false);
  const [q, setQ] = useState('');

  const loadCounts = useCallback(async () => {
    setCountsFailed(false);
    try {
      setRequests(await getAllRequests());
    } catch {
      setRequests([]);
      setCountsFailed(true); // the page still works, counts show "—"
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const deptName = useCallback(
    (id: unknown) => lookups.departments.find((d) => String(d.id) === String(id))?.name ?? 'Unassigned',
    [lookups.departments],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lookups.categories
      .map((c) => {
        const mine = requests.filter((r) => String(r.category) === String(c.id));
        return {
          ...c,
          departmentLabel: deptName(c.department),
          total: mine.length,
          open: mine.filter(isOpen).length,
        };
      })
      .filter((c) => !needle || `${c.name} ${c.description ?? ''} ${c.departmentLabel}`.toLowerCase().includes(needle));
  }, [lookups.categories, requests, q, deptName]);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Departments and routing"
        description="Service categories, the department each one routes to, and its response target."
      />

      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.to);
          return (
            <button
              key={t.to}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => router.push(t.to)}
              className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors duration-150 ${
                active ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {lookups.loading ? (
        <div className="card space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-16 w-full" />))}
        </div>
      ) : lookups.error ? (
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load the categories"
            body={lookups.error}
            action={
              <button type="button" className="btn-primary" onClick={lookups.reload}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : lookups.categories.length === 0 ? (
        <div className="card">
          <EmptyState icon={InboxIcon} title="No service categories yet" body="Categories will appear here once they are added in the backend." />
        </div>
      ) : (
        <>
          <label className="relative mb-4 block md:w-80">
            <span className="sr-only">Search categories</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search categories"
              className="field h-11"
              style={{ paddingLeft: 36 }}
            />
          </label>

          {rows.length === 0 ? (
            <div className="card">
              <EmptyState icon={SearchXIcon} title={`No categories match “${q}”`} body="Try a simpler word." />
            </div>
          ) : (
            <div className="card divide-y divide-line">
              {rows.map((c) => {
                const Icon = categoryIcon(c.name);
                return (
                  <div key={c.id} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1fr_120px] md:items-center">
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{c.name}</p>
                        {c.description && <p className="mt-0.5 text-xs text-muted">{c.description}</p>}
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="mb-1 block text-xs font-semibold text-muted">Routes to</span>
                      <span className="font-medium text-ink">{c.departmentLabel}</span>
                    </div>

                    <div className="text-sm">
                      <span className="mb-1 block text-xs font-semibold text-muted">Response target</span>
                      <span className="font-medium text-ink">{c.responseTarget || '—'}</span>
                    </div>

                    <div className="text-sm">
                      <span className="mb-1 block text-xs font-semibold text-muted">Requests</span>
                      <span className="font-medium text-ink">
                        {countsFailed ? '—' : c.total}
                        {!countsFailed && c.open > 0 && <span className="ml-1 text-xs text-muted">({c.open} open)</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}