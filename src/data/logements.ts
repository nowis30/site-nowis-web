import type { Logement } from '@/types';

/**
 * Liste d'exemples de logements.
 * Modifie ce fichier ou remplace-le par une source de données plus robuste (API, CMS, base de données).
 */

export const logements: Logement[] = [
  {
    id: 'log-001',
    slug: 'appartement-lumineux-montmartre',
    title: "Appartement lumineux à Montmartre",
    price: 1450,
    city: 'Paris',
    sector: 'Montmartre',
    bedrooms: 2,
    bathrooms: 1,
    area: 52,
    descriptionShort:
      "Appartement clair, moderne et calme au cœur de Montmartre avec balcon et vue partielle sur la basilique.",
    descriptionLong:
      "Situé dans une copropriété bien entretenue, ce T3 rénové offre un séjour lumineux avec cuisine ouverte, deux chambres confortables et une salle d'eau moderne. Idéal pour un couple ou une petite famille. Proche des commerces, métros et cafés typiques du quartier.",
    images: [
      'https://via.placeholder.com/1200x800?text=Montmartre+1',
      'https://via.placeholder.com/1200x800?text=Montmartre+2',
      'https://via.placeholder.com/1200x800?text=Montmartre+3',
    ],
    status: 'approved',
    ownerId: 'user-1',
    ownerName: 'Simon Dupont',
    ownerEmail: 'simon@example.com',
    ownerPhone: '+33 6 12 34 56 78',
    heating: 'Chauffage central',
    parking: true,
    petsAllowed: true,
    smokingAllowed: false,
    furnished: true,
    bookingUrl: 'https://calendly.com/nowis/montmartre',
    featured: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'log-002',
    slug: 'studio-design-grands-boulevards',
    title: 'Studio design près des Grands Boulevards',
    price: 980,
    city: 'Paris',
    sector: 'Grands Boulevards',
    bedrooms: 1,
    bathrooms: 1,
    area: 28,
    descriptionShort:
      'Studio cosy avec décoration contemporaine, idéal pour une personne ou un couple. À deux pas des transports.',
    descriptionLong:
      "Ce studio assis dans un bel immeuble haussmannien offre un plan optimisé, kitchenette équipée, et un espace nuit séparé. Très lumineux, il est parfait pour un court ou moyen terme. Le quartier est animé, avec cafés, théâtres et boutiques.",
    images: [
      'https://via.placeholder.com/1200x800?text=Studio+1',
      'https://via.placeholder.com/1200x800?text=Studio+2',
      'https://via.placeholder.com/1200x800?text=Studio+3',
    ],
    status: 'pending',
    ownerId: 'user-2',
    ownerName: 'Juliette Martin',
    ownerEmail: 'juliette@example.com',
    ownerPhone: '+33 6 87 65 43 21',
    heating: 'Chauffage électrique',
    parking: false,
    petsAllowed: false,
    smokingAllowed: false,
    furnished: false,
    bookingUrl: '',
    featured: false,
    createdAt: '2026-02-22T14:30:00.000Z',
    updatedAt: '2026-02-22T14:30:00.000Z',
  },
  {
    id: 'log-003',
    slug: 'maison-de-charme-proche-versailles',
    title: 'Maison de charme près de Versailles',
    price: 2150,
    city: 'Versailles',
    sector: 'Saint-Louis',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    descriptionShort:
      'Maison avec jardin, terrasse et grandes pièces, à 10 minutes de la gare RER pour Paris.',
    descriptionLong:
      "Maison familiale dans un quartier calme, comprenant un salon lumineux, une cuisine équipée, 3 chambres, 2 salles de bain et un jardin privé. Le salon donne sur une terrasse ensoleillée, parfait pour les apéros d'été.",
    images: [
      'https://via.placeholder.com/1200x800?text=Maison+1',
      'https://via.placeholder.com/1200x800?text=Maison+2',
      'https://via.placeholder.com/1200x800?text=Maison+3',
    ],
    status: 'approved',
    ownerId: 'user-3',
    ownerName: 'Lucas Bernard',
    ownerEmail: 'lucas@example.com',
    ownerPhone: '+33 6 98 76 54 32',
    bookingUrl: 'https://calendly.com/nowis/versailles',
    featured: false,
    createdAt: '2026-03-03T09:15:00.000Z',
    updatedAt: '2026-03-03T09:15:00.000Z',
  },
];
