import { Suspense } from 'react';
import { SubmissionFormClient } from './SubmissionFormClient';

export default function PublicSubmissionRequestPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-slate-100">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
              <p className="text-sm text-slate-300">Chargement du formulaire...</p>
            </div>
          </div>
        </main>
      }
    >
      <SubmissionFormClient />
    </Suspense>
  );
}
