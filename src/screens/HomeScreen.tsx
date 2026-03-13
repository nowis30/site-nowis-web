import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';

export const HomeScreen = () => {
  const services = [
    {
      title: 'Musique sur mesure',
      text: 'Chansons personnalisées, refrains accrocheurs, ambiances touchantes ou percutantes pour événements, familles, entreprises et projets spéciaux.',
      icon: '🎵',
    },
    {
      title: 'Vidéos et pubs IA',
      text: 'Clips, vidéos amusantes, publicités, contenus courts pour réseaux sociaux et idées visuelles qui attirent vite l’attention.',
      icon: '🎬',
    },
    {
      title: 'Visuels et concepts créatifs',
      text: 'Images promotionnelles, pochettes, concepts de chandails, affiches et identité visuelle bâtis avec une direction artistique claire.',
      icon: '🎨',
    },
    {
      title: 'Sites web avec l’IA',
      text: 'Création ou amélioration de pages web pour présenter un projet, vendre une idée, afficher des logements ou bâtir une vitrine professionnelle.',
      icon: '💻',
    },
    {
      title: 'Jeux et expériences interactives',
      text: 'Concepts de jeux, pages interactives, idées ludiques et univers numériques pour rendre un projet plus vivant et plus mémorable.',
      icon: '🎮',
    },
  ];

  const projects = [
    {
      title: 'Ma musique',
      text: 'Des chansons créées pour émouvoir, faire sourire, marquer un moment ou donner une voix unique à une histoire.',
      link: '/musique',
    },
    {
      title: 'Mes vidéos',
      text: 'Des vidéos créatives faites avec l’IA pour attirer l’œil, raconter une idée et donner de la personnalité à un projet.',
      link: '/videos',
    },
    {
      title: 'Mes services',
      text: 'Une vue d’ensemble de ce que je peux créer pour des particuliers, des entreprises ou des projets originaux.',
      link: '/services',
    },
    {
      title: 'Mes jeux',
      text: 'Des expériences interactives qui montrent que je ne fais pas juste du contenu : je bâtis aussi des univers numériques.',
      link: '/jeux',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-fuchsia-500 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-500 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:px-10 lg:px-12 lg:py-28">
          <div className="flex flex-col justify-center">
            <p className="mb-4 inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-200">
              Création musicale • vidéos IA • visuels • sites web • jeux
            </p>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Nowis Morin
              <span className="mt-2 block text-cyan-300">
                artiste, créateur et bâtisseur d’univers avec l’IA
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 md:text-xl">
              Je transforme des idées en projets concrets : chansons, vidéos,
              images, sites web et expériences interactives. L’intelligence
              artificielle est mon atelier. La vision, la couleur et la
              personnalité, c’est moi qui les pousse au bon endroit.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <ContactPrefillLink
                href="/contact"
                className="rounded-2xl bg-white px-6 py-3 font-semibold text-zinc-950 transition hover:scale-[1.02]"
              >
                Parler à Nowis Morin
              </ContactPrefillLink>
              <Link
                href="/services"
                className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Voir ce que je fais
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-400">Approche</p>
                <p className="mt-2 font-semibold">Créativité + IA + impact</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-400">Style</p>
                <p className="mt-2 font-semibold">Humain, original, mémorable</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-400">Mission</p>
                <p className="mt-2 font-semibold">Faire vivre tes idées</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-900">
                <img
                  src="/hero.jpg"
                  alt="Nowis Morin"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-zinc-500">Ce que les gens voient</p>
                  <p className="mt-1 font-semibold text-white">Un créateur polyvalent</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-zinc-500">Ce qu’ils retiennent</p>
                  <p className="mt-1 font-semibold text-white">La signature Nowis Morin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Ce que je fais
          </p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">
            Tout part de Nowis Morin.
          </h2>
          <p className="mt-5 text-lg leading-8 text-zinc-300">
            Je ne fais pas juste une chose. Je bâtis des projets créatifs sous
            plusieurs formes, toujours avec la même idée : créer quelque chose
            qui frappe, qui sert et qui laisse une trace.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <div className="text-3xl">{service.icon}</div>
              <h3 className="mt-4 text-xl font-bold">{service.title}</h3>
              <p className="mt-3 leading-7 text-zinc-300">{service.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-zinc-900/60">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
                Pourquoi moi
              </p>
              <h2 className="mt-3 text-3xl font-black md:text-5xl">
                Une idée floue peut devenir un vrai projet.
              </h2>
              <p className="mt-5 text-lg leading-8 text-zinc-300">
                Beaucoup de gens ont une vision, mais ne savent pas comment la
                transformer en quelque chose de présentable. Moi, je peux prendre
                cette idée, lui donner une direction, une image, une voix et une
                forme concrète.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Je peux créer vite sans sacrifier la personnalité.',
                'Je relie musique, image, vidéo et web dans un même univers.',
                'Je peux passer d’un concept simple à une présentation marquante.',
                'Je garde Nowis Morin comme signature forte sur chaque projet.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-base leading-7 text-zinc-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
              Projets signés Nowis
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Des preuves, pas juste des promesses.
            </h2>
            <p className="mt-5 text-lg leading-8 text-zinc-300">
              Chaque section de mon site montre une partie de mon univers. Le
              but n’est pas seulement de parler de créativité, mais de la montrer
              pour vrai.
            </p>
          </div>
          <Link
            href="/services"
            className="w-fit rounded-2xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Explorer mes projets
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.title}
              href={project.link}
              className="group rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-2xl font-bold">{project.title}</h3>
                <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-white">
                  →
                </span>
              </div>
              <p className="mt-3 leading-7 text-zinc-300">{project.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:px-10 lg:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            On commence ici
          </p>
          <h2 className="mt-4 text-3xl font-black md:text-5xl">
            Tu veux une chanson, une vidéo, un visuel, un site ou un concept?
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
            Je peux t’aider à transformer ton idée en projet concret. Que ce soit
            pour une émotion, une promotion, une image de marque ou un concept
            original, on peut lui donner une vraie présence.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <ContactPrefillLink
              href="/contact"
              className="rounded-2xl bg-white px-6 py-3 font-semibold text-zinc-950 transition hover:scale-[1.02]"
            >
              Me contacter
            </ContactPrefillLink>
            <Link
              href="/musique"
              className="rounded-2xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Écouter ma musique
            </Link>
            <Link
              href="/videos"
              className="rounded-2xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Voir mes vidéos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
