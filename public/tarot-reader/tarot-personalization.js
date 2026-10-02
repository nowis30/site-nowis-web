/* Les réponses déclarées donnent un contexte aux interprétations locales, pas une probabilité. */
(function () {
  'use strict';
  const feelings=['inquiet','perdu','serein','motive','deborde'];
  const blockers=['informations','hesitation','moyens','attente','peur','aucun'];
  const cleanText=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
  function cleanAnswers(value) {
    const input=value&&typeof value==='object'?value:{};
    return {situation:cleanText(input.situation,280),goal:cleanText(input.goal,180),feeling:feelings.includes(input.feeling)?input.feeling:'',blocker:blockers.includes(input.blocker)?input.blocker:''};
  }
  const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/\s+/g,' ').trim();
  function affirmativeText(value) {
    return normalize(value)
      .replace(/\bne\s+(?:veux|souhaite|cherche|compte|envisage|desire)\s+(?:pas|plus)\b[^,;.!?]*/g,'')
      .replace(/\bsans\s+(?:(?:avoir\s+)?(?:de\s+|d\s+)?(?:dettes?|credits?|prets?)|quitter|changer|rompre|divorcer)\b[^,;.!?]*/g,'')
      .replace(/\b(?:pas|aucun|aucune)\s+(?:de\s+|d\s+)?(?:dettes?|credits?|logements?|achats?|rupture|divorce)\b[^,;.!?]*/g,'');
  }
  const focuses={
    finances:[
      {key:'budget',match:/\b(budget|stabili\w*|equilibr\w*|epargn\w*|economis\w*|securite)\b/,area:'l’équilibre de votre budget',stake:'la régularité de vos ressources et de vos dépenses',check:'les besoins, les engagements et la marge qui rendent cet équilibre tenable'},
      {key:'engagements',match:/\b(dettes?|rembours\w*|credits?|prets?)\b/,area:'vos engagements financiers',stake:'la place de vos engagements financiers et la marge dont vous disposez',check:'ce qui est engagé, ce qui reste disponible et les points à éclaircir'},
      {key:'achat',match:/\b(achet\w*|achats?|immobili\w*|logements?)\b/,area:'votre projet d’achat',stake:'la place de cet achat dans vos besoins et vos moyens',check:'le besoin auquel cet achat répond, les moyens disponibles et les engagements associés'},
      {key:'ressources',match:/\b(revenus?|salaires?|gagner|gains?|rich\w*|augment\w*)\b/,area:'l’évolution de vos ressources',stake:'ce qui soutient ou limite le développement de vos ressources',check:'vos possibilités réelles, l’effort demandé et les besoins que vous souhaitez couvrir'}
    ],
    travail:[
      {key:'changement',match:/\b(chang\w*|reconver\w*|quitter|depart|evolu\w*)\b/,area:'votre évolution professionnelle',stake:'ce qui motive votre envie d’évolution et les conditions du passage',check:'ce que vous souhaitez quitter, ce que vous voulez préserver et les conditions d’une prochaine étape'},
      {key:'emploi',match:/\b(emploi|poste|embauche|recrut\w*|cherch\w*)\b/,area:'votre recherche ou votre choix d’emploi',stake:'ce que vous attendez d’un poste et les démarches à votre portée',check:'les attentes du poste, vos propres besoins et les informations disponibles'}
    ],
    relation:[
      {key:'dialogue',match:/\b(dialog\w*|communic\w*|renouer|parler|compren\w*|reconcili\w*)\b/,area:'le dialogue dans votre relation',stake:'ce que chacun exprime et la possibilité de mieux se comprendre',check:'les paroles réellement échangées, vos besoins et ce que chacun est disposé à partager'},
      {key:'engagement',match:/\b(engag\w*|mari\w*|ensemble|durable|constru\w*)\b/,area:'l’évolution de votre lien',stake:'vos attentes d’engagement et la place de chacun dans le lien',check:'ce que chacun souhaite, accepte et peut concrètement partager'}
    ],
    projet:[{key:'demarrage',match:/\b(lanc\w*|commenc\w*|debut\w*|creer|demarr\w*)\b/,area:'le démarrage de votre projet',stake:'le passage de votre idée à une première étape concrète',check:'le besoin auquel répond le projet, les moyens disponibles et le premier résultat observable'}]
  };
  function refineContext(base,question,value,detectTheme) {
    const answers=cleanAnswers(value);
    let context={...base};
    if(['general','choix'].includes(context.key)) {
      let details=detectTheme(answers.goal);
      if(['general','choix'].includes(details.key))details=detectTheme(answers.situation);
      if(!['general','choix'].includes(details.key))context={...details,question:base.question,secondary:[...new Set([...details.secondary,...(base.key==='choix'?['choix']:[])])]};
    }
    const goalTheme=detectTheme(answers.goal).key;
    const goalRelevant=!answers.goal||goalTheme==='general'||goalTheme===context.key||context.key==='general';
    const rules=focuses[context.key]||[];
    const fromQuestion=rules.find(rule=>rule.match.test(affirmativeText(question)));
    const fromAnswers=rules.find(rule=>rule.match.test(affirmativeText([goalRelevant?answers.goal:'',answers.situation].join(' '))));
    const focus=fromQuestion||fromAnswers;
    if(focus)context={...context,area:focus.area,stake:focus.stake,check:focus.check,focus:focus.key};
    return {...context,answers,goalRelevant,personal:[answers.situation,goalRelevant?answers.goal:'',answers.feeling,answers.blocker].some(Boolean)};
  }
  function motion(card) {
    const n=Number(card.number);
    if(card.family==='Majeurs') {
      if([2,9,12,14].includes(n))return 'reflection';
      if([1,3,7,11].includes(n))return 'initiative';
      if([4,8,21].includes(n))return 'structure';
      if([10,13,16,20].includes(n))return 'transition';
      return 'experience';
    }
    if(n===13)return 'reflection';
    if([1,3,11,12].includes(n))return 'initiative';
    if([4,8,14].includes(n))return 'structure';
    if([5,6,10].includes(n))return 'transition';
    return 'experience';
  }
  function responseToBlocker(card,profile,context,position) {
    const type=motion(card),blocker=context.answers.blocker,difficulty=['problem','obstacle'].includes(position);
    if(blocker==='informations') {
      if(type==='reflection')return difficulty?'Le manque d’informations que vous signalez peut prolonger l’attente : cette carte invite à définir l’élément précis qui vous permettrait d’avancer.':'La patience de cette carte peut soutenir la recherche de l’information qui vous manque, en donnant un terme précis à cette préparation.';
      if(type==='initiative')return 'Avec le manque d’informations que vous indiquez, l’élan de cette carte invite à choisir d’abord le point à vérifier pour donner une direction claire à votre action.';
      return 'Le manque d’informations que vous signalez donne à cette carte une priorité concrète : éclaircir '+context.check+'.';
    }
    if(blocker==='hesitation') {
      if(type==='reflection')return difficulty?'Votre difficulté à choisir peut être renforcée par une attente prolongée : la compréhension patiente de cette carte demande un repère pour décider.':'Face à votre difficulté à choisir, la compréhension patiente de cette carte invite à préciser ce qui vous ferait préférer une option.';
      if(type==='initiative')return 'Votre hésitation donne à l’élan de cette carte un cadre utile : comparer vos options, puis choisir un premier pas limité dont vous pourrez observer l’effet.';
      if(type==='structure')return 'La difficulté à choisir que vous décrivez peut être abordée par les repères de cette carte : un critère clair, une limite acceptable et les conséquences concrètes de chaque option.';
      return 'Votre difficulté à choisir invite à utiliser '+profile.lens+' pour distinguer ce que chaque option ouvre et ce qu’elle vous demande.';
    }
    if(blocker==='moyens') {
      if(type==='initiative')return 'Les moyens limités que vous indiquez invitent à donner à cet élan une taille réaliste : une étape courte, avec une limite d’effort et de ressources définie à l’avance.';
      if(type==='reflection')return 'Les moyens limités que vous signalez donnent un rôle concret à cette patience : distinguer le besoin essentiel de ce qui peut attendre, puis préparer une étape à votre portée.';
      return 'Les moyens limités que vous signalez invitent à confronter '+profile.lens+' aux ressources réellement disponibles, pour choisir un ajustement que vous pouvez soutenir.';
    }
    if(blocker==='attente')return type==='initiative'?'L’attente d’une autre personne que vous décrivez invite à diriger cet élan vers ce qui dépend de vous : formuler une demande claire et préciser votre propre prochaine étape.':'L’attente d’une autre personne donne à cette carte une question concrète : ce que vous pouvez clarifier vous-même et le temps que vous souhaitez laisser à une réponse.';
    if(blocker==='peur')return type==='initiative'?'La peur d’agir que vous indiquez peut être prise en compte en donnant à cet élan une forme limitée et réversible, avec un repère qui vous permette d’en apprécier l’effet.':'La peur d’agir que vous indiquez invite à vous appuyer sur '+profile.lens+' pour préciser ce qui vous rassurerait suffisamment avant un premier pas.';
    if(blocker==='aucun')return difficulty?'Vous ne signalez pas de frein particulier ; cette position invite à garder un point de vigilance : '+profile.risk+'.':'Vous ne signalez pas de frein particulier : cette carte peut surtout vous aider à choisir comment mobiliser '+profile.lens+' dans '+context.area+'.';
    return '';
  }
  function responseToFeeling(card,profile,context) {
    const type=motion(card);
    switch(context.answers.feeling) {
      case 'inquiet':return type==='reflection'?'Votre inquiétude actuelle donne un rôle à cette patience : prendre le temps de distinguer une crainte, un besoin et les éléments qui permettent de comprendre la situation.':'Votre inquiétude actuelle invite à inscrire '+profile.lens+' dans un cadre rassurant : un objectif limité, un repère concret et le temps d’en observer l’effet.';
      case 'perdu':return 'Le flou que vous ressentez actuellement invite à utiliser '+profile.lens+' pour éclaircir '+context.check+'.';
      case 'serein':return 'La sérénité que vous décrivez aujourd’hui peut vous aider à examiner '+profile.lens+' avec recul et à garder comme repère '+context.check+'.';
      case 'motive':return type==='reflection'?'Votre motivation actuelle invite à donner un rythme à cette compréhension patiente, en fixant une étape de préparation puis un moment pour décider.':'Votre motivation actuelle peut nourrir '+profile.lens+' si vous lui donnez un objectif précis et des limites adaptées à vos moyens.';
      case 'deborde':return 'Le sentiment de surcharge que vous décrivez actuellement invite à concentrer '+profile.lens+' sur une seule priorité dans '+context.area+'.';
      default:return '';
    }
  }
  function develop(card,profile,context,position,action) {
    if(!context.personal)return null;
    const a=context.answers,goal=context.goalRelevant?a.goal:'';
    const intent=goal?'Pour avancer vers le changement que vous souhaitez, « '+goal+' », ':'Pour votre question, ';
    let development;
    switch(position) {
      case 'past':development=(goal?'Votre souhait actuel « '+goal+' » donne un point de départ à cette relecture : ':'Cette position donne un point de départ à la relecture de votre expérience : ')+'revenir sur '+profile.past+' et repérer ce qui a pu soutenir ou freiner '+context.area+'.';break;
      case 'present':case 'situation':development=a.situation?'Vous décrivez aujourd’hui « '+a.situation+' » : cette carte invite à y examiner '+profile.lens+' et à observer ce que cela change dans '+context.stake+'.':intent+'cette carte invite à observer la place que prend '+profile.lens+' dans '+context.stake+'.';break;
      case 'future':case 'result':development='Si vous '+profile.condition+', '+profile.promise+(goal?' ; cette direction pourrait soutenir votre souhait « '+goal+' ».':'.');break;
      case 'problem':case 'obstacle':development='À cette place, la carte invite à examiner un point de vigilance : '+profile.risk+', en lien avec '+context.area+(goal?' et le changement que vous souhaitez, « '+goal+' ».':'.');break;
      case 'help':development=intent+'la ressource à mobiliser est '+profile.lens+', en lien avec '+context.stake+'.';break;
      case 'summary':development=intent+'cette carte rassemble la lecture en mettant l’accent sur '+profile.lens+' et sa place dans '+context.stake+'.';break;
      default:development=intent+'la carte vous oriente vers une démarche précise : '+action+'.';
    }
    const response=position==='past'?(responseToFeeling(card,profile,context)||responseToBlocker(card,profile,context,position)):(responseToBlocker(card,profile,context,position)||responseToFeeling(card,profile,context));
    let closing=response||'Pour donner une suite concrète à cette lecture, vous pouvez '+action+' en vous appuyant sur '+context.check+'.';
    if(a.feeling&&a.blocker&&position==='summary')closing+=' '+responseToFeeling(card,profile,context);
    return {development,closing};
  }
  function summarize(entries,context,actionFor) {
    if(!context.personal||!entries.length)return '';
    const a=context.answers,goal=context.goalRelevant?a.goal:'';
    const chosen=entries.find(entry=>['advice','solution','help'].includes(entry.position))||entries.find(entry=>entry.position==='present')||entries[entries.length-1];
    const declared=a.situation?'Vous décrivez « '+a.situation+' ». ':'';
    const intention=goal?'Pour le changement que vous souhaitez, « '+goal+' », ':'En reliant vos réponses à votre question, ';
    const response=responseToBlocker(chosen.card,chosen.profile,context,chosen.position)||responseToFeeling(chosen.card,chosen.profile,context);
    return declared+intention+chosen.card.name+' donne une piste à approfondir : '+actionFor(chosen.profile,context)+'.'+(response?' '+response:'');
  }
  window.TAROT_PERSONAL=Object.freeze({cleanAnswers,signals:affirmativeText,refineContext,develop,summarize});
}());
