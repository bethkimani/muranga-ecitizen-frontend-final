import React from 'react';
import { CheckIcon, LockIcon, MegaphoneIcon, UserIcon, WrenchIcon, ArrowRightLeftIcon } from 'lucide-react';
import { formatDateTime } from '../utils/format';
import type { TimelineEvent, TimelineKind } from '../types/request';

const kindStyle: Record<TimelineKind, {icon: typeof CheckIcon;dot: string;label: string;}> = {
  submitted: { icon: CheckIcon, dot: 'bg-brand text-white', label: 'Submitted' },
  status: { icon: ArrowRightLeftIcon, dot: 'bg-brand text-white', label: 'Status change' },
  update: { icon: MegaphoneIcon, dot: 'bg-brand-50 text-brand ring-1 ring-brand/30', label: 'Official update' },
  citizen: { icon: UserIcon, dot: 'bg-canvas text-ink ring-1 ring-line', label: 'Citizen message' },
  internal: { icon: LockIcon, dot: 'bg-gold-50 text-gold-ink ring-1 ring-gold/40', label: 'Internal note' },
  work: { icon: WrenchIcon, dot: 'bg-info-50 text-info ring-1 ring-info/30', label: 'Work recorded' }
};

export function ActivityTimeline({
  events,
  showInternal = false,
  upcoming = []




}: {events: TimelineEvent[];showInternal?: boolean;upcoming?: string[];}) {
  const visible = events.filter((e) => showInternal || e.kind !== 'internal');
  return (
    <ol className="relative">
      {visible.map((e, i) => {
        const k = kindStyle[e.kind];
        const Icon = k.icon;
        const isLast = i === visible.length - 1 && upcoming.length === 0;
        const internal = e.kind === 'internal';
        return (
          <li key={e.id} className="relative flex gap-4 pb-6">
            {!isLast && <span className="absolute left-4 top-9 h-[calc(100%-36px)] w-px bg-line" aria-hidden="true" />}
            <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${k.dot}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className={`min-w-0 flex-1 ${internal ? 'rounded-xl border border-dashed border-gold/50 bg-gold-50/60 p-3' : e.kind === 'citizen' ? 'rounded-xl bg-canvas p-3' : 'pt-1'}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="font-semibold text-ink">{e.title}</p>
                {internal && <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-ink">STAFF ONLY · NOT VISIBLE TO CITIZEN</span>}
                {showInternal && e.kind === 'update' && <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand">VISIBLE TO CITIZEN</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                <span className="sr-only">{k.label}. </span>
                {formatDateTime(e.date)} · {e.author}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3A433D]">{e.body}</p>
            </div>
          </li>);

      })}
      {upcoming.map((u, i) =>
      <li key={u} className="relative flex gap-4 pb-6 last:pb-0">
          {i < upcoming.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-36px)] w-px border-l border-dashed border-line" aria-hidden="true" />}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line bg-white" aria-hidden="true" />
          <div className="pt-1">
            <p className="font-semibold text-muted">{u}</p>
            <p className="text-xs text-muted">Upcoming</p>
          </div>
        </li>
      )}
    </ol>);

}