import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getBookingEmbedUrl } from '@/lib/booking-link';

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number') return 'A confirmer';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

function durationLabel(preset: string, customMinutes: number | null) {
  if (preset === 'M60') return '60 minutes';
  if (preset === 'M90') return '90 minutes';
  if (preset === 'M120') return '120 minutes';
  if (preset === 'PERSONNALISE' && customMinutes) return `${customMinutes} minutes`;
  return 'A determiner';
}

const AUDIENCE_LABELS: Record<string, string> = {
  PERSONNES_AGEES: 'Personnes agees',
  JEUNES: 'Jeunes',
  ADULTES: 'Adultes',
  FAMILLE: 'Famille',
  ORGANISME: 'Organisme',
  AUTRE: 'Autre',
};

export default async function AtelierBookingPage({ params }: { params: { token: string } }) {
  const workshop = await prisma.workshopRequest.findUnique({
    where: { clientAccessToken: params.token },
    select: {
      id: true,
      title: true,
      workshopType: true,
      organizationName: true,
      contactPerson: true,
      contactPhone: true,
      contactEmail: true,
      deliveryFormat: true,
      participantEstimate: true,
      targetAudience: true,
      durationPreset: true,
      durationCustomMinutes: true,
      pricingMode: true,
      basePrice: true,
      discountPercent: true,
      finalPrice: true,
      clientNotes: true,
      calendlyUrl: true,
      status: true,
    },
  });

  if (!workshop) {
    notFound();
  }

  const bookingUrl = workshop.calendlyUrl || getBookingEmbedUrl();
  const companyPhone = process.env.COMPANY_PHONE || workshop.contactPhone || '';
  const companyEmail = process.env.COMPANY_EMAIL || workshop.contactEmail || 'simonmorin@nowis.store';

  return (
    <main className="min-h-screen bg-[color:var(--site-bg)] px-4 py-6 text-[color:var(--site-text)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <section className="rounded-3xl border border-[color:var(--site-border)] bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold leading-tight text-[color:var(--site-heading)] md:text-4xl">{workshop.title}</h1>
          <p className="mt-3 text-lg text-[color:var(--site-muted)]">Planification simple de votre atelier</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[color:var(--site-bg-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-soft)]">Type</p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--site-heading)]">{workshop.workshopType === 'ORGANIZATION' ? 'Organisation' : 'Client individuel'}</p>
            </div>
            <div className="rounded-2xl bg-[color:var(--site-bg-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-soft)]">Duree</p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--site-heading)]">{durationLabel(workshop.durationPreset, workshop.durationCustomMinutes)}</p>
            </div>
            <div className="rounded-2xl bg-[color:var(--site-bg-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-soft)]">Public cible</p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--site-heading)]">{AUDIENCE_LABELS[workshop.targetAudience] || 'Autre'}</p>
            </div>
            <div className="rounded-2xl bg-[color:var(--site-bg-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-soft)]">Prix</p>
              <p className="mt-1 text-2xl font-bold text-[color:var(--site-heading)]">{formatMoney(workshop.finalPrice ? Number(workshop.finalPrice) : null)}</p>
              {workshop.discountPercent ? (
                <p className="mt-1 text-sm font-semibold text-emerald-700">Rabais applique: {Number(workshop.discountPercent)} %</p>
              ) : null}
            </div>
          </div>

          {workshop.organizationName || workshop.contactPerson ? (
            <p className="mt-5 text-base text-[color:var(--site-text)]">
              {workshop.organizationName ? `${workshop.organizationName} - ` : ''}
              {workshop.contactPerson || ''}
            </p>
          ) : null}

          {workshop.clientNotes ? (
            <p className="mt-3 rounded-2xl bg-[color:var(--site-bg-soft)] p-4 text-base text-[color:var(--site-text)]">{workshop.clientNotes}</p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[color:var(--site-border)] bg-white p-4 shadow-sm">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[64px] w-full items-center justify-center rounded-2xl bg-[color:var(--site-accent-strong)] px-5 py-4 text-center text-xl font-bold text-white"
          >
            Choisir mon rendez-vous
          </a>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {companyPhone ? (
              <a href={`tel:${companyPhone}`} className="flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-[color:var(--site-accent)] bg-white px-5 py-3 text-lg font-semibold text-[color:var(--site-heading)]">
                Appeler Simon
              </a>
            ) : null}
            <a href={`mailto:${companyEmail}`} className="flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-[color:var(--site-accent)] bg-white px-5 py-3 text-lg font-semibold text-[color:var(--site-heading)]">
              Ecrire un courriel
            </a>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[color:var(--site-border)] bg-white shadow-sm">
          <iframe
            title="Calendrier de rendez-vous atelier"
            src={bookingUrl.includes('?') ? `${bookingUrl}&embed=true` : `${bookingUrl}?embed=true`}
            width="100%"
            height="860"
            frameBorder="0"
            className="w-full"
            style={{ minHeight: '760px' }}
            allow="camera; microphone; clipboard-write"
          />
        </section>

        <div className="pb-4 text-center text-sm text-[color:var(--site-muted)]">
          <Link href="/contact" className="font-semibold text-[color:var(--site-heading)] underline underline-offset-4">Besoin d'aide? Ecrivez a Simon</Link>
        </div>
      </div>
    </main>
  );
}
