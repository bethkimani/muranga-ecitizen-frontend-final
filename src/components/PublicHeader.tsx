'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { GlobeIcon, MenuIcon, XIcon } from 'lucide-react';

export const EMBLEM_URL = "/image.png";

interface LogoProps {
  inverted?: boolean;
  subtitle?: string;
  to?: string;
}

export function Logo({ inverted = false, subtitle = 'Digital Public Service Portal', to = '/' }: LogoProps) {
  return (
    <Link href={to} className="flex min-w-0 items-center gap-3" aria-label="Murang’a County Digital Public Service Portal — home">
      <span className={`block aspect-[8/5] w-14 shrink-0 overflow-hidden rounded-md ${inverted ? 'ring-1 ring-white/20' : 'ring-1 ring-line'} bg-white`}>
        <img src={EMBLEM_URL} alt="" className="h-full w-full object-contain" />
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-[15px] font-extrabold leading-tight ${inverted ? 'text-white' : 'text-ink'}`}>Murang’a County</span>
        <span className={`block truncate text-xs font-medium ${inverted ? 'text-white/70' : 'text-muted'}`}>{subtitle}</span>
      </span>
    </Link>
  );
}

const links = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Report an Issue', to: '/portal/submit' },
  { label: 'Track Request', to: '/track' },
  { label: 'Help Centre', to: '/help' },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="h-1 w-full bg-brand" aria-hidden="true">
        <div className="ml-auto h-full w-1/3 bg-gold" />
      </div>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => {
            const isActive = pathname === l.to;
            return (
              <Link
                key={l.to}
                href={l.to}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
                  isActive ? 'text-brand' : 'text-[#3A433D] hover:bg-canvas hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <label className="relative flex items-center">
            <span className="sr-only">Language</span>
            <GlobeIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted" aria-hidden="true" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-line bg-white pl-8 pr-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </label>
          <Link href="/signin" className="btn-ghost">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary">
            Create Account
          </Link>
        </div>
        <button
          className="btn-ghost h-10 w-10 px-0 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden border-t border-line bg-white lg:hidden"
            aria-label="Mobile"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-[15px] font-semibold text-ink hover:bg-canvas"
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex gap-2 px-3 pt-2">
                {['en', 'sw'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      lang === l ? 'bg-brand-50 text-brand' : 'text-muted'
                    }`}
                  >
                    {l === 'en' ? 'English' : 'Kiswahili'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3">
                <Link href="/signin" className="btn-secondary text-center py-2">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-center py-2">
                  Create Account
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}