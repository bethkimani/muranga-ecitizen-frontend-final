'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellOffIcon, CheckCheckIcon, CircleCheckIcon, FileCheck2Icon, HelpCircleIcon,
  MegaphoneIcon, RefreshCwIcon, UserCheckIcon, WifiOffIcon,
} from 'lucide-react';
import { api, unwrap } from '@/api/client';
import { getMyRequests, type ApiRequest } from '@/api/requests';
import { useCurrentUser } from '@/components/RequireRole';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui';
import { errorMessage } from '@/utils/errors';
import { formatDate, relativeTime } from '@/utils/format';

type Look = { icon: typeof MegaphoneIcon; cls: string };

const LOOKS: Record<'submitted' | 'assigned' | 'status' | 'clarification' | 'resolved', Look> = {
  submitted: { icon: FileCheck2Icon, cls: 'bg-canvas text-ink' },
  assigned: { icon: UserCheckIcon, cls: 'bg-info-50 text-info' },
  status: { icon: RefreshCwIcon, cls: 'bg-info-50 text-info' },
  clarification: { icon: HelpCircleIcon, cls: 'bg-warning-50 text-warning-ink' },
  resolved: { icon: CircleCheckIcon, cls: 'bg-success-50 text-success' },
};

function lookFor(kind: string, title: string): Look {
  const t = `${kind} ${title}`.toLowerCase();
  if (/resolv|complet|closed/.test(t)) return LOOKS.resolved;
  if (/assign/.test(t)) return LOOKS.assigned;
  if (/clarif|question|more info/.test(t)) return LOOKS.clarification;
  if (/submit|receiv/.test(t)) return LOOKS.submitted;
  return LOOKS.status;
}

type Item = {
  key: string;
  requestId: number;
  ref: string;
  title: string;
  body: string;
  date: string;
  look: Look;
};

type Announcement = { id: string; title: string; summary: string; category: string; date: string };

function toAnnouncement(r: Record<string, unknown>, i: number): Announcement {
  const s = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    id: String(r.id ?? i),
    title: s(r.title),
    summary: s(r.summary) || s(r.body) || s(r.description) || s(r.content),
    category: s(r.category_name) || s(r.category) || 'Notice',
    date: s(r.published_at) || s(r.created_at) || s(r.date),
  };
}

export default function NotificationsPage() {
  const user = useCurrentUser();
  const uid = String((user as { id?: unknown } | null)?.id ?? 'me');
  const storageKey = `muranga:read-notifications:${uid}`;

  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [read, setRead] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [tab, setTab] = useState<'notifications' | 'announcements'>('notifications');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await getMyRequests());
    } catch (err) {
      setError(errorMessage(err, 'We could not load your notifications.'));
    } finally {
      setLoading(false);
    }
    // Optional endpoint: if it doesn't exist, the tab simply stays empty.
    try {
      const rows = unwrap(await api<Record<string, unknown>[] | { results: Record<string, unknown>[] }>('/announcements/'));
      setAnnouncements(rows.map(toAnnouncement).filter((a) => a.title));
    } catch {
      setAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Read/unread is remembered in this browser only.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setRead(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      setRead(new Set());
    }
  }, [storageKey]);

  const persist = (next: Set<string>) => {
    setRead(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
    } catch {
      /* storage unavailable — keep in memory */
    }
  };

  const items: Item[] = useMemo(
    () =>
      requests
        .flatMap((r) =>
          r.timeline.map((e) => ({
            key: `${r.id}-${e.id}`,
            requestId: r.id,
            ref: r.ref_number,
            title: e.title,
            body: e.body,
            date: e.created_at,
            look: lookFor(e.kind, e.title),
          })),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [requests],
  );

  const unread = items.filter((n) => !read.has(n.key)).length;
  const shown = items.filter((n) => filter === 'all' || !read.has(n.key));

  const markOne = (key: string) => {
    if (read.has(key)) return;
    persist(new Set(read).add(key));
  };
  const markAll = () => persist(new Set(items.map((n) => n.key)));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Notifications"
        description="Updates on your requests and announcements from the county."
        actions={
          unread > 0 && tab === 'notifications' ? (
            <button type="button" onClick={markAll} className="btn-secondary">
              <CheckCheckIcon className="h-4 w-4" /> Mark all as read
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div className="flex gap-6" role="tablist">
          {(['notifications', 'announcements'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-3 text-sm font-semibold capitalize transition-colors duration-150 ${
                tab === t ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t}
              {t === 'notifications' && unread > 0 && (
                <span className="ml-1.5 rounded-full bg-brand px-1.5 text-[11px] text-white">{unread}</span>
              )}
            </button>
          ))}
        </div>
        {tab === 'notifications' && (
          <div className="mb-2 flex rounded-lg bg-canvas p-0.5 text-sm">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-md px-3 py-1 font-semibold capitalize ${
                  filter === f ? 'bg-white text-ink shadow-card' : 'text-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card mt-6 space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : tab === 'notifications' ? (
        error ? (
          <div className="card mt-6">
            <EmptyState
              icon={WifiOffIcon}
              title="We couldn’t load your notifications"
              body={error}
              action={
                <button type="button" className="btn-primary" onClick={load}>
                  <RefreshCwIcon className="h-4 w-4" /> Try again
                </button>
              }
            />
          </div>
        ) : shown.length === 0 ? (
          <div className="card mt-6">
            <EmptyState
              icon={BellOffIcon}
              title="You’re all caught up"
              body="New updates on your requests will appear here."
            />
          </div>
        ) : (
          <ul className="card mt-6 divide-y divide-line overflow-hidden">
            {shown.map((n) => {
              const isRead = read.has(n.key);
              const Icon = n.look.icon;
              return (
                <li key={n.key} className={isRead ? '' : 'bg-brand-50/40'}>
                  <Link
                    href={`/portal/requests/${n.requestId}`}
                    onClick={() => markOne(n.key)}
                    className="flex gap-4 p-4 transition-colors duration-150 hover:bg-canvas md:p-5"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.look.cls}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm ${isRead ? 'font-medium text-ink' : 'font-bold text-ink'}`}>
                          {n.title}
                          {!isRead && <span className="sr-only"> (unread)</span>}
                        </p>
                        <time className="shrink-0 text-xs text-muted" dateTime={n.date}>
                          {relativeTime(n.date)}
                        </time>
                      </div>
                      {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                      <p className="mt-1.5 font-mono text-xs font-semibold text-brand">{n.ref} →</p>
                    </div>
                    {!isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      ) : announcements.length === 0 ? (
        <div className="card mt-6">
          <EmptyState
            icon={MegaphoneIcon}
            title="No announcements right now"
            body="Planned interruptions and county service news will appear here."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="card p-5">
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-md bg-brand-50 px-2 py-0.5 font-bold text-brand">{a.category}</span>
                {a.date && (
                  <time className="text-muted" dateTime={a.date}>
                    Published {formatDate(a.date)}
                  </time>
                )}
              </div>
              <h2 className="mt-2 font-bold text-ink">{a.title}</h2>
              {a.summary && <p className="mt-1 text-sm text-muted">{a.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}