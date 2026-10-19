'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGridIcon,
  FilePlus2Icon,
  FolderOpenIcon,
  SearchCheckIcon,
  BellIcon,
  BookOpenIcon,
  LifeBuoyIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  SearchIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { RequireRole, useCurrentUser } from '@/components/RequireRole';
import { IdleLogout } from '@/components/IdleLogout'; // NEW
import { displayName, initialsOf, logout } from '@/api/auth';

const navLinks = [
  { label: 'Overview', href: '/portal', icon: LayoutGridIcon },
  { label: 'Submit a Request', href: '/portal/submit', icon: FilePlus2Icon },
  { label: 'My Requests', href: '/portal/requests', icon: FolderOpenIcon },
  { label: 'Track a Request', href: '/portal/track', icon: SearchCheckIcon },
  { label: 'Notifications', href: '/portal/notifications', icon: BellIcon, badge: 3 },
  { label: 'Service Directory', href: '/portal/services', icon: BookOpenIcon },
  { label: 'Help Centre', href: '/portal/help', icon: LifeBuoyIcon },
  { label: 'My Profile', href: '/portal/profile', icon: UserIcon },
  { label: 'Settings', href: '/portal/settings', icon: SettingsIcon },
];

function isActivePath(pathname: string, href: string) {
  return href === '/portal' ? pathname === '/portal' : pathname.startsWith(href);
}

function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close drawer and user menu whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close the user menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const current = navLinks.find((l) => isActivePath(pathname, l.href));
  const pageTitle = current?.label ?? 'Overview';

  function signOut() {
    logout();
    router.replace('/signin');
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/portal/requests?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <IdleLogout /> {/* NEW */}

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[72px] shrink-0 items-center border-b border-line px-5">
          <Logo subtitle="Citizen Portal" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Portal">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors duration-150 ${
                  active ? 'bg-brand/10 text-brand-dark' : 'text-ink hover:bg-canvas'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-brand' : 'text-muted'}`} aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors duration-150 hover:bg-canvas"
          >
            <LogOutIcon className="h-5 w-5 text-muted" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main column: min-w-0 stops wide tables/grids from pushing the page sideways */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-line bg-white px-4 md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-ink hover:bg-canvas lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>

          <div className="min-w-0 shrink-0">
            <p className="text-sm text-muted">Citizen Portal</p>
            <p className="truncate text-lg font-bold leading-tight text-ink">{pageTitle}</p>
          </div>

          {/* Desktop search */}
          <form
            onSubmit={onSearch}
            role="search"
            className="ml-auto hidden w-full max-w-md md:block lg:ml-8 lg:max-w-xl"
          >
            <label htmlFor="portal-search" className="sr-only">
              Search requests by reference or title
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="portal-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search requests by reference or title"
                style={{ paddingLeft: 40 }}
                className="h-11 w-full rounded-xl border border-line bg-white pr-4 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-4">
            <Link
              href="/portal/notifications"
              className="relative rounded-lg p-2 text-ink hover:bg-canvas"
              aria-label="Notifications, 3 unread"
            >
              <BellIcon className="h-5 w-5" aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </Link>

            {/* User menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-canvas"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand-dark">
                  {initialsOf(user)}
                </span>
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block truncate text-sm font-semibold text-ink">{displayName(user)}</span>
                  <span className="block text-xs text-muted">Citizen account</span>
                </span>
                <ChevronDownIcon
                  className={`hidden h-4 w-4 text-muted transition-transform duration-150 sm:block ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-white py-2 shadow-lg"
                >
                  <Link
                    href="/portal/profile"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-[15px] font-medium text-ink hover:bg-canvas"
                  >
                    <UserIcon className="h-5 w-5 text-muted" aria-hidden="true" />
                    My profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-[15px] font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOutIcon className="h-5 w-5" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile search sits under the header */}
        <form onSubmit={onSearch} role="search" className="border-b border-line bg-white px-4 py-3 md:hidden">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search requests"
              aria-label="Search requests by reference or title"
              style={{ paddingLeft: 40 }}
              className="h-11 w-full rounded-xl border border-line bg-white pr-4 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </form>

        <main className="w-full min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole allow={['CITIZEN']}>
      <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
        <PortalShell>{children}</PortalShell>
      </Suspense>
    </RequireRole>
  );
}