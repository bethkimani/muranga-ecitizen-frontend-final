import { api, unwrap } from './client';

// Admin only. These call /api/manage/... on the backend.

export type DepartmentRecord = {
  id: number;
  name: string;
  description: string;
  head_officer_name: string;
};

export type DepartmentInput = {
  name: string;
  description: string;
  head_officer_name: string;
};

export type CategoryRecord = {
  id: number;
  name: string;
  department: number;
  description: string;
  response_target_days: number;
};

export type CategoryInput = {
  name: string;
  department: number;
  description: string;
  response_target_days: number;
};

type List<T> = T[] | { results: T[] };

// ---------- Departments ----------

export async function listManagedDepartments(): Promise<DepartmentRecord[]> {
  return unwrap(await api<List<DepartmentRecord>>('/manage/departments/'));
}

export function createDepartment(input: DepartmentInput) {
  return api<DepartmentRecord>('/manage/departments/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateDepartment(id: string | number, input: DepartmentInput) {
  return api<DepartmentRecord>(`/manage/departments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// ---------- Categories ----------

export async function listManagedCategories(): Promise<CategoryRecord[]> {
  return unwrap(await api<List<CategoryRecord>>('/manage/categories/'));
}

export function createCategory(input: CategoryInput) {
  return api<CategoryRecord>('/manage/categories/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCategory(id: string | number, input: CategoryInput) {
  return api<CategoryRecord>(`/manage/categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}