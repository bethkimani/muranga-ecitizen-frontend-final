'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { InboxIcon, Loader2Icon, PencilIcon, PlusIcon, RefreshCwIcon, WifiOffIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getAllRequests } from '@/api/adminRequests';
import { getOfficers, type Officer } from '@/api/assignment';
import {
  createCategory,
  createDepartment,
  listManagedCategories,
  listManagedDepartments,
  updateCategory,
  updateDepartment,
  type CategoryRecord,
  type DepartmentRecord,
} from '@/api/manage';
import { fieldErrors } from '@/api/auth';
import { ApiError } from '@/api/client';
import type { ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { categoryIcon } from '@/utils/categoryIcon';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui';

type Tab = 'departments' | 'categories' | 'locations';

const tabs: { id: Tab; label: string; to: string }[] = [
  { id: 'departments', label: 'Departments', to: '/admin/departments' },
  { id: 'categories', label: 'Service categories & rules', to: '/admin/categories' },
  { id: 'locations', label: 'Locations and wards', to: '/admin/locations' },
];

const isOpen = (r: ApiRequest) => r.status !== 'Resolved' && r.status !== 'Rejected';

// ---------- Form types ----------
type DeptForm = { id: string; name: string; description: string; head: string };
type CatForm = { id: string; name: string; department: string; description: string; days: string };
type FormErrors = Record<string, string | undefined>;

const emptyDept: DeptForm = { id: '', name: '', description: '', head: '' };
const emptyCat: CatForm = { id: '', name: '', department: '', description: '', days: '3' };

// ---------- Small shared pieces ----------
function Dialog({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label} {optional && <span className="text-xs font-medium text-muted">Optional</span>}
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

function FormActions({ saving, label, onCancel }: { saving: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
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
        ) : (
          label
        )}
      </button>
    </div>
  );
}

function GeneralError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger-50 p-3 text-sm text-[#7A1C1C]">
      {message}
    </div>
  );
}

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

