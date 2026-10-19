import { api } from '@/api/client';
import type { ApiRequest } from '@/api/requests';

// Change these if your Django routes differ.
export const getCase = (id: string) => api<ApiRequest>(`/requests/${id}/`);

export const setCaseStatus = (id: number, status: string, status_note: string) =>
  api(`/requests/${id}/`, { method: 'PATCH', body: JSON.stringify({ status, status_note }) });

export const assignCaseToMe = (id: number, officerId: number) =>
  api(`/requests/${id}/`, { method: 'PATCH', body: JSON.stringify({ assigned_officer: officerId }) });

export const postCaseUpdate = (
  id: number,
  data: { kind: string; title: string; body: string; is_public: boolean },
) => api(`/requests/${id}/updates/`, { method: 'POST', body: JSON.stringify(data) });