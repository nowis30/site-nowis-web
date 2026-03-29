import { HomeScreen } from '@/screens';
import {
  getAdminBlockValue,
  getAdminImageStyle,
  getAdminPage,
  getAdminRuntimePayload,
  getAdminSection,
  resolveAdminImageUrl,
} from '@/lib/admin-runtime';

export const dynamic = 'force-dynamic';

function pickText(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  return value.length > 0 ? value : fallback;
}

function pickHref(adminValue: string | null | undefined, fallback: string) {
  if (typeof adminValue !== 'string') return fallback;
  const value = adminValue.trim();
  if (!value) return fallback;
  return value.startsWith('/') || value.startsWith('#') || value.startsWith('https://') || value.startsWith('http://')
    ? value
    : fallback;
}

export default async function Home() {
  const runtimePayload = await getAdminRuntimePayload();
  const adminPage = getAdminPage(runtimePayload, 'home');
  const heroSection = getAdminSection(adminPage, 'home.hero');
  const trustSection = getAdminSection(adminPage, 'home.trust-strip');
  const processSection = getAdminSection(adminPage, 'home.process');

  const heroEnabled = heroSection?.isActive ?? false;
  const trustEnabled = trustSection?.isActive ?? false;
  const processEnabled = processSection?.isActive ?? false;

  const overrides = {
    hero: {
      eyebrow: heroEnabled ? pickText(getAdminBlockValue(heroSection, 'eyebrow'), 'Chansons personnalisées') : 'Chansons personnalisées',
      title: heroEnabled
        ? pickText(heroSection?.title, 'Création musicale sur mesure et ateliers créatifs pour enfants')
        : 'Création musicale sur mesure et ateliers créatifs pour enfants',
      description: heroEnabled
        ? pickText(heroSection?.description, 'Nowis réunit deux univers clairs : la chanson personnalisée pour les particuliers et les projets sensibles, puis les ateliers créatifs conçus pour les écoles, organismes et groupes d’enfants.')
        : 'Nowis réunit deux univers clairs : la chanson personnalisée pour les particuliers et les projets sensibles, puis les ateliers créatifs conçus pour les écoles, organismes et groupes d’enfants.',
      primaryCta: {
        label: heroEnabled ? pickText(heroSection?.ctaLabel, 'Demander une chanson (portail)') : 'Demander une chanson (portail)',
        href: heroEnabled ? pickHref(heroSection?.ctaHref, '/commander-une-chanson') : '/commander-une-chanson',
      },
      secondaryCta: {
        label: heroEnabled
          ? pickText(getAdminBlockValue(heroSection, 'secondaryCta.label'), 'Demander un atelier (portail)')
          : 'Demander un atelier (portail)',
        href: heroEnabled
          ? pickHref(getAdminBlockValue(heroSection, 'secondaryCta.href'), '/connexion?next=%2Fclient%2Fworkshops%2Fnouveau')
          : '/connexion?next=%2Fclient%2Fworkshops%2Fnouveau',
      },
      image: {
        src: heroEnabled ? resolveAdminImageUrl(heroSection?.imageUrl) || '/hero.jpg' : '/hero.jpg',
        ...getAdminImageStyle(heroSection),
      },
    },
    processSteps: processEnabled
      ? [1, 2, 3].map((index) => ({
          title: pickText(getAdminBlockValue(processSection, `step${index}.title`), index === 1 ? 'Tu me racontes ce que tu veux dire' : index === 2 ? 'Je transforme ça en chanson' : 'Tu offres quelque chose d’unique'),
          description: pickText(getAdminBlockValue(processSection, `step${index}.text`), index === 1 ? 'Un souvenir, une relation, un message du cœur ou quelques lignes suffisent pour commencer.' : index === 2 ? 'Je construis une direction musicale fidèle à l’émotion, avec une vraie attention au ton et aux mots.' : 'Tu reçois une création pensée pour toucher, marquer et rester dans le temps.'),
        }))
      : undefined,
    trustReasons: trustEnabled
      ? [
          {
            title: pickText(getAdminBlockValue(trustSection, 'trust1.title'), 'Chaque chanson part d’un vrai vécu'),
            description: pickText(getAdminBlockValue(trustSection, 'trust1.text'), 'Je ne produis pas une formule impersonnelle. Je pars de ton histoire, de tes mots et de l’émotion que tu veux transmettre.'),
          },
          {
            title: pickText(getAdminBlockValue(trustSection, 'trust2.title'), 'Tu parles à une vraie personne'),
            description: pickText(getAdminBlockValue(trustSection, 'trust2.text'), 'Je prends le temps de comprendre ce que tu veux faire ressentir. L’IA m’aide à créer, mais elle ne remplace jamais l’écoute ni la sensibilité.'),
          },
        ]
      : undefined,
  };

  return <HomeScreen overrides={overrides} />;
}
