'use client';

import React from 'react';
import { toast } from 'sonner';
import { MailIcon, MessageSquareIcon } from 'lucide-react';
import { PageHeader, Field } from '@/components/ui';

const channels = [
  { icon: MessageSquareIcon, name: 'SMS delivery', desc: 'Connect a bulk SMS provider' },
  { icon: MailIcon, name: 'Email delivery', desc: 'Connect an SMTP or transactional email service' },
];

export default function AdminSystemPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="System settings"
        description="Portal-wide configuration. Changes are recorded in the audit log."
      />

      <section className="card p-6">
        <h2 className="font-bold text-ink">Notification channels</h2>
        <p className="mt-0.5 text-sm text-muted">
          Email and SMS require a provider before citizens can receive messages outside the portal.
        </p>
        <ul className="mt-4 divide-y divide-line">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.name} className="flex items-center gap-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas text-ink">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-sm text-muted">{c.desc}</p>
                </div>
                <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-semibold text-muted">
                  Not connected
                </span>
                <button
                  onClick={() => toast('Integration setup requires backend configuration')}
                  className="btn-secondary"
                >
                  Configure
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <form
        className="card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success('Emergency contacts saved');
        }}
      >
        <h2 className="font-bold text-ink">Emergency guidance</h2>
        <p className="mt-0.5 text-sm text-muted">Shown on the public home page.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="National emergency numbers" htmlFor="en">
            <input id="en" defaultValue="999, 112" className="field h-11" />
          </Field>
          <Field label="County disaster response line" htmlFor="cd">
            <input id="cd" placeholder="Enter verified county number" className="field h-11" />
          </Field>
        </div>
        <button className="btn-primary mt-5">Save</button>
      </form>

      <section className="card p-6">
        <h2 className="font-bold text-ink">Languages and session</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Default language" htmlFor="dl">
            <select id="dl" className="field h-11">
              <option>English</option>
              <option>Kiswahili</option>
            </select>
          </Field>
          <Field label="Session timeout" htmlFor="st">
            <select id="st" className="field h-11" defaultValue="30 minutes">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>60 minutes</option>
            </select>
          </Field>
        </div>
      </section>
    </div>
  );
}