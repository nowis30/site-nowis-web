/**
 * ServiceCard Component
 * Carte pour afficher un service avec icône, titre et description.
 * ÉDITABLE: Modifie l'icône, les couleurs et le contenu.
 */

'use client';

import React, { ReactNode } from 'react';

interface ServiceCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  features?: string[];
  onClick?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  title,
  description,
  features = [],
  onClick,
}) => {
  return (
    <div
      className="p-6 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-slate-700 hover:border-green-500"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && onClick) onClick();
      }}
    >
      {/* Icon */}
      <div className="w-14 h-14 mb-4 flex items-center justify-center bg-green-900 rounded-lg text-2xl">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg md:text-xl font-bold text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm md:text-base text-slate-300 mb-4">
        {description}
      </p>

      {/* Features List */}
      {features.length > 0 && (
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="text-sm text-slate-400 flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
