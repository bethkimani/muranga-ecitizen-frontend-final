import React from 'react';
import { MapPinIcon } from 'lucide-react';
import { announcements } from '../../data/portal';
import { requests } from '../../data/requests';
import { categories } from '../../data/categories';
import { StatusBadge } from '../StatusBadge';
import { formatDate, relativeTime } from '../../utils/format';

export function LandingUpdates() {
  const recent = [...requests].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 5);
  return (
    <section id="announcements" className="bg-canvas py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Latest service announcements</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {announcements.map((a, i) =>
            <li key={a.id} className={`py-5 ${i === 0 ? 'pt-5' : ''}`}>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 font-bold text-brand">{a.category}</span>
                  <time className="font-medium text-muted" dateTime={a.date}>{formatDate(a.date)}</time>
                </div>
                <h3 className={`mt-2 font-bold text-ink ${i === 0 ? 'text-lg' : ''}`}>{a.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{a.summary}</p>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Recently updated cases</h2>
          <p className="mt-1 text-sm text-muted">Personal details are never shown publicly.</p>
          <ul className="card mt-6 divide-y divide-line">
            {recent.map((r) => {
              const cat = categories.find((c) => c.id === r.category)!;
              const Icon = cat.icon;
              return (
                <li key={r.ref} className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-brand">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{r.subcategory}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <MapPinIcon className="h-3 w-3" aria-hidden="true" />
                      {r.ward}, {r.subCounty} · {relativeTime(r.updated)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>);

            })}
          </ul>
        </div>
      </div>
    </section>);

}