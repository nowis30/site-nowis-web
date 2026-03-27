'use client';

import Link from 'next/link';
import React from 'react';

export interface DetailField {
  label: string;
  value: React.ReactNode;
}

export interface DetailSection {
  title: string;
  fields: DetailField[];
}

interface CrmDetailCardProps {
  title: string;
  backHref: string;
  backLabel?: string;
  badge?: React.ReactNode;
  sections: DetailSection[];
}

export function CrmDetailCard({ title, backHref, backLabel = 'Retour', badge, sections }: CrmDetailCardProps) {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            ← {backLabel}
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
          </div>
        </div>
        {badge ? <div>{badge}</div> : null}
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          {section.title ? (
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-300">
              {section.title}
            </h3>
          ) : null}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.fields.map((field, i) => (
              <div key={i} className="flex flex-col gap-1">
                {field.label ? (
                  <dt className="text-xs uppercase tracking-wide text-slate-500">{field.label}</dt>
                ) : null}
                <dd className="text-sm text-slate-100">{field.value ?? <span className="text-slate-500">—</span>}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}
