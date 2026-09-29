export const revidReferral = {
  url: 'https://www.revid.ai/?via=simon-morin',
  code: 'NoWiS2026',
};

export const songWritingPrompt = `Aide-moi à écrire une chanson personnelle en français. Avant de proposer les paroles, pose-moi les questions nécessaires pour comprendre mon histoire.

À qui elle s’adresse : [personne et lien avec moi].
L’occasion : [anniversaire, amour, merci, hommage…].
L’histoire : [raconte longuement les moments importants, avec tes mots].
Trois détails vrais à conserver : [un lieu, un geste, une phrase].
L’émotion au début : [tendresse, manque, joie…].
L’émotion à la fin : [espoir, gratitude, apaisement…].
Ce que je veux lui dire : [le message essentiel].
Ce que je ne veux pas : [clichés, mots, sujets à éviter].
La voix du récit : [je m’adresse à toi / nous / récit à la troisième personne].
La direction musicale : [ballade acoustique douce, pop joyeuse…].

Propose deux couplets, un refrain mémorable et un pont. Utilise des phrases naturelles, faciles à chanter, et des rimes qui ne déforment pas le sens. N’invente pas de souvenirs. Signale les détails qui manquent. Je veux retravailler le texte avec toi jusqu’à ce qu’il me ressemble.`;

export const revisionPrompt = `Garde les deux premières lignes du refrain et le souvenir du deuxième couplet. Le reste sonne trop générique. Propose trois versions du refrain avec plus de gratitude, des phrases plus courtes et des rimes naturelles. Évite les mots « destin » et « éternité ». Explique brièvement ce qui change, sans inventer de faits.`;
export const musicStylePrompt = `Ballade pop acoustique en français, guitare chaleureuse et piano discret, tempo modéré, voix intime, début retenu puis refrain plus ample, ambiance tendre et lumineuse, paroles bien intelligibles.`;
export const videoDirectionPrompt = `Une histoire de souvenirs et de gratitude. Lumière dorée de fin de journée, lieux calmes, gestes du quotidien et plans lents. Couleurs chaudes et style cohérent d’une scène à l’autre. Commencer dans l’intimité puis ouvrir vers un paysage lumineux au dernier refrain. Éviter les textes inventés dans les images.`;
