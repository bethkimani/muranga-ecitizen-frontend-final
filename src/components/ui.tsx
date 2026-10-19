import React from "react";
import { ChevronLeftIcon, ChevronRightIcon, FlaskConicalIcon, type LucideIcon } from "lucide-react";
export function PageHeader({
  title,
  description,
  actions




}: {title: string;description?: string;actions?: React.ReactNode;}) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted md:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>;
}
export function SampleDataTag({
  label = 'Sample data'


}: {label?: string;}) {
  return <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold-50 px-2 py-0.5 text-[11px] font-semibold text-gold-ink">
      <FlaskConicalIcon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>;
}
export function EmptyState({
  icon: Icon,
  title,
  body,
  action





}: {icon: LucideIcon;title: string;body: string;action?: React.ReactNode;}) {
  return <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>;
}
export function Skeleton({
  className = ''


}: {className?: string;}) {
  return <div className={`animate-pulse rounded-md bg-[#E8ECE9] ${className}`} aria-hidden="true" />;
}
export function Pagination({
  page,
  pages,
  total,
  onChange





}: {page: number;pages: number;total: number;onChange: (p: number) => void;}) {
  return <nav className="flex items-center justify-between gap-4 border-t border-line px-4 py-3" aria-label="Pagination">
      <p className="text-sm text-muted">
        Page <span className="font-semibold text-ink">{page}</span> of {Math.max(pages, 1)} · {total} results
      </p>
      <div className="flex items-center gap-1">
        <button className="btn-secondary h-9 w-9 px-0" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {Array.from({
        length: Math.max(pages, 1)
      }, (_, i) => i + 1).map((p) => <button key={p} onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined} className={`hidden h-9 w-9 rounded-lg text-sm font-semibold transition-colors duration-150 sm:block ${p === page ? 'bg-brand text-white' : 'text-ink hover:bg-canvas'}`}>
            {p}
          </button>)}
        <button className="btn-secondary h-9 w-9 px-0" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>;
}
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children







}: {label: string;htmlFor: string;hint?: string;error?: string;optional?: boolean;children: React.ReactNode;}) {
  return <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="text-xs font-medium text-muted">Optional</span>}
      </label>
      {children}
      {error ? <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p> : hint ? <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p> : null}
    </div>;
}