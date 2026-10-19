'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  MegaphoneIcon, PlusIcon, RefreshCwIcon, SearchIcon, SearchXIcon, Trash2Icon, WifiOffIcon,
} from 'lucide-react';
import {
  createAnnouncement, deleteAnnouncement, getAnnouncements, type Announcement,
} from '@/api/announcements';
import { Modal } from '@/components/Modal';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: '' });
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getAnnouncements();
      setItems(rows.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      setError(errorMessage(err, 'We could not load the announcements.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((a) => !needle || `${a.title} ${a.body} ${a.category}`.toLowerCase().includes(needle));
  }, [items, q]);

  const openCreate = () => {
    setForm({ title: '', body: '', category: '' });
    setCreateOpen(true);
  };

  const publish = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Please add a title and a message.');
      return;
    }
    setSaving(true);
    try {
      await createAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category.trim(),
      });
      toast.success('Announcement published.');
      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'We could not publish the announcement.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(toDelete.id);
      setItems((list) => list.filter((a) => a.id !== toDelete.id));
      toast.success('Announcement deleted.');
      setToDelete(null);
    } catch (err) {
      toast.error(errorMessage(err, 'We could not delete the announcement.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Announcements"
        description="Planned interruptions and county service news shown to citizens."
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <PlusIcon className="h-4 w-4" /> New announcement
          </button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (<Skeleton key={i} className="h-28 w-full" />))}
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load the announcements"
            body={error}
            action={
              <button type="button" className="btn-primary" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={MegaphoneIcon}
            title="No announcements yet"
            body="Publish your first announcement and citizens will see it in their portal."
            action={
              <button type="button" className="btn-primary" onClick={openCreate}>
                <PlusIcon className="h-4 w-4" /> New announcement
              </button>
            }
          />
        </div>
      ) : (
        <>
          <label className="relative mb-4 block md:w-80">
            <span className="sr-only">Search announcements</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search announcements"
              className="field h-11"
              style={{ paddingLeft: 36 }}
            />
          </label>

          {shown.length === 0 ? (
            <div className="card">
              <EmptyState icon={SearchXIcon} title={`No announcements match “${q}”`} body="Try a simpler word." />
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((a) => (
                <li key={a.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {a.category && (
                          <span className="rounded-md bg-brand-50 px-2 py-0.5 font-bold text-brand">{a.category}</span>
                        )}
                        {a.date && (
                          <time className="text-muted" dateTime={a.date}>
                            Published {formatDate(a.date)}
                          </time>
                        )}
                      </div>
                      <h2 className="mt-2 font-bold text-ink">{a.title}</h2>
                      {a.body && <p className="mt-1 whitespace-pre-line text-sm text-muted">{a.body}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setToDelete(a)}
                      className="btn-ghost h-9 w-9 shrink-0 px-0 text-danger hover:bg-danger-50"
                      aria-label={`Delete ${a.title}`}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* ---------- New announcement ---------- */}
      <Modal
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        title="New announcement"
        description="Citizens will see this under Notifications → Announcements."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={publish} disabled={saving}>
              {saving ? 'Publishing…' : 'Publish'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="an-title" className="text-sm font-semibold text-ink">Title</label>
            <input
              id="an-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="field mt-1.5 h-11"
              placeholder="e.g. Planned water interruption in Kangema"
              maxLength={150}
            />
          </div>
          <div>
            <label htmlFor="an-cat" className="flex items-center gap-2 text-sm font-semibold text-ink">
              Category <span className="text-xs font-medium text-muted">Optional</span>
            </label>
            <input
              id="an-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="field mt-1.5 h-11"
              placeholder="e.g. Water, Roads, Health"
              maxLength={60}
            />
          </div>
          <div>
            <label htmlFor="an-body" className="text-sm font-semibold text-ink">Message</label>
            <textarea
              id="an-body"
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="field mt-1.5"
              placeholder="What do citizens need to know?"
            />
          </div>
        </div>
      </Modal>

      {/* ---------- Delete confirmation ---------- */}
      <Modal
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        title="Delete announcement?"
        description={toDelete ? `“${toDelete.title}” will be removed for all citizens.` : ''}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </button>
            <button type="button" className="btn-primary bg-danger hover:bg-[#a51f1f]" onClick={remove} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">This cannot be undone.</p>
      </Modal>
    </div>
  );
}