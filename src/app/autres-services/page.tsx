import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';
import { formatPrice, getLaunchPrice, LAUNCH_DISCOUNT_PERCENT, REGULAR_PRICES } from '@/data/pricing';

const hourlyRegularPrice = REGULAR_PRICES.hourly;
const hourlyLaunchPrice = getLaunchPrice(hourlyRegularPrice);

export const metadata = buildMetadata({
  title: 'Autres services créatifs — Création Nowis | Vidéos IA, jeux et accompagnement artistique',
  description:
    'Découvrez les autres services créatifs de Création Nowis : vidéos IA, jeux interactifs, accompagnement d artistes et projets sur mesure à Drummondville et partout au Québec.',
  path: '/autres-services',
  keywords: ['autres services Création Nowis', 'vidéos IA Québec', 'accompagnement artistes Drummondville', 'jeux IA'],
});

const services = [
  {
    icon: '🎮',
    chip: 'Jeux et interactions',
    title: 'Jeux interactifs avec l\'IA',
    desc: 'Expériences ludiques et éducatives construites autour de l\'intelligence artificielle. Jeux de création, de découverte ou d\'exploration conçus pour impliquer, étonner et divertir.',
    items: [
      'Jeux de création musicale interactive',
      'Expériences éducatives autour de l\'IA',
      'Animations participatives pour événements',
    ],
  },
  {
    icon: '🎤',
    chip: 'Accompagnement artistique',
    title: 'Accompagnement d\'artistes',
    desc: 'Soutien créatif et technique pour les artistes qui veulent explorer l\'IA dans leur pratique. Direction artistique, exploration de nouvelles directions créatives et production assistée.',
    items: [
      'Exploration créative avec les outils IA',
      'Direction et cohérence artistique',
      'Co-création et développement de projets',
    ],
  },
  {
    icon: '🎬',
    chip: 'Vidéo et visuel',
    title: 'Vidéos créatives et contenus visuels',
    desc: 'Vidéos musicales, clips artistiques, contenus visuels adaptés à vos projets. Nowis Morin crée des visuels cohérents avec l\'univers sonore et émotionnel de votre projet.',
    items: [
      'Vidéos souvenir et clips musicaux',
      'Animations et visuels artistiques',
      'Contenu pour réseaux sociaux et événements',
    ],
  },
  {
    icon: '💡',
    chip: 'Projets particuliers',
    title: 'Projets créatifs sur mesure',
    desc: 'Vous avez un projet hors des sentiers battus ? Création Nowis peut l\'explorer avec vous. Concepts originaux, projets hybrides, commandes spéciales et collaborations créatives.',
    items: [
      'Concepts originaux et hybrides',
      'Collaborations avec organismes ou entreprises',
      'Commandes spéciales et projets ponctuels',
    ],
  },
];

export default function AutresServicesPage() {
  return (
    <main className="text-[color:var(--site-text)]">

      {/* ── HÉROS ── */}
      <section className="relative overflow-hidden px-6 py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 12% 10%, rgba(184,111,61,0.12), transparent 26%),' +
              'radial-gradient(circle at 85% 8%, rgba(203,165,120,0.16), transparent 22%)',
          }}
        />
        <div className="mx-auto max-w-5xl">
          <span className="brand-chip inline-block">Autres services</span>
          <h1 className="brand-metal-text mt-5 font-display text-5xl leading-[0.95] md:text-7xl">
            Des créations au-delà des ateliers
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
            En dehors des ateliers et des chansons personnalisées, Nowis Morin propose un univers plus large :
            jeux interactifs, accompagnement d&apos;artistes, vidéos créatives et projets sur mesure. Tout ce qui croise musique, IA et création humaine.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--site-soft)]">
            Tarif horaire regulier : {formatPrice(hourlyRegularPrice, ' / h')}. Avec rabais {LAUNCH_DISCOUNT_PERCENT} % : {formatPrice(hourlyLaunchPrice, ' / h')}. Tarification sur demande pour les projets speciaux, les mandats creatifs personnalises, les videos IA, les reels, les shorts et le contenu promotionnel.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="cta-primary w-full justify-center px-7 py-4 sm:w-auto"
            >
              Discuter d&apos;un projet
            </Link>
            <Link
              href="/ateliers"
              className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto"
            >
              Voir les ateliers
            </Link>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Les services secondaires</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Ce que Création Nowis peut aussi faire
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {services.map((svc) => (
              <article
                key={svc.title}
                className="brand-card p-7 transition"
              >
                <span className="text-3xl" role="img" aria-hidden="true">{svc.icon}</span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary-300">{svc.chip}</p>
                <h3 className="mt-3 font-display text-2xl text-[color:var(--site-heading)] md:text-3xl">{svc.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">{svc.desc}</p>
                <ul className="mt-4 space-y-2">
                  {svc.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[color:var(--site-muted)]">
                      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-[10px] font-bold text-primary-300">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFICATION ── */}
      <section className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="glass-panel-soft p-8 text-center md:p-10">
          <span className="text-3xl" role="img" aria-hidden="true">💬</span>
          <h2 className="mt-4 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Tarification claire selon le type de mandat</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
            Le tarif horaire regulier est de {formatPrice(hourlyRegularPrice, ' / h')} pour l accompagnement et les mandats qui suivent une logique horaire. Avec rabais {LAUNCH_DISCOUNT_PERCENT} % : {formatPrice(hourlyLaunchPrice, ' / h')}. Les projets speciaux et les productions plus complexes sont etablis sur soumission, selon les livrables et le contexte.
          </p>
          <Link
            href="/contact"
            className="cta-primary mt-6 w-full justify-center px-7 py-3.5 sm:w-auto"
          >
            Discuter de votre projet
          </Link>
        </div>
      </section>

      {/* ── OFFRE PRINCIPALE ── */}
      <section className="section-warm px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-panel-strong p-7">
              <span className="text-3xl" role="img" aria-hidden="true">🎵</span>
              <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)] md:text-3xl">Ateliers de création musicale</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
                Notre offre principale. Des ateliers animés en personne, pour tous les âges, avec une chanson et une vidéo souvenir téléchargeable à la clé.
              </p>
              <Link
                href="/ateliers"
                className="cta-secondary mt-5 px-6 py-3 text-sm"
              >
                Voir les ateliers →
              </Link>
            </div>
            <div className="warm-spotlight-panel p-7">
              <span className="text-3xl" role="img" aria-hidden="true">🎼</span>
              <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)] md:text-3xl">Chansons personnalisées</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
                Des chansons créées sur mesure pour les occasions qui comptent — anniversaires, mariages, hommages et projets personnels.
              </p>
              <Link
                href={SONG_REQUEST_GOOGLE_AUTH_URL}
                className="cta-secondary mt-5 px-6 py-3 text-sm"
              >
                Commander une chanson →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-16 md:py-24">
        <div className="warm-cta-panel mx-auto max-w-4xl p-10 text-center md:p-16">
          <h2 className="font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Vous avez un projet en tête&nbsp;?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-[color:var(--site-muted)]">
            Peu importe la forme, si ça croise musique, création et intelligence artificielle — on peut en parler. Nowis Morin aime les projets qui sortent des sentiers battus.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="cta-primary w-full justify-center px-9 py-4 sm:w-auto"
            >
              Parler de mon projet
            </Link>
            <Link
              href="/a-propos"
              className="cta-secondary w-full justify-center px-9 py-4 sm:w-auto"
            >
              En savoir plus sur Nowis
            </Link>
            <Link
              href="/videos"
              className="cta-secondary w-full justify-center px-9 py-4 sm:w-auto"
            >
              Voir les vidéos IA
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
