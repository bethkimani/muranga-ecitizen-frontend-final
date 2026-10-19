import { api, unwrap } from '@/api/client';
import type { ApiRequest } from '@/api/requests';

// Admin/officer view of ALL requests. Change these paths if your Django URLs differ.
export async function getAllRequests(): Promise<ApiRequest[]> {
  return unwrap(await api<ApiRequest[] | { results: ApiRequest[] }>('/requests/?page_size=1000'));
}

export function updateRequestStatus(id: number, status: string, status_note: string) {
  return api<ApiRequest>(`/requests/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status, status_note }),
  });
}