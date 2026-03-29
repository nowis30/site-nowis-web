export interface AdminSectionBlock {
  key: string;
  label: string;
  kind: 'TEXT' | 'LINK' | 'RICH_TEXT';
  value: string;
}

export interface AdminSectionPayload {
  key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  isActive: boolean;
  sortOrder: number;
  imageUrl: string | null;
  blocks: AdminSectionBlock[];
}

export interface AdminImageStyle {
  altText: string;
  focalX: number;
  focalY: number;
  zoom: number;
  fit: 'cover' | 'contain';
  aspectRatio: 'auto' | '16/9' | '4/3' | '1/1';
}

export interface AdminSectionVisualStyle {
  contentWidth: 'compact' | 'normal' | 'wide';
  verticalSpacing: 'tight' | 'normal' | 'airy';
  contentAlign: 'left' | 'center';
  headingScale: 'sm' | 'md' | 'lg';
  mobileSpacing: 'inherit' | 'compact' | 'comfortable' | 'airy';
  mobileAlign: 'inherit' | 'left' | 'center';
}

export interface AdminPagePayload {
  slug: string;
  title: string;
  description: string | null;
  sections: AdminSectionPayload[];
}

export interface AdminRuntimePayload {
  siteSettings: {
    siteName: string;
    siteUrl: string;
    defaultSeoTitle: string;
    defaultSeoDescription: string;
    defaultCtaLabel: string;
    defaultCtaHref: string;
  };
  themeSettings: {
    primaryColor: string;
    accentColor: string;
    surfaceColor: string;
    textColor: string;
    mutedColor: string;
    borderRadius: string;
  };
  pages: AdminPagePayload[];
}

function getPayloadUrl() {
  return process.env.NOWIS_ADMIN_PAYLOAD_URL || '';
}

export function resolveAdminImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  const payloadUrl = getPayloadUrl();
  if (!payloadUrl) {
    return imageUrl;
  }

  try {
    const base = new URL(payloadUrl);
    return `${base.origin}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  } catch {
    return imageUrl;
  }
}

export async function getAdminRuntimePayload(): Promise<AdminRuntimePayload | null> {
  const url = getPayloadUrl();
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { payload?: AdminRuntimePayload };
    if (!body.payload || !Array.isArray(body.payload.pages)) {
      return null;
    }

    return body.payload;
  } catch {
    return null;
  }
}

export function getAdminPage(payload: AdminRuntimePayload | null, slug: string) {
  if (!payload) {
    return null;
  }

  return payload.pages.find((page) => page.slug === slug) || null;
}

export function getAdminSection(page: AdminPagePayload | null, key: string) {
  if (!page) {
    return null;
  }

  return page.sections.find((section) => section.key === key) || null;
}

export function getAdminBlockValue(section: AdminSectionPayload | null, key: string) {
  if (!section) {
    return '';
  }

  return section.blocks.find((block) => block.key === key)?.value || '';
}

function parseNumber(value: string, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, numeric));
}

export function getAdminImageStyle(section: AdminSectionPayload | null): AdminImageStyle {
  const fit = getAdminBlockValue(section, 'style.image.fit');
  const aspectRatio = getAdminBlockValue(section, 'style.image.aspectRatio');

  return {
    altText: getAdminBlockValue(section, 'style.image.altText'),
    focalX: parseNumber(getAdminBlockValue(section, 'style.image.focalX'), 50, 0, 100),
    focalY: parseNumber(getAdminBlockValue(section, 'style.image.focalY'), 50, 0, 100),
    zoom: parseNumber(getAdminBlockValue(section, 'style.image.zoom'), 1, 1, 2.5),
    fit: fit === 'contain' ? 'contain' : 'cover',
    aspectRatio: aspectRatio === '16/9' || aspectRatio === '4/3' || aspectRatio === '1/1' ? aspectRatio : 'auto',
  };
}

export function getAdminSectionVisualStyle(section: AdminSectionPayload | null): AdminSectionVisualStyle {
  const contentWidth = getAdminBlockValue(section, 'style.contentWidth');
  const verticalSpacing = getAdminBlockValue(section, 'style.verticalSpacing');
  const contentAlign = getAdminBlockValue(section, 'style.contentAlign');
  const headingScale = getAdminBlockValue(section, 'style.headingScale');
  const mobileSpacing = getAdminBlockValue(section, 'style.mobileSpacing');
  const mobileAlign = getAdminBlockValue(section, 'style.mobileAlign');

  return {
    contentWidth: contentWidth === 'compact' || contentWidth === 'wide' ? contentWidth : 'normal',
    verticalSpacing: verticalSpacing === 'tight' || verticalSpacing === 'airy' ? verticalSpacing : 'normal',
    contentAlign: contentAlign === 'center' ? 'center' : 'left',
    headingScale: headingScale === 'sm' || headingScale === 'lg' ? headingScale : 'md',
    mobileSpacing:
      mobileSpacing === 'compact' || mobileSpacing === 'comfortable' || mobileSpacing === 'airy'
        ? mobileSpacing
        : 'inherit',
    mobileAlign: mobileAlign === 'left' || mobileAlign === 'center' ? mobileAlign : 'inherit',
  };
}
