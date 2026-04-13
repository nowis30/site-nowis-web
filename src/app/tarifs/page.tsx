import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

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
    name: 'Atelier express',
    duree: '60 min',
    lancement: '180 $',
    regulier: '225 $',
    desc: 'Découverte rapide du processus créatif et création simple en groupe.',
    accent: false,
  },
  {
    name: 'Atelier découverte',
    duree: '90 min',
    lancement: '250 $',
    regulier: '325 $',
    desc: 'Création d\'une chanson à partir d\'idées, de souvenirs, d\'émotions ou d\'un thème choisi.',
    accent: false,
  },
  {
    name: 'Atelier créatif',
    duree: '2 h',
    lancement: '325 $',
    regulier: '425 $',
    desc: 'Formule plus complète avec accompagnement dans les idées, les paroles et la mise en chanson.',
    accent: true,
  },
  {
    name: 'Atelier immersif',
    duree: '3 h',
    lancement: '450 $',
    regulier: '575 $',
    desc: 'Expérience approfondie permettant une création collective plus marquante et plus développée.',
    accent: false,
  },
];

const servicesPersonnalises = [
  {
    name: 'Accompagnement individuel',
    tarif: '120 $ / heure',
    conditions: 'Minimum 1 heure',
    desc: 'Création de chanson, accompagnement créatif, projet personnel ou assistance sur mesure.',
  },
  {
    name: 'Projet personnalisé',
    tarif: '120 $ / heure',
    conditions: 'Selon mandat',
    desc: 'Vidéo IA, reel, short, publicité, concept créatif ou demande spéciale.',
  },
];

const produits = [
  {
    name: 'Chanson IA souvenir',
    prix: '25 $',
    format: 'Simple',
    desc: 'Création d\'une chanson amusante ou souvenir à partir des informations fournies.',
  },
  {
    name: 'Vidéo IA avec chanson',
    prix: '100 $',
    format: 'Standard',
    desc: 'Vidéo souvenir ou amusante avec chanson IA, en format simple.',
  },
  {
    name: 'Projet spécial',
    prix: 'Sur soumission',
    format: 'Personnalisé',
    desc: 'Fêtes d\'enfants, événements, projets promotionnels ou demandes particulières.',
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
  { clientele: 'Résidences pour aînés', note: 'Tarif préférentiel possible selon le contexte' },
  { clientele: 'Écoles', note: 'Tarif préférentiel possible selon le projet' },
  { clientele: 'Organismes communautaires', note: 'Tarif préférentiel possible selon les besoins' },
  { clientele: 'Projets pilotes', note: 'Rabais possible pendant les 3 premiers mois' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TarifsPage() {
  return (
    <main className="text-[color:var(--site-text)]">

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
            Des repères clairs pour comprendre les formules proposées par Nowis Morin. La soumission finale est toujours ajustée selon le groupe, le contexte, le déplacement et le niveau d accompagnement attendu.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="/tarifs-creation-nowis.pdf"
              download
              className="cta-primary w-full justify-center gap-2 px-7 py-4 sm:w-auto"
            >
              <span>⬇</span> Télécharger la grille PDF
            </a>
            <Link
              href="/contact"
              className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto"
            >
              Demander une soumission
            </Link>
          </div>
          <p className="mt-5 text-sm text-[color:var(--site-soft)]">
            Les montants affichés servent de base de discussion. La soumission confirmée dépend toujours du projet réel.
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
            Animés en personne, dans un rayon de 100 km aller-retour depuis Drummondville (déplacement inclus).
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
                <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Lancement</span>
                    <span className="text-lg font-bold text-amber-200">{a.lancement}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[color:var(--site-soft)]">Régulier</span>
                    <span className="text-sm text-[color:var(--site-soft)] line-through">{a.regulier}</span>
                  </div>
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
                  <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{s.name}</h3>
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
              <span className="mt-5 block text-2xl font-bold text-amber-200">{p.prix}</span>
            </article>
          ))}
        </div>
      </section>

      {/* ── TARIFS PRÉFÉRENTIELS + DÉPLACEMENT ── */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-2 lg:items-start">

          {/* Préférentiels */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Tarifs préférentiels</p>
            <h2 className="mt-4 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Certains milieux bénéficient d&apos;un tarif adapté</h2>
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
                <th className="px-5 py-4 text-right font-semibold text-amber-300">Lancement</th>
                <th className="px-5 py-4 text-right font-semibold text-[color:var(--site-soft)]">Régulier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(131,97,67,0.08)]">
              {[
                { service: 'Atelier express — 60 min', lancement: '180 $', regulier: '225 $' },
                { service: 'Atelier découverte — 90 min', lancement: '250 $', regulier: '325 $' },
                { service: 'Atelier créatif — 2 h', lancement: '325 $', regulier: '425 $' },
                { service: 'Atelier immersif — 3 h', lancement: '450 $', regulier: '575 $' },
                { service: 'Accompagnement individuel', lancement: '120 $ / h', regulier: '120 $ / h' },
                { service: 'Chanson IA souvenir', lancement: '25 $', regulier: '25 $' },
                { service: 'Vidéo IA avec chanson', lancement: '100 $', regulier: '100 $' },
              ].map((row, i) => (
                <tr key={row.service} className={i % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(255,248,241,0.72)]'}>
                  <td className="px-5 py-3.5 text-[color:var(--site-heading)]">{row.service}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-amber-200">{row.lancement}</td>
                  <td className="px-5 py-3.5 text-right text-[color:var(--site-soft)]">{row.regulier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href="/tarifs-creation-nowis.pdf"
            download
            className="cta-secondary gap-2 px-6 py-3.5"
          >
            <span>⬇</span> Télécharger la grille complète (PDF)
          </a>
        </div>
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
