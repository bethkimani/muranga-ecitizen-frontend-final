import { api } from '@/api/client';
import type { ApiRequest } from '@/api/requests';

export const getCase = (id: string) => api<ApiRequest>(`/requests/${id}/`);

// Backend: POST /api/requests/<id>/status/  with { status, note }.
// (A PATCH to /requests/<id>/ cannot change status because the serializer marks it read-only.)
export const setCaseStatus = (id: number, status: string, note: string) =>
  api(`/requests/${id}/status/`, { method: 'POST', body: JSON.stringify({ status, note }) });

// An officer taking an unassigned case in their own department.
export const assignCaseToMe = (id: number, officerId: number) =>
  api(`/requests/${id}/`, { method: 'PATCH', body: JSON.stringify({ assigned_officer: officerId }) });

// Backend: POST /api/requests/<id>/updates/  with { kind, title, body }.
export const postCaseUpdate = (
  id: number,
  data: { kind: string; title: string; body: string; is_public: boolean },
) => api(`/requests/${id}/updates/`, { method: 'POST', body: JSON.stringify(data) });