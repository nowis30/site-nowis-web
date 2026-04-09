import Link from 'next/link';
import { PfeqSection } from '@/components/ateliers/PfeqSection';

export default function AteliersPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 text-slate-100">
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(8,12,24,0.92),rgba(24,20,42,0.86))] p-8 shadow-card md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Ateliers créatifs</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.96] text-white md:text-6xl">Des ateliers sensibles, vivants et structurés pour les écoles et organismes</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">Les ateliers Nowis invitent les enfants et les jeunes à créer, imaginer, écrire, chanter et prendre confiance. Le format s’adapte à votre réalité : classe, groupe parascolaire, camp, centre communautaire ou projet ponctuel.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/connexion?next=%2Fclient%2Fworkshops%2Fnouveau" className="rounded-xl bg-brand-warm px-6 py-3.5 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110">Se connecter pour demander un atelier</Link>
          <Link href="/inscription?next=%2Fclient%2Fworkshops%2Fnouveau" className="rounded-xl border border-white/10 bg-slate-950/50 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">Créer un compte client</Link>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <article className="brand-card p-7">
          <h2 className="font-display text-3xl text-white">Pour qui</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">Écoles primaires, garderies, camps, organismes communautaires, bibliothèques et groupes jeunesse.</p>
        </article>
        <article className="brand-card p-7">
          <h2 className="font-display text-3xl text-white">Ce qu’on y fait</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">Jeux d’écriture, création de chansons, rythme, imaginaire, expression orale, écoute, coopération et mini productions collectives.</p>
        </article>
        <article className="brand-card p-7">
          <h2 className="font-display text-3xl text-white">Objectifs</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">Stimuler la créativité, valoriser la parole des enfants, soutenir la confiance et offrir un moment artistique concret, chaleureux et structuré.</p>
        </article>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="brand-card p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-300">Organisation</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white">Un cadre simple pour réserver et suivre</h2>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-200">
            <li>Demande d’atelier en ligne avec besoins pédagogiques et logistiques.</li>
            <li>Suivi dans un portail sécurisé pour les échanges, documents et rendez-vous.</li>
            <li>Créneaux ateliers configurables le mardi et le jeudi.</li>
            <li>Coordination centralisée dans le CRM Nowis pour éviter les oublis et les doublons.</li>
          </ul>
        </div>
        <div className="rounded-[2rem] border border-amber-300/20 bg-amber-500/10 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">Prêt à réserver</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Présentez votre contexte et votre créneau souhaité</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">Vous pouvez demander un atelier, proposer un créneau du mardi ou du jeudi, ou simplement ouvrir la discussion.</p>
          <Link href="/ateliers/demande" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">Accéder à la procédure de demande</Link>
        </div>
      </section>

      <PfeqSection />

      <section className="mt-12">
        <div className="rounded-[2.5rem] border border-primary-400/20 bg-[linear-gradient(145deg,rgba(14,20,44,0.92),rgba(22,30,60,0.86))] p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Atelier de création musicale avec l'IA</p>
              <h2 className="mt-3 font-display text-3xl leading-[1.05] text-white md:text-4xl">
                Atelier de création musicale avec l'IA
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Atelier animé en personne par Nowis Morin. Tous âges. Le groupe crée ensemble une ou plusieurs chansons et repart avec une vidéo souvenir téléchargeable.
              </p>
            </div>
            <Link
              href="/ateliers/atelier-creatif"
              className="shrink-0 rounded-xl border border-primary-400/30 bg-primary-500/10 px-7 py-3.5 font-semibold text-white transition hover:bg-primary-500/20"
            >
              Découvrir cet atelier →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
