import { api } from './client';
import type { Role } from './auth';

export type StaffMember = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  role: Exclude<Role, 'CITIZEN'>;
  department: number | null;
  department_name: string | null;
  is_active: boolean;
};

export type NewStaff = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: StaffMember['role'];
  department: number | null;
  password: string;
};

export async function listStaff(): Promise<StaffMember[]> {
  const data = await api<StaffMember[] | { results: StaffMember[] }>('/staff/');
  return Array.isArray(data) ? data : data.results;
}

export function createStaff(input: NewStaff) {
  return api<StaffMember>('/staff/', { method: 'POST', body: JSON.stringify(input) });
}

export function updateStaff(id: number, input: Partial<NewStaff> & { is_active?: boolean }) {
  return api<StaffMember>(`/staff/${id}/`, { method: 'PATCH', body: JSON.stringify(input) });
}

// Deactivates the account (the backend keeps the record so request history stays intact)
export function deactivateStaff(id: number) {
  return api<null>(`/staff/${id}/`, { method: 'DELETE' });
}

// Admin only: sends the staff member a code and link to choose a new password
export function sendStaffReset(id: number) {
  return api<{ detail: string }>(`/staff/${id}/send-reset/`, { method: 'POST' });
}