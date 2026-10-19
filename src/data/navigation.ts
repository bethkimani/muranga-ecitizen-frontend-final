import {
  LayoutDashboardIcon,
  FilePlus2Icon,
  FolderOpenIcon,
  SearchCheckIcon,
  BellIcon,
  BookOpenIcon,
  LifeBuoyIcon,
  UserIcon,
  SettingsIcon,
  InboxIcon,
  ListChecksIcon,
  UserPlusIcon,
  Building2Icon,
  UsersIcon,
  TagsIcon,
  MapPinnedIcon,
  BarChart3Icon,
  MegaphoneIcon,
  ScrollTextIcon,
  AlarmClockIcon } from
'lucide-react';
import type { NavItem } from '../types/portal';

export const citizenNav: NavItem[] = [
{ label: 'Overview', to: '/portal', icon: LayoutDashboardIcon },
{ label: 'Submit a Request', to: '/portal/submit', icon: FilePlus2Icon },
{ label: 'My Requests', to: '/portal/requests', icon: FolderOpenIcon },
{ label: 'Track a Request', to: '/portal/track', icon: SearchCheckIcon },
{ label: 'Notifications', to: '/portal/notifications', icon: BellIcon },
{ label: 'Service Directory', to: '/portal/services', icon: BookOpenIcon },
{ label: 'Help Centre', to: '/portal/help', icon: LifeBuoyIcon },
{ label: 'My Profile', to: '/portal/profile', icon: UserIcon },
{ label: 'Settings', to: '/portal/settings', icon: SettingsIcon }];


export const officerNav: NavItem[] = [
{ label: 'My Workspace', to: '/officer', icon: InboxIcon },
{ label: 'Near Deadline', to: '/officer?queue=sla', icon: AlarmClockIcon },
{ label: 'Awaiting Assignment', to: '/officer?queue=new', icon: UserPlusIcon },
{ label: 'Help Centre', to: '/officer/help', icon: LifeBuoyIcon }];


export const adminNav: NavItem[] = [
{ label: 'Overview', to: '/admin', icon: LayoutDashboardIcon },
{ label: 'All Requests', to: '/admin/requests', icon: ListChecksIcon },
{ label: 'Request Assignment', to: '/admin/assignment', icon: UserPlusIcon },
{ label: 'Departments', to: '/admin/departments', icon: Building2Icon },
{ label: 'Staff and Users', to: '/admin/users', icon: UsersIcon },
{ label: 'Service Categories', to: '/admin/categories', icon: TagsIcon },
{ label: 'Locations and Wards', to: '/admin/locations', icon: MapPinnedIcon },
{ label: 'Reports and Analytics', to: '/admin/analytics', icon: BarChart3Icon },
{ label: 'Announcements', to: '/admin/announcements', icon: MegaphoneIcon },
{ label: 'Audit Logs', to: '/admin/audit', icon: ScrollTextIcon },
{ label: 'System Settings', to: '/admin/settings', icon: SettingsIcon }];