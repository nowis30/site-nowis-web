/**
 * Header Component - Création NOWIS
 * Navigation professionnelle et épurée pour un studio créatif
 * ÉDITABLE: Modifie les liens de navigation dans la liste `navLinks`.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Musique', href: '/musique' },
  { label: 'Vidéos', href: '/videos' },
  { label: 'Services', href: '/services' },
  { label: 'Jeux', href: '/jeux' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Logements', href: '/logements' },
  { label: 'Contact', href: '/contact' },
];

const resourceLinks: NavLink[] = [
  { label: 'Commander une chanson', href: '/commander-une-chanson' },
  { label: 'Assistant projet', href: '/assistant-projet' },
  { label: 'Idées', href: '/idees' },
];

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3 text-white transition-colors hover:text-emerald-300">
          <span className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Image src="/hero.jpg" alt="Nowis Morin" fill className="object-cover" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Artiste & créateur IA</span>
            <span className="block text-lg font-bold md:text-xl">Nowis Morin</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-200 transition-colors duration-200 hover:text-emerald-300"
            >
              {link.label}
            </Link>
          ))}

          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 transition-colors duration-200 hover:text-emerald-300"
            >
              Ressources
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="invisible absolute right-0 top-full z-50 mt-4 w-72 rounded-2xl border border-white/10 bg-slate-950/95 p-3 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5 hover:text-emerald-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/shop"
            className="text-sm font-medium text-slate-200 transition-colors duration-200 hover:text-emerald-300"
          >
            🛍️ Boutique
          </Link>

          <ContactPrefillLink
            href="/contact"
            className="ml-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-slate-200"
          >
            Me contacter
          </ContactPrefillLink>

          {loading ? null : user ? (
            <>
              <Link
                href="/proprietaire"
                className="rounded-xl border border-emerald-400/40 px-4 py-2 font-medium text-emerald-300 transition-colors hover:bg-emerald-400/10"
              >
                Mon espace
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-white/10 px-4 py-2 font-medium text-white transition-colors hover:bg-white/15"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="rounded-xl border border-white/10 px-4 py-2 font-medium text-slate-200 transition-colors hover:bg-white/5"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
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
          <div className="absolute top-full left-0 right-0 border-b border-white/10 bg-slate-950 md:hidden flex flex-col shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-white/10 px-6 py-4 text-slate-200 transition-colors hover:bg-white/5 hover:text-emerald-300 last:border-b-0"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-b border-white/10 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Ressources</p>
              <div className="mt-3 flex flex-col">
                {resourceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-3 py-3 text-slate-200 transition-colors hover:bg-white/5 hover:text-emerald-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/shop"
              className="border-b border-white/10 px-6 py-4 text-slate-200 transition-colors hover:bg-white/5 hover:text-emerald-300"
              onClick={() => setIsMenuOpen(false)}
            >
              🛍️ Boutique
            </Link>

            <ContactPrefillLink
              href="/contact"
              className="m-4 rounded-xl bg-white px-6 py-3 text-center font-semibold text-slate-950 transition-colors hover:bg-slate-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Me contacter
            </ContactPrefillLink>

            {!loading && (
              <div className="px-6 py-4 border-t border-gray-100">
                {user ? (
                  <>
                    <Link
                      href="/proprietaire"
                      className="block w-full rounded-xl border border-emerald-400/40 px-4 py-2 text-center font-medium text-emerald-300 transition-colors hover:bg-emerald-400/10"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Mon espace
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="mt-3 w-full rounded-xl bg-white/10 px-4 py-2 font-medium text-white transition-colors hover:bg-white/15"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/connexion"
                      className="block w-full rounded-xl border border-white/10 px-4 py-2 text-center font-medium text-slate-200 transition-colors hover:bg-white/5"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/inscription"
                      className="mt-3 block w-full rounded-xl bg-emerald-500 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-emerald-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Inscription
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

