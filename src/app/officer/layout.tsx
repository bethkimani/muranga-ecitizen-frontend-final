'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlarmClockIcon, BellIcon, ChevronDownIcon, InboxIcon, LifeBuoyIcon, LogOutIcon,
  MenuIcon, SearchIcon, UserCheckIcon, XIcon,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { RequireRole, useCurrentUser } from '@/components/RequireRole';
import { IdleLogout } from '@/components/IdleLogout'; // NEW
import { useLookups } from '@/hooks/useLookups';
import { displayName, initialsOf, logout, roleLabel } from '@/api/auth';

const navLinks = [
  { label: 'My Workspace', href: '/officer', queue: 'assigned', icon: InboxIcon },
  { label: 'Near Deadline', href: '/officer?queue=deadline', queue: 'deadline', icon: AlarmClockIcon },
  { label: 'Awaiting Assignment', href: '/officer?queue=new', queue: 'new', icon: UserCheckIcon },
];

function OfficerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const user = useCurrentUser();
  const lookups = useLookups();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');

  const currentQueue = params.get('queue') ?? 'assigned';
  const onCase = pathname.startsWith('/officer/cases');
  const onHelp = pathname.startsWith('/officer/help');
  const title = onCase ? 'Case details' : onHelp ? 'Help Centre' : 'My Workspace';

  const deptId = String((user as unknown as Record<string, unknown>).department ?? '');
  const deptLabel = lookups.departments.find((d) => String(d.id) === deptId)?.name;
  const subtitle = deptLabel ? `Officer · ${deptLabel}` : roleLabel(user.role);

  const signOut = () => {
    logout();
    router.replace('/signin');
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/officer?q=${encodeURIComponent(v)}` : '/officer');
  };

  const itemCls = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition-colors duration-150 ${
      active ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-canvas md:flex">
      <IdleLogout /> {/* NEW */}

      {mobileOpen && (
        <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-dark text-white transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 p-5">
          <Logo inverted subtitle="Officer Workspace" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Officer navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active =
              item.queue === 'assigned'
                ? (pathname === '/officer' && currentQueue === 'assigned') || onCase
                : pathname === '/officer' && currentQueue === item.queue;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? 'page' : undefined} className={itemCls(active)}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <Link href="/officer/help" onClick={() => setMobileOpen(false)} aria-current={onHelp ? 'page' : undefined} className={itemCls(onHelp)}>
            <LifeBuoyIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            Help Centre
          </Link>
        </nav>

        <div className="border-t border-white/10 p-3">
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white">
              Switch to admin view →
            </Link>
          )}
          <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-white/80 hover:bg-white/5 hover:text-white">
            <LogOutIcon className="h-5 w-5" aria-hidden="true" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-3 md:px-8">
          <button type="button" onClick={() => setMobileOpen((v) => !v)} className="rounded-lg p-2 text-ink hover:bg-canvas md:hidden" aria-label="Toggle navigation">
            {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm text-muted">Officer Workspace</p>
            <p className="truncate text-lg font-bold text-ink">{title}</p>
          </div>

          <form onSubmit={onSearch} className="relative ml-auto hidden w-full max-w-md md:block">
            <label htmlFor="officer-search" className="sr-only">Search cases, references, wards</label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="officer-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases, references, wards" className="field h-11" style={{ paddingLeft: 36 }} />
          </form>

          <Link href="/officer?queue=new" aria-label="Cases awaiting assignment" className="ml-auto rounded-lg p-2 text-ink hover:bg-canvas md:ml-0">
            <BellIcon className="h-5 w-5" aria-hidden="true" />
          </Link>

          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-canvas">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{initialsOf(user)}</span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-bold text-ink">{displayName(user)}</span>
                <span className="block text-xs text-muted">{subtitle}</span>
              </span>
              <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white shadow-card">
                {user.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-ink hover:bg-canvas">
                    Switch to admin view
                  </Link>
                )}
                <button type="button" onClick={signOut} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-danger hover:bg-canvas">
                  <LogOutIcon className="h-4 w-4" aria-hidden="true" /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="w-full flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole allow={['STAFF', 'DEPT_HEAD', 'ADMIN']}>
      <Suspense fallback={null}>
        <OfficerShell>{children}</OfficerShell>
      </Suspense>
    </RequireRole>
  );
}