import React from 'react';
import Link from 'next/link';
import { CheckCircle2Icon } from 'lucide-react';
import { EMBLEM_URL } from './Logo';

const highlights = [
  'Follow every request from submission to resolution',
  'Receive official updates from county departments',
  'Your personal details are never shown publicly',
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full bg-white lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between bg-brand-dark p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <span className="block aspect-[8/5] w-16 overflow-hidden rounded-md bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EMBLEM_URL} alt="" className="h-full w-full object-contain" />
          </span>
          <span>
            <span className="block font-extrabold">Murang’a County</span>
            <span className="block text-sm text-white/70">Digital Public Service Portal</span>
          </span>
        </Link>

        <div>
          <div className="mb-8 aspect-[8/5] w-56 overflow-hidden rounded-xl bg-white p-1 ring-1 ring-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={EMBLEM_URL}
              alt="Murang’a County emblem — Growing together"
              className="h-full w-full rounded-lg object-contain"
            />
          </div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Report, track and resolve county service issues in one place.
          </h2>
          <ul className="mt-8 space-y-3 text-white/85">
            {highlights.map((t) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">
          Prototype — authentication and verification require backend implementation.
        </p>
        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          <span className="flex-1 bg-ink" />
          <span className="flex-1 bg-gold" />
          <span className="flex-1 bg-brand" />
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[440px]">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="block aspect-[8/5] w-14 overflow-hidden rounded-md ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={EMBLEM_URL} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="text-sm font-extrabold text-ink">Murang’a County Portal</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}