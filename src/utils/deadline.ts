import type { ApiRequest } from '@/api/requests';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const raw = (r: ApiRequest, k: string) => (r as unknown as Record<string, unknown>)[k];

// "48 hours", "3 days", "1 week" -> milliseconds
export function parseTarget(t: unknown): number | null {
  const m = String(t ?? '').toLowerCase().match(/(\d+(?:\.\d+)?)\s*(hour|hr|day|week)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].startsWith('h') ? HOUR : m[2].startsWith('w') ? 7 * DAY : DAY;
  return n * unit;
}

// Real deadline: the API's own field if it sends one, otherwise submitted time + the category's response target.
export function dueAt(r: ApiRequest, responseTarget?: unknown): number | null {
  const v = raw(r, 'sla_due') ?? raw(r, 'due_date');
  if (typeof v === 'string' && v) return new Date(v).getTime();
  const t = parseTarget(responseTarget);
  return t ? new Date(r.submitted_at).getTime() + t : null;
}

export function deadlineLabel(due: number): { text: string; cls: string } {
  const ms = due - Date.now();
  if (ms < 0) {
    const d = Math.ceil(-ms / DAY);
    return { text: d <= 1 ? 'Overdue' : `${d}d overdue`, cls: 'text-danger' };
  }
  if (ms < DAY) return { text: 'Due today', cls: 'text-warning-ink' };
  const d = Math.ceil(ms / DAY);
  return { text: `${d}d left`, cls: d <= 2 ? 'text-warning-ink' : 'text-muted' };
}

// Only returns a value if the API sends a priority field
export function priorityOf(r: ApiRequest): string {
  const v = raw(r, 'priority');
  return typeof v === 'string' && v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : '';
}