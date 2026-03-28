import Image from 'next/image';
import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { getHomeSongs } from '@/data/songs';
import { satisfactionGuarantee, songPackages, songSalesCtas } from '@/data/songSales';

const packagePrices: Record<string, string> = {
  'Mise en chanson': '49,99 $',
  'Chanson personnalisée': '99,99 $',
  'Chanson émotion': '149,99 $',
};

const emotionStatements = [
  'Tu veux offrir quelque chose de vrai.',
  'Tu veux dire merci, je t’aime, je pense à toi ou je suis fier de toi.',
  'Moi, je transforme ça en chanson.',
];

const trustReasons = [
  {
    title: 'Chaque chanson part d’un vrai vécu',
    description: 'Je ne produis pas une formule impersonnelle. Je pars de ton histoire, de tes mots et de l’émotion que tu veux transmettre.',
  },
  {
    title: 'Tu parles à une vraie personne',
    description: 'Je prends le temps de comprendre ce que tu veux faire ressentir. L’IA m’aide à créer, mais elle ne remplace jamais l’écoute ni la sensibilité.',
  },
  {
    title: 'La chanson est pensée pour la personne qui la reçoit',
    description: 'Le ton, les mots et l’ambiance sont pensés pour créer un vrai moment, pas juste un beau fichier audio.',
  },
  {
    title: 'Le contact reste simple et humain',
    description: 'Tu peux m’écrire avec une idée encore floue. Je t’aide à la clarifier sans pression et sans jargon.',
  },
];

const testimonials = [
  {
    quote: 'J’ai eu des frissons en entendant la chanson. On sent qu’il y avait quelque chose de vrai du début à la fin.',
    author: 'Mélanie',
    context: 'Cadeau pour un anniversaire',
  },
  {
    quote: 'C’était le plus beau cadeau que je pouvais offrir. La chanson a touché tout le monde sans en faire trop.',
    author: 'Patrick',
    context: 'Projet pour un proche',
  },
  {
    quote: 'On sent que ce n’est pas fait à la chaîne. Il y a une vraie sensibilité derrière chaque création.',
    author: 'Julie',
    context: 'Chanson souvenir',
  },
];

const processSteps = [
  {
    title: 'Tu me racontes ce que tu veux dire',
    description: 'Un souvenir, une relation, un message du cœur ou quelques lignes suffisent pour commencer.',
  },
  {
    title: 'Je transforme ça en chanson',
    description: 'Je construis une direction musicale fidèle à l’émotion, avec une vraie attention au ton et aux mots.',
  },
  {
    title: 'Tu offres quelque chose d’unique',
    description: 'Tu reçois une création pensée pour toucher, marquer et rester dans le temps.',
  },
];

function buildExampleHref(title: string) {
  const message = `Bonjour, j’aime beaucoup l’exemple « ${title} ». Je veux une chanson personnalisée dans le même esprit pour mon histoire.`;
  return `/contact?projectType=chanson&message=${encodeURIComponent(message)}`;
}

