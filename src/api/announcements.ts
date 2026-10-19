import { api, unwrap } from '@/api/client';

export type Announcement = {
  id: string;
  title: string;
  body: string;
  category: string;
  date: string;
};

// Change these if your Django URLs are different.
const LIST_URL = '/announcements/';
const itemUrl = (id: string) => `/announcements/${id}/`;

const s = (v: unknown) => (typeof v === 'string' ? v : '');

function toAnnouncement(r: Record<string, unknown>, i: number): Announcement {
  return {
    id: String(r.id ?? i),
    title: s(r.title),
    body: s(r.summary) || s(r.body) || s(r.description) || s(r.content) || s(r.message),
    category: s(r.category_name) || s(r.category),
    date: s(r.published_at) || s(r.created_at) || s(r.date),
  };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const rows = unwrap(
    await api<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(LIST_URL),
  );
  return rows.map(toAnnouncement).filter((a) => a.title);
}

export function createAnnouncement(data: { title: string; body: string; category: string }) {
  return api(LIST_URL, {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      body: data.body,
      summary: data.body,
      ...(data.category ? { category: data.category } : {}),
    }),
  });
}

export function deleteAnnouncement(id: string) {
  return api(itemUrl(id), { method: 'DELETE' });
}