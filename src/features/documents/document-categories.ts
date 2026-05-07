export const OFFICIAL_DOCUMENT_CATEGORIES = [
  'quote',
  'invoice',
  'client-shared',
  'deliverable',
  'workshop-song',
  'workshop-video',
  'song-audio',
  'song-video',
  'admin-internal',
  'other',
] as const;

export type DocumentCategory = (typeof OFFICIAL_DOCUMENT_CATEGORIES)[number];

export type DocumentCategoryGroup = 'quotes' | 'invoices' | 'shared' | 'song-deliverables' | 'workshop-deliverables' | 'other';

export type DocumentCategoryResolutionSource = 'explicit' | 'legacy-normalized' | 'fallback';

export type DocumentOrigin = 'chanson' | 'atelier' | 'soumission' | 'facture' | 'client' | 'interne';

type CategoryMeta = {
  label: string;
  description: string;
  group: DocumentCategoryGroup;
};

type CategoryResolutionInput = {
  category?: string | null;
  mimeType?: string | null;
  filename?: string | null;
  originalName?: string | null;
  songRequestId?: string | null;
  workshopRequestId?: string | null;
  commercialQuoteId?: string | null;
  invoiceId?: string | null;
  uploadedByUserId?: string | null;
  visibility?: 'ADMIN_ONLY' | 'CLIENT_VISIBLE' | null;
};

const OFFICIAL_CATEGORY_SET = new Set<DocumentCategory>(OFFICIAL_DOCUMENT_CATEGORIES);

const CATEGORY_META: Record<DocumentCategory, CategoryMeta> = {
  quote: {
    label: 'Soumission',
    description: 'Devis commercial',
    group: 'quotes',
  },
  invoice: {
    label: 'Facture',
    description: 'Facture client',
    group: 'invoices',
  },
  'client-shared': {
    label: 'Document partagé',
    description: 'Fichier partage par le client',
    group: 'shared',
  },
  deliverable: {
    label: 'Livrable',
    description: 'Livrable general remis au client',
    group: 'song-deliverables',
  },
  'workshop-song': {
    label: 'Chanson d\'atelier',
    description: 'Chanson generee pendant un atelier',
    group: 'workshop-deliverables',
  },
  'workshop-video': {
    label: 'Vidéo d\'atelier',
    description: 'Video generee pendant un atelier',
    group: 'workshop-deliverables',
  },
  'song-audio': {
    label: 'Audio de chanson',
    description: 'Fichier audio de chanson',
    group: 'song-deliverables',
  },
  'song-video': {
    label: 'Vidéo de chanson',
    description: 'Fichier video de chanson',
    group: 'song-deliverables',
  },
  'admin-internal': {
    label: 'Document interne',
    description: 'Document interne non client',
    group: 'other',
  },
  other: {
    label: 'Autre document',
    description: 'Categorie non standard',
    group: 'other',
  },
};

const LEGACY_CATEGORY_ALIASES: Record<string, DocumentCategory> = {
  quote: 'quote',
  devis: 'quote',
  soumission: 'quote',
  invoice: 'invoice',
  facture: 'invoice',
  document: 'client-shared',
  documents: 'client-shared',
  shared: 'client-shared',
  'client-shared': 'client-shared',
  livrable: 'deliverable',
  delivery: 'deliverable',
  final: 'deliverable',
  'workshop-song': 'workshop-song',
  'atelier-song': 'workshop-song',
  'chanson-atelier': 'workshop-song',
  'workshop-video': 'workshop-video',
  'atelier-video': 'workshop-video',
  'video-atelier': 'workshop-video',
  'song-audio': 'song-audio',
  song: 'song-audio',
  audio: 'song-audio',
  demo: 'song-audio',
  'song-video': 'song-video',
  video: 'song-video',
  'admin-internal': 'admin-internal',
  admin: 'admin-internal',
  internal: 'admin-internal',
  other: 'other',
  autre: 'other',
};

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac'];

function hasAnyExtension(value: string | null | undefined, extensions: string[]) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return extensions.some((ext) => normalized.endsWith(ext));
}

function resolveLegacySongCategory(document: CategoryResolutionInput): DocumentCategory {
  const mimeType = (document.mimeType || '').toLowerCase();
  if (mimeType.startsWith('video/')) return 'song-video';
  if (mimeType.startsWith('audio/')) return 'song-audio';

  const hasVideoExt =
    hasAnyExtension(document.originalName, VIDEO_EXTENSIONS)
    || hasAnyExtension(document.filename, VIDEO_EXTENSIONS);
  if (hasVideoExt) return 'song-video';

  const hasAudioExt =
    hasAnyExtension(document.originalName, AUDIO_EXTENSIONS)
    || hasAnyExtension(document.filename, AUDIO_EXTENSIONS);
  if (hasAudioExt) return 'song-audio';

  // Fallback prudent: audio seulement en l'absence d'indice vidéo.
  return 'song-audio';
}

export function isOfficialDocumentCategory(input?: string | null): input is DocumentCategory {
  if (!input) return false;
  return OFFICIAL_CATEGORY_SET.has(normalizeToken(input) as DocumentCategory);
}

