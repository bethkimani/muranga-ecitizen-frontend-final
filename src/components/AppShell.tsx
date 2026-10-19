import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellIcon,
  ChevronDownIcon,
  FilePlus2Icon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
  XIcon } from
'lucide-react';
import { Logo } from './Logo';
import { adminNav, citizenNav, officerNav } from '../data/navigation';
import { notifications } from '../data/portal';
import { initials } from '../utils/format';
import type { NavItem } from '../types/portal';

type Variant = 'citizen' | 'officer' | 'admin';

const config: Record<Variant, {nav: NavItem[];user: string;role: string;home: string;subtitle: string;searchHint: string;}> = {
  citizen: { nav: citizenNav, user: 'Wanjiru Kamau', role: 'Citizen account', home: '/portal', subtitle: 'Citizen Portal', searchHint: 'Search requests by reference or title' },
  officer: { nav: officerNav, user: 'James Kariuki', role: 'Officer · Water & Sanitation', home: '/officer', subtitle: 'Officer Workspace', searchHint: 'Search cases, references, wards' },
  admin: { nav: adminNav, user: 'Grace Njeri', role: 'System Administrator', home: '/admin', subtitle: 'County Administration', searchHint: 'Search requests, staff, departments' }
};

function isActive(item: NavItem, pathname: string, search: string, home: string) {
  const [path, query] = item.to.split('?');
  if (query) return pathname === path && search === `?${query}`;
  if (path === home) return pathname === home && !search || home === '/officer' && pathname.startsWith('/officer/cases');
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppShell({ variant }: {variant: Variant;}) {
  const c = config[variant];
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const staff = variant !== 'citizen';
  const unread = notifications.filter((n) => !n.read).length;
  const current = c.nav.find((n) => isActive(n, pathname, search, c.home));

  useEffect(() => {
    setDrawer(false);
    setMenu(false);
  }, [pathname, search]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const sidebar =
  <div className={`flex h-full flex-col ${staff ? 'bg-brand-dark' : 'bg-white'}`}>
      <div className={`flex h-[72px] items-center px-5 ${staff ? 'border-b border-white/10' : 'border-b border-line'}`}>
        <Logo inverted={staff} subtitle={c.subtitle} to={c.home} />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Sidebar">
        {c.nav.map((item) => {
        const active = isActive(item, pathname, search, c.home);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150 ${
            staff ?
            active ?
            'bg-white/10 text-white' :
            'text-white/70 hover:bg-white/5 hover:text-white' :
            active ?
            'bg-brand-50 text-brand' :
            'text-[#3A433D] hover:bg-canvas hover:text-ink'}`
            }>
            
              <Icon className={`h-[18px] w-[18px] ${active ? staff ? 'text-gold' : 'text-brand' : ''}`} aria-hidden="true" />
              {item.label}
              {item.label === 'Notifications' && unread > 0 &&
            <span className="ml-auto rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{unread}</span>
            }
            </Link>);

      })}
      </nav>
      <div className={`p-3 ${staff ? 'border-t border-white/10' : 'border-t border-line'}`}>
        {variant === 'admin' &&
      <Link to="/officer" className="mb-1 block rounded-lg px-3 py-2 text-xs font-semibold text-white/60 hover:text-white">
            Switch to officer view →
          </Link>
      }
        {variant === 'officer' &&
      <Link to="/admin" className="mb-1 block rounded-lg px-3 py-2 text-xs font-semibold text-white/60 hover:text-white">
            Switch to admin view →
          </Link>
      }
        <button
        onClick={() => navigate('/signin')}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150 ${
        staff ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-[#3A433D] hover:bg-canvas'}`
        }>
        
          <LogOutIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>;


  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden w-64 lg:block ${staff ? '' : 'border-r border-line'}`}>{sidebar}</aside>

      <AnimatePresence>
        {drawer &&
        <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setDrawer(false)} />
            <motion.div
            className="absolute inset-y-0 left-0 w-[280px] shadow-pop"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
            
              {sidebar}
              <button onClick={() => setDrawer(false)} className="absolute right-3 top-5 rounded-lg p-2 text-muted hover:bg-canvas" aria-label="Close navigation">
                <XIcon className={`h-5 w-5 ${staff ? 'text-white' : ''}`} />
              </button>
            </motion.div>
          </div>
        }
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setDrawer(true)} className="btn-ghost h-10 w-10 px-0 lg:hidden" aria-label="Open navigation">
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="hidden text-xs font-medium text-muted sm:block">
                <Link to={c.home} className="hover:text-ink">{c.subtitle}</Link>
                {current && current.to !== c.home && <span> / {current.label}</span>}
              </nav>
              <p className="truncate text-[15px] font-bold text-ink">{current?.label ?? (pathname.includes('/requests/') || pathname.includes('/cases/') ? 'Request details' : c.subtitle)}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="relative hidden md:block">
                <span className="sr-only">Search</span>
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input className="field h-10 w-72 pl-9 xl:w-80" placeholder={c.searchHint} />
              </label>
              <Link
                to={variant === 'citizen' ? '/portal/notifications' : c.home}
                className="btn-ghost relative h-10 w-10 px-0"
                aria-label={`Notifications, ${unread} unread`}>
                
                <BellIcon className="h-5 w-5" />
                {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />}
              </Link>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-canvas" aria-expanded={menu} aria-haspopup="menu">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${staff ? 'bg-brand-dark text-white' : 'bg-brand-50 text-brand'}`}>{initials(c.user)}</span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-semibold leading-tight text-ink">{c.user}</span>
                    <span className="block text-xs text-muted">{c.role}</span>
                  </span>
                  <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {menu &&
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-line bg-white p-1.5 shadow-pop">
                    
                      <Link role="menuitem" to={variant === 'citizen' ? '/portal/profile' : c.home} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-canvas">
                        <UserIcon className="h-4 w-4 text-muted" /> My profile
                      </Link>
                      <button role="menuitem" onClick={() => navigate('/signin')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger-50">
                        <LogOutIcon className="h-4 w-4" /> Sign out
                      </button>
                    </motion.div>
                  }
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${variant === 'citizen' ? 'pb-24 lg:pb-8' : ''}`}>
          <Outlet />
        </main>
      </div>

      {variant === 'citizen' &&
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white lg:hidden" aria-label="Quick actions">
          {[
        { to: '/portal', label: 'Home', icon: LayoutDashboardIcon },
        { to: '/portal/submit', label: 'Report', icon: FilePlus2Icon },
        { to: '/portal/requests', label: 'Requests', icon: FolderOpenIcon },
        { to: '/portal/notifications', label: 'Alerts', icon: BellIcon }].
        map((i) => {
          const active = i.to === '/portal' ? pathname === '/portal' : pathname.startsWith(i.to);
          const Icon = i.icon;
          return (
            <Link key={i.to} to={i.to} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active ? 'text-brand' : 'text-muted'}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                {i.label}
              </Link>);

        })}
        </nav>
      }
    </div>);

}