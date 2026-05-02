import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { LaunchOfferBanner } from '@/components/marketing/LaunchOfferBanner';

export const metadata = buildMetadata({
  title: 'Tarifs — Création Nowis | Ateliers, chansons personnalisées et services créatifs',
  description:
    'Consultez les repères tarifaires de Création Nowis pour préparer une demande d atelier, de chanson personnalisée ou de service créatif. La soumission finale reste adaptée à chaque projet.',
  path: '/tarifs',
  keywords: ['tarifs ateliers création nowis', 'prix atelier musical IA', 'chanson personnalisée prix', 'tarifs Nowis Morin'],
});

// ─── Données ──────────────────────────────────────────────────────────────────

const ateliers = [
  {
    name: 'Atelier 60 minutes',
    duree: '60 minutes',
    tarif: '120 $',
    desc: 'Format direct pour initier un groupe a la creation musicale avec l IA et produire un premier resultat concret.',
    accent: false,
  },
  {
    name: 'Atelier 90 minutes',
    duree: '90 minutes',
    tarif: '180 $',
    desc: 'Formule la plus frequente pour aller plus loin dans les idees, les paroles et la mise en chanson.',
    accent: false,
  },
  {
    name: 'Atelier 2 heures',
    duree: '2 heures',
    tarif: '240 $',
    desc: 'Atelier approfondi pour laisser plus de place a la participation, a l expression et au raffinement du resultat.',
    accent: true,
  },
  {
    name: 'Atelier 3 heures',
    duree: '3 heures',
    tarif: '360 $',
    desc: 'Experience immersive pour les groupes qui veulent une demarche plus complete ou un moment fort sur mesure.',
    accent: false,
  },
];

const servicesPersonnalises = [
  {
    name: 'Tarif de base universel',
    tarif: '120 $ / heure',
    conditions: 'Minimum 1 heure',
    desc: 'Pour l accompagnement creatif, les mandats ponctuels et les besoins personnalises qui suivent la meme base horaire.',
  },
  {
    name: 'Tarification sur demande',
    tarif: 'Sur soumission',
    conditions: 'Selon mandat',
    desc: 'Pour les projets speciaux, les mandats creatifs personnalises, les videos IA, les reels, les shorts et le contenu promotionnel.',
  },
];

const produits = [
  {
    name: 'Chanson IA souvenir',
    tarif: '25 $',
    format: 'Simple',
    desc: 'Creation d une chanson amusante ou souvenir a partir des informations fournies.',
  },
  {
    name: 'Vidéo IA avec chanson',
    tarif: '100 $',
    format: 'Standard',
    desc: 'Video souvenir ou amusante avec chanson IA, en format simple.',
  },
  {
    name: 'Projet spécial',
    tarif: 'Sur soumission',
    format: 'Personnalisé',
    desc: 'Fetes d enfants, evenements, projets promotionnels ou demandes particulieres.',
  },
];

const inclus = [
  { label: 'Animation adaptée', desc: 'Atelier ajusté selon le groupe, l\'âge et le contexte.' },
  { label: 'Accompagnement créatif', desc: 'Aide à faire émerger les idées, émotions, souvenirs ou thèmes.' },
  { label: 'Aide à l\'écriture', desc: 'Utilisation de ChatGPT pour structurer ou enrichir les paroles.' },
  { label: 'Mise en chanson', desc: 'Utilisation d\'outils comme Suno pour transformer les idées en chanson.' },
  { label: 'Remise finale', desc: 'Dossier téléchargeable contenant les compositions du groupe, offert gratuitement.' },
];

