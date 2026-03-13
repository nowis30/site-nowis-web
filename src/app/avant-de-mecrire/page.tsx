import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Avant de m’écrire — Nowis Morin',
  description:
    'Prépare mieux ta demande avant de contacter Nowis Morin: ce que je peux créer, ce que je ne fais pas, et comment formuler une demande claire.',
  path: '/avant-de-mecrire',
  keywords: ['avant de mecrire', 'préparer sa demande créative', 'Nowis Morin contact', 'demande claire projet créatif'],
});

const canCreate = [
  'Chansons personnalisées à partir d’une histoire ou d’une émotion.',
  'Vidéos créatives, teasers, pubs courtes et formats réseaux sociaux.',
  'Visuels promotionnels, concepts créatifs et identités cohérentes.',
  'Pages web, idées interactives, concepts de jeux et vitrines de projet.',
];

const cannotCreate = [
  'Un projet flou sans intention, contexte ni objectif minimal.',
  'Des demandes contraires à l’image ou aux valeurs de la marque.',
  'Un résultat sérieux en quelques minutes sans matière de départ.',
  'Des projets qui demandent une expertise technique hors du cadre présenté sur le site.',
];

const shouldPrepare = [
  'Ton objectif principal: émouvoir, vendre, divertir ou présenter.',
  'Le public visé: personne, famille, entreprise ou projet spécial.',
  'Le ton ou l’ambiance recherchée.',
  'Les détails essentiels à inclure et ce qu’il faut éviter.',
  'Ton délai idéal, même approximatif.',
];

const exampleRequests = [
  'Je veux une chanson pour l’anniversaire de ma conjointe. Je veux quelque chose de doux, vrai et personnel avec nos souvenirs de voyage.',
  'Je veux une vidéo courte pour présenter mon entreprise sur Facebook et Instagram. L’objectif est de donner confiance rapidement.',
  'Je veux un visuel fort pour annoncer un nouveau projet. J’ai besoin d’un style moderne, humain et marquant.',
  'Je veux une page ou un concept interactif pour expliquer un projet plus clairement à mes visiteurs.',
];

export default function AvantDeMecrirePage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <PageHero
        eyebrow="Préparer sa demande"
        title="Avant de m’écrire"
        description="Quelques repères simples pour mieux préparer ta demande et gagner du temps dès le premier message."
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-950">Ce que je peux créer</h2>
            <ul className="mt-6 space-y-4 text-slate-700">
              {canCreate.map((item) => (
                <li key={item} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-950">Ce que je ne fais pas</h2>
            <ul className="mt-6 space-y-4 text-slate-700">
              {cannotCreate.map((item) => (
                <li key={item} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
          <article className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <h2 className="text-3xl font-bold">Ce que tu devrais préparer avant de me contacter</h2>
            <ul className="mt-6 space-y-4 text-slate-200">
              {shouldPrepare.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">{item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-950">Exemples de demandes claires</h2>
            <div className="mt-6 space-y-4">
              {exampleRequests.map((item, index) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Exemple {index + 1}</p>
                  <p className="mt-3 leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#065f46_100%)] px-8 py-10 text-white shadow-sm md:px-12 md:py-14">
          <h2 className="text-3xl font-bold md:text-4xl">Tu es prêt à m’expliquer ton projet?</h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-200">
            Avec quelques informations bien préparées, je peux te répondre plus clairement et t’orienter vers la bonne création plus vite.
          </p>
          <Link
            href="/contact?message=Je%20veux%20te%20parler%20de%20mon%20projet.%20Voici%20les%20details%20que%20j%27ai%20prepares."
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Me parler de mon projet
          </Link>
        </div>
      </section>
    </div>
  );
}
