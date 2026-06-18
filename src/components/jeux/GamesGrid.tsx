'use client';

import { GameCard } from './GameCard';
import { gameCatalog } from './gameCatalog';
import {
  Dice5, Ghost, Crown, Gamepad2, Shuffle, Lightbulb, Wind, Scissors,
  Bird, Square, BookOpen, User, Layers, Target, Grid3x3, Pickaxe,
  Zap, Flame, RotateCw, Settings, Compass, CreditCard, Dice6, Power,
  Activity, Bug, Keyboard, Dices, Circle, FastForward, Mic,
  Sword, Brain, Smile, Hand, Puzzle, Sparkles, Award
} from 'lucide-react';

// Game descriptions
const gameDetails = [
  { icon: <Dice5 size={24} />, description: 'Élimine les bonbons alignés' },
  { icon: <Ghost size={24} />, description: 'Récupère les pastilles' },
  { icon: <Crown size={24} />, description: 'Jeu d\'échecs classique' },
  { icon: <Gamepad2 size={24} />, description: 'Saute pour avancer' },
  { icon: <Shuffle size={24} />, description: 'Dispose les cartes' },
  { icon: <Lightbulb size={24} />, description: 'Remplis la grille' },
  { icon: <Wind size={24} />, description: 'Traverse la route' },
  { icon: <Scissors size={24} />, description: 'Pierre, papier, ciseaux' },
  { icon: <Bird size={24} />, description: 'Flappy Bird version web' },
  { icon: <Square size={24} />, description: 'Fusionne les nombres' },
  { icon: <BookOpen size={24} />, description: 'Trouve le mot en 6 coups' },
  { icon: <User size={24} />, description: 'Pendu interactif' },
  { icon: <Layers size={24} />, description: 'Empile les blocs' },
  { icon: <Target size={24} />, description: 'Tire sur les cibles' },
  { icon: <Grid3x3 size={24} />, description: 'Stratégie avec pions' },
  { icon: <Pickaxe size={24} />, description: 'Dégages les mines' },
  { icon: <Zap size={24} />, description: 'Course de vitesse' },
  { icon: <Flame size={24} />, description: 'Casse les briques' },
  { icon: <RotateCw size={24} />, description: 'Joue au Pong' },
  { icon: <Settings size={24} />, description: 'Empile les pièces' },
  { icon: <Compass size={24} />, description: 'Navigue le labyrinthe' },
  { icon: <CreditCard size={24} />, description: 'Trouve les paires' },
  { icon: <Dice6 size={24} />, description: 'Devine le nombre' },
  { icon: <Power size={24} />, description: 'Mange les pommes' },
  { icon: <Activity size={24} />, description: 'Connecte quatre pions' },
  { icon: <Bug size={24} />, description: 'Attrape les insectes' },
  { icon: <Keyboard size={24} />, description: 'Tape rapidement' },
  { icon: <Dices size={24} />, description: 'Lance les dés' },
  { icon: <Circle size={24} />, description: 'Clique sur les formes' },
  { icon: <FastForward size={24} />, description: 'Tape encore plus vite' },
  { icon: <Mic size={24} />, description: 'Devine le nombre en parlant' },
  { icon: <Sword size={24} />, description: 'Coupe les fruits' },
  { icon: <Brain size={24} />, description: 'Teste tes connaissances' },
  { icon: <Smile size={24} />, description: 'Attrape les emojis' },
  { icon: <Hand size={24} />, description: 'Tape la taupe' },
  { icon: <Award size={24} />, description: 'Répète la séquence' },
  { icon: <Puzzle size={24} />, description: 'Reconnecte le puzzle' },
];

export function GamesGrid() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {gameCatalog.map((game, index) => (
        <GameCard
          key={game.slug}
          {...game}
          index={index}
          icon={gameDetails[index]?.icon || <Gamepad2 size={24} />}
          description={gameDetails[index]?.description || 'Mini-jeu amusant'}
        />
      ))}
    </div>
  );
}
