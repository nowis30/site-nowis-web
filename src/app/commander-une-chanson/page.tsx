import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Commander une chanson personnalisée — Nowis Morin',
  description:
    'Découvre comment commander une chanson personnalisée avec Nowis Morin pour un cadeau, un hommage, une surprise ou un projet unique.',
  path: '/commander-une-chanson',
  keywords: ['commander une chanson', 'chanson personnalisée Québec', 'cadeau chanson personnalisé', 'Nowis Morin chanson'],
});

const audiences = [
  'Couple',
  'Famille',
  'Anniversaire',
  'Hommage',
  'Entreprise / projet spécial',
];

const inputs = [
  'Prénom ou noms à inclure dans la chanson.',
  'Histoire, contexte ou moment que tu veux raconter.',
  'Émotion recherchée: douce, drôle, puissante, touchante ou festive.',
  'Style musical souhaité ou ambiance à viser.',
  'Détails importants à nommer clairement dans le texte.',
];

const outcomes = [
  'Une chanson personnalisée qui part de ton histoire.',
  'Un refrain accrocheur qui reste en tête.',
  'Une ambiance touchante, lumineuse ou énergique selon ton besoin.',
  'Un texte inspiré de votre histoire, de vos souvenirs ou de votre message.',
];

const contactHref = '/contact?projectType=chanson&message=Je%20souhaite%20commander%20une%20chanson%20personnalisee.%20Voici%20mon%20histoire%20et%20le%20contexte%20de%20ma%20demande.';

export default function CommanderUneChansonPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <PageHero
        eyebrow="Chanson personnalisée"
        title="Je crée une chanson à partir de ton histoire"
        description="Pour un cadeau, un hommage, une surprise, un souvenir ou un projet unique."
        primaryCta={{ label: 'Commander via le formulaire', href: contactHref }}
        secondaryCta={{ label: 'Voir mes chansons', href: '/musique' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Pour qui</p>
          <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">Des chansons qui servent une émotion réelle.</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Que ce soit pour faire pleurer, faire sourire ou laisser un souvenir durable, la chanson devient un vrai cadeau utile et mémorable.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          {audiences.map((item) => (
            <article key={item} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-lg font-semibold text-slate-950">{item}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Une demande claire, humaine et personnelle pour transformer une idée en chanson marquante.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Ce que tu m’envoies</p>
            <ul className="mt-6 space-y-4">
              {inputs.map((item) => (
                <li key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Ce que je peux créer</p>
            <div className="mt-6 space-y-4">
              {outcomes.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="font-semibold text-slate-950">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    L’objectif est de livrer une chanson cohérente, touchante et alignée avec ton intention.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#065f46_100%)] px-8 py-10 text-white shadow-sm md:px-12 md:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Prêt à passer à l’action</p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Tu veux une chanson qui parte vraiment de ton histoire?</h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-200">
            Envoie-moi les bons détails dès maintenant et je pourrai te répondre plus vite avec une direction claire pour ta chanson personnalisée.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={contactHref}
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Me parler d’une chanson personnalisée
            </Link>
            <Link
              href="/avant-de-mecrire"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Bien préparer ma demande
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
