import Link from 'next/link';

const alignments = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    label: 'Pensée créatrice',
    color: 'text-amber-300',
    border: 'border-amber-300/20',
    bg: 'bg-[linear-gradient(145deg,rgba(120,80,0,0.18),rgba(180,120,0,0.08))]',
    description:
      'Les jeunes imaginent, explorent et font des choix artistiques concrets. Ils transforment une idée ou une émotion en œuvre réelle — une création musicale qui leur appartient. L\'atelier nourrit la capacité à inventer, à prendre des risques créatifs et à valoriser sa propre perspective.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    label: 'Français et langage',
    color: 'text-sky-300',
    border: 'border-sky-300/20',
    bg: 'bg-[linear-gradient(145deg,rgba(0,80,160,0.18),rgba(0,100,200,0.08))]',
    description:
      'Écrire des paroles exige de choisir les bons mots, de structurer un message, de jouer avec la rime et le rythme. Les jeunes travaillent l\'intention de communication, le vocabulaire expressif et la cohérence du texte dans un contexte réel et motivant — à mille lieues d\'un exercice ordinaire.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
    label: 'Médias et regard critique',
    color: 'text-violet-300',
    border: 'border-violet-300/20',
    bg: 'bg-[linear-gradient(145deg,rgba(80,0,160,0.18),rgba(100,0,200,0.08))]',
    description:
      'L\'atelier ouvre une vraie conversation sur l\'intelligence artificielle : comment ça fonctionne, ce que ça peut faire et ce qu\'il faut humainement apporter. Les jeunes développent leur jugement critique face aux médias numériques, à la création assistée et à la question de l\'authenticité.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    label: 'Citoyenneté numérique',
    color: 'text-emerald-300',
    border: 'border-emerald-300/20',
    bg: 'bg-[linear-gradient(145deg,rgba(0,80,60,0.18),rgba(0,120,80,0.08))]',
    description:
      'Utiliser l\'IA de façon responsable, comprendre les implications éthiques, respecter les idées des autres et agir avec intention dans un espace numérique — les jeunes vivent ces principes concrètement pendant l\'atelier, plutôt que de les apprendre en théorie.',
  },
];

const skills = [
  'Confiance en soi et expression personnelle',
  'Créativité et prise d\'initiative',
  'Collaboration et écoute active',
  'Sens critique face aux outils numériques',
  'Valorisation de leurs idées et de leur vécu',
  'Motivation à écrire, créer et communiquer',
  'Fierté d\'un résultat concret et qui leur appartient',
];

const whyItWorks = [
  {
    title: 'Accessible à tous',
    text: 'Aucune formation musicale n\'est requise. L\'atelier part de l\'expérience et des mots du jeune, pas de prérequis techniques.',
  },
  {
    title: 'Un outil qui les rejoint',
    text: 'L\'intelligence artificielle intrigue et capte l\'attention. Elle devient le point d\'entrée pour une réflexion plus profonde sur la créativité et l\'authenticité.',
  },
  {
    title: 'L\'humain au centre',
    text: 'L\'IA n\'écrit pas à la place du jeune. Elle l\'accompagne. Ce sont ses mots, ses émotions et ses choix qui donnent vie à la création.',
  },
  {
    title: 'Un résultat valorisant',
    text: 'Chaque jeune repart avec quelque chose de réel — une chanson, un texte mis en musique, une création qui leur appartient et qu\'ils peuvent partager.',
  },
  {
    title: 'Adaptable selon votre contexte',
    text: 'Le format peut être ajusté selon l\'âge, la durée, les objectifs pédagogiques et le nombre de participants. Session unique ou série, tout est possible.',
  },
];

