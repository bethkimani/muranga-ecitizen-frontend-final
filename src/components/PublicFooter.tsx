import React from 'react';
import Link from 'next/link';
import { MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react';
import { EMBLEM_URL } from './Logo';

const columns = [
  {
    title: 'Services',
    links: [
      { label: 'Report an Issue', to: '/portal/submit' },
      { label: 'Track a Request', to: '/track' },
      { label: 'Service Directory', to: '/services' },
      { label: 'Announcements', to: '/#announcements' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre', to: '/help' },
      { label: 'Frequently Asked Questions', to: '/help' },
      { label: 'Give Feedback', to: '/help#contact' },
      { label: 'County Staff Sign In', to: '/signin?role=staff' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Privacy Policy', to: '/help' },
      { label: 'Accessibility', to: '/help' },
      { label: 'Terms of Use', to: '/help' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_2fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="block aspect-[8/5] w-16 overflow-hidden rounded-md bg-white ring-1 ring-white/20">
              <img src={EMBLEM_URL} alt="Murang’a County emblem" className="h-full w-full object-contain" />
            </span>
            <div>
              <p className="font-extrabold">Murang’a County Government</p>
              <p className="text-sm text-white/70">Digital Public Service Portal</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            <li className="flex gap-3">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              County Headquarters, Murang’a Town
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              Customer service line — configured by administrator
            </li>
            <li className="flex gap-3">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              Support email — configured by administrator
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((c) => (
            <div key={c.title}>
              <h2 className="text-sm font-bold text-gold">{c.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.to}
                      className="text-sm text-white/80 transition-colors duration-150 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/60 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 County Government of Murang’a. Growing together.</p>
          <p>Prototype for demonstration — figures shown are sample data.</p>
        </div>
      </div>
    </footer>
  );
}