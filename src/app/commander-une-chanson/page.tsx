import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
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
  {
    title: 'Couple',
    description: 'Pour raconter une rencontre, une promesse, un mariage ou une histoire d’amour avec une vraie couleur émotionnelle.',
  },
  {
    title: 'Famille',
    description: 'Pour transformer un souvenir de famille, une naissance ou un lien précieux en chanson durable et partageable.',
  },
  {
    title: 'Anniversaire',
    description: 'Pour offrir un cadeau plus personnel qu’un simple message, avec des détails réels et une ambiance adaptée.',
  },
  {
    title: 'Hommage',
    description: 'Pour souligner un parcours, remercier une personne importante ou garder une mémoire vivante avec justesse.',
  },
  {
    title: 'Projet spécial',
    description: 'Pour un lancement, une surprise, un projet personnel ou une idée qui mérite une forme originale et sensible.',
  },
];

const inputs = [
  'Prénom ou noms à inclure dans la chanson.',
  'Histoire, contexte ou moment que tu veux raconter.',
  'Émotion recherchée: douce, drôle, puissante, touchante ou festive.',
  'Style musical souhaité ou ambiance à viser.',
  'Détails importants à nommer clairement dans le texte.',
];

const outcomes = [
  {
    title: 'Une chanson construite à partir de ton histoire',
    description: 'Le point de départ reste toujours ton vécu, ton message ou le moment que tu veux faire ressentir.',
  },
  {
    title: 'Un refrain qui porte vraiment l’idée',
    description: 'L’objectif n’est pas juste d’écrire un texte, mais de créer une chanson mémorable et cohérente.',
  },
  {
    title: 'Une ambiance juste pour l’émotion recherchée',
    description: 'Douce, lumineuse, profonde, festive ou plus intense : la direction dépend de ce que tu veux transmettre.',
  },
  {
    title: 'Une base claire pour aller plus loin',
    description: 'Selon le projet, la chanson peut aussi être accompagnée d’un visuel, d’une vidéo simple ou d’une mise en valeur plus complète.',
  },
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
            Ici, le but n’est pas de produire un texte générique. Le but est de transformer une histoire, une relation ou un événement en chanson claire, sensible et réellement personnelle.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          {audiences.map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-lg font-semibold text-slate-950">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
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
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
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
            <ContactPrefillLink
              href={contactHref}
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Commander une chanson personnalisée
            </ContactPrefillLink>
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
