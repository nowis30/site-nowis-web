import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import {
  portfolioDisclosure,
  satisfactionGuarantee,
  songPackages,
  songProcessSteps,
  songProjectTypes,
  songSalesCtas,
  songTrustItems,
  videoExtraOptions,
  whyNowisParagraphs,
} from '@/data/songSales';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
};

function SectionHeader({ eyebrow, title, description, centered = false }: SectionHeaderProps) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">{eyebrow}</p>
      ) : null}
      <h2 className="mt-4 font-display text-4xl leading-none text-white md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-lg leading-relaxed text-slate-300">{description}</p> : null}
    </div>
  );
}

export function SongTrustStrip() {
  return (
    <section className="border-y border-white/10 bg-coal-950/70 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
        {songTrustItems.map((item) => (
          <article key={item.title} className="brand-card px-5 py-4">
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SongHowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="Comment ça fonctionne"
        title="Une commande simple, claire et guidée du début à la fin"
        description="Le processus reste volontairement direct pour que l’offre soit facile à comprendre et rapide à lancer."
      />

      <ol className="mt-10 grid list-none gap-6 lg:grid-cols-3">
        {songProcessSteps.map((item, index) => (
          <li key={item.step} className="brand-card p-8">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-warm text-lg font-bold text-white shadow-fire">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-300">{item.step}</p>
              </div>
            </div>
            <h3 className="mt-6 font-display text-3xl leading-none text-white">{item.title}</h3>
            <p className="mt-4 leading-7 text-slate-300">{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

type SongPackagesSectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  showCardCta?: boolean;
};

export function SongPackagesSection({
  eyebrow = 'Forfaits',
  title = 'Des forfaits fixes, lisibles et crédibles',
  description = 'L’offre est pensée pour être simple à comprendre. Le cœur du service reste la création d’une chanson personnalisée, avec un niveau d’accompagnement adapté au projet.',
  showCardCta = true,
}: SongPackagesSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />

      <div className="mt-10 grid gap-6 xl:grid-cols-3">
        {songPackages.map((pack) => (
          <article
            key={pack.name}
            className={[
              'relative rounded-[2rem] border p-8 shadow-card transition backdrop-blur-sm',
              pack.featured
                ? 'border-primary-300/60 bg-white/[0.08] ring-2 ring-primary-400/30 xl:-translate-y-2'
                : 'border-white/10 bg-white/[0.04]',
            ].join(' ')}
          >
            {pack.badge ? (
              <p className="inline-flex rounded-full bg-primary-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">
                {pack.badge}
              </p>
            ) : null}
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="font-display text-4xl leading-none text-white">{pack.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{pack.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-slate-400">Prix fixe</p>
                <p className="text-3xl font-black text-primary-200">{pack.price}</p>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-200">
              {pack.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-warm text-xs font-bold text-white">
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {showCardCta ? (
              <Link
                href={songSalesCtas.order.href}
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand-warm px-5 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
              >
                {songSalesCtas.order.label}
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function SongProjectTypesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="Types de projets"
        title="Des chansons pensées pour les moments qui comptent vraiment"
        description="Le service principal de Création Nowis est conçu pour des projets humains, émotionnels et faciles à raconter."
      />

      <div className="mt-10 flex flex-wrap gap-3">
        {songProjectTypes.map((item) => (
          <span key={item} className="rounded-full border border-primary-400/25 bg-primary-500/10 px-4 py-2 text-sm font-semibold text-primary-100 shadow-sm">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function SongVideoExtrasSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div className="brand-panel p-8 text-white md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-200">Extra</p>
          <h2 className="mt-4 font-display text-5xl leading-none">Option visuelle et vidéo IA</h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            Je peux aussi ajouter un visuel ou une capsule vidéo IA pour accompagner votre chanson. Le rendu est créatif, joli et marquant, mais le cœur du service reste la musique.
          </p>
          <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-6 text-slate-200">
            Cette section est présentée comme un complément. Elle sert à prolonger l’émotion de la chanson, pas à remplacer le service principal.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {videoExtraOptions.map((option) => (
            <article key={option.name} className="brand-card-light p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Extra visuel</p>
              <h3 className="mt-4 font-display text-4xl leading-none text-slate-950">{option.name}</h3>
              <p className="mt-3 text-3xl font-black text-primary-700">{option.price}</p>
              <p className="mt-4 leading-7 text-slate-600">{option.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyNowisSection() {
  return (
    <section className="brand-card-light p-8 md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">Pourquoi je fais ça</p>
      <h2 className="mt-4 font-display text-5xl leading-none text-slate-950">Une approche née de la musique, puis consolidée par l’IA</h2>
      <div className="mt-6 space-y-4 text-base leading-8 text-slate-600">
        {whyNowisParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export function SongGuaranteeBlock() {
  return (
    <article className="rounded-[2rem] border border-primary-200/70 bg-primary-50 p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">{satisfactionGuarantee.title}</p>
      <h2 className="mt-4 font-display text-4xl leading-none text-slate-950">Une garantie simple et lisible</h2>
      <p className="mt-4 text-base leading-7 text-slate-700">{satisfactionGuarantee.text}</p>
      <p className="mt-4 text-sm leading-6 text-slate-600">{satisfactionGuarantee.note}</p>
    </article>
  );
}

export function SongPortfolioBlock() {
  return (
    <article className="brand-card-light p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">{portfolioDisclosure.title}</p>
      <h2 className="mt-4 font-display text-4xl leading-none text-slate-950">Diffusion seulement avec accord</h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{portfolioDisclosure.text}</p>
      <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
        {portfolioDisclosure.options.map((option) => (
          <li key={option} className="flex gap-3">
            <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
              •
            </span>
            <span>{option}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function SongFinalCtaSection() {
  return (
    <section className="brand-shell rounded-[2rem] p-8 text-white shadow-card md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-200">Prêt à lancer la demande</p>
      <h2 className="mt-4 font-display text-5xl leading-none">Une offre pensée pour être claire, humaine et facile à acheter</h2>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
        Si tu veux passer à l’action, tu peux soit lancer directement la demande, soit me parler d’abord du contexte. L’objectif est de garder un processus simple et rassurant.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link
          href="#commande"
          className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
        >
          Commander une chanson
        </Link>
        <ContactPrefillLink
          href={songSalesCtas.talk.href}
          className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-primary-500/10"
        >
          {songSalesCtas.talk.label}
        </ContactPrefillLink>
      </div>
    </section>
  );
}
