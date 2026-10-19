import React from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import type { RequestStatus } from '../types/request';

const stages = ['Pending', 'In Progress', 'Resolved'] as const;

export function StatusStepper({ status, compact = false }: {status: RequestStatus;compact?: boolean;}) {
  const rejected = status === 'Rejected';
  const current = rejected ? 0 : stages.indexOf(status as (typeof stages)[number]);

  return (
    <ol className="flex w-full items-center" aria-label={`Request progress: currently ${status}`}>
      {stages.map((stage, i) => {
        const done = !rejected && (i < current || status === 'Resolved');
        const active = !rejected && i === current && status !== 'Resolved';
        const last = i === stages.length - 1;
        const label = rejected && i === 2 ? 'Rejected' : stage;
        return (
          <li key={stage} className={`flex items-center ${last ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex items-center justify-center rounded-full border-2 ${compact ? 'h-6 w-6' : 'h-8 w-8'} ${
                done ?
                'border-brand bg-brand text-white' :
                active ?
                'border-brand bg-white text-brand' :
                rejected && i === 2 ?
                'border-[#8A938C] bg-[#8A938C] text-white' :
                rejected && i === 0 ?
                'border-brand bg-brand text-white' :
                'border-line bg-white text-muted'}`
                }>
                
                {done || rejected && i === 0 ?
                <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> :
                rejected && i === 2 ?
                <XIcon className="h-3.5 w-3.5" strokeWidth={3} /> :

                <span className={`rounded-full ${active ? 'h-2 w-2 bg-brand' : 'h-1.5 w-1.5 bg-line'}`} />
                }
              </span>
              <span
                className={`whitespace-nowrap text-xs font-semibold ${
                done || active ? 'text-ink' : 'text-muted'}`
                }>
                
                {label}
                {active && <span className="sr-only"> (current stage)</span>}
              </span>
            </div>
            {!last &&
            <span
              className={`mx-2 mb-5 h-0.5 flex-1 rounded-full ${
              done && i < current || status === 'Resolved' || rejected && i === 1 ? rejected ? 'bg-[#C9CEC9]' : 'bg-brand' : 'bg-line'}`
              }
              aria-hidden="true" />

            }
          </li>);

      })}
    </ol>);

}