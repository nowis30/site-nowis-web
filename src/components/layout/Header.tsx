/**
 * Header Component - Creation Nowis
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { House } from 'lucide-react';
import { rentalsPublicUrl } from '@/lib/rentals-url';
import { trackRentalSiteClick } from '@/lib/tracking/google';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Jeux', href: '/jeux' },
  { label: 'Ateliers', href: '/ateliers' },
  { label: 'Chansons personnalisées', href: '/commander-une-chanson' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Services', href: '/services' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Contact', href: '/contact' },
];

const desktopNavLinks = navLinks.filter((link) =>
  ['Accueil', 'Jeux', 'Ateliers', 'Services', 'Tarifs', 'Contact'].includes(link.label),
);

const tabletQuickLinks = [
  { label: 'Musique', href: '/musique' },
  { label: 'Jeux', href: '/jeux' },
  { label: 'Services', href: '/services' },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1200) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function trackRentalClick(location: 'header' | 'footer' | 'home_feature' | 'home_card') {
    try {
      trackRentalSiteClick(location, rentalsPublicUrl);
    } catch {
      // Analytics must never block navigation.
    }
  }

  function isNavActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[120] border-b border-[rgba(131,97,67,0.12)] bg-[rgba(252,247,241,0.88)] shadow-[0_16px_36px_rgba(99,65,38,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(252,247,241,0.78)]">
      <nav
        className="relative z-[123] mx-auto flex max-w-[92rem] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 md:px-8 md:py-4 min-[1200px]:px-10"
        aria-label="Navigation principale"
      >
        <Link
          href="/"
          className="relative z-[123] flex min-w-0 items-center gap-3 text-[color:var(--site-heading)] transition-colors hover:text-[color:var(--site-accent-strong)]"
          aria-label="Retour à l’accueil Création Nowis"
        >
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[rgba(131,97,67,0.12)] bg-[linear-gradient(180deg,#fffaf4_0%,#f1e1cb_100%)] shadow-[0_14px_26px_rgba(188,124,77,0.18)] sm:h-12 sm:w-12">
            <Image src="/nowis.png" alt="Logo Création Nowis" fill className="object-contain p-1" sizes="48px" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent-strong)] sm:text-xs sm:tracking-[0.3em]">
              Création Nowis
            </span>
            <span className="brand-metal-text block truncate font-display text-lg leading-none sm:text-xl min-[1200px]:text-2xl">Nowis Morin</span>
          </span>
        </Link>

        {/* Tablette: accès rapide + menu complémentaire. */}
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex min-[1200px]:hidden">
          <div className="hidden items-center gap-1.5 min-[860px]:flex">
            {tabletQuickLinks.map((link) => {
              const active = isNavActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-[color:var(--site-accent-soft)] text-[color:var(--site-accent-strong)]'
                      : 'text-[color:var(--site-muted)] hover:bg-white/70 hover:text-[color:var(--site-heading)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <Link href="/connexion" className="cta-primary min-h-10 shrink-0 px-4 py-2 text-sm">
            Portail
          </Link>
          <button
            type="button"
            className="inline-flex h-10 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl border border-[rgba(131,97,67,0.14)] bg-white/75 px-3 text-sm font-semibold text-[color:var(--site-heading)] shadow-sm transition-colors hover:bg-white"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Fermer le menu principal' : 'Ouvrir le menu principal'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-main-menu"
          >
            <span>Menu</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 7h16M4 12h16M4 17h16'}
              />
            </svg>
          </button>
        </div>

        {/* Ordinateur: navigation horizontale plus riche. */}
        <div className="hidden min-w-0 items-center gap-2 min-[1200px]:flex min-[1380px]:gap-3">
          {desktopNavLinks.map((link) => {
            const active = isNavActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors duration-200 min-[1380px]:px-3 min-[1380px]:text-sm ${
                  active
                    ? 'bg-[color:var(--site-accent-soft)] text-[color:var(--site-accent-strong)]'
                    : 'text-[color:var(--site-muted)] hover:bg-white/65 hover:text-[color:var(--site-accent-strong)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href={rentalsPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group ml-1 inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[rgba(131,97,67,0.2)] bg-[rgba(255,252,247,0.96)] px-3 py-2 text-[13px] font-semibold text-[color:var(--site-heading)] shadow-[0_10px_20px_rgba(110,78,53,0.09)] transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(131,97,67,0.35)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/45 min-[1380px]:px-4 min-[1380px]:text-sm"
            aria-label="Ouvrir les logements à louer dans un nouvel onglet"
            onClick={() => trackRentalClick('header')}
          >
            <House size={16} aria-hidden="true" className="text-[color:var(--site-accent-strong)]" />
            <span className="hidden min-[1320px]:inline">Logements à louer</span>
            <span className="min-[1320px]:hidden">Logements</span>
          </a>
          <Link href="/connexion" className="cta-primary ml-1 min-h-10 shrink-0 px-4 py-2 text-[13px] min-[1380px]:px-5 min-[1380px]:text-sm">
            Portail client
          </Link>
        </div>

        {/* Mobile: interface volontairement minimale. */}
        <button
          type="button"
          className="relative z-[123] inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/70 text-[color:var(--site-heading)] shadow-sm transition-colors hover:bg-white md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? 'Fermer le menu principal' : 'Ouvrir le menu principal'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-main-menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>

        {isMenuOpen ? (
          <>
            <button
              type="button"
              aria-label="Fermer le menu"
              className="fixed inset-0 z-[121] bg-[rgba(75,48,28,0.24)] backdrop-blur-[2px] min-[1200px]:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="fixed inset-x-3 top-20 z-[122] min-[1200px]:hidden sm:inset-x-4 md:left-auto md:right-6 md:top-24 md:w-[min(30rem,calc(100vw-3rem))]">
              <div
                id="mobile-main-menu"
                className="max-h-[calc(100dvh-6rem)] overscroll-contain overflow-y-auto rounded-[1.75rem] border border-[rgba(131,97,67,0.14)] bg-[linear-gradient(180deg,rgba(255,250,245,0.99),rgba(244,233,218,0.99))] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 shadow-[0_28px_60px_rgba(107,72,42,0.22)] sm:px-5"
                aria-label="Menu principal"
              >
                <div className="mx-auto flex max-w-md flex-col gap-3">
                  <div className="mb-1 rounded-2xl border border-[rgba(201,117,71,0.16)] bg-white/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">Navigation</p>
                    <p className="mt-1 text-sm text-[color:var(--site-muted)]">Création Nowis — Nowis Morin</p>
                  </div>
                  {navLinks.map((link) => {
                    const active = isNavActive(link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex min-h-14 items-center rounded-2xl border px-5 py-3 text-base font-semibold transition ${
                          active
                            ? 'border-[rgba(201,117,71,0.22)] bg-[rgba(255,255,255,0.78)] text-[color:var(--site-accent-strong)] shadow-sm'
                            : 'border-[rgba(131,97,67,0.1)] bg-[rgba(255,255,255,0.56)] text-[color:var(--site-heading)] hover:border-[rgba(201,117,71,0.18)] hover:bg-white'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <a
                    href={rentalsPublicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(131,97,67,0.2)] bg-[rgba(255,252,247,0.95)] px-5 py-3 text-base font-semibold text-[color:var(--site-heading)] shadow-[0_10px_20px_rgba(107,72,42,0.12)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/45"
                    aria-label="Ouvrir les logements à louer dans un nouvel onglet"
                    onClick={() => {
                      trackRentalClick('header');
                      setIsMenuOpen(false);
                    }}
                  >
                    <House size={18} aria-hidden="true" className="text-[color:var(--site-accent-strong)]" />
                    Voir les logements à louer
                  </a>
                  <Link
                    href="/connexion"
                    className="cta-primary mt-2 min-h-14 px-6 py-3 text-center text-base"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Portail client
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </nav>
    </header>
  );
};