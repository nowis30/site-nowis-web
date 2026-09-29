'use client';
import Link from 'next/link';
import { ArrowRight, FolderOpen, Gamepad2, House, Music2, UsersRound } from 'lucide-react';
import { HeroVideoPlaceholder } from '@/components/marketing/HeroVideoPlaceholder';
import { HomeMusicSelections } from '@/components/marketing/HomeMusicSelections';
import { formatPrice, REGULAR_PRICES } from '@/data/pricing';
import { rentalsPublicUrl } from '@/lib/rentals-url';
import { trackRentalSiteClick } from '@/lib/tracking/google';

const HOME_INTRO_VIDEO_URL = '/videos/nowis-presentation-web.mp4';
const secondaryLinks = [
  { title: 'Bibliothèque musicale', description: 'Écoutez les chansons et découvrez l’univers musical de Nowis.', href: '/musique', icon: Music2 },
  { title: 'Jeux NOWIS', description: 'Découvrez les mini-jeux et les expériences interactives.', href: '/jeux', icon: Gamepad2 },
  { title: 'Portail client', description: 'Vous avez déjà un compte? Retrouvez votre espace de suivi.', href: '/connexion', icon: FolderOpen },
];
export function HomeScreen() {
  function trackRentalClick(location: 'home_feature' | 'home_card') {
    try { trackRentalSiteClick(location, rentalsPublicUrl); } catch { /* Navigation always remains available. */ }
  }
  return (
    <div className="nowis-home mx-auto max-w-6xl px-4 pb-14 pt-6 text-[color:var(--site-text)] sm:px-6">
      <section className="nowis-home-hero rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-panel)] p-5 sm:p-8 min-[1200px]:p-10" aria-labelledby="home-title">
        <div className="nowis-home-copy min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--site-accent-strong)]">Création Nowis · De la guitare à l’IA</p>
          <h1 id="home-title" className="mt-4 text-[2.35rem] font-bold leading-[1.08] tracking-tight text-[color:var(--site-heading)] md:text-5xl min-[1200px]:text-6xl">Votre histoire en chanson. Votre groupe en création.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--site-muted)] md:text-lg">Une chanson personnalisée pour un moment important, ou un atelier musical avec l’IA pour créer ensemble. Avec l’accompagnement humain de Nowis Morin.</p>
          <div className="nowis-home-actions mt-6 grid gap-3">
            <Link href="/commander-une-chanson" className="cta-primary inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-center font-semibold">Commander une chanson<ArrowRight size={17} aria-hidden="true" /></Link>
            <Link href="/ateliers/demande" className="cta-secondary inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-center font-semibold">Organiser un atelier<ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted)]">Première demande sans compte et sans paiement.</p>
        </div>
        <div className="nowis-home-video min-w-0">
          <HeroVideoPlaceholder videoUrl={HOME_INTRO_VIDEO_URL} />
          <Link href="/musique" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Écouter des réalisations de Nowis</Link>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="offers-title">
        <h2 id="offers-title" className="text-3xl font-bold">Deux façons de créer avec Nowis</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <article className="brand-card min-w-0 p-6 sm:p-8">
            <Music2 aria-hidden="true" className="text-[color:var(--site-accent-strong)]" />
            <h3 className="mt-4 text-2xl font-bold">Une chanson personnalisée</h3>
            <p className="mt-3 leading-7 text-[color:var(--site-muted)]">Pour un mariage, un anniversaire, un hommage ou simplement pour offrir un souvenir. Racontez votre idée avant de choisir votre accompagnement.</p>
            <p className="mt-4 font-semibold">Chanson souvenir simple : {formatPrice(REGULAR_PRICES.songs.memorySong)}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Autres accompagnements sur soumission. Format, révisions et délai à confirmer avant la commande.</p>
            <Link href="/commander-une-chanson#demande" className="cta-primary mt-5 inline-flex min-h-11 items-center justify-center px-5 py-3">Décrire mon idée sans compte</Link>
          </article>
          <article className="brand-card min-w-0 p-6 sm:p-8">
            <UsersRound aria-hidden="true" className="text-[color:var(--site-accent-strong)]" />
            <h3 className="mt-4 text-2xl font-bold">Un atelier pour votre groupe</h3>
            <p className="mt-3 leading-7 text-[color:var(--site-muted)]">Écoles, résidences, organismes et groupes privés : partagez vos idées, écrivez et découvrez la création musicale avec l’IA.</p>
            <p className="mt-4 font-semibold">1 h 30 : {formatPrice(REGULAR_PRICES.workshops.minutes90)} · 2 h : {formatPrice(REGULAR_PRICES.workshops.hours2)}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Participants inclus et formule adaptée à confirmer. Les options par personne sont distinctes.</p>
            <Link href="/ateliers/demande" className="cta-secondary mt-5 inline-flex min-h-11 items-center justify-center px-5 py-3">Parler de mon groupe sans compte</Link>
          </article>
        </div>
        <p className="mt-3 text-sm text-[color:var(--site-muted)]">Taxes en sus si applicables. <Link href="/tarifs" className="underline">Voir la grille tarifaire</Link>.</p>
      </section>

      <section className="mt-10 brand-card p-6 sm:p-8" aria-labelledby="home-process-title">
        <h2 id="home-process-title" className="text-2xl font-bold">D’abord un échange. Ensuite, votre projet.</h2>
        <ol className="mt-5 grid gap-5 min-[1200px]:grid-cols-3">
          <li><h3 className="font-bold">1. Vous expliquez votre idée</h3><p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Nom, courriel, type de projet et quelques phrases. Aucun compte requis.</p></li>
          <li><h3 className="font-bold">2. Nous précisons les détails</h3><p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Le contenu, le prix et les conditions du projet sont confirmés avant de commencer.</p></li>
          <li><h3 className="font-bold">3. Le portail sert au suivi</h3><p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Après le premier échange, l’espace client peut regrouper les documents et les prochaines étapes.</p></li>
        </ol>
      </section>

      <HomeMusicSelections />

      <section className="mt-10" aria-labelledby="home-explore-title">
        <h2 id="home-explore-title" className="text-2xl font-bold">Explorez aussi l’univers de Nowis</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 min-[1200px]:grid-cols-4">
          {secondaryLinks.map(({ title, description, href, icon: Icon }) => (
            <Link key={href} href={href} className="brand-card min-w-0 p-5"><Icon size={22} aria-hidden="true" /><h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">{description}</p></Link>
          ))}
          <a href={rentalsPublicUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackRentalClick('home_card')} className="brand-card min-w-0 p-5" aria-label="Ouvrir les logements à louer dans un nouvel onglet"><House size={22} aria-hidden="true" /><h3 className="mt-3 font-bold">Logements à louer</h3><p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Consultez les logements et les demandes de visite.</p></a>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/a-propos" className="inline-flex min-h-11 items-center underline">À propos</Link><Link href="/services" className="inline-flex min-h-11 items-center underline">Services</Link><Link href="/creations" className="inline-flex min-h-11 items-center underline">Créations</Link><Link href="/videos" className="inline-flex min-h-11 items-center underline">Vidéos</Link><Link href="/contact" className="inline-flex min-h-11 items-center underline">Contact</Link>
          <a href={rentalsPublicUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackRentalClick('home_feature')} className="inline-flex min-h-11 items-center underline">Voir les logements disponibles</a>
        </div>
      </section>
    </div>
  );
}
