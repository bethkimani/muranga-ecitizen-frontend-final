'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCategories,
  getDepartments,
  type ApiCategory,
  type ApiDepartment,
} from '@/api/categories';
import { errorMessage } from '@/utils/errors';

type Data = { categories: ApiCategory[]; departments: ApiDepartment[] };

// Shared across pages so categories are fetched once per session.
let cache: Promise<Data> | null = null;

function load(force = false): Promise<Data> {
  if (!cache || force) {
    cache = Promise.all([getCategories(), getDepartments()])
      .then(([categories, departments]) => ({ categories, departments }))
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

export function useLookups() {
  const [data, setData] = useState<Data>({ categories: [], departments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const run = useCallback((force = false) => {
    setLoading(true);
    setError('');
    load(force)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'We could not load services.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const deptMap = useMemo(() => new Map(data.departments.map((d) => [d.id, d.name])), [data.departments]);

  return {
    categories: data.categories,
    departments: data.departments,
    loading,
    error,
    reload: () => run(true),
    findCategory: (id: number | null | undefined) => (id == null ? undefined : catMap.get(id)),
    categoryName: (id: number) => catMap.get(id)?.name ?? 'Service',
    departmentName: (id: number | null | undefined) =>
      id == null ? null : deptMap.get(id) ?? 'Assigned',
  };
}