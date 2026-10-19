import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { categories } from '../../data/categories';

export function LandingServices() {
  return (
    <section id="services" className="bg-canvas py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">What would you like to report?</h2>
            <p className="mt-2 max-w-xl text-muted">Choose a service and we’ll route your request to the right county department.</p>
          </div>
          <Link href="/services" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-dark">
            View full service directory <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.id}>
                <Link
                  href={`/portal/submit?category=${c.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop">
                  
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold text-ink">{c.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand">
                    Report issue <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>);

          })}
        </ul>
      </div>
    </section>);

}