import Link from 'next/link';
import {
  formatPrice,
  getLaunchPrice,
  LAUNCH_DISCOUNT_PERCENT,
  LAUNCH_END_LABEL,
  REGULAR_PRICES,
} from '@/data/pricing';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Tarifs Création Nowis | Prix réguliers et offre de lancement',
  description:
    'Tarifs officiels de Création Nowis avec prix réguliers et prix de lancement à 50 % de rabais jusqu au 1er juillet 2026.',
  path: '/tarifs',
  keywords: ['tarifs création nowis', 'prix ateliers IA', 'prix chansons personnalisées', 'offre de lancement nowis'],
});

type PricingCard = {
  name: string;
  regular: string;
  launch: string;
  details?: string;
  showDiscountBadge?: boolean;
};

const workshopCards: PricingCard[] = [
  {
    name: 'Atelier 60 minutes',
    regular: formatPrice(REGULAR_PRICES.workshops.minutes60),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.workshops.minutes60)),
  },
  {
    name: 'Atelier 90 minutes',
    regular: formatPrice(REGULAR_PRICES.workshops.minutes90),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.workshops.minutes90)),
  },
  {
    name: 'Atelier 2 heures',
    regular: formatPrice(REGULAR_PRICES.workshops.hours2),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.workshops.hours2)),
  },
  {
    name: 'Atelier 3 heures',
    regular: formatPrice(REGULAR_PRICES.workshops.hours3),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.workshops.hours3)),
  },
];

const songAndVideoCards: PricingCard[] = [
  {
    name: 'Chanson IA souvenir',
    regular: formatPrice(REGULAR_PRICES.songs.memorySong),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.songs.memorySong)),
  },
  {
    name: 'Vidéo IA avec chanson',
    regular: formatPrice(REGULAR_PRICES.songs.videoWithSong),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.songs.videoWithSong)),
  },
  {
    name: 'Projet spécial',
    regular: 'Sur soumission',
    launch: 'Sur soumission',
    details: 'Prix établi selon les besoins du mandat. Aucun prix automatique appliqué.',
    showDiscountBadge: false,
  },
];

const hourlyCard: PricingCard = {
  name: 'Accompagnement horaire',
  regular: `${formatPrice(REGULAR_PRICES.hourly)} / heure`,
  launch: `${formatPrice(getLaunchPrice(REGULAR_PRICES.hourly))} / heure`,
};

const groupCard: PricingCard = {
  name: 'Formule groupe',
  regular: `À partir de ${formatPrice(REGULAR_PRICES.groupFromPerPerson)} / personne`,
  launch: `À partir de ${formatPrice(getLaunchPrice(REGULAR_PRICES.groupFromPerPerson))} / personne`,
  details: 'Selon le projet, le nombre de participants et le contexte.',
};

const summaryRows = [
  {
    service: 'Atelier 60 minutes',
    regular: formatPrice(REGULAR_PRICES.workshops.minutes60),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.workshops.minutes60)),
  },
  {
    service: 'Atelier 90 minutes',
    regular: formatPrice(REGULAR_PRICES.workshops.minutes90),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.workshops.minutes90)),
  },
  {
    service: 'Atelier 2 heures',
    regular: formatPrice(REGULAR_PRICES.workshops.hours2),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.workshops.hours2)),
  },
  {
    service: 'Atelier 3 heures',
    regular: formatPrice(REGULAR_PRICES.workshops.hours3),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.workshops.hours3)),
  },
  {
    service: 'Tarif horaire',
    regular: `${formatPrice(REGULAR_PRICES.hourly)} / h`,
    launch: `${formatPrice(getLaunchPrice(REGULAR_PRICES.hourly))} / h`,
  },
  {
    service: 'Chanson IA souvenir',
    regular: formatPrice(REGULAR_PRICES.songs.memorySong),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.songs.memorySong)),
  },
  {
    service: 'Vidéo IA avec chanson',
    regular: formatPrice(REGULAR_PRICES.songs.videoWithSong),
    launch: formatPrice(getLaunchPrice(REGULAR_PRICES.songs.videoWithSong)),
  },
  {
    service: 'Projet spécial',
    regular: 'Sur soumission',
    launch: 'Sur soumission',
  },
];

function PricingDisplayCard({ card }: { card: PricingCard }) {
  const showDiscountBadge = card.showDiscountBadge !== false;

  return (
    <article className="brand-card flex flex-col rounded-[1.5rem] p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{card.name}</h3>
        {showDiscountBadge && (
          <span className="shrink-0 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {LAUNCH_DISCOUNT_PERCENT} % de rabais
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-[color:var(--site-soft)]">
        Prix régulier : <span className="text-[color:var(--site-muted)] line-through">{card.regular}</span>
      </p>
      <p className="mt-1 text-3xl font-bold text-[color:var(--site-heading)]">Prix lancement : {card.launch}</p>

      <p className="mt-2 text-xs text-[color:var(--site-soft)]">
        Offre de lancement valide jusqu'au {LAUNCH_END_LABEL}.
      </p>
      <p className="mt-1 text-xs text-[color:var(--site-soft)]">Taxes en sus si applicables.</p>

      {card.details && <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted)]">{card.details}</p>}
    </article>
  );
}

export default function TarifsPage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <section className="relative overflow-hidden px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="brand-metal-text font-display text-5xl leading-[0.95] md:text-7xl">Tarifs Création Nowis</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
            Prix réguliers et offre de lancement à 50 % jusqu'au 1er juillet 2026.
          </p>
          <div className="mt-6 rounded-[1.2rem] border border-[rgba(184,111,61,0.18)] bg-[linear-gradient(140deg,rgba(255,252,247,0.94),rgba(247,235,221,0.95))] px-5 py-4">
            <p className="text-sm font-semibold text-[color:var(--site-heading)]">
              Les prix de lancement sont déjà calculés. Aucun casse-tête.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/contact" className="cta-primary w-full justify-center px-7 py-4 sm:w-auto">
              Me contacter
            </Link>
            <Link href="/ateliers/demande" className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto">
              Demander un atelier
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:py-10">
        <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Ateliers</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workshopCards.map((card) => (
            <PricingDisplayCard key={card.name} card={card} />
          ))}
        </div>
      </section>

      <section className="section-soft px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Chansons et vidéos</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {songAndVideoCards.map((card) => (
              <PricingDisplayCard key={card.name} card={card} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Accompagnement horaire</h2>
        <div className="mt-7 grid gap-4 md:max-w-xl">
          <PricingDisplayCard card={hourlyCard} />
        </div>
      </section>

      <section className="section-soft px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Formule groupe</h2>
          <div className="mt-7 grid gap-4 md:max-w-2xl">
            <PricingDisplayCard card={groupCard} />
          </div>
          <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
            Si le contexte du groupe demande une structure différente, le rabais de lancement reste applicable sur soumission.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Déplacement</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div className="glass-panel-soft rounded-[1.4rem] p-6">
            <p className="font-semibold text-[color:var(--site-heading)]">Jusqu'à 100 km aller-retour</p>
            <p className="mt-2 text-sm text-[color:var(--site-muted)]">À partir de Drummondville, inclus dans le tarif.</p>
          </div>
          <div className="warm-spotlight-panel rounded-[1.4rem] p-6">
            <p className="font-semibold text-[color:var(--site-heading)]">Au-delà de 100 km aller-retour</p>
            <p className="mt-2 text-sm text-[color:var(--site-muted)]">Frais supplémentaires selon la distance, confirmés sur soumission.</p>
          </div>
        </div>
      </section>

      <section className="section-warm px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Notes importantes</h2>
          <div className="mt-7 rounded-[1.4rem] border border-[rgba(131,97,67,0.14)] bg-white/75 p-6">
            <ul className="space-y-3 text-sm leading-7 text-[color:var(--site-muted)]">
              <li>Offre de lancement valide jusqu'au {LAUNCH_END_LABEL}.</li>
              <li>Les prix affichés sont les prix officiels de référence.</li>
              <li>Taxes en sus si applicables.</li>
              <li>Projet spécial : tarif établi sur soumission selon le mandat.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Tableau résumé</h2>
        <div className="mt-7 overflow-x-auto rounded-[1.5rem] border border-[rgba(131,97,67,0.14)] bg-white/80 shadow-soft">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(131,97,67,0.12)] bg-[rgba(255,250,244,0.82)]">
                <th className="px-4 py-4 text-left font-semibold text-[color:var(--site-heading)]">Service</th>
                <th className="px-4 py-4 text-left font-semibold text-[color:var(--site-heading)]">Prix régulier</th>
                <th className="px-4 py-4 text-left font-semibold text-[color:var(--site-heading)]">Prix lancement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(131,97,67,0.08)]">
              {summaryRows.map((row, index) => (
                <tr key={row.service} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(255,248,241,0.72)]'}>
                  <td className="px-4 py-3.5 font-medium text-[color:var(--site-heading)]">{row.service}</td>
                  <td className="px-4 py-3.5 text-[color:var(--site-muted)]">{row.regular}</td>
                  <td className="px-4 py-3.5 text-lg font-bold text-[color:var(--site-heading)]">{row.launch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
