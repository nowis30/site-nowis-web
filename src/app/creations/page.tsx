import React from 'react';
import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Créations — Nowis Morin | Musique, vidéos et projets créatifs',
  description: 'Vue d’ensemble des créations de Nowis Morin : musique, vidéos, services et collaborations artistiques appuyées par l’intelligence artificielle.',
  path: '/creations',
});

export default function CreationsPage() {
  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
        <h1 className="text-4xl font-bold text-slate-950 md:text-6xl">Les créations de Nowis Morin</h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">Cette page oriente vers les univers principaux du site : musique, vidéos, collaborations et contact. Elle sert de point d’entrée simple pour les visiteurs qui découvrent l’écosystème créatif de Nowis Morin.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Link href="/musique" className="rounded-2xl bg-white px-6 py-5 font-semibold text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">Musique</Link>
          <Link href="/videos" className="rounded-2xl bg-white px-6 py-5 font-semibold text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">Vidéos</Link>
          <Link href="/services" className="rounded-2xl bg-white px-6 py-5 font-semibold text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">Services</Link>
          <ContactPrefillLink href="/contact" className="rounded-2xl bg-slate-950 px-6 py-5 font-semibold text-white shadow-sm transition hover:-translate-y-1 hover:bg-slate-800 hover:shadow-lg">Contact</ContactPrefillLink>
        </div>
      </section>
    </div>
  );
}

