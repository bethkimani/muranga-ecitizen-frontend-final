'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  InboxIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  WifiOffIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllRequests } from '@/api/adminRequests';
import { createCategory, listManagedCategories, updateCategory, type CategoryRecord } from '@/api/manage';
import { fieldErrors } from '@/api/auth';
import { ApiError } from '@/api/client';
import type { ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { categoryIcon } from '@/utils/categoryIcon';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui';

const tabs = [
  { label: 'Departments', to: '/admin/departments' },
  { label: 'Service categories & rules', to: '/admin/categories' },
  { label: 'Locations and wards', to: '/admin/locations' },
];

const isOpen = (r: ApiRequest) => r.status !== 'Resolved' && r.status !== 'Rejected';

type CatForm = { id: string; name: string; department: string; description: string; days: string };
type FormErrors = Record<string, string | undefined>;

const emptyForm: CatForm = { id: '', name: '', department: '', description: '', days: '3' };

// Turns an API failure into field errors plus a general message.
function toFormErrors(err: unknown, fields: string[]): FormErrors {
  if (err instanceof ApiError && err.status === 400) {
    const fe = fieldErrors(err.data);
    const out: FormErrors = { general: fe.detail || fe.non_field_errors };
    fields.forEach((f) => (out[f] = fe[f]));
    return out;
  }
  if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
    return { general: 'Only a county administrator can make this change.' };
  }
  return { general: 'Could not save. The server may be waking up, so please try again in a moment.' };
}

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lookups = useLookups();

  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [managed, setManaged] = useState<CategoryRecord[]>([]);
  const [countsFailed, setCountsFailed] = useState(false);
  const [q, setQ] = useState('');

  // Add / edit dialog
  const [form, setForm] = useState<CatForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const loadCounts = useCallback(async () => {
    setCountsFailed(false);
    try {
      setRequests(await getAllRequests());
    } catch {
      setRequests([]);
      setCountsFailed(true); // the page still works, counts show "—"
    }
  }, []);

  const loadManaged = useCallback(async () => {
    try {
      setManaged(await listManagedCategories());
    } catch {
      setManaged([]); // edit still opens, using the details the list already has
    }
  }, []);

  useEffect(() => {
    loadCounts();
    loadManaged();
  }, [loadCounts, loadManaged]);

  const refreshAll = () => {
    lookups.reload();
    loadCounts();
    loadManaged();
  };

  const deptName = useCallback(
    (id: unknown) => lookups.departments.find((d) => String(d.id) === String(id))?.name ?? 'Unassigned',
    [lookups.departments],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lookups.categories
      .map((c) => {
        const mine = requests.filter((r) => String(r.category) === String(c.id));
        return {
          ...c,
          departmentLabel: deptName(c.department),
          total: mine.length,
          open: mine.filter(isOpen).length,
        };
      })
      .filter((c) => !needle || `${c.name} ${c.description ?? ''} ${c.departmentLabel}`.toLowerCase().includes(needle));
  }, [lookups.categories, requests, q, deptName]);

  // ---------- Add / edit ----------
  const openAdd = () => {
    setErrors({});
    setForm({ ...emptyForm });
  };

  const openEdit = (id: string) => {
    const rec = managed.find((c) => String(c.id) === id);
    const fallback = lookups.categories.find((c) => String(c.id) === id);
    setErrors({});
    setForm({
      id,
      name: rec?.name ?? fallback?.name ?? '',
      department: String(rec?.department ?? fallback?.department ?? ''),
      description: rec?.description ?? fallback?.description ?? '',
      days: String(rec?.response_target_days ?? 3),
    });
  };

  const closeForm = () => {
    if (!saving) setForm(null);
  };

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;

    const next: FormErrors = {};
    const days = Number(form.days);
    if (!form.name.trim()) next.name = 'Enter a category name.';
    if (!form.department) next.department = 'Choose the department that handles this category.';
    if (!form.description.trim()) next.description = 'Add a short description.';
    if (!Number.isInteger(days) || days < 1) next.response_target_days = 'Enter a whole number of days, 1 or more.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        department: Number(form.department),
        description: form.description.trim(),
        response_target_days: days,
      };
      if (form.id) {
        await updateCategory(form.id, payload);
        toast.success('Category updated.');
      } else {
        await createCategory(payload);
        toast.success('Category added.');
      }
      setForm(null);
      refreshAll();
    } catch (err) {
      setErrors(toFormErrors(err, ['name', 'department', 'description', 'response_target_days']));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Departments and routing"
        description="Service categories, the department each one routes to, and its response target."
      />

      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.to);
          return (
            <button
              key={t.to}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => router.push(t.to)}
              className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors duration-150 ${
                active ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {lookups.loading ? (
        <div className="card space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-16 w-full" />))}
        </div>
      ) : lookups.error ? (
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load the categories"
            body={lookups.error}
            action={
              <button type="button" className="btn-primary" onClick={lookups.reload}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : lookups.categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={InboxIcon}
            title="No service categories yet"
            body="Add a category so citizens can report issues and requests can be routed."
            action={
              <button type="button" className="btn-primary" onClick={openAdd}>
                <PlusIcon className="h-4 w-4" /> Add category
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="relative block md:w-80">
              <span className="sr-only">Search categories</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search categories"
                className="field h-11"
                style={{ paddingLeft: 36 }}
              />
            </label>
            <button type="button" className="btn-primary h-11" onClick={openAdd}>
              <PlusIcon className="h-4 w-4" /> Add category
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="card">
              <EmptyState icon={SearchXIcon} title={`No categories match “${q}”`} body="Try a simpler word." />
            </div>
          ) : (
            <div className="card divide-y divide-line">
              {rows.map((c) => {
                const Icon = categoryIcon(c.name);
                return (
                  <div key={c.id} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1fr_120px_70px] md:items-center">
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{c.name}</p>
                        {c.description && <p className="mt-0.5 text-xs text-muted">{c.description}</p>}
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="mb-1 block text-xs font-semibold text-muted">Routes to</span>
                      <span className="font-medium text-ink">{c.departmentLabel}</span>
                    </div>

                    <div className="text-sm">
                      <span className="mb-1 block text-xs font-semibold text-muted">Response target</span>
                      <span className="font-medium text-ink">{c.responseTarget || '—'}</span>
                    </div>

                    <div className="text-sm">
                      <span className="mb-1 block text-xs font-semibold text-muted">Requests</span>
                      <span className="font-medium text-ink">
                        {countsFailed ? '—' : c.total}
                        {!countsFailed && c.open > 0 && <span className="ml-1 text-xs text-muted">({c.open} open)</span>}
                      </span>
                    </div>

                    <div className="md:text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(String(c.id))}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
                        aria-label={`Edit ${c.name}`}
                      >
                        <PencilIcon className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------------- Add / edit category ---------------- */}
      {form && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={form.id ? 'Edit category' : 'Add category'}
          onClick={closeForm}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-ink">{form.id ? 'Edit category' : 'Add category'}</h2>
            <p className="mt-1 text-sm text-muted">
              Citizens pick a category when they report an issue. It decides which department receives the request.
            </p>

            {errors.general && (
              <div role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger-50 p-3 text-sm text-[#7A1C1C]">
                {errors.general}
              </div>
            )}

            <form onSubmit={save} className="mt-5 space-y-4" noValidate>
              <FormField label="Category name" htmlFor="cat-name" error={errors.name}>
                <input
                  id="cat-name"
                  type="text"
                  autoFocus
                  className={`field h-11 ${errors.name ? 'field-error' : ''}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Pothole"
                />
              </FormField>

              <FormField label="Department" htmlFor="cat-dept" error={errors.department}>
                <select
                  id="cat-dept"
                  className={`field h-11 ${errors.department ? 'field-error' : ''}`}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Choose a department</option>
                  {lookups.departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Description" htmlFor="cat-desc" error={errors.description}>
                <textarea
                  id="cat-desc"
                  rows={3}
                  className={`field ${errors.description ? 'field-error' : ''}`}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What kind of issues belong here"
                />
              </FormField>

              <FormField label="Response target (days)" htmlFor="cat-days" error={errors.response_target_days}>
                <input
                  id="cat-days"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className={`field h-11 ${errors.response_target_days ? 'field-error' : ''}`}
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-canvas disabled:opacity-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary h-11 min-w-[150px]" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : form.id ? (
                    'Save changes'
                  ) : (
                    'Add category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}