import { api, unwrap } from './client';

export type ApiCategory = {
  id: number;
  name: string;
  description: string;
  department: number | null;
  responseTarget: string | null;
};

export type ApiDepartment = { id: number; name: string };

type Raw = Record<string, unknown>;

const asString = (v: unknown) => (typeof v === 'string' ? v : '');
const asId = (v: unknown): number | null => {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object' && typeof (v as Raw).id === 'number') return (v as Raw).id as number;
  return null;
};

function toCategory(r: Raw): ApiCategory {
  return {
    id: Number(r.id),
    name: asString(r.name) || asString(r.title) || `Category ${r.id}`,
    description: asString(r.description),
    department: asId(r.department ?? r.assigned_department ?? r.department_id),
    responseTarget: asString(r.response_target ?? r.response_time ?? r.sla) || null,
  };
}

export async function getCategories(): Promise<ApiCategory[]> {
  const rows = unwrap(await api<Raw[] | { results: Raw[] }>('/categories/'));
  return rows.filter((r) => r.is_active !== false).map(toCategory);
}

// Optional: if you have no /departments/ endpoint this quietly returns [].
export async function getDepartments(): Promise<ApiDepartment[]> {
  try {
    const rows = unwrap(await api<Raw[] | { results: Raw[] }>('/departments/'));
    return rows.map((r) => ({ id: Number(r.id), name: asString(r.name) || `Department ${r.id}` }));
  } catch {
    return [];
  }
}