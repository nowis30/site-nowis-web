import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  style?: {
    contentWidth?: 'compact' | 'normal' | 'wide';
    verticalSpacing?: 'tight' | 'normal' | 'airy';
    contentAlign?: 'left' | 'center';
    headingScale?: 'sm' | 'md' | 'lg';
    mobileSpacing?: 'inherit' | 'compact' | 'comfortable' | 'airy';
    mobileAlign?: 'inherit' | 'left' | 'center';
  };
};

function contentWidthClass(value: 'compact' | 'normal' | 'wide') {
  if (value === 'compact') return 'max-w-4xl';
  if (value === 'wide') return 'max-w-7xl';
  return 'max-w-5xl';
}

function spacingClass(value: 'tight' | 'normal' | 'airy') {
  if (value === 'tight') return 'py-14 md:py-18 lg:py-20';
  if (value === 'airy') return 'py-24 md:py-28 lg:py-32';
  return 'py-18 md:py-24 lg:py-28';
}

function headingClass(value: 'sm' | 'md' | 'lg') {
  if (value === 'sm') return 'text-3xl md:text-5xl lg:text-6xl';
  if (value === 'lg') return 'text-5xl md:text-7xl lg:text-8xl';
  return 'text-4xl md:text-6xl lg:text-7xl';
}

function mobileSpacingClass(value: 'inherit' | 'compact' | 'comfortable' | 'airy') {
  if (value === 'compact') return 'py-12 md:py-18 lg:py-20';
  if (value === 'comfortable') return 'py-20 md:py-24 lg:py-28';
  if (value === 'airy') return 'py-24 md:py-28 lg:py-32';
  return '';
}

function alignClass(contentAlign: 'left' | 'center', mobileAlign: 'inherit' | 'left' | 'center') {
  const desktop = contentAlign === 'center' ? 'md:text-center' : 'md:text-left';

  if (mobileAlign === 'center') return `text-center ${desktop}`;
  if (mobileAlign === 'left') return `text-left ${desktop}`;
  return contentAlign === 'center' ? 'text-center' : 'text-left';
}

export function PageHero({ eyebrow, title, description, primaryCta, secondaryCta, style }: PageHeroProps) {
  const contentWidth = contentWidthClass(style?.contentWidth || 'normal');
  const spacing = spacingClass(style?.verticalSpacing || 'normal');
  const mobileSpacing = mobileSpacingClass(style?.mobileSpacing || 'inherit');
  const heading = headingClass(style?.headingScale || 'md');
  const align = alignClass(style?.contentAlign || 'left', style?.mobileAlign || 'inherit');

  return (
    <section className="brand-shell brand-grid pointer-events-auto">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,247,238,0.28)_38%,rgba(242,227,207,0.72)_100%)]" />
      <div className={`relative z-10 mx-auto ${contentWidth} px-6 ${spacing} ${mobileSpacing}`}>
        <div className={`relative ${align}`}>
          {eyebrow ? <p className="brand-chip">{eyebrow}</p> : null}
          <h1 className={`mt-5 font-display ${heading} leading-[1.02] text-[color:var(--site-heading)] ${style?.contentAlign === 'center' ? 'mx-auto max-w-5xl' : 'max-w-4xl'}`}>{title}</h1>
          <p className={`mt-6 text-base leading-8 text-[color:var(--site-muted)] md:text-lg ${style?.contentAlign === 'center' ? 'mx-auto max-w-3xl' : 'max-w-2xl'}`}>{description}</p>
          {(primaryCta || secondaryCta) && (
            <div className={`mt-10 flex flex-col gap-4 sm:flex-row ${style?.contentAlign === 'center' ? 'justify-center' : ''}`}>
              {primaryCta ? (
                primaryCta.href.startsWith('/contact') ? (
                  <ContactPrefillLink href={primaryCta.href} className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(180deg,#d48b5d_0%,#bb6b43_100%)] px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-105">
                    {primaryCta.label}
                  </ContactPrefillLink>
                ) : (
                  <Link href={primaryCta.href} className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(180deg,#d48b5d_0%,#bb6b43_100%)] px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-105">
                    {primaryCta.label}
                  </Link>
                )
              ) : null}
              {secondaryCta ? (
                secondaryCta.href.startsWith('/contact') ? (
                  <ContactPrefillLink href={secondaryCta.href} className="inline-flex items-center justify-center rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/70 px-6 py-3 font-semibold text-[color:var(--site-heading)] backdrop-blur-sm transition hover:bg-white">
                    {secondaryCta.label}
                  </ContactPrefillLink>
                ) : (
                  <Link href={secondaryCta.href} className="inline-flex items-center justify-center rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/70 px-6 py-3 font-semibold text-[color:var(--site-heading)] backdrop-blur-sm transition hover:bg-white">
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
