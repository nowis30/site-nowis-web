import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';

export type SongSalesCta = {
	label: string;
	href: string;
};

export type SongTrustItem = {
	title: string;
	description: string;
};

export type SongProcessStep = {
	step: string;
	title: string;
	description: string;
};

export type SongPackage = {
	name: string;
	note: string;
	description: string;
	features: string[];
	badge?: string;
	featured?: boolean;
};

export type VideoExtraOption = {
	name: string;
	note: string;
	description: string;
};

export const songSalesCtas = {
	order: {
		label: 'Commander une chanson',
		href: SONG_REQUEST_GOOGLE_AUTH_URL,
	} satisfies SongSalesCta,
	listen: {
		label: 'Écouter des exemples',
		href: '/musique',
	} satisfies SongSalesCta,
	talk: {
		label: 'Parler de mon projet',
		href: '/contact?projectType=chanson&message=Bonjour, je veux discuter d’une chanson personnalisée. Voici mon histoire et le contexte de ma demande.',
	} satisfies SongSalesCta,
	contact: {
		label: 'Contacter Création Nowis',
		href: '/contact?projectType=autre&message=Bonjour, je veux discuter d’un projet créatif avec Création Nowis.',
	} satisfies SongSalesCta,
};

export const songTrustItems: SongTrustItem[] = [
	{
		title: 'Création humaine + IA',
		description: 'Une approche guidée par l’émotion et la direction artistique.',
	},
	{
		title: 'Musique pour de vrais moments',
		description: 'Mariage, naissance, hommage, famille ou projet personnel.',
	},
	{
		title: 'Option visuelle en complément',
		description: 'Un visuel ou une vidéo peut prolonger la chanson si cela aide le projet.',
	},
	{
		title: 'Contact simple et direct',
		description: 'Un premier échange clair permet de cadrer la demande sans complication.',
	},
];

export const songProcessSteps: SongProcessStep[] = [
	{
		step: 'Prise de contact',
		title: 'Vous me partagez votre histoire, votre texte ou vos repères.',
		description: 'Quelques phrases, un souvenir ou des paroles déjà écrites suffisent pour démarrer.',
	},
	{
		step: 'Création musicale',
		title: 'Je construis une chanson fidèle à l’émotion recherchée.',
		description: 'Je guide le ton, la structure et la direction musicale selon la sensibilité du projet.',
	},
	{
		step: 'Finalisation',
		title: 'Vous recevez une version aboutie, avec ajustements si nécessaire.',
		description: 'La musique reste au cœur du projet, avec un complément visuel possible si cela a du sens.',
	},
];

export const songPackages: SongPackage[] = [
	{
		name: 'Mise en chanson',
		note: 'Pour un texte déjà écrit',
		description:
			'Pour un texte, un poème ou des paroles déjà écrites à mettre en musique avec une direction simple et sensible.',
		features: [
			'mise en chanson d’un texte déjà fourni',
			'direction musicale claire',
			'livrable audio final',
			'ajustement de finition selon le projet',
		],
	},
	{
		name: 'Chanson personnalisée',
		note: 'Pour une histoire à transformer',
		description:
			'Pour une histoire, une idée ou un souvenir à transformer en chanson complète avec une approche plus guidée.',
		features: [
			'adaptation ou écriture des paroles',
			'structure complète de la chanson',
			'version finale audio',
			'échange de validation',
		],
		badge: 'Le plus demandé',
		featured: true,
	},
	{
		name: 'Chanson émotion',
		note: 'Pour une demande plus intime ou délicate',
		description:
			'Pour les projets plus personnels : mariage, naissance, hommage, anniversaire, amour ou famille.',
		features: [
			'échange plus détaillé',
			'travail émotionnel plus approfondi',
			'chanson complète',
			'suivi plus attentif selon le projet',
		],
	},
];

export const songProjectTypes = [
	'Mariage',
	'Naissance',
	'Anniversaire',
	'Hommage',
	'Décès',
	'Amour',
	'Famille',
	'Projet personnel',
];

export const videoExtraOptions: VideoExtraOption[] = [
	{
		name: 'Visuel simple IA',
		note: 'Complément visuel discret',
		description: 'Ajout d’un visuel ou d’un montage simple pour accompagner la chanson et mieux la présenter.',
	},
	{
		name: 'Capsule vidéo IA',
		note: 'Présentation plus immersive',
		description: 'Ajout d’une courte vidéo IA plus travaillée pour présenter, offrir ou accompagner la chanson.',
	},
];

export const whyNowisParagraphs = [
	'Je joue de la musique depuis l’adolescence, depuis environ l’âge de 15 ans.',
	'Pendant longtemps, j’inventais des chansons sur le moment, mais je les oubliais ensuite.',
	'L’intelligence artificielle m’a aidé à donner une forme plus stable à mes idées, pour créer de vraies chansons que je peux garder, chanter plus tard et faire vivre dans le temps.',
	'Aujourd’hui, j’utilise cette approche pour créer des chansons personnalisées pour les gens, avec émotion, souvenirs et authenticité.',
];

export const satisfactionGuarantee = {
	title: 'Garantie satisfaction',
	text: 'Si le résultat final proposé ne vous convient pas après la phase de révision prévue, Création Nowis peut offrir un remboursement selon les conditions du projet.',
	note: 'Dans ce cas, le livrable remboursé n’est pas remis au client et demeure la propriété de Création Nowis.',
};

export const portfolioDisclosure = {
	title: 'Portfolio et consentement',
	text: 'Certains projets pourront être présentés à titre d’exemple dans le portfolio de Création Nowis, uniquement avec l’accord du client.',
	options: [
		'J’accepte que mon projet ou un extrait soit utilisé dans le portfolio de Création Nowis.',
		'Je refuse toute diffusion publique de mon projet.',
	],
};

export const artistPricingNote =
	'Les créations sur mesure sont proposées selon la nature du projet, avec un accompagnement ajusté, une direction claire et des compléments visuels possibles si cela aide vraiment le rendu.';

export const secondaryCreativeServices = [
	{
		title: 'Vidéos créatives et formats courts',
		description: 'Des capsules visuelles utiles pour accompagner une chanson, présenter une idée ou prolonger une présence en ligne.',
		href: '/videos',
	},
	{
		title: 'Visuels, pochettes et concepts',
		description: 'Des éléments d’image pour soutenir une chanson, une sortie ou un projet artistique avec plus de cohérence.',
		href: '/services',
	},
	{
		title: 'Autres projets créatifs',
		description: 'Quand le besoin dépasse la musique, Création Nowis peut aussi accompagner des idées web, interactives ou promotionnelles.',
		href: '/services',
	},
];
