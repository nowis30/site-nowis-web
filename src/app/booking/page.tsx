import Link from 'next/link';
import { BookingEmbed } from '@/components/booking/BookingEmbed';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { getBookingBaseUrl } from '@/lib/booking-link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Réserver / parler de mon projet — Nowis Morin',
  description: 'Réserve une consultation avec Nowis Morin pour discuter d’une chanson, d’une vidéo, d’un concept créatif ou d’une collaboration assistée par IA.',
  path: '/booking',
});

export default function BookingPage() {
  const bookingUrl = getBookingBaseUrl();

  return (
    <div className="site-background">
      <section className="section-warm">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Réserver / parler de mon projet</p>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-[color:var(--site-heading)] md:text-6xl">Une consultation claire pour faire avancer ton idée plus vite</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--site-text)]">Cette page sert à cadrer un projet avant création : chanson personnalisée, vidéo créative, visuel ou concept marketing. L’objectif est d’identifier l’ambiance, l’intention, le format et la meilleure direction artistique pour passer à l’action.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <article className="glass-panel-soft rounded-3xl p-8 shadow-sm"><h2 className="text-2xl font-bold text-[color:var(--site-heading)]">Avant l’appel</h2><p className="mt-4 leading-relaxed text-[color:var(--site-text)]">On prépare l’essentiel : ton idée, ton objectif, le type de création souhaité, le style recherché et le contexte de diffusion.</p></article>
          <article className="glass-panel-soft rounded-3xl p-8 shadow-sm"><h2 className="text-2xl font-bold text-[color:var(--site-heading)]">Pendant l’appel</h2><p className="mt-4 leading-relaxed text-[color:var(--site-text)]">On clarifie l’intention, le ton, le format, le niveau de personnalisation et les priorités. L’idée est de transformer un concept flou en direction précise.</p></article>
          <article className="glass-panel-soft rounded-3xl p-8 shadow-sm"><h2 className="text-2xl font-bold text-[color:var(--site-heading)]">Après l’appel</h2><p className="mt-4 leading-relaxed text-[color:var(--site-text)]">Tu repars avec une vision plus claire, une prochaine étape concrète et un point de contact direct pour lancer la production.</p></article>
        </div>

        <div className="warm-cta-panel mt-10 rounded-3xl p-10 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.25fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-bold text-[color:var(--site-heading)]">Prêt à en parler?</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-[color:var(--site-text)]">Le moyen le plus simple est maintenant de choisir ton créneau directement sur le site. Si tu préfères, tu peux aussi m'écrire avec ton idée pour que je te guide vers la bonne formule.</p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row lg:flex-col xl:flex-row">
                <ContactPrefillLink href="/contact?projectType=autre&message=Bonjour, je veux discuter de mon projet avec Création Nowis." className="inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">Parler de mon projet</ContactPrefillLink>
                <a href="mailto:simonmorin@nowis.store" className="inline-flex rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-5 py-3 font-semibold text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)]/40 hover:bg-white">simonmorin@nowis.store</a>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/80 p-2 shadow-2xl shadow-black/10 backdrop-blur">
              <BookingEmbed
                url={bookingUrl}
                title="Calendrier de reservation Creation Nowis"
                minHeight={700}
                className="w-full rounded-[1.25rem] bg-white"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

