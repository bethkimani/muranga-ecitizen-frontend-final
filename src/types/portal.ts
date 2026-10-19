import type { LucideIcon } from 'lucide-react';

export type NotificationType =
'submitted' |
'assigned' |
'status' |
'clarification' |
'resolved' |
'announcement';

export interface PortalNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: string;
  read: boolean;
  ref?: string;
}

export interface Announcement {
  id: string;
  category: 'Water' | 'Roads' | 'Health' | 'Environment' | 'General';
  title: string;
  summary: string;
  date: string;
}

export type StaffRole = 'Administrator' | 'Department Head' | 'County Officer' | 'Customer Service';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  department: string;
  status: 'Active' | 'Invited' | 'Deactivated';
  openCases: number;
  lastActive: string;
}

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface Faq {
  q: string;
  a: string;
}