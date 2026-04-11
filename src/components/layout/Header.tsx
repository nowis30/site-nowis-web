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

  return (
    <header className="sticky top-0 z-[90] border-b border-white/10 bg-[#07101f]/88 backdrop-blur-2xl shadow-card supports-[backdrop-filter]:bg-[#07101f]/78">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-white transition-colors hover:text-primary-200">
          <span className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-coal-950 shadow-fire">
            <Image src="/nowis.png" alt="Logo Creation Nowis" fill className="object-contain p-1" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.32em] text-primary-200">Creation Nowis</span>
            <span className="brand-metal-text block font-display text-xl leading-none md:text-2xl">Nowis Morin</span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 hover:text-primary-100 ${pathname === link.href ? 'text-primary-300' : 'text-slate-200'}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/connexion"
            className="ml-2 rounded-xl border border-primary-400/40 bg-primary-500/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary-500/25"
          >
            Portail client
          </Link>
        </div>

        <button
          type="button"
          className="lg:hidden rounded-xl border border-white/10 p-2 text-slate-100 transition-colors hover:bg-white/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu mobile"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-main-menu"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        {isMenuOpen ? (
          <div className="fixed inset-0 top-[5.25rem] z-[95] lg:hidden">
            <button type="button" aria-label="Fermer le menu" className="absolute inset-0 bg-black/70" onClick={() => setIsMenuOpen(false)} />
            <div id="mobile-main-menu" className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto border-t border-white/10 bg-[#050816] px-5 pb-8 pt-5">
              <div className="mx-auto flex max-w-md flex-col gap-3">
                <div className="mb-1 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-200">Navigation</p>
                  <p className="mt-1 text-sm text-slate-300">Creation Nowis — Nowis Morin</p>
                </div>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-2xl border border-white/10 px-5 py-4 text-base font-semibold text-white transition hover:border-primary-400/40 hover:bg-slate-800 ${pathname === link.href ? 'bg-slate-800 border-primary-400/30' : 'bg-slate-900'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/connexion"
                  className="mt-2 rounded-2xl bg-brand-warm px-6 py-4 text-center text-base font-semibold text-white shadow-fire transition-all hover:brightness-110"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Portail client
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
};
