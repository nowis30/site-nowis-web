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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-coal-950/40" />
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="relative max-w-4xl">
          {eyebrow ? <p className="brand-chip">{eyebrow}</p> : null}
          <h1 className="mt-5 font-display text-5xl leading-[0.92] text-white md:text-7xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">{description}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
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
