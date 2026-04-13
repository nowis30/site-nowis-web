import { PageHero } from '@/components/marketing/PageHero';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
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
    <div className="site-background">
      <PageHero
        eyebrow="Services / Collaborations"
        title="Des créations personnalisées pour les artistes, les idées fortes et les projets qui veulent se démarquer"
        description="Cette page présente ce que Nowis Morin peut concevoir pour toi : chansons sur mesure, vidéos, visuels créatifs et concepts plus ambitieux mêlant art, émotion et intelligence artificielle."
        primaryCta={{ label: 'Parler de mon projet', href: '/contact?projectType=autre&message=Bonjour, je veux discuter d’un projet créatif avec Création Nowis.' }}
        secondaryCta={{ label: 'Écouter mes chansons', href: '/musique' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-2">
          {serviceOffers.map((offer) => (
            <article key={offer.title} className="glass-panel-soft rounded-3xl p-8 shadow-sm">
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

        <div className="warm-cta-panel mt-12 rounded-3xl p-10 shadow-sm">
          <h2 className="text-3xl font-bold text-[color:var(--site-heading)]">Une idée spéciale? Écris-moi.</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[color:var(--site-muted)]">
            Si ton projet ne rentre pas exactement dans une case, c’est souvent là que les meilleures collaborations commencent. Nowis Morin peut t’aider à concevoir une approche originale, sur mesure et alignée avec ton objectif de visibilité ou d’émotion.
          </p>
          <ContactPrefillLink href="/contact" className="mt-6 inline-flex rounded-xl bg-[linear-gradient(180deg,#d48b5d_0%,#bb6b43_100%)] px-5 py-3 font-semibold text-white transition hover:brightness-105">Parler de mon projet</ContactPrefillLink>
        </div>
      </section>
    </div>
  );
}
