/**
 * HomeScreen Component - Création NOWIS
 * Page d'accueil professionnelle pour studio créatif
 * 
 * 🎨 SECTIONS PERSONNALISABLES:
 * - Hero (lignes 20-80): Titre principal et appel à l'action
 * - Services (lignes 85-240): 4 cartes de services détaillées
 * - IA au cœur (lignes 245-310): Explication de l'utilisation de l'IA
 * - Portfolio (lignes 315-400): Exemples de projets
 * - À propos (lignes 405-460): Présentation de Simon/NOWIS
 * - Contact/CTA (lignes 465-530): Formulaire et appel final
 */

'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

export const HomeScreen: React.FC = () => {
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!heroVideoRef.current) return;
    const video = heroVideoRef.current;
    video.muted = true;
    video.playsInline = true;
    
    // Force play with delay for mobile Safari
    const attemptPlay = () => {
      video.play().catch((err) => {
        console.warn('Autoplay blocked:', err);
        // Retry after short delay
        setTimeout(() => {
          video.play().catch(() => {});
        }, 500);
      });
    };
    
    if (video.readyState >= 2) {
      attemptPlay();
    } else {
      video.addEventListener('loadeddata', attemptPlay, { once: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      
      {/* ========== SECTION HERO ========== */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Contenu texte */}
          <div className="space-y-8">
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-gray-900">Création NOWIS</span>
                <span className="block text-primary-600 mt-2">Studio créatif propulsé</span>
                <span className="block bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                  par l'intelligence artificielle
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                Vidéos, publicités, chansons et contenus sur mesure pour entreprises et événements.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                Parler de mon projet
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link 
                href="#portfolio"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 text-lg font-semibold rounded-xl border-2 border-primary-600 hover:bg-primary-50 transition-all duration-200"
              >
                Voir des exemples
              </Link>
              <Link 
                href="/shop"
                className="inline-flex items-center justify-center px-8 py-4 bg-secondary-600 text-white text-lg font-semibold rounded-xl hover:bg-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                🛍️ Voir la boutique
              </Link>
            </div>
          </div>

          {/* Illustration visuelle - animation vidéo */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-soft border border-gray-100 bg-black/80">
              <video
                ref={heroVideoRef}
                className="w-full h-auto"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                controls={false}
                controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                disablePictureInPicture
                aria-hidden="true"
                tabIndex={-1}
                style={{ maxHeight: '600px', objectFit: 'cover' }}
              >
                <source src="/music/nowis-creation-mode.mp4" type="video/mp4" />
                Votre navigateur ne supporte pas la vidéo HTML5.
              </video>
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Créativité + Technologie — animation 10s
            </p>
          </div>
        </div>
      </section>

      {/* ========== SECTION SERVICES ========== */}
      <section id="services" className="relative max-w-7xl mx-auto px-6 py-20 scroll-mt-20">
        
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Services créatifs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Des solutions complètes pour donner vie à vos projets avec l'aide de l'intelligence artificielle
          </p>
        </div>

        {/* Grille de services avec liens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Service 1: Clips vidéo */}
          <Link 
            href="/services/clip-video"
            className="group bg-white rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 border border-gray-100 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-3xl shadow-md">
                🎬
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                Clips vidéo sur mesure
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Vidéos courtes avec musique IA, montage professionnel pour publicités et réseaux sociaux.
              </p>
              <div className="flex items-center text-primary-600 font-semibold group-hover:gap-2 transition-all gap-1">
                Découvrir le service
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Service 2: Campagnes réseaux sociaux */}
          <Link 
            href="/services/campagnes-reseaux-sociaux"
            className="group bg-white rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 border border-gray-100 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center text-white text-3xl shadow-md">
                📱
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-secondary-600 transition-colors">
                Campagnes réseaux sociaux
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Visuels, textes et vidéos optimisés pour Facebook, Instagram, TikTok et autres plateformes.
              </p>
              <div className="flex items-center text-secondary-600 font-semibold group-hover:gap-2 transition-all gap-1">
                Découvrir le service
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Service 3: Thème de podcast */}
          <Link 
            href="/services/theme-podcast"
            className="group bg-white rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 border border-gray-100 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-xl flex items-center justify-center text-white text-3xl shadow-md">
                🎙️
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                Thème de podcast
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Jingles d'introduction, outros et identité sonore pour votre émission.
              </p>
              <div className="flex items-center text-primary-600 font-semibold group-hover:gap-2 transition-all gap-1">
                Découvrir le service
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Service 4: Plus de services */}
          <Link 
            href="/services/exemples-projets"
            className="group bg-white rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 border border-gray-100 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-600 to-primary-500 rounded-xl flex items-center justify-center text-white text-3xl shadow-md">
                ✨
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-secondary-600 transition-colors">
                Voir tous les services
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Découvrez toute la gamme : hymne d'entreprise, stories Instagram, sites web, et plus encore.
              </p>
              <div className="flex items-center text-secondary-600 font-semibold group-hover:gap-2 transition-all gap-1">
                Voir plus
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

        </div>

        {/* CTA pour tous les services */}
        <div className="text-center">
          <Link
            href="/services/exemples-projets"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            Voir tous les projets
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ========== SECTION IA AU CŒUR ========== */}
      <section className="relative max-w-5xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-12 md:p-16 border border-primary-100">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-glow mb-6">
              <span className="text-4xl">🤖</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              L'intelligence artificielle comme coéquipier créatif
            </h2>
          </div>

          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              J'utilise l'IA pour générer des idées visuelles et sonores plus rapidement, tester plusieurs versions et adapter le contenu à chaque plateforme. L'IA accélère le travail, mais le cœur du message reste humain.
            </p>

            <div className="grid md:grid-cols-3 gap-6 pt-8">
              
              <div className="bg-white rounded-xl p-6 shadow-soft">
                <div className="text-3xl mb-3">💡</div>
                <h3 className="font-bold text-gray-900 mb-2">Génération d'idées</h3>
                <p className="text-gray-600 text-base">
                  L'IA propose des concepts créatifs variés en quelques secondes, accélérant la phase de brainstorming.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-bold text-gray-900 mb-2">Rapidité d'exécution</h3>
                <p className="text-gray-600 text-base">
                  Production de contenus audio et visuels en quelques minutes au lieu de plusieurs jours.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-bold text-gray-900 mb-2">Variations infinies</h3>
                <p className="text-gray-600 text-base">
                  Tester plusieurs styles, tons et formats pour trouver la version parfaite pour votre projet.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========== SECTION PORTFOLIO ========== */}
      <section id="portfolio" className="relative max-w-7xl mx-auto px-6 py-20 scroll-mt-20">
        
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Exemples de projets
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez quelques réalisations créatives propulsées par l'intelligence artificielle
          </p>
        </div>

        {/* Grille de 6 projets placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Projet 1 */}
          <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-5xl">
              🎬
            </div>
            <div className="p-6 space-y-3">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                Vidéo publicitaire
              </span>
              <h3 className="text-xl font-bold text-gray-900">
                Campagne réseaux sociaux
              </h3>
              <p className="text-gray-600">
                Série de clips courts pour une entreprise locale.
              </p>
              <Link 
                href="/portfolio"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group-hover:underline"
              >
                En savoir plus
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Projet 2 */}
          <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="aspect-video bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-5xl">
              🎵
            </div>
            <div className="p-6 space-y-3">
              <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold">
                Jingle musical
              </span>
              <h3 className="text-xl font-bold text-gray-900">
                Thème de podcast
              </h3>
              <p className="text-gray-600">
                Intro musicale personnalisée pour un podcast d'affaires.
              </p>
              <Link 
                href="/portfolio"
                className="inline-flex items-center text-secondary-600 hover:text-secondary-700 font-semibold group-hover:underline"
              >
                En savoir plus
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Projet 3 */}
          <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="aspect-video bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white text-5xl">
              🎯
            </div>
            <div className="p-6 space-y-3">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                Pub complète
              </span>
              <h3 className="text-xl font-bold text-gray-900">
                Annonce événement
              </h3>
              <p className="text-gray-600">
                Vidéo + musique pour le lancement d'un événement corporatif.
              </p>
              <Link 
                href="/portfolio"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group-hover:underline"
              >
                En savoir plus
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Projet 4 */}
          <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="aspect-video bg-gradient-to-br from-secondary-500 to-primary-600 flex items-center justify-center text-white text-5xl">
              📱
            </div>
            <div className="p-6 space-y-3">
              <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold">
                Contenu social
              </span>
              <h3 className="text-xl font-bold text-gray-900">
                Stories Instagram
              </h3>
              <p className="text-gray-600">
                Série de stories animées pour campagne produit.
              </p>
              <Link 
                href="/portfolio"
                className="inline-flex items-center text-secondary-600 hover:text-secondary-700 font-semibold group-hover:underline"
              >
                En savoir plus
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Projet 5 */}
          <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="aspect-video bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-5xl">
              🎤
            </div>
            <div className="p-6 space-y-3">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                Chanson promotionnelle
              </span>
              <h3 className="text-xl font-bold text-gray-900">
                Hymne d'entreprise
              </h3>
              <p className="text-gray-600">
                Chanson corporative personnalisée pour une PME.
              </p>
              <Link 
                href="/portfolio"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group-hover:underline"
              >
                En savoir plus
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Projet 6 */}
          <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="aspect-video bg-gradient-to-br from-secondary-600 to-primary-500 flex items-center justify-center text-white text-5xl">
              🌐
            </div>
            <div className="p-6 space-y-3">
              <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold">
                Web & assistant IA
              </span>
              <h3 className="text-xl font-bold text-gray-900">
                Site web interactif
              </h3>
              <p className="text-gray-600">
                Site moderne avec chatbot IA pour service client.
              </p>
              <Link 
                href="/portfolio"
                className="inline-flex items-center text-secondary-600 hover:text-secondary-700 font-semibold group-hover:underline"
              >
                En savoir plus
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ========== SECTION À PROPOS ========== */}
      <section id="about" className="relative max-w-5xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="bg-white rounded-3xl p-12 md:p-16 shadow-card border border-gray-100">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              À propos de Création NOWIS
            </h2>
          </div>

          <div className="space-y-6 text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
            <p>
              Je m'appelle <strong className="text-gray-900">Simon</strong>. J'aide les entreprises et les créateurs à transformer leurs idées en vidéos, chansons et publicités qui ont de l'impact.
            </p>
            <p>
              Mon style : <strong className="text-primary-600">direct, créatif, efficace</strong>. Mes outils : l'expérience, un bon sens critique… et l'intelligence artificielle.
            </p>
            <p>
              Avec des plateformes comme <strong>Suno</strong> (musique), <strong>Revid.ai</strong> (vidéo) et <strong>ChatGPT</strong> (contenu), je produis rapidement du contenu de qualité professionnelle, tout en gardant la touche humaine qui fait la différence.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-center gap-3 text-gray-600">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg">
                  Basé au <strong className="text-gray-900">Québec</strong> — disponible à distance
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========== SECTION CONTACT / CTA FINAL ========== */}
      <section id="contact" className="relative max-w-5xl mx-auto px-6 py-20 mb-20 scroll-mt-20">
        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-12 md:p-16 text-white shadow-glow">
          
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Parlez-moi de votre projet
            </h2>
            <p className="text-xl text-primary-50 max-w-2xl mx-auto leading-relaxed">
              Besoin d'une pub, d'une chanson ou d'un concept vidéo pour votre entreprise ou votre événement ? Écrivez-moi un message ou planifions un appel.
            </p>
          </div>

          {/* Formulaire de contact simple */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-card">
            <form className="space-y-6">
              
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-gray-900"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Courriel
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-gray-900"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="projectType" className="block text-sm font-semibold text-gray-900 mb-2">
                  Type de projet
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-gray-900"
                >
                  <option value="">Sélectionnez...</option>
                  <option value="video">Vidéo publicitaire</option>
                  <option value="music">Chanson / Jingle</option>
                  <option value="full-ad">Pub complète (vidéo + musique)</option>
                  <option value="branding">Accompagnement contenu</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                  Décrivez votre projet
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
                  placeholder="Parlez-moi de ce que vous avez en tête..."
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  Envoyer le message
                </button>
              </div>

            </form>

            {/* Alternative: Bouton vers Cal.com */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-600 mb-4">
                Ou planifiez un appel directement :
              </p>
              <Link 
                href="/booking"
                className="block text-center px-8 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                📅 Réserver un rendez-vous
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
