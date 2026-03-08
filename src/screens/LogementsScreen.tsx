'use client';

import React, { useMemo, useState } from 'react';
import { SectionTitle } from '@/components/ui';
import { LogementCard } from '@/components/logements/LogementCard';
import type { Listing } from '@/types';

type PriceRange = 'all' | 'under-1000' | '1000-1500' | '1500-2000' | 'over-2000';

interface LogementsScreenProps {
  logements: Listing[];
}

export const LogementsScreen: React.FC<LogementsScreenProps> = ({ logements }) => {
  const [city, setCity] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [bedrooms, setBedrooms] = useState<string>('all');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);

  const cities = useMemo(() => {
    const unique = Array.from(new Set(logements.map((l) => l.city).filter(Boolean)));
    return unique.sort();
  }, [logements]);

  const filteredLogements = useMemo(() => {
    return logements.filter((logement) => {
      if (city !== 'all' && logement.city !== city) return false;
      if (availableOnly && logement.status !== 'approved') return false;

      if (bedrooms !== 'all' && logement.bedrooms !== Number(bedrooms)) return false;

      const price = logement.price;
      if (priceRange === 'under-1000' && price >= 1000) return false;
      if (priceRange === '1000-1500' && (price < 1000 || price > 1500)) return false;
      if (priceRange === '1500-2000' && (price < 1500 || price > 2000)) return false;
      if (priceRange === 'over-2000' && price <= 2000) return false;

      return true;
    });
  }, [logements, city, priceRange, bedrooms, availableOnly]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center">
        <SectionTitle
          title="Logements à louer"
          subtitle="Découvrez nos offres, comparez les caractéristiques et prenez rendez-vous pour une visite en quelques clics."
        />
      </div>

      <section className="mb-10">
        <h3 className="text-lg font-semibold text-white mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Ville</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            >
              <option value="all">Toutes</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Prix</span>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as PriceRange)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            >
              <option value="all">Tous</option>
              <option value="under-1000">Moins de 1000€</option>
              <option value="1000-1500">1000€ - 1500€</option>
              <option value="1500-2000">1500€ - 2000€</option>
              <option value="over-2000">Plus de 2000€</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Chambres</span>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            >
              <option value="all">Toutes</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4+</option>
            </select>
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500"
            />
            <span className="text-slate-300">Disponibles maintenant</span>
          </label>
        </div>
      </section>

      {filteredLogements.length === 0 ? (
        <div className="rounded-xl p-8 bg-slate-900 border border-slate-700 text-center">
          <h3 className="text-xl font-semibold text-white">Aucun logement ne correspond à vos critères.</h3>
          <p className="mt-2 text-slate-400">Essayez d&#39;ajuster les filtres pour afficher plus de résultats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLogements.map((logement) => (
            <LogementCard key={logement.id} logement={logement} />
          ))}
        </div>
      )}

      <div className="mt-12 text-sm text-slate-400">
        <p>
          Tous nos logements sont listés à titre indicatif. Les disponibilités et les tarifs peuvent
          varier. Contactez-nous pour une confirmation en temps réel.
        </p>
      </div>
    </div>
  );
};
