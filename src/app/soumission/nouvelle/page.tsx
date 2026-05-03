import { Suspense } from 'react';
import { SubmissionFormClient } from './SubmissionFormClient';

export default function PublicSubmissionRequestPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10 text-slate-200">Chargement...</main>}>
      <SubmissionFormClient />
    </Suspense>
  );
}
