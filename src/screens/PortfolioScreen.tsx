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

// Musiques Suno (WAV) - TODO: Ajoute tes propres titres/fichiers
const musiques = [
  { id: 'audio1', title: 'Bon dieu', file: '/audio/bon dieu.wav' },
  { id: 'audio2', title: 'Encore encore', file: '/audio/encore encore.wav' },
  { id: 'audio3', title: "J'ai le goût de te voir", file: "/audio/j'ai le gout de te voir.wav" },
  { id: 'audio4', title: 'Je lève le son (Cover)', file: '/audio/je leve le son(Cover).wav' },
  { id: 'audio5', title: 'Je suis tombé amoureux (Cover)', file: '/audio/je suis tomber amoureux (Cover).wav' },
  { id: 'audio6', title: 'Merci la vie', file: '/audio/merci la vie.wav' },
  { id: 'audio7', title: 'Pas besoin de voir (Cover)', file: '/audio/pas besoin de voir (Cover).wav' },
];

// Vidéos (MP4) - TODO: Ajoute tes propres titres/fichiers
const videos = [
  { id: 'vid1', title: 'Amoureux de tes yeux bleus', file: '/videos/amoureux-de-tes-yeux-bleus.mp4' },
  { id: 'vid2', title: 'Ça va bien aller', file: '/videos/ca-va-bien-aller (1).mp4' },
  { id: 'vid3', title: 'Changer ma vie à do-ré-mi', file: '/videos/changer-ma-vie-a-do-re-mi.mp4' },
  { id: 'vid4', title: 'Dieu, science et amour en interaction', file: '/videos/dieu-science-et-amour-en-interaction.mp4' },
  { id: 'vid5', title: 'Le goût de te revoir', file: '/videos/le-gout-de-te-revoir.mp4' },
  { id: 'vid6', title: 'Les farces des lutins du pôle nord', file: '/videos/les-farces-des-lutins-du-pole-nord (1).mp4' },
  { id: 'vid7', title: 'Lève le son, monte le ton', file: '/videos/leve-le-son-monte-le-ton.mp4' },
  { id: 'vid8', title: 'Pas besoin de voir pour aimer', file: '/videos/pas-besoin-de-voir-pour-aimer.mp4' },
  { id: 'vid9', title: 'Petites vies, grandes misères', file: '/videos/petites-vies-grandes-miseres.mp4' },
  { id: 'vid10', title: "Ramasse un peu, on s'aime à deux", file: '/videos/ramasse-un-peu-on-saime-a-deux.mp4' },
  { id: 'vid11', title: 'Seul chez moi', file: '/videos/seul-chez-moi.mp4' },
];

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
        </div>
      )}

      {/* Section Vidéos */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <p className="text-center text-camp-sand text-lg mb-8">
            🎬 Mes vidéos créées avec Revide.ai. Publicités, clips, contenu viral.
          </p>
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
