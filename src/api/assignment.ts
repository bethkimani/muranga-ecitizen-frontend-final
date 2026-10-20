import { api, unwrap } from '@/api/client';

export type Officer = {
  id: string;
  name: string;
  department: string; // department id, '' when unknown
  departmentName: string; // department name, '' when unknown
};

// Staff accounts live at /api/staff/ (admin only). Officers have the role STAFF.
const OFFICERS_URL = '/staff/';
// Backend route: POST /api/requests/<id>/assign/  (admin or department head only)
const assignUrl = (id: number) => `/requests/${id}/assign/`;

function toOfficer(r: Record<string, unknown>): Officer {
  const s = (v: unknown) => (typeof v === 'string' ? v : '');
  const rawDept = r.department ?? r.department_id;
  const isObj = !!rawDept && typeof rawDept === 'object';
  const deptStr =
    rawDept == null ? '' : isObj ? String((rawDept as { id?: unknown }).id ?? '') : String(rawDept);
  const numeric = deptStr !== '' && !isNaN(Number(deptStr));
  return {
    id: String(r.id ?? ''),
    name:
      s(r.full_name) ||
      [s(r.first_name), s(r.last_name)].filter(Boolean).join(' ') ||
      s(r.name) ||
      s(r.username) ||
      s(r.email),
    department: numeric ? deptStr : '',
    departmentName:
      s(r.department_name) || (isObj ? s((rawDept as { name?: unknown }).name) : numeric ? '' : deptStr),
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

// Routes a request to the department of its category and, when an officer is
// given, assigns that officer. Without an officer the department head assigns later.
export function assignRequest(id: number, officer: string) {
  return api<unknown>(assignUrl(id), {
    method: 'POST',
    body: JSON.stringify(officer ? { officer: Number(officer) } : {}),
  });
}