/**
 * PortfolioScreen Component - Thème Camping 🏕️
 * Galerie T-shirts Etsy + Musiques Suno + Vidéos
 * 
 * 🎨 PERSONNALISATION:
 * - Ligne 25-33: Liste des T-shirts Etsy
 * - Ligne 36-44: Liste des musiques (WAV)
 * - Ligne 47-59: Liste des vidéos (MP4)
 */

'use client';

import React, { useState } from 'react';
import { SectionTitle } from '@/components/ui';
import { ProjectCard } from '@/components/portfolio';

interface Project {
  id: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  fallbackEmoji?: string;
  tags: string[];
  href?: string;
}

// Produits disponibles sur Printify
const projects: Project[] = [];

// Musiques Suno (WAV) – placeholders pour éviter les 404 tant que les fichiers ne sont pas en ligne
const musiques: Array<{ id: string; title: string; file?: string }> = [];

// Vidéos (MP4) – placeholders pour éviter les 404 tant que les fichiers ne sont pas en ligne
const videos: Array<{ id: string; title: string; file?: string }> = [];

export const PortfolioScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tshirts' | 'music' | 'videos'>('tshirts');

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 space-y-12 bg-gradient-to-b from-camp-night to-camp-purple min-h-screen">
      
      {/* Header */}
      <div className="text-center">
        <SectionTitle title="Portfolio" subtitle="Nos créations IA – T-shirts, Musique, Vidéos" />
      </div>

      {/* Onglets de navigation */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => setActiveTab('tshirts')}
          className={`px-6 py-3 rounded-camp font-semibold transition-all duration-300 ${
            activeTab === 'tshirts'
              ? 'bg-camp-fire text-white shadow-fire scale-105'
              : 'bg-camp-purple text-camp-sand hover:bg-camp-violet'
          }`}
        >
          👕 T-shirts Etsy
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`px-6 py-3 rounded-camp font-semibold transition-all duration-300 ${
            activeTab === 'music'
              ? 'bg-camp-fire text-white shadow-fire scale-105'
              : 'bg-camp-purple text-camp-sand hover:bg-camp-violet'
          }`}
        >
          🎵 Musiques Suno
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-6 py-3 rounded-camp font-semibold transition-all duration-300 ${
            activeTab === 'videos'
              ? 'bg-camp-fire text-white shadow-fire scale-105'
              : 'bg-camp-purple text-camp-sand hover:bg-camp-violet'
          }`}
        >
          🎬 Vidéos
        </button>
      </div>

      {/* Section Boutique Printify */}
      {activeTab === 'tshirts' && (
        <>
          <p className="text-center text-camp-sand text-lg mb-8">
            🛍️ Découvrez nos produits disponibles sur Printify
          </p>
          <div className="bg-gradient-to-br from-camp-purple to-camp-violet rounded-camp p-8 border-2 border-camp-fire/40 shadow-camp">
            <div className="text-center space-y-6">
              <div className="text-6xl">🛍️</div>
              <h3 className="text-2xl font-bold text-camp-cream">Boutique Création NOWIS</h3>
              <p className="text-camp-sand max-w-2xl mx-auto">
                Découvrez nos produits créés avec l'IA, disponibles sur Printify. T-shirts, accessoires et plus encore !
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/shop"
                  className="inline-block px-8 py-3 bg-camp-fire hover:bg-camp-flame text-white rounded-lg font-semibold transition-all duration-300 shadow-fire"
                >
                  🛍️ Voir la boutique complète
                </a>
                <a
                  href="https://nowis.printify.me/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-8 py-3 border-2 border-camp-flame text-camp-cream hover:bg-camp-flame hover:text-camp-night rounded-lg font-semibold transition-all duration-300"
                >
                  🔗 Ouvrir dans un nouvel onglet
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Section Musique Suno */}
      {activeTab === 'music' && (
        <div className="space-y-6">
          <p className="text-center text-camp-sand text-lg mb-8">
            🎵 Écoute mes compositions créées avec Suno. Parfait pour jingles, publicités, événements.
          </p>
          {musiques.length === 0 ? (
            <p className="text-center text-camp-sand">
              Les extraits audio seront mis en ligne bientôt. Contacte-moi pour un aperçu personnalisé.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {musiques.map((song) => (
                <div
                  key={song.id}
                  className="bg-gradient-to-br from-camp-purple to-camp-violet rounded-camp p-6 border-2 border-camp-fire/40 shadow-camp hover:shadow-fire transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-camp-cream mb-4 flex items-center gap-2">
                    🎵 {song.title}
                  </h3>
                  <audio controls className="w-full" preload="metadata">
                    <source src={song.file} type="audio/wav" />
                    Ton navigateur ne supporte pas l&apos;audio.
                  </audio>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Vidéos */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <p className="text-center text-camp-sand text-lg mb-8">
            🎬 Mes vidéos créées avec Revide.ai. Publicités, clips, contenu viral.
          </p>
          {videos.length === 0 ? (
            <p className="text-center text-camp-sand">
              Les vidéos seront mises en ligne bientôt. Écris-moi pour recevoir des exemples.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gradient-to-br from-camp-purple to-camp-violet rounded-camp p-6 border-2 border-camp-flame/40 shadow-camp hover:shadow-fire transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-camp-cream mb-4 flex items-center gap-2">
                    🎬 {video.title}
                  </h3>
                  <video
                    controls
                    className="w-full rounded-lg"
                    preload="metadata"
                  >
                    <source src={video.file} type="video/mp4" />
                    Ton navigateur ne supporte pas la vidéo.
                  </video>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center py-12">
        <p className="text-lg text-camp-sand mb-6">
          Tu veux une création sur-mesure pour ta marque ?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/shop"
            className="inline-block px-8 py-3 bg-camp-fire hover:bg-camp-flame text-white rounded-lg font-semibold transition-all duration-300 shadow-fire"
          >
            🛍️ Voir la boutique
          </a>
          <a
            href="/booking"
            className="inline-block px-8 py-3 border-2 border-camp-flame text-camp-flame hover:bg-camp-flame hover:text-camp-night rounded-lg font-semibold transition-all duration-300"
          >
            🔥 Commander une création custom
          </a>
        </div>
      </div>
    </div>
  );
};
