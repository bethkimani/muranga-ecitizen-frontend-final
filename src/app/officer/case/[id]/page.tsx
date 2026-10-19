'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlarmClockIcon, ArrowLeftIcon, EyeIcon, LockIcon, MapPinIcon, PaperclipIcon,
  RefreshCwIcon, SendIcon, UserCheckIcon, WifiOffIcon,
} from 'lucide-react';
import { assignCaseToMe, getCase, postCaseUpdate, setCaseStatus } from '@/api/officerCases';
import type { ApiRequest } from '@/api/requests';
import { useCurrentUser } from '@/components/RequireRole';
import { useLookups } from '@/hooks/useLookups';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { EmptyState, Skeleton } from '@/components/ui';
import { deadlineLabel, dueAt, priorityOf } from '@/utils/deadline';
import { errorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';

type Action = 'update' | 'internal' | 'clarify' | 'work';
type BadgeStatus = React.ComponentProps<typeof StatusBadge>['status'];

const ACTIONS: { id: Action; label: string; kind: string; title: string; visible: boolean; placeholder: string }[] = [
  { id: 'update', label: 'Public update', kind: 'update', title: 'Official update', visible: true, placeholder: 'Write an update the citizen will see…' },
  { id: 'internal', label: 'Internal note', kind: 'internal', title: 'Internal note', visible: false, placeholder: 'Notes for county staff only…' },
  { id: 'clarify', label: 'Request clarification', kind: 'clarification', title: 'Clarification requested', visible: true, placeholder: 'What do you need the citizen to clarify?' },
  { id: 'work', label: 'Record work', kind: 'work', title: 'Work recorded', visible: false, placeholder: 'Describe the work performed, crew and materials…' },
];

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'] as const;

function isStaffOnly(e: Record<string, unknown>) {
  return e.is_public === false || e.visible === false || /internal|work/i.test(String(e.kind ?? ''));
}

export default function OfficerCasePage() {
  const { id } = useParams<{ id: string }>();
  const user = useCurrentUser();
  const lookups = useLookups();

  const [r, setR] = useState<ApiRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [action, setAction] = useState<Action>('update');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const [newStatus, setNewStatus] = useState<string>('Pending');
  const [summary, setSummary] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await getCase(id);
      setR(data);
      setNewStatus(data.status);
    } catch (err) {
      setError(errorMessage(err, 'We could not load this case.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const a = ACTIONS.find((x) => x.id === action) ?? ACTIONS[0];
  const open = r ? r.status === 'Pending' || r.status === 'In Progress' : false;

  const category = r ? lookups.categories.find((c) => String(c.id) === String(r.category)) : undefined;
  const deptName = category
    ? lookups.departments.find((d) => String(d.id) === String(category.department))?.name
    : '';
  const due = r ? dueAt(r, category?.responseTarget) : null;
  const dl = due !== null && open ? deadlineLabel(due) : null;
  const prio = r ? priorityOf(r) : '';

  const events = useMemo(
    () => (r ? [...r.timeline].sort((x, y) => x.created_at.localeCompare(y.created_at)) : []),
    [r],
  );

  const post = async () => {
    if (!r) return;
    if (text.trim().length < 5) return toast.error('Write a message before posting.');
    setPosting(true);
    try {
      await postCaseUpdate(r.id, { kind: a.kind, title: a.title, body: text.trim(), is_public: a.visible });
      setText('');
      toast.success(a.visible ? 'Update published to citizen' : 'Saved. Staff only.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'We could not save this update.'));
    } finally {
      setPosting(false);
    }
  };

  const applyStatus = () => {
    if (!r) return;
    const needsNote = newStatus === 'Resolved' || newStatus === 'Rejected';
    const min = newStatus === 'Resolved' ? 20 : 10;
    if (needsNote && summary.trim().length < min) {
      setSummaryError(
        newStatus === 'Resolved'
          ? 'A resolution summary of at least 20 characters is required before resolving.'
          : 'Please give a reason of at least 10 characters. The citizen will see it.',
      );
      return;
    }
    setConfirm(true);
  };

  const confirmStatus = async () => {
    if (!r) return;
    setSaving(true);
    try {
      await setCaseStatus(r.id, newStatus, summary.trim());
      toast.success(`Case marked ${newStatus}`);
      setConfirm(false);
      setSummary('');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'We could not update the status.'));
    } finally {
      setSaving(false);
    }
  };

  const claim = async () => {
    if (!r) return;
    setClaiming(true);
    try {
      await assignCaseToMe(r.id, user.id);
      toast.success('Case assigned to you');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'We could not assign this case.'));
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !r) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t open this case"
            body={error || 'This case was not found.'}
            action={
              <button type="button" className="btn-primary" onClick={() => { setLoading(true); load(); }}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const needsNote = newStatus === 'Resolved' || newStatus === 'Rejected';

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link href="/officer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" /> Back to workspace
      </Link>

      <header className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-muted">{r.ref_number}</span>
            <StatusBadge status={r.status as BadgeStatus} size="md" />
            {prio && <PriorityBadge priority={prio as never} />}
          </div>
          <h1 className="mt-2 max-w-3xl text-2xl font-extrabold tracking-tight text-ink">{r.title}</h1>
        </div>
        {dl && (
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-line">
            <AlarmClockIcon className="h-4 w-4" aria-hidden="true" />
            <span className={dl.cls}>Service deadline: {dl.text}</span>
          </div>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5 md:p-6">
            <h2 className="font-bold text-ink">Submitted information</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-[#3A433D]">{r.description}</p>
            <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Category</dt>
                <dd className="font-medium text-ink">{lookups.categoryName(r.category)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Department</dt>
                <dd className="font-medium text-ink">{deptName || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Submitted</dt>
                <dd className="font-medium text-ink">{formatDateTime(r.submitted_at)}</dd>
              </div>
              <div className="flex gap-2">
                <MapPinIcon className="mt-4 h-4 w-4 text-muted" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-muted">Location</dt>
                  <dd className="font-medium text-ink">{r.ward}, {r.sub_county}</dd>
                </div>
              </div>
            </dl>

            {r.evidence.length > 0 && (
              <div className="mt-5 border-t border-line pt-5">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <PaperclipIcon className="h-4 w-4" /> Attachments ({r.evidence.length})
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {r.evidence.map((e, i) => (
                    <a key={e.id} href={e.image_url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.image_url} alt={`Attachment ${i + 1}`} className="aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-line" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="card p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-ink">Activity history</h2>
              <div className="flex gap-3 text-xs font-medium text-muted">
                <span className="flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5 text-brand" /> Visible to citizen</span>
                <span className="flex items-center gap-1"><LockIcon className="h-3.5 w-3.5 text-gold-ink" /> Staff only</span>
              </div>
            </div>
            {events.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No activity yet.</p>
            ) : (
              <ol className="mt-6 space-y-5 border-l-2 border-line pl-5">
                {events.map((e) => {
                  const staff = isStaffOnly(e as unknown as Record<string, unknown>);
                  return (
                    <li key={e.id} className="relative">
                      <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${staff ? 'bg-gold' : 'bg-brand'}`} />
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">{e.title}</p>
                        {staff && (
                          <span className="flex items-center gap-1 rounded-md bg-gold-50 px-1.5 py-0.5 text-[11px] font-semibold text-gold-ink">
                            <LockIcon className="h-3 w-3" /> Staff only
                          </span>
                        )}
                      </div>
                      {e.body && <p className="mt-0.5 whitespace-pre-line text-sm text-muted">{e.body}</p>}
                      <time className="mt-1 block text-xs text-muted" dateTime={e.created_at}>{formatDateTime(e.created_at)}</time>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {r.assigned_officer === null && open && (
            <section className="card p-4">
              <h2 className="font-bold text-ink">Unassigned case</h2>
              <p className="mt-0.5 text-xs text-muted">Take this case to start working on it.</p>
              <button type="button" onClick={claim} disabled={claiming} className="btn-primary mt-3 w-full">
                <UserCheckIcon className="h-4 w-4" /> {claiming ? 'Assigning…' : 'Assign to me'}
              </button>
            </section>
          )}

          <section className="card overflow-hidden">
            <div className="grid grid-cols-2 border-b border-line" role="tablist">
              {ACTIONS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={action === x.id}
                  onClick={() => setAction(x.id)}
                  className={`border-b-2 px-3 py-3 text-xs font-semibold transition-colors duration-150 ${
                    action === x.id ? 'border-brand bg-white text-brand' : 'border-transparent bg-canvas/60 text-muted hover:text-ink'
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              <div className={`mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${a.visible ? 'bg-brand-50 text-brand' : 'bg-gold-50 text-gold-ink'}`}>
                {a.visible ? <EyeIcon className="h-3.5 w-3.5" /> : <LockIcon className="h-3.5 w-3.5" />}
                {a.visible ? 'The citizen will see this message' : 'Only county staff will see this'}
              </div>
              <label htmlFor="action-text" className="sr-only">{a.label}</label>
              <textarea id="action-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={a.placeholder} className="field" />
              <button type="button" onClick={post} disabled={posting} className="btn-primary mt-3 w-full">
                <SendIcon className="h-4 w-4" /> {posting ? 'Saving…' : a.visible ? 'Publish' : 'Save'}
              </button>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="font-bold text-ink">Update status</h2>
            <label htmlFor="status" className="mt-3 block text-sm font-semibold text-ink">New status</label>
            <select
              id="status"
              value={newStatus}
              onChange={(e) => { setNewStatus(e.target.value); setSummaryError(''); }}
              className="field mt-1.5 h-10"
            >
              {STATUSES.map((s) => (<option key={s}>{s}</option>))}
            </select>
            {needsNote && (
              <div className="mt-3">
                <label htmlFor="summary" className="text-sm font-semibold text-ink">
                  {newStatus === 'Resolved' ? 'Resolution summary' : 'Reason for rejection'} <span className="text-danger">*</span>
                </label>
                <textarea
                  id="summary"
                  rows={3}
                  value={summary}
                  onChange={(e) => { setSummary(e.target.value); setSummaryError(''); }}
                  className={`field mt-1.5 ${summaryError ? 'field-error' : ''}`}
                  placeholder={newStatus === 'Resolved' ? 'What was done to resolve this? The citizen will see this.' : 'Why is this request being closed? The citizen will see this.'}
                  aria-invalid={!!summaryError}
                />
                {summaryError && <p role="alert" className="mt-1 text-xs font-medium text-danger">{summaryError}</p>}
              </div>
            )}
            <button type="button" onClick={applyStatus} disabled={newStatus === r.status} className="btn-secondary mt-3 w-full">
              Apply status
            </button>
          </section>
        </aside>
      </div>

      <Modal
        open={confirm}
        onClose={() => !saving && setConfirm(false)}
        title={`Mark as ${newStatus}?`}
        description="The citizen will be notified of this status change."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setConfirm(false)} disabled={saving}>Cancel</button>
            <button type="button" className="btn-primary" onClick={confirmStatus} disabled={saving}>
              {saving ? 'Saving…' : 'Confirm'}
            </button>
          </>
        }
      >
        {needsNote && <p className="rounded-lg bg-canvas p-3 text-sm text-[#3A433D]">{summary}</p>}
      </Modal>
    </div>
  );
}