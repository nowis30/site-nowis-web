/**
 * SocialLinks Component
 * Displays clickable social media links with icons
 */

'use client';

import React from 'react';
import { socialLinks } from '@/config/socialLinks';

interface SocialLinksProps {
  className?: string;
  showLabel?: boolean;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ className = '', showLabel = true }) => {
  const platforms = [
    { key: 'instagram', icon: '📷', label: 'Instagram' },
    { key: 'facebook', icon: '👤', label: 'Facebook' },
    { key: 'spotify', icon: '🎵', label: 'Spotify' },
    { key: 'youtube', icon: '▶️', label: 'YouTube' },
  ];

  return (
    <div className={`flex flex-wrap gap-4 justify-center ${className}`}>
      {platforms.map(({ key, icon, label }) => {
        const url = socialLinks[key as keyof typeof socialLinks];
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            aria-label={`Visiter ${label}`}
            title={label}
          >
            <span className="text-lg">{icon}</span>
            {showLabel && <span className="text-sm font-medium">{label}</span>}
          </a>
        );
      })}
    </div>
  );
};
