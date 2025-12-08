/**
 * ShopScreen Component
 * Page boutique qui redirige vers Printify
 */

'use client';

import React from 'react';
import Link from 'next/link';

export const ShopScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      
      {/* Header de la page */}
      <section className="relative max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Boutique <span className="text-secondary-600">Création NOWIS</span>
          </h1>
          <p className="text-lg text-gray-600">
            Découvrez nos produits créés avec l'intelligence artificielle
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="max-w-2xl mx-auto px-6 py-12">
        
        {/* 3 info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-xl p-6 border-2 border-primary-200 text-center">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="font-semibold text-gray-900">Designs IA</h3>
          </div>
          <div className="bg-white rounded-xl p-6 border-2 border-secondary-200 text-center">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="font-semibold text-gray-900">Livraison mondiale</h3>
          </div>
          <div className="bg-white rounded-xl p-6 border-2 border-primary-200 text-center">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-semibold text-gray-900">Qualité premium</h3>
          </div>
        </div>

        {/* Message et CTA */}
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 text-center space-y-6">
          <div className="space-y-2">
            <p className="text-lg text-gray-700">
              Notre boutique est hébergée sur <span className="font-semibold">Printify</span>
            </p>
            <p className="text-gray-600">
              Cliquez sur le bouton ci-dessous pour accéder à tous nos produits
            </p>
          </div>

          <a
            href="https://nowis.printify.me/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-secondary-600 text-white text-lg font-semibold rounded-xl hover:bg-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            🛍️ Accéder à la boutique Printify
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Retour accueil */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>

      </section>
    </div>
  );
};
