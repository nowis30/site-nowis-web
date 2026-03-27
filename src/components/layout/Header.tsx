/**
 * Header Component - Création NOWIS
 * Navigation professionnelle et épurée pour un studio créatif
 * ÉDITABLE: Modifie les liens de navigation dans la liste `navLinks`.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Accès client', href: '/client' },
  { label: 'CRM', href: '/crm' },
  { label: 'Commander une chanson', href: '/commander-une-chanson' },
  { label: 'Artistes', href: '/artistes' },
  { label: 'Exemples', href: '/musique' },
  { label: 'Contact', href: '/contact' },
];

const resourceLinks: NavLink[] = [
  { label: 'Musique', href: '/musique' },
  { label: 'Vidéos', href: '/videos' },
  { label: 'Services créatifs', href: '/services' },
  { label: 'Assistant projet', href: '/assistant-projet' },
  { label: 'À propos', href: '/a-propos' },
];

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07101f]/72 backdrop-blur-2xl shadow-card supports-[backdrop-filter]:bg-[#07101f]/60">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3 text-white transition-colors hover:text-primary-200">
          <span className="brand-emblem relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-coal-950 shadow-fire">
            <Image src="/nowis.png" alt="Logo Nowis" fill className="object-contain p-1" />
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

          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-100 transition-colors duration-200 hover:text-primary-100"
            >
              Ressources
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="invisible absolute right-0 top-full z-50 mt-4 w-72 rounded-2xl border border-white/10 bg-[#09101f]/92 p-3 opacity-0 shadow-card backdrop-blur-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl px-4 py-3 text-sm text-slate-100 transition-colors hover:bg-primary-500/12 hover:text-primary-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <ContactPrefillLink
            href="/contact?projectType=chanson&message=Bonjour, je veux discuter d’une chanson personnalisée."
            className="ml-2 rounded-xl bg-brand-warm px-5 py-2.5 text-sm font-semibold text-white shadow-fire transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Commander une chanson
          </ContactPrefillLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden rounded-xl border border-white/10 p-2 text-slate-100 transition-colors hover:bg-white/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu mobile"
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
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 flex flex-col border-b border-white/10 bg-[#07101f]/94 shadow-card backdrop-blur-2xl md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-white/10 px-6 py-4 text-slate-200 transition-colors hover:bg-primary-500/12 hover:text-primary-100 last:border-b-0"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-b border-white/10 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">Ressources</p>
              <div className="mt-3 flex flex-col">
                {resourceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-3 py-3 text-slate-200 transition-colors hover:bg-primary-500/12 hover:text-primary-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <ContactPrefillLink
              href="/contact?projectType=chanson&message=Bonjour, je veux discuter d’une chanson personnalisée."
              className="m-4 rounded-xl bg-brand-warm px-6 py-3 text-center font-semibold text-white shadow-fire transition-all hover:brightness-110"
              onClick={() => setIsMenuOpen(false)}
            >
              Commander une chanson
            </ContactPrefillLink>
          </div>
        )}
      </nav>
    </header>
  );
};

