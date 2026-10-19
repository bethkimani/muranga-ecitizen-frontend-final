'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeftIcon, KeyRoundIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Field } from '@/components/ui';
import { confirmVerification, sendVerification } from '@/api/auth';
import { ApiError } from '@/api/client';

function Verify() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? params.get('identifier') ?? '';
  const linkCode = params.get('code') ?? '';
  const [code, setCode] = useState(linkCode);
  const [loading, setLoading] = useState(false);
  const tried = useRef(false);

  const confirm = async (value: string) => {
    setLoading(true);
    try {
      await confirmVerification(id, value);
      toast.success('Account verified. Please sign in.');
      router.replace('/signin?verified=1');
    } catch (err) {
      const detail =
        err instanceof ApiError && err.data && typeof err.data === 'object'
          ? (err.data as { detail?: string }).detail
          : undefined;
      toast.error(detail ?? 'Could not verify. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (linkCode && id && !tried.current) {
      tried.current = true;
      confirm(linkCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return toast.error('Missing account details. Please sign in again.');
    if (code.trim().length !== 6) return toast.error('Enter all 6 digits of the code.');
    confirm(code.trim());
  };

  const resend = async () => {
    if (!id) return toast.error('Missing account details. Please sign in again.');
    try {
      await sendVerification(id);
      toast.success('A new code has been sent. Use the newest one.');
    } catch {
      toast.error('Could not send a new code. Try again shortly.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-900">Verify your account</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          We sent a 6-digit code to your email and phone. Enter it below, or click the link in the email.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleVerify}>
            <Field label="Verification code" htmlFor="code">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRoundIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  className="field pl-10 h-11 text-center font-mono text-lg tracking-widest"
                />
              </div>
            </Field>

            <button type="submit" disabled={loading} className="w-full btn-primary h-11 flex justify-center items-center text-base">
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 flex items-center justify-between text-xs font-semibold">
            <button type="button" onClick={resend} className="text-emerald-600 hover:text-emerald-700">
              Resend code
            </button>
            <Link href="/signin" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900">
              <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <Verify />
    </Suspense>
  );
}