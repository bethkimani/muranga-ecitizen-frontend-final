import { api, unwrap } from './client';

export type RequestStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';

export type ApiRequest = {
  id: number;
  ref_number: string;
  title: string;
  description: string;
  category: number;
  citizen: number;
  sub_county: string;
  ward: string;
  landmark: string;
  coordinates: string | null;
  status: RequestStatus;
  assigned_department: number | null;
  assigned_officer: number | null;
  status_note: string | null;
  evidence: { id: number; image_url: string; uploaded_at: string }[];
  timeline: { id: number; title: string; body: string; author_name: string; kind: string; created_at: string }[];
  submitted_at: string;
  updated_at: string;
};

export type NewRequest = {
  title: string;
  description: string;
  category: number;
  sub_county: string;
  ward: string;
  landmark: string;
  coordinates?: string;
};

// The backend filters this by role: citizens get their own, officers their department's, admins everything.
export async function getMyRequests() {
  return unwrap(await api<ApiRequest[] | { results: ApiRequest[] }>('/requests/'));
}

export function getRequest(id: number | string) {
  return api<ApiRequest>(`/requests/${id}/`);
}

export function createRequest(input: NewRequest) {
  return api<ApiRequest>('/requests/', { method: 'POST', body: JSON.stringify(input) });
}

// Staff only
export function setRequestStatus(id: number, status: RequestStatus, note = '') {
  return api<ApiRequest>(`/requests/${id}/status/`, {
    method: 'POST',
    body: JSON.stringify({ status, note }),
  });
}

// Department heads and admins only
export function assignRequest(id: number, officer: number) {
  return api<ApiRequest>(`/requests/${id}/assign/`, {
    method: 'POST',
    body: JSON.stringify({ officer }),
  });
}