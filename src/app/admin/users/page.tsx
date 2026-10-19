'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  KeyRoundIcon, // NEW
  Loader2Icon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
  UsersIcon,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { PageHeader, Field, EmptyState } from '@/components/ui';
import { useCurrentUser } from '@/components/RequireRole';
import { initials } from '@/utils/format';
import { fieldErrors, normalizePhone } from '@/api/auth';
import { ApiError } from '@/api/client';
import { getDepartments, type Department } from '@/api/reference';
import {
  createStaff,
  deactivateStaff,
  listStaff,
  sendStaffReset, // NEW
  updateStaff,
  type StaffMember,
} from '@/api/staff';

type StaffRole = StaffMember['role'];

const roleOrder: StaffRole[] = ['STAFF', 'DEPT_HEAD', 'ADMIN'];
const roleLabel: Record<StaffRole, string> = {
  STAFF: 'County Officer',
  DEPT_HEAD: 'Department Head',
  ADMIN: 'Administrator',
};
const roleHelp: Record<StaffRole, string> = {
  STAFF: 'Sees their department’s requests and updates their status.',
  DEPT_HEAD: 'Does everything an officer does, and can assign requests to officers in the department.',
  ADMIN: 'Sees every request and manages staff accounts.',
};

type FormErrors = Partial<Record<string, string>>;

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'STAFF' as StaffRole,
  department: '',
  password: '',
};

const fullName = (s: StaffMember) => `${s.first_name} ${s.last_name}`.trim() || s.username;
const byName = (a: StaffMember, b: StaffMember) => fullName(a).localeCompare(fullName(b));

function tempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('') + '#9';
}

function errorText(err: unknown) {
  if (err instanceof ApiError) {
    const d = err.data as unknown;
    if (Array.isArray(d)) return String(d[0]);
    if (d && typeof d === 'object') {
      const first = Object.values(d as Record<string, unknown>)[0];
      return Array.isArray(first) ? String(first[0]) : String(first);
    }
    if (err.status === 403) return 'You do not have permission to do that.';
  }
  return 'Something went wrong. Please try again.';
}

