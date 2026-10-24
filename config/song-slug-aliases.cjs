/**
 * Duplicate public song URLs. The value is the correctly spelled canonical slug.
 * "Chanson ÇA VA BIEN ALLER / NOWIS" and "Je vais t'aimer pour toujours (Marie-Lisa)"
 * stay on their own URLs: they are the YouTube recordings behind the verified
 * popular selection (aDAXQ3p4ezU, nlk6Zf40Dpg), not spelling variants of another page.
 */
const songSlugRedirects = {
  superbowl: 'super-bowl',
  'le-printemps-va-rugir': 'le-printemps-va-rougir',
  'j-t-alle-a-doremi': 'j-t-aller-a-doremi',
  'pas-besion-de-voir': 'pas-besoin-de-voir',
  'marie-lisa-gtub6g': 'marie-lisa',
};

module.exports = { songSlugRedirects };
