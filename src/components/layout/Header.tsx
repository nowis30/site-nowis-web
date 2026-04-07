/**
 * Header Component - Création NOWIS
 * Navigation professionnelle et épurée pour un studio créatif
 * ÉDITABLE: Modifie les liens de navigation dans la liste `navLinks`.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Demandes client', href: '/commander-une-chanson' },
  { label: 'Ateliers', href: '/ateliers' },
  { label: 'Connexion', href: '/connexion' },
  { label: 'Inscription', href: '/inscription' },
  { label: 'Contact', href: '/contact' },
];

const resourceLinks: NavLink[] = [
  { label: 'Exemples musicaux', href: '/musique' },
  { label: 'Vidéos', href: '/videos' },
  { label: 'Demande d’atelier (compte requis)', href: '/ateliers/demande' },
  { label: 'Services créatifs', href: '/services' },
  { label: 'À propos', href: '/a-propos' },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const resourcesMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!resourcesMenuRef.current?.contains(event.target as Node)) {
        setIsResourcesOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsResourcesOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.removeProperty('overflow');
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [isMenuOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsResourcesOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <header className="sticky top-0 z-[90] border-b border-white/10 bg-[#07101f]/88 backdrop-blur-2xl shadow-card supports-[backdrop-filter]:bg-[#07101f]/78">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3 text-white transition-colors hover:text-primary-200">
          <span className="brand-emblem relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-coal-950 shadow-fire">
            <Image src="/logo_creation_nowis_1mo_max.jpg" alt="Logo Nowis" fill className="object-contain p-1" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.32em] text-primary-200">Création Nowis</span>
            <span className="brand-metal-text block font-display text-xl leading-none md:text-2xl">Chansons personnalisées</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-200 transition-colors duration-200 hover:text-primary-100"
            >
              {link.label}
            </Link>
          ))}

          <div ref={resourcesMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsResourcesOpen((current) => !current)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-100 transition-colors duration-200 hover:text-primary-100"
              aria-expanded={isResourcesOpen}
              aria-haspopup="menu"
            >
              Ressources
              <svg className={`h-4 w-4 transition-transform duration-200 ${isResourcesOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <div className={`${isResourcesOpen ? 'visible opacity-100 translate-y-0' : 'invisible -translate-y-1 opacity-0'} absolute right-0 top-full z-50 mt-4 w-72 rounded-2xl border border-white/10 bg-[#09101f]/92 p-3 shadow-card backdrop-blur-2xl transition-all duration-200`}>
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsResourcesOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm text-slate-100 transition-colors hover:bg-primary-500/12 hover:text-primary-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <ContactPrefillLink
            href="/inscription"
            className="ml-2 rounded-xl bg-brand-warm px-5 py-2.5 text-sm font-semibold text-white shadow-fire transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Creer mon compte
          </ContactPrefillLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden rounded-xl border border-white/10 p-2 text-slate-100 transition-colors hover:bg-white/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu mobile"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-main-menu"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>

        {/* Mobile Menu */}
        {isMenuOpen ? (
          <div className="fixed inset-0 top-[5.25rem] z-[95] md:hidden">
            <button
              type="button"
              aria-label="Fermer le menu"
              className="absolute inset-0 bg-black/70"
              onClick={() => setIsMenuOpen(false)}
            />
            <div
              id="mobile-main-menu"
              className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto border-t border-white/10 bg-[#050816] px-5 pb-8 pt-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="mx-auto flex max-w-md flex-col gap-3">
                <div className="mb-1 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-200">Navigation principale</p>
                  <p className="mt-1 text-sm text-slate-300">Choisissez une section du site.</p>
                </div>

                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4 text-base font-semibold text-white shadow-[0_8px_24px_rgba(2,6,23,0.28)] transition hover:border-primary-400/40 hover:bg-slate-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">Ressources</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {resourceLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-2xl border border-transparent bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-primary-400/30 hover:bg-primary-500/10 hover:text-white"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <ContactPrefillLink
                  href="/inscription"
                  className="mt-2 rounded-2xl bg-brand-warm px-6 py-4 text-center text-base font-semibold text-white shadow-fire transition-all hover:brightness-110"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Creer mon compte
                </ContactPrefillLink>
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
};

