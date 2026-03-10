/**
 * Footer Component
 * Pied de page avec liens sociaux et copyright.
 * ÉDITABLE: Ajoute tes liens de réseaux sociaux dans `socialLinks`.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { socialLinks } from '@/config/socialLinks';

const footerPlatforms = [
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'facebook', label: 'Facebook', icon: '📘' },
  { key: 'spotify', label: 'Spotify', icon: '🎧' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'printify', label: 'Printify', icon: '🛍️' },
];

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950 py-14">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Nowis Morin</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Chansons, vidéos, visuels et projets créatifs propulsés par l’intelligence artificielle, avec une approche humaine, artistique et orientée résultat.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/musique" className="text-gray-400 hover:text-white transition-colors">
                  Musique
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-gray-400 hover:text-white transition-colors">
                  Vidéos
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-white transition-colors">
                  Services / Collaborations
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="text-gray-400 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                📧 <a href="mailto:simonmorin@nowis.store" className="hover:text-white transition-colors">simonmorin@nowis.store</a>
              </li>
              <li className="text-gray-400">
                📞 <a href="tel:+18193883407" className="hover:text-white transition-colors">(819) 388-3407</a>
              </li>
              <li>
                <Link href="/booking" className="text-gray-400 hover:text-white transition-colors">Réserver / parler de mon projet</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Plateformes & réseaux</h4>
            <div className="flex gap-4">
              {footerPlatforms.map(({ key, label, icon }) => {
                const url = socialLinks[key as keyof typeof socialLinks];
                if (!url) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors text-lg"
                  >
                    {icon}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 space-y-3">
          <p className="text-center text-gray-500 text-sm">
            © {currentYear} Nowis Morin. Tous droits réservés.
          </p>
          <p className="text-center text-gray-500 text-xs">
            Conformité à la <Link href="/confidentialite" className="underline hover:text-gray-300">Loi 25</Link> sur la protection des renseignements personnels. Nous collectons le minimum nécessaire, sur consentement, et vous pouvez demander l’accès, la rectification ou la suppression de vos données.
          </p>
        </div>
      </div>
    </footer>
  );
};

