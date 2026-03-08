/**
 * ProjectCard Component
 * Carte pour afficher un projet du portfolio avec image, titre et description.
 * ÉDITABLE: Modifie les styles selon tes besoins.
 */

'use client';

import React from 'react';
import Image from 'next/image';

type Platform = 'spotify' | 'youtube' | 'printify' | 'other';

interface ProjectCardProps {
  title: string;
  description: string;
  imageSrc?: string; // Optionnel: si absent, on affiche un fallback cartoon
  imageAlt?: string;
  fallbackEmoji?: string;
  tags?: string[];
  href?: string; // Optionnel: lien externe (ex: Etsy)
  platform?: Platform;
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
  platform,
  onClick,
}) => {
  // Always render an anchor tag so server and client markup stay consistent.
  // If no href is provided, we keep it inert and still allow click handlers.
  const realHref = href || '#';

  const renderPlatformIcon = (size = 20) => {
    const baseClasses =
      'rounded-full flex items-center justify-center text-white shadow-md';

    const style = { width: size, height: size };

    switch (platform) {
      case 'spotify':
        return (
          <div
            className={`${baseClasses} bg-[#1DB954]`}
            style={style}
            title="Spotify"
            aria-label="Spotify"
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 168 168"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M84 0C37.6 0 0 37.6 0 84C0 130.4 37.6 168 84 168C130.4 168 168 130.4 168 84C168 37.6 130.4 0 84 0Z"
                fill="#1DB954"
              />
              <path
                d="M123.2 117.2C118.8 122 112.4 122.4 107.2 118.8C81.2 103.6 52.4 101.6 25.2 108.4C19.2 109.6 13.6 106 12.4 100C11.2 94 14.8 88.4 20.8 87.2C52 80 84.8 82.4 114.4 98C119.6 100.8 122 106 123.2 111.2C124 114 123.6 115.6 123.2 117.2Z"
                fill="white"
              />
              <path
                d="M128.4 94C123.6 99.2 116 99.6 110.2 96.4C79.6 82 45.6 80.4 14.4 88.8C8.4 90 3.2 85.6 2 79.6C0.8 73.6 5.2 68.4 11.2 67.2C45.2 57.6 82 59.6 113.2 75.6C119.6 78.4 124 84 125.6 89.6C126.4 92.8 126 94.4 125.2 94.8C124.4 95.2 123.6 95.2 122.8 94.8H128.4Z"
                fill="white"
              />
              <path
                d="M125.6 74.8C119.6 80.4 110 80.8 103.6 77.2C73.2 63.2 37.6 61.6 7.6 69.6C0.8 70.8 -2.4 65.2 0.4 60C3.2 54.8 8.8 51.6 14.8 50.4C49.6 42 87.2 44.4 116.8 60.4C123.2 63.6 127.6 70 129.2 76.8C130 80.4 129.6 82.4 129.2 83C128.8 83.6 128 83.6 127.2 83.2H125.6Z"
                fill="white"
              />
            </svg>
          </div>
        );
      case 'youtube':
        return (
          <div
            className={`${baseClasses} bg-[#FF0000]`}
            style={style}
            title="YouTube"
            aria-label="YouTube"
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.498 6.186c-.275-1.03-1.082-1.84-2.112-2.112C19.738 3.5 12 3.5 12 3.5s-7.738 0-9.386.574c-1.03.272-1.837 1.083-2.112 2.112C0 7.838 0 12 0 12s0 4.162.502 5.814c.275 1.03 1.082 1.84 2.112 2.112C4.262 20.5 12 20.5 12 20.5s7.738 0 9.386-.574c1.03-.272 1.837-1.083 2.112-2.112C24 16.162 24 12 24 12s0-4.162-.502-5.814Z"
                fill="white"
              />
              <path d="M9.545 15.568l6.545-3.568-6.545-3.568v7.136Z" fill="#FF0000" />
            </svg>
          </div>
        );
      case 'printify':
        return (
          <div
            className={`${baseClasses} bg-[#004C65]`}
            style={style}
            title="Printify"
            aria-label="Printify"
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z"
                fill="#004C65"
              />
              <path
                d="M9 11C9 9.343 10.343 8 12 8H20C21.657 8 23 9.343 23 11V21C23 22.657 21.657 24 20 24H12C10.343 24 9 22.657 9 21V11Z"
                fill="white"
              />
              <path
                d="M12 17C12 15.343 13.343 14 15 14H17C18.657 14 20 15.343 20 17V19C20 20.657 18.657 22 17 22H15C13.343 22 12 20.657 12 19V17Z"
                fill="#004C65"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <a
      className="group cursor-pointer rounded-lg overflow-hidden bg-slate-800 hover:bg-slate-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-camp-flame"
      href={realHref}
      target={href ? '_blank' : undefined}
      rel={href ? 'noreferrer' : undefined}
      onClick={onClick}
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

        <div className="absolute top-4 right-4">{renderPlatformIcon()}</div>
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

        {href && platform && (
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm">
              {renderPlatformIcon(16)}
              <span>
                Ouvrir sur{' '}
                {platform === 'spotify'
                  ? 'Spotify'
                  : platform === 'youtube'
                  ? 'YouTube'
                  : platform === 'printify'
                  ? 'Printify'
                  : 'le site'}
              </span>
            </span>
          </div>
        )}
      </div>
    </a>
  );
};
