'use client';

import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { launchOffer } from '@/data/launchOffer';

type LaunchOfferBannerProps = {
  variant?: 'global' | 'hero';
};

export function LaunchOfferBanner({ variant = 'global' }: LaunchOfferBannerProps) {
  const isGlobal = variant === 'global';

  return (
    <section
      aria-label="Offre de lancement"
      className={isGlobal ? 'px-6 pb-4 pt-4 md:pb-5 md:pt-5' : 'mt-7'}
    >
      <div className={isGlobal ? 'mx-auto max-w-7xl' : 'max-w-2xl'}>
        <div
          className={
            isGlobal
              ? 'overflow-hidden rounded-[1.75rem] border border-[rgba(184,111,61,0.18)] bg-[linear-gradient(135deg,rgba(255,252,247,0.96)_0%,rgba(248,236,221,0.98)_48%,rgba(241,224,205,0.98)_100%)] px-4 py-4 shadow-[0_16px_36px_rgba(143,81,40,0.12)] sm:px-5 md:px-6 md:py-5'
              : 'overflow-hidden rounded-[1.75rem] border border-[rgba(184,111,61,0.16)] bg-[linear-gradient(135deg,rgba(255,252,247,0.94)_0%,rgba(250,240,228,0.98)_55%,rgba(243,228,209,0.96)_100%)] px-5 py-5 shadow-[0_14px_30px_rgba(143,81,40,0.1)] md:px-6 md:py-6'
          }
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-[rgba(143,81,40,0.14)] bg-white/70 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent-strong)]">
                Offre limitée
              </span>
              <h2
                className={
                  isGlobal
                    ? 'mt-3 font-display text-[1.45rem] leading-[1.08] text-[color:var(--site-heading)] md:text-[1.8rem]'
                    : 'mt-3 font-display text-[1.7rem] leading-[1.04] text-[color:var(--site-heading)] md:text-[2rem]'
                }
              >
                {launchOffer.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--site-muted)] md:text-[1rem]">
                {launchOffer.description}
              </p>
              <p className="mt-2 text-xs leading-6 text-[color:var(--site-soft)] md:text-sm">
                {launchOffer.note}
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-auto lg:min-w-[220px]">
              <ContactPrefillLink
                href={launchOffer.ctaHref}
                className="cta-primary inline-flex w-full items-center justify-center px-6 py-3.5 text-sm sm:text-base lg:w-auto"
              >
                {launchOffer.ctaLabel}
              </ContactPrefillLink>
              <p className="text-center text-[11px] leading-5 text-[color:var(--site-soft)] lg:text-right">
                Nouveaux projets uniquement
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}