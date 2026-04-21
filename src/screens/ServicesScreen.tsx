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
    icon: '🎤',
    title: 'Ateliers et accompagnement créatif',
    description: 'Animation d atelier, accompagnement et creation sur mesure avec une approche humaine et accessible.',
    features: [
      'Tarif de base universel',
      'Accompagnement personnalise',
      'Format individuel ou de groupe',
      'Base claire avant soumission detaillee',
    ],
    price: '120 $ / heure',
  },
  {
    id: '2',
    icon: '🎵',
    title: 'Chanson IA souvenir',
    description: 'Creation d une chanson souvenir ou amusante a partir de vos informations et de votre intention.',
    features: [
      'Format simple',
      'Creation rapide',
      'Approche personnalisee',
      'Ideal pour un cadeau ou un souvenir',
    ],
    price: '25 $',
  },
  {
    id: '3',
    icon: '🎬',
    title: 'Vidéo IA avec chanson',
    description: 'Video souvenir ou promotionnelle en format simple, accompagnee d une chanson IA adaptee au projet.',
    features: [
      'Video + chanson',
      'Format simple',
      'Livrable facile a partager',
      'Convient aux souvenirs et contenus courts',
    ],
    price: '100 $',
  },
  {
    id: '4',
    icon: '✨',
    title: 'Projet créatif personnalisé',
    description: 'Mandat special, video IA, reels, shorts, contenu promotionnel ou autre demande creative sur mesure.',
    features: [
      'Sur soumission',
      'Mandat adapte a l objectif',
      'Possibilite de formule groupe',
      'Orientation claire des livrables',
    ],
    price: 'Sur soumission',
  },
];

export const ServicesScreen: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 space-y-12">
      <div className="text-center">
        <SectionTitle
          title="Nos Services"
          subtitle="Une grille simple pour les services visibles et une soumission claire pour les projets speciaux"
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
              Les droits et les usages sont confirmes selon le type de mandat et le livrable retenu. Cela fait partie de la discussion avant la livraison.
            </p>
          </details>

          <details className="bg-slate-700 p-4 rounded-lg cursor-pointer group">
            <summary className="font-semibold flex justify-between items-center">
              Quel est le délai de livraison ?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-slate-300 text-sm">
              Le delai depend du format choisi et du niveau de personnalisation. Une chanson simple ne demande pas le meme travail qu un mandat video ou promotionnel.
            </p>
          </details>

          <details className="bg-slate-700 p-4 rounded-lg cursor-pointer group">
            <summary className="font-semibold flex justify-between items-center">
              Pouvez-vous adapter l’accompagnement pour un plus gros besoin ?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-slate-300 text-sm">
              Oui. Le tarif de base est de 120 $ / heure, et certains groupes peuvent aussi profiter d une formule a partir de 10 $ par personne selon le projet.
            </p>
          </details>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center py-12">
        <p className="text-lg text-slate-400 mb-6">Prêt à commencer ?</p>
        <Link href="/contact">
          <Button variant="primary" size="lg">
            Parler de mon projet
          </Button>
        </Link>
      </div>
    </div>
  );
};
