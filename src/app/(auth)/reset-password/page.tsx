'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Field } from '@/components/ui';
import { errorMessage, forgotPassword, resetPassword } from '@/api/recovery';

type FormErrors = { code?: string; password?: string; confirm?: string };

function Reset() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? '';

  const [code, setCode] = useState(params.get('code') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) {
      toast.error('Missing account details. Start again from "Forgot password".');
      return;
    }

    const next: FormErrors = {};
    if (code.trim().length !== 6) next.code = 'Enter the 6-digit code.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirm !== password) next.confirm = 'The passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await resetPassword(id, code.trim(), password);
      router.replace('/signin?reset=1');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not reset the password. Please try again.'));
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!id) {
      toast.error('Missing account details. Start again from "Forgot password".');
      return;
    }
    try {
      await forgotPassword(id);
      toast.success('If the account exists, a new code has been sent.');
    } catch {
      toast.error('Could not send a new code. Try again shortly.');
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Set a new password</h1>
      <p className="mt-2 text-muted">
        Enter the 6-digit code we sent you, then choose a new password.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <Field label="Verification code" htmlFor="code" error={errors.code}>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            autoComplete="one-time-code"
            className={`field h-11 text-center font-mono text-lg tracking-widest ${
              errors.code ? 'field-error' : ''
            }`}
          />
        </Field>

        <Field label="New password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              className={`field h-11 pr-11 ${errors.password ? 'field-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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

        <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm}>
          <input
            id="confirm"
            type={show ? 'text' : 'password'}
            className={`field h-11 ${errors.confirm ? 'field-error' : ''}`}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </Field>

        <button type="submit" className="btn-primary h-12 w-full text-[15px]" disabled={loading}>
          {loading ? (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Change password'
          )}
        </button>
      </form>

      <div className="mt-8 flex items-center justify-between text-sm font-semibold">
        <button type="button" onClick={resend} className="text-brand hover:text-brand-dark">
          Resend code
        </button>
        <Link href="/signin" className="inline-flex items-center gap-1 text-muted hover:text-ink">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <Reset />
    </Suspense>
  );
}