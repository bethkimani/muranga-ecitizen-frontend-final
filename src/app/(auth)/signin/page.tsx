'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Field } from '@/components/ui';
import { homeFor, login, looksLikeEmail, normalizePhone, sendVerification } from '@/api/auth';
import { ApiError } from '@/api/client';

type FormErrors = { id?: string; password?: string };

export default function SignInPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // Message shown after verifying an account or resetting a password
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('verified')) setNotice('Your account is verified. Please sign in.');
    if (q.get('reset')) setNotice('Password changed. Sign in with your new password.');
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = id.trim();
    const next: FormErrors = {};

    if (!value) {
      next.id = 'Enter your phone number or email address.';
    } else if (looksLikeEmail(value)) {
      if (!/^\S+@\S+\.\S+$/.test(value)) next.id = 'Enter a valid email address, like name@example.com.';
    } else if (!/^(\+254|0)[17]\d{8}$/.test(normalizePhone(value))) {
      next.id = 'Enter a Kenyan mobile number like 0712 345 678, or your email address.';
    }
    if (!password) next.password = 'Enter your password.';

    setErrors(next);
    setAuthError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const user = await login(value, password);
      // The account's role decides where they go (resident, officer or admin)
      router.push(homeFor(user.role));
    } catch (err) {
      // 403 means the password was right but the account is not verified yet
      if (err instanceof ApiError && err.status === 403) {
        sendVerification(value).catch(() => {});
        router.push(`/verify?id=${encodeURIComponent(value)}`);
        return;
      }
      setAuthError(
        err instanceof ApiError && err.status === 401
          ? 'The details you entered don’t match our records. Check them and try again.'
          : 'Could not reach the server. Make sure the backend is running.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in to report issues and follow your requests.</p>

      {notice && (
        <div role="status" className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-ink">
          {notice}
        </div>
      )}

      {authError && (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-xl border border-danger/25 bg-danger-50 p-4 text-sm text-[#7A1C1C]"
        >
          <AlertCircleIcon className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          {authError}
        </div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <Field label="Phone number or email" htmlFor="id" error={errors.id}>
          <input
            id="id"
            type="text"
            inputMode="email"
            className={`field h-11 ${errors.id ? 'field-error' : ''}`}
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              if (errors.id) setErrors((x) => ({ ...x, id: undefined }));
            }}
            placeholder="name@example.com or 07XX XXX XXX"
            aria-invalid={!!errors.id}
            aria-describedby={errors.id ? 'id-error' : undefined}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              className={`field h-11 pr-11 ${errors.password ? 'field-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" className="h-4 w-4 rounded border-line accent-brand" /> Remember me
          </label>
          <Link href="/forgot" className="text-sm font-semibold text-brand hover:text-brand-dark">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-primary h-12 w-full text-[15px]" disabled={loading}>
          {loading ? (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        New to the portal?{' '}
        <Link href="/register" className="font-bold text-brand hover:text-brand-dark">
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted">
        County staff accounts are created by a county administrator.
      </p>
    </AuthLayout>
  );
}