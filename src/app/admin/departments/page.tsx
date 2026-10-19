'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { InboxIcon, RefreshCwIcon, WifiOffIcon } from 'lucide-react';
import { getAllRequests } from '@/api/adminRequests';
import { getOfficers, type Officer } from '@/api/assignment';
import type { ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { categoryIcon } from '@/utils/categoryIcon';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui';

type Tab = 'departments' | 'categories' | 'locations';

const tabs: { id: Tab; label: string; to: string }[] = [
  { id: 'departments', label: 'Departments', to: '/admin/departments' },
  { id: 'categories', label: 'Service categories & rules', to: '/admin/categories' },
  { id: 'locations', label: 'Locations and wards', to: '/admin/locations' },
];

const isOpen = (r: ApiRequest) => r.status !== 'Resolved' && r.status !== 'Rejected';

export default function AdminDepartmentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lookups = useLookups();

  const tab: Tab = pathname.startsWith('/admin/categories')
    ? 'categories'
    : pathname.startsWith('/admin/locations')
    ? 'locations'
    : 'departments';

  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [officers, setOfficers] = useState<Officer[] | null>(null);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqFailed, setReqFailed] = useState(false);

  const load = useCallback(async () => {
    setReqLoading(true);
    setReqFailed(false);
    try {
      setRequests(await getAllRequests());
    } catch {
      setRequests([]);
      setReqFailed(true);
    } finally {
      setReqLoading(false);
    }
    try {
      setOfficers(await getOfficers());
    } catch {
      setOfficers(null); // staff counts show "—" if the staff list isn't available
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryDept = useCallback(
    (categoryId: unknown) => {
      const c = lookups.categories.find((x) => String(x.id) === String(categoryId));
      return c ? String(c.department ?? '') : '';
    },
    [lookups.categories],
  );

  const deptName = (id: unknown) =>
    lookups.departments.find((d) => String(d.id) === String(id))?.name ?? 'Unassigned';

  // ---------- Departments tab ----------
  const deptRows = useMemo(
    () =>
      lookups.departments.map((d) => {
        const id = String(d.id);
        return {
          id,
          name: d.name,
          staff: officers ? officers.filter((o) => o.department === id).length : null,
          categories: lookups.categories.filter((c) => String(c.department ?? '') === id).map((c) => c.name),
          open: reqFailed ? null : requests.filter((r) => isOpen(r) && categoryDept(r.category) === id).length,
        };
      }),
    [lookups.departments, lookups.categories, officers, requests, reqFailed, categoryDept],
  );

  // ---------- Locations tab (taken from submitted requests) ----------
  const locations = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    requests.forEach((r) => {
      if (!r.sub_county) return;
      const wards = map.get(r.sub_county) ?? new Map<string, number>();
      if (r.ward) wards.set(r.ward, (wards.get(r.ward) ?? 0) + 1);
      map.set(r.sub_county, wards);
    });
    return Array.from(map.entries())
      .map(([name, wards]) => ({
        name,
        wards: Array.from(wards.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const loading = lookups.loading || (tab !== 'categories' && reqLoading);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Departments and routing"
        description="Who handles what, and where."
      />

      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => router.push(t.to)}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors duration-150 ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}
        </div>
      ) : lookups.error ? (
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load this page"
            body={lookups.error}
            action={
              <button type="button" className="btn-primary" onClick={lookups.reload}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* ---------------- Departments ---------------- */}
          {tab === 'departments' &&
            (deptRows.length === 0 ? (
              <div className="card">
                <EmptyState icon={InboxIcon} title="No departments yet" body="Departments will appear here once they are added in the backend." />
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-canvas text-left text-xs font-semibold text-muted">
                    <tr>
                      {['Department', 'Officers', 'Categories handled', 'Open cases'].map((h) => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {deptRows.map((d) => (
                      <tr key={d.id} className="hover:bg-canvas/60">
                        <td className="px-5 py-3.5 font-semibold text-ink">{d.name}</td>
                        <td className="px-5 py-3.5 text-ink">{d.staff ?? '—'}</td>
                        <td className="px-5 py-3.5 text-muted">{d.categories.join(', ') || '—'}</td>
                        <td className="px-5 py-3.5 font-semibold text-ink">{d.open ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* ---------------- Categories ---------------- */}
          {tab === 'categories' &&
            (lookups.categories.length === 0 ? (
              <div className="card">
                <EmptyState icon={InboxIcon} title="No service categories yet" body="Categories will appear here once they are added in the backend." />
              </div>
            ) : (
              <div className="card divide-y divide-line">
                {lookups.categories.map((c) => {
                  const Icon = categoryIcon(c.name);
                  return (
                    <div key={c.id} className="grid gap-3 p-5 md:grid-cols-[1.4fr_1fr_160px] md:items-center">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{c.name}</p>
                          {c.description && <p className="text-xs text-muted">{c.description}</p>}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="mb-1 block text-xs font-semibold text-muted">Routes to</span>
                        <span className="font-medium text-ink">{deptName(c.department)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="mb-1 block text-xs font-semibold text-muted">Response target</span>
                        <span className="font-medium text-ink">{c.responseTarget || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

          {/* ---------------- Locations ---------------- */}
          {tab === 'locations' &&
            (reqFailed ? (
              <div className="card">
                <EmptyState
                  icon={WifiOffIcon}
                  title="We couldn’t load the locations"
                  body="The requests could not be loaded."
                  action={
                    <button type="button" className="btn-primary" onClick={load}>
                      <RefreshCwIcon className="h-4 w-4" /> Try again
                    </button>
                  }
                />
              </div>
            ) : locations.length === 0 ? (
              <div className="card">
                <EmptyState icon={InboxIcon} title="No locations yet" body="Sub-counties and wards appear here once requests are submitted." />
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted">
                  Showing the sub-counties and wards that citizens have submitted requests from. The number is the request count.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {locations.map((s) => (
                    <section key={s.name} className="card p-5">
                      <div className="flex items-center justify-between">
                        <h2 className="font-bold text-ink">{s.name}</h2>
                        <span className="text-xs text-muted">{s.wards.length} wards</span>
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {s.wards.map(([ward, count]) => (
                          <li key={ward} className="rounded-md bg-canvas px-2 py-1 text-xs font-medium text-ink">
                            {ward} · {count}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </>
            ))}
        </>
      )}
    </div>
  );
}