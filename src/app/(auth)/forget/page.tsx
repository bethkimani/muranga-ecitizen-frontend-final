'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Field } from '@/components/ui';
import { errorMessage, forgotPassword } from '@/api/recovery';

// Password reset by email is switched off until email delivery works
// (Brevo verified and a Murang'a County domain). To turn it on, set
// NEXT_PUBLIC_RESET_ENABLED=1 in the Vercel project settings and redeploy.
const RESET_ENABLED = process.env.NEXT_PUBLIC_RESET_ENABLED === '1';

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
      await forgotPassword(id.trim());
      toast.success('If the account exists, a code has been sent.');
      router.push(`/reset-password?id=${encodeURIComponent(id.trim())}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not reach the server. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Forgot your password?</h1>

      {RESET_ENABLED ? (
        <>
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
        </>
      ) : (
        <div className="mt-6 rounded-xl bg-canvas p-5 text-sm leading-relaxed text-[#3A433D]">
          <p className="font-semibold text-ink">Password reset is not active yet.</p>
          <p className="mt-2">
            Reset codes are sent by email, and email delivery has not been set up for this release. If you
            cannot sign in, please contact the County Administrator, who can help you regain access.
          </p>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/signin" className="font-bold text-brand hover:text-brand-dark">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}