export type Testimonial = {
  id: string;
  name: string;
  role?: string;
  quote: string;
  avatar?: string;
};

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Camille L.',
    role: 'Fondatrice - Studio créatif',
    quote:
      "Simon a transformé mon brief en une chanson incroyable. Le résultat a dépassé mes attentes et a créé une vraie émotion.",
    avatar: '/hero.jpg',
  },
  {
    id: 't2',
    name: 'Maxime D.',
    role: 'Community manager',
    quote:
      "La vidéo reçue était parfaitement alignée à notre identité visuelle. Les retours de l'audience ont été excellents.",
    avatar: '/hero.jpg',
  },
  {
    id: 't3',
    name: 'Sophie R.',
    role: 'Entrepreneure',
    quote:
      "Rapide, pro et créatif. J'adore le côté humain malgré l'utilisation de l'IA. Je recommande vivement.",
    avatar: '/hero.jpg',
  },
];
