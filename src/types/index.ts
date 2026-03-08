/**
 * Types personnalisés pour l'application NOWIS
 */

export type UserRole = 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string; // ISO date
}

export type ListingStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Listing {
  id: string;
  slug: string;
  title: string;
  price: number; // en euros
  address?: string;
  city: string;
  postalCode?: string;
  sector?: string;
  propertyType?: string;
  bedrooms: number;
  bathrooms: number;
  area: number; // surface en m²
  availabilityDate?: string; // ISO date
  descriptionShort: string;
  descriptionLong: string;
  includedItems?: string[];
  excludedItems?: string[];
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  parking?: boolean;
  furnished?: boolean;
  heating?: string;
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  bookingUrl?: string;
  status: ListingStatus;
  featured?: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  tags: string[];
  link?: string;
}

export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  price?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface BookingFormData {
  name: string;
  email: string;
  phone?: string;
  service: string;
  date: string;
  time: string;
  message?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

// Legacy type alias (maintenir la compatibilité avec l'ancienne structure)
export type Logement = Listing;
