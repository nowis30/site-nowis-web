/**
 * CampagnesReseauxSociauxScreen - Page Campagnes Réseaux Sociaux
 */

'use client';

import React from 'react';
import Link from 'next/link';

export const CampagnesReseauxSociauxScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="space-y-6">
          <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
            📱 Service
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Campagnes de réseaux sociaux clé en main
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl">
            Visuels, textes, musique et vidéos optimisés pour vos plateformes, créés avec l'aide de l'intelligence artificielle.
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
              <span>Planifier une petite campagne (lancement de produit, promotion, événement).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Créer les visuels (images, mini-vidéos, carrousels) adaptés à chaque réseau.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Proposer des textes (légendes, accroches, appels à l'action) qui parlent au public.</span>
            </li>
          </ul>
        </div>

        {/* Formats typiques */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Formats typiques</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-secondary-600">•</span>
              <span>Série de 3 à 10 publications pour Facebook, Instagram ou TikTok.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary-600">•</span>
              <span>Combinaisons image + texte + vidéo courte.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary-600">•</span>
              <span>Contenus réutilisables pour stories et site web.</span>
            </li>
          </ul>
        </div>

        {/* Processus */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Processus</h2>
          <ol className="space-y-3 text-gray-700 list-decimal list-inside">
            <li>Définition de l'objectif (vendre, informer, faire connaître).</li>
            <li>Choix des plateformes et du ton.</li>
            <li>Création des visuels et des textes avec l'IA.</li>
            <li>Livraison d'un kit prêt à publier.</li>
          </ol>
        </div>

        {/* Note tarif */}
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 border-l-4 border-primary-600">
          <h3 className="font-bold text-gray-900 mb-2">Approche</h3>
          <p className="text-gray-700">
            Chaque campagne est préparée selon les plateformes, les formats attendus et l’ampleur du contenu à produire.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Prêt à lancer votre campagne ?
          </h2>
          <a
            href="mailto:simonmorin@nowis.store?subject=Demande%20de%20campagne%20réseaux%20sociaux"
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
