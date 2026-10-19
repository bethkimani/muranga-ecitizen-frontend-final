import type { LucideIcon } from 'lucide-react';

export type RequestStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type CategoryId =
'water' |
'roads' |
'lighting' |
'waste' |
'health' |
'environment' |
'facilities' |
'other';

export type TimelineKind = 'submitted' | 'status' | 'update' | 'citizen' | 'internal' | 'work';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  body: string;
  author: string;
  kind: TimelineKind;
}

export interface ServiceRequest {
  ref: string;
  title: string;
  category: CategoryId;
  subcategory: string;
  description: string;
  subCounty: string;
  ward: string;
  landmark: string;
  coordinates?: string;
  submitted: string;
  updated: string;
  status: RequestStatus;
  priority: Priority;
  department?: string;
  officer?: string;
  citizen: string;
  slaDue?: string;
  evidence: string[];
  timeline: TimelineEvent[];
  statusNote?: string;
}

export interface ServiceCategory {
  id: CategoryId;
  name: string;
  description: string;
  department: string;
  responseTarget: string;
  subcategories: string[];
  icon: LucideIcon;
}