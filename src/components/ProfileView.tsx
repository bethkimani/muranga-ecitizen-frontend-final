'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { InfoIcon, Loader2Icon, LogOutIcon, PencilIcon } from 'lucide-react';
import { displayName, initialsOf, logout, roleLabel } from '@/api/auth';
import { changePassword, updateProfile } from '@/api/profile';
import { useCurrentUser } from '@/components/RequireRole';
import { PageHeader } from '@/components/ui';
import { errorMessage } from '@/utils/errors';

export type ProfileTab = 'personal' | 'preferences' | 'security';

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v : '');

export default function ProfileView({ initialTab = 'personal' }: { initialTab?: ProfileTab }) {
  const router = useRouter();
  const user = useCurrentUser();
  const [tab, setTab] = useState<ProfileTab>(initialTab);

  const u = (user ?? {}) as Record<string, unknown>;
  const name = displayName(user);

  // ---- Edit details ----
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });

  useEffect(() => {
    setForm({
      first_name: text(u.first_name),
      last_name: text(u.last_name),
      email: text(u.email),
      phone: text(u.phone) || text(u.phone_number),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Your details have been updated.');
      setEditing(false);
      window.location.reload(); // reloads the signed-in user so the new details show everywhere
    } catch (err) {
      toast.error(errorMessage(err, 'We could not save your details.'));
    } finally {
      setSaving(false);
    }
  };

  // ---- Change password ----
  const [pw, setPw] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pw.new_password.length < 8) return setPwError('The new password must be at least 8 characters.');
    if (pw.new_password !== pw.confirm) return setPwError('The two new passwords do not match.');
    setPwSaving(true);
    try {
      await changePassword({ old_password: pw.old_password, new_password: pw.new_password });
      toast.success('Password changed.');
      setPw({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwError(errorMessage(err, 'We could not change your password.'));
    } finally {
      setPwSaving(false);
    }
  };

  const signOut = () => {
    logout();
    router.replace('/signin');
  };

  const rows = [
    { k: 'Full name', v: name },
    { k: 'Email address', v: text(u.email) },
    { k: 'Phone number', v: text(u.phone) || text(u.phone_number) },
    { k: 'Account type', v: roleLabel((u as { role?: never }).role as never) },
  ].filter((r) => r.v);

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'personal', label: 'Personal details' },
    { id: 'preferences', label: 'Notifications' },
    { id: 'security', label: 'Password & sign out' },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={initialTab === 'preferences' ? 'Settings' : 'My profile'}
        description="Your account details and how we contact you."
      />

      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors duration-150 ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <section className="card p-6">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand">
                {initialsOf(user)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{name}</p>
                <p className="text-sm text-muted">Citizen account</p>
              </div>
            </div>
            {!editing && (
              <button type="button" onClick={() => setEditing(true)} className="btn-secondary">
                <PencilIcon className="h-4 w-4" /> Edit details
              </button>
            )}
          </div>

          {!editing ? (
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {rows.map((r) => (
                <div key={r.k}>
                  <dt className="text-xs font-medium text-muted">{r.k}</dt>
                  <dd className="mt-1 break-words font-medium text-ink">{r.v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <form onSubmit={saveDetails} className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="text-sm font-semibold text-ink">First name</label>
                <input id="first_name" value={form.first_name} onChange={setField('first_name')} className="field mt-1.5 h-11" required />
              </div>
              <div>
                <label htmlFor="last_name" className="text-sm font-semibold text-ink">Last name</label>
                <input id="last_name" value={form.last_name} onChange={setField('last_name')} className="field mt-1.5 h-11" required />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-ink">Email address</label>
                <input id="email" type="email" value={form.email} onChange={setField('email')} className="field mt-1.5 h-11" required />
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-semibold text-ink">Phone number</label>
                <input id="phone" type="tel" value={form.phone} onChange={setField('phone')} className="field mt-1.5 h-11" placeholder="07XX XXX XXX" />
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <button type="submit" disabled={saving} className="btn-primary h-11 px-6">
                  {saving ? (<><Loader2Icon className="h-4 w-4 animate-spin" /> Saving…</>) : 'Save changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} disabled={saving} className="btn-secondary h-11 px-6">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {tab === 'preferences' && (
        <section className="card p-6">
          <h2 className="font-bold text-ink">How we contact you</h2>
          <p className="mt-2 flex gap-3 text-sm text-muted">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            You get updates in the portal: every change the county publishes on your requests appears under
            Notifications. SMS and email delivery aren’t available yet.
          </p>
        </section>
      )}

      {tab === 'security' && (
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-bold text-ink">Change password</h2>
            <form onSubmit={savePassword} className="mt-4 grid max-w-md gap-4">
              <div>
                <label htmlFor="old_password" className="text-sm font-semibold text-ink">Current password</label>
                <input id="old_password" type="password" autoComplete="current-password" value={pw.old_password}
                  onChange={(e) => setPw({ ...pw, old_password: e.target.value })} className="field mt-1.5 h-11" required />
              </div>
              <div>
                <label htmlFor="new_password" className="text-sm font-semibold text-ink">New password</label>
                <input id="new_password" type="password" autoComplete="new-password" value={pw.new_password}
                  onChange={(e) => setPw({ ...pw, new_password: e.target.value })} className="field mt-1.5 h-11" required />
              </div>
              <div>
                <label htmlFor="confirm" className="text-sm font-semibold text-ink">Confirm new password</label>
                <input id="confirm" type="password" autoComplete="new-password" value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="field mt-1.5 h-11" required />
              </div>
              {pwError && <p role="alert" className="text-sm font-medium text-danger">{pwError}</p>}
              <button type="submit" disabled={pwSaving} className="btn-primary h-11 w-fit px-6">
                {pwSaving ? (<><Loader2Icon className="h-4 w-4 animate-spin" /> Updating…</>) : 'Update password'}
              </button>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="font-bold text-ink">Sign out</h2>
            <p className="mt-1 text-sm text-muted">You’ll need to sign in again to see your requests.</p>
            <button type="button" onClick={signOut} className="btn-ghost mt-4 flex items-center gap-2 text-danger hover:bg-danger-50">
              <LogOutIcon className="h-4 w-4" /> Sign out
            </button>
          </section>
        </div>
      )}
    </div>
  );
}