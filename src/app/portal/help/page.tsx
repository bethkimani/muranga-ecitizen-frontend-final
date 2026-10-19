'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CameraIcon, FilePlus2Icon, SearchCheckIcon, SearchIcon, SendIcon } from 'lucide-react';
import { faqs } from '@/data/portal';
import { StatusBadge } from '@/components/StatusBadge';
import { Field } from '@/components/ui';
import type { RequestStatus } from '@/types/request';

const guides = [
  {
    icon: FilePlus2Icon,
    title: 'How to submit a request',
    steps: [
      'Choose the service that matches your issue',
      'Describe what you saw and add photos',
      'Enter the ward and a nearby landmark',
      'Review and submit — you’ll receive a reference',
    ],
  },
  {
    icon: SearchCheckIcon,
    title: 'How to track a request',
    steps: [
      'Open “Track Request” from the menu',
      'Enter your reference, e.g. MCG-2026-004812',
      'See the current stage and latest update',
      'Sign in to message the department',
    ],
  },
  {
    icon: CameraIcon,
    title: 'How to attach evidence',
    steps: [
      'Take a clear photo in daylight if possible',
      'Include a landmark to help officers find it',
      'Use JPG, PNG or WEBP under 5 MB',
      'Add up to 3 photos per request',
    ],
  },
];

const statuses: { s: RequestStatus; d: string }[] = [
  { s: 'Pending', d: 'Received and waiting for the county to review and assign it to a department.' },
  { s: 'In Progress', d: 'A department has accepted the request and is inspecting or working on it.' },
  { s: 'Resolved', d: 'The county has completed the work. Only county staff can mark a request resolved.' },
  { s: 'Rejected', d: 'Outside county mandate or a duplicate. An explanation is always provided.' },
];

export default function PortalHelpPage() {
  const [q, setQ] = useState('');
  const [sent, setSent] = useState(false);
  const results = faqs.filter((f) => (f.q + f.a).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-2xl bg-brand-dark px-6 py-10 text-center text-white md:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight">How can we help?</h1>
        <label className="relative mx-auto mt-6 block max-w-xl">
          <span className="sr-only">Search help articles</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions, e.g. “photos” or “status”"
            className="field h-12 pl-12 text-base text-ink"
          />
        </label>
      </div>

      {!q && (
        <section className="mt-10 grid gap-8 md:grid-cols-3">
          {guides.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.title}>
                <Icon className="h-6 w-6 text-brand" aria-hidden="true" />
                <h2 className="mt-3 font-bold text-ink">{g.title}</h2>
                <ol className="mt-3 space-y-2 text-sm text-muted">
                  {g.steps.map((s, i) => (
                    <li key={s} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </section>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="text-xl font-extrabold text-ink">{q ? `Results for “${q}”` : 'Frequently asked questions'}</h2>
          {results.length === 0 ? (
            <p className="mt-4 rounded-xl bg-white p-5 text-sm text-muted ring-1 ring-line">
              No answers found. Try another word or send us a message.
            </p>
          ) : (
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {results.map((f) => (
                <div key={f.q} className="py-4">
                  <dt className="font-semibold text-ink">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          )}

          {!q && (
            <>
              <h2 className="mt-10 text-xl font-extrabold text-ink">What each status means</h2>
              <dl className="mt-4 space-y-3">
                {statuses.map((s) => (
                  <div key={s.s} className="grid items-start gap-2 sm:grid-cols-[130px_1fr]">
                    <dt>
                      <StatusBadge status={s.s} />
                    </dt>
                    <dd className="text-sm text-muted">{s.d}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        <section id="contact" className="card h-fit p-6">
          <h2 className="text-lg font-bold text-ink">Contact support</h2>
          <p className="mt-1 text-sm text-muted">
            For questions about the portal. To report an issue, use “Report an Issue” instead.
          </p>
          {sent ? (
            <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              Message sent. Our team typically replies within 2 working days.
            </p>
          ) : (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
                toast.success('Support message sent');
              }}
            >
              <Field label="Your name" htmlFor="hn">
                <input id="hn" required className="field h-11" />
              </Field>
              <Field label="Email or phone" htmlFor="he">
                <input id="he" required className="field h-11" />
              </Field>
              <Field label="Topic" htmlFor="ht">
                <select id="ht" className="field h-11">
                  <option>Account and sign-in</option>
                  <option>Tracking a request</option>
                  <option>Accessibility</option>
                  <option>Feedback on the portal</option>
                </select>
              </Field>
              <Field label="Message" htmlFor="hm">
                <textarea id="hm" required rows={4} className="field" />
              </Field>
              <button type="submit" className="btn-primary w-full">
                <SendIcon className="h-4 w-4" /> Send message
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}