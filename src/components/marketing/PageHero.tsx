import Link from 'next/link';

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export function PageHero({ eyebrow, title, description, primaryCta, secondaryCta }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-4xl">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">{eyebrow}</p> : null}
          <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">{description}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              {primaryCta ? (
                <Link href={primaryCta.href} className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">
                  {primaryCta.label}
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link href={secondaryCta.href} className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
