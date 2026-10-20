import { api, unwrap } from '@/api/client';

export type Officer = { id: string; name: string; department: string };

// Staff accounts live at /api/staff/ (admin only). Officers have the role STAFF.
const OFFICERS_URL = '/staff/';
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

// Only active officers (role STAFF). Department heads and admins are not listed as officers.
const isActiveOfficer = (r: Record<string, unknown>) =>
  (r.role === undefined || r.role === 'STAFF') && r.is_active !== false;

export async function getOfficers(): Promise<Officer[]> {
  const rows = unwrap(
    await api<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(OFFICERS_URL),
  );
  return rows.filter(isActiveOfficer).map(toOfficer).filter((o) => o.id && o.name);
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