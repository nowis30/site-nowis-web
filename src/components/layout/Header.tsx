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

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Logements', href: '/logements' },
  { label: 'Créations', href: '/#creations' },
  { label: 'À propos', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
          Création NOWIS
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* Profile Photo */}
          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary-600 shadow-md">
            <Image
              src="/hero.jpg"
              alt="Simon - Création NOWIS"
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/shop"
            className="text-gray-700 hover:text-secondary-600 font-medium transition-colors duration-200"
          >
            🛍️ Boutique
          </Link>

          <Link
            href="/booking"
            className="ml-4 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Parler de mon projet
          </Link>

          {loading ? null : user ? (
            <>
              <Link
                href="/proprietaire"
                className="px-4 py-2 rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors font-medium"
              >
                Mon espace
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors font-medium"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
              >
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu mobile"
        >
          <svg
            className="w-6 h-6 text-gray-700"
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
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 md:hidden flex flex-col shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-6 py-4 transition-colors border-b border-gray-100 last:border-b-0"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/shop"
              className="text-gray-700 hover:text-secondary-600 hover:bg-gray-50 px-6 py-4 transition-colors border-b border-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              🛍️ Boutique
            </Link>

            <Link
              href="/booking"
              className="m-4 px-6 py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Parler de mon projet
            </Link>

            {!loading && (
              <div className="px-6 py-4 border-t border-gray-100">
                {user ? (
                  <>
                    <Link
                      href="/proprietaire"
                      className="block w-full text-center px-4 py-2 rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors font-medium"
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
                      className="mt-3 w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors font-medium"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/connexion"
                      className="block w-full text-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/inscription"
                      className="mt-3 block w-full text-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
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

