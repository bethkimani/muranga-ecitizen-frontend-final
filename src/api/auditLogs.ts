import { api, unwrap } from '@/api/client';

export type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: 'Create' | 'Update' | 'Delete' | 'Access' | string;
  model: string;
  record: string;
  ip: string;
  changes: { field: string; from: string; to: string }[];
};

// Change this if your Django route is different.
const URL = '/audit-logs/';

const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

function toEntry(r: Record<string, unknown>, i: number): AuditEntry {
  const raw = (r.changes && typeof r.changes === 'object' ? r.changes : {}) as Record<string, unknown>;
  const changes = Object.entries(raw).map(([field, v]) => {
    const pair = Array.isArray(v) ? v : [null, v];
    return { field, from: s(pair[0]), to: s(pair[1]) };
  });
  return {
    id: s(r.id) || String(i),
    timestamp: s(r.timestamp),
    actor: s(r.actor_name) || 'System',
    action: s(r.action_label) || 'Update',
    model: s(r.model),
    record: s(r.object_repr),
    ip: s(r.remote_addr),
    changes,
  };
}

export async function getAuditLogs(): Promise<AuditEntry[]> {
  const rows = unwrap(await api<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(URL));
  return rows.map(toEntry);
}