export default function AdminDepartmentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lookups = useLookups();

  const tab: Tab = pathname.startsWith('/admin/categories')
    ? 'categories'
    : pathname.startsWith('/admin/locations')
    ? 'locations'
    : 'departments';

  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [officers, setOfficers] = useState<Officer[] | null>(null);
  const [managedDepts, setManagedDepts] = useState<DepartmentRecord[]>([]);
  const [managedCats, setManagedCats] = useState<CategoryRecord[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqFailed, setReqFailed] = useState(false);

  // Dialogs
  const [deptForm, setDeptForm] = useState<DeptForm | null>(null);
  const [catForm, setCatForm] = useState<CatForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const load = useCallback(async () => {
    setReqLoading(true);
    setReqFailed(false);
    try {
      setRequests(await getAllRequests());
    } catch {
      setRequests([]);
      setReqFailed(true);
    } finally {
      setReqLoading(false);
    }
    try {
      setOfficers(await getOfficers());
    } catch {
      setOfficers(null); // staff counts show "—" if the staff list isn't available
    }
    try {
      setManagedDepts(await listManagedDepartments());
      setManagedCats(await listManagedCategories());
    } catch {
      // Head officer names and edit forms need these; the page still works without them.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = () => {
    lookups.reload();
    load();
  };

  const categoryDept = useCallback(
    (categoryId: unknown) => {
      const c = lookups.categories.find((x) => String(x.id) === String(categoryId));
      return c ? String(c.department ?? '') : '';
    },
    [lookups.categories],
  );

  const deptName = (id: unknown) =>
    lookups.departments.find((d) => String(d.id) === String(id))?.name ?? 'Unassigned';

  // ---------- Department dialog ----------
  const openAddDept = () => {
    setErrors({});
    setDeptForm({ ...emptyDept });
  };

  const openEditDept = (id: string, fallbackName: string) => {
    const rec = managedDepts.find((d) => String(d.id) === id);
    setErrors({});
    setDeptForm({
      id,
      name: rec?.name ?? fallbackName,
      description: rec?.description ?? '',
      head: rec?.head_officer_name ?? '',
    });
  };

  const saveDept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deptForm) return;
    const name = deptForm.name.trim();
    if (!name) return setErrors({ name: 'Enter a department name.' });

    setSaving(true);
    setErrors({});
    try {
      const payload = {
        name,
        description: deptForm.description.trim(),
        head_officer_name: deptForm.head.trim(),
      };
      if (deptForm.id) {
        await updateDepartment(deptForm.id, payload);
        toast.success('Department updated.');
      } else {
        await createDepartment(payload);
        toast.success('Department added.');
      }
      setDeptForm(null);
      refreshAll();
    } catch (err) {
      setErrors(toFormErrors(err, ['name', 'description', 'head_officer_name']));
    } finally {
      setSaving(false);
    }
  };

  // ---------- Category dialog ----------
  const openAddCat = () => {
    setErrors({});
    setCatForm({ ...emptyCat });
  };

  const openEditCat = (id: string) => {
    const rec = managedCats.find((c) => String(c.id) === id);
    const fallback = lookups.categories.find((c) => String(c.id) === id);
    setErrors({});
    setCatForm({
      id,
      name: rec?.name ?? fallback?.name ?? '',
      department: String(rec?.department ?? fallback?.department ?? ''),
      description: rec?.description ?? fallback?.description ?? '',
      days: String(rec?.response_target_days ?? 3),
    });
  };

  const saveCat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!catForm) return;

    const next: FormErrors = {};
    const days = Number(catForm.days);
    if (!catForm.name.trim()) next.name = 'Enter a category name.';
    if (!catForm.department) next.department = 'Choose the department that handles this category.';
    if (!catForm.description.trim()) next.description = 'Add a short description.';
    if (!Number.isInteger(days) || days < 1) next.response_target_days = 'Enter a whole number of days, 1 or more.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = {
        name: catForm.name.trim(),
        department: Number(catForm.department),
        description: catForm.description.trim(),
        response_target_days: days,
      };
      if (catForm.id) {
        await updateCategory(catForm.id, payload);
        toast.success('Category updated.');
      } else {
        await createCategory(payload);
        toast.success('Category added.');
      }
      setCatForm(null);
      refreshAll();
    } catch (err) {
      setErrors(toFormErrors(err, ['name', 'department', 'description', 'response_target_days']));
    } finally {
      setSaving(false);
    }
  };

  const closeDialogs = () => {
    if (saving) return;
    setDeptForm(null);
    setCatForm(null);
  };

  // ---------- Departments tab ----------
  const deptRows = useMemo(
    () =>
      lookups.departments.map((d) => {
        const id = String(d.id);
        const managed = managedDepts.find((m) => String(m.id) === id);
        return {
          id,
          name: d.name,
          head: managed?.head_officer_name || '',
          staff: officers ? officers.filter((o) => o.department === id).length : null,
          categories: lookups.categories.filter((c) => String(c.department ?? '') === id).map((c) => c.name),
          open: reqFailed ? null : requests.filter((r) => isOpen(r) && categoryDept(r.category) === id).length,
        };
      }),
    [lookups.departments, lookups.categories, managedDepts, officers, requests, reqFailed, categoryDept],
  );

  // ---------- Locations tab (taken from submitted requests) ----------
  const locations = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    requests.forEach((r) => {
      if (!r.sub_county) return;
      const wards = map.get(r.sub_county) ?? new Map<string, number>();
      if (r.ward) wards.set(r.ward, (wards.get(r.ward) ?? 0) + 1);
      map.set(r.sub_county, wards);
    });
    return Array.from(map.entries())
      .map(([name, wards]) => ({
        name,
        wards: Array.from(wards.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const loading = lookups.loading || (tab !== 'categories' && reqLoading);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Departments and routing"
        description="Who handles what, and where."
      />

      {tab === 'departments' && (
        <div className="mb-4 flex justify-end">
          <button type="button" className="btn-primary h-11" onClick={openAddDept}>
            <PlusIcon className="h-4 w-4" /> Add department
          </button>
        </div>
      )}
      {tab === 'categories' && (
        <div className="mb-4 flex justify-end">
          <button type="button" className="btn-primary h-11" onClick={openAddCat}>
            <PlusIcon className="h-4 w-4" /> Add category
          </button>
        </div>
      )}

      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => router.push(t.to)}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors duration-150 ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}
        </div>
      ) : lookups.error ? (
        <div className="card">
          <EmptyState
            icon={WifiOffIcon}
            title="We couldn’t load this page"
            body={lookups.error}
            action={
              <button type="button" className="btn-primary" onClick={lookups.reload}>
                <RefreshCwIcon className="h-4 w-4" /> Try again
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* ---------------- Departments ---------------- */}
          {tab === 'departments' &&
            (deptRows.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={InboxIcon}
                  title="No departments yet"
                  body="Add your first department to start routing requests."
                  action={
                    <button type="button" className="btn-primary" onClick={openAddDept}>
                      <PlusIcon className="h-4 w-4" /> Add department
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-canvas text-left text-xs font-semibold text-muted">
                    <tr>
                      {['Department', 'Head officer', 'Officers', 'Categories handled', 'Open cases', ''].map((h, i) => (
                        <th key={`${h}-${i}`} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {deptRows.map((d) => (
                      <tr key={d.id} className="hover:bg-canvas/60">
                        <td className="px-5 py-3.5 font-semibold text-ink">{d.name}</td>
                        <td className="px-5 py-3.5 text-muted">{d.head || 'Not set'}</td>
                        <td className="px-5 py-3.5 text-ink">{d.staff ?? '—'}</td>
                        <td className="px-5 py-3.5 text-muted">{d.categories.join(', ') || '—'}</td>
                        <td className="px-5 py-3.5 font-semibold text-ink">{d.open ?? '—'}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => openEditDept(d.id, d.name)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
                            aria-label={`Edit ${d.name}`}
                          >
                            <PencilIcon className="h-3.5 w-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* ---------------- Categories ---------------- */}
          {tab === 'categories' &&
            (lookups.categories.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={InboxIcon}
                  title="No service categories yet"
                  body="Add a category so citizens can report issues and requests can be routed."
                  action={
                    <button type="button" className="btn-primary" onClick={openAddCat}>
                      <PlusIcon className="h-4 w-4" /> Add category
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="card divide-y divide-line">
                {lookups.categories.map((c) => {
                  const Icon = categoryIcon(c.name);
                  return (
                    <div key={c.id} className="grid gap-3 p-5 md:grid-cols-[1.4fr_1fr_160px_70px] md:items-center">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{c.name}</p>
                          {c.description && <p className="text-xs text-muted">{c.description}</p>}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="mb-1 block text-xs font-semibold text-muted">Routes to</span>
                        <span className="font-medium text-ink">{deptName(c.department)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="mb-1 block text-xs font-semibold text-muted">Response target</span>
                        <span className="font-medium text-ink">{c.responseTarget || '—'}</span>
                      </div>
                      <div className="md:text-right">
                        <button
                          type="button"
                          onClick={() => openEditCat(String(c.id))}
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
            ))}

          {/* ---------------- Locations ---------------- */}
          {tab === 'locations' &&
            (reqFailed ? (
              <div className="card">
                <EmptyState
                  icon={WifiOffIcon}
                  title="We couldn’t load the locations"
                  body="The requests could not be loaded."
                  action={
                    <button type="button" className="btn-primary" onClick={load}>
                      <RefreshCwIcon className="h-4 w-4" /> Try again
                    </button>
                  }
                />
              </div>
            ) : locations.length === 0 ? (
              <div className="card">
                <EmptyState icon={InboxIcon} title="No locations yet" body="Sub-counties and wards appear here once requests are submitted." />
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted">
                  Showing the sub-counties and wards that citizens have submitted requests from. The number is the request count.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {locations.map((s) => (
                    <section key={s.name} className="card p-5">
                      <div className="flex items-center justify-between">
                        <h2 className="font-bold text-ink">{s.name}</h2>
                        <span className="text-xs text-muted">{s.wards.length} wards</span>
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {s.wards.map(([ward, count]) => (
                          <li key={ward} className="rounded-md bg-canvas px-2 py-1 text-xs font-medium text-ink">
                            {ward} · {count}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </>
            ))}
        </>
      )}

      {/* ---------------- Add / edit department ---------------- */}
      {deptForm && (
        <Dialog
          title={deptForm.id ? 'Edit department' : 'Add department'}
          subtitle={
            deptForm.id
              ? 'Update the department details.'
              : 'Create a department, then add service categories that route to it.'
          }
          onClose={closeDialogs}
        >
          <GeneralError message={errors.general} />
          <form onSubmit={saveDept} className="mt-5 space-y-4" noValidate>
            <FormField label="Department name" htmlFor="dept-name" error={errors.name}>
              <input
                id="dept-name"
                type="text"
                autoFocus
                className={`field h-11 ${errors.name ? 'field-error' : ''}`}
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g. Roads and Public Works"
              />
            </FormField>
            <FormField label="Head officer" htmlFor="dept-head" error={errors.head_officer_name} optional>
              <input
                id="dept-head"
                type="text"
                className={`field h-11 ${errors.head_officer_name ? 'field-error' : ''}`}
                value={deptForm.head}
                onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
                placeholder="Name of the department head"
              />
            </FormField>
            <FormField label="Description" htmlFor="dept-desc" error={errors.description} optional>
              <textarea
                id="dept-desc"
                rows={3}
                className={`field ${errors.description ? 'field-error' : ''}`}
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                placeholder="What this department handles"
              />
            </FormField>
            <FormActions saving={saving} label={deptForm.id ? 'Save changes' : 'Add department'} onCancel={closeDialogs} />
          </form>
        </Dialog>
      )}

      {/* ---------------- Add / edit category ---------------- */}
      {catForm && (
        <Dialog
          title={catForm.id ? 'Edit category' : 'Add category'}
          subtitle="Citizens pick a category when they report an issue. It decides which department receives the request."
          onClose={closeDialogs}
        >
          <GeneralError message={errors.general} />
          <form onSubmit={saveCat} className="mt-5 space-y-4" noValidate>
            <FormField label="Category name" htmlFor="cat-name" error={errors.name}>
              <input
                id="cat-name"
                type="text"
                autoFocus
                className={`field h-11 ${errors.name ? 'field-error' : ''}`}
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="e.g. Pothole"
              />
            </FormField>
            <FormField label="Department" htmlFor="cat-dept" error={errors.department}>
              <select
                id="cat-dept"
                className={`field h-11 ${errors.department ? 'field-error' : ''}`}
                value={catForm.department}
                onChange={(e) => setCatForm({ ...catForm, department: e.target.value })}
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
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
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
                value={catForm.days}
                onChange={(e) => setCatForm({ ...catForm, days: e.target.value })}
              />
            </FormField>
            <FormActions saving={saving} label={catForm.id ? 'Save changes' : 'Add category'} onCancel={closeDialogs} />
          </form>
        </Dialog>
      )}
    </div>
  );
}