const preferentiels = [
  { clientele: 'Ecoles', note: 'Formule groupe possible a partir de 10 $ par personne selon le projet' },
  { clientele: 'Maisons des jeunes', note: 'Option groupe disponible pour les activites collectives et les series d ateliers' },
  { clientele: 'Residences pour aines', note: 'Tarification adaptee possible selon le contexte et le nombre de participants' },
  { clientele: 'Organismes et groupes prives', note: 'Formule lancement de groupe disponible pour certains mandats' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TarifsPage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <LaunchOfferBanner />

      {/* ── HÉROS ── */}
      <section className="relative overflow-hidden px-6 py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 12%, rgba(184,111,61,0.12), transparent 26%),' +
              'radial-gradient(circle at 86% 8%, rgba(203,165,120,0.14), transparent 22%)',
          }}
        />
        <div className="mx-auto max-w-5xl">
          <span className="brand-chip inline-block">Grille tarifaire 2026</span>
          <h1 className="brand-metal-text mt-5 font-display text-5xl leading-[0.95] md:text-7xl">
            Tarifs — Création Nowis
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
            La grille officielle de Creation Nowis est maintenant simple et coherente partout sur le site. Le tarif de base universel est de 120 $ / heure, les ateliers suivent exactement cette meme logique horaire et certaines activites de groupe peuvent aussi etre offertes a partir de 10 $ par personne.
          </p>
          <p className="mt-4 inline-flex rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
            Tarif de base : 120 $ / heure
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/ateliers/demande"
              className="cta-primary w-full justify-center px-7 py-4 sm:w-auto"
            >
              Demander un atelier
            </Link>
            <Link
              href="/contact"
              className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto"
            >
              Demander une soumission
            </Link>
          </div>
          <p className="mt-5 text-sm text-[color:var(--site-soft)]">
            Taxes en sus si applicables. Le deplacement est inclus jusqu a 100 km aller-retour depuis Drummondville.
          </p>
        </div>
      </section>

      {/* ── ATELIERS DE GROUPE ── */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Ateliers de groupe</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Formules d&apos;ateliers
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Meme logique tarifaire partout : 60 minutes = 120 $, 90 minutes = 180 $, 2 heures = 240 $ et 3 heures = 360 $. Deplacement inclus jusqu a 100 km aller-retour depuis Drummondville.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ateliers.map((a) => (
              <article
                key={a.name}
                className={`flex flex-col p-6 transition hover:-translate-y-1 ${
                  a.accent
                      ? 'glass-panel-strong shadow-fire'
                      : 'brand-card'
                }`}
              >
                {a.accent && (
                  <span className="mb-3 inline-block self-start rounded-full bg-primary-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">
                    Populaire
                  </span>
                )}
                <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{a.name}</h3>
                <span className="mt-1 text-sm font-medium text-[color:var(--site-soft)]">{a.duree}</span>
                <p className="mt-3 flex-1 text-sm leading-6 text-[color:var(--site-muted)]">{a.desc}</p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Tarif</span>
                  <p className="mt-1 text-2xl font-bold text-amber-200">{a.tarif}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CE QUI EST INCLUS ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">Inclus dans chaque atelier</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
          Ce qui est toujours inclus
        </h2>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {inclus.map((item) => (
            <div
              key={item.label}
              className="glass-panel-soft flex gap-4 rounded-[1.5rem] p-5"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">✓</span>
              <div>
                <h3 className="font-semibold text-[color:var(--site-heading)]">{item.label}</h3>
                <p className="mt-1 text-sm leading-6 text-[color:var(--site-muted)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES PERSONNALISÉS ── */}
      <section className="section-warm px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Services personnalisés</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Accompagnement à la carte
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {servicesPersonnalises.map((s) => (
              <article key={s.name} className="brand-card p-7">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{s.name}</h3>
                  </div>
                  <span className="shrink-0 rounded-xl border border-primary-400/30 bg-primary-500/10 px-3 py-1.5 text-sm font-bold text-primary-200">
                    {s.tarif}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[color:var(--site-soft)]">{s.conditions}</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUITS À LA CARTE ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Produits à la carte</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
          Chansons et vidéos
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {produits.map((p) => (
            <article key={p.name} className="warm-spotlight-panel flex flex-col p-6">
              <h3 className="font-display text-2xl text-amber-100">{p.name}</h3>
              <span className="mt-1 text-xs font-semibold text-[color:var(--site-soft)]">{p.format}</span>
              <p className="mt-3 flex-1 text-sm leading-6 text-[color:var(--site-muted)]">{p.desc}</p>
              <div className="mt-5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Tarif</span>
                <span className="block text-2xl font-bold text-amber-200">{p.tarif}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── TARIFS PRÉFÉRENTIELS + DÉPLACEMENT ── */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-2 lg:items-start">

          {/* Préférentiels */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Formule groupe disponible</p>
            <h2 className="mt-4 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Certaines activites peuvent aussi etre offertes a partir de 10 $ par personne</h2>
            <div className="mt-6 space-y-3">
              {preferentiels.map((pref) => (
                <div key={pref.clientele} className="glass-panel-soft flex gap-3 rounded-xl p-4">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-300">✓</span>
                  <div>
                    <span className="font-semibold text-[color:var(--site-heading)]">{pref.clientele}</span>
                    <p className="mt-0.5 text-sm text-[color:var(--site-muted)]">{pref.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-[color:var(--site-muted)]">
              Ideal pour : ecoles, maisons des jeunes, residences pour aines, organismes communautaires et groupes prives.
            </p>
          </div>

          {/* Déplacement */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">Déplacement</p>
              <h2 className="mt-4 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Frais de déplacement</h2>
            </div>
            <div className="glass-panel-soft rounded-[1.5rem] p-5">
              <p className="font-semibold text-emerald-200">Jusqu&apos;à 100 km aller-retour</p>
              <p className="mt-1 text-sm text-[color:var(--site-muted)]">À partir de Drummondville — <strong className="text-[color:var(--site-heading)]">inclus dans le tarif.</strong></p>
            </div>
            <div className="warm-spotlight-panel rounded-[1.5rem] p-5">
              <p className="font-semibold text-amber-200">Au-delà de 100 km aller-retour</p>
              <p className="mt-1 text-sm text-[color:var(--site-muted)]">Frais supplémentaires selon la distance. À discuter lors de la demande.</p>
            </div>
            <div className="glass-panel-soft rounded-[1.5rem] p-4">
              <p className="text-sm text-[color:var(--site-muted)]">
                <strong className="text-[color:var(--site-heading)]">Note :</strong> Pour un projet en dehors du rayon habituel, une soumission personnalisée peut être demandée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── RÉSUMÉ ── */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Résumé rapide</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
          Tous les tarifs en un coup d&apos;œil
        </h2>
        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[rgba(131,97,67,0.12)] bg-white/72 shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(131,97,67,0.12)] bg-[rgba(255,250,244,0.82)]">
                <th className="px-5 py-4 text-left font-semibold text-[color:var(--site-heading)]">Service</th>
                <th className="px-5 py-4 text-right font-semibold text-amber-300">Tarif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(131,97,67,0.08)]">
              {[
                { service: 'Atelier 60 minutes', tarif: '120 $' },
                { service: 'Atelier 90 minutes', tarif: '180 $' },
                { service: 'Atelier 2 heures', tarif: '240 $' },
                { service: 'Atelier 3 heures', tarif: '360 $' },
                { service: 'Tarif de base universel', tarif: '120 $ / heure' },
                { service: 'Formule groupe', tarif: 'A partir de 10 $ / personne' },
                { service: 'Chanson IA souvenir', tarif: '25 $' },
                { service: 'Video IA avec chanson', tarif: '100 $' },
                { service: 'Projet special', tarif: 'Sur soumission' },
              ].map((row, i) => (
                <tr key={row.service} className={i % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(255,248,241,0.72)]'}>
                  <td className="px-5 py-3.5 text-[color:var(--site-heading)]">{row.service}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-amber-200">{row.tarif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[color:var(--site-muted)]">
          Tarification sur demande pour : projets speciaux, mandats creatifs personnalises, videos IA, reels, shorts et contenu promotionnel.
        </p>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-16 md:py-24">
        <div className="warm-cta-panel mx-auto max-w-4xl overflow-hidden p-10 text-center md:p-16">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Passez à l&apos;action</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Réservez votre atelier ou demandez une soumission
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-[color:var(--site-muted)]">
            Pour toute question sur les tarifs, les formules ou un besoin particulier, Nowis Morin vous répond directement.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="cta-primary px-9 py-4"
            >
              Demander un atelier
            </Link>
            <Link
              href="/contact"
              className="cta-secondary px-9 py-4"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
