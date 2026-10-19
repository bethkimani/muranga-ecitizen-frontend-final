'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { InboxIcon, RefreshCwIcon, SearchIcon, SearchXIcon, WifiOffIcon } from 'lucide-react';
import { getAllRequests } from '@/api/adminRequests';
import type { ApiRequest } from '@/api/requests';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui';
import { errorMessage } from '@/utils/errors';

const tabs = [
  { label: 'Departments', to: '/admin/departments' },
  { label: 'Service categories & rules', to: '/admin/categories' },
  { label: 'Locations and wards', to: '/admin/locations' },
];

const isOpen = (r: ApiRequest) => r.status !== 'Resolved' && r.status !== 'Rejected';

type Ward = { name: string; total: number; open: number };
type SubCounty = { name: string; total: number; open: number; wards: Ward[] };

export default function AdminLocationsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await getAllRequests());
    } catch (err) {
      setError(errorMessage(err, 'We could not load the locations.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Sub-counties and wards that citizens have submitted requests from.
  const all: SubCounty[] = useMemo(() => {
    const map = new Map<string, Map<string, Ward>>();
    requests.forEach((r) => {
      if (!r.sub_county) return;
      const wards = map.get(r.sub_county) ?? new Map<string, Ward>();
      if (r.ward) {
        const w = wards.get(r.ward) ?? { name: r.ward, total: 0, open: 0 };
        w.total += 1;
        if (isOpen(r)) w.open += 1;
        wards.set(r.ward, w);
      }
      map.set(r.sub_county, wards);
    });
    return Array.from(map.entries())
      .map(([name, wards]) => {
        const list = Array.from(wards.values()).sort((a, b) => a.name.localeCompare(b.name));
        return {
          name,
          wards: list,
          total: list.reduce((s, w) => s + w.total, 0),
          open: list.reduce((s, w) => s + w.open, 0),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const shown: SubCounty[] = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all
      .map((s) =>
        s.name.toLowerCase().includes(needle)
          ? s
          : { ...s, wards: s.wards.filter((w) => w.name.toLowerCase().includes(needle)) },
      )
      .filter((s) => s.name.toLowerCase().includes(needle) || s.wards.length > 0);
  }, [all, q]);

  const wardCount = all.reduce((s, c) => s + c.wards.length, 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Departments and routing"
        description="The sub-counties and wards citizens are reporting from."
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (<Skeleton key={i} className="h-40 w-full" />))}
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load the locations"
            body={error}
            action={
              <button type="button" className="btn-primary" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : all.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={InboxIcon}
            title="No locations yet"
            body="Sub-counties and wards appear here once citizens submit requests."
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted">
              {all.length} sub-counties · {wardCount} wards · {requests.length} requests. Numbers beside each ward are
              the requests received from it.
            </p>
            <label className="relative md:w-80">
              <span className="sr-only">Search sub-counties or wards</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search sub-county or ward"
                className="field h-11"
                style={{ paddingLeft: 36 }}
              />
            </label>
          </div>

          {shown.length === 0 ? (
            <div className="card">
              <EmptyState icon={SearchXIcon} title={`No locations match “${q}”`} body="Try a simpler word." />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((s) => (
                <section key={s.name} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-ink">{s.name}</h2>
                      <p className="mt-0.5 text-xs text-muted">
                        {s.total} request{s.total === 1 ? '' : 's'}
                        {s.open > 0 && <> · {s.open} open</>}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {s.wards.length} ward{s.wards.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {s.wards.length === 0 ? (
                      <li className="text-xs text-muted">No ward recorded</li>
                    ) : (
                      s.wards.map((w) => (
                        <li key={w.name} className="rounded-md bg-canvas px-2 py-1 text-xs font-medium text-ink">
                          {w.name} · {w.total}
                        </li>
                      ))
                    )}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}