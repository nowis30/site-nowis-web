/**
 * Header Component - Creation Nowis
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Jeux', href: '/jeux' },
  { label: 'Ateliers', href: '/ateliers' },
  { label: 'Chansons personnalisees', href: '/commander-une-chanson' },
  { label: 'A propos', href: '/a-propos' },
  { label: 'Autres services', href: '/autres-services' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Contact', href: '/contact' },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) { document.body.style.removeProperty('overflow'); return; }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.removeProperty('overflow'); };
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
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-[120] border-b border-[rgba(131,97,67,0.12)] bg-[rgba(252,247,241,0.88)] backdrop-blur-xl shadow-[0_16px_36px_rgba(99,65,38,0.08)] supports-[backdrop-filter]:bg-[rgba(252,247,241,0.78)]">
      <nav className="relative z-[123] mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="relative z-[123] flex items-center gap-3 text-[color:var(--site-heading)] transition-colors hover:text-[color:var(--site-accent-strong)]">
          <span className="relative h-12 w-12 overflow-hidden rounded-full border border-[rgba(131,97,67,0.12)] bg-[linear-gradient(180deg,#fffaf4_0%,#f1e1cb_100%)] shadow-[0_14px_26px_rgba(188,124,77,0.18)]">
            <Image src="/nowis.png" alt="Logo Creation Nowis" fill className="object-contain p-1" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--site-accent-strong)]">Creation Nowis</span>
            <span className="brand-metal-text block font-display text-xl leading-none md:text-2xl">Nowis Morin</span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 hover:text-[color:var(--site-accent-strong)] ${pathname === link.href ? 'text-[color:var(--site-accent-strong)]' : 'text-[color:var(--site-muted)]'}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/connexion"
            className="cta-primary ml-2 px-5 py-2.5 text-sm"
          >
            Portail client
          </Link>
        </div>

        <button
          type="button"
          className="relative z-[123] touch-manipulation rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/60 p-2 text-[color:var(--site-heading)] transition-colors hover:bg-white md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu mobile"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-main-menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        {isMenuOpen ? (
          <>
            <button
              type="button"
              aria-label="Fermer le menu"
              className="fixed inset-0 z-[121] bg-[rgba(75,48,28,0.24)] md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="fixed inset-x-3 top-20 z-[122] md:hidden">
              <div
                id="mobile-main-menu"
                className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[1.75rem] border border-[rgba(131,97,67,0.14)] bg-[linear-gradient(180deg,rgba(255,250,245,0.99),rgba(244,233,218,0.99))] px-5 pb-6 pt-5 shadow-[0_28px_60px_rgba(107,72,42,0.22)]"
              >
                <div className="mx-auto flex max-w-md flex-col gap-3">
                  <div className="mb-1 rounded-2xl border border-[rgba(201,117,71,0.16)] bg-white/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">Navigation</p>
                    <p className="mt-1 text-sm text-[color:var(--site-muted)]">Creation Nowis — Nowis Morin</p>
                  </div>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-2xl border px-5 py-4 text-base font-semibold transition ${pathname === link.href ? 'border-[rgba(201,117,71,0.22)] bg-[rgba(255,255,255,0.7)] text-[color:var(--site-accent-strong)]' : 'border-[rgba(131,97,67,0.1)] bg-[rgba(255,255,255,0.56)] text-[color:var(--site-heading)] hover:border-[rgba(201,117,71,0.18)] hover:bg-white'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/connexion"
                    className="cta-primary mt-2 px-6 py-4 text-center text-base"
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
