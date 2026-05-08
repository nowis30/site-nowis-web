import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';
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
  theme?: 'light' | 'dark';
};

function SectionHeader({ eyebrow, title, description, centered = false, theme = 'dark' }: SectionHeaderProps) {
  const titleClass = theme === 'dark' ? 'text-[color:var(--site-heading)]' : 'text-slate-950';
  const descClass = theme === 'dark' ? 'text-[color:var(--site-muted)]' : 'text-slate-600';
  const eyebrowClass = theme === 'dark' ? 'text-[color:var(--site-accent-strong)]' : 'text-primary-600';

  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? (
        <p className={`text-sm font-semibold uppercase tracking-[0.28em] ${eyebrowClass}`}>{eyebrow}</p>
      ) : null}
      <h2 className={`mt-4 font-display text-3xl leading-[1.05] md:text-5xl ${titleClass}`}>{title}</h2>
      {description ? <p className={`mt-4 max-w-2xl text-base leading-8 md:text-lg ${descClass}`}>{description}</p> : null}
    </div>
  );
}

export function SongTrustStrip() {
  return (
    <section className="section-soft border-y border-[rgba(131,97,67,0.08)] backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
        {songTrustItems.map((item) => (
          <article key={item.title} className="glass-panel-soft rounded-[1.5rem] px-5 py-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--site-accent-strong)]">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SongHowItWorksSection({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const sectionText = theme === 'dark' ? 'text-[color:var(--site-heading)]' : 'text-slate-950';
  const cardClass = theme === 'dark'
    ? 'glass-panel-soft p-8'
    : 'rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm';
  const labelClass = theme === 'dark' ? 'text-[color:var(--site-accent-strong)]' : 'text-primary-600';
  const bodyClass = theme === 'dark' ? 'text-[color:var(--site-muted)]' : 'text-slate-600';

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow="Comment ça fonctionne"
        title="Une commande simple, claire et guidée du début à la fin"
        description="Le processus reste volontairement direct pour que l’offre soit facile à comprendre et rapide à lancer."
        theme={theme}
      />

      <ol className="mt-10 grid list-none gap-6 lg:grid-cols-3">
        {songProcessSteps.map((item, index) => (
          <li key={item.step} className={cardClass}>
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-warm text-lg font-bold text-white shadow-fire">
                {index + 1}
              </span>
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${labelClass}`}>{item.step}</p>
              </div>
            </div>
            <h3 className={`mt-6 font-display text-3xl leading-[1.08] ${sectionText}`}>{item.title}</h3>
            <p className={`mt-4 text-base leading-7 ${bodyClass}`}>{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

type SongHowItWorksSectionData = {
  eyebrow?: string;
  title?: string;
  description?: string;
  steps?: Array<{ step: string; title: string; description: string }>;
};

export function SongHowItWorksSectionWithData({
  theme = 'dark',
  data,
}: {
  theme?: 'light' | 'dark';
  data?: SongHowItWorksSectionData;
}) {
  const sectionText = theme === 'dark' ? 'text-[color:var(--site-heading)]' : 'text-slate-950';
  const cardClass = theme === 'dark'
    ? 'glass-panel-soft p-8'
    : 'rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm';
  const labelClass = theme === 'dark' ? 'text-[color:var(--site-accent-strong)]' : 'text-primary-600';
  const bodyClass = theme === 'dark' ? 'text-[color:var(--site-muted)]' : 'text-slate-600';

  const steps = data?.steps && data.steps.length > 0 ? data.steps : songProcessSteps;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow={data?.eyebrow || 'Comment ça fonctionne'}
        title={data?.title || 'Une commande simple, claire et guidée du début à la fin'}
        description={data?.description || 'Le processus reste volontairement direct pour que l’offre soit facile à comprendre et rapide à lancer.'}
        theme={theme}
      />

      <ol className="mt-10 grid list-none gap-6 lg:grid-cols-3">
        {steps.map((item, index) => (
          <li key={`${item.step}-${index}`} className={cardClass}>
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-warm text-lg font-bold text-white shadow-fire">
                {index + 1}
              </span>
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${labelClass}`}>{item.step}</p>
              </div>
            </div>
            <h3 className={`mt-6 font-display text-3xl leading-[1.08] ${sectionText}`}>{item.title}</h3>
            <p className={`mt-4 text-base leading-7 ${bodyClass}`}>{item.description}</p>
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
  eyebrow = 'Niveaux d’accompagnement',
  title = 'Plusieurs façons d’aborder un projet sur mesure',
  description = 'Le cœur du service reste la création d’une chanson personnalisée, avec un accompagnement ajusté à la nature du projet et à l’émotion recherchée.',
  showCardCta = false,
}: SongPackagesSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} theme="light" />

      <div className="mt-10 grid gap-6 xl:grid-cols-3">
        {songPackages.map((pack) => (
          <article
            key={pack.name}
            className={[
              'relative rounded-[2rem] border p-8 shadow-card transition backdrop-blur-sm',
              pack.featured
                ? 'border-primary-200 bg-primary-50/70 ring-2 ring-primary-200 xl:-translate-y-1'
                : 'border-slate-200 bg-white',
            ].join(' ')}
          >
            {pack.badge ? (
              <p className="inline-flex rounded-full bg-primary-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
                {pack.badge}
              </p>
            ) : null}
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-display text-3xl leading-[1.08] text-slate-950">{pack.name}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{pack.description}</p>
              </div>
              <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">{pack.note}</p>
            </div>

            <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
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
        theme="light"
      />

      <div className="mt-10 flex flex-wrap gap-3">
        {songProjectTypes.map((item) => (
          <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function SongVideoExtrasSection({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const mainCard = theme === 'dark'
    ? 'glass-panel-strong p-8 text-[color:var(--site-heading)] md:p-10'
    : 'rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-900 shadow-sm md:p-10';
  const labelClass = theme === 'dark' ? 'text-[color:var(--site-accent-strong)]' : 'text-primary-600';
  const titleClass = theme === 'dark' ? 'text-[color:var(--site-heading)]' : 'text-slate-950';
  const bodyClass = theme === 'dark' ? 'text-[color:var(--site-muted)]' : 'text-slate-600';
  const noteClass = theme === 'dark'
    ? 'mt-5 rounded-2xl border border-[rgba(131,97,67,0.12)] bg-white/72 px-5 py-4 text-sm leading-6 text-[color:var(--site-muted)]'
    : 'mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-700';

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div className={mainCard}>
          <p className={`text-sm font-semibold uppercase tracking-[0.28em] ${labelClass}`}>Complément créatif</p>
          <h2 className={`mt-4 font-display text-4xl leading-[1.05] md:text-5xl ${titleClass}`}>Option visuelle et vidéo IA</h2>
          <p className={`mt-5 text-base leading-8 md:text-lg ${bodyClass}`}>
            Je peux aussi ajouter un visuel ou une capsule vidéo IA pour accompagner votre chanson. Le rendu est créatif, joli et marquant, mais le cœur du service reste la musique.
          </p>
          <p className={noteClass}>
            Cette section est présentée comme un complément. Elle sert à prolonger l’émotion de la chanson, pas à remplacer le service principal.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {videoExtraOptions.map((option) => (
            <article key={option.name} className="brand-card-light p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Extra visuel</p>
              <h3 className="mt-4 font-display text-3xl leading-[1.08] text-slate-950">{option.name}</h3>
              <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">{option.note}</p>
              <p className="mt-4 text-base leading-7 text-slate-600">{option.description}</p>
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
      <h2 className="mt-4 font-display text-4xl leading-[1.06] text-slate-950 md:text-5xl">Une approche née de la musique, puis consolidée par l’IA</h2>
      <div className="mt-6 space-y-4 text-base leading-8 text-slate-700">
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
      <h2 className="mt-4 font-display text-4xl leading-[1.08] text-slate-950">Une garantie simple et lisible</h2>
      <p className="mt-4 text-base leading-8 text-slate-700">{satisfactionGuarantee.text}</p>
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
    <section className="warm-cta-panel p-8 shadow-card md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Prêt à lancer la demande</p>
      <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">Un projet musical simple à lancer, sans complication</h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)] md:text-lg">
        Si tu veux passer à l’action, tu peux lancer directement la demande ou commencer par m’expliquer le contexte. Le but est de garder une prise de contact simple, rassurante et humaine.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link
          href={SONG_REQUEST_GOOGLE_AUTH_URL}
          className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
        >
          Commander une chanson
        </Link>
        <ContactPrefillLink
          href={songSalesCtas.talk.href}
          className="inline-flex items-center justify-center rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/72 px-6 py-3 font-semibold text-[color:var(--site-heading)] transition hover:bg-white"
        >
          {songSalesCtas.talk.label}
        </ContactPrefillLink>
      </div>
    </section>
  );
}

type SongPackagesSectionData = {
  eyebrow?: string;
  title?: string;
  description?: string;
  packages?: typeof songPackages;
};

export function SongPackagesSectionWithData({
  data,
  showCardCta = false,
}: {
  data?: SongPackagesSectionData;
  showCardCta?: boolean;
}) {
  const packs = data?.packages && data.packages.length > 0 ? data.packages : songPackages;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeader
        eyebrow={data?.eyebrow || 'Niveaux d’accompagnement'}
        title={data?.title || 'Plusieurs façons d’aborder un projet sur mesure'}
        description={data?.description || 'Le cœur du service reste la création d’une chanson personnalisée, avec un accompagnement ajusté à la nature du projet et à l’émotion recherchée.'}
        theme="light"
      />

      <div className="mt-10 grid gap-6 xl:grid-cols-3">
        {packs.map((pack) => (
          <article
            key={pack.name}
            className={[
              'relative rounded-[2rem] border p-8 shadow-card transition backdrop-blur-sm',
              pack.featured
                ? 'border-primary-200 bg-primary-50/70 ring-2 ring-primary-200 xl:-translate-y-1'
                : 'border-slate-200 bg-white',
            ].join(' ')}
          >
            {pack.badge ? (
              <p className="inline-flex rounded-full bg-primary-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
                {pack.badge}
              </p>
            ) : null}
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-display text-3xl leading-[1.08] text-slate-950">{pack.name}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{pack.description}</p>
              </div>
              <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">{pack.note}</p>
            </div>

            <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
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

type SongFinalCtaData = {
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export function SongFinalCtaSectionWithData({ data }: { data?: SongFinalCtaData }) {
  const primary = data?.primaryCta || { label: 'Commander une chanson', href: SONG_REQUEST_GOOGLE_AUTH_URL };
  const secondary = data?.secondaryCta || { label: songSalesCtas.talk.label, href: songSalesCtas.talk.href };

  return (
    <section className="warm-cta-panel p-8 shadow-card md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">{data?.eyebrow || 'Prêt à lancer la demande'}</p>
      <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">{data?.title || 'Un projet musical simple à lancer, sans complication'}</h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)] md:text-lg">
        {data?.description || 'Si tu veux passer à l’action, tu peux lancer directement la demande ou commencer par m’expliquer le contexte. Le but est de garder une prise de contact simple, rassurante et humaine.'}
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link
          href={primary.href}
          className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
        >
          {primary.label}
        </Link>
        <ContactPrefillLink
          href={secondary.href}
          className="inline-flex items-center justify-center rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/72 px-6 py-3 font-semibold text-[color:var(--site-heading)] transition hover:bg-white"
        >
          {secondary.label}
        </ContactPrefillLink>
      </div>
    </section>
  );
}
