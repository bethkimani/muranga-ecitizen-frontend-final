import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, MapPinIcon, SearchIcon, ShieldCheckIcon } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { StatusStepper } from '../StatusStepper';

const HERO_IMG = "/4de2cbee-e6cd-44cf-a088-72207f985c46.jpg";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:px-8">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-gold-ink">MURANG’A COUNTY | DIGITAL PUBLIC SERVICES</p>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[60px]">
            Your Voice. Our County. <span className="text-brand">Better Services.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Report community issues, follow service requests, and help build a cleaner, safer, better-connected Murang’a.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/portal/submit" className="btn-primary h-12 px-6 text-[15px]">
              Report an Issue <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/track" className="btn-secondary h-12 px-6 text-[15px]">
              <SearchIcon className="h-4 w-4" aria-hidden="true" /> Track My Request
            </Link>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm font-medium text-[#3A433D]">
            <ShieldCheckIcon className="h-4 w-4 text-brand" aria-hidden="true" />
            Transparent updates. Accountable service delivery.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] pb-10 lg:pb-0">
          <div className="overflow-hidden rounded-3xl ring-1 ring-line">
            <img src={HERO_IMG} alt="A county officer maintaining a street light on a newly paved road in Murang’a" className="aspect-[4/5] w-full object-cover sm:aspect-[5/5]" />
          </div>

          <div className="absolute -left-2 bottom-24 w-[300px] rounded-2xl border border-line bg-white p-4 shadow-pop sm:-left-10">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-muted">MCG-2026-004812</span>
              <StatusBadge status="In Progress" />
            </div>
            <p className="mt-2 text-sm font-bold leading-snug text-ink">Burst water pipe near Makuyu stage</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" /> Makuyu Ward · Water & Sanitation
            </p>
            <div className="mt-4">
              <StatusStepper status="In Progress" compact />
            </div>
          </div>

          <div className="absolute -right-2 -bottom-2 w-[190px] rounded-2xl border border-line bg-white p-2.5 shadow-pop sm:-right-6 lg:bottom-6">
            <MiniMap />
            <div className="flex items-center justify-between px-1 pt-2">
              <span className="text-xs font-semibold text-ink">Kiharu Sub-county</span>
              <span className="text-[11px] font-medium text-muted">3 open nearby</span>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

function MiniMap() {
  return (
    <svg viewBox="0 0 180 110" className="h-[100px] w-full rounded-xl bg-[#EEF3EE]" role="img" aria-label="Map preview with request locations">
      <path d="M0 70 C40 60 60 85 100 72 S160 40 180 48" stroke="#CFE0D3" strokeWidth="14" fill="none" />
      <path d="M0 70 C40 60 60 85 100 72 S160 40 180 48" stroke="#fff" strokeWidth="5" fill="none" />
      <path d="M70 0 C75 30 60 60 78 110" stroke="#fff" strokeWidth="4" fill="none" />
      <path d="M130 0 L120 110" stroke="#fff" strokeWidth="3" fill="none" />
      <path d="M0 25 C30 30 50 18 90 28" stroke="#BFD9F2" strokeWidth="5" fill="none" />
      <g>
        <circle cx="78" cy="68" r="9" fill="#00843D" opacity="0.15" />
        <circle cx="78" cy="68" r="5" fill="#00843D" stroke="#fff" strokeWidth="2" />
        <circle cx="128" cy="44" r="4.5" fill="#2563EB" stroke="#fff" strokeWidth="2" />
        <circle cx="40" cy="80" r="4.5" fill="#C98212" stroke="#fff" strokeWidth="2" />
        <circle cx="150" cy="80" r="4.5" fill="#16834A" stroke="#fff" strokeWidth="2" />
      </g>
    </svg>);

}