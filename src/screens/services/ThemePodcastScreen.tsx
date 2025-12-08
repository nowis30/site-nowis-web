/**
 * ThemePodcastScreen - Page Thème de Podcast
 */

'use client';

import React from 'react';
import Link from 'next/link';

export const ThemePodcastScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="space-y-6">
          <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
            🎙️ Service
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Thème de podcast et identité sonore
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl">
            Une intro, un outro et un univers sonore qui donnent une signature claire à votre émission.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        
        {/* Ce que je peux faire */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Ce que je peux faire pour vous</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Créer le jingle d'introduction (musique + ambiance).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Préparer un outro pour remercier, annoncer les réseaux, etc.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Proposer une ligne directrice pour la voix (ton, style, phrases types).</span>
            </li>
          </ul>
        </div>

        {/* Formats typiques */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Formats typiques</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-secondary-600">•</span>
              <span>Thème principal de 10 à 20 secondes.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary-600">•</span>
              <span>Version courte pour transitions (changements de segments).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary-600">•</span>
              <span>Pack de fichiers audio optimisés pour les logiciels de montage.</span>
            </li>
          </ul>
        </div>

        {/* Processus */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Processus</h2>
          <ol className="space-y-3 text-gray-700 list-decimal list-inside">
            <li>Discussion sur le style (dynamique, sérieux, humoristique, corporate, etc.).</li>
            <li>Création de plusieurs idées de thèmes avec l'IA musicale.</li>
            <li>Sélection, ajustements, export en haute qualité.</li>
            <li>Livraison des fichiers audio + un document simple de recommandations d'usage.</li>
          </ol>
        </div>

        {/* Note tarif */}
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 border-l-4 border-primary-600">
          <h3 className="font-bold text-gray-900 mb-2">Note tarif</h3>
          <p className="text-gray-700">
            Pack intro + outro + transition à partir d'environ <strong>120 $ CA</strong>.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Créer l'identité sonore de votre podcast ?
          </h2>
          <a
            href="mailto:simonmorin@nowis.store?subject=Demande%20de%20thème%20podcast"
            className="inline-flex items-center justify-center px-8 py-4 bg-secondary-600 text-white font-semibold rounded-xl hover:bg-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            💬 Discuter de mon projet
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        {/* Retour */}
        <div className="text-center pt-8 border-t border-gray-200">
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>

      </section>
    </div>
  );
};
