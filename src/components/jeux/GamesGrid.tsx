'use client';

import { GameCard } from './GameCard';
import { gameCatalog } from './gameCatalog';
import {
  Dice5, Ghost, Crown, Gamepad2, Shuffle, Lightbulb, Wind, Scissors,
  Bird, Square, BookOpen, User, Layers, Target, Grid3x3, Pickaxe,
  Zap, Flame, RotateCw, Settings, Compass, CreditCard, Dice6, Power,
  Activity, Bug, Keyboard, Dices, Circle, FastForward, Mic,
  Sword, Brain, Smile, Hand, Puzzle, Award
} from 'lucide-react';

const gameDetails = [
  { icon: <Dice5 size={24} />, description: 'Élimine les bonbons alignés', interaction: 'Glisser' },
  { icon: <Ghost size={24} />, description: 'Récupère les pastilles', interaction: 'Glisser' },
  { icon: <Crown size={24} />, description: 'Jeu d\'échecs classique', interaction: 'Toucher' },
  { icon: <Gamepad2 size={24} />, description: 'Saute pour avancer', interaction: 'Gauche / droite' },
  { icon: <Shuffle size={24} />, description: 'Dispose les cartes', interaction: 'Toucher / glisser' },
  { icon: <Lightbulb size={24} />, description: 'Remplis la grille', interaction: 'Toucher + chiffres' },
  { icon: <Wind size={24} />, description: 'Traverse la route', interaction: 'Glisser' },
  { icon: <Scissors size={24} />, description: 'Pierre, papier, ciseaux', interaction: 'Toucher' },
  { icon: <Bird size={24} />, description: 'Flappy Bird version web', interaction: 'Tap' },
  { icon: <Square size={24} />, description: 'Fusionne les nombres', interaction: 'Glisser' },
  { icon: <BookOpen size={24} />, description: 'Trouve le mot en 6 coups', interaction: 'Clavier' },
  { icon: <User size={24} />, description: 'Pendu interactif', interaction: 'Lettres tactiles' },
  { icon: <Layers size={24} />, description: 'Empile les blocs', interaction: 'Tap' },
  { icon: <Target size={24} />, description: 'Tire sur les cibles', interaction: 'Viser / toucher' },
  { icon: <Grid3x3 size={24} />, description: 'Stratégie avec pions', interaction: 'Toucher' },
  { icon: <Pickaxe size={24} />, description: 'Dégage les mines', interaction: 'Toucher' },
  { icon: <Zap size={24} />, description: 'Course de vitesse', interaction: 'Clavier' },
  { icon: <Flame size={24} />, description: 'Casse les briques', interaction: 'Glisser' },
  { icon: <RotateCw size={24} />, description: 'Joue au Pong', interaction: 'Glisser' },
  { icon: <Settings size={24} />, description: 'Empile les pièces', interaction: 'Toucher / glisser' },
  { icon: <Compass size={24} />, description: 'Navigue le labyrinthe', interaction: 'Glisser' },
  { icon: <CreditCard size={24} />, description: 'Trouve les paires', interaction: 'Toucher' },
  { icon: <Dice6 size={24} />, description: 'Devine le nombre', interaction: 'Clavier numérique' },
  { icon: <Power size={24} />, description: 'Mange les pommes', interaction: 'Glisser' },
  { icon: <Activity size={24} />, description: 'Connecte quatre pions', interaction: 'Toucher' },
  { icon: <Bug size={24} />, description: 'Attrape les insectes', interaction: 'Toucher' },
  { icon: <Keyboard size={24} />, description: 'Tape rapidement', interaction: 'Clavier' },
  { icon: <Dices size={24} />, description: 'Lance les dés', interaction: 'Toucher' },
  { icon: <Circle size={24} />, description: 'Clique sur les formes', interaction: 'Toucher' },
  { icon: <FastForward size={24} />, description: 'Nouveau défi de frappe', interaction: 'Clavier' },
  { icon: <Mic size={24} />, description: 'Devine le nombre en parlant', interaction: 'Voix / clavier' },
  { icon: <Sword size={24} />, description: 'Coupe les fruits', interaction: 'Glisser' },
  { icon: <Brain size={24} />, description: 'Teste tes connaissances', interaction: 'Toucher' },
  { icon: <Smile size={24} />, description: 'Attrape les emojis', interaction: 'Glisser' },
  { icon: <Hand size={24} />, description: 'Tape la taupe', interaction: 'Toucher' },
  { icon: <Award size={24} />, description: 'Répète la séquence', interaction: 'Toucher' },
  { icon: <Puzzle size={24} />, description: 'Reconnecte le puzzle', interaction: 'Toucher' },
];

export function GamesGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {gameCatalog.map((game, index) => {
        const details = gameDetails[index];

        return (
          <GameCard
            key={game.slug}
            {...game}
            index={index}
            icon={details?.icon || <Gamepad2 size={24} />}
            description={details?.description || 'Mini-jeu amusant'}
            interaction={details?.interaction || 'Toucher'}
          />
        );
      })}
    </div>
  );
}
