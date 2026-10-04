/*
 * Lectures symboliques locales, rédigées à partir des traits de tarot-data.js.
 * Ces développements sont des interprétations de la liseuse, et non des citations
 * du notebook. Aucune requête réseau, prédiction factuelle ou probabilité calculée.
 */
(function () {
  'use strict';

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const contexts = {
    finances: {
      label: 'Vos finances', stake: 'votre rapport à l’argent et l’organisation de vos ressources',
      area: 'vos finances', check: 'ce qui correspond à vos besoins réels, à vos moyens et à vos priorités',
      step: 'rapprocher votre ressenti des éléments concrets de votre budget',
      questions: 'quelles attentes influencent vos décisions d’argent'
    },
    travail: {
      label: 'Votre vie professionnelle', stake: 'votre place, vos responsabilités et votre manière de travailler',
      area: 'votre vie professionnelle', check: 'ce qui est attendu de vous et ce que vous pouvez réellement soutenir',
      step: 'clarifier une attente ou une prochaine étape avec les personnes concernées',
      questions: 'quelles attentes et quelles responsabilités demandent à être clarifiées'
    },
    relation: {
      label: 'Vos relations', stake: 'la qualité du lien et la place de chacun dans la relation',
      area: 'votre relation', check: 'ce que chacun exprime, souhaite et accepte librement',
      step: 'mettre des mots sur un besoin sans décider à la place de l’autre',
      questions: 'ce que vous ressentez et ce que l’autre exprime réellement'
    },
    projet: {
      label: 'Votre projet', stake: 'la forme que vous voulez donner à votre projet',
      area: 'votre projet', check: 'l’objectif visé, les moyens disponibles et la prochaine étape réalisable',
      step: 'choisir une petite étape dont vous pourrez observer le résultat',
      questions: 'ce qui rend votre idée réalisable et ce qui mérite encore d’être précisé'
    },
    choix: {
      label: 'Votre choix', stake: 'les critères et les valeurs qui guident votre décision',
      area: 'votre décision', check: 'ce qui compte pour vous dans chaque option et ce que vous êtes prêt à accepter',
      step: 'formuler les critères qui permettent de comparer vos options',
      questions: 'ce qui relève de votre préférence et ce qui relève de la pression extérieure'
    },
    general: {
      label: 'Votre situation', stake: 'votre manière d’aborder cette situation',
      area: 'la situation qui vous préoccupe', check: 'ce que vous observez, ce que vous ressentez et ce qui reste à comprendre',
      step: 'nommer un fait, un besoin et un petit pas à votre portée',
      questions: 'ce qui vous touche dans cette situation et ce que vous pouvez concrètement faire évoluer'
    }
  };

  const themeRules = {
    finances: /\b(argent|finances?|financieres?|financiers?|budget|depenses?|revenus?|epargner?|economiser|dettes?|credits?|investissements?|investir|rembourser|remboursements?|factures?|patrimoine|banques?|prets?|riches?|richesse|economies?|salaires?|payer|paiements?|loyers?|acheter|achats?|vendre|ventes?|immobilier|immobiliere|logements?)\b/g,
    travail: /\b(travail|emploi|emplois|metiers?|carriere|carrieres|professionnelle?s?|professionnels?|boulot|entreprises?|patrons?|collegues?|recrutement|embauche|promotion|licenciement|clients?|poste|postes)\b/g,
    relation: /\b(couple|couples|amour|amoureux|amoureuse|amoureuses|amoureusement|partenaires?|conjoints?|mariage|rupture|rompre|divorce|separation|dialogue|renouer|amitie|amis?|amies?|famille|parents?|enfants?|relation|relations|sentiments?|affectif|affective)\b/g,
    projet: /\b(projets?|idees?|creation|creer|lancement|lancer|objectifs?|developper|etudes|formation|construire|entreprendre)\b/g,
    choix: /\b(choix|choisir|choisis|decision|decisions|decider|hesite|hesiter|hesitation|dilemme|options?)\b/g
  };

  function detectTheme(question) {
    const original = String(question || '').trim();
    let value = normalize(original);
    // « Travail sur moi » parle d’un chemin personnel, pas nécessairement d’emploi.
    value = value.replace(/\btravail(?:ler)?\s+(?:sur|en)\s+(?:moi|soi|moi meme|soi meme)\b/g, '');
    // La relation à l’argent n’est pas, à elle seule, une relation amoureuse.
    value = value.replace(/\brelation\s+(?:avec|a|au|aux)\s+(?:(?:mon|ma|mes|l|les|le|la)\s+)?(?:argent|finances?|travail|projet|projets?)\b/g, function (match) {
      return match.replace(/^relation\s+/, '');
    });
    const unfiltered=value;
    if(window.TAROT_PERSONAL)value=window.TAROT_PERSONAL.signals(value);
    const scoreThemes = text => Object.keys(themeRules).map(function (key) {
      const matches = Array.from(text.matchAll(themeRules[key]));
      const score = matches.reduce(function (sum, match) {
        const broad = /^(relation|relations|sentiment|sentiments|idee|idees|lancer|lancement|construire|objectif|objectifs|decision|decisions|choix|choisir|options?)$/.test(match[0]);
        return sum + (broad ? 1 : 3);
      }, 0);
      return { key: key, score: score, first: matches.length ? matches[0].index : Infinity };
    }).filter(function (entry) { return entry.score > 0; });
    let scores=scoreThemes(value);
    if(!scores.length&&value!==unfiltered)scores=scoreThemes(unfiltered);
    scores.sort(function (a, b) { return b.score - a.score || a.first - b.first; });
    const key = scores.length ? scores[0].key : 'general';
    return Object.assign({}, contexts[key], {
      key: key,
      question: original,
      secondary: scores.slice(1).map(function (entry) { return entry.key; })
    });
  }

  function detectContext(question, answers) {
    const base=detectTheme(question);
    return window.TAROT_PERSONAL ? window.TAROT_PERSONAL.refineContext(base,question,answers,detectTheme) : base;
  }

  // Chaque rang conserve le sens de la grille vérifiée, sans lui attribuer
  // les significations iconographiques d’une autre tradition de tarot.
  const ranks = {
    1: {
      lens: 'un commencement encore à préciser',
      symbol: 'L’As porte un début : il met l’accent sur ce qui peut être amorcé, avant que sa forme soit complètement établie.',
      past: 'un premier élan ou une attente de nouveauté',
      risk: 'la précipitation à commencer sans savoir ce que vous souhaitez construire',
      condition: 'donnez un objectif simple à ce premier élan',
      promise: 'un début pourra devenir une étape concrète, à ajuster selon ce que vous observerez',
      actions: ['définir le besoin auquel une nouvelle démarche financière répondrait', 'préciser ce que vous attendez d’un nouveau départ professionnel', 'exprimer ce que vous aimeriez commencer ou renouveler dans le lien', 'choisir la première étape utile de votre projet', 'identifier ce qui vous attire dans une option nouvelle', 'nommer ce que vous souhaitez commencer']
    },
    2: {
      lens: 'deux pôles à mettre en relation',
      symbol: 'Le Deux fait apparaître une dualité : deux besoins, deux points de vue ou deux directions peuvent demander à être considérés ensemble.',
      past: 'la coexistence de deux attentes différentes',
      risk: 'l’hésitation qui maintient deux directions sans examiner ce qui les distingue',
      condition: 'clarifiez ce qui oppose ou relie les deux pôles',
      promise: 'une manière plus cohérente de les articuler pourra apparaître',
      actions: ['comparer deux besoins financiers sans les confondre', 'clarifier deux attentes professionnelles qui tirent dans des directions différentes', 'écouter deux points de vue sans supposer qu’ils sont incompatibles', 'comparer deux orientations possibles du projet', 'écrire les avantages et les limites des deux options qui vous occupent', 'distinguer deux attentes qui coexistent dans la situation']
    },
    3: {
      lens: 'la création d’une forme nouvelle',
      symbol: 'Le Trois évoque la création : quelque chose cherche à prendre forme à partir des éléments déjà disponibles.',
      past: 'une idée élaborée ou une manière de créer des possibilités',
      risk: 'la multiplication des idées sans leur donner de forme concrète',
      condition: 'traduisez une idée en un essai observable',
      promise: 'ce qui était une intention pourra commencer à se structurer',
      actions: ['imaginer une organisation de vos ressources qui réponde mieux à vos besoins', 'proposer une façon concrète d’améliorer votre travail', 'inventer une manière de partager ou de vous exprimer dans le lien', 'donner une première forme visible à votre idée', 'imaginer une option qui ne vous enferme pas dans une opposition trop simple', 'donner une forme concrète à une idée utile']
    },
    4: {
      lens: 'la concrétisation et les appuis déjà construits',
      symbol: 'Le Quatre met en avant la concrétisation : il invite à regarder ce qui tient déjà, ce qui a une forme et ce qui peut servir d’appui.',
      past: 'une organisation établie ou un acquis devenu habituel',
      risk: 'l’attachement à une forme établie qui ne répond plus à vos besoins',
      condition: 'vérifiez que vos appuis sont adaptés à l’objectif actuel',
      promise: 'une base concrète pourra soutenir la prochaine étape',
      actions: ['vérifier les appuis réels de votre budget avant de l’ajuster', 'clarifier l’organisation et les responsabilités qui soutiennent votre travail', 'observer les engagements et les habitudes sur lesquels repose le lien', 'définir ce qui est déjà réalisé et utilisable dans le projet', 'examiner les conséquences concrètes de chaque option', 'identifier ce qui est déjà solide et ce qui demande un ajustement']
    },
    5: {
      lens: 'une évolution qui oblige à faire un bilan',
      symbol: 'Le Cinq parle d’évolution, avec ce que le changement apporte et ce qu’il demande de laisser ou de réorganiser.',
      past: 'la façon dont vous avez envisagé les bénéfices et les concessions d’un changement',
      risk: 'l’attention portée uniquement à ce que vous gagnez ou uniquement à ce que vous perdez',
      condition: 'regardez ensemble les apports et les concessions du changement',
      promise: 'l’évolution pourra être abordée avec des attentes plus lucides',
      actions: ['faire le bilan de ce qu’un changement apporterait et coûterait à votre budget', 'examiner les bénéfices et les concessions d’une évolution professionnelle', 'mettre des mots sur ce que le lien apporte et ce qu’il vous demande', 'évaluer ce qu’une évolution du projet apporte et ce qu’elle mobilise', 'comparer ce que chaque choix ouvre et ce qu’il ferme', 'regarder les bénéfices et les concessions d’un changement']
    },
    6: {
      lens: 'un passage entre deux étapes',
      symbol: 'Le Six souligne une transition et un choix : il invite à penser le passage d’une étape à l’autre, plutôt qu’à rester entre les deux.',
      past: 'une transition envisagée ou la manière dont un choix a été préparé',
      risk: 'un passage laissé indéfini parce que le choix qui l’accompagne reste flou',
      condition: 'précisez ce que vous quittez, ce que vous gardez et vers quoi vous allez',
      promise: 'la transition pourra devenir plus lisible et plus facile à accompagner',
      actions: ['préparer les étapes d’un changement dans votre organisation financière', 'préciser les conditions d’un passage vers une nouvelle étape professionnelle', 'discuter de ce qui doit évoluer et de ce que vous souhaitez préserver dans le lien', 'définir le passage entre l’étape actuelle et la suivante du projet', 'nommer ce que chaque décision ferait réellement évoluer', 'définir le passage que vous souhaitez accompagner']
    },
    7: {
      lens: 'une progression confrontée à des obstacles',
      symbol: 'Le Sept rapproche la possibilité d’une victoire des obstacles à traverser : avancer suppose de savoir ce qui résiste et ce qui aide à persévérer.',
      past: 'la façon dont un obstacle ou un objectif exigeant a été envisagé',
      risk: 'la volonté de gagner qui fait perdre de vue les obstacles réels ou le coût de l’effort',
      condition: 'identifiez un obstacle précis et les moyens raisonnables de le traiter',
      promise: 'une progression deviendra envisageable sans supposer que tous les obstacles disparaîtront',
      actions: ['identifier le principal obstacle à votre objectif financier et la marge dont vous disposez', 'nommer un frein professionnel précis avant de choisir comment y répondre', 'aborder une difficulté du lien sans transformer l’échange en compétition', 'repérer le premier obstacle concret à traiter dans le projet', 'examiner la difficulté principale de chaque option', 'distinguer un obstacle réel d’un défi que vous vous imposez']
    },
    8: {
      lens: 'un équilibre à maintenir dans le mouvement',
      symbol: 'Le Huit associe l’équilibre au mouvement : il propose un ajustement vivant, capable d’évoluer sans perdre ses repères.',
      past: 'la manière dont vous avez cherché à faire évoluer les choses tout en gardant un équilibre',
      risk: 'l’alternance entre l’immobilité et des changements trop rapides',
      condition: 'avancez par ajustements dont vous pourrez observer les effets',
      promise: 'le mouvement pourra rester compatible avec un équilibre à entretenir',
      actions: ['ajuster votre organisation financière en observant son effet sur l’équilibre du budget', 'répartir l’effort professionnel pour avancer à un rythme soutenable', 'chercher un rythme d’échange qui respecte les besoins de chacun', 'ajuster le rythme du projet aux moyens disponibles', 'comparer les options selon leur équilibre et leur capacité d’évolution', 'faire un ajustement mesuré et observer ce qu’il change']
    },
    9: {
      lens: 'l’expérience arrivée à un point de maturité',
      symbol: 'Le Neuf évoque l’apogée et l’expérience : il invite à reconnaître ce qui a mûri et ce que les étapes précédentes permettent de comprendre.',
      past: 'les repères acquis et ce que l’expérience vous a appris',
      risk: 'la certitude que l’expérience passée suffit à comprendre une situation nouvelle',
      condition: 'utilisez vos acquis tout en vérifiant ce qui a changé',
      promise: 'votre expérience pourra nourrir une réponse plus mûre à la situation',
      actions: ['relire ce que votre expérience vous a appris sur vos besoins et vos moyens', 'identifier les compétences acquises qui peuvent vous servir maintenant', 'reconnaître ce que vos expériences de relation vous ont appris sans les imposer au présent', 'faire le bilan de ce qui a mûri et de ce qui reste à vérifier dans le projet', 'mobiliser votre expérience en distinguant les faits nouveaux des situations déjà connues', 'tirer un enseignement précis de votre expérience']
    },
    10: {
      lens: 'l’aboutissement d’une étape',
      symbol: 'Le Dix met l’accent sur l’aboutissement : il pose la question de ce qui arrive à son terme et du sens que vous donnez au résultat.',
      past: 'un bilan ou une idée de ce qu’une étape achevée devait vous apporter',
      risk: 'la recherche d’un résultat parfait qui empêche de reconnaître une étape suffisamment accomplie',
      condition: 'définissez ce qui permettrait de considérer cette étape comme achevée',
      promise: 'un aboutissement pourra être reconnu et servir de point de départ à la suite',
      actions: ['définir les critères concrets d’un objectif financier atteint', 'préciser ce qui marquerait l’achèvement d’une étape professionnelle', 'clarifier ce que vous attendez d’un engagement ou d’une étape commune', 'définir ce qui rendrait le projet suffisamment abouti', 'vérifier vers quel résultat chaque option conduit', 'définir ce qui permettrait de clore utilement cette étape']
    },
    11: {
      lens: 'un projet qui se découvre par l’essai',
      symbol: 'Le Valet représente le projet et l’expérimentation : il laisse une place à l’apprentissage, aux essais et aux questions encore ouvertes.',
      past: 'un essai, une intention ou une manière d’apprendre en expérimentant',
      risk: 'des essais dispersés dont vous ne tirez pas d’enseignement',
      condition: 'limitez l’essai et choisissez ce que vous voulez apprendre de lui',
      promise: 'l’expérience pourra vous donner des repères pour décider de la suite',
      actions: ['examiner une idée financière par un calcul ou un essai limité avant de vous engager', 'tester une méthode de travail et en observer le résultat', 'ouvrir un échange exploratoire sans lui faire porter immédiatement une conclusion', 'réaliser un essai limité qui répond à une question précise du projet', 'explorer une option par une petite étape réversible', 'faire un essai limité dont vous pourrez tirer un enseignement']
    },
    12: {
      lens: 'le passage de l’intention à l’action',
      symbol: 'Le Cavalier met l’action au premier plan : il demande comment une intention peut se traduire en mouvement réel.',
      past: 'votre manière de passer à l’action et le rythme que vous lui avez donné',
      risk: 'l’action engagée avant que sa direction ou ses limites soient claires',
      condition: 'choisissez une action précise et vérifiez ce qu’elle produit',
      promise: 'un mouvement utile pourra se dessiner et être corrigé en chemin',
      actions: ['choisir une action concrète pour mieux organiser vos ressources', 'définir une démarche professionnelle précise que vous pouvez engager', 'faire un pas vers un échange clair plutôt que supposer les intentions de l’autre', 'transformer une intention du projet en tâche concrète', 'identifier le premier acte que chaque option demanderait', 'choisir une action précise et en observer l’effet']
    },
    13: {
      lens: 'la compréhension et la patience',
      symbol: 'La Reine représente une compréhension patiente : elle propose de laisser une situation se préciser avant d’y répondre trop vite.',
      past: 'la place donnée à l’écoute, à la patience et aux attentes personnelles',
      risk: 'une patience qui se transforme en attente indéfinie ou en oubli de vos propres besoins',
      condition: 'prenez le temps de comprendre tout en gardant une limite à l’attente',
      promise: 'une réponse plus attentive pourra se construire sans suspendre toute décision',
      actions: ['comprendre ce qui motive vos décisions d’argent avant de réviser une habitude', 'comprendre les attentes professionnelles avant de répondre à une demande', 'écouter le ressenti de chacun tout en exprimant aussi vos besoins', 'laisser mûrir une idée tout en clarifiant ce dont elle a besoin pour avancer', 'laisser retomber la pression avant de comparer ce qui compte dans chaque option', 'prendre le temps de comprendre en donnant une place à vos propres besoins']
    },
    14: {
      lens: 'la connaissance et le pouvoir d’agir',
      symbol: 'Le Roi rapproche la connaissance du pouvoir : il invite à utiliser ce que vous comprenez pour exercer une responsabilité avec discernement.',
      past: 'les connaissances utilisées et la place prise dans les décisions',
      risk: 'le besoin de contrôler la situation ou de considérer votre point de vue comme le seul valable',
      condition: 'reliez votre décision à des connaissances vérifiables et à vos responsabilités réelles',
      promise: 'une position plus assumée pourra se construire sans chercher à tout contrôler',
      actions: ['clarifier ce que vous savez de votre situation financière et ce qui relève de votre responsabilité', 'utiliser vos compétences pour décider clairement dans le cadre de votre rôle', 'prendre votre place dans le lien sans imposer une décision à l’autre', 'répartir les responsabilités du projet selon les connaissances et les moyens de chacun', 'assumer votre décision à partir de critères que vous pouvez expliquer', 'utiliser vos connaissances pour prendre une responsabilité à votre portée']
    }
  };

  const familyBridges = {
    coupes: {
      finances: 'Les Coupes invitent à regarder ce que vos émotions et vos liens personnels changent dans votre rapport à l’argent, notamment les attentes qui accompagnent vos décisions.',
      travail: 'Les Coupes déplacent l’attention vers le climat humain du travail, la manière dont vous vivez les échanges et la place donnée aux besoins de chacun.',
      relation: 'Les Coupes portent directement le regard sur le vécu affectif du lien, en distinguant ce que vous ressentez de ce que l’autre exprime.',
      projet: 'Les Coupes éclairent l’attachement que vous portez au projet et la manière dont les liens humains peuvent soutenir ou compliquer son développement.',
      choix: 'Les Coupes donnent une place aux préférences affectives et aux liens qui pèsent dans votre choix, sans faire d’une émotion une preuve.',
      general: 'Les Coupes invitent à explorer ce que vous ressentez et la place des liens humains dans cette situation, sans supposer les intentions de qui que ce soit.'
    },
    batons: {
      finances: 'Les Bâtons relient cette question à l’effort, aux initiatives et à la place du travail dans la construction de vos ressources.',
      travail: 'Les Bâtons portent directement le regard sur votre activité professionnelle, votre engagement et la manière dont vous mobilisez vos moyens pour avancer.',
      relation: 'Les Bâtons invitent à observer ce que chacun met en mouvement dans le lien et la place que l’activité ou les engagements professionnels y prennent.',
      projet: 'Les Bâtons mettent en avant l’énergie consacrée au projet, les initiatives utiles et l’organisation de l’effort nécessaire pour lui donner une forme.',
      choix: 'Les Bâtons invitent à comparer les options selon l’engagement concret qu’elles demandent et le mouvement que vous souhaitez donner à votre activité.',
      general: 'Les Bâtons proposent de regarder votre capacité d’initiative et l’effort que vous pouvez réellement consacrer à ce qui vous préoccupe.'
    },
    epees: {
      finances: 'Les Épées ramènent votre question aux raisonnements, aux informations et aux critères utilisés pour comprendre vos décisions d’argent.',
      travail: 'Les Épées éclairent l’analyse, les échanges d’idées et la clarté des informations sur lesquelles repose votre situation professionnelle.',
      relation: 'Les Épées invitent à distinguer les paroles entendues, les faits observés et les conclusions que vous en tirez au sujet du lien.',
      projet: 'Les Épées mettent en avant la conception du projet, les questions à résoudre et les idées qui doivent être confrontées aux faits.',
      choix: 'Les Épées portent directement sur la manière de comparer les options et de distinguer un critère solide d’une supposition.',
      general: 'Les Épées invitent à examiner votre compréhension de la situation et à distinguer ce que vous savez de ce que vous supposez.'
    },
    deniers: {
      finances: 'Les Deniers portent directement sur vos ressources, vos besoins matériels et la réalité concrète de leur organisation.',
      travail: 'Les Deniers éclairent les moyens matériels, la rémunération et les conditions concrètes qui rendent votre activité soutenable.',
      relation: 'Les Deniers invitent à regarder le soutien concret, l’organisation du quotidien et les questions matérielles qui prennent une place dans le lien.',
      projet: 'Les Deniers ramènent le projet à ses moyens disponibles, à son coût et aux conditions matérielles de sa réalisation.',
      choix: 'Les Deniers invitent à examiner les conséquences matérielles des options, les ressources qu’elles mobilisent et les limites à respecter.',
      general: 'Les Deniers proposent de regarder les ressources disponibles, les besoins concrets et les appuis matériels de cette situation.'
    }
  };

  function major(lens, symbol, past, risk, condition, promise, action, bridges) {
    return { lens: lens, symbol: symbol, past: past, risk: risk, condition: condition, promise: promise, action: action, bridges: bridges };
  }

  const majors = {
    0: major('la liberté et l’exploration d’un nouveau chemin', 'Le Mat évoque le mouvement, l’indépendance et un départ vers une étape encore inconnue.', 'les envies de liberté et les changements de direction que vous avez envisagés', 'un départ motivé par la fuite ou engagé sans préparation', 'gardez un point d’appui et essayez une étape limitée', 'un chemin plus personnel pourra se préciser à partir de ce que cet essai vous apprend', 'distinguer votre envie de découvrir d’une difficulté que vous cherchez à éviter', {
      finances: 'Pour vos finances, il invite à examiner ce que votre envie de liberté demande concrètement à vos ressources et à votre organisation.', travail: 'Au travail, il propose de regarder une réorientation ou une manière plus personnelle de faire, en conservant des appuis réalistes.', relation: 'Dans le lien, il invite à parler de l’espace et de l’indépendance dont chacun a besoin, sans fuir une conversation importante.', projet: 'Pour le projet, il éclaire une piste originale à explorer par un premier essai, sans demander de tout bouleverser.', choix: 'Face au choix, il invite à distinguer une découverte qui vous attire d’un départ motivé surtout par l’évitement.'
    }),
    1: major('le potentiel d’un commencement', 'Le Bateleur évoque les possibilités d’un début et le passage à l’action, lorsque les moyens disponibles cherchent encore leur usage.', 'la manière dont un commencement ou une initiative a été envisagé', 'la dispersion entre plusieurs possibilités sans engagement clair', 'choisissez une possibilité et une première étape réalisable', 'un commencement pourra prendre forme et être évalué en chemin', 'identifier vos moyens et choisir un premier geste utile', {
      finances: 'Pour vos finances, ce potentiel invite à regarder les moyens dont vous disposez déjà et l’usage concret que vous pourriez mieux en faire.', travail: 'Au travail, le Bateleur ouvre une réflexion sur vos compétences disponibles et sur la première initiative qui leur donnerait un usage.', relation: 'Dans le lien, il invite à considérer ce qui pourrait être commencé ou renouvelé par un échange simple et sincère.', projet: 'Pour le projet, il s’agit de transformer une possibilité en un premier essai plutôt que de multiplier les intentions.', choix: 'Face au choix, il invite à reconnaître les options réelles et celle pour laquelle vous pouvez définir un premier pas.'
    }),
    2: major('le savoir intérieur et ce qui reste à comprendre', 'La Papesse évoque l’intuition, la sagesse et des connaissances encore cachées : elle laisse une place à l’observation avant la conclusion.', 'les pressentiments, les observations ou les informations laissées en attente', 'une impression tenue pour certaine ou une information importante laissée sans vérification', 'écoutez votre intuition tout en recherchant ce qui manque à votre compréhension', 'un élément jusque-là peu visible pourra être mieux compris', 'distinguer votre intuition des informations qu’il reste à vérifier', {
      finances: 'Pour vos finances, elle invite à regarder les informations qui manquent et les habitudes discrètes qui influencent votre jugement.', travail: 'Au travail, elle propose d’observer les attentes et les informations qui ne sont pas encore explicites.', relation: 'Dans le lien, elle invite à écouter votre ressenti sans attribuer à l’autre des intentions qu’il n’a pas exprimées.', projet: 'Pour le projet, elle donne du poids à la préparation, à la recherche et aux questions encore ouvertes.', choix: 'Dans une décision, elle suggère de laisser émerger vos critères personnels tout en vérifiant ce que vous ne savez pas encore.'
    }),
    3: major('la créativité et la fécondité des idées', 'L’Impératrice évoque la création et l’abondance des idées : elle donne une place à ce qui peut être développé et mis en forme.', 'les idées développées et les possibilités auxquelles vous avez donné de l’attention', 'l’accumulation de possibilités qui dépasse les moyens de les concrétiser', 'donnez une forme précise à une idée et choisissez ce qui peut être développé', 'une possibilité créative pourra devenir plus tangible', 'choisir une idée féconde et lui donner une forme concrète', {
      finances: 'Pour vos finances, cette créativité peut servir à repenser l’usage de vos ressources ; l’abondance symbolique ne promet pas un revenu.', travail: 'Au travail, elle invite à reconnaître vos idées utiles et la façon dont vous pouvez les rendre visibles.', relation: 'Dans le lien, elle éclaire ce qui nourrit l’expression, le partage et le développement d’une vie commune.', projet: 'Pour le projet, elle met en avant la capacité à produire une forme et à faire grandir une idée.', choix: 'Face au choix, elle invite à regarder les possibilités de développement qu’ouvre chaque option.'
    }),
    4: major('un cadre stable et une autorité assumée', 'L’Empereur évoque la stabilité, l’autorité et le cadre : il invite à regarder les règles et les appuis qui permettent de tenir une direction.', 'les règles, les habitudes d’organisation et la place donnée à l’autorité', 'un cadre devenu rigide ou un besoin de tout contrôler', 'définissez un cadre clair tout en vérifiant qu’il reste adapté à vos besoins', 'une organisation plus stable pourra soutenir vos décisions', 'définir des limites et des responsabilités claires', {
      finances: 'Pour vos finances, le cadre se traduit par des repères concrets : besoins, limites, engagements et organisation des ressources.', travail: 'Au travail, il propose de clarifier votre rôle, votre marge de décision et les responsabilités de chacun.', relation: 'Dans le lien, il invite à examiner la solidité des engagements et la place laissée à l’autonomie de chacun.', projet: 'Pour le projet, il ramène aux responsabilités, aux étapes et aux règles qui permettent de construire dans la durée.', choix: 'Face au choix, il invite à comparer les options selon leur stabilité et les contraintes que vous pouvez assumer.'
    }),
    5: major('les repères transmis et les enseignements reçus', 'Le Pape évoque la tradition, la transmission et les enseignements : il invite à examiner les repères auxquels vous accordez votre confiance.', 'les conseils reçus, les valeurs transmises et les règles apprises', 'une règle héritée suivie sans vérifier si elle vous convient encore', 'confrontez un enseignement ou un conseil à votre situation réelle', 'un repère transmis pourra être retenu, adapté ou remis en question avec discernement', 'identifier une règle apprise et vérifier sa pertinence aujourd’hui', {
      finances: 'Pour vos finances, il peut éclairer les valeurs apprises autour de l’argent et les conseils auxquels vous vous référez.', travail: 'Au travail, il invite à examiner les règles du métier, la formation et l’aide d’une personne capable de transmettre son expérience.', relation: 'Dans le lien, il ramène aux valeurs partagées et aux modèles de relation que chacun a reçus.', projet: 'Pour le projet, il invite à chercher un enseignement pertinent ou un retour d’expérience qui puisse guider la construction.', choix: 'Dans la décision, il propose de distinguer vos valeurs personnelles des règles que vous suivez par habitude.'
    }),
    6: major('un choix qui engage vos valeurs et vos liens', 'L’Amoureux évoque le choix, l’amour et les liens affectifs : il attire l’attention sur ce qui vous rapproche d’une option ou d’une personne.', 'les préférences affectives et les choix qui ont orienté vos attentes', 'un choix guidé par le besoin de plaire ou par une préférence qui n’est pas clarifiée', 'nommez vos valeurs et les conséquences de l’option qui vous attire', 'une décision plus cohérente avec vos valeurs pourra se dessiner', 'distinguer votre désir personnel de l’influence des liens ou des attentes extérieures', {
      finances: 'Pour vos finances, il invite à observer les arbitrages d’argent auxquels vos attachements et vos priorités personnelles donnent du poids.', travail: 'Au travail, il propose de comparer les directions possibles selon vos valeurs, vos affinités et les engagements qu’elles demandent.', relation: 'Dans le lien, il ramène à l’accord entre votre désir, la liberté de chacun et les choix que la relation demande.', projet: 'Pour le projet, il invite à choisir une orientation qui vous tient à cœur tout en regardant ses implications.', choix: 'Face à votre décision, il donne une place au désir et aux valeurs, sans les confondre avec la pression de devoir satisfaire tout le monde.'
    }),
    7: major('une avancée volontaire et maîtrisée', 'Le Chariot évoque la détermination et la maîtrise du mouvement : il propose une direction claire à l’énergie que vous souhaitez engager.', 'la volonté d’avancer et la façon dont vous avez tenu une direction', 'la poursuite d’un objectif sans tenir compte du rythme ou des limites', 'choisissez une direction précise et gardez un moyen d’ajuster votre avancée', 'une progression pourra se construire par un effort orienté', 'définir un objectif et les moyens de suivre votre progression', {
      finances: 'Pour vos finances, il invite à formuler un objectif concret et à vérifier que l’effort demandé reste compatible avec vos moyens.', travail: 'Au travail, il éclaire l’élan pour avancer et la nécessité de garder un cap dans vos démarches.', relation: 'Dans le lien, il invite à vérifier que la direction souhaitée laisse une place à la volonté de chacun.', projet: 'Pour le projet, il propose de concentrer votre effort sur une direction et des étapes observables.', choix: 'Face au choix, il invite à identifier une direction que vous pouvez assumer plutôt qu’à rester dans un mouvement dispersé.'
    }),
    8: major('l’équilibre, les faits et la justesse d’une décision', 'La Justice évoque l’équilibre et la vérité : elle invite à rapprocher une décision des faits et de la place accordée à chacun.', 'les critères de décision et la façon dont vous avez cherché un équilibre', 'un jugement trop rapide ou un souci d’équité qui reste abstrait', 'vérifiez les faits et explicitez les critères de votre décision', 'un choix plus équilibré pourra être posé sur une base plus claire', 'mettre les faits, les engagements et vos critères de décision en regard', {
      finances: 'Pour vos finances, elle propose de mettre en regard vos besoins, vos ressources et les engagements réels, sans vous limiter à une impression.', travail: 'Au travail, elle invite à examiner l’équilibre des responsabilités et les critères utilisés pour évaluer une situation.', relation: 'Dans le lien, elle invite à regarder la réciprocité et les faits observables sans réduire chacun à un jugement.', projet: 'Pour le projet, elle ramène à l’équilibre entre l’objectif, les moyens engagés et les critères de réussite.', choix: 'Dans votre décision, elle invite à comparer les options sur des critères explicites et cohérents.'
    }),
    9: major('le recul et la recherche de compréhension', 'L’Hermite évoque le retrait et la sagesse : il propose de ralentir pour comprendre ce qui mérite votre attention.', 'les moments de recul et les enseignements tirés de votre expérience', 'un retrait qui empêche de confronter votre réflexion à la situation réelle', 'prenez du recul puis choisissez un point précis à éclaircir', 'une direction plus réfléchie pourra apparaître avec ce travail de compréhension', 'faire le bilan de votre expérience et formuler la question qui reste ouverte', {
      finances: 'Pour vos finances, le recul permet d’examiner votre rapport à l’argent et les habitudes que vous souhaitez comprendre avant de les modifier.', travail: 'Au travail, il propose un bilan de votre expérience et une réflexion sur le sens de la direction actuelle.', relation: 'Dans le lien, il invite à comprendre vos besoins personnels sans transformer la prise de recul en silence indéfini.', projet: 'Pour le projet, il suggère de relire ce qui a été appris avant de décider de l’étape suivante.', choix: 'Face au choix, il invite à laisser une place à la réflexion personnelle et aux enseignements de votre expérience.'
    }),
    10: major('le changement et la part d’imprévu', 'La Roue de Fortune évoque les changements et la chance : elle rappelle que toute situation comporte une part qui échappe à votre maîtrise.', 'la façon dont vous avez accueilli les changements et les éléments imprévus', 'l’attente que la chance décide à votre place ou l’illusion de tout maîtriser', 'distinguez ce qui dépend de vous de ce qui demande une capacité d’adaptation', 'votre réponse à un changement pourra devenir plus souple', 'préparer une marge d’adaptation et repérer ce qui reste sous votre contrôle', {
      finances: 'Pour vos finances, elle invite à penser la variabilité de la situation et la marge d’adaptation possible, sans annoncer un gain ni une perte.', travail: 'Au travail, elle éclaire les changements de contexte et la façon dont vous pouvez ajuster vos démarches.', relation: 'Dans le lien, elle invite à regarder ce qui évolue et ce que vous pouvez accompagner sans le contrôler.', projet: 'Pour le projet, elle propose de prévoir des ajustements lorsque le contexte ou les besoins changent.', choix: 'Face au choix, elle invite à tenir compte de l’incertitude sans abandonner les critères qui vous appartiennent.'
    }),
    11: major('le courage et la maîtrise intérieure', 'La Force évoque le courage et la maîtrise de votre énergie intérieure : elle propose de répondre avec fermeté sans laisser l’impulsion décider seule.', 'la manière dont vous avez contenu une réaction ou mobilisé votre courage', 'la tension entre une impulsion trop forte et un effort de maîtrise épuisant', 'reconnaissez l’émotion puis choisissez une réponse que vous pouvez soutenir', 'une réponse plus ferme et plus mesurée pourra se construire', 'identifier votre réaction immédiate et choisir une réponse posée', {
      finances: 'Pour vos finances, elle invite à observer les impulsions ou les inquiétudes qui pèsent sur vos décisions et à leur donner une réponse mesurée.', travail: 'Au travail, elle éclaire la capacité à tenir votre position sans vous imposer une tension permanente.', relation: 'Dans le lien, elle invite à exprimer une limite avec courage tout en gardant une maîtrise de votre réaction.', projet: 'Pour le projet, elle propose une persévérance qui respecte vos limites au lieu de dépendre d’un effort intense et bref.', choix: 'Face au choix, elle invite à ne pas laisser la peur ou l’impulsion prendre toute la place dans votre décision.'
    }),
    12: major('une pause et un changement de perspective', 'Le Pendu évoque la pause, le renoncement et un regard différent : il invite à suspendre une réponse habituelle pour voir autrement.', 'une attente ou la façon dont vous avez accepté de regarder autrement une situation', 'une suspension prolongée sans question claire ni limite à l’attente', 'changez de perspective et précisez ce que cette pause doit vous permettre de comprendre', 'une autre manière d’envisager la situation pourra devenir accessible', 'examiner la situation sous un autre angle et donner un but à la pause', {
      finances: 'Pour vos finances, il propose de suspendre un réflexe et de revoir la question à partir de vos besoins plutôt que d’une réponse automatique.', travail: 'Au travail, il invite à reconsidérer une attente ou une manière de faire avant de reprendre le mouvement.', relation: 'Dans le lien, il suggère de regarder le point de vue de l’autre sans renoncer à tous vos besoins.', projet: 'Pour le projet, il propose une pause utile pour revoir une hypothèse ou une méthode.', choix: 'Face au choix, il invite à changer la formulation du problème pour faire apparaître un angle négligé.'
    }),
    13: major('la fin d’une étape et une transformation', 'L’Arcane sans nom évoque une fin d’étape et un renouveau : elle pose la question de ce qui peut être laissé pour permettre une transformation.', 'les étapes closes ou les habitudes dont vous avez envisagé de vous détacher', 'la rupture recherchée pour elle-même ou la difficulté à laisser une habitude devenue inadaptée', 'identifiez ce qui ne répond plus au besoin actuel et ce qui peut être renouvelé', 'un renouvellement pourra être préparé à partir d’une fin d’étape reconnue', 'nommer une habitude à réviser et ce que vous souhaitez mettre à sa place', {
      finances: 'Pour vos finances, elle peut inviter à revoir une manière de gérer ou une attente devenue inadaptée, sans annoncer une perte matérielle.', travail: 'Au travail, elle propose de réfléchir à ce qui arrive au terme de son utilité et à la direction qui pourrait le remplacer.', relation: 'Dans le lien, elle invite à examiner les formes ou les habitudes qui demandent une transformation, sans conclure à une séparation.', projet: 'Pour le projet, elle propose de laisser une méthode ou une forme qui ne sert plus l’objectif.', choix: 'Face au choix, elle invite à regarder ce que vous êtes prêt à laisser pour rendre une autre direction possible.'
    }),
    14: major('la mesure et l’équilibre', 'Tempérance évoque la modération : elle invite à doser votre réponse et à chercher un équilibre qui puisse être entretenu.', 'les ajustements et la place que vous avez donnée à la mesure', 'une recherche de compromis qui reporte indéfiniment une décision nécessaire', 'choisissez un ajustement mesuré et observez ce qu’il change', 'un équilibre plus soutenable pourra se construire progressivement', 'ajuster une habitude sans tout changer à la fois', {
      finances: 'Pour vos finances, elle propose de chercher un rythme et une organisation compatibles avec vos besoins et vos moyens.', travail: 'Au travail, elle invite à regarder la répartition de l’effort et les ajustements qui rendent le rythme soutenable.', relation: 'Dans le lien, elle propose un échange mesuré qui permet à chacun d’exprimer ses besoins sans occuper toute la place.', projet: 'Pour le projet, elle invite à doser l’effort et à ajuster les étapes aux moyens disponibles.', choix: 'Face au choix, elle propose de chercher un équilibre sans effacer les différences réelles entre vos options.'
    }),
    15: major('les attachements et les tentations qui limitent votre liberté', 'Le Diable évoque les tentations, les dépendances et les liens qui entravent : il invite à regarder ce qui exerce une emprise sur vos choix.', 'les attirances ou les attentes dont vous pouvez examiner l’influence', 'un attachement qui réduit votre marge de choix ou une tentation que vous ne questionnez plus', 'nommez l’attrait en jeu et la limite qui protégerait votre liberté de décider', 'une marge de choix pourra être retrouvée en rendant cet attachement plus visible', 'identifier une pression, une tentation ou une habitude et poser une limite claire', {
      finances: 'Pour vos finances, il invite à interroger les envies, les pressions ou les habitudes liées à l’argent, sans conclure que vous avez une dépendance.', travail: 'Au travail, il propose de regarder les attentes ou les liens qui réduisent votre liberté d’agir.', relation: 'Dans le lien, il invite à examiner les attachements et les rapports de pouvoir sans attribuer automatiquement une intention à l’autre.', projet: 'Pour le projet, il questionne ce qui vous attire et les concessions que cette attraction pourrait vous faire accepter.', choix: 'Face au choix, il invite à distinguer une préférence libre d’une pression ou d’un attrait qui prend toute la place.'
    }),
    16: major('une remise en question qui révèle les fondations', 'La Maison Dieu évoque le bouleversement, la révélation et la déconstruction : elle invite à regarder ce qu’un constat nouveau oblige à revoir.', 'les certitudes examinées et la façon dont vous avez reçu une remise en question', 'le rejet d’une information dérangeante ou la volonté de tout défaire à partir d’un seul constat', 'vérifiez ce qui est remis en question puis distinguez ce qui tient encore', 'une base plus lucide pourra être reconstruite à partir de ce qui aura été vérifié', 'revoir une hypothèse fragile et préserver les appuis qui restent solides', {
      finances: 'Pour vos finances, elle propose de vérifier les hypothèses sur lesquelles repose votre organisation, sans annoncer un accident ni une ruine.', travail: 'Au travail, elle invite à examiner ce qu’une remise en question révèle sur les attentes ou le fonctionnement actuel.', relation: 'Dans le lien, elle suggère de regarder ce qu’une prise de conscience change dans votre compréhension, sans prédire une rupture.', projet: 'Pour le projet, elle propose de tester les fondations et de revoir une hypothèse avant de construire davantage dessus.', choix: 'Face au choix, elle invite à reconsidérer une certitude lorsque les faits ne la soutiennent plus.'
    }),
    17: major('l’espoir et une orientation inspirante', 'L’Étoile évoque l’espoir, l’inspiration et l’orientation : elle propose de reconnaître une direction qui vous donne envie d’avancer.', 'les espoirs et les aspirations qui ont orienté vos attentes', 'un espoir laissé sans appui concret ou une attente idéalisée', 'reliez une aspiration à un petit pas observable', 'une direction porteuse de sens pourra être entretenue par des gestes concrets', 'formuler ce que vous espérez et le relier à un geste à votre portée', {
      finances: 'Pour vos finances, elle invite à nommer ce que vous espérez construire et à le rapprocher des ressources réellement disponibles.', travail: 'Au travail, elle donne une place à la direction qui vous inspire et au sens que vous souhaitez donner à votre activité.', relation: 'Dans le lien, elle invite à exprimer un espoir tout en restant attentif à ce qui est partagé concrètement.', projet: 'Pour le projet, elle propose de retrouver le fil qui vous inspire et de lui donner une traduction réalisable.', choix: 'Face au choix, elle invite à regarder l’option qui nourrit vos aspirations sans la soustraire aux faits.'
    }),
    18: major('le ressenti et la distinction entre intuition et apparence', 'La Lune évoque les rêves, l’intuition et les illusions : elle invite à accueillir une impression sans la prendre immédiatement pour une certitude.', 'les émotions, les images et les impressions qui ont accompagné votre compréhension', 'une inquiétude ou une apparence considérée comme la preuve de ce qui va se produire', 'distinguez un fait, une impression et ce qui reste à vérifier', 'une compréhension plus nuancée pourra apparaître lorsque les impressions seront confrontées aux faits', 'nommer une impression puis chercher les éléments qui permettent de la vérifier', {
      finances: 'Pour vos finances, elle invite à distinguer votre sentiment de sécurité ou d’inquiétude de la situation que montrent les éléments concrets.', travail: 'Au travail, elle propose de séparer les informations explicites des impressions sur les intentions ou l’avenir.', relation: 'Dans le lien, elle invite à écouter vos émotions sans conclure aux intentions de l’autre à partir d’une impression.', projet: 'Pour le projet, elle éclaire l’imaginaire qui le nourrit et les hypothèses qui demandent encore une vérification.', choix: 'Face au choix, elle invite à distinguer l’attrait d’une image, une crainte et les faits disponibles.'
    }),
    19: major('la clarté et ce qui peut être reconnu comme satisfaisant', 'Le Soleil évoque la joie, la réussite et la clarté : il invite à regarder ce qui devient compréhensible et ce qui peut être apprécié.', 'les repères clairs et les expériences satisfaisantes auxquels vous vous référez', 'l’optimisme qui fait oublier les limites ou les points encore peu clairs', 'reconnaissez ce qui fonctionne et rendez explicite ce qui doit être compris', 'une direction plus claire pourra vous aider à reconnaître une progression satisfaisante', 'identifier un élément qui fonctionne et un point à rendre plus clair', {
      finances: 'Pour vos finances, il invite à rendre votre organisation lisible et à définir ce qui représenterait une amélioration satisfaisante, sans promettre de richesse.', travail: 'Au travail, il propose de reconnaître ce qui fonctionne et de clarifier les objectifs ou les attentes partagées.', relation: 'Dans le lien, il invite à rechercher une expression simple et une compréhension réciproque.', projet: 'Pour le projet, il propose de rendre visible ce qui a été accompli et de préciser ce que vous considéreriez comme une réussite.', choix: 'Face au choix, il invite à rechercher l’option dont les raisons et les conséquences peuvent être expliquées clairement.'
    }),
    20: major('une prise de conscience qui ouvre une nouvelle étape', 'Le Jugement évoque l’éveil, la révélation et un nouveau départ : il invite à reconnaître ce qu’une compréhension nouvelle peut changer.', 'les prises de conscience et les conclusions que vous en avez tirées', 'une conclusion prise trop vite pour une réponse définitive', 'formulez ce que vous comprenez autrement et vérifiez la suite que cela appelle', 'une nouvelle étape pourra être envisagée à partir de cette compréhension', 'transformer une prise de conscience en une décision ou une démarche précise', {
      finances: 'Pour vos finances, il propose de reconnaître une habitude ou un besoin plus clairement et d’examiner ce que cette compréhension vous invite à revoir.', travail: 'Au travail, il éclaire un bilan qui pourrait modifier votre manière d’envisager la prochaine étape.', relation: 'Dans le lien, il invite à mettre des mots sur ce que vous comprenez maintenant sans supposer que l’autre partage déjà ce constat.', projet: 'Pour le projet, il propose de tirer une conclusion de ce qui a été appris et de définir ce qu’elle change dans la suite.', choix: 'Face au choix, il invite à reconnaître le critère devenu plus clair et à examiner ses conséquences.'
    }),
    21: major('l’accomplissement et la cohérence de l’ensemble', 'Le Monde évoque l’accomplissement, l’intégration et la plénitude : il invite à regarder comment les différentes parties trouvent leur place dans un ensemble.', 'les objectifs d’accomplissement et les éléments que vous avez cherché à réunir', 'l’exigence d’un ensemble parfait qui empêche de reconnaître ce qui est déjà accompli', 'faites le bilan de l’ensemble et reconnaissez une étape suffisamment accomplie', 'un sentiment d’aboutissement pourra se construire à partir d’un ensemble devenu plus cohérent', 'regarder l’ensemble, reconnaître vos acquis et définir la place de la suite', {
      finances: 'Pour vos finances, il invite à rechercher une cohérence entre vos ressources, vos besoins et vos objectifs, plutôt qu’un résultat isolé.', travail: 'Au travail, il propose de regarder la place de votre activité dans l’ensemble de votre vie et les compétences que vous avez intégrées.', relation: 'Dans le lien, il invite à examiner la place de la relation dans votre vie et la manière dont chacun peut y trouver sa place.', projet: 'Pour le projet, il propose un bilan d’ensemble et une définition claire de ce qui peut être considéré comme abouti.', choix: 'Face au choix, il invite à regarder l’accord entre une option et l’ensemble de vos priorités.'
    })
  };

  function profileFor(card) {
    if (!card || card.coverage === 'missing') return null;
    const symbol=card.definitionParagraphs?.[0];
    if (card.family === 'Majeurs' || /^major-/.test(String(card.id))) {
      const profile=majors[Number(card.number)];
      return profile ? Object.assign({},profile,symbol?{symbol}:{}):null;
    }
    const family = String(card.id || '').split('-')[0];
    if(card.reading&&familyBridges[family])return {
      ...card.reading, family, bridges:familyBridges[family], symbol:symbol||card.meaning,
      past:'les expériences et les habitudes qui éclairent cette dynamique',
      condition:'essayez cette piste à votre rythme et regardez ce qu’elle change concrètement',
      promise:'une prochaine étape pourra se préciser à partir de ce que vous aurez observé'
    };
    const rank = ranks[Number(card.number)];
    if (!rank || !familyBridges[family]) return null;
    return Object.assign({}, rank, { bridges: familyBridges[family], family: family });
  }

  function actionFor(profile, context) {
    const order = ['finances', 'travail', 'relation', 'projet', 'choix', 'general'];
    return profile.actions ? profile.actions[order.indexOf(context.key)] : profile.action + ' pour ' + context.area;
  }

  function mixedContext(context) {
    const second = context.secondary;
    if (context.key === 'finances' && second.indexOf('relation') !== -1) {
      return 'Puisque votre question touche aussi aux liens personnels, cette réflexion peut porter sur la manière de parler des besoins et des attentes d’argent avec les personnes concernées.';
    }
    if (context.key === 'relation' && second.indexOf('finances') !== -1) {
      return 'La dimension financière de votre question demande aussi de rendre explicites les moyens, les besoins et les attentes matérielles de chacun.';
    }
    if (context.key === 'travail' && second.indexOf('finances') !== -1) {
      return 'La dimension financière de votre question invite aussi à vérifier comment vos moyens et vos attentes de rémunération s’accordent avec cette direction professionnelle.';
    }
    if (context.key === 'projet' && second.indexOf('finances') !== -1) {
      return 'La dimension financière du projet demande aussi de confronter vos intentions aux moyens et aux engagements concrets qu’il mobilise.';
    }
    if (context.key !== 'choix' && second.indexOf('choix') !== -1) {
      return 'Comme votre question comporte un choix, cette piste peut servir à préciser un critère de décision plutôt qu’à décider à votre place.';
    }
    if (context.key === 'finances' && second.indexOf('travail') !== -1) {
      return 'Le lien avec le travail invite aussi à tenir compte de vos conditions professionnelles et des engagements qu’une décision d’argent pourrait demander.';
    }
    if (context.key === 'travail' && second.indexOf('projet') !== -1) {
      return 'Votre projet demande aussi de distinguer l’élan personnel des conditions concrètes d’une prochaine étape professionnelle.';
    }
    const other = second.find(function (key) { return key !== 'choix'; });
    return other ? 'Comme votre question concerne aussi ' + contexts[other].area + ', la piste proposée invite également à ' + contexts[other].step + '.' : '';
  }

  function positionKey(position) {
    const title = position && typeof position === 'object' ? position.title : position;
    const value = normalize(title);
    if (/^passe$/.test(value)) return 'past';
    if (/^present$/.test(value)) return 'present';
    if (/^avenir$/.test(value)) return 'future';
    if (/^probleme$/.test(value)) return 'problem';
    if (/^solution$/.test(value)) return 'solution';
    if (/^obstacle$/.test(value)) return 'obstacle';
    if (/^aide$/.test(value)) return 'help';
    if (/^resultat$/.test(value)) return 'result';
    if (/^conseil$/.test(value)) return 'advice';
    if (/^synthese$/.test(value)) return 'summary';
    return 'situation';
  }

  function subject(context) {
    return context.question ? 'À propos de votre question « ' + context.question + ' »' : 'Pour une lecture ouverte de votre situation';
  }

  function cardName(card) {
    const name = card && card.name ? String(card.name) : 'cette carte';
    if (/^(Le |La |L[’'])/.test(name)) return name.charAt(0).toLowerCase() + name.slice(1);
    if (/^Reine\b/.test(name)) return 'la ' + name;
    if (/^As\b/.test(name)) return 'l’' + name;
    if (/^(Deux|Trois|Quatre|Cinq|Six|Sept|Huit|Neuf|Dix|Valet|Cavalier|Roi)\b/.test(name)) return 'le ' + name;
    return name;
  }

  function of(value) {
    if (/^(le |la |les |l[’']|un |une )/.test(value)) {
      value = value.replace(/ et la /g, ' et de la ').replace(/ et le /g, ' et du ').replace(/ et les /g, ' et des ').replace(/ et l’/g, ' et de l’').replace(/ et une /g, ' et d’une ').replace(/ et un /g, ' et d’un ').replace(/ et ce qui /g, ' et de ce qui ').replace(/, les /g, ', des ');
    }
    if (/^le /.test(value)) return 'du ' + value.slice(3);
    if (/^les /.test(value)) return 'des ' + value.slice(4);
    return /^[aeiouéèêëàâîïôùûüœæ]/i.test(value) ? 'd’' + value : 'de ' + value;
  }

  function to(value) {
    if(/^le /.test(value))return 'au '+value.slice(3);
    if(/^les /.test(value))return 'aux '+value.slice(4);
    return 'à '+value;
  }

  function interpret(card, positionTitle, question, answers) {
    const context = detectContext(question, answers);
    const profile = profileFor(card);
    const name = cardName(card);
    const position = positionKey(positionTitle);
    const action = profile ? actionFor(profile, context) : '';
    if (!profile) {
      return {
        theme: context.label,
        paragraphs: [
          subject(context) + ', ' + name + ' apparaît à cette place du tirage, mais sa définition n’est pas vérifiée dans les sources actuellement intégrées. Il serait donc trompeur de lui attribuer ici un sens précis.',
          'Vous pouvez garder cette place comme une question ouverte et examiner ' + context.questions + '. La lecture des autres cartes pourra nourrir votre réflexion sans combler ce manque par une signification inventée.'
        ]
      };
    }

    let opening;
    let development;
    let closing;
    switch (position) {
      case 'past':
        opening = subject(context) + ', ' + name + ' en position de passé invite à relire les influences et les habitudes antérieures à travers ' + profile.lens + '.';
        development = 'Vous pouvez revenir sur ' + profile.past + ' et regarder ce que cela a pu changer dans ' + context.stake + '.';
        closing = 'Cette lecture vous invite à ' + action + ', pour reconnaître une influence ancienne et choisir la place que vous souhaitez lui donner aujourd’hui.';
        break;
      case 'present':
        opening = subject(context) + ', ' + name + ' en position de présent attire l’attention sur ' + profile.lens + ' dans ce que vous vivez maintenant.';
        development = 'Le point à observer est la place que cette dynamique prend aujourd’hui dans ' + context.stake + ', en restant attentif ' + to(profile.risk) + '.';
        closing = 'Pour rendre cette lecture utile, vous pouvez ' + action + ' puis vérifier ' + context.check + '.';
        break;
      case 'future':
        opening = subject(context) + ', ' + name + ' en position d’avenir propose une direction possible autour ' + of(profile.lens) + ', plutôt qu’un événement annoncé.';
        development = 'Si vous ' + profile.condition + ', ' + profile.promise + '.';
        closing = 'Cette possibilité vous invite à ' + action + ' en tenant compte ' + of(context.check) + '.';
        break;
      case 'problem':
        opening = subject(context) + ', ' + name + ' en position de problème propose d’examiner ' + profile.risk + '.';
        development = 'La difficulté à éclaircir concerne la place que cette dynamique peut prendre dans ' + context.stake + ', et les besoins qu’elle pourrait laisser de côté.';
        closing = 'Pour préciser le problème, commencez par ' + action + ' et regardez ce qui demeure contradictoire ou peu clair.';
        break;
      case 'obstacle':
        opening = subject(context) + ', ' + name + ' en position d’obstacle attire l’attention sur ' + profile.risk + '.';
        development = 'Ce frein symbolique demande à être confronté à votre situation : regardez s’il réduit votre capacité à ' + context.step + '.';
        closing = 'Une manière de l’examiner est ' + of(action) + ', en distinguant une limite réelle d’une habitude que vous pouvez ajuster.';
        break;
      case 'solution':
        opening = subject(context) + ', ' + name + ' en position de solution propose ' + of(action) + '.';
        development = 'La piste consiste à utiliser ' + profile.lens + ' pour éclairer ' + context.stake + ', plutôt qu’à attendre que la situation se règle seule.';
        closing = 'Vous pouvez traduire cette piste en un petit geste : ' + context.step + ', puis observer s’il répond à votre besoin.';
        break;
      case 'advice':
        opening = subject(context) + ', ' + name + ' en position de conseil vous invite à ' + action + '.';
        development = 'Pour garder ce conseil à votre portée, prenez comme repère ' + context.check + ' et restez attentif ' + to(profile.risk) + '.';
        closing = 'L’idée est d’essayer une réponse réfléchie, puis de l’ajuster à ce que vous observez, en vous appuyant sur ' + profile.lens + '.';
        break;
      case 'help':
        opening = subject(context) + ', ' + name + ' en position d’aide met en avant une ressource : ' + profile.lens + '.';
        development = 'Cet appui peut servir si vous ' + profile.condition + ', tout en vérifiant ' + context.check + '.';
        closing = 'Pour le mobiliser, vous pouvez ' + action + ' ; cette aide reste une capacité à cultiver, sans supposer qu’une personne ou un événement viendra tout résoudre.';
        break;
      case 'result':
        opening = subject(context) + ', ' + name + ' en position de résultat décrit un aboutissement envisageable autour ' + of(profile.lens) + '.';
        development = 'Si vous ' + profile.condition + ', ' + profile.promise + ' ; cela donne une direction à construire, sans garantir un résultat.';
        closing = 'Pour savoir ce que cet aboutissement signifierait pour vous, vous pouvez ' + action + ' en vous référant ' + to(context.check) + '.';
        break;
      case 'summary':
        opening = subject(context) + ', ' + name + ' en position de synthèse propose de relier les autres cartes par ' + profile.lens + '.';
        development = 'Ce fil peut aider à rapprocher vos attentes, vos difficultés et vos ressources dans ' + context.stake + ', sans effacer leurs différences.';
        closing = 'La question à garder est la façon ' + of(action) + ' tout en restant attentif ' + to(profile.risk) + '.';
        break;
      default:
        opening = subject(context) + ', ' + name + ' en position de situation propose de regarder ' + context.stake + ' à travers ' + profile.lens + '.';
        development = 'Cette image peut aider à nommer ce qui compte pour vous, tout en confrontant votre impression ' + to(context.check) + '.';
        closing = 'Pour préciser ce tableau, vous pouvez ' + action + ' et regarder la place que prend ' + profile.risk + '.';
    }
    opening = opening.replace(/en position (?:de |d’)(passé|présent|avenir|problème|solution|obstacle|conseil|aide|résultat|synthèse|situation)/, function (whole, label) {
      return 'en position « ' + label.charAt(0).toUpperCase() + label.slice(1) + ' »';
    });
    const personal=window.TAROT_PERSONAL?.develop(card,profile,context,position,action);
    if(personal){development=personal.development;closing=personal.closing;}
    const bridge = profile.bridges[context.key] || 'Pour cette question, cette image invite à examiner ' + context.questions + ' en gardant votre propre expérience comme repère.';
    const extra = mixedContext(context);
    return {
      theme: context.label,
      paragraphs: [opening + ' ' + profile.symbol, bridge + ' ' + development + ' ' + closing + (extra ? ' ' + extra : '')]
    };
  }

  function synthesize(cards, positions, question, answers) {
    const context = detectContext(question, answers);
    const entries = (Array.isArray(cards) ? cards : []).map(function (card, index) {
      const profile = profileFor(card);
      return { card: card, profile: profile, position: positionKey((positions || [])[index]) };
    });
    const usable = entries.filter(function (entry) { return entry.profile; });
    if (!usable.length) {
      return ['Les cartes de ce tirage ne disposent pas de définitions vérifiées permettant une synthèse. Vous pouvez garder votre question ouverte et examiner ' + context.questions + ' sans attribuer à ces cartes un sens inventé.'];
    }
    function find(position) { return usable.find(function (entry) { return entry.position === position; }); }
    function named(entry) { return cardName(entry.card); }
    const past = find('past');
    const present = find('present');
    const future = find('future');
    const problem = find('problem');
    const solution = find('solution');
    const situation = find('situation');
    const obstacle = find('obstacle');
    const help = find('help');
    const result = find('result');
    const advice = find('advice');
    const summary = find('summary');
    const paragraphs = [];

    if (problem && solution) {
      paragraphs.push('Pour ' + context.area + ', le tirage rapproche une difficulté à examiner et une réponse à essayer : ' + named(problem) + ' invite à regarder ' + problem.profile.risk + ', tandis que ' + named(solution) + ' propose ' + of(actionFor(solution.profile, context)) + '. Le passage de l’une à l’autre consiste à reconnaître le frein sans le considérer comme inévitable, puis à vérifier si cette piste répond à votre besoin réel.');
    } else if (past && present) {
      paragraphs.push('Pour ' + context.area + ', ' + named(past) + ' invite à relire ' + past.profile.past + ', alors que ' + named(present) + ' déplace l’attention vers ' + present.profile.lens + ' dans la situation actuelle. Le lien entre ces deux cartes consiste à reconnaître une influence ancienne, puis à vérifier si elle vous aide encore ou si votre réponse doit évoluer.');
      if (future) paragraphs.push('Dans cette continuité, ' + named(future) + ' ouvre une direction possible : si vous ' + future.profile.condition + ', ' + future.profile.promise + '. Cette perspective se confronte ' + to(context.check) + ', plutôt que d’annoncer ce qui arrivera.');
    } else if (situation && obstacle) {
      let first = 'Pour ' + context.area + ', ' + named(situation) + ' donne un angle de lecture autour ' + of(situation.profile.lens) + ', puis ' + named(obstacle) + ' invite à examiner ' + obstacle.profile.risk + '.';
      if (help) first += ' L’aide de ' + named(help) + ' propose de répondre à ce frein en cherchant à ' + actionFor(help.profile, context) + ', après avoir vérifié que cela correspond à votre situation.';
      paragraphs.push(first);
      if (result) paragraphs.push('Le résultat représenté par ' + named(result) + ' reste une direction à construire : si vous ' + result.profile.condition + ', ' + result.profile.promise + '. Vous pouvez apprécier cette direction en examinant ' + context.check + '.');
    } else {
      const first = usable[0];
      const last = usable[usable.length - 1];
      paragraphs.push('Pour ' + context.area + ', le tirage invite d’abord à regarder ' + first.profile.lens + ' avec ' + named(first) + '. ' + (first === last ? 'Cette piste peut être rendue concrète en cherchant à ' + actionFor(first.profile, context) : 'La mise en relation avec ' + named(last) + ' propose ensuite ' + of(actionFor(last.profile, context))) + ', en vérifiant comment cette réponse s’accorde avec votre situation.');
    }
    if (advice || summary) {
      let concluding = '';
      if (advice) concluding = 'Le conseil de ' + named(advice) + ' peut traduire ce fil en un geste concret : ' + actionFor(advice.profile, context) + '.';
      if (summary) {
        const summaryName = named(summary);
        concluding += (concluding ? ' ' : '') + summaryName.charAt(0).toUpperCase() + summaryName.slice(1) + ' rassemble la réflexion autour ' + of(summary.profile.lens) + ', en invitant à vérifier la cohérence de vos attentes et de vos moyens.';
      }
      if (concluding) paragraphs.push(concluding);
    }
    const personal=window.TAROT_PERSONAL?.summarize(usable,context,actionFor);
    if(personal)paragraphs.push(personal);
    const mixed = mixedContext(context);
    if (mixed) paragraphs.push(mixed);
    if (usable.length !== entries.length) paragraphs.push('Une carte de ce tirage, dont la définition n’est pas vérifiée, reste hors de cette mise en relation ; sa place demeure une question ouverte.');
    return paragraphs;
  }

  window.TAROT_READING = Object.freeze({ interpret: interpret, synthesize: synthesize, detectContext: detectContext });
}());
