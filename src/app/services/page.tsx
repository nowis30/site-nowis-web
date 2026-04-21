import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { serviceOffers } from '@/data/serviceOffers';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Services créatifs — Création Nowis | Chansons personnalisées, vidéos IA et concepts sur mesure',
  description:
    'Découvrez les services créatifs de Création Nowis : chansons personnalisées, vidéos IA, visuels et concepts sur mesure à Drummondville et partout au Québec.',
  path: '/services',
  keywords: ['services Création Nowis', 'chanson personnalisée Québec', 'vidéo IA Drummondville', 'concept créatif avec IA'],
});

export default function ServicesPage() {
  return (
    <div className="site-background">
      <PageHero
        eyebrow="Services / Collaborations"
        title="Des services créatifs clairs pour transformer une idée en projet concret"
        description="Creation Nowis accompagne les projets qui ont besoin d une chanson personnalisee, d une video IA, d un visuel ou d une direction creative claire. Le tarif de base est de 120 $ / heure, et les projets speciaux sont etablis sur soumission."
        primaryCta={{ label: 'Parler de mon projet', href: '/contact?projectType=autre&message=Bonjour, je veux discuter d’un projet créatif avec Création Nowis.' }}
        secondaryCta={{ label: 'Écouter mes chansons', href: '/musique' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="glass-panel-soft mb-8 rounded-3xl p-6 shadow-sm">
          <p className="text-sm leading-7 text-[color:var(--site-muted)]">
            Tarif de base universel : 120 $ / heure. Chanson IA souvenir : 25 $. Video IA avec chanson : 100 $. Tarification sur demande pour les projets speciaux, les mandats creatifs personnalises, les videos IA, les reels, les shorts et le contenu promotionnel.
          </p>
        </div>
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
              {offer.href.startsWith('/contact') ? (
                <ContactPrefillLink href={offer.href} className="cta-secondary mt-6 inline-flex px-5 py-3 text-sm">
                  {offer.cta}
                </ContactPrefillLink>
              ) : (
                <Link href={offer.href} className="cta-secondary mt-6 inline-flex px-5 py-3 text-sm">
                  {offer.cta}
                </Link>
              )}
            </article>
          ))}
        </div>

        <div className="warm-cta-panel mt-12 rounded-3xl p-10 shadow-sm">
          <h2 className="text-3xl font-bold text-[color:var(--site-heading)]">Une idée spéciale? Écris-moi.</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[color:var(--site-muted)]">
            Si ton projet ne rentre pas exactement dans une case, c’est souvent là que les meilleures collaborations commencent. Nowis Morin peut t’aider à concevoir une approche originale, sur mesure et alignée avec ton objectif de visibilité ou d’émotion.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <ContactPrefillLink href="/contact" className="inline-flex rounded-xl bg-[linear-gradient(180deg,#d48b5d_0%,#bb6b43_100%)] px-5 py-3 font-semibold text-white transition hover:brightness-105">Parler de mon projet</ContactPrefillLink>
            <Link href="/creations" className="cta-secondary px-5 py-3">Voir mes créations</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
