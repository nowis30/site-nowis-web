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
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">{eyebrow}</p>
      ) : null}
      <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-lg leading-relaxed text-slate-600">{description}</p> : null}
    </div>
  );
}

export function SongTrustStrip() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
        {songTrustItems.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
            <p className="font-semibold text-slate-950">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
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
          <li key={item.step} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">{item.step}</p>
              </div>
            </div>
            <h3 className="mt-6 text-xl font-bold text-slate-950">{item.title}</h3>
            <p className="mt-4 leading-7 text-slate-600">{item.description}</p>
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
              'relative rounded-[2rem] border bg-white p-8 shadow-sm transition',
              pack.featured
                ? 'border-emerald-300 ring-2 ring-emerald-200 xl:-translate-y-2'
                : 'border-slate-200',
            ].join(' ')}
          >
            {pack.badge ? (
              <p className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                {pack.badge}
              </p>
            ) : null}
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-950">{pack.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{pack.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-slate-500">Prix fixe</p>
                <p className="text-3xl font-black text-slate-950">{pack.price}</p>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
              {pack.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {showCardCta ? (
              <Link
                href={songSalesCtas.order.href}
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
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
          <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
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
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Extra</p>
          <h2 className="mt-4 text-3xl font-bold">Option visuelle et vidéo IA</h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            Je peux aussi ajouter un visuel ou une capsule vidéo IA pour accompagner votre chanson. Le rendu est créatif, joli et marquant, mais le cœur du service reste la musique.
          </p>
          <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-6 text-slate-200">
            Cette section est présentée comme un complément. Elle sert à prolonger l’émotion de la chanson, pas à remplacer le service principal.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {videoExtraOptions.map((option) => (
            <article key={option.name} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Extra visuel</p>
              <h3 className="mt-4 text-2xl font-bold text-slate-950">{option.name}</h3>
              <p className="mt-3 text-3xl font-black text-slate-950">{option.price}</p>
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
    <section className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Pourquoi je fais ça</p>
      <h2 className="mt-4 text-3xl font-bold text-slate-950">Une approche née de la musique, puis consolidée par l’IA</h2>
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
    <article className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{satisfactionGuarantee.title}</p>
      <h2 className="mt-4 text-2xl font-bold text-slate-950">Une garantie simple et lisible</h2>
      <p className="mt-4 text-base leading-7 text-slate-700">{satisfactionGuarantee.text}</p>
      <p className="mt-4 text-sm leading-6 text-slate-600">{satisfactionGuarantee.note}</p>
    </article>
  );
}

export function SongPortfolioBlock() {
  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">{portfolioDisclosure.title}</p>
      <h2 className="mt-4 text-2xl font-bold text-slate-950">Diffusion seulement avec accord</h2>
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
    <section className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-8 text-white shadow-sm md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Prêt à lancer la demande</p>
      <h2 className="mt-4 text-3xl font-bold">Une offre pensée pour être claire, humaine et facile à acheter</h2>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
        Si tu veux passer à l’action, tu peux soit lancer directement la demande, soit me parler d’abord du contexte. L’objectif est de garder un processus simple et rassurant.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link
          href="#commande"
          className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          Commander une chanson
        </Link>
        <ContactPrefillLink
          href={songSalesCtas.talk.href}
          className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          {songSalesCtas.talk.label}
        </ContactPrefillLink>
      </div>
    </section>
  );
}
