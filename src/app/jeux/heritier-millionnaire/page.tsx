import Link from 'next/link';

export const metadata = {
  title: 'Héritier Millionnaire – Jeux NOWIS',
  description:
    'Accède à Héritier Millionnaire depuis nowis.store avec une page dédiée pour découvrir le jeu et le lancer rapidement.',
};

const features = [
  'Immobilier, bourse, quiz et mini-jeux dans une même progression.',
  'Expérience pensée pour mobile et ordinateur.',
  'Accès centralisé depuis nowis.store pour un partage plus simple.',
];

export default function HeritierMillionnairePage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Jeux NOWIS</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-6xl">
              Héritier Millionnaire
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Voici la nouvelle adresse stable de présentation du jeu sur le site principal. Tu peux désormais partager facilement le chemin
              <span className="font-semibold text-white"> nowis.store/jeux/heritier-millionnaire</span>.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="https://client-jeux-millionnaire.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Jouer maintenant
              </a>
              <Link
                href="/jeux"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Retour à la page Jeux
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Pourquoi passer par cette page</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{feature}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}