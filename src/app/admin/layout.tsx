'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3Icon, BellIcon, Building2Icon, ChevronDownIcon, ClipboardListIcon,
  FolderKanbanIcon, LayoutDashboardIcon, LogOutIcon, MapPinIcon, MegaphoneIcon,
  MenuIcon, SearchIcon, TagsIcon, UserPlusIcon, UsersIcon, XIcon,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { RequireRole, useCurrentUser } from '@/components/RequireRole';
import { IdleLogout } from '@/components/IdleLogout'; // NEW
import { displayName, initialsOf, logout, roleLabel } from '@/api/auth';

const navLinks = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboardIcon },
  { label: 'All Requests', href: '/admin/requests', icon: FolderKanbanIcon },
  { label: 'Request Assignment', href: '/admin/assignment', icon: UserPlusIcon },
  { label: 'Departments', href: '/admin/departments', icon: Building2Icon },
  { label: 'Staff and Users', href: '/admin/users', icon: UsersIcon },
  { label: 'Service Categories', href: '/admin/categories', icon: TagsIcon },
  { label: 'Locations and Wards', href: '/admin/locations', icon: MapPinIcon },
  { label: 'Reports and Analytics', href: '/admin/analytics', icon: BarChart3Icon },
  { label: 'Announcements', href: '/admin/announcements', icon: MegaphoneIcon },
  { label: 'Audit Logs', href: '/admin/audit', icon: ClipboardListIcon },
];

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');

  const current = navLinks.find((n) => isActive(pathname, n.href))?.label ?? 'Overview';

  const signOut = () => {
    logout();
    router.replace('/signin');
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (v) router.push(`/admin/requests?q=${encodeURIComponent(v)}`);
  };

  return (
    <div className="min-h-screen bg-canvas md:flex">
      <IdleLogout /> {/* NEW */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ---------- Sidebar ---------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-dark text-white transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 p-5">
          <Logo inverted subtitle="County Administration" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition-colors duration-150 ${
                  active ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/officer"
            className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white"
          >
            Switch to officer view →
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-white/80 hover:bg-white/5 hover:text-white"
          >
            <LogOutIcon className="h-5 w-5" aria-hidden="true" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-3 md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-ink hover:bg-canvas md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm text-muted">County Administration</p>
            <p className="truncate text-lg font-bold text-ink">{current}</p>
          </div>

          <form onSubmit={onSearch} className="relative ml-auto hidden w-full max-w-md md:block">
            <label htmlFor="admin-search" className="sr-only">Search requests, staff, departments</label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="admin-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search requests, staff, departments"
              className="field h-11"
              style={{ paddingLeft: 36 }}
            />
          </form>

          <Link
            href="/admin/requests"
            aria-label="Open requests"
            className="ml-auto rounded-lg p-2 text-ink hover:bg-canvas md:ml-0"
          >
            <BellIcon className="h-5 w-5" aria-hidden="true" />
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-canvas"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {initialsOf(user)}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-bold text-ink">{displayName(user)}</span>
                <span className="block text-xs text-muted">{roleLabel(user.role)}</span>
              </span>
              <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <Link href="/officer" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-ink hover:bg-canvas">
                  Switch to officer view
                </Link>
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole allow={['ADMIN']}>
      <Suspense fallback={null}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </RequireRole>
  );
}