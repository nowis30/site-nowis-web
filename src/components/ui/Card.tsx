/**
 * Card Component
 * Composant de carte réutilisable pour afficher du contenu en grille.
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.82),rgba(15,23,42,0.72))] p-4 text-slate-100 shadow-soft backdrop-blur-sm transition-colors duration-200 hover:border-primary-400/45 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};
