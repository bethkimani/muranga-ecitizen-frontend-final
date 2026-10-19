import React from 'react';
import type { Priority, RequestStatus } from '../types/request';

const statusStyles: Record<RequestStatus, {cls: string;dot: string;desc: string;}> = {
  Pending: { cls: 'bg-warning-50 text-warning-ink', dot: 'bg-warning', desc: 'received and awaiting review' },
  'In Progress': { cls: 'bg-info-50 text-info', dot: 'bg-info', desc: 'a department is working on it' },
  Resolved: { cls: 'bg-success-50 text-success', dot: 'bg-success', desc: 'work completed by the county' },
  Rejected: { cls: 'bg-[#F1F2F1] text-[#4B524D]', dot: 'bg-[#8A938C]', desc: 'outside county mandate, see explanation' }
};

export function StatusBadge({ status, size = 'sm' }: {status: RequestStatus;size?: 'sm' | 'md';}) {
  const s = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${s.cls} ${
      size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'}`
      }>
      
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
      <span className="sr-only">: {s.desc}</span>
    </span>);

}

const priorityStyles: Record<Priority, string> = {
  Urgent: 'text-danger bg-danger-50',
  High: 'text-warning-ink bg-warning-50',
  Medium: 'text-[#3F4A43] bg-canvas',
  Low: 'text-muted bg-canvas'
};

export function PriorityBadge({ priority }: {priority: Priority;}) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${priorityStyles[priority]}`}>
      {priority}
      <span className="sr-only"> priority</span>
    </span>);

}