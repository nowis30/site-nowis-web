/**
 * SectionTitle Component
 * Titre de section avec description optionnelle.
 */

import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  centered = false,
}) => {
  return (
    <div className={`mb-8 md:mb-12 ${centered ? 'text-center' : ''}`}>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h2>
      {subtitle && <p className="text-lg text-slate-400">{subtitle}</p>}
    </div>
  );
};