export default function AdminUsersPage() {
  const me = useCurrentUser();

  const [rows, setRows] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Add staff
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Edit staff
  const [edit, setEdit] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState<StaffRole>('STAFF');
  const [editDept, setEditDept] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  // Deactivate
  const [deactivate, setDeactivate] = useState<StaffMember | null>(null);

  // NEW: send a password reset message
  const [resetFor, setResetFor] = useState<StaffMember | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([listStaff(), getDepartments()])
      .then(([s, d]) => {
        if (!alive) return;
        setRows([...s].sort(byName));
        setDepartments(d);
      })
      .catch(() => {
        if (alive) setLoadError('Could not load staff. Check that the backend is running, then reload.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (s) =>
        (!needle ||
          `${fullName(s)} ${s.email} ${s.phone_number} ${s.department_name ?? ''}`
            .toLowerCase()
            .includes(needle)) &&
        (!roleFilter || s.role === roleFilter),
    );
  }, [rows, q, roleFilter]);

  const replaceRow = (updated: StaffMember) =>
    setRows((r) => r.map((s) => (s.id === updated.id ? updated : s)));

  // ---------- Add ----------
  const setField = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFormErrors((e) => ({ ...e, [k]: undefined }));
  };

  const openAdd = () => {
    setForm({ ...emptyForm, password: tempPassword() });
    setFormErrors({});
    setAdding(true);
  };

  const submitAdd = async () => {
    const e: FormErrors = {};
    if (!form.first_name.trim()) e.first_name = 'Enter a first name.';
    if (!form.last_name.trim()) e.last_name = 'Enter a last name.';
    if (!/^\S+@muranga\.go\.ke$/i.test(form.email.trim())) {
      e.email = 'Use an official county email ending in @muranga.go.ke.';
    }
    if (!/^(\+254|0)[17]\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      e.phone = 'Enter a Kenyan mobile number, like 0712 345 678.';
    }
    if (form.role !== 'ADMIN' && !form.department) e.department = 'Choose a department.';
    if (form.password.length < 8) e.password = 'Use at least 8 characters.';
    setFormErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const created = await createStaff({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone_number: normalizePhone(form.phone),
        role: form.role,
        department: form.role === 'ADMIN' ? null : Number(form.department),
        password: form.password,
      });
      setRows((r) => [...r, created].sort(byName));
      toast.success(
        `Account created for ${fullName(created)}. Give them the temporary password privately, or use the key button to send a reset link.`,
      );
      setAdding(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const fe = fieldErrors(err.data);
        const mapped: FormErrors = {
          first_name: fe.first_name,
          last_name: fe.last_name,
          email: fe.email,
          phone: fe.phone_number || fe.username,
          role: fe.role,
          department: fe.department,
          password: fe.password,
        };
        setFormErrors(mapped);
        if (!Object.values(mapped).some(Boolean)) toast.error(errorText(err));
      } else {
        toast.error(errorText(err));
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------- Edit ----------
  const openEdit = (s: StaffMember) => {
    setEdit(s);
    setEditRole(s.role);
    setEditDept(s.department ? String(s.department) : '');
    setEditPassword('');
    setEditErrors({});
  };

  const submitEdit = async () => {
    if (!edit) return;
    const e: FormErrors = {};
    if (editRole !== 'ADMIN' && !editDept) e.department = 'Choose a department.';
    if (editPassword && editPassword.length < 8) e.password = 'Use at least 8 characters.';
    setEditErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const updated = await updateStaff(edit.id, {
        role: editRole,
        department: editRole === 'ADMIN' ? null : Number(editDept),
        ...(editPassword ? { password: editPassword } : {}),
      });
      replaceRow(updated);
      toast.success(editPassword ? 'Changes saved and password reset.' : 'Changes saved.');
      setEdit(null);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  // ---------- NEW: send reset code and link ----------
  const confirmSendReset = async () => {
    if (!resetFor) return;
    setSaving(true);
    try {
      await sendStaffReset(resetFor.id);
      toast.success(`Reset code and link sent to ${resetFor.email}.`);
      setResetFor(null);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  // ---------- Deactivate / reactivate ----------
  const confirmDeactivate = async () => {
    if (!deactivate) return;
    setSaving(true);
    try {
      await deactivateStaff(deactivate.id);
      replaceRow({ ...deactivate, is_active: false });
      toast.success('Account deactivated.');
      setDeactivate(null);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const reactivate = async (s: StaffMember) => {
    try {
      replaceRow(await updateStaff(s.id, { is_active: true }));
      toast.success(`${fullName(s)} can sign in again.`);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const deptSelect = (
    id: string,
    value: string,
    onChange: (v: string) => void,
    hasError: boolean,
  ) => (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`field h-11 ${hasError ? 'field-error' : ''}`}
    >
      <option value="">Select a department</option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Staff and user management"
        description="Create staff accounts, set roles and departments, send password resets, and deactivate accounts. Passwords are never visible to administrators."
        actions={
          <button type="button" onClick={openAdd} className="btn-primary" disabled={loading}>
            <UserPlusIcon className="h-4 w-4" /> Add staff
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search staff</span>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone or department"
              className="field h-10 pl-9"
            />
          </label>
          <select
            aria-label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="field h-10 sm:w-52"
          >
            <option value="">All roles</option>
            {roleOrder.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading staff…
          </div>
        ) : loadError ? (
          <p role="alert" className="p-6 text-sm text-danger">
            {loadError}
          </p>
        ) : list.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No staff found"
            body="Try a different search, or add a staff member."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-canvas text-left text-xs font-semibold text-muted">
                <tr>
                  {['Staff member', 'Role', 'Department', 'Status', ''].map((h, i) => (
                    <th key={`${h}-${i}`} className="px-4 py-3">
                      {h || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((s) => {
                  const isMe = s.id === me.id;
                  return (
                    <tr key={s.id} className="hover:bg-canvas/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand">
                            {initials(fullName(s))}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">
                              {fullName(s)}
                              {isMe && <span className="ml-2 text-xs font-medium text-muted">You</span>}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {s.email} · {s.phone_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink">{roleLabel[s.role]}</td>
                      <td className="px-4 py-3 text-muted">{s.department_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            s.is_active ? 'bg-success-50 text-success' : 'bg-canvas text-muted'
                          }`}
                        >
                          {s.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="btn-ghost h-8 w-8 px-0"
                            aria-label={`Edit ${fullName(s)}`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>

                          {/* NEW: send password reset */}
                          {s.is_active && (
                            <button
                              type="button"
                              onClick={() => setResetFor(s)}
                              className="btn-ghost h-8 w-8 px-0"
                              title="Send password reset"
                              aria-label={`Send password reset to ${fullName(s)}`}
                            >
                              <KeyRoundIcon className="h-4 w-4" />
                            </button>
                          )}

                          {s.is_active ? (
                            <button
                              type="button"
                              onClick={() => setDeactivate(s)}
                              disabled={isMe}
                              title={isMe ? 'You cannot deactivate your own account' : undefined}
                              className="btn-ghost h-8 w-8 px-0 text-danger hover:bg-danger-50"
                              aria-label={`Deactivate ${fullName(s)}`}
                            >
                              <UserXIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => reactivate(s)}
                              className="btn-ghost h-8 w-8 px-0 text-brand"
                              aria-label={`Reactivate ${fullName(s)}`}
                            >
                              <UserCheckIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add staff */}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a staff member"
        description="They sign in with their phone number or email and the temporary password below. They can also use “Forgot password” to choose their own."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={submitAdd} disabled={saving}>
              {saving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="sf" error={formErrors.first_name}>
              <input
                id="sf"
                value={form.first_name}
                onChange={(e) => setField('first_name', e.target.value)}
                className={`field h-11 ${formErrors.first_name ? 'field-error' : ''}`}
              />
            </Field>
            <Field label="Last name" htmlFor="sl" error={formErrors.last_name}>
              <input
                id="sl"
                value={form.last_name}
                onChange={(e) => setField('last_name', e.target.value)}
                className={`field h-11 ${formErrors.last_name ? 'field-error' : ''}`}
              />
            </Field>
          </div>

          <Field label="County email" htmlFor="se" error={formErrors.email}>
            <input
              id="se"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="name@muranga.go.ke"
              className={`field h-11 ${formErrors.email ? 'field-error' : ''}`}
            />
          </Field>

          <Field label="Phone number" htmlFor="sp" error={formErrors.phone}>
            <input
              id="sp"
              type="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="07XX XXX XXX"
              className={`field h-11 ${formErrors.phone ? 'field-error' : ''}`}
            />
          </Field>

          <Field label="Role" htmlFor="sr" error={formErrors.role}>
            <select
              id="sr"
              value={form.role}
              onChange={(e) => setField('role', e.target.value as StaffRole)}
              className="field h-11"
            >
              {roleOrder.map((r) => (
                <option key={r} value={r}>
                  {roleLabel[r]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted">{roleHelp[form.role]}</p>
          </Field>

          {form.role !== 'ADMIN' && (
            <Field label="Department" htmlFor="sd" error={formErrors.department}>
              {deptSelect('sd', form.department, (v) => setField('department', v), !!formErrors.department)}
              <p className="mt-1.5 text-xs text-muted">
                Officers only see requests in their own department.
              </p>
            </Field>
          )}

          <Field label="Temporary password" htmlFor="spw" error={formErrors.password}>
            <div className="flex gap-2">
              <input
                id="spw"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                autoComplete="off"
                className={`field h-11 flex-1 font-mono ${formErrors.password ? 'field-error' : ''}`}
              />
              <button
                type="button"
                className="btn-secondary h-11"
                onClick={() => setField('password', tempPassword())}
              >
                <RefreshCwIcon className="h-4 w-4" /> Generate
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Give this to the staff member in person or by a private message. It is not shown again.
            </p>
          </Field>
        </div>
      </Modal>

      {/* Edit staff */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title="Edit role and department"
        description={edit ? `${fullName(edit)} · ${edit.phone_number}` : undefined}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={submitEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <Field label="Role" htmlFor="er">
              <select
                id="er"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as StaffRole)}
                disabled={edit.id === me.id}
                className="field h-11"
              >
                {roleOrder.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel[r]}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-muted">
                {edit.id === me.id ? 'You cannot change your own role.' : roleHelp[editRole]}
              </p>
            </Field>

            {editRole !== 'ADMIN' && (
              <Field label="Department" htmlFor="ed" error={editErrors.department}>
                {deptSelect('ed', editDept, (v) => {
                  setEditDept(v);
                  setEditErrors((x) => ({ ...x, department: undefined }));
                }, !!editErrors.department)}
              </Field>
            )}

            <Field label="Set a temporary password (optional)" htmlFor="epw" error={editErrors.password}>
              <div className="flex gap-2">
                <input
                  id="epw"
                  value={editPassword}
                  onChange={(e) => {
                    setEditPassword(e.target.value);
                    setEditErrors((x) => ({ ...x, password: undefined }));
                  }}
                  placeholder="Leave empty to keep the current password"
                  autoComplete="off"
                  className={`field h-11 flex-1 font-mono ${editErrors.password ? 'field-error' : ''}`}
                />
                <button
                  type="button"
                  className="btn-secondary h-11"
                  onClick={() => setEditPassword(tempPassword())}
                >
                  <RefreshCwIcon className="h-4 w-4" /> Generate
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Prefer the key button on the staff list: it lets the person choose their own password.
              </p>
            </Field>
          </div>
        )}
      </Modal>

      {/* NEW: send password reset */}
      <Modal
        open={!!resetFor}
        onClose={() => setResetFor(null)}
        title={`Send a password reset to ${resetFor ? fullName(resetFor) : ''}?`}
        description="They get a 6-digit code and a link by email and SMS, and choose their own new password. You never see it."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setResetFor(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={confirmSendReset} disabled={saving}>
              {saving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                'Send reset'
              )}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          The message goes to {resetFor?.email} and {resetFor?.phone_number}. The code expires in 10 minutes.
        </p>
      </Modal>

      {/* Deactivate */}
      <Modal
        open={!!deactivate}
        onClose={() => setDeactivate(null)}
        title={`Deactivate ${deactivate ? fullName(deactivate) : ''}?`}
        description="They will lose access right away and can no longer sign in. Their request history is kept."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setDeactivate(null)}>
              Cancel
            </button>
            <button type="button" className="btn-danger" onClick={confirmDeactivate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" /> Deactivating…
                </>
              ) : (
                'Deactivate account'
              )}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">You can reactivate the account later from this page.</p>
      </Modal>
    </div>
  );
}