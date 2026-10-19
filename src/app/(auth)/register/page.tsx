'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Field } from '@/components/ui';
import { register, normalizePhone, fieldErrors } from '@/api/auth';
import { ApiError } from '@/api/client';

type Form = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  channel: string;
  agree: boolean;
};
type Errors = Partial<Record<keyof Form, string>>;

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['bg-line', 'bg-danger', 'bg-warning', 'bg-brand', 'bg-success'];

const channels = [
  { v: 'sms', l: 'SMS' },
  { v: 'email', l: 'Email' },
  { v: 'app', l: 'In-app only' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState<Form>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    channel: 'sms',
    agree: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const s = strength(f.password);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (f.name.trim().split(/\s+/).length < 2) e.name = 'Enter your first and last name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address, like name@example.com.';
    if (!/^(\+254|0)[17]\d{8}$/.test(f.phone.replace(/\s/g, ''))) {
      e.phone = 'Enter a Kenyan mobile number, like 0712 345 678.';
    }
    if (s < 3) e.password = 'Use at least 8 characters with upper and lower case letters and a number.';
    if (!f.confirm || f.confirm !== f.password) e.confirm = 'Passwords don’t match.';
    if (!f.agree) e.agree = 'You need to accept the privacy policy and terms to continue.';
    return e;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const phone = normalizePhone(f.phone);
    const [first, ...rest] = f.name.trim().split(/\s+/);

    setLoading(true);
    try {
      await register({
        phone_number: phone,
        username: phone,
        email: f.email.trim(),
        password: f.password,
        first_name: first,
        last_name: rest.join(' '),
      });
      // The backend has sent a code by email and SMS. Verify before signing in.
      router.push(`/verify?id=${encodeURIComponent(f.email.trim())}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const fe = fieldErrors(err.data);
        setErrors({
          phone: fe.phone_number || fe.username,
          email: fe.email,
          password: fe.password,
        });
      } else {
        setErrors({ email: 'Could not reach the server. Try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const input = (
    k: 'name' | 'email' | 'phone' | 'password' | 'confirm',
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <input
      id={k}
      className={`field h-11 ${errors[k] ? 'field-error' : ''}`}
      value={f[k]}
      onChange={(e) => set(k, e.target.value)}
      aria-invalid={!!errors[k]}
      aria-describedby={errors[k] ? `${k}-error` : undefined}
      {...props}
    />
  );

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Create your account</h1>
      <p className="mt-2 text-muted">It’s free and takes about a minute.</p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name}>
          {input('name', { autoComplete: 'name', placeholder: 'e.g. Wanjiru Kamau' })}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email address" htmlFor="email" error={errors.email}>
            {input('email', { type: 'email', autoComplete: 'email' })}
          </Field>
          <Field label="Phone number" htmlFor="phone" error={errors.phone}>
            {input('phone', { type: 'tel', autoComplete: 'tel', placeholder: '07XX XXX XXX' })}
          </Field>
        </div>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            {input('password', { type: show ? 'text' : 'password', autoComplete: 'new-password' })}
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {f.password && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                      i <= s ? strengthColor[s] : 'bg-line'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs font-medium text-muted">
                Password strength: <span className="text-ink">{strengthLabel[s]}</span>
              </p>
            </div>
          )}
        </Field>

        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          {input('confirm', { type: show ? 'text' : 'password', autoComplete: 'new-password' })}
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">
            Preferred updates <span className="text-xs font-medium text-muted">Optional</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {channels.map((o) => (
              <label
                key={o.v}
                className={`flex cursor-pointer items-center justify-center rounded-lg border py-2.5 text-sm font-semibold transition-colors duration-150 ${
                  f.channel === o.v
                    ? 'border-brand bg-brand-50 text-brand'
                    : 'border-line text-ink hover:border-brand/40'
                }`}
              >
                <input
                  type="radio"
                  name="channel"
                  value={o.v}
                  checked={f.channel === o.v}
                  onChange={() => set('channel', o.v)}
                  className="sr-only"
                />
                {o.l}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-start gap-3 text-sm text-ink">
            <button
              type="button"
              id="agree"
              role="checkbox"
              aria-checked={f.agree}
              aria-invalid={!!errors.agree}
              aria-describedby={errors.agree ? 'agree-error' : undefined}
              onClick={() => set('agree', !f.agree)}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                f.agree
                  ? 'border-brand bg-brand text-white'
                  : errors.agree
                  ? 'border-danger'
                  : 'border-[#B9C2BC]'
              }`}
            >
              {f.agree && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
            </button>
            <span>
              I agree to the{' '}
              <Link href="/help" className="font-semibold text-brand underline-offset-2 hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/help" className="font-semibold text-brand underline-offset-2 hover:underline">
                Terms of Use
              </Link>
              .
            </span>
          </div>
          {errors.agree && (
            <p id="agree-error" role="alert" className="mt-1.5 text-xs font-medium text-danger">
              {errors.agree}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary h-12 w-full text-[15px]" disabled={loading}>
          {loading ? (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/signin" className="font-bold text-brand hover:text-brand-dark">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}