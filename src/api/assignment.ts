import { api, unwrap } from '@/api/client';

export type Officer = { id: string; name: string; department: string };

// Change these if your Django URLs or field names are different.
const OFFICERS_URL = '/users/?role=OFFICER';
const requestUrl = (id: number) => `/requests/${id}/`;

function toOfficer(r: Record<string, unknown>): Officer {
  const s = (v: unknown) => (typeof v === 'string' ? v : '');
  const d = r.department;
  return {
    id: String(r.id ?? ''),
    name:
      s(r.full_name) ||
      [s(r.first_name), s(r.last_name)].filter(Boolean).join(' ') ||
      s(r.name) ||
      s(r.username) ||
      s(r.email),
    department: d && typeof d === 'object' ? String((d as { id?: unknown }).id ?? '') : d == null ? '' : String(d),
  };
}

export async function getOfficers(): Promise<Officer[]> {
  const rows = unwrap(
    await api<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(OFFICERS_URL),
  );
  return rows.map(toOfficer).filter((o) => o.id && o.name);
}

export function assignRequest(id: number, department: string, officer: string) {
  return api(requestUrl(id), {
    method: 'PATCH',
    body: JSON.stringify({
      department: department ? Number(department) : null,
      ...(officer ? { assigned_to: Number(officer) } : {}),
    }),
  });
}