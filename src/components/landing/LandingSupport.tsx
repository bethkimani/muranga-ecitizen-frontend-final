import React, { useState } from 'react';
import { ChevronDownIcon, ClockIcon, LanguagesIcon, LockIcon, PhoneCallIcon, SmartphoneIcon, TriangleAlertIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { faqs } from '../../data/portal';

const reasons = [
{ icon: ClockIcon, title: 'Report any time', body: 'No queues or office visits. Submit from your phone, day or night.' },
{ icon: SmartphoneIcon, title: 'Built for every phone', body: 'Light pages that work on slower connections and small screens.' },
{ icon: LockIcon, title: 'Your details stay private', body: 'Only officers handling your request can see who reported it.' },
{ icon: LanguagesIcon, title: 'English and Kiswahili', body: 'Use the portal in the language you are most comfortable with.' }];


export function LandingSupport() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Why use this portal?</h2>
            <ul className="mt-6 space-y-6">
              {reasons.map((r) => {
                const Icon = r.icon;
                return (
                  <li key={r.title} className="flex gap-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                    <div>
                      <h3 className="font-bold text-ink">{r.title}</h3>
                      <p className="mt-0.5 text-sm text-muted">{r.body}</p>
                    </div>
                  </li>);

              })}
            </ul>

            <div className="mt-10 rounded-2xl border border-danger/25 bg-danger-50 p-5" role="note">
              <div className="flex items-center gap-2 text-danger">
                <TriangleAlertIcon className="h-5 w-5" aria-hidden="true" />
                <h3 className="font-bold">Emergencies</h3>
              </div>
              <p className="mt-2 text-sm text-[#5A1A1A]">
                This portal is not monitored around the clock. For fire, accidents, or threats to life, call emergency services immediately.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="tel:999" className="btn bg-danger text-white hover:bg-[#a51f1f]"><PhoneCallIcon className="h-4 w-4" aria-hidden="true" /> Call 999</a>
                <a href="tel:112" className="btn border border-danger/30 bg-white text-danger hover:bg-danger-50">Call 112</a>
              </div>
              <p className="mt-3 text-xs text-[#7A3A3A]">County disaster response line: configured by administrator.</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Frequently asked questions</h2>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {faqs.map((f, i) =>
              <li key={f.q}>
                  <button
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}>
                  
                    <span className="font-semibold text-ink">{f.q}</span>
                    <ChevronDownIcon className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  <AnimatePresence initial={false}>
                    {open === i &&
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden">
                    
                        <p className="pb-5 pr-8 text-sm leading-relaxed text-muted">{f.a}</p>
                      </motion.div>
                  }
                  </AnimatePresence>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>);

}