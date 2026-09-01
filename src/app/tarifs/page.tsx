import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { formatPrice, REGULAR_PRICES } from '@/data/pricing';

export const metadata = buildMetadata({
  title: 'Tarifs — Création Nowis | Ateliers, chansons personnalisées et services créatifs',
  description:
    'Consultez les repères tarifaires de Création Nowis pour préparer une demande d’atelier, de chanson personnalisée ou de service créatif. La soumission finale reste adaptée à chaque projet.',
  path: '/tarifs',
  keywords: ['tarifs ateliers création nowis', 'prix atelier musical IA', 'chanson personnalisée prix', 'tarifs Nowis Morin'],
});

const hourlyRegularPrice = REGULAR_PRICES.hourly;
const groupRegularPrice = REGULAR_PRICES.groupFromPerPerson;
const memorySongRegularPrice = REGULAR_PRICES.songs.memorySong;
const songVideoRegularPrice = REGULAR_PRICES.songs.videoWithSong;

const ateliers = [
  {
    name: 'Atelier 1 h 30',
    duree: '1 h 30',
    regularPrice: REGULAR_PRICES.workshops.minutes90,
    desc: 'La formule la plus fréquente pour aller plus loin dans les idées, les paroles et la mise en chanson.',
    accent: false,
  },
  {
    name: 'Atelier 2 heures',
    duree: '2 heures',
    regularPrice: REGULAR_PRICES.workshops.hours2,
    desc: 'Un atelier approfondi qui laisse davantage de place à la participation, à l’expression et au raffinement du résultat.',
    accent: true,
  },
];

const servicesPersonnalises = [
  {
    name: 'Tarif de base universel',
    regularPrice: hourlyRegularPrice,
    suffix: ' / h',
    conditions: 'Minimum 1 heure',
    desc: 'Pour l’accompagnement créatif, les mandats ponctuels et les besoins personnalisés qui suivent la même base horaire.',
  },
  {
    name: 'Tarification sur demande',
    tarif: 'Sur soumission',
    conditions: 'Selon le mandat',
    desc: 'Pour les projets spéciaux, les mandats créatifs personnalisés, les vidéos IA, les reels, les shorts et le contenu promotionnel.',
  },
];

const produits = [
  {
    name: 'Chanson souvenir',
    regularPrice: memorySongRegularPrice,
    format: 'Simple',
    desc: 'Création d’une chanson amusante ou souvenir à partir des informations fournies.',
  },
  {
    name: 'Vidéo IA avec chanson',
    regularPrice: songVideoRegularPrice,
    format: 'Standard',
    desc: 'Vidéo souvenir ou amusante avec chanson IA, dans un format simple et efficace.',
  },
  {
    name: 'Projet spécial',
    tarif: 'Sur soumission',
    format: 'Personnalisé',
    desc: 'Fêtes d’enfants, événements, projets promotionnels ou demandes particulières.',
  },
];

const inclus = [
  { label: 'Animation adaptée', desc: 'Atelier ajusté selon le groupe, l’âge et le contexte.' },
  { label: 'Accompagnement créatif', desc: 'Aide à faire émerger les idées, émotions, souvenirs ou thèmes.' },
  { label: 'Aide à l’écriture', desc: 'Utilisation de ChatGPT pour structurer ou enrichir les paroles.' },
  { label: 'Mise en chanson', desc: 'Utilisation d’outils comme Suno pour transformer les idées en chanson.' },
  { label: 'Remise finale', desc: 'Dossier téléchargeable contenant les compositions du groupe, offert gratuitement.' },
];

const preferentiels = [
  { clientele: 'Écoles', note: `Formule groupe possible à partir de ${formatPrice(groupRegularPrice, ' / personne')}` },
  { clientele: 'Maisons des jeunes', note: 'Option groupe disponible pour les activités collectives et les séries d’ateliers.' },
  { clientele: 'Résidences pour aînés', note: 'Tarification adaptée possible selon le contexte et le nombre de participants.' },
  { clientele: 'Organismes et groupes privés', note: 'Formule groupe disponible pour certains mandats.' },
];

const resumeTarifs = [
  { service: 'Atelier 1 h 30', tarif: formatPrice(REGULAR_PRICES.workshops.minutes90) },
  { service: 'Atelier 2 heures', tarif: formatPrice(REGULAR_PRICES.workshops.hours2) },
  { service: 'Tarif horaire', tarif: formatPrice(hourlyRegularPrice, ' / h') },
  { service: 'Formule groupe', tarif: `${formatPrice(groupRegularPrice, ' / personne')} (à partir de)` },
  { service: 'Chanson souvenir', tarif: formatPrice(memorySongRegularPrice) },
  { service: 'Vidéo IA avec chanson', tarif: formatPrice(songVideoRegularPrice) },
  { service: 'Projet spécial', tarif: 'Sur soumission' },
];

function PriceBadge({ amount, suffix = '' }: { amount: number; suffix?: string }) {
  return (
    <span className="inline-flex min-h-11 items-center rounded-xl border border-emerald-700/20 bg-emerald-700/5 px-4 py-2 text-sm font-semibold text-emerald-300">
      {formatPrice(amount, suffix)}
    </span>
  );
}

export default function TarifsPage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <section className="relative overflow-hidden px-5 py-16 sm:px-6 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 12%, rgba(184,111,61,0.12), transparent 26%),' +
              'radial-gradient(circle at 86% 8%, rgba(203,165,120,0.14), transparent 22%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl">
          <span className="brand-chip inline-flex">Grille tarifaire 2026</span>
          <h1 className="brand-metal-text mt-5 max-w-4xl font-display text-5xl leading-[0.95] md:text-7xl">
            Des tarifs clairs avant de commencer
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
            Les repères essentiels sont regroupés ici pour vous aider à planifier votre projet. Le tarif horaire régulier est de {formatPrice(hourlyRegularPrice, ' / h')} et certaines formules de groupe commencent à {formatPrice(groupRegularPrice, ' / personne')}.
          </p>

          <div className="mt-7 flex flex-wrap gap-3" aria-label="Repères tarifaires principaux">
            <PriceBadge amount={hourlyRegularPrice} suffix=" / h" />
            <span className="inline-flex min-h-11 items-center rounded-xl border border-[rgba(131,97,67,0.14)] bg-white/65 px-4 py-2 text-sm font-semibold text-[color:var(--site-heading)]">
              Déplacement inclus jusqu’à 100 km aller-retour
            </span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/ateliers/demande" className="cta-primary w-full justify-center px-7 py-4 sm:w-auto">
              Demander un atelier
            </Link>
            <Link href="/contact" className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto">
              Demander une soumission
            </Link>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[color:var(--site-soft)]">
            Taxes en sus si applicables. Une soumission personnalisée confirme toujours le prix final avant le début d’un mandat.
          </p>
        </div>
      </section>

      <section className="section-soft px-5 py-16 sm:px-6 md:py-20" aria-labelledby="tarifs-ateliers">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Ateliers de groupe</p>
          <h2 id="tarifs-ateliers" className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Deux formats simples à comparer
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-8 text-[color:var(--site-muted)]">
            La durée habituelle des ateliers est de 1 h 30 à 2 heures, avec un léger dépassement possible selon la dynamique du groupe. Le déplacement est inclus jusqu’à 100 km aller-retour depuis Drummondville.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {ateliers.map((atelier) => (
              <article
                key={atelier.name}
                className={`flex flex-col p-6 motion-safe:transition-transform motion-safe:hover:-translate-y-1 ${
                  atelier.accent ? 'warm-spotlight-panel' : 'brand-card'
                }`}
              >
                {atelier.accent && (
                  <span className="mb-3 inline-flex self-start rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-400">
                    Plus de temps pour créer
                  </span>
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{atelier.name}</h3>
                    <p className="mt-1 text-sm font-medium text-[color:var(--site-soft)]">Durée : {atelier.duree}</p>
                  </div>
                  <PriceBadge amount={atelier.regularPrice} />
                </div>
                <p className="mt-5 flex-1 text-sm leading-7 text-[color:var(--site-muted)]">{atelier.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6 md:py-20" aria-labelledby="tarifs-inclus">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">Inclus dans chaque atelier</p>
        <h2 id="tarifs-inclus" className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
          Une formule complète, sans petites surprises
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inclus.map((item) => (
            <article key={item.label} className="brand-card flex gap-4 p-5">
              <span aria-hidden="true" className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700/10 text-sm font-bold text-emerald-300">✓</span>
              <div>
                <h3 className="font-semibold text-[color:var(--site-heading)]">{item.label}</h3>
                <p className="mt-1 text-sm leading-6 text-[color:var(--site-muted)]">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-warm px-5 py-16 sm:px-6 md:py-20" aria-labelledby="tarifs-personnalises">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Services personnalisés</p>
          <h2 id="tarifs-personnalises" className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Accompagnement à la carte
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {servicesPersonnalises.map((service) => (
              <article key={service.name} className="brand-card p-7">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{service.name}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--site-soft)]">{service.conditions}</p>
                  </div>
                  {service.regularPrice !== undefined ? (
                    <PriceBadge amount={service.regularPrice} suffix={service.suffix} />
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-xl border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-sm font-bold text-primary-300">
                      {service.tarif}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">{service.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6 md:py-20" aria-labelledby="tarifs-produits">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Produits à la carte</p>
        <h2 id="tarifs-produits" className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
          Chansons et vidéos
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {produits.map((produit) => (
            <article key={produit.name} className="warm-spotlight-panel flex flex-col p-6">
              <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{produit.name}</h3>
              <span className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--site-soft)]">{produit.format}</span>
              <p className="mt-4 flex-1 text-sm leading-7 text-[color:var(--site-muted)]">{produit.desc}</p>
              <div className="mt-5 border-t border-[rgba(131,97,67,0.12)] pt-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Tarif</span>
                <div className="mt-2">
                  {produit.regularPrice !== undefined ? (
                    <PriceBadge amount={produit.regularPrice} />
                  ) : (
                    <span className="inline-flex min-h-11 items-center text-lg font-bold text-amber-300">{produit.tarif}</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-soft px-5 py-16 sm:px-6 md:py-20" aria-labelledby="tarifs-groupes">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Formules de groupe</p>
            <h2 id="tarifs-groupes" className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
              Certaines activités sont offertes à partir de {formatPrice(groupRegularPrice, ' / personne')}
            </h2>
            <div className="mt-6 space-y-3">
              {preferentiels.map((pref) => (
                <article key={pref.clientele} className="brand-card flex gap-3 p-4">
                  <span aria-hidden="true" className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-300">✓</span>
                  <div>
                    <h3 className="font-semibold text-[color:var(--site-heading)]">{pref.clientele}</h3>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--site-muted)]">{pref.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">Déplacement</p>
              <h2 className="mt-4 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Un rayon simple à comprendre</h2>
            </div>
            <article className="brand-card p-5">
              <h3 className="font-semibold text-emerald-300">Jusqu’à 100 km aller-retour</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
                À partir de Drummondville : <strong className="text-[color:var(--site-heading)]">inclus dans le tarif.</strong>
              </p>
            </article>
            <article className="warm-spotlight-panel p-5">
              <h3 className="font-semibold text-amber-300">Au-delà de 100 km aller-retour</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Des frais supplémentaires peuvent s’appliquer selon la distance et sont confirmés avant le mandat.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6 md:py-20" aria-labelledby="resume-tarifs">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Résumé rapide</p>
        <h2 id="resume-tarifs" className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
          Tous les tarifs en un coup d’œil
        </h2>
        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          {resumeTarifs.map((row) => (
            <div key={row.service} className="brand-card flex min-w-0 items-center justify-between gap-4 p-5">
              <dt className="min-w-0 text-sm font-semibold text-[color:var(--site-heading)]">{row.service}</dt>
              <dd className="shrink-0 text-right text-sm font-bold text-amber-300">{row.tarif}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm leading-7 text-[color:var(--site-muted)]">
          Les projets spéciaux, mandats créatifs personnalisés, vidéos IA, reels, shorts et contenus promotionnels sont tarifés sur soumission.
        </p>
      </section>

      <section className="px-5 py-16 sm:px-6 md:py-24" aria-labelledby="tarifs-cta">
        <div className="warm-cta-panel mx-auto max-w-4xl overflow-hidden p-7 text-center sm:p-10 md:p-16">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Passez à l’action</p>
          <h2 id="tarifs-cta" className="mt-5 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Choisissez votre prochaine étape
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-[color:var(--site-muted)]">
            Vous pouvez réserver un atelier, demander une soumission ou consulter la préparation recommandée avant de décrire votre projet.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/ateliers/demande" className="cta-primary w-full justify-center px-8 py-4 sm:w-auto">
              Demander un atelier
            </Link>
            <Link href="/contact" className="cta-secondary w-full justify-center px-8 py-4 sm:w-auto">
              Poser une question
            </Link>
            <Link href="/avant-de-mecrire" className="cta-secondary w-full justify-center px-8 py-4 sm:w-auto">
              Préparer ma demande
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
