(function (root, factory) {
  'use strict';
  const meanings = factory();
  if (typeof module === 'object' && module.exports) module.exports = meanings;
  else root.ASTRO_MEANINGS = meanings;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // Original plain-language summaries of Astrodienst's symbolic interpretations.
  // Each entry cites its own page; chart calculations are handled separately.
  return {
    elements: {
      Fire: {
        name: 'Feu',
        meaning: 'Le Feu symbolise l’élan qui pousse à essayer, à créer et à se projeter vers une possibilité. Il réunit le Bélier, le Lion et le Sagittaire. Lorsqu’il ressort dans la lecture, il propose de regarder votre manière de démarrer, de partager votre enthousiasme et de mobiliser votre courage. Par exemple, vous pouvez avoir envie de vous lancer avant d’avoir réglé tous les détails. La piste consiste à donner une direction à cet élan, puis à soutenir l’effort après le premier enthousiasme.',
        strengths: 'initiative, enthousiasme et expression créative',
        balance: 'canaliser l’élan sans précipiter les décisions',
        action: 'choisir une initiative et prévoir une étape pour la poursuivre',
        source: { title: 'Astrodienst — Aries, Leo et Sagittarius : le Feu', url: 'https://www.astro.com/astrowiki/en/Aries' }
      },
      Earth: {
        name: 'Terre',
        meaning: 'La Terre symbolise le besoin de donner une forme concrète aux intentions. Elle réunit le Taureau, la Vierge et le Capricorne. Lorsqu’elle ressort dans la lecture, elle propose de regarder votre rapport au temps, aux ressources et à ce qui vous apporte de la stabilité. Par exemple, vous pouvez préférer vérifier les moyens disponibles avant de vous engager. Cette approche aide à construire quelque chose de fiable; elle gagne à garder assez de souplesse pour essayer une solution nouvelle quand les circonstances évoluent.',
        strengths: 'sens pratique, patience et constance',
        balance: 'conserver une base solide sans figer les habitudes',
        action: 'transformer votre intention en une petite tâche réalisable',
        source: { title: 'Astrodienst — Taurus et les signes de Terre', url: 'https://www.astro.com/astrowiki/en/Taurus' }
      },
      Air: {
        name: 'Air',
        meaning: 'L’Air symbolise la compréhension par les idées, les mots et les échanges. Il réunit les Gémeaux, la Balance et le Verseau. Lorsqu’il ressort dans la lecture, il propose de regarder votre manière de poser des questions, de comparer des points de vue et d’entrer en relation. Par exemple, une discussion peut vous aider à clarifier une expérience avant de décider. Cette ouverture gagne à rejoindre le concret : choisir une idée à approfondir et écouter aussi ce que la situation vous fait ressentir.',
        strengths: 'curiosité, dialogue et ouverture des perspectives',
        balance: 'relier les idées au ressenti et à l’action',
        action: 'expliquer une idée puis choisir comment la mettre en pratique',
        source: { title: 'Astrodienst — Gemini et les signes d’Air', url: 'https://www.astro.com/astrowiki/en/Gemini' }
      },
      Water: {
        name: 'Eau',
        meaning: 'L’Eau symbolise la sensibilité, les liens affectifs et la perception de l’ambiance. Elle réunit le Cancer, le Scorpion et les Poissons. Lorsqu’elle ressort dans la lecture, elle propose de regarder ce qui vous touche, ce qui vous rassure et la place que vous donnez à votre monde intérieur. Par exemple, vous pouvez avoir besoin de reconnaître une émotion avant de passer à l’action. Cette écoute gagne à préserver des limites claires et à distinguer votre ressenti de celui que vous attribuez aux autres.',
        strengths: 'écoute, imagination et attention aux liens',
        balance: 'accueillir les émotions sans perdre vos repères',
        action: 'nommer votre émotion et le besoin concret qui l’accompagne',
        source: { title: 'Astrodienst — Cancer et les signes d’Eau', url: 'https://www.astro.com/astrowiki/en/Cancer' }
      }
    },
    planets: {
      Sun: {
        name: 'Soleil', glyph: '☉',
        meaning: 'Le Soleil représente ce qui vous donne le sentiment d’être vous-même : vos choix, votre volonté et ce que vous souhaitez créer. Son signe décrit une manière de vous affirmer; sa maison précise le domaine où cette expression peut prendre forme. Par exemple, il peut éclairer une envie de développer un talent ou de prendre une décision qui vous ressemble.',
        focus: 'l’identité, la confiance et les choix personnels',
        action: 'choisir une priorité qui correspond à vos valeurs',
        transitMeaning: 'Pour la date choisie, le Soleil met symboliquement un sujet en lumière. Ce passage invite à mieux voir ce qui compte et à agir avec davantage de conscience, plutôt qu’à attendre qu’une situation se règle toute seule.',
        source: { title: 'Astrodienst — Sun', url: 'https://www.astro.com/astrowiki/en/Sun' }
      },
      Moon: {
        name: 'Lune', glyph: '☽',
        meaning: 'La Lune représente vos besoins émotionnels, vos habitudes spontanées et ce qui vous rassure. Elle parle de votre façon de recevoir les expériences et de chercher du réconfort. Son signe donne une couleur à cette sensibilité; sa maison montre où elle s’exprime. Elle peut, par exemple, aider à réfléchir à votre besoin de calme, de présence ou de familiarité.',
        focus: 'les émotions, les habitudes et le besoin de sécurité',
        action: 'nommer votre besoin du moment et lui réserver une place',
        transitMeaning: 'La Lune avance rapidement : sa lecture pour la date choisie concerne surtout une ambiance passagère et les besoins du moment. Elle invite à observer votre ressenti sans transformer une émotion brève en conclusion définitive.',
        source: { title: 'Astrodienst — Moon', url: 'https://www.astro.com/astrowiki/en/Moon' }
      },
      Mercury: {
        name: 'Mercure', glyph: '☿',
        meaning: 'Mercure représente la manière de comprendre, d’apprendre et de communiquer. Il parle des questions que vous posez, des liens que vous faites entre les informations et des mots que vous choisissez. Son signe nuance votre style de pensée; sa maison précise le terrain des échanges. Il peut éclairer votre façon de préparer une discussion, de découvrir un sujet ou d’expliquer une idée.',
        focus: 'la compréhension, les échanges et l’apprentissage',
        action: 'formuler votre idée en quelques mots et vérifier sa compréhension',
        transitMeaning: 'Pour la date choisie, Mercure invite à regarder comment une information circule et comment vous la comprenez. Une discussion, une relecture ou une question précise peut aider à éclaircir ce qui était confus jusque-là.',
        source: { title: 'Astrodienst — Mercury', url: 'https://www.astro.com/astrowiki/en/Mercury' }
      },
      Venus: {
        name: 'Vénus', glyph: '♀',
        meaning: 'Vénus représente ce que vous appréciez, ce qui vous attire et votre manière de créer des liens agréables. Elle parle aussi du goût, de la beauté et du plaisir de partager. Son signe décrit une façon d’exprimer cette recherche d’harmonie; sa maison en situe le domaine. Par exemple, elle peut éclairer ce qui vous aide à vous sentir apprécié ou à savourer une activité.',
        focus: 'les affinités, l’harmonie et ce que vous appréciez',
        action: 'faire une place à un échange ou à une activité qui vous plaît',
        transitMeaning: 'Le passage de Vénus suggère de porter attention aux affinités, au plaisir et à la qualité des liens. Il peut servir de point de départ pour apprécier ce qui vous convient et exprimer simplement vos préférences.',
        source: { title: 'Astrodienst — Venus', url: 'https://www.astro.com/astrowiki/en/Venus' }
      },
      Mars: {
        name: 'Mars', glyph: '♂',
        meaning: 'Mars représente l’élan qui vous pousse à agir, à défendre une limite ou à poursuivre un objectif. Son signe décrit une manière de mobiliser cet élan; sa maison montre où vous cherchez à prendre l’initiative. Il peut éclairer votre façon de démarrer une tâche ou de répondre à un désaccord. L’enjeu consiste à donner une direction à cette force plutôt qu’à réagir automatiquement.',
        focus: 'l’action, l’initiative et l’affirmation des limites',
        action: 'transformer votre élan en une étape concrète et mesurée',
        transitMeaning: 'Le passage de Mars met symboliquement l’accent sur l’action et l’affirmation de soi. Il invite à décider où employer votre énergie, puis à distinguer une initiative utile d’une réaction pressée qui risque de compliquer les échanges.',
        source: { title: 'Astrodienst — Mars', url: 'https://www.astro.com//astrowiki/en/Mars' }
      },
      Jupiter: {
        name: 'Jupiter', glyph: '♃',
        meaning: 'Jupiter représente l’envie d’élargir votre horizon et de donner du sens à vos expériences. Il parle de confiance, de découverte et de compréhension d’ensemble. Son signe décrit la manière d’explorer; sa maison en indique le domaine. Cela peut évoquer une envie d’apprendre ou de rencontrer d’autres perspectives. La nuance consiste à garder des attentes réalistes quand l’enthousiasme vous pousse à voir grand.',
        focus: 'la croissance, la confiance et la recherche de sens',
        action: 'explorer une possibilité en vérifiant les moyens nécessaires',
        transitMeaning: 'Pour la date choisie, Jupiter propose un regard plus large sur un sujet. Cette lecture peut encourager l’apprentissage ou l’ouverture à une possibilité, tout en invitant à mesurer les engagements avant de multiplier les promesses.',
        source: { title: 'Astrodienst — Jupiter', url: 'https://www.astro.com/astrowiki/en/Jupiter' }
      },
      Saturn: {
        name: 'Saturne', glyph: '♄',
        meaning: 'Saturne représente les limites, les responsabilités et ce qui se construit avec du temps. Il invite à distinguer l’essentiel du superflu et à donner une structure à vos efforts. Son signe nuance cette recherche de solidité; sa maison en situe le domaine. Il peut éclairer une tâche exigeante ou un engagement durable. La patience aide ici à avancer sans confondre une difficulté avec une incapacité.',
        focus: 'la structure, les limites et les responsabilités',
        action: 'définir une étape réaliste et le temps nécessaire pour la réaliser',
        transitMeaning: 'Le passage de Saturne invite à regarder ce qui demande de la constance et des limites claires. Il peut aider à simplifier vos priorités, à ajuster un engagement et à apprécier les progrès qui se construisent lentement.',
        source: { title: 'Astrodienst — Saturn', url: 'https://www.astro.com//astrowiki/en/Saturn' }
      },
      Uranus: {
        name: 'Uranus', glyph: '♅',
        meaning: 'Uranus représente le besoin de liberté, d’originalité et de changement. Il parle de ce qui vous incite à essayer une autre manière de faire. Sa maison et ses liens avec les autres planètes précisent cette lecture; son signe est partagé par de nombreuses personnes d’une même génération. L’enjeu est d’ouvrir une possibilité nouvelle sans changer uniquement pour rompre avec une habitude.',
        focus: 'la liberté, l’expérimentation et le renouvellement',
        action: 'essayer un changement limité avant de modifier toute votre organisation',
        transitMeaning: 'Le passage d’Uranus invite à examiner les habitudes devenues trop étroites et la place laissée à l’imprévu. Cette lecture peut soutenir une expérimentation, en recherchant une liberté praticable plutôt qu’une rupture décidée dans la précipitation.',
        source: { title: 'Astrodienst — Uranus', url: 'https://www.astro.com/astrowiki/en/Uranus' }
      },
      Neptune: {
        name: 'Neptune', glyph: '♆',
        meaning: 'Neptune représente l’imagination, l’inspiration et la sensibilité à ce qui dépasse les mots. Il parle aussi des idéaux auxquels vous souhaitez vous relier. Sa maison et ses aspects précisent cette lecture, car son signe concerne toute une génération. Il peut éclairer une activité créative ou un besoin de sens. La nuance consiste à distinguer une intuition, une espérance et un fait vérifié.',
        focus: 'l’inspiration, la sensibilité et les idéaux',
        action: 'noter votre intuition puis vérifier ce qui peut l’étayer',
        transitMeaning: 'Le passage de Neptune invite à écouter votre imagination et vos idéaux, tout en clarifiant les attentes imprécises. Il peut nourrir une création ou une réflexion intérieure; les décisions concrètes gagnent à rester appuyées sur des éléments vérifiables.',
        source: { title: 'Astrodienst — Neptune', url: 'https://www.astro.com/astrowiki/en/Neptune' }
      },
      Pluto: {
        name: 'Pluton', glyph: '♇',
        meaning: 'Pluton représente les transformations profondes, le besoin d’aller au fond d’un sujet et la relation au pouvoir. Il invite à regarder ce que vous cherchez à maîtriser et ce que vous pouvez laisser évoluer. Sa maison et ses aspects précisent cette lecture; son signe est générationnel. Il peut éclairer une habitude devenue encombrante, sans annoncer une catastrophe ni imposer un changement brutal.',
        focus: 'la transformation, le contrôle et les attachements',
        action: 'identifier une habitude à faire évoluer par une petite étape choisie',
        transitMeaning: 'Le passage de Pluton invite à examiner un attachement ou une manière de garder le contrôle. Cette lecture parle d’un changement de fond qui demande du temps, en privilégiant des choix conscients et respectueux de vos limites.',
        source: { title: 'Astrodienst — Pluto', url: 'https://www.astro.com/astrowiki/en/Pluto' }
      }
    },
    angles: {
      ascendant: {
        name: 'Ascendant', glyph: 'AC',
        meaning: 'L’Ascendant est le point du zodiaque qui se lève à l’horizon est au moment de la naissance. Dans la lecture, il décrit une manière d’entrer en contact avec le monde, de commencer une expérience et de vous présenter. Il complète le Soleil et la Lune. Son calcul dépend de l’heure et du lieu : une heure incertaine rend cette partie de la lecture moins précise.',
        focus: 'la manière d’aborder le monde et les nouveaux départs',
        action: 'observer votre premier réflexe lorsque vous abordez une situation nouvelle',
        transitMeaning: 'Un passage près de l’Ascendant invite à réfléchir à votre manière d’aborder une situation et de vous rendre visible. Le sens dépend de la planète concernée, et la précision de cette lecture dépend de l’heure de naissance.',
        source: { title: 'Astrodienst — Ascendant', url: 'https://www.astro.com/astrowiki/en/Ascendant' }
      },
      midheaven: {
        name: 'Milieu du ciel', glyph: 'MC',
        meaning: 'Le Milieu du ciel est un repère lié au méridien du lieu de naissance. Dans la lecture, il représente la direction que vous souhaitez donner à votre contribution au monde et à votre vie publique. Il peut éclairer un objectif, une responsabilité ou la manière dont vous souhaitez être reconnu. Il décrit une orientation à explorer, plutôt qu’un métier qui vous serait réservé.',
        focus: 'la direction de vie, la contribution et la reconnaissance',
        action: 'définir ce que vous souhaitez apporter et une étape pour y parvenir',
        transitMeaning: 'Un passage près du Milieu du ciel propose de revoir une direction ou une responsabilité visible. Il invite à rapprocher vos objectifs de la contribution que vous souhaitez apporter, sans décider à votre place de la voie à suivre.',
        source: { title: 'Astrodienst — Medium Coeli', url: 'https://www.astro.com/astrowiki/en/Medium_Coeli' }
      }
    },
    signs: [
      {
        name: 'Bélier', glyph: '♈', element: 'Feu',
        meaning: 'Le Bélier apporte une expression directe, spontanée et tournée vers le commencement. Il évoque l’envie d’essayer, de prendre une initiative et d’avancer sans attendre que tout soit parfait. Son élan gagne à être accompagné d’un temps de réflexion, afin qu’un départ rapide puisse devenir une action suivie.',
        style: 'avec élan et franchise', balance: 'ralentir pour mesurer les conséquences avant d’agir',
        source: { title: 'Astrodienst — Aries', url: 'https://www.astro.com/astrowiki/en/Aries' }
      },
      {
        name: 'Taureau', glyph: '♉', element: 'Terre',
        meaning: 'Le Taureau apporte une expression stable, concrète et attentive aux sensations. Il évoque le besoin de prendre son temps, de savourer et de bâtir quelque chose de fiable. Cette recherche de sécurité peut soutenir la persévérance; elle demande aussi de laisser évoluer une habitude quand la situation a changé.',
        style: 'avec patience et sens du concret', balance: 'garder vos repères tout en essayant un petit changement',
        source: { title: 'Astrodienst — Taurus', url: 'https://www.astro.com/astrowiki/en/Taurus' }
      },
      {
        name: 'Gémeaux', glyph: '♊', element: 'Air',
        meaning: 'Les Gémeaux apportent une expression curieuse, mobile et tournée vers les échanges. Ils évoquent l’envie de comprendre, de comparer et de découvrir plusieurs points de vue. Cette souplesse aide à apprendre et à faire circuler les idées. La nuance consiste à approfondir un sujet avant de passer aussitôt au suivant.',
        style: 'avec curiosité et souplesse', balance: 'choisir un sujet à approfondir avant de vous disperser',
        source: { title: 'Astrodienst — Gemini', url: 'https://www.astro.com/astrowiki/en/Gemini' }
      },
      {
        name: 'Cancer', glyph: '♋', element: 'Eau',
        meaning: 'Le Cancer apporte une expression sensible, protectrice et attentive aux liens familiers. Il évoque le besoin de se sentir en sécurité et de prendre soin de ce qui compte. Cette réceptivité aide à reconnaître les émotions. Elle gagne à être accompagnée de limites pour accueillir un ressenti sans absorber toute l’ambiance environnante.',
        style: 'avec sensibilité et attention aux liens', balance: 'exprimer votre besoin tout en respectant celui des autres',
        source: { title: 'Astrodienst — Cancer', url: 'https://www.astro.com/astrowiki/en/Cancer' }
      },
      {
        name: 'Lion', glyph: '♌', element: 'Feu',
        meaning: 'Le Lion apporte une expression chaleureuse, créative et désireuse de prendre sa place. Il évoque le plaisir de donner forme à un talent et de partager ce qui vous anime. Cette force peut encourager la confiance et la générosité. Elle demande aussi de laisser de la place aux autres et à leurs contributions.',
        style: 'avec chaleur et créativité', balance: 'partager votre expression sans dépendre uniquement des compliments',
        source: { title: 'Astrodienst — Leo', url: 'https://www.astro.com/astrowiki/en/Leo' }
      },
      {
        name: 'Vierge', glyph: '♍', element: 'Terre',
        meaning: 'La Vierge apporte une expression attentive, pratique et soucieuse d’améliorer ce qui existe. Elle évoque l’observation des détails, l’organisation et le plaisir de rendre un service utile. Cette précision aide à ajuster une méthode. La nuance consiste à garder une vue d’ensemble et à accepter qu’un résultat utile puisse être imparfait.',
        style: 'avec précision et sens pratique', balance: 'améliorer un détail sans perdre de vue l’objectif d’ensemble',
        source: { title: 'Astrodienst — Virgo', url: 'https://www.astro.com/astrowiki/en/Virgo' }
      },
      {
        name: 'Balance', glyph: '♎', element: 'Air',
        meaning: 'La Balance apporte une expression diplomate, réfléchie et attentive à l’équilibre entre les points de vue. Elle évoque l’envie de comprendre l’autre et de trouver un accord juste. Cette recherche d’harmonie facilite les échanges. Elle gagne à ne pas reporter indéfiniment une décision lorsque vos propres besoins demandent à être exprimés.',
        style: 'avec diplomatie et recherche d’équilibre', balance: 'écouter les autres puis formuler clairement votre propre choix',
        source: { title: 'Astrodienst — Libra', url: 'https://www.astro.com/astrowiki/en/Libra' }
      },
      {
        name: 'Scorpion', glyph: '♏', element: 'Eau',
        meaning: 'Le Scorpion apporte une expression intense, profonde et attentive à ce qui se cache derrière les apparences. Il évoque l’envie de comprendre les motivations et de transformer une situation en allant au fond du sujet. Cette profondeur gagne à laisser une place à la confiance, sans vouloir maîtriser chaque réaction des autres.',
        style: 'avec intensité et recherche de profondeur', balance: 'poser une question ouverte plutôt que supposer une intention cachée',
        source: { title: 'Astrodienst — Scorpio', url: 'https://www.astro.com/astrowiki/en/Scorpio' }
      },
      {
        name: 'Sagittaire', glyph: '♐', element: 'Feu',
        meaning: 'Le Sagittaire apporte une expression enthousiaste, exploratrice et tournée vers le sens des expériences. Il évoque l’envie d’élargir votre horizon, d’apprendre et de relier les idées dans une vision d’ensemble. Cet élan peut inspirer. La nuance consiste à vérifier les détails et à laisser de la place aux convictions différentes des vôtres.',
        style: 'avec enthousiasme et ouverture', balance: 'relier votre vision à des faits et à une étape réalisable',
        source: { title: 'Astrodienst — Sagittarius', url: 'https://www.astro.com/astrowiki/en/Sagittarius' }
      },
      {
        name: 'Capricorne', glyph: '♑', element: 'Terre',
        meaning: 'Le Capricorne apporte une expression persévérante, responsable et attentive à ce qui dure. Il évoque l’envie de bâtir une structure fiable et d’assumer votre place dans un ensemble. Cette constance aide à avancer vers un objectif. Elle gagne à conserver de la souplesse lorsque les règles ou les habitudes ne servent plus la situation.',
        style: 'avec constance et sens des responsabilités', balance: 'avancer régulièrement en gardant une place au repos et à l’adaptation',
        source: { title: 'Astrodienst — Capricorn', url: 'https://www.astro.com/astrowiki/en/Capricorn' }
      },
      {
        name: 'Verseau', glyph: '♒', element: 'Air',
        meaning: 'Le Verseau apporte une expression originale, indépendante et attentive aux idées collectives. Il évoque le plaisir d’expérimenter une autre manière de faire ou de contribuer à un groupe. Cette liberté peut renouveler une perspective. Elle gagne à rester reliée aux besoins concrets des personnes, plutôt qu’à une idée défendue uniquement par principe.',
        style: 'avec indépendance et goût de l’expérimentation', balance: 'tester votre idée en écoutant son effet concret sur les autres',
        source: { title: 'Astrodienst — Aquarius', url: 'https://www.astro.com/astrowiki/en/aquarius' }
      },
      {
        name: 'Poissons', glyph: '♓', element: 'Eau',
        meaning: 'Les Poissons apportent une expression sensible, imaginative et réceptive à ce qui relie les êtres. Ils évoquent l’empathie, la créativité et le besoin de donner une place au monde intérieur. Cette ouverture gagne à s’appuyer sur des repères simples, afin de distinguer ce que vous ressentez de ce que vous pouvez vérifier ou accepter.',
        style: 'avec imagination et réceptivité', balance: 'accueillir votre ressenti tout en gardant des limites claires',
        source: { title: 'Astrodienst — Pisces', url: 'https://www.astro.com/astrowiki/en/Pisces' }
      }
    ],
    houses: [
      {
        number: 1, name: 'Présence et nouveaux départs',
        meaning: 'La maison 1 concerne la manière de vous présenter, de prendre votre place et de commencer une expérience. Elle peut éclairer votre premier réflexe devant une nouveauté : avancer, observer ou chercher un repère avant d’entrer en contact.',
        focus: 'votre présence et votre manière de commencer',
        source: { title: 'Astrodienst — House One', url: 'https://www.astro.com/astrowiki/en/1st_House' }
      },
      {
        number: 2, name: 'Valeurs et ressources personnelles',
        meaning: 'La maison 2 concerne ce qui vous donne une base solide : vos ressources, vos talents et ce à quoi vous accordez de la valeur. Elle invite à réfléchir à ce que vous possédez, développez ou souhaitez préserver pour vous sentir plus stable.',
        focus: 'vos valeurs, vos talents et vos ressources',
        source: { title: 'Astrodienst — House Two', url: 'https://www.astro.com/astrowiki/en/House_Two' }
      },
      {
        number: 3, name: 'Échanges et apprentissages quotidiens',
        meaning: 'La maison 3 concerne les échanges de proximité, l’apprentissage et les déplacements du quotidien. Elle peut éclairer une conversation avec votre entourage, une nouvelle information à comprendre ou la manière dont vous expliquez vos idées dans les situations ordinaires.',
        focus: 'vos échanges et vos apprentissages de proximité',
        source: { title: 'Astrodienst — House Three', url: 'https://www.astro.com/astrowiki/en/House_Three' }
      },
      {
        number: 4, name: 'Racines et vie privée',
        meaning: 'La maison 4 concerne le foyer, les racines et ce qui vous donne le sentiment d’être chez vous. Elle invite à regarder votre espace privé, les repères hérités de votre histoire et ce dont vous avez besoin pour vous sentir intérieurement en sécurité.',
        focus: 'vos racines, votre foyer et vos repères intérieurs',
        source: { title: 'Astrodienst — House Four', url: 'https://www.astro.com/astrowiki/en/House_Four' }
      },
      {
        number: 5, name: 'Créativité et plaisir',
        meaning: 'La maison 5 concerne le plaisir de créer, de jouer et d’exprimer ce qui vous anime. Elle peut éclairer une activité artistique, un loisir ou l’envie de partager un talent. Elle invite à vous demander ce que vous faites simplement par plaisir.',
        focus: 'votre créativité, vos loisirs et votre expression personnelle',
        source: { title: 'Astrodienst — House Five', url: 'https://www.astro.com/astrowiki/en/House_Five' }
      },
      {
        number: 6, name: 'Habitudes et organisation quotidienne',
        meaning: 'La maison 6 concerne les habitudes, les tâches régulières et la manière de vous adapter aux contraintes concrètes. Elle peut éclairer votre organisation, le service rendu aux autres ou l’équilibre de votre rythme quotidien. Elle invite à chercher un ajustement utile et praticable.',
        focus: 'vos habitudes, vos tâches et votre rythme quotidien',
        source: { title: 'Astrodienst — House Six', url: 'https://www.astro.com/astrowiki/en/6th_house' }
      },
      {
        number: 7, name: 'Relations et accords',
        meaning: 'La maison 7 concerne les relations dans lesquelles vous vous engagez face à une autre personne. Elle peut éclairer une coopération, un accord ou une différence à négocier. Elle invite à réfléchir à ce que vous attendez de l’autre et à ce que vous apportez.',
        focus: 'vos relations, vos coopérations et vos accords',
        source: { title: 'Astrodienst — House Seven', url: 'https://www.astro.com/astrowiki/en/House_Seven' }
      },
      {
        number: 8, name: 'Partage et transformation',
        meaning: 'La maison 8 concerne les liens profonds, les ressources partagées et les changements qui touchent vos attachements. Elle peut éclairer un besoin de clarifier ce qui appartient à chacun ou de laisser évoluer une habitude. Elle parle de transformation, sans annoncer un décès.',
        focus: 'vos attachements, vos partages et les changements de fond',
        source: { title: 'Astrodienst — House Eight', url: 'https://www.astro.com/astrowiki/en/House_Eight' }
      },
      {
        number: 9, name: 'Horizons et recherche de sens',
        meaning: 'La maison 9 concerne l’ouverture à des horizons plus larges : études, cultures, voyages et convictions. Elle peut éclairer une envie d’apprendre autrement ou de revoir votre vision d’ensemble. Elle invite à chercher du sens en découvrant des perspectives encore peu familières.',
        focus: 'vos horizons, vos convictions et votre recherche de sens',
        source: { title: 'Astrodienst — House Nine', url: 'https://www.astro.com/astrowiki/en/House_Nine' }
      },
      {
        number: 10, name: 'Direction et contribution publique',
        meaning: 'La maison 10 concerne votre place visible dans la société, vos responsabilités et les objectifs que vous poursuivez. Elle peut éclairer la contribution que vous souhaitez apporter et la reconnaissance recherchée. Elle invite à relier vos ambitions à une direction qui vous convient.',
        focus: 'votre direction, vos responsabilités et votre contribution',
        source: { title: 'Astrodienst — House Ten', url: 'https://www.astro.com/astrowiki/en/House_Ten' }
      },
      {
        number: 11, name: 'Amis et projets collectifs',
        meaning: 'La maison 11 concerne les amitiés, les groupes et les espoirs que vous partagez avec d’autres. Elle peut éclairer une envie de rejoindre un collectif ou de soutenir un projet commun. Elle invite à regarder les liens qui encouragent votre participation et vos aspirations.',
        focus: 'vos amitiés, vos groupes et vos aspirations partagées',
        source: { title: 'Astrodienst — House Eleven', url: 'https://www.astro.com/astrowiki/en/House_Eleven' }
      },
      {
        number: 12, name: 'Recul et monde intérieur',
        meaning: 'La maison 12 concerne le recul, le repos et la vie intérieure qui échappe au bruit quotidien. Elle peut éclairer un besoin de solitude choisie, de rêve ou de méditation. Elle invite à reconnaître ce qui demande du silence pour être mieux compris.',
        focus: 'votre besoin de recul, de repos et d’écoute intérieure',
        source: { title: 'Astrodienst — House Twelve', url: 'https://www.astro.com/astrowiki/en/House_Twelve' }
      }
    ],
    aspects: [
      {
        angle: 0, name: 'Conjonction',
        meaning: 'Une conjonction rapproche deux planètes sur la roue : leurs thèmes se rencontrent et deviennent difficiles à séparer. Ce lien peut renforcer une intention commune ou mélanger deux besoins différents. Il invite à comprendre comment ces deux fonctions agissent ensemble, plutôt qu’à classer automatiquement leur rencontre comme favorable ou défavorable.',
        bridge: 'met ces deux thèmes au premier plan ensemble',
        action: 'nommer les deux besoins et chercher une façon de les réunir',
        source: { title: 'Astrodienst — Conjunction', url: 'https://www.astro.com/astrowiki/en/Conjunction' }
      },
      {
        angle: 60, name: 'Sextile',
        meaning: 'Un sextile relie deux planètes séparées d’environ 60 degrés. Il évoque une possibilité de coopération entre leurs thèmes, avec une invitation à participer activement. Une facilité peut rester inutilisée si vous attendez seulement qu’elle se manifeste. Le symbole encourage donc à essayer une démarche simple pour donner une forme à cette possibilité.',
        bridge: 'propose une coopération à mettre en pratique',
        action: 'faire un premier essai concret pour développer cette possibilité',
        source: { title: 'Astrodienst — Sextile', url: 'https://www.astro.com/astrowiki/en/Sextile' }
      },
      {
        angle: 90, name: 'Carré',
        meaning: 'Un carré relie deux planètes séparées d’environ 90 degrés. Il évoque une tension entre deux façons de répondre à une situation. Cette friction peut demander un ajustement, un effort ou une décision plus consciente. Elle ne signifie pas un échec : elle sert à repérer ce qui doit être travaillé pour avancer avec plus de cohérence.',
        bridge: 'met en tension ces deux besoins et demande un ajustement',
        action: 'repérer le point de friction puis essayer un ajustement mesuré',
        source: { title: 'Astrodienst — Square', url: 'https://www.astro.com/astrowiki/en/Square' }
      },
      {
        angle: 120, name: 'Trigone',
        meaning: 'Un trigone relie deux planètes séparées d’environ 120 degrés. Il évoque une circulation plus facile entre leurs thèmes et un appui qui semble naturel. Cette aisance peut aider à progresser ou à retrouver du calme. Elle gagne à être utilisée consciemment, car ce qui paraît facile peut aussi rester au repos sans initiative.',
        bridge: 'facilite une coopération entre ces deux thèmes',
        action: 'utiliser cet appui pour avancer sur une étape qui vous tient à cœur',
        source: { title: 'Astrodienst — Trine', url: 'https://www.astro.com/astrowiki/en/Trine' }
      },
      {
        angle: 180, name: 'Opposition',
        meaning: 'Une opposition place deux planètes face à face, à environ 180 degrés. Elle évoque deux besoins qui semblent tirer dans des directions différentes. Vous pouvez passer de l’un à l’autre ou reconnaître l’un surtout chez quelqu’un d’autre. La piste consiste à donner une place aux deux, en recherchant un équilibre plutôt qu’un camp à éliminer.',
        bridge: 'invite à équilibrer deux besoins qui se font face',
        action: 'décrire chaque besoin puis chercher un compromis concret',
        source: { title: 'Astrodienst — Opposition', url: 'https://www.astro.com/astrowiki/en/Opposition' }
      }
    ],
    sources: [
      { title: 'Astrodienst — Astrowiki', url: 'https://www.astro.com/astrowiki/en' },
      { title: 'Astrodienst — Les quatre éléments', url: 'https://www.astro.com/astrowiki/en/Air' }
    ],
    notesSources: 'Explications originales en français simple à partir des pages individuelles d’Astrowiki indiquées pour chaque symbole. Les éléments s’appuient sur les explications des familles de signes dans les pages Bélier, Taureau, Gémeaux et Cancer. Les significations relèvent de l’astrologie symbolique occidentale et se lisent dans l’ensemble du thème; elles ne constituent pas des diagnostics scientifiques ni des causes physiques. Les exemples et pistes d’action sont des reformulations destinées à la réflexion.'
  };
});