export function PfeqSection() {
  return (
    <section className="mt-16 space-y-14" aria-labelledby="pfeq-section-title">

      {/* — En-tête — */}
      <div className="rounded-[2.5rem] border border-primary-300/20 bg-[linear-gradient(145deg,rgba(14,20,44,0.96),rgba(22,30,60,0.90))] p-8 shadow-card md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
          Bienfaits pédagogiques · Alignement avec le PFEQ
        </p>
        <h2
          id="pfeq-section-title"
          className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] text-white md:text-5xl"
        >
          Un atelier créatif qui rejoint les objectifs pédagogiques d'aujourd'hui
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 md:text-lg">
          L'<strong className="text-white">atelier créatif Nowis</strong> soutient le développement de compétences transversales et disciplinaires chez les jeunes — en combinant{' '}
          <em>créativité</em>, <em>expression écrite</em>, <em>réflexion critique</em> et{' '}
          <em>utilisation responsable du numérique</em>. Il est aligné avec certaines dimensions du{' '}
          <strong className="text-white">Programme de formation de l'école québécoise (PFEQ)</strong>,
          sans prétendre à une accréditation officielle.
        </p>
      </div>

      {/* — 4 piliers pédagogiques — */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Alignement pédagogique</p>
        <h3 className="mt-3 font-display text-3xl text-white md:text-4xl">Quatre dimensions développées lors de l'atelier</h3>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {alignments.map((item) => (
            <article
              key={item.label}
              className={`rounded-[2rem] border ${item.border} ${item.bg} p-8 backdrop-blur-sm`}
            >
              <div className={`${item.color}`}>{item.icon}</div>
              <h4 className={`mt-4 font-display text-2xl font-semibold ${item.color}`}>{item.label}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-200">{item.description}</p>
            </article>
          ))}
        </div>
      </div>

      {/* — Ce que les jeunes développent — */}
      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.84),rgba(14,23,42,0.76))] p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Ce que les jeunes développent</p>
        <h3 className="mt-3 font-display text-3xl text-white md:text-4xl">Des compétences qui dépassent la musique</h3>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {skills.map((skill) => (
            <li key={skill} className="flex items-start gap-3 text-sm leading-7 text-slate-200">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">✓</span>
              {skill}
            </li>
          ))}
        </ul>
      </div>

      {/* — Pourquoi ça fonctionne — */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Pourquoi cet atelier fonctionne bien en milieu scolaire</p>
        <h3 className="mt-3 font-display text-3xl text-white md:text-4xl">Un format pensé pour le terrain</h3>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {whyItWorks.map((item) => (
            <article key={item.title} className="brand-card p-7">
              <h4 className="font-display text-2xl text-white">{item.title}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
            </article>
          ))}
        </div>
      </div>

      {/* — CTA final — */}
      <div className="rounded-[2.5rem] border border-emerald-400/20 bg-[linear-gradient(145deg,rgba(4,33,32,0.90),rgba(10,48,47,0.80))] p-8 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Prêt à en parler</p>
        <h3 className="mt-4 max-w-2xl font-display text-3xl leading-tight text-white md:text-4xl">
          Intégrez l'atelier à votre projet éducatif, culturel ou parascolaire
        </h3>
        <p className="mt-4 max-w-2xl text-base leading-8 text-emerald-50/90">
          Cet <strong className="text-white">atelier éducatif</strong> peut s'intégrer à une activité spéciale, à un{' '}
          <strong className="text-white">projet scolaire au Québec</strong>, à un parcours culturel ou à une démarche de valorisation de l'expression des jeunes.
          Il est ouvert aux écoles primaires et secondaires, aux maisons des jeunes, aux camps et à tout organisme travaillant avec la jeunesse.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/ateliers/demande"
            className="rounded-xl bg-emerald-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-500"
          >
            Présenter l'atelier à votre milieu
          </Link>
          <Link
            href="/inscription?next=%2Fclient%2Fworkshops%2Fnouveau"
            className="rounded-xl border border-white/10 bg-slate-950/50 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
          >
            Créer un compte et faire une demande
          </Link>
        </div>
      </div>

    </section>
  );
}
