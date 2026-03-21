/**
 * Button Component
 * Composant de bouton réutilisable avec plusieurs variantes.
 * Taille minimale tactile: 48px pour mobile.
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold leading-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-coal-950';
  
  const variantClasses = {
    primary: 'bg-brand-warm text-white shadow-fire hover:-translate-y-0.5 hover:brightness-110 focus:ring-primary-500',
    secondary: 'border border-white/15 bg-white/8 text-slate-50 hover:bg-white/14 focus:ring-primary-500',
    outline: 'border border-primary-300/55 bg-primary-500/8 text-primary-100 hover:bg-primary-500/16 hover:text-white focus:ring-primary-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-10',
    md: 'px-4 py-3 text-base min-h-12',
    lg: 'px-6 py-4 text-lg min-h-14',
  };

  return (
    <button
      type={props.type ?? 'button'}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
