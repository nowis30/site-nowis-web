import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export function PageHero({ eyebrow, title, description, primaryCta, secondaryCta }: PageHeroProps) {
  return (
    <section className="brand-shell brand-grid">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,13,0.16)_0%,rgba(9,10,13,0.28)_35%,rgba(9,10,13,0.62)_100%)]" />
      <div className="mx-auto max-w-7xl px-6 py-18 md:py-24 lg:py-28">
        <div className="relative max-w-5xl">
          {eyebrow ? <p className="brand-chip">{eyebrow}</p> : null}
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.02] text-white md:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">{description}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {primaryCta ? (
                primaryCta.href.startsWith('/contact') ? (
                  <ContactPrefillLink href={primaryCta.href} className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110">
                    {primaryCta.label}
                  </ContactPrefillLink>
                ) : (
                  <Link href={primaryCta.href} className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110">
                    {primaryCta.label}
                  </Link>
                )
              ) : null}
              {secondaryCta ? (
                secondaryCta.href.startsWith('/contact') ? (
                  <ContactPrefillLink href={secondaryCta.href} className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-primary-500/10">
                    {secondaryCta.label}
                  </ContactPrefillLink>
                ) : (
                  <Link href={secondaryCta.href} className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-primary-500/10">
                    {secondaryCta.label}
                  </Link>
                )
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
