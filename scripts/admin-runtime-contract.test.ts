import { getAdminImageStyle, getAdminSectionVisualStyle, type AdminSectionPayload } from '../src/lib/admin-runtime';

function sectionFixture(overrides?: Partial<AdminSectionPayload>): AdminSectionPayload {
  return {
    key: 'home.hero',
    title: 'Hero',
    subtitle: null,
    description: 'Description',
    ctaLabel: 'Action',
    ctaHref: '/contact',
    isActive: true,
    sortOrder: 10,
    imageUrl: '/uploads/hero.jpg',
    blocks: [],
    ...overrides,
  };
}

function run() {
  const fallbackSection = sectionFixture();
  const fallbackImage = getAdminImageStyle(fallbackSection);
  if (fallbackImage.fit !== 'cover' || fallbackImage.aspectRatio !== 'auto') {
    throw new Error('Image fallback contract invalid.');
  }

  const fallbackVisual = getAdminSectionVisualStyle(fallbackSection);
  if (fallbackVisual.contentWidth !== 'normal' || fallbackVisual.contentAlign !== 'left') {
    throw new Error('Section visual fallback contract invalid.');
  }

  const customSection = sectionFixture({
    blocks: [
      { key: 'style.image.fit', label: 'fit', kind: 'TEXT', value: 'contain' },
      { key: 'style.image.aspectRatio', label: 'ratio', kind: 'TEXT', value: '16/9' },
      { key: 'style.image.focalX', label: 'x', kind: 'TEXT', value: '30' },
      { key: 'style.image.focalY', label: 'y', kind: 'TEXT', value: '70' },
      { key: 'style.image.zoom', label: 'z', kind: 'TEXT', value: '1.5' },
      { key: 'style.contentWidth', label: 'cw', kind: 'TEXT', value: 'wide' },
      { key: 'style.verticalSpacing', label: 'vs', kind: 'TEXT', value: 'airy' },
      { key: 'style.contentAlign', label: 'ca', kind: 'TEXT', value: 'center' },
      { key: 'style.headingScale', label: 'hs', kind: 'TEXT', value: 'lg' },
      { key: 'style.mobileSpacing', label: 'ms', kind: 'TEXT', value: 'compact' },
      { key: 'style.mobileAlign', label: 'ma', kind: 'TEXT', value: 'center' },
    ],
  });

  const customImage = getAdminImageStyle(customSection);
  if (customImage.fit !== 'contain' || customImage.aspectRatio !== '16/9' || customImage.focalX !== 30 || customImage.focalY !== 70) {
    throw new Error('Image style parsing contract invalid.');
  }

  const customVisual = getAdminSectionVisualStyle(customSection);
  if (
    customVisual.contentWidth !== 'wide' ||
    customVisual.verticalSpacing !== 'airy' ||
    customVisual.contentAlign !== 'center' ||
    customVisual.headingScale !== 'lg' ||
    customVisual.mobileSpacing !== 'compact' ||
    customVisual.mobileAlign !== 'center'
  ) {
    throw new Error('Section visual style parsing contract invalid.');
  }

  console.log('Admin runtime contract test OK.');
}

run();
