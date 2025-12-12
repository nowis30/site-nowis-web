/**
 * BackgroundMusic Component
 * Lecteur audio de fond avec contrôles pour jouer/mettre en pause
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';

export const BackgroundMusic: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Tenter de jouer automatiquement au chargement
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.3; // Volume à 30% par défaut
      
      // Les navigateurs bloquent l'autoplay, donc on essaye
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Si bloqué, l'utilisateur devra cliquer pour démarrer
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      {/* Audio element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="/music/background.mp3" type="audio/mpeg" />
      </audio>

      {/* Floating controls */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          aria-label={isPlaying ? 'Mettre en pause' : 'Jouer la musique'}
          title={isPlaying ? 'Mettre en pause' : 'Jouer la musique'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          title={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};
