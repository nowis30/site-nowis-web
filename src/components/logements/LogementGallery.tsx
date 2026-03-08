'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Logement } from '@/types';

interface LogementGalleryProps {
  logement: Logement;
}

export const LogementGallery: React.FC<LogementGalleryProps> = ({ logement }) => {
  const images = logement.images && logement.images.length > 0 ? logement.images : ['/hero.jpg'];
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-4">
      <div className="relative w-full h-64 md:h-[420px] rounded-xl overflow-hidden bg-slate-900">
        <Image
          src={images[activeIndex]}
          alt={`Photo ${activeIndex + 1} de ${logement.title}`}
          fill
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                index === activeIndex
                  ? 'border-green-500 ring-2 ring-green-500'
                  : 'border-transparent hover:border-slate-500'
              }`}
            >
              <Image src={src} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
              <span className="sr-only">Afficher l&#39;image {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
