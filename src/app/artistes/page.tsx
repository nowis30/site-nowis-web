import Link from 'next/link';
import { ArtistCard } from '@/components/artists/ArtistCard';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { PageHero } from '@/components/marketing/PageHero';
import { getAllArtists } from '@/data/artists';
import { buildMetadata } from '@/lib/seo';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';

export const metadata = buildMetadata({
  title: 'Artistes | Création Nowis',
  description:
    'Découvre les artistes de Création Nowis : Nowis Morin comme artiste principal, Yemme & SX comme duo associé, et une approche créative où l’IA sert l’émotion, la musique, l’image et les chansons personnalisées.',
  path: '/artistes',
  keywords: ['Artistes Création Nowis', 'Nowis Morin', 'Yemme & SX', 'chanson personnalisée Québec', 'artiste IA Québec'],
});

const creativePillars = [
  {
    title: 'Une même bannière, plusieurs univers',
    description:
      'Création Nowis rassemble des sensibilités complémentaires sous une direction claire : des chansons ancrées dans le vécu, des projets visuels cohérents et une approche artistique pensée pour durer.',
  },
  {
    title: 'L’IA comme atelier discret',
    description:
      'Ici, l’IA n’est pas mise en avant comme un gadget. Elle sert à structurer une idée, soutenir une ambiance, développer une image et aider une émotion à prendre une forme plus forte.',
  },
  {
    title: 'Des créations pour les gens',
    description:
      'Création Nowis peut aussi concevoir des chansons personnalisées pour des mariages, des naissances, des hommages, des deuils, des histoires d’amour et des souvenirs de famille.',
  },
];

const customProjectExamples = ['Mariage', 'Naissance', 'Hommage', 'Décès', 'Histoire d’amour', 'Souvenir de famille', 'Projet personnel'];

export default function ArtistesPage() {
  const artists = getAllArtists();

  return (
    <div className="site-background">
      <PageHero
        eyebrow="Artistes"
        title="Des artistes réunis sous une même bannière créative, humaine et moderne"
        description="Le volet Artistes de Création Nowis met en avant Nowis Morin comme artiste principal, présente Yemme & SX comme artistes associés et montre comment la musique, les visuels, les vidéos et l’IA peuvent travailler ensemble au service de l’émotion."
        primaryCta={{ label: 'Parler de mon projet', href: '/contact?projectType=chanson&message=Bonjour, je veux discuter d’un projet musical ou d’une chanson personnalisée.' }}
        secondaryCta={{ label: 'Découvrir la musique', href: '/musique' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Création Nowis, une bannière pour rassembler plusieurs couleurs artistiques</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Cette section a été pensée pour rendre le projet plus lisible : un artiste principal, des artistes associés, une identité plus claire et une place assumée pour les créations personnalisées. Le tout reste centré sur l’humain, la mémoire, le vécu et la qualité émotionnelle du résultat.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {creativePillars.map((pillar) => (
            <article key={pillar.title} className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-950">{pillar.title}</h3>
              <p className="mt-4 leading-relaxed text-slate-600">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:pb-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Les artistes mis en avant</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Deux pages dédiées permettent maintenant de mieux comprendre les rôles, les approches et les univers qui composent Création Nowis.
            </p>
          </div>
          <ContactPrefillLink href="/contact?projectType=chanson&message=Bonjour, je veux discuter d’un projet avec Création Nowis." className="inline-flex rounded-xl bg-brand-warm px-5 py-3 font-semibold text-white transition hover:brightness-110">
            Contacter Création Nowis
          </ContactPrefillLink>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {artists.map((artist) => (
            <ArtistCard key={artist.slug} artist={artist} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="warm-cta-panel rounded-[2rem] p-8 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Chansons personnalisées</p>
            <h2 className="mt-4 text-3xl font-bold text-[color:var(--site-heading)]">Une création pensée pour un moment important</h2>
            <p className="mt-5 text-lg leading-relaxed text-[color:var(--site-text)]">
              Création Nowis peut aussi accompagner des clients qui veulent une chanson personnalisée à partir d’une histoire réelle, d’un souvenir ou d’un événement marquant. L’approche reste sobre, crédible et émotionnelle, avec la possibilité d’ajouter ensuite un visuel, une vidéo ou une petite vitrine de présentation.
            </p>
            <p className="mt-6 rounded-2xl border border-[color:var(--site-accent)]/15 bg-white/70 px-5 py-4 text-sm leading-relaxed text-[color:var(--site-text)]">
              Chaque demande est évaluée selon le projet. L’idée est de garder une approche claire, humaine et facile à discuter avant de lancer la création.
            </p>
          </article>

          <article className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
            <h3 className="text-2xl font-bold text-slate-950">Exemples de demandes</h3>
            <div className="mt-6 flex flex-wrap gap-3">
              {customProjectExamples.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href={SONG_REQUEST_GOOGLE_AUTH_URL} className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-5 py-3 font-semibold text-white transition hover:brightness-110">
                Demander une chanson personnalisée
              </Link>
              <ContactPrefillLink href="/contact?projectType=autre&message=Bonjour, je veux parler d’un projet créatif avec Création Nowis." className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-50">
                Parler de mon projet
              </ContactPrefillLink>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
