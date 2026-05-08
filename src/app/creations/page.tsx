import React from 'react';
import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { buildMetadata } from '@/lib/seo';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';

export const metadata = buildMetadata({
  title: 'Créations de Création Nowis | Musique, vidéos IA et projets sur mesure',
  description: 'Explorez les créations de Création Nowis : musique, vidéos IA, services créatifs et projets sur mesure portés par Nowis Morin à Drummondville et au Québec.',
  path: '/creations',
  keywords: ['créations Création Nowis', 'vidéos IA Québec', 'musique Nowis Morin', 'projets créatifs Drummondville'],
});

export default function CreationsPage() {
  return (
    <div className="site-background">
      <section className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
        <h1 className="text-4xl font-bold text-[color:var(--site-heading)] md:text-6xl">Les créations de Nowis Morin et de Création Nowis</h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--site-text)]">Cette page rassemble les principaux univers publics du site : musique, vidéos IA, services créatifs et prise de contact. Elle aide à comprendre rapidement ce que Création Nowis peut produire, montrer ou construire sur demande.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Link href="/musique" className="glass-panel-soft rounded-2xl px-6 py-5 font-semibold text-[color:var(--site-heading)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg">Musique</Link>
          <Link href="/videos" className="glass-panel-soft rounded-2xl px-6 py-5 font-semibold text-[color:var(--site-heading)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg">Vidéos</Link>
          <Link href="/services" className="glass-panel-soft rounded-2xl px-6 py-5 font-semibold text-[color:var(--site-heading)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg">Services</Link>
          <ContactPrefillLink href="/contact" className="rounded-2xl bg-brand-warm px-6 py-5 font-semibold text-white shadow-sm transition hover:-translate-y-1 hover:brightness-110 hover:shadow-lg">Contact</ContactPrefillLink>
        </div>
        <div className="warm-cta-panel mx-auto mt-12 max-w-4xl rounded-3xl p-8 text-left shadow-sm md:p-10">
          <h2 className="text-3xl font-bold text-[color:var(--site-heading)]">Besoin d un point de départ clair ?</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
            Si tu hésites entre un atelier, une chanson personnalisée, une vidéo IA ou un projet plus hybride, le plus simple est de commencer par une prise de contact. La soumission se construit ensuite selon ton objectif réel.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href={SONG_REQUEST_GOOGLE_AUTH_URL} className="cta-secondary px-6 py-3.5">Demander une chanson</Link>
            <Link href="/ateliers" className="cta-secondary px-6 py-3.5">Demander un atelier</Link>
            <ContactPrefillLink href="/contact" className="cta-primary px-6 py-3.5">Me contacter</ContactPrefillLink>
          </div>
        </div>
      </section>
    </div>
  );
}

