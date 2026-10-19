import React from 'react';
import { BellRingIcon, MessageSquareTextIcon, SearchCheckIcon } from 'lucide-react';
import { publicMetrics } from '../../data/analytics';
import { SampleDataTag } from '../ui';

const steps = [
{ icon: MessageSquareTextIcon, title: 'Report', body: 'Tell the county about an issue — add a photo and the location. It takes about two minutes.' },
{ icon: SearchCheckIcon, title: 'Track', body: 'Follow progress any time using your request reference, with or without an account.' },
{ icon: BellRingIcon, title: 'Resolve', body: 'Receive updates as the responsible department inspects, works on and resolves the issue.' }];


export function LandingProcess() {
  const [resolved, ...rest] = [publicMetrics[2], publicMetrics[0], publicMetrics[1], publicMetrics[3]];
  return (
    <>
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">How it works</h2>
          <ol className="relative mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            <span className="absolute left-6 right-6 top-6 hidden h-px bg-line md:block" aria-hidden="true" />
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="relative">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white ring-8 ring-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-sm font-bold text-gold-ink">Step {i + 1}</p>
                  <h3 className="mt-1 text-xl font-extrabold text-ink">{s.title}</h3>
                  <p className="mt-2 max-w-xs leading-relaxed text-muted">{s.body}</p>
                </li>);

            })}
          </ol>
        </div>
      </section>

      <section className="bg-brand-dark py-16 text-white md:py-20" aria-labelledby="accountability">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="accountability" className="text-3xl font-extrabold tracking-tight">Public service performance</h2>
              <p className="mt-2 max-w-xl text-white/75">Figures update automatically from request records so residents can see how the county is responding.</p>
            </div>
            <SampleDataTag label="Demonstration data — not verified county statistics" />
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="bg-brand p-7">
              <p className="text-sm font-semibold text-white/80">{resolved.label}</p>
              <p className="mt-3 text-6xl font-extrabold tracking-tight">{resolved.value}</p>
              <p className="mt-2 text-sm text-white/80">{resolved.note}</p>
            </div>
            {rest.map((m) =>
            <div key={m.label} className="bg-brand-dark p-7">
                <p className="text-sm font-semibold text-white/70">{m.label}</p>
                <p className="mt-3 text-4xl font-extrabold tracking-tight">{m.value}</p>
                <p className="mt-2 text-sm text-white/60">{m.note}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>);

}