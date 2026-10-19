import { api, unwrap } from './client';

export type Department = { id: number; name: string };
export type Category = { id: number; name: string; department: number | null };

export async function getDepartments() {
  return unwrap(await api<Department[] | { results: Department[] }>('/departments/', { auth: false }));
}

export async function getCategories() {
  return unwrap(await api<Category[] | { results: Category[] }>('/categories/', { auth: false }));
}