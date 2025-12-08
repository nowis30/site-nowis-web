/**
 * JeuxScreen Component - Page d'accès aux jeux
 * Héritier Millionnaire + Drag Shift Duel
 */

'use client';

import React from 'react';
import { SectionTitle } from '@/components/ui';

interface Jeu {
  id: string;
  emoji: string;
  titre: string;
  description: string;
  lien: string;
  estExterne: boolean;
  badge?: string;
}

const jeux: Jeu[] = [
  {
    id: 'millionnaire',
    emoji: '💰',
    titre: 'Héritier Millionnaire',
    description: 'Jeu de finances personnelles mélant cashflow, immobilier, bourse, quiz et mini-jeux de dés. Construis ton patrimoine et deviens millionnaire !',
    lien: 'https://app.nowis.store/',
    estExterne: true,
    badge: '🔥 Populaire',
  },
  {
    id: 'drag',
    emoji: '🏎️',
    titre: 'Drag Shift Duel',
    description: 'Jeu de drag racing en 1 vs 1. Affronte tes amis dans des courses explosives ! Récompenses reliées à ton compte Millionnaire.',
    lien: 'https://nowis30.github.io/drag/',
    estExterne: true,
    badge: '🎮 Action',
  },
];

export const JeuxScreen: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 space-y-12 bg-gradient-to-b from-camp-night to-camp-purple min-h-screen">
      
      {/* Header */}
      <div className="text-center">
        <SectionTitle 
          title="🎮 Jeux NOWIS" 
          subtitle="Découvre nos jeux propulsés par l'IA et la créativité" 
        />
        <p className="text-camp-sand text-lg mt-4 max-w-3xl mx-auto">
          De la gestion financière au racing explosif, explore notre univers ludique. 
          Tous les jeux sont jouables sur mobile et desktop !
        </p>
      </div>

      {/* Grille de jeux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {jeux.map((jeu) => (
          <a
            key={jeu.id}
            href={jeu.lien}
            target={jeu.estExterne ? '_blank' : '_self'}
            rel={jeu.estExterne ? 'noreferrer' : undefined}
            className="bg-gradient-to-br from-camp-purple to-camp-violet rounded-camp p-8 border-2 border-camp-fire/40 shadow-camp hover:shadow-fire hover:scale-105 transition-all duration-300 group"
          >
            {/* Badge */}
            {jeu.badge && (
              <div className="inline-block mb-4 px-3 py-1 bg-camp-fire/20 border border-camp-fire rounded-full text-camp-flame text-sm font-semibold">
                {jeu.badge}
              </div>
            )}

            {/* Emoji + Titre */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{jeu.emoji}</div>
              <h3 className="text-2xl font-bold text-camp-cream group-hover:text-camp-flame transition-colors">
                {jeu.titre}
              </h3>
            </div>

            {/* Description */}
            <p className="text-camp-sand leading-relaxed mb-6">
              {jeu.description}
            </p>

            {/* Bouton CTA */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-camp-fire text-white rounded-lg font-semibold group-hover:bg-camp-flame transition-all">
              ▶ Jouer maintenant
              {jeu.estExterne && <span className="text-sm">↗</span>}
            </div>
          </a>
        ))}
      </div>

      {/* Section Téléchargements */}
      <div className="bg-gradient-to-br from-camp-violet to-camp-purple rounded-camp p-8 border-2 border-camp-flame/40 text-center">
        <h3 className="text-2xl font-bold text-camp-cream mb-4">
          📱 Télécharge les versions mobiles
        </h3>
        <p className="text-camp-sand mb-6">
          Télécharge les APK Android pour jouer hors-ligne et profiter de la version complète.
        </p>
        <a
          href="/telechargement.html"
          className="inline-block px-8 py-3 bg-camp-fire hover:bg-camp-flame text-white rounded-lg font-semibold transition-all duration-300 shadow-fire"
        >
          ⬇ Page de téléchargement
        </a>
      </div>

      {/* Call to Action */}
      <div className="text-center py-12">
        <p className="text-lg text-camp-sand mb-6">
          Tu as une idée de jeu ? Créons-le ensemble avec l'IA !
        </p>
        <a
          href="/booking"
          className="inline-block px-8 py-3 border-2 border-camp-flame text-camp-flame hover:bg-camp-flame hover:text-camp-night rounded-lg font-semibold transition-all duration-300"
        >
          🔥 Parler de mon projet de jeu
        </a>
      </div>
    </div>
  );
};
