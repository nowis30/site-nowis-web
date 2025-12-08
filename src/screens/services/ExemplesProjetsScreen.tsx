/**
 * ExemplesProjetsScreen - Page Exemples de Projets
 */

'use client';

import React from 'react';
import Link from 'next/link';

export const ExemplesProjetsScreen: React.FC = () => {
  const projects = [
    {
      title: 'Clip vidéo promotionnel',
      description: 'Vidéo courte avec musique originale, textes et montage dynamique.',
      icon: '🎬',
      href: '/services/clip-video'
    },
    {
      title: 'Campagne réseaux sociaux',
      description: 'Série de visuels, textes et vidéos courtes pour une diffusion cohérente.',
      icon: '📱',
      href: '/services/campagnes-reseaux-sociaux'
    },
    {
      title: 'Thème de podcast',
      description: 'Jingle d\'intro, outro et habillage sonore.',
      icon: '🎙️',
      href: '/services/theme-podcast'
    },
    {
      title: 'Annonce d\'événement',
      description: 'Teaser vidéo + visuel informatif.',
      icon: '🎉',
      href: '/services/annonce-evenement'
    },
    {
      title: 'Stories Instagram',
      description: 'Packs de stories animées et cohérentes.',
      icon: '📸',
      href: '/services/story-instagram'
    },
    {
      title: 'Hymne d\'entreprise',
      description: 'Chanson-thème sur mesure.',
      icon: '🎵',
      href: '/services/hymne-entreprise'
    },
    {
      title: 'Site web interactif',
      description: 'Site vitrine ou landing page.',
      icon: '🌐',
      href: '/services/site-web-interactif'
    },
    {
      title: 'T-shirts et visuels imprimables',
      description: 'Designs originaux pour T-shirts, autocollants, etc., vendus via Printify.',
      icon: '👕',
      href: '/shop'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Exemples de projets que je peux réaliser
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl">
            Clips, chansons, visuels, sites web… Voici le type de créations proposées avec l'aide de l'intelligence artificielle.
          </p>
        </div>
      </section>

      {/* Grille de projets */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <Link
              key={project.title}
              href={project.href}
              className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-primary-300"
            >
              <div className="text-4xl mb-4">{project.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-gray-600">
                {project.description}
              </p>
              <div className="mt-4 text-primary-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                En savoir plus
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA général */}
      <section className="max-w-4xl mx-auto px-6 py-12 mt-8">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Envie de discuter d'un projet spécifique ?
          </h2>
          <a
            href="mailto:simonmorin@nowis.store?subject=Demande%20d'information%20sur%20un%20projet"
            className="inline-flex items-center justify-center px-8 py-4 bg-secondary-600 text-white font-semibold rounded-xl hover:bg-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            💬 Discuter de mon projet
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        {/* Retour */}
        <div className="text-center pt-8">
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </section>
    </div>
  );
};
