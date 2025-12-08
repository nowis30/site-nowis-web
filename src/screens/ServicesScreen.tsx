/**
 * ServicesScreen Component
 * Présentation de tous les services offerts.
 * ÉDITABLE: Modifie les services, descriptions et tarifs.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { SectionTitle, Button } from '@/components/ui';
import { ServiceCard } from '@/components/services';

interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  price?: string;
}

// TODO: MODIFIER - Ajoute ou modifie les services
const services: Service[] = [
  {
    id: '1',
    icon: '👕',
    title: 'Design T-shirt IA',
    description: 'Crée un design unique pour ton t-shirt avec l\'intelligence artificielle.',
    features: [
      'Génération de design personnalisé',
      'Unlimited revisions',
      'Fichiers haute résolution',
      'Support commercial',
    ],
    price: 'À partir de 49€',
  },
  {
    id: '2',
    icon: '🎵',
    title: 'Création Musique (Suno)',
    description: 'Composition musicale originale et royalty-free générée avec Suno IA.',
    features: [
      'Musique originale royalty-free',
      'Genres variés (pop, rap, ambient...)',
      'Fichier WAV haute qualité',
      'Libre d\'utilisation commerciale',
    ],
    price: 'À partir de 79€',
  },
  {
    id: '3',
    icon: '🎬',
    title: 'Production Vidéo (Revide.ai)',
    description: 'Vidéo professionnelle créée avec Revide.ai pour tes besoins marketing.',
    features: [
      'Vidéo courte format viral',
      'Effets visuels IA',
      'Musique incluse (Suno)',
      'Optimisée TikTok/Instagram',
    ],
    price: 'À partir de 199€',
  },
  {
    id: '4',
    icon: '📦',
    title: 'Package Complet',
    description: 'Combine T-shirt, musique et vidéo pour une campagne complète.',
    features: [
      'Design T-shirt + musique + vidéo',
      'Coordination créative',
      'Révisions illimitées',
      'Support prioritaire',
    ],
    price: 'À partir de 299€',
  },
];

export const ServicesScreen: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 space-y-12">
      <div className="text-center">
        <SectionTitle
          title="Nos Services"
          subtitle="Tout ce qu'il te faut pour créer du contenu extraordinaire"
        />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <div key={service.id} className="flex flex-col h-full">
            <ServiceCard
              icon={service.icon}
              title={service.title}
              description={service.description}
              features={service.features}
              onClick={() => {
                // TODO: MODIFIER - Ajoute une modal ou redirection vers détails
                console.log('Service cliqué:', service.id);
              }}
            />
            {service.price && (
              <div className="mt-4 text-center font-semibold text-green-400">
                {service.price}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Process Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Comment ça fonctionne ?</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-600 flex items-center justify-center text-xl font-bold">
              1
            </div>
            <h4 className="font-semibold mb-2">Réservation</h4>
            <p className="text-sm text-slate-400">
              Réserve une consultation pour expliquer ton projet.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-600 flex items-center justify-center text-xl font-bold">
              2
            </div>
            <h4 className="font-semibold mb-2">Conception</h4>
            <p className="text-sm text-slate-400">
              Nous créons ton design/musique/vidéo avec l'IA.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-600 flex items-center justify-center text-xl font-bold">
              3
            </div>
            <h4 className="font-semibold mb-2">Révisions</h4>
            <p className="text-sm text-slate-400">
              Tu donnes tes retours, on affine jusqu'à perfection.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-600 flex items-center justify-center text-xl font-bold">
              4
            </div>
            <h4 className="font-semibold mb-2">Livraison</h4>
            <p className="text-sm text-slate-400">
              Tu reçois tous les fichiers prêts à utiliser.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-slate-800 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>

        <div className="space-y-6 max-w-2xl mx-auto">
          {/* TODO: MODIFIER - Ajoute tes FAQs */}
          <details className="bg-slate-700 p-4 rounded-lg cursor-pointer group">
            <summary className="font-semibold flex justify-between items-center">
              Puis-je utiliser les contenus commercialement ?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-slate-300 text-sm">
              Oui ! Tous nos contenus générés sont sous licence commerciale. Tu peux les utiliser
              pour ton business sans restriction.
            </p>
          </details>

          <details className="bg-slate-700 p-4 rounded-lg cursor-pointer group">
            <summary className="font-semibold flex justify-between items-center">
              Quel est le délai de livraison ?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-slate-300 text-sm">
              En général 5-7 jours ouvrables. Pour les demandes urgentes, contacte-nous.
            </p>
          </details>

          <details className="bg-slate-700 p-4 rounded-lg cursor-pointer group">
            <summary className="font-semibold flex justify-between items-center">
              Proposez-vous des tarifs pour les gros volumes ?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-slate-300 text-sm">
              Oui ! Pour les commandes en volume, nous proposons des tarifs personnalisés. Réserve
              un appel pour discuter.
            </p>
          </details>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center py-12">
        <p className="text-lg text-slate-400 mb-6">Prêt à commencer ?</p>
        <Link href="/booking">
          <Button variant="primary" size="lg">
            Réserver une consultation gratuite
          </Button>
        </Link>
      </div>
    </div>
  );
};
