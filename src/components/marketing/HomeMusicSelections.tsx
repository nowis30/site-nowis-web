import Link from 'next/link';
import { youtubeSelectionSnapshot } from '@/data/youtubeSelections';

export function HomeMusicSelections() {
  return (
    <section className="mt-10" aria-labelledby="home-music-title">
      <h2 id="home-music-title" className="text-3xl font-bold">Les chansons de Nowis</h2>
      <p className="mt-3 max-w-3xl leading-7 text-[color:var(--site-muted)]">Découvrez mes nouveautés et les chansons les plus écoutées sur ma chaîne YouTube.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <article className="brand-card flex flex-col p-6">
          <h3 className="text-2xl font-bold">Mes 10 dernières chansons</h3>
          <p className="mb-5 mt-3 flex-1 leading-7 text-[color:var(--site-muted)]">À découvrir : {youtubeSelectionSnapshot.latest.slice(0, 3).map((song) => song.title).join(', ')}.</p>
          <Link href="/musique#dernieres-chansons" className="cta-primary inline-flex min-h-12 items-center justify-center px-5 py-3">Écouter les nouveautés</Link>
        </article>
        <article className="brand-card flex flex-col p-6">
          <h3 className="text-2xl font-bold">Mes 10 plus populaires sur YouTube</h3>
          <p className="mb-5 mt-3 flex-1 leading-7 text-[color:var(--site-muted)]">Retrouvez notamment {youtubeSelectionSnapshot.popular.slice(0, 3).map((song) => song.title).join(', ')}.</p>
          <Link href="/musique#chansons-populaires" className="cta-secondary inline-flex min-h-12 items-center justify-center px-5 py-3">Écouter les plus populaires</Link>
        </article>
      </div>
    </section>
  );
}
