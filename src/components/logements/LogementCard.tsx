import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/types';
import { Card } from '@/components/ui';

interface LogementCardProps {
  logement: Listing;
  className?: string;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export const LogementCard: React.FC<LogementCardProps> = ({ logement, className = '' }) => {
  const imageUrl = logement.images?.[0] || '/hero.jpg';
  const isAvailable = logement.status === 'approved';

  return (
    <Card className={`flex flex-col overflow-hidden ${className}`}>
      <div className="relative h-44 w-full overflow-hidden rounded-md bg-slate-900">
        <Image
          src={imageUrl}
          alt={`Photo de ${logement.title}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {!isAvailable && (
          <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white bg-red-600/90 rounded-full">
            En attente
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{logement.title}</h3>
            <p className="text-sm text-slate-400">
              {logement.city} • {logement.sector}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-green-300">{formatPrice(logement.price)}</p>
            <p className="text-xs text-slate-400">/ mois</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 line-clamp-3">{logement.descriptionShort}</p>

        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            🛏️ {logement.bedrooms} ch.
          </span>
          <span className="inline-flex items-center gap-1">
            🛁 {logement.bathrooms} sdb.
          </span>
          <span className="inline-flex items-center gap-1">
            📐 {logement.area} m²
          </span>
        </div>

        <div className="mt-auto">
          <Link
            href={`/logements/${logement.slug}`}
            className="inline-flex items-center justify-center w-full px-4 py-3 mt-3 text-sm font-semibold text-center text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
          >
            Voir le logement
          </Link>
        </div>
      </div>
    </Card>
  );
};