export const HomeScreen = async () => {
  const songs = await getHomeSongs(4);

  return (
    <div className="relative overflow-hidden bg-transparent text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(99,102,241,0.12),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(168,85,247,0.12),transparent_20%),radial-gradient(circle_at_76%_38%,rgba(59,130,246,0.08),transparent_22%)]" />
      <section className="brand-shell brand-grid">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(99,102,241,0.18),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(168,85,247,0.14),transparent_22%),radial-gradient(circle_at_74%_62%,rgba(59,130,246,0.10),transparent_24%),linear-gradient(180deg,rgba(9,10,13,0.14)_0%,rgba(9,10,13,0.40)_40%,rgba(9,10,13,0.84)_100%)]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,0.55)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-24 lg:py-28">
          <div className="relative z-10">
            <p className="brand-chip">Chansons personnalisées</p>
            <h1 className="brand-metal-text mt-6 max-w-4xl font-display text-5xl leading-[0.95] md:text-7xl xl:text-[5.5rem]">
              Création musicale sur mesure et ateliers créatifs pour enfants
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100 md:text-xl">
              Nowis réunit deux univers clairs : la chanson personnalisée pour les particuliers et les projets sensibles, puis les ateliers créatifs conçus pour les écoles, organismes et groupes d’enfants.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href={songSalesCtas.order.href}
                className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3.5 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Commander une chanson
              </Link>
              <Link
                href="/ateliers/demande"
                className="inline-flex items-center justify-center rounded-xl border border-amber-200/30 bg-amber-500/10 px-6 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-amber-500/20"
              >
                Demander un atelier
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-slate-950/55 px-6 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-primary-500/12"
              >
                Accès client
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-md">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-200">Volet musique</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">Demandes de chanson, briefs créatifs, échanges, paroles, démos, MP3, PDF et suivi client complet.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-md">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-200">Volet ateliers</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">Ateliers créatifs pour écoles, camps et organismes avec réservation, rendez-vous, documents et suivi administratif.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="brand-panel p-4 md:p-5">
              <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-primary-500/20 blur-3xl md:block" />
              <div className="absolute -right-6 bottom-16 hidden h-28 w-28 rounded-full bg-secondary-500/20 blur-3xl md:block" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-primary-200/20 bg-[radial-gradient(circle_at_center,_rgba(96,165,250,0.16),_transparent_45%),linear-gradient(180deg,#07101f_0%,#10182d_100%)]">
                <Image src="/hero.jpg" alt="Nowis Morin, artiste principal de Création Nowis" fill className="object-cover object-center brightness-[0.72] contrast-[1.05]" priority />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.08)_0%,rgba(5,8,22,0.24)_38%,rgba(5,8,22,0.88)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.18),transparent_30%)]" />
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-coal-950/78 p-4 text-white backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-200">Ce que tu peux m’envoyer</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">Un texte déjà écrit, quelques souvenirs, une relation importante ou simplement l’émotion que tu veux faire passer.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-18">
        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(8,12,24,0.84),rgba(18,27,48,0.74))] p-6 shadow-card backdrop-blur-md md:grid-cols-3 md:p-8">
          {emotionStatements.map((item, index) => (
            <article key={item} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">{index === 0 ? 'Émotion' : index === 1 ? 'Message' : 'Transformation'}</p>
              <p className="mt-3 text-lg leading-8 text-slate-100">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8 md:pb-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="brand-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-300">Musique</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white">Une demande de chanson claire, suivie et humaine</h2>
            <p className="mt-4 text-base leading-7 text-slate-200">Le site et le portail client sont pensés pour recevoir un brief musical, échanger facilement, partager des documents et suivre l’avancement de la création.</p>
            <Link href="/commander-une-chanson" className="mt-6 inline-flex rounded-xl bg-brand-warm px-5 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110">Commander une chanson</Link>
          </article>
          <article className="brand-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Ateliers</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white">Des ateliers créatifs pour écoles et organismes</h2>
            <p className="mt-4 text-base leading-7 text-slate-200">Nowis propose aussi des ateliers pour enfants avec demandes d’intervention, prises de rendez-vous, créneaux du mardi et du jeudi, et suivi CRM côté organisation.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/ateliers" className="inline-flex rounded-xl border border-white/10 bg-slate-950/45 px-5 py-3 font-semibold text-white transition hover:bg-white/10">Découvrir les ateliers</Link>
              <Link href="/ateliers/demande" className="inline-flex rounded-xl border border-amber-200/30 bg-amber-500/10 px-5 py-3 font-semibold text-white transition hover:bg-amber-500/20">Demander un atelier</Link>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-4 md:pb-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">Comment ça fonctionne</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Simple à expliquer. Fort à offrir.</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
            Le but n’est pas de compliquer le processus. Tu m’expliques ce que tu veux transmettre, je construis la chanson, puis on finalise ensemble pour qu’elle sonne juste.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {processSteps.map((step, index) => (
            <article key={step.title} className="brand-card p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-warm text-lg font-bold text-white shadow-fire">
                {index + 1}
              </span>
              <h3 className="mt-6 font-display text-3xl leading-[1.08] text-white">{step.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-200">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">Dernières chansons</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Les chansons mises en avant sur l’accueil</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              Cette section met en avant les chansons que tu veux faire découvrir en priorité, qu’elles soient disponibles sur YouTube, Spotify ou sur plusieurs plateformes.
            </p>
          </div>
          <Link
            href={songSalesCtas.listen.href}
            className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-slate-950/55 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-primary-500/12"
          >
            {songSalesCtas.listen.label}
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {songs.map((song) => (
              <article key={song.slug} className="brand-card flex h-full flex-col p-6 transition hover:-translate-y-1 hover:border-primary-400/40">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-300">Histoire en musique</p>
                <h3 className="mt-4 font-display text-4xl leading-none text-white">{song.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-slate-200">{song.shortDescription}</p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href={`/chanson/${song.slug}`} className="font-semibold text-primary-200 transition hover:text-primary-100">
                    Écouter l’exemple →
                  </Link>
                  <ContactPrefillLink href={buildExampleHref(song.title)} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
                    Je veux la même chose
                  </ContactPrefillLink>
                </div>
              </article>
            ))}
          </div>

          <article className="brand-panel p-8 text-white md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-200">Connexion</p>
            <h3 className="mt-4 font-display text-4xl leading-[1.05]">Choisis ton espace et connecte-toi en quelques secondes.</h3>
            <p className="mt-4 text-base leading-8 text-slate-200 md:text-lg">
              Le portail client permet de suivre vos demandes de chanson, vos ateliers, vos rendez-vous, vos messages et vos documents. Le CRM reste réservé à l’équipe interne.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">Nouveau client</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  Créez votre accès pour suivre un projet musical ou un dossier atelier.
                </p>
                <Link
                  href="/inscription"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-warm px-5 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Créer un compte
                </Link>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">Portail client</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  Connexion pour consulter vos demandes, vos échanges, vos rendez-vous et vos documents.
                </p>
                <Link
                  href="/connexion"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-warm px-5 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Se connecter
                </Link>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">Accès équipe CRM</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  Connexion interne pour gérer les clients, écoles, demandes, ateliers et suivis.
                </p>
                <Link
                  href="/crm/login"
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-slate-950/55 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-primary-500/12"
                >
                  Ouvrir le CRM
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">Témoignages</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Des mots qui rassurent avant de se lancer</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
            Voici trois exemples de retours courts, pensés comme repères en attendant tes témoignages définitifs. La structure est déjà prête pour être remplacée facilement plus tard.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={`${testimonial.author}-${testimonial.context}`} className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.84),rgba(14,23,42,0.76))] p-8 text-white shadow-card backdrop-blur-sm">
              <div className="flex gap-1 text-primary-300" aria-hidden="true">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <p className="mt-5 text-lg leading-8 text-slate-100">“{testimonial.quote}”</p>
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="font-semibold text-white">{testimonial.author}</p>
                <p className="text-sm text-slate-300">{testimonial.context}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">Pourquoi choisir Nowis</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Une création plus humaine, plus sensible et plus mémorable</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
            Je veux que la personne qui reçoit la chanson sente qu’elle a été pensée pour elle. C’est ce qui fait la différence entre un contenu générique et un vrai cadeau marquant.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {trustReasons.map((reason) => (
            <article key={reason.title} className="brand-card p-7">
              <h3 className="font-display text-3xl leading-[1.08] text-white">{reason.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-200">{reason.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">Forfaits</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Trois façons simples de lancer ton projet</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
            Que tu partes d’un texte déjà écrit ou d’une émotion plus délicate à raconter, je peux adapter la création au niveau d’accompagnement dont tu as besoin.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {songPackages.map((pack) => (
            <article
              key={pack.name}
              className={[
                'relative rounded-[2rem] border p-8 shadow-soft transition',
                pack.featured
                  ? 'border-primary-300 bg-[linear-gradient(180deg,rgba(18,27,48,0.96),rgba(28,39,70,0.92))] text-white ring-2 ring-primary-300 shadow-[0_28px_80px_rgba(59,130,246,0.22)] xl:-translate-y-2'
                  : 'border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.84),rgba(14,23,42,0.76))] text-white',
              ].join(' ')}
            >
              {pack.badge ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="inline-flex rounded-full bg-primary-500/16 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-100">
                    {pack.badge}
                  </p>
                  <p className="rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    99,99 $
                  </p>
                </div>
              ) : (
                <p className="inline-flex rounded-full border border-white/10 bg-slate-950/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 shadow-sm backdrop-blur-sm">
                  {packagePrices[pack.name]}
                </p>
              )}
              <h3 className="mt-4 font-display text-4xl leading-[1.05] text-white">{pack.name}</h3>
              <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200">
                {pack.note}
              </p>
              <p className="mt-5 text-base leading-8 text-slate-200">{pack.description}</p>
              <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-200">
                {pack.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-warm text-xs font-bold text-white">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={songSalesCtas.order.href}
                className={[
                  'mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition',
                  pack.featured
                    ? 'bg-brand-warm text-white shadow-fire hover:-translate-y-0.5 hover:brightness-110'
                    : 'border border-white/10 bg-slate-950/45 text-white backdrop-blur-sm hover:bg-white/10',
                ].join(' ')}
              >
                Commander cette formule
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-emerald-400/20 bg-[linear-gradient(145deg,rgba(4,33,32,0.88),rgba(10,48,47,0.78))] p-8 text-white shadow-card backdrop-blur-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Garantie / rassurance</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white">Tu peux avancer sans te sentir pris au piège</h2>
            <p className="mt-4 text-base leading-8 text-emerald-50/90">{satisfactionGuarantee.text}</p>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-emerald-50/90">
              <li className="flex gap-3"><span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-950">✓</span><span>Des ajustements sont possibles avant la version finale.</span></li>
              <li className="flex gap-3"><span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-950">✓</span><span>Tu échanges avec une vraie personne, directement impliquée dans la création.</span></li>
              <li className="flex gap-3"><span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-950">✓</span><span>Si tu as besoin d’un visuel ou d’une capsule vidéo, on peut aussi l’ajouter comme complément.</span></li>
            </ul>
          </article>

          <article className="brand-panel overflow-hidden p-0 text-white shadow-card">
            <div className="grid gap-0 md:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-[360px]">
                <Image src="/hero.jpg" alt="Nowis Morin" fill className="object-cover brightness-[0.82]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,13,0.08)_0%,rgba(9,10,13,0.2)_40%,rgba(9,10,13,0.78)_100%)] md:bg-[linear-gradient(90deg,rgba(9,10,13,0.06)_0%,rgba(9,10,13,0.18)_50%,rgba(9,10,13,0.72)_100%)]" />
              </div>
              <div className="p-8 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-200">À propos / Nowis Morin</p>
                <h2 className="mt-4 font-display text-4xl leading-[1.05]">Je crée des chansons parce que certaines émotions méritent mieux qu’un simple message.</h2>
                <p className="mt-4 text-base leading-8 text-slate-200">
                  Je crée depuis longtemps. Ce que j’aime, c’est prendre un souvenir, une émotion ou une histoire et lui donner une forme musicale qui touche vraiment.
                </p>
                <p className="mt-4 text-base leading-8 text-slate-200">
                  L’IA m’aide à aller plus loin dans la création, mais elle reste un outil. Ce qui compte vraiment, c’est l’émotion, la justesse et la personne derrière la chanson.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href="/a-propos" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/45 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
                    En savoir plus sur moi
                  </Link>
                  <ContactPrefillLink href={songSalesCtas.talk.href} className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-5 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110">
                    Me parler de ton idée
                  </ContactPrefillLink>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="brand-shell">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_20%),radial-gradient(circle_at_72%_70%,rgba(59,130,246,0.08),transparent_24%)]" />
        <div className="mx-auto max-w-5xl px-6 py-20 text-center text-white md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-200">CTA final</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-6xl">Tu as une histoire, un message ou un souvenir à offrir ?</h2>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-200 md:text-lg">
            Écris-moi simplement ce que tu veux dire, même si ce n’est pas encore parfaitement formulé. Je t’aiderai à en faire une chanson unique, sensible et profondément personnelle.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={songSalesCtas.order.href}
              className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Créer ma chanson
            </Link>
            <ContactPrefillLink
              href={songSalesCtas.talk.href}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-slate-950/55 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-primary-500/12"
            >
              Parler de mon projet
            </ContactPrefillLink>
          </div>
        </div>
      </section>
    </div>
  );
};
