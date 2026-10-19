'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowUpDownIcon, DownloadIcon, ExternalLinkIcon, MoreHorizontalIcon, RefreshCwIcon,
  SearchIcon, SearchXIcon, SlidersHorizontalIcon, WifiOffIcon,
} from 'lucide-react';
import { getAllRequests, updateRequestStatus } from '@/api/adminRequests';
import type { ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { StatusStepper } from '@/components/StatusStepper';
import { PageHeader, EmptyState, Pagination, Skeleton } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
import { formatDate, formatDateTime, relativeTime } from '@/utils/format';

const PER_PAGE = 8;
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'] as const;
type SortKey = 'submitted_at' | 'updated_at';

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function AdminRequests() {
  const params = useSearchParams();
  const lookups = useLookups();

  const [rows, setRows] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState('');
  const [dept, setDept] = useState('');
  const [cat, setCat] = useState('');
  const [sub, setSub] = useState('');
  const [showAdv, setShowAdv] = useState(false);
  const [sort, setSort] = useState<SortKey>('updated_at');
  const [page, setPage] = useState(1);

  const [drawer, setDrawer] = useState<ApiRequest | null>(null);
  const [statusDialog, setStatusDialog] = useState<ApiRequest | null>(null);
  const [nextStatus, setNextStatus] = useState<string>('In Progress');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await getAllRequests());
    } catch (err) {
      setError(errorMessage(err, 'We could not load the requests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the search box in sync when the top-bar search sends ?q=...
  useEffect(() => {
    setQ(params.get('q') ?? '');
    setPage(1);
  }, [params]);

  const deptId = useCallback(
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

  const subCounties = useMemo(
    () => Array.from(new Set(rows.map((r) => r.sub_county).filter(Boolean))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          (!needle || `${r.ref_number} ${r.title} ${r.ward}`.toLowerCase().includes(needle)) &&
          (!status || r.status === status) &&
          (!dept || deptId(r) === dept) &&
          (!cat || String(r.category) === cat) &&
          (!sub || r.sub_county === sub),
      )
      .sort((a, b) => b[sort].localeCompare(a[sort]));
  }, [rows, q, status, dept, cat, sub, sort, deptId]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () => {
    const head = ['Reference', 'Title', 'Status', 'Category', 'Department', 'Ward', 'Sub-county', 'Submitted', 'Last updated'];
    const lines = filtered.map((r) => [
      r.ref_number, r.title, r.status, lookups.categoryName(r.category), deptName(deptId(r)),
      r.ward, r.sub_county, r.submitted_at, r.updated_at,
    ]);
    const csv = [head, ...lines].map((l) => l.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const needsNote = nextStatus === 'Resolved' || nextStatus === 'Rejected';

  const saveStatus = async () => {
    if (!statusDialog) return;
    if (needsNote && !note.trim()) {
      toast.error('Please add a summary. The citizen will see it.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateRequestStatus(statusDialog.id, nextStatus, note.trim());
      setRows((rs) =>
        rs.map((r) =>
          r.id === statusDialog.id
            ? { ...r, ...(updated ?? {}), status: nextStatus as ApiRequest['status'], updated_at: new Date().toISOString() }
            : r,
        ),
      );
      toast.success(`Status changed to ${nextStatus}`);
      setStatusDialog(null);
      setNote('');
    } catch (err) {
      toast.error(errorMessage(err, 'We could not update the status.'));
    } finally {
      setSaving(false);
    }
  };

  const reset = (fn: () => void) => () => {
    fn();
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="All requests"
        description="Search, filter and manage every service request."
        actions={
          <button type="button" onClick={exportCsv} disabled={loading || filtered.length === 0} className="btn-secondary">
            <DownloadIcon className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex flex-col gap-2 lg:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search reference, title or ward"
                className="field h-10"
                style={{ paddingLeft: 36 }}
              />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="field h-10 sm:w-36">
                <option value="">All statuses</option>
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <select aria-label="Department" value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }} className="field h-10 sm:w-48">
                <option value="">All departments</option>
                {lookups.departments.map((d) => (<option key={d.id} value={String(d.id)}>{d.name}</option>))}
              </select>
              <button
                type="button"
                onClick={() => setShowAdv((s) => !s)}
                aria-expanded={showAdv}
                className={`btn-secondary h-10 ${showAdv ? 'border-brand text-brand' : ''}`}
              >
                <SlidersHorizontalIcon className="h-4 w-4" /> More filters
              </button>
              <label className="relative">
                <span className="sr-only">Sort by</span>
                <ArrowUpDownIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field h-10 sm:w-44" style={{ paddingLeft: 36 }}>
                  <option value="updated_at">Last updated</option>
                  <option value="submitted_at">Newest submitted</option>
                </select>
              </label>
            </div>
          </div>

          {showAdv && (
            <div className="grid gap-2 sm:grid-cols-2">
              <select aria-label="Category" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} className="field h-10">
                <option value="">All categories</option>
                {lookups.categories.map((c) => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
              </select>
              <select aria-label="Sub-county" value={sub} onChange={(e) => { setSub(e.target.value); setPage(1); }} className="field h-10">
                <option value="">All sub-counties</option>
                {subCounties.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}
          </div>
        ) : error ? (
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load the requests"
            body={error}
            action={
              <button type="button" className="btn-primary" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchXIcon}
            title="No requests found"
            body={rows.length === 0 ? 'No requests have been submitted yet.' : 'No requests match these filters. Try widening your search.'}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-left text-xs font-semibold text-muted">
                  <tr>
                    {['Reference', 'Request', 'Location', 'Department', 'Status', 'Submitted', 'Updated', ''].map((h, i) => (
                      <th key={`${h}-${i}`} className="whitespace-nowrap px-3 py-3 first:pl-5">
                        {h || <span className="sr-only">Actions</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((r) => (
                    <tr key={r.id} className="transition-colors duration-150 hover:bg-canvas/60">
                      <td className="whitespace-nowrap px-3 py-3 pl-5">
                        <button type="button" onClick={() => setDrawer(r)} className="font-mono text-xs font-semibold text-brand hover:underline">
                          {r.ref_number}
                        </button>
                      </td>
                      <td className="max-w-[260px] px-3 py-3">
                        <p className="truncate font-medium text-ink">{r.title}</p>
                        <p className="text-xs text-muted">{lookups.categoryName(r.category)}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">
                        {r.ward}
                        <span className="block text-xs">{r.sub_county}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink">{deptName(deptId(r))}</td>
                      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(r.submitted_at)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">{relativeTime(r.updated_at)}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setStatusDialog(r);
                            setNextStatus(r.status === 'Pending' ? 'In Progress' : r.status);
                            setNote('');
                          }}
                          className="btn-ghost h-8 w-8 px-0"
                          aria-label={`Change status of ${r.ref_number}`}
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line lg:hidden">
              {shown.map((r) => (
                <li key={r.id} className="p-4">
                  <button type="button" onClick={() => setDrawer(r)} className="block w-full text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-muted">{r.ref_number}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 font-semibold text-ink">{r.title}</p>
                    <p className="mt-1 text-xs text-muted">{r.ward} · {deptName(deptId(r))}</p>
                  </button>
                </li>
              ))}
            </ul>

            <Pagination page={page} pages={pages} total={filtered.length} onChange={setPage} />
          </>
        )}
      </div>

      {/* ---------- Update status ---------- */}
      <Modal
        open={!!statusDialog}
        onClose={() => setStatusDialog(null)}
        title="Update status"
        description={statusDialog ? `${statusDialog.ref_number} · currently ${statusDialog.status}` : ''}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setStatusDialog(null)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={saveStatus} disabled={saving}>
              {saving ? 'Saving…' : 'Save status'}
            </button>
          </>
        }
      >
        <fieldset className="space-y-2">
          <legend className="sr-only">New status</legend>
          {STATUSES.map((s) => (
            <label
              key={s}
              className={`flex cursor-pointer items-center rounded-lg border px-3 py-2.5 ${
                nextStatus === s ? 'border-brand bg-brand-50' : 'border-line'
              }`}
            >
              <span className="flex items-center gap-3">
                <input type="radio" name="ns" checked={nextStatus === s} onChange={() => setNextStatus(s)} className="accent-brand" />
                <StatusBadge status={s} />
              </span>
            </label>
          ))}
          {needsNote && (
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="field mt-2"
              placeholder={
                nextStatus === 'Resolved'
                  ? 'Resolution summary (required, visible to citizen)'
                  : 'Reason for rejection (required, visible to citizen)'
              }
              aria-label="Summary"
            />
          )}
        </fieldset>
      </Modal>

      {/* ---------- Details drawer ---------- */}
      <Modal
        open={!!drawer}
        onClose={() => setDrawer(null)}
        variant="drawer"
        title={drawer?.ref_number ?? ''}
        description={drawer?.title}
        footer={
          drawer && (
            <Link href={`/officer/cases/${drawer.id}`} className="btn-primary">
              <ExternalLinkIcon className="h-4 w-4" /> Open full case
            </Link>
          )
        }
      >
        {drawer && (
          <div className="space-y-6">
            <StatusBadge status={drawer.status} size="md" />
            <StatusStepper status={drawer.status} />
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#3A433D]">{drawer.description}</p>
            {drawer.evidence?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={drawer.evidence[0].image_url} alt={`Evidence for ${drawer.title}`} className="aspect-[16/9] w-full rounded-xl object-cover" />
            )}
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted">Category</dt><dd className="font-medium">{lookups.categoryName(drawer.category)}</dd></div>
              <div><dt className="text-xs text-muted">Department</dt><dd className="font-medium">{deptName(deptId(drawer))}</dd></div>
              <div><dt className="text-xs text-muted">Ward</dt><dd className="font-medium">{drawer.ward}, {drawer.sub_county}</dd></div>
              <div><dt className="text-xs text-muted">Submitted</dt><dd className="font-medium">{formatDateTime(drawer.submitted_at)}</dd></div>
              <div><dt className="text-xs text-muted">Last updated</dt><dd className="font-medium">{formatDateTime(drawer.updated_at)}</dd></div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={null}>
      <AdminRequests />
    </Suspense>
  );
}