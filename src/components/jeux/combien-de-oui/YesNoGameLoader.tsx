'use client';

import dynamic from 'next/dynamic';

// Le jeu dépend du navigateur (session de joueur, lien de partage) : pas de rendu serveur.
export const YesNoGameLoader = dynamic(() => import('./YesNoGame').then((mod) => mod.YesNoGame), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#02030a]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" aria-label="Chargement du jeu" />
    </div>
  ),
});
