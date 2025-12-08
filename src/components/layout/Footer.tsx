/**
 * Footer Component
 * Pied de page avec liens sociaux et copyright.
 * ÉDITABLE: Ajoute tes liens de réseaux sociaux dans `socialLinks`.
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

const socialLinks: SocialLink[] = [
  // TODO: MODIFIER - Ajoute tes liens de réseaux sociaux
  { label: 'Twitter', url: 'https://twitter.com/nowis', icon: '𝕏' },
  { label: 'Instagram', url: 'https://instagram.com/nowis', icon: '📷' },
  { label: 'LinkedIn', url: 'https://linkedin.com/company/nowis', icon: '🔗' },
  { label: 'Discord', url: 'https://discord.com/invite/nowis', icon: '💬' },
  { label: 'Boutique', url: '/shop', icon: '🛍️' },
];

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-2xl font-bold text-primary-600 mb-2">Création NOWIS</h3>
            <p className="text-gray-400 text-sm">
              Studio créatif propulsé par l'intelligence artificielle.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-gray-400 hover:text-white transition-colors">
                  Rendez-vous
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                📧 <a href="mailto:simonmorin@nowis.store" className="hover:text-white transition-colors">simonmorin@nowis.store</a>
              </li>
              <li className="text-gray-400">
                📞 <a href="tel:+18193883407" className="hover:text-white transition-colors">(819) 388-3407</a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Réseaux Sociaux</h4>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors text-lg"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          {/* Copyright */}
          <p className="text-center text-gray-500 text-sm">
            © {currentYear} Création NOWIS. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