export function normalizeDocumentCategory(input?: string | null): DocumentCategory {
  if (!input) return 'other';
  const token = normalizeToken(input);
  if (isOfficialDocumentCategory(token)) return token;
  return LEGACY_CATEGORY_ALIASES[token] ?? 'other';
}

export function getDocumentCategoryLabel(category: DocumentCategory): string {
  return CATEGORY_META[category].label;
}

export function getDocumentCategoryDescription(category: DocumentCategory): string {
  return CATEGORY_META[category].description;
}

export function getDocumentCategoryGroup(category: DocumentCategory): DocumentCategoryGroup {
  return CATEGORY_META[category].group;
}

export function inferDocumentCategoryFallback(document: CategoryResolutionInput): DocumentCategory {
  if (document.invoiceId) return 'invoice';
  if (document.commercialQuoteId) return 'quote';

  const mimeType = (document.mimeType || '').toLowerCase();
  if (document.workshopRequestId) {
    if (mimeType.startsWith('audio/')) return 'workshop-song';
    if (mimeType.startsWith('video/')) return 'workshop-video';
  }

  if (document.songRequestId) {
    if (mimeType.startsWith('audio/')) return 'song-audio';
    if (mimeType.startsWith('video/')) return 'song-video';
    return 'deliverable';
  }

  if (document.visibility === 'ADMIN_ONLY') return 'admin-internal';
  if (!document.uploadedByUserId) return 'client-shared';
  return 'other';
}

export function resolveDocumentCategory(document: CategoryResolutionInput): {
  category: DocumentCategory;
  source: DocumentCategoryResolutionSource;
  rawCategory: string | null;
} {
  const rawCategory = document.category?.trim() || null;
  if (!rawCategory) {
    return {
      category: inferDocumentCategoryFallback(document),
      source: 'fallback',
      rawCategory,
    };
  }

  const token = normalizeToken(rawCategory);
  if (isOfficialDocumentCategory(token)) {
    return {
      category: token,
      source: 'explicit',
      rawCategory,
    };
  }

  if (token === 'song') {
    return {
      category: resolveLegacySongCategory(document),
      source: 'legacy-normalized',
      rawCategory,
    };
  }

  const normalizedLegacy = LEGACY_CATEGORY_ALIASES[token];
  if (normalizedLegacy) {
    return {
      category: normalizedLegacy,
      source: 'legacy-normalized',
      rawCategory,
    };
  }

  return {
    category: inferDocumentCategoryFallback(document),
    source: 'fallback',
    rawCategory,
  };
}

export function resolveDocumentOrigin(document: {
  songRequestId?: string | null;
  workshopRequestId?: string | null;
  commercialQuoteId?: string | null;
  invoiceId?: string | null;
  uploadedByUserId?: string | null;
  visibility?: 'ADMIN_ONLY' | 'CLIENT_VISIBLE' | null;
}): DocumentOrigin {
  if (document.invoiceId) return 'facture';
  if (document.commercialQuoteId) return 'soumission';
  if (document.songRequestId) return 'chanson';
  if (document.workshopRequestId) return 'atelier';
  if (document.visibility === 'ADMIN_ONLY') return 'interne';
  if (!document.uploadedByUserId) return 'client';
  return 'interne';
}

export function getDocumentOriginLabel(origin: DocumentOrigin): string {
  if (origin === 'chanson') return 'Chanson';
  if (origin === 'atelier') return 'Atelier';
  if (origin === 'soumission') return 'Soumission';
  if (origin === 'facture') return 'Facture';
  if (origin === 'client') return 'Client';
  return 'Interne';
}

export type ClientDocumentSection = 'quotes' | 'invoices' | 'shared' | 'song-deliverables' | 'workshop-deliverables' | 'other';

export function getClientDocumentSection(document: CategoryResolutionInput): ClientDocumentSection {
  const resolved = resolveDocumentCategory(document);
  const group = getDocumentCategoryGroup(resolved.category);
  if (group === 'quotes') return 'quotes';
  if (group === 'invoices') return 'invoices';
  if (group === 'shared') return 'shared';
  if (group === 'workshop-deliverables') return 'workshop-deliverables';
  if (group === 'song-deliverables') return 'song-deliverables';
  return 'other';
}

export function getDefaultCategoryForUpload(input: {
  context: 'song' | 'workshop' | 'quote' | 'invoice' | 'admin-internal' | 'general';
  mimeType?: string | null;
}): DocumentCategory {
  if (input.context === 'invoice') return 'invoice';
  if (input.context === 'quote') return 'quote';
  if (input.context === 'admin-internal') return 'admin-internal';

  const mimeType = (input.mimeType || '').toLowerCase();
  if (input.context === 'song') {
    if (mimeType.startsWith('audio/')) return 'song-audio';
    if (mimeType.startsWith('video/')) return 'song-video';
    return 'client-shared';
  }

  if (input.context === 'workshop') {
    if (mimeType.startsWith('audio/')) return 'workshop-song';
    if (mimeType.startsWith('video/')) return 'workshop-video';
    return 'client-shared';
  }

  return 'client-shared';
}