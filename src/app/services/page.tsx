import { PageHero } from '@/components/marketing/PageHero';
import { serviceOffers } from '@/data/serviceOffers';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Services et collaborations — Nowis Morin | Chansons, vidéos, visuels et concepts IA',
  description:
    'Découvre les services proposés par Nowis Morin : chansons personnalisées, vidéos créatives, visuels, concepts marketing avec IA et collaborations spéciales.',
  path: '/services',
  keywords: ['Nowis Morin services', 'chanson personnalisée', 'vidéo IA Québec', 'collaboration créative'],
});

export default function ServicesPage() {
  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Services / Collaborations"
        title="Des créations personnalisées pour les artistes, les idées fortes et les projets qui veulent se démarquer"
        description="Cette page présente ce que Nowis Morin peut concevoir pour toi : chansons sur mesure, vidéos, visuels créatifs et concepts plus ambitieux mêlant art, émotion et intelligence artificielle."
        primaryCta={{ label: 'Me contacter', href: '/contact' }}
        secondaryCta={{ label: 'Écouter mes chansons', href: '/musique' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-2">
          {serviceOffers.map((offer) => (
            <article key={offer.title} className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">{offer.title}</h2>
              <p className="mt-2 font-medium text-emerald-600">{offer.subtitle}</p>
              <p className="mt-4 leading-relaxed text-slate-600">{offer.description}</p>
              <ul className="mt-6 space-y-2 text-slate-700">
                {offer.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-slate-950 p-10 text-white shadow-sm">
          <h2 className="text-3xl font-bold">Une idée spéciale? Écris-moi.</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-300">
            Si ton projet ne rentre pas exactement dans une case, c’est souvent là que les meilleures collaborations commencent. Nowis Morin peut t’aider à concevoir une approche originale, sur mesure et alignée avec ton objectif de visibilité ou d’émotion.
          </p>
          <a href="/contact" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">Parler de mon projet</a>
        </div>
      </section>
    </div>
  );
}
