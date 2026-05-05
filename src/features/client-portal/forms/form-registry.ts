/**
 * Registre des formulaires du portail client.
 *
 * Structure lisible par un assistant IA/chatbot pour aider les clients
 * (notamment les 65 ans et plus) à remplir leurs demandes étape par étape.
 *
 * Chaque champ possède un `assistantPrompt` : la question que le chatbot
 * peut poser pour obtenir la valeur du champ.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'date'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  helpText: string;
  assistantPrompt: string;
  options?: Array<{ value: string; label: string }>;
  maxLength?: number;
}

export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

export interface PortalForm {
  id: string;
  title: string;
  description: string;
  route: string;
  api: string;
  steps: FormStep[];
}

export type FormRegistry = {
  songRequest: PortalForm;
  workshopRequest: PortalForm;
};

export const formRegistry: FormRegistry = {
  songRequest: {
    id: 'songRequest',
    title: 'Demande de chanson personnalisée',
    description: 'Commandez une chanson créée spécialement pour vous ou pour quelqu\'un que vous aimez.',
    route: '/client/song-requests/nouveau',
    api: '/api/site/song-requests',
    steps: [
      {
        id: 'identity',
        title: 'Vos informations',
        description: 'Dites-nous comment vous appeler.',
        fields: [
          {
            name: 'fullName',
            label: 'Votre nom complet',
            type: 'text',
            required: true,
            helpText: 'Votre prénom et nom de famille.',
            assistantPrompt: 'Quel est votre nom complet ?',
            maxLength: 180,
          },
          {
            name: 'email',
            label: 'Votre adresse courriel',
            type: 'email',
            required: true,
            helpText: 'Nous vous enverrons une confirmation à cette adresse.',
            assistantPrompt: 'Quelle est votre adresse courriel ?',
          },
          {
            name: 'phone',
            label: 'Votre numéro de téléphone',
            type: 'tel',
            required: false,
            helpText: 'Facultatif. Pour vous rappeler si nécessaire.',
            assistantPrompt: 'Avez-vous un numéro de téléphone où nous pouvons vous joindre ?',
            maxLength: 50,
          },
        ],
      },
      {
        id: 'song-details',
        title: 'La chanson',
        description: 'Parlez-nous de la chanson que vous souhaitez.',
        fields: [
          {
            name: 'occasion',
            label: 'Pour quelle occasion ?',
            type: 'text',
            required: true,
            helpText: 'Exemples : anniversaire, mariage, fête des mères, départ à la retraite.',
            assistantPrompt: 'Pour quelle occasion cette chanson est-elle destinée ?',
            maxLength: 180,
          },
          {
            name: 'recipientName',
            label: 'Pour qui est cette chanson ?',
            type: 'text',
            required: false,
            helpText: 'Le prénom de la personne qui recevra la chanson.',
            assistantPrompt: 'Quel est le prénom de la personne pour qui la chanson est créée ?',
            maxLength: 180,
          },
          {
            name: 'style',
            label: 'Style musical',
            type: 'text',
            required: false,
            helpText: 'Exemples : pop, country, classique, jazz, folklore.',
            assistantPrompt: 'Quel style de musique préférez-vous ? Par exemple : douce, joyeuse, classique.',
            maxLength: 180,
          },
          {
            name: 'mood',
            label: 'Ambiance souhaitée',
            type: 'text',
            required: false,
            helpText: 'Exemples : joyeuse, douce, émouvante, festive.',
            assistantPrompt: 'Quelle ambiance souhaitez-vous pour cette chanson ? Joyeuse, douce, touchante ?',
            maxLength: 180,
          },
          {
            name: 'language',
            label: 'Langue de la chanson',
            type: 'select',
            required: false,
            helpText: 'En français, en anglais, ou les deux ?',
            assistantPrompt: 'Dans quelle langue voulez-vous la chanson ?',
            options: [
              { value: 'français', label: 'Français' },
              { value: 'anglais', label: 'Anglais' },
              { value: 'bilingue', label: 'Français et anglais' },
            ],
          },
          {
            name: 'description',
            label: 'Votre histoire ou message',
            type: 'textarea',
            required: true,
            helpText: 'Racontez-nous ce qui est important pour cette chanson. Souvenirs, anecdotes, mots clés.',
            assistantPrompt: 'Racontez-moi l\'histoire ou le message que vous voulez transmettre dans cette chanson.',
            maxLength: 4000,
          },
          {
            name: 'budget',
            label: 'Votre budget (en dollars canadiens)',
            type: 'number',
            required: false,
            helpText: 'Facultatif. Nous vous proposerons une soumission adaptée.',
            assistantPrompt: 'Avez-vous un budget en tête pour cette chanson ?',
          },
          {
            name: 'desiredDeadline',
            label: 'Date souhaitée pour recevoir la chanson',
            type: 'date',
            required: false,
            helpText: 'Quand avez-vous besoin de la chanson ? Nous ferons notre mieux.',
            assistantPrompt: 'Pour quand avez-vous besoin de la chanson ?',
          },
        ],
      },
    ],
  },

  workshopRequest: {
    id: 'workshopRequest',
    title: 'Demande d\'atelier musical',
    description: 'Réservez un atelier de musique pour votre groupe, votre résidence ou votre organisation.',
    route: '/client/workshops/nouveau',
    api: '/api/workshop-requests',
    steps: [
      {
        id: 'contact',
        title: 'Vos coordonnées',
        description: 'Comment vous joindre ?',
        fields: [
          {
            name: 'fullName',
            label: 'Votre nom complet',
            type: 'text',
            required: true,
            helpText: 'Le nom de la personne responsable de la demande.',
            assistantPrompt: 'Quel est votre nom complet ?',
            maxLength: 180,
          },
          {
            name: 'email',
            label: 'Votre adresse courriel',
            type: 'email',
            required: true,
            helpText: 'Pour recevoir la confirmation et les informations de l\'atelier.',
            assistantPrompt: 'Quelle est votre adresse courriel ?',
          },
          {
            name: 'phone',
            label: 'Votre numéro de téléphone',
            type: 'tel',
            required: false,
            helpText: 'Facultatif, mais recommandé pour faciliter la coordination.',
            assistantPrompt: 'Avez-vous un numéro de téléphone ?',
            maxLength: 50,
          },
        ],
      },
      {
        id: 'organization',
        title: 'Votre organisation',
        description: 'Dites-nous où se déroulera l\'atelier.',
        fields: [
          {
            name: 'organizationName',
            label: 'Nom de votre organisation ou résidence',
            type: 'text',
            required: true,
            helpText: 'Exemples : Résidence Les Érables, École primaire Saint-Jean, Maison de retraite du Lac.',
            assistantPrompt: 'Quel est le nom de votre organisation ou de votre résidence ?',
            maxLength: 240,
          },
          {
            name: 'groupType',
            label: 'Type de groupe',
            type: 'select',
            required: false,
            helpText: 'Quel type de groupe participera à l\'atelier ?',
            assistantPrompt: 'Quel type de groupe participera à l\'atelier ?',
            options: [
              { value: 'AINES_RESIDENCE', label: 'Aînés en résidence' },
              { value: 'ECOLE', label: 'École' },
              { value: 'ENTREPRISE', label: 'Entreprise' },
              { value: 'COMMUNAUTAIRE', label: 'Groupe communautaire' },
              { value: 'PRIVE', label: 'Groupe privé' },
            ],
          },
          {
            name: 'location',
            label: 'Adresse ou lieu de l\'atelier',
            type: 'text',
            required: false,
            helpText: 'L\'adresse complète où se tiendra l\'atelier.',
            assistantPrompt: 'À quelle adresse ou dans quel lieu l\'atelier aura-t-il lieu ?',
            maxLength: 240,
          },
          {
            name: 'estimatedParticipants',
            label: 'Nombre de participants',
            type: 'number',
            required: false,
            helpText: 'Une estimation du nombre de personnes qui participeront.',
            assistantPrompt: 'Combien de personnes participeront à l\'atelier, environ ?',
          },
        ],
      },
      {
        id: 'workshop-details',
        title: 'L\'atelier',
        description: 'Décrivez ce que vous souhaitez.',
        fields: [
          {
            name: 'workshopTheme',
            label: 'Thème ou sujet de l\'atelier',
            type: 'text',
            required: true,
            helpText: 'Exemples : chansons des années 60, chants de Noël, musique du monde.',
            assistantPrompt: 'Quel thème ou sujet souhaitez-vous pour l\'atelier musical ?',
            maxLength: 240,
          },
          {
            name: 'objectives',
            label: 'Objectifs de l\'atelier',
            type: 'textarea',
            required: false,
            helpText: 'Que souhaitez-vous que les participants vivent ou apprennent ?',
            assistantPrompt: 'Quels sont les objectifs de cet atelier ? Que voulez-vous que les participants ressentent ou apprennent ?',
            maxLength: 2000,
          },
          {
            name: 'requestedDate',
            label: 'Date souhaitée',
            type: 'date',
            required: false,
            helpText: 'La date à laquelle vous aimeriez tenir l\'atelier.',
            assistantPrompt: 'Quelle date vous convient pour l\'atelier ?',
          },
          {
            name: 'notes',
            label: 'Informations supplémentaires',
            type: 'textarea',
            required: false,
            helpText: 'Tout autre détail utile : besoins spéciaux, mobilité réduite, préférences musicales.',
            assistantPrompt: 'Y a-t-il d\'autres informations importantes à savoir, comme des besoins particuliers des participants ?',
            maxLength: 2000,
          },
        ],
      },
    ],
  },
};

export const FORM_IDS = Object.keys(formRegistry) as Array<keyof FormRegistry>;

export function getFormById(id: string): PortalForm | null {
  if (id in formRegistry) {
    return formRegistry[id as keyof FormRegistry];
  }
  return null;
}
