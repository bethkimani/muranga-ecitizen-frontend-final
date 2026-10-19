'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Field } from '@/components/ui';
import { forgotPassword } from '@/api/auth';

export default function ForgotPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) {
      toast.error('Enter your email or phone number.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(id);
      toast.success('If the account exists, a code has been sent.');
      router.push(`/reset-password?id=${encodeURIComponent(id.trim())}`);
    } catch {
      toast.error('Could not reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Forgot your password?</h1>
      <p className="mt-2 text-muted">
        Enter your email or phone number and we’ll send you a reset code. This works for residents,
        officers and administrators.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <Field label="Email or phone number" htmlFor="id">
          <input
            id="id"
            className="field h-11"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="name@example.com or 07XX XXX XXX"
            autoCapitalize="none"
            spellCheck={false}
          />
        </Field>

        <button type="submit" className="btn-primary h-12 w-full text-[15px]" disabled={loading}>
          {loading ? (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            'Send reset code'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/signin" className="font-bold text-brand hover:text-brand-dark">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}