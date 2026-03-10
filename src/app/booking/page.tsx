import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Réserver / parler de mon projet — Nowis Morin',
  description: 'Réserve une consultation avec Nowis Morin pour discuter d’une chanson, d’une vidéo, d’un concept créatif ou d’une collaboration assistée par IA.',
  path: '/booking',
});

export default function BookingPage() {
  return (
    <div className="bg-slate-50">
      <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-20 text-white md:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Réserver / parler de mon projet</p>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">Une consultation claire pour faire avancer ton idée plus vite</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">Cette page sert à cadrer un projet avant création : chanson personnalisée, vidéo créative, visuel ou concept marketing. L’objectif est d’identifier l’ambiance, l’intention, le format et la meilleure direction artistique pour passer à l’action.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <article className="rounded-3xl bg-white p-8 shadow-sm"><h2 className="text-2xl font-bold text-slate-950">Avant l’appel</h2><p className="mt-4 leading-relaxed text-slate-600">On prépare l’essentiel : ton idée, ton objectif, le type de création souhaité, le style recherché et le contexte de diffusion.</p></article>
          <article className="rounded-3xl bg-white p-8 shadow-sm"><h2 className="text-2xl font-bold text-slate-950">Pendant l’appel</h2><p className="mt-4 leading-relaxed text-slate-600">On clarifie l’intention, le ton, le format, le niveau de personnalisation et les priorités. L’idée est de transformer un concept flou en direction précise.</p></article>
          <article className="rounded-3xl bg-white p-8 shadow-sm"><h2 className="text-2xl font-bold text-slate-950">Après l’appel</h2><p className="mt-4 leading-relaxed text-slate-600">Tu repars avec une vision plus claire, une prochaine étape concrète et un point de contact direct pour lancer la production.</p></article>
        </div>

        <div className="mt-10 rounded-3xl bg-slate-950 p-10 text-white shadow-sm">
          <h2 className="text-3xl font-bold">Prêt à en parler?</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-300">Le moyen le plus simple est de me contacter directement avec ton idée. Tu peux me parler d’une chanson, d’un clip, d’un visuel ou d’une collaboration artistique plus large.</p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link href="/contact" className="inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">Aller au formulaire de contact</Link>
            <a href="mailto:simonmorin@nowis.store" className="inline-flex rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10">simonmorin@nowis.store</a>
          </div>
        </div>
      </section>
    </div>
  );
}

