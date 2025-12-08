/**
 * ProjectCard Component
 * Carte pour afficher un projet du portfolio avec image, titre et description.
 * ÉDITABLE: Modifie les styles selon tes besoins.
 */

'use client';

import React from 'react';
import Image from 'next/image';

interface ProjectCardProps {
  title: string;
  description: string;
  imageSrc?: string; // Optionnel: si absent, on affiche un fallback cartoon
  imageAlt?: string;
  fallbackEmoji?: string;
  tags?: string[];
  href?: string; // Optionnel: lien externe (ex: Etsy)
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  imageSrc,
  imageAlt,
  fallbackEmoji = '🏕️',
  tags = [],
  href,
  onClick,
}) => {
  const Wrapper = href ? 'a' : 'div';
  const clickableProps = href
    ? { href, target: '_blank', rel: 'noreferrer' }
    : {};

  return (
    <Wrapper
      className="group cursor-pointer rounded-lg overflow-hidden bg-slate-800 hover:bg-slate-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-camp-flame"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onClick) onClick();
      }}
      {...clickableProps}
    >
      {/* Image ou fallback */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-gradient-to-br from-camp-purple to-camp-violet flex items-center justify-center">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt || title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-6xl" aria-hidden>
            {fallbackEmoji}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-sm md:text-base text-slate-300 mb-4 line-clamp-3">
          {description}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-camp-forest/60 text-camp-cream rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  );
};
