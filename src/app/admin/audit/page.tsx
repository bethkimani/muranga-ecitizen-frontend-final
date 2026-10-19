'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardListIcon, DownloadIcon, RefreshCwIcon, SearchIcon, SearchXIcon, WifiOffIcon,
} from 'lucide-react';
import { getAuditLogs, type AuditEntry } from '@/api/auditLogs';
import { Modal } from '@/components/Modal';
import { PageHeader, EmptyState, Pagination, Skeleton } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';

const PER_PAGE = 12;

const TONE: Record<string, string> = {
  Create: 'bg-success-50 text-success',
  Update: 'bg-info-50 text-info',
  Delete: 'bg-danger-50 text-danger',
  Access: 'bg-canvas text-muted',
};

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [model, setModel] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<AuditEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await getAuditLogs());
    } catch (err) {
      setError(errorMessage(err, 'We could not load the audit log.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const models = useMemo(() => Array.from(new Set(rows.map((r) => r.model).filter(Boolean))).sort(), [rows]);
  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!needle || `${r.actor} ${r.record} ${r.model} ${r.ip}`.toLowerCase().includes(needle)) &&
        (!action || r.action === action) &&
        (!model || r.model === model),
    );
  }, [rows, q, action, model]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () => {
    const head = ['Time', 'User', 'Action', 'Type', 'Record', 'IP address'];
    const lines = filtered.map((r) => [r.timestamp, r.actor, r.action, r.model, r.record, r.ip]);
    const csv = [head, ...lines].map((l) => l.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Audit logs"
        description="A record of who changed what, and when."
        actions={
          <button type="button" onClick={exportCsv} disabled={loading || filtered.length === 0} className="btn-secondary">
            <DownloadIcon className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line p-4 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search user, record or IP address"
              className="field h-10"
              style={{ paddingLeft: 36 }}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select aria-label="Action" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="field h-10 sm:w-40">
              <option value="">All actions</option>
              {actions.map((a) => (<option key={a} value={a}>{a}</option>))}
            </select>
            <select aria-label="Record type" value={model} onChange={(e) => { setModel(e.target.value); setPage(1); }} className="field h-10 sm:w-48">
              <option value="">All record types</option>
              {models.map((m) => (<option key={m} value={m} className="capitalize">{m}</option>))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}
          </div>
        ) : error ? (
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load the audit log"
            body={error}
            action={
              <button type="button" className="btn-primary" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardListIcon}
            title="No activity recorded yet"
            body="Changes to requests, announcements, categories and departments will appear here."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={SearchXIcon} title="No entries found" body="No entries match these filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-left text-xs font-semibold text-muted">
                  <tr>
                    {['Time', 'User', 'Action', 'Record', 'IP address', ''].map((h, i) => (
                      <th key={`${h}-${i}`} className="whitespace-nowrap px-4 py-3">
                        {h || <span className="sr-only">Details</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((r) => (
                    <tr key={r.id} className="transition-colors duration-150 hover:bg-canvas/60">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(r.timestamp)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{r.actor}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${TONE[r.action] ?? TONE.Access}`}>
                          {r.action}
                        </span>
                      </td>
                      <td className="max-w-[320px] px-4 py-3">
                        <p className="truncate text-ink">{r.record || '—'}</p>
                        <p className="text-xs capitalize text-muted">{r.model}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{r.ip || '—'}</td>
                      <td className="px-4 py-3">
                        {r.changes.length > 0 && (
                          <button type="button" onClick={() => setOpen(r)} className="text-sm font-semibold text-brand hover:underline">
                            View changes
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} total={filtered.length} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title="What changed"
        description={open ? `${open.action} · ${open.record || open.model} · ${formatDateTime(open.timestamp)}` : ''}
      >
        {open && (
          <ul className="space-y-3">
            {open.changes.map((c) => (
              <li key={c.field} className="rounded-lg bg-canvas p-3 text-sm">
                <p className="text-xs font-semibold capitalize text-muted">{c.field.replace(/_/g, ' ')}</p>
                <p className="mt-1 break-words">
                  <span className="text-muted line-through">{c.from || '—'}</span>
                  <span className="mx-2 text-muted">→</span>
                  <span className="font-medium text-ink">{c.to || '—'}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}