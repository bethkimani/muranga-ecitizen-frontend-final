'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeftIcon, ArrowRightIcon, BellRingIcon, CheckIcon,
  Loader2Icon, PencilIcon, RefreshCwIcon, WifiOffIcon,
} from 'lucide-react';
import { subCounties } from '@/data/categories';
import { EmptyState, Field, Skeleton } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { MapPicker } from '@/components/submit/MapPicker';
import { createRequest, type ApiRequest } from '@/api/requests';
import { useLookups } from '@/hooks/useLookups';
import { categoryIcon } from '@/utils/categoryIcon';
import { formatCoords, type LatLng } from '@/utils/coords';
import { errorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

const steps = ['Service', 'Describe', 'Location', 'Review'];

function SubmitRequest() {
  const params = useSearchParams();
  const lookups = useLookups();
  const preselect = Number(params.get('category')) || null;

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<number | null>(preselect);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [subCounty, setSubCounty] = useState('');
  const [ward, setWard] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pin, setPin] = useState<LatLng | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<ApiRequest | null>(null);

  const cat = lookups.findCategory(category);

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !cat) e.category = 'Choose the service that best matches your issue.';
    if (step === 1) {
      if (title.trim().length < 8) e.title = 'Give your request a short title (at least 8 characters).';
      if (desc.trim().length < 20) e.desc = 'Describe the issue in a little more detail (at least 20 characters).';
    }
    if (step === 2) {
      if (!subCounty) e.subCounty = 'Select a sub-county.';
      if (!ward) e.ward = 'Select a ward.';
      if (landmark.trim().length < 4) e.landmark = 'Add a road, estate or landmark so officers can find the issue.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!cat) return;
    setSubmitting(true);
    try {
      const res = await createRequest({
        title: title.trim(),
        description: desc.trim(),
        category: cat.id,
        sub_county: subCounty,
        ward,
        landmark: landmark.trim(),
        ...(pin ? { coordinates: formatCoords(pin) } : {}),
      });
      setCreated(res);
    } catch (err) {
      toast.error(errorMessage(err, 'We could not submit your request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setCategory(null);
    setTitle('');
    setDesc('');
    setSubCounty('');
    setWard('');
    setLandmark('');
    setPin(null);
    setErrors({});
    setCreated(null);
  };

  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="card overflow-hidden"
        >
          <div className="bg-brand-dark px-6 py-10 text-center text-white">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand">
              <CheckIcon className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold">Request submitted</h1>
            <p className="mt-1 text-white/80">Thank you. The county has received your request.</p>
          </div>
          <div className="p-6">
            <div className="rounded-xl bg-canvas p-4 text-center">
              <p className="text-xs font-semibold text-muted">Your reference number</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-ink">{created.ref_number}</p>
              <p className="mt-1 text-xs text-muted">Keep this to track your request.</p>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-muted">Service</dt>
                <dd className="mt-0.5 font-semibold text-ink">{cat?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted">Submitted</dt>
                <dd className="mt-0.5 font-semibold text-ink">{formatDate(created.submitted_at)}</dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd className="mt-0.5"><StatusBadge status={created.status} /></dd>
              </div>
            </dl>
            <p className="mt-6 flex gap-3 border-t border-line pt-5 text-sm text-muted">
              <BellRingIcon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
              You’ll see each update the department publishes on your request’s page.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href={`/portal/requests/${created.id}`} className="btn-primary h-11">View Request</Link>
              <button type="button" onClick={reset} className="btn-secondary h-11">Submit Another Request</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const reviewGroups = [
    { s: 0, title: 'Service', rows: [['Service', cat?.name ?? '—']] },
    { s: 1, title: 'Issue', rows: [['Title', title], ['Description', desc]] },
    {
      s: 2,
      title: 'Location',
      rows: [
        ['Sub-county / Ward', `${subCounty} · ${ward}`],
        ['Landmark', landmark],
        ['Map pin', pin ? formatCoords(pin) : 'Not pinned'],
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-[28px]">Report an issue</h1>
      <p className="mt-1 text-muted">Tell us what’s wrong and where.</p>

      <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Progress">
        {steps.map((s, i) => (
          <li key={s} aria-current={i === step ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full transition-colors duration-200 ${i <= step ? 'bg-brand' : 'bg-line'}`} />
            <p className={`mt-2 text-xs font-semibold ${i === step ? 'text-brand' : i < step ? 'text-ink' : 'text-muted'}`}>
              <span className="sr-only">Step {i + 1}: </span>{s}
            </p>
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-5 md:p-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            {step === 0 && (
              <fieldset>
                <legend className="text-lg font-bold text-ink">Which service is this about?</legend>
                {errors.category && (
                  <p role="alert" className="mt-1 text-sm font-medium text-danger">{errors.category}</p>
                )}

                {lookups.loading ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                  </div>
                ) : lookups.error ? (
                  <EmptyState
                    icon={WifiOffIcon}
                    title="We couldn’t load the services"
                    body={lookups.error}
                    action={
                      <button type="button" className="btn-primary" onClick={lookups.reload}>
                        <RefreshCwIcon className="h-4 w-4" /> Try again
                      </button>
                    }
                  />
                ) : lookups.categories.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">No services are available right now. Please check back later.</p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {lookups.categories.map((c) => {
                      const Icon = categoryIcon(c.name);
                      const sel = category === c.id;
                      return (
                        <label
                          key={c.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-150 ${
                            sel ? 'border-brand bg-brand-50 ring-1 ring-brand' : 'border-line hover:border-brand/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            className="sr-only"
                            checked={sel}
                            onChange={() => {
                              setCategory(c.id);
                              setErrors({});
                            }}
                          />
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${sel ? 'bg-brand text-white' : 'bg-canvas text-brand'}`}>
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block font-semibold text-ink">{c.name}</span>
                            {c.description && (
                              <span className="mt-0.5 block text-xs leading-relaxed text-muted">{c.description}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-ink">Describe the issue</h2>
                <Field label="Request title" htmlFor="title" error={errors.title} hint="e.g. Burst pipe flooding the road near the market">
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`field h-11 ${errors.title ? 'field-error' : ''}`}
                    aria-invalid={!!errors.title}
                    maxLength={90}
                  />
                </Field>
                <Field
                  label="Detailed description"
                  htmlFor="desc"
                  error={errors.desc}
                  hint={`${desc.length}/1000 · What did you see, how long has it been happening, who is affected?`}
                >
                  <textarea
                    id="desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={6}
                    maxLength={1000}
                    className={`field ${errors.desc ? 'field-error' : ''}`}
                    aria-invalid={!!errors.desc}
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-ink">Where is the issue?</h2>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="County" htmlFor="county">
                    <input id="county" value="Murang’a" disabled readOnly className="field h-11" />
                  </Field>
                  <Field label="Sub-county" htmlFor="subCounty" error={errors.subCounty}>
                    <select
                      id="subCounty"
                      value={subCounty}
                      onChange={(e) => {
                        setSubCounty(e.target.value);
                        setWard('');
                      }}
                      className={`field h-11 ${errors.subCounty ? 'field-error' : ''}`}
                    >
                      <option value="">Select…</option>
                      {Object.keys(subCounties).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ward" htmlFor="ward" error={errors.ward}>
                    <select
                      id="ward"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      disabled={!subCounty}
                      className={`field h-11 ${errors.ward ? 'field-error' : ''}`}
                    >
                      <option value="">{subCounty ? 'Select…' : 'Choose sub-county first'}</option>
                      {(subCounties[subCounty] ?? []).map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field
                  label="Estate, village, road or landmark"
                  htmlFor="landmark"
                  error={errors.landmark}
                  hint="e.g. Opposite Makuyu Shopping Centre, near the matatu stage"
                >
                  <input
                    id="landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className={`field h-11 ${errors.landmark ? 'field-error' : ''}`}
                  />
                </Field>
                <div>
                  <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
                    Pin on map{' '}
                    <span className="text-xs font-medium text-muted">Optional — written location is enough</span>
                  </p>
                  <MapPicker pin={pin} onPin={setPin} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold text-ink">Review your request</h2>
                <p className="mt-1 text-sm text-muted">Check the details below before submitting.</p>
                {reviewGroups.map((g) => (
                  <section key={g.title} className="mt-5 border-t border-line pt-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-ink">{g.title}</h3>
                      <button
                        type="button"
                        onClick={() => setStep(g.s)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand"
                      >
                        <PencilIcon className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                    <dl className="mt-3 space-y-2 text-sm">
                      {g.rows.map(([k, v]) => (
                        <div key={k} className="grid gap-1 sm:grid-cols-[160px_1fr]">
                          <dt className="text-muted">{k}</dt>
                          <dd className="whitespace-pre-line font-medium text-ink">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setStep((s) => s - 1);
              }}
              disabled={submitting}
              className="btn-secondary h-11"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button type="button" onClick={next} disabled={lookups.loading} className="btn-primary h-11 px-6">
              Continue <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className="btn-primary h-12 px-7 text-[15px]">
              {submitting ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubmitRequestPage() {
  return (
    <Suspense fallback={null}>
      <SubmitRequest />
    </Suspense>
  );
}