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
	price: string;
	description: string;
	features: string[];
	badge?: string;
	featured?: boolean;
};

export type VideoExtraOption = {
	name: string;
	price: string;
	description: string;
};

export const songSalesCtas = {
	order: {
		label: 'Commander une chanson',
		href: '/commander-une-chanson',
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
		title: 'Forfaits simples',
		description: 'Des prix fixes et lisibles, sans logique horaire floue.',
	},
	{
		title: 'Création humaine + IA',
		description: 'L’IA sert l’atelier, mais l’émotion, la direction et le tri restent humains.',
	},
	{
		title: 'Option vidéo souvenir',
		description: 'Un extra visuel ou vidéo peut accompagner la chanson quand tu le souhaites.',
	},
	{
		title: 'Garantie satisfaction',
		description: 'Une garantie claire est prévue après la révision incluse au forfait.',
	},
];

export const songProcessSteps: SongProcessStep[] = [
	{
		step: 'Étape 1',
		title: 'Vous m’envoyez vos paroles, votre poème ou simplement votre histoire.',
		description: 'Tu peux partir d’un texte déjà écrit ou d’un simple souvenir raconté avec tes mots.',
	},
	{
		step: 'Étape 2',
		title: 'Je transforme le tout en chanson selon le forfait choisi.',
		description: 'Je structure la chanson, j’oriente l’ambiance et je prépare une version cohérente avec l’émotion recherchée.',
	},
	{
		step: 'Étape 3',
		title: 'Vous recevez votre chanson finale, avec option visuelle ou vidéo si désiré.',
		description: 'Le cœur du service reste la musique, avec la possibilité d’ajouter un habillage visuel en extra.',
	},
];

export const songPackages: SongPackage[] = [
	{
		name: 'Mise en chanson',
		price: '49,99 $',
		description:
			'Pour un texte, un poème ou des paroles déjà écrites. Je prends votre contenu existant et je le transforme en chanson.',
		features: [
			'mise en chanson d’un texte déjà fourni',
			'1 direction musicale',
			'1 version finale audio',
			'1 petite révision',
		],
	},
	{
		name: 'Chanson personnalisée',
		price: '99,99 $',
		description:
			'Pour une histoire, une idée ou un souvenir à transformer en chanson complète.',
		features: [
			'adaptation ou écriture des paroles',
			'structure complète de la chanson',
			'version finale audio',
			'1 révision',
		],
		badge: 'Le choix le plus simple pour commencer',
		featured: true,
	},
	{
		name: 'Chanson émotion',
		price: '149,99 $',
		description:
			'Pour les projets plus personnels : mariage, naissance, hommage, anniversaire, amour ou famille.',
		features: [
			'échange plus détaillé',
			'paroles plus travaillées',
			'chanson complète',
			'2 révisions',
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
		price: '+49,99 $',
		description: 'Ajout d’un visuel ou montage simple pour accompagner la chanson.',
	},
	{
		name: 'Capsule vidéo IA',
		price: '+99,99 $',
		description: 'Ajout d’une courte vidéo IA plus travaillée pour présenter ou accompagner la chanson.',
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
	text: 'Si le résultat final proposé ne vous convient pas après la révision incluse au forfait, Création Nowis peut offrir un remboursement selon les conditions du projet.',
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
	'Les créations sur mesure sont maintenant proposées avec des forfaits fixes clairs, à partir de 49,99 $, avec options visuelles ou vidéo selon le projet.';

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
