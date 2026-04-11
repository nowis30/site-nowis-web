import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Tarifs — Création Nowis | Ateliers, chansons personnalisées et services créatifs',
  description:
    'Consulter les tarifs de Création Nowis : ateliers de groupe (60 min à 3 h), accompagnement individuel à 120 $/h, chanson IA souvenir à 25 $ et vidéo IA avec chanson à 100 $. Tarifs de lancement disponibles.',
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
    <main className="text-slate-100">

      {/* ── HÉROS ── */}
      <section className="relative overflow-hidden px-6 py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 12%, rgba(96,165,250,0.12), transparent 26%),' +
              'radial-gradient(circle at 86% 8%, rgba(251,191,36,0.10), transparent 22%)',
          }}
        />
        <div className="mx-auto max-w-5xl">
          <span className="brand-chip inline-block">Grille tarifaire 2026</span>
          <h1 className="brand-metal-text mt-5 font-display text-5xl leading-[0.95] md:text-7xl">
            Tarifs — Création Nowis
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
            Des ateliers accessibles, animés en personne par Nowis Morin. Tarifs de lancement offerts
            durant les premiers mois pour soutenir le développement de la formule.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/tarifs-creation-nowis.pdf"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-brand-warm px-7 py-4 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <span>⬇</span> Télécharger la grille PDF
            </a>
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Demander une soumission
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-400">
            Les tarifs de lancement sont valides pendant les 3 premiers mois d&apos;activité. Les tarifs réguliers s&apos;appliquent par la suite.
          </p>
        </div>
      </section>

      {/* ── ATELIERS DE GROUPE ── */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Ateliers de groupe</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Formules d&apos;ateliers
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            Animés en personne, dans un rayon de 100 km aller-retour depuis Drummondville (déplacement inclus).
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ateliers.map((a) => (
              <article
                key={a.name}
                className={`flex flex-col rounded-[2rem] border p-6 transition hover:-translate-y-1 ${
                  a.accent
                    ? 'border-primary-400/30 bg-[linear-gradient(145deg,rgba(14,25,55,0.96),rgba(20,35,75,0.90))] shadow-fire'
                    : 'border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.82),rgba(15,23,42,0.68))]'
                }`}
              >
                {a.accent && (
                  <span className="mb-3 inline-block self-start rounded-full bg-primary-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">
                    Populaire
                  </span>
                )}
                <h3 className="font-display text-2xl text-white">{a.name}</h3>
                <span className="mt-1 text-sm font-medium text-slate-400">{a.duree}</span>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{a.desc}</p>
                <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Lancement</span>
                    <span className="text-lg font-bold text-amber-200">{a.lancement}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Régulier</span>
                    <span className="text-sm text-slate-400 line-through">{a.regulier}</span>
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
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
          Ce qui est toujours inclus
        </h2>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {inclus.map((item) => (
            <div
              key={item.label}
              className="flex gap-4 rounded-[1.5rem] border border-emerald-500/15 bg-emerald-500/[0.05] p-5"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">✓</span>
              <div>
                <h3 className="font-semibold text-white">{item.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES PERSONNALISÉS ── */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Services personnalisés</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Accompagnement à la carte
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {servicesPersonnalises.map((s) => (
              <article key={s.name} className="brand-card p-7">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl text-white">{s.name}</h3>
                  <span className="shrink-0 rounded-xl border border-primary-400/30 bg-primary-500/10 px-3 py-1.5 text-sm font-bold text-primary-200">
                    {s.tarif}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-400">{s.conditions}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUITS À LA CARTE ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Produits à la carte</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
          Chansons et vidéos
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {produits.map((p) => (
            <article key={p.name} className="flex flex-col rounded-[2rem] border border-amber-400/15 bg-[linear-gradient(145deg,rgba(40,22,0,0.35),rgba(28,16,0,0.22))] p-6">
              <h3 className="font-display text-2xl text-amber-100">{p.name}</h3>
              <span className="mt-1 text-xs font-semibold text-slate-400">{p.format}</span>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{p.desc}</p>
              <span className="mt-5 block text-2xl font-bold text-amber-200">{p.prix}</span>
            </article>
          ))}
        </div>
      </section>

      {/* ── TARIFS PRÉFÉRENTIELS + DÉPLACEMENT ── */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-2 lg:items-start">

          {/* Préférentiels */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Tarifs préférentiels</p>
            <h2 className="mt-4 font-display text-3xl text-white md:text-4xl">Certains milieux bénéficient d&apos;un tarif adapté</h2>
            <div className="mt-6 space-y-3">
              {preferentiels.map((pref) => (
                <div key={pref.clientele} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-300">✓</span>
                  <div>
                    <span className="font-semibold text-white">{pref.clientele}</span>
                    <p className="mt-0.5 text-sm text-slate-400">{pref.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Déplacement */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">Déplacement</p>
              <h2 className="mt-4 font-display text-3xl text-white md:text-4xl">Frais de déplacement</h2>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-400/15 bg-emerald-500/[0.06] p-5">
              <p className="font-semibold text-emerald-200">Jusqu&apos;à 100 km aller-retour</p>
              <p className="mt-1 text-sm text-slate-300">À partir de Drummondville — <strong className="text-white">inclus dans le tarif.</strong></p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-400/15 bg-amber-500/[0.06] p-5">
              <p className="font-semibold text-amber-200">Au-delà de 100 km aller-retour</p>
              <p className="mt-1 text-sm text-slate-300">Frais supplémentaires selon la distance. À discuter lors de la demande.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">
                <strong className="text-slate-200">Note :</strong> Pour un projet en dehors du rayon habituel, une soumission personnalisée peut être demandée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── RÉSUMÉ ── */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Résumé rapide</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
          Tous les tarifs en un coup d&apos;œil
        </h2>
        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="px-5 py-4 text-left font-semibold text-slate-200">Service</th>
                <th className="px-5 py-4 text-right font-semibold text-amber-300">Lancement</th>
                <th className="px-5 py-4 text-right font-semibold text-slate-400">Régulier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {[
                { service: 'Atelier express — 60 min', lancement: '180 $', regulier: '225 $' },
                { service: 'Atelier découverte — 90 min', lancement: '250 $', regulier: '325 $' },
                { service: 'Atelier créatif — 2 h', lancement: '325 $', regulier: '425 $' },
                { service: 'Atelier immersif — 3 h', lancement: '450 $', regulier: '575 $' },
                { service: 'Accompagnement individuel', lancement: '120 $ / h', regulier: '120 $ / h' },
                { service: 'Chanson IA souvenir', lancement: '25 $', regulier: '25 $' },
                { service: 'Vidéo IA avec chanson', lancement: '100 $', regulier: '100 $' },
              ].map((row, i) => (
                <tr key={row.service} className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}>
                  <td className="px-5 py-3.5 text-slate-200">{row.service}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-amber-200">{row.lancement}</td>
                  <td className="px-5 py-3.5 text-right text-slate-400">{row.regulier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href="/tarifs-creation-nowis.pdf"
            download
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
          >
            <span>⬇</span> Télécharger la grille complète (PDF)
          </a>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-16 md:py-24">
        <div
          className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-primary-400/20 p-10 text-center md:p-16"
          style={{ background: 'linear-gradient(145deg, rgba(8,14,38,0.97) 0%, rgba(16,26,62,0.93) 100%)' }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Passez à l&apos;action</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-white md:text-5xl">
            Réservez votre atelier ou demandez une soumission
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-300">
            Pour toute question sur les tarifs, les formules ou un besoin particulier, Nowis Morin vous répond directement.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="rounded-xl bg-brand-warm px-9 py-4 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Demander un atelier
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 bg-white/5 px-9 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
