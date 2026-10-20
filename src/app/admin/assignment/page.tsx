'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowUpDownIcon, DownloadIcon, RefreshCwIcon, SearchIcon, SearchXIcon,
  SlidersHorizontalIcon, UserPlusIcon, WifiOffIcon, XIcon,
} from 'lucide-react';
import { getAllRequests } from '@/api/adminRequests';
import { assignRequest, getOfficers, type Officer } from '@/api/assignment';
import type { ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { PageHeader, EmptyState, Pagination, Skeleton } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

const PER_PAGE = 8;
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'] as const;
type SortKey = 'submitted_at' | 'updated_at';

const raw = (r: unknown, k: string) => (r as Record<string, unknown>)[k];
const idOf = (v: unknown) =>
  v == null || v === '' ? '' : typeof v === 'object' ? String((v as { id?: unknown }).id ?? '') : String(v);
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

// The backend fields are assigned_department and assigned_officer.
const requestDept = (r: ApiRequest) => idOf(raw(r, 'assigned_department'));
const requestOfficer = (r: ApiRequest): unknown => {
  const v = raw(r, 'assigned_officer');
  return v == null || v === '' ? null : v;
};

function Assignment() {
  const lookups = useLookups();
  const [rows, setRows] = useState<ApiRequest[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officersFailed, setOfficersFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dept, setDept] = useState('__none'); // starts on "Unassigned"
  const [cat, setCat] = useState('');
  const [sub, setSub] = useState('');
  const [showAdv, setShowAdv] = useState(false);
  const [sort, setSort] = useState<SortKey>('updated_at');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOfficer, setAssignOfficer] = useState('');
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
    try {
      setOfficers(await getOfficers());
      setOfficersFailed(false);
    } catch {
      setOfficers([]);
      setOfficersFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deptName = useCallback(
    (id: string) => lookups.departments.find((d) => String(d.id) === id)?.name ?? '',
    [lookups.departments],
  );

  const officerName = useCallback(
    (v: unknown) => {
      if (v == null || v === '') return '';
      if (typeof v === 'object') {
        const o = v as Record<string, unknown>;
        const full = [o.first_name, o.last_name].filter((x) => typeof x === 'string' && x).join(' ');
        return String(o.full_name ?? o.name ?? (full || o.username || ''));
      }
      const found = officers.find((o) => o.id === String(v))?.name;
      if (found) return found;
      return typeof v === 'string' && isNaN(Number(v)) ? v : `Officer #${v}`;
    },
    [officers],
  );

  // The department that a request's category routes to
  const catDept = useCallback(
    (r: ApiRequest) => {
      const c = lookups.categories.find((x) => String(x.id) === String(r.category));
      return c ? idOf(raw(c, 'department')) : '';
    },
    [lookups.categories],
  );

  const isUnassigned = (r: ApiRequest) => !requestDept(r) && !requestOfficer(r);
  const hasPriority = rows.some((r) => typeof raw(r, 'priority') === 'string' && raw(r, 'priority'));

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
          (!dept || (dept === '__none' ? isUnassigned(r) : (requestDept(r) || catDept(r)) === dept)) &&
          (!cat || String(r.category) === cat) &&
          (!sub || r.sub_county === sub),
      )
      .sort((a, b) => b[sort].localeCompare(a[sort]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, status, dept, cat, sub, sort, catDept]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allSel = shown.length > 0 && shown.every((r) => selected.includes(r.id));

  // The assignment dialog works out the department from the selected requests' categories.
  const selectedRows = rows.filter((r) => selected.includes(r.id));
  const selectedDepts = Array.from(new Set(selectedRows.map(catDept).filter(Boolean)));
  const mixed = selectedDepts.length > 1;
  const modalDept = selectedDepts.length === 1 ? selectedDepts[0] : '';

  const inDept = (o: Officer, deptId: string) =>
    !deptId ||
    (!o.department && !o.departmentName) ||
    o.department === deptId ||
    (!!o.departmentName && o.departmentName === deptName(deptId));
  const officerChoices = mixed ? [] : officers.filter((o) => inDept(o, modalDept));

  const toggleOne = (id: number, sel: boolean) =>
    setSelected(sel ? selected.filter((s) => s !== id) : [...selected, id]);

  // Opens the assign dialog. Used by the top button, the selection bar and each row.
  const openAssign = (ids: number[]) => {
    if (ids.length === 0) {
      toast.info('Tick one or more requests first, then press Assign.');
      return;
    }
    setSelected(ids);
    setAssignOfficer('');
    setAssignOpen(true);
  };

  const exportCsv = () => {
    const head = ['Reference', 'Title', 'Status', 'Category', 'Department', 'Officer', 'Ward', 'Sub-county', 'Submitted'];
    const lines = filtered.map((r) => [
      r.ref_number, r.title, r.status, lookups.categoryName(r.category),
      deptName(requestDept(r) || catDept(r)), officerName(requestOfficer(r)), r.ward, r.sub_county, r.submitted_at,
    ]);
    const csv = [head, ...lines].map((l) => l.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'request-assignment.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doAssign = async () => {
    setSaving(true);
    const results = await Promise.allSettled(selected.map((id) => assignRequest(id, assignOfficer)));
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    const ok = results.length - failed.length;
    if (ok > 0) {
      const plural = ok > 1 ? 's' : '';
      const who = assignOfficer ? officerName(assignOfficer) : '';
      toast.success(
        who
          ? `${ok} request${plural} assigned to ${who}`
          : `${ok} request${plural} routed to ${deptName(modalDept) || 'the department'}`,
      );
    }
    if (failed.length > 0) {
      toast.error(errorMessage(failed[0].reason, `${failed.length} request(s) could not be assigned.`));
    }
    setSaving(false);
    if (ok > 0) {
      setAssignOpen(false);
      setSelected([]);
      setAssignOfficer('');
      load();
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Request assignment"
        description="New requests waiting to be routed to a department and officer."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openAssign(selected)} disabled={loading} className="btn-primary">
              <UserPlusIcon className="h-4 w-4" /> {selected.length > 0 ? `Assign (${selected.length})` : 'Assign'}
            </button>
            <button type="button" onClick={exportCsv} disabled={loading || filtered.length === 0} className="btn-secondary">
              <DownloadIcon className="h-4 w-4" /> Export CSV
            </button>
          </div>
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
                <option value="__none">Unassigned</option>
                {lookups.departments.map((d) => (<option key={d.id} value={String(d.id)}>{d.name}</option>))}
              </select>
              <button type="button" onClick={() => setShowAdv((s) => !s)} aria-expanded={showAdv} className={`btn-secondary h-10 ${showAdv ? 'border-brand text-brand' : ''}`}>
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

        {selected.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-brand-dark px-4 py-2.5 text-sm text-white">
            <span className="font-semibold">{selected.length} selected</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => openAssign(selected)} className="btn h-9 bg-gold px-3 text-ink hover:bg-[#E2B946]">
                <UserPlusIcon className="h-4 w-4" /> Assign
              </button>
              <button type="button" onClick={() => setSelected([])} className="btn h-9 px-3 text-white hover:bg-white/10">
                <XIcon className="h-4 w-4" /> Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}
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
            title={dept === '__none' && !q && !status ? 'Nothing waiting to be assigned' : 'No requests found'}
            body={dept === '__none' && !q && !status ? 'Every request has been routed to a department.' : 'No requests match these filters. Try widening your search.'}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-left text-xs font-semibold text-muted">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all on page"
                        checked={allSel}
                        onChange={() =>
                          setSelected(
                            allSel
                              ? selected.filter((s) => !shown.some((r) => r.id === s))
                              : Array.from(new Set([...selected, ...shown.map((r) => r.id)])),
                          )
                        }
                        className="h-4 w-4 accent-brand"
                      />
                    </th>
                    {['Reference', 'Request', 'Location', 'Department / Officer', ...(hasPriority ? ['Priority'] : []), 'Status', 'Submitted', 'Action'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((r) => {
                    const sel = selected.includes(r.id);
                    const dName = deptName(requestDept(r) || catDept(r));
                    const oName = officerName(requestOfficer(r));
                    const prio = raw(r, 'priority');
                    return (
                      <tr key={r.id} className={`transition-colors duration-150 ${sel ? 'bg-brand-50/60' : 'hover:bg-canvas/60'}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" aria-label={`Select ${r.ref_number}`} checked={sel} onChange={() => toggleOne(r.id, sel)} className="h-4 w-4 accent-brand" />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs font-semibold text-brand">{r.ref_number}</td>
                        <td className="max-w-[260px] px-3 py-3">
                          <p className="truncate font-medium text-ink">{r.title}</p>
                          <p className="text-xs text-muted">{lookups.categoryName(r.category)}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">
                          {r.ward}
                          <span className="block text-xs">{r.sub_county}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          {isUnassigned(r) ? (
                            <span className="rounded-md bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-ink">Unassigned</span>
                          ) : (
                            <>
                              <p className="text-ink">{dName || 'Department not set'}</p>
                              <p className="text-xs text-muted">{oName || 'No officer yet'}</p>
                            </>
                          )}
                        </td>
                        {hasPriority && (
                          <td className="px-3 py-3">
                            {typeof prio === 'string' && prio ? <PriorityBadge priority={prio as never} /> : <span className="text-muted">—</span>}
                          </td>
                        )}
                        <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(r.submitted_at)}</td>
                        <td className="px-3 py-3">
                          <button type="button" onClick={() => openAssign([r.id])} className="btn-secondary h-8 px-3 text-xs">
                            <UserPlusIcon className="h-3.5 w-3.5" /> Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line lg:hidden">
              {shown.map((r) => {
                const sel = selected.includes(r.id);
                return (
                  <li key={r.id} className={`flex gap-3 p-4 ${sel ? 'bg-brand-50/60' : ''}`}>
                    <input type="checkbox" aria-label={`Select ${r.ref_number}`} checked={sel} onChange={() => toggleOne(r.id, sel)} className="mt-1 h-4 w-4 accent-brand" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-muted">{r.ref_number}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-1 font-semibold text-ink">{r.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {r.ward} · {isUnassigned(r) ? 'Unassigned' : deptName(requestDept(r) || catDept(r)) || 'Department not set'}
                      </p>
                      <button type="button" onClick={() => openAssign([r.id])} className="btn-secondary mt-2 h-8 px-3 text-xs">
                        <UserPlusIcon className="h-3.5 w-3.5" /> Assign
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination page={page} pages={pages} total={filtered.length} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={assignOpen}
        onClose={() => !saving && setAssignOpen(false)}
        title={`Assign ${selected.length} request${selected.length > 1 ? 's' : ''}`}
        description="Requests go to the department that handles their category."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setAssignOpen(false)} disabled={saving}>Cancel</button>
            <button type="button" className="btn-primary" disabled={saving || mixed || selected.length === 0} onClick={doAssign}>
              {saving ? 'Assigning…' : 'Confirm assignment'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink">Department</p>
            <p className="mt-1.5 rounded-lg bg-canvas px-3 py-2.5 text-sm text-ink">
              {mixed ? 'Mixed departments' : deptName(modalDept) || 'Department of the request category'}
            </p>
            {mixed && (
              <p role="alert" className="mt-1 text-xs font-medium text-danger">
                The selected requests belong to different departments. Select requests from one department at a time.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="ao" className="flex items-center gap-2 text-sm font-semibold text-ink">
              Officer <span className="text-xs font-medium text-muted">Optional</span>
            </label>
            <select id="ao" value={assignOfficer} onChange={(e) => setAssignOfficer(e.target.value)} disabled={mixed || officerChoices.length === 0} className="field mt-1.5 h-11">
              <option value="">
                {mixed
                  ? 'Select one department at a time'
                  : officersFailed
                  ? 'Officer list unavailable'
                  : officerChoices.length
                  ? 'Let department head assign'
                  : 'No officers in this department'}
              </option>
              {officerChoices.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
            </select>
          </div>
          <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg bg-canvas p-3 text-xs">
            {selectedRows.map((r) => (
              <li key={r.id} className="font-mono font-semibold text-ink">{r.ref_number}</li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
}

export default function AssignmentPage() {
  return (
    <Suspense fallback={null}>
      <Assignment />
    </Suspense>
  );
}