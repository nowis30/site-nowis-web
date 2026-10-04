(() => {
  'use strict';
  const data = window.TAROT_DATA;
  const $ = id => document.getElementById(id);
  const names = {'2':'Problème & solution','3':'Passé, présent, avenir','4':'Situation & ressources','5':'Une vue d’ensemble'};
  const state = {spread:'3',drawn:[],revealed:new Set(),question:'',deck:'all',answers:window.TAROT_PERSONAL.cleanAnswers({})};
  const answerFields={situation:'context-situation',goal:'context-goal',feeling:'context-feeling',blocker:'context-blocker'};
  const sessionKey='nowis-tarot-reading-v1';
  window.TAROT_SESSION = Object.freeze({getReading:()=>({spread:state.spread,cardIds:state.drawn.map(card=>card.id),revealed:[...state.revealed],question:state.question,answers:{...state.answers}})});
  function updateContextStatus() {
    const context=window.TAROT_READING.detectContext(state.question,state.answers);
    const count=Object.values(state.answers).filter(Boolean).length;
    const status=!context.goalRelevant?'Votre objectif semble concerner un autre sujet. Précisez le lien avec votre question.':count?`${count} réponse${count>1?'s':''} prise${count>1?'s':''} en compte. Vous pouvez les modifier sans refaire le tirage.`:'Vos réponses affinent la lecture et restent dans cet onglet.';
    if($('context-status').textContent!==status)$('context-status').textContent=status;
    $('reading-context-note').hidden=!context.personal;
    $('clear-context').disabled=!count;
  }
  function rememberReading() {
    const record={spread:state.spread,cardIds:state.drawn.map(card=>card.id),revealed:[...state.revealed],question:state.question,deck:$('deck').value,answers:state.answers,contextOpen:$('personal-context').open};
    try{history.replaceState({...history.state,tarotReading:record},'',location.hash.startsWith('#lecture=')?location.pathname+location.search:location.href);}catch{}
    // A parent-page refresh recreates the iframe's history entry. Keep a local
    // tab-scoped copy so the visitor can continue the same reading afterwards.
    try{sessionStorage.setItem(sessionKey,JSON.stringify(record));}catch{}
  }
  function restoreReading() {
    let record=history.state?.tarotReading;
    if(!record){try{const saved=sessionStorage.getItem(sessionKey);if(saved&&saved.length<10000)record=JSON.parse(saved);}catch{}}
    if(location.hash.startsWith('#lecture=')){try{record=JSON.parse(decodeURIComponent(location.hash.slice(9)));}catch{return;}}
    if(!record||!['string','number'].includes(typeof record.spread)||!['2','3','4','5'].includes(String(record.spread))||!Array.isArray(record.cardIds)||![0,Number(record.spread)].includes(record.cardIds.length)||new Set(record.cardIds).size!==record.cardIds.length)return;
    const cards=record.cardIds.map(id=>data.cards.find(card=>card.id===id));
    if(cards.some(card=>!card)||(record.deck==='major'&&cards.some(card=>card.family!=='Majeurs')))return;
    state.spread=String(record.spread);state.drawn=cards;state.question=typeof record.question==='string'?record.question.slice(0,500):'';state.deck=record.deck==='major'?'major':'all';
    state.revealed=new Set((Array.isArray(record.revealed)?record.revealed:[]).filter(index=>Number.isInteger(index)&&index>=0&&index<cards.length));
    $('question').value=state.question;$('deck').value=state.deck;
    state.answers=window.TAROT_PERSONAL.cleanAnswers(record.answers);
    Object.entries(answerFields).forEach(([key,id])=>{$(id).value=state.answers[key];});
    $('personal-context').open=record.contextOpen===true;
    document.querySelectorAll('[data-spread]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.spread===state.spread)));
    if(cards.length)$('draw').innerHTML='Faire un nouveau tirage <span aria-hidden="true">↗</span>';
    rememberReading();
  }
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {direct:'Définition sourcée',method:'Association famille + rang',missing:'À compléter'};
  const motifs = {
    moon:'<path d="M64 14a35 35 0 1 0 0 72 40 40 0 0 1 0-72Z"/><path d="m72 22 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z"/>',
    star:'<path d="m50 12 10 26 28 1-22 18 7 28-23-17-23 17 7-28-22-18 28-1Z"/><circle cx="50" cy="50" r="7"/>',
    sun:'<circle cx="50" cy="50" r="21"/><path d="M50 8v13m0 58v13M8 50h13m58 0h13M20 20l10 10m40 40 10 10M20 80l10-10m40-40 10-10"/><circle cx="43" cy="46" r="1"/><circle cx="57" cy="46" r="1"/><path d="M42 58q8 6 16 0"/>',
    cup:'<path d="M25 20h50v13c0 22-50 22-50 0ZM50 51v25M34 78h32M20 22q-15 20 13 22m47-22q15 20-13 22"/><path d="m50 9 0 5M37 9l3 5m23-5-3 5"/>',
    sword:'<path d="M50 8 60 25 50 67 40 25ZM30 65h40M50 67v19M43 89h14"/><path d="M50 25v38"/>',
    wand:'<path d="m39 84 20-69 6 2-20 69ZM48 53Q27 37 38 28q16 9 10 25M55 37q5-21 19-19 0 15-19 19M45 67q-19-5-19-19 17-2 19 19"/>',
    coin:'<circle cx="50" cy="50" r="33"/><circle cx="50" cy="50" r="27"/><path d="m50 29 6 16 17 1-13 11 4 17-14-10-14 10 4-17-13-11 17-1Z"/>',
    wheel:'<circle cx="50" cy="50" r="31"/><circle cx="50" cy="50" r="9"/><path d="M50 19v22m0 18v22M19 50h22m18 0h22M28 28l16 16m12 12 16 16M28 72l16-16m12-12 16-16"/>',
    scales:'<path d="M50 16v66M28 84h44M21 34h58M24 34 12 59h24ZM76 34 64 59h24ZM12 59q12 14 24 0m28 0q12 14 24 0"/><circle cx="50" cy="24" r="5"/>',
    tower:'<path d="M29 87V39h42v48M25 88h50M29 39V27h10v8h11V21h11v14h10M43 86V70h14v16M42 46v9m15-9v9M74 8 60 22l11 1-17 15"/>',
    world:'<ellipse cx="50" cy="50" rx="29" ry="38"/><ellipse cx="50" cy="50" rx="23" ry="32"/><path d="M32 50h36M50 31v38m-8-21 8-17 8 17m-16 4 8 17 8-17"/>',
    book:'<path d="M50 27q-21-16-34-6v56q16-9 34 6 18-15 34-6V21q-13-10-34 6ZM50 27v56M24 36l17 5m-17 5 17 5m-17 5 17 5m18-20 17-5m-17 15 17-5m-17 15 17-5"/>',
    crown:'<path d="m20 33 15 14 15-24 15 24 15-14-8 36H28ZM28 78h44"/><circle cx="20" cy="28" r="3"/><circle cx="50" cy="17" r="3"/><circle cx="80" cy="28" r="3"/>',
    flower:'<circle cx="50" cy="43" r="8"/><path d="M50 35c-19-23-27-3-8 9-29 8-14 23 5 9-8 27 15 27 6 0 25 13 34-7 5-9 19-19 0-35-8-9ZM50 56v31M50 75q-26-18-26-2 14 14 26 2m0-10q24-13 24 0-12 11-24 0"/>',
    eye:'<path d="M9 50q41-46 82 0-41 46-82 0Z"/><circle cx="50" cy="50" r="16"/><circle cx="50" cy="50" r="5"/>',
    infinity:'<path d="M50 50C-2 3-2 97 50 50s52-47 0 0Z"/>',
    key:'<circle cx="39" cy="29" r="17"/><path d="m50 42 29 34-8 8-9-11-6 5-9-12 6-5-13-16M31 23l5 5"/>',
    mountain:'<path d="m9 81 26-46 14 23 14-43 28 66ZM25 54l10 7 9-9m12-15 7 6 8-5M16 87h68"/>',
    heart:'<path d="M50 81C-15 42 19 3 50 34 81 3 115 42 50 81Z"/>',
    hourglass:'<path d="M27 14h46M27 86h46M32 17c0 25 10 29 18 33-8 4-18 8-18 33m36-66c0 25-10 29-18 33 8 4 18 8 18 33M38 31h24M38 73l12-18 12 18Z"/>',
    door:'<path d="M23 87V27q27-29 54 0v60ZM36 85V33q14-17 28 0v52M45 55h3M15 88h70"/>',
    balance:'<path d="M21 27h20v23q-20 22-20 0ZM59 50h20v23q-20 22-20 0ZM31 57v24M19 83h24M69 20v23M57 18h24M43 57q22-24 31-7M26 51q9 22 31 1"/>',
    bell:'<path d="M25 69h50L67 55V36q0-27-34 0v19ZM44 78q6 13 12 0M50 13V7M17 23l-6-6m72 6 6-6"/>'
  };
  const majorMotifs=['moon','wand','book','flower','crown','key','heart','mountain','scales','mountain','wheel','infinity','hourglass','door','balance','key','tower','star','moon','sun','bell','world'];
  const familyMotifs={'Bâtons':'wand','Coupes':'cup','Épées':'sword','Deniers':'coin'};
  function illustration(card) {
    const motif = card ? (card.family==='Majeurs'?majorMotifs[card.number]:familyMotifs[card.family]) : 'moon';
    return `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${motifs[motif] || motifs.star}</svg>`;
  }
  function randomBelow(max) {
    const numbers = new Uint32Array(1);
    const limit = Math.floor(4294967296/max)*max;
    do { crypto.getRandomValues(numbers); } while(numbers[0]>=limit);
    return numbers[0]%max;
  }
  function drawCards(pool,count) {
    const shuffled=pool.slice();
    for(let i=shuffled.length-1;i>0;i--){const j=randomBelow(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    return shuffled.slice(0,count);
  }
  function renderTable() {
    const positions=data.spreads[state.spread];
    const table=$('card-table');
    table.style.setProperty('--count',state.spread);
    table.dataset.count=state.spread;
    table.innerHTML=positions.map((position,i)=>{
      const card=state.drawn[i];const revealed=state.revealed.has(i);
      const label=!card?'Emplacement '+position.title:revealed?card.name+' — '+position.title:'Révéler la carte '+(i+1)+' — '+position.title;
      return `<div class="card-slot"><p class="position-label">${i+1}. ${esc(position.title)}</p><button class="tarot-card ${revealed?'revealed':''}" data-index="${i}" aria-label="${esc(label)}" ${!card?'disabled':''} aria-pressed="${revealed}"><span class="card-inner"><span class="card-ornament">${revealed?esc(card.roman||'✦'):'· ✦ ·'}</span><span class="card-center">${illustration(revealed?card:null)}</span><span class="card-bottom">${revealed?esc(card.name):'ORACLE NOWIS'}</span></span></button><p class="${revealed?'card-name':'card-helper'}">${revealed?esc(card.name):card?'Touchez pour révéler':'Une carte à découvrir'}</p></div>`;
    }).join('');
    $('spread-title').textContent=names[state.spread];
    $('reveal-count').textContent=state.drawn.length?`${state.revealed.size} / ${state.spread} révélées`:`${state.spread} cartes`;
    $('reveal-all').hidden=!state.drawn.length||state.revealed.size===Number(state.spread);
    $('table-instruction').textContent=!state.drawn.length?'Commencez par mélanger le jeu. Vos cartes apparaîtront ici.':state.revealed.size===Number(state.spread)?'Votre tirage est révélé. Retrouvez sa lecture ci-dessous.':'Vos cartes sont tirées. Révélez-les à votre rythme.';
  }
  function referenceHtml(card) {
    if(!card.sourceIds.length)return '<p class="reference-links">Définition à compléter à partir d’une source vérifiée.</p>';
    return `<div class="reference-links">${card.sourceIds.map(id=>{const source=data.sources.find(s=>s.id===id);return source?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`:'';}).join('')}</div>`;
  }
  function definitionHtml(card) {
    return `<span class="coverage ${card.coverage==='missing'?'missing':''}">${labels[card.coverage]}</span><div class="keywords">${card.keywords.map(k=>`<span class="keyword">${esc(k)}</span>`).join('')}</div><p class="meaning">${esc(card.meaning)}</p>${referenceHtml(card)}`;
  }
  function renderReading() {
    $('interpretations').hidden=state.revealed.size===0;
    $('question-summary').textContent=state.question;
    $('reading-cards').innerHTML=state.drawn.map((card,i)=>{
      if(!state.revealed.has(i))return '';
      const position=data.spreads[state.spread][i].title;
      const reading=window.TAROT_READING.interpret(card,position,state.question,state.answers);
      return `<article class="reading-entry"><div class="entry-position">CARTE ${i+1}<span>${esc(position)}</span></div><div><h3>${esc(card.name)}</h3>${card.coverage==='missing'?'<span class="coverage missing">Définition à compléter</span>':''}<div class="contextual-reading">${reading.paragraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}</div></div></article>`;
    }).join('');
    const allRevealed=state.drawn.length>0&&state.revealed.size===state.drawn.length;
    $('synthesis').hidden=!allRevealed;
    if(allRevealed){
      const paragraphs=window.TAROT_READING.synthesize(state.drawn,data.spreads[state.spread],state.question,state.answers);
      $('synthesis').innerHTML=`<h3>Le fil de votre tirage</h3>${paragraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}`;
    }
    window.dispatchEvent(new Event('tarot:changed'));
  }
  function reveal(index) {
    if(!state.drawn[index]||state.revealed.has(index))return;
    state.revealed.add(index);renderTable();renderReading();rememberReading();
    $('draw-status').textContent=`${state.drawn[index].name} révélé. ${state.revealed.size} carte${state.revealed.size>1?'s':''} sur ${state.spread}.`;
    $('card-table').querySelector(`[data-index="${index}"]`).focus({preventScroll:true});
  }
  function resetDraw() {
    state.drawn=[];state.revealed.clear();state.question=$('question').value.trim();$('draw-status').textContent='';renderTable();renderReading();rememberReading();
  }
  function startDraw() {
    state.question=$('question').value.trim();state.deck=$('deck').value;
    state.drawn=drawCards(data.cards.filter(c=>state.deck!=='major'||c.family==='Majeurs'),Number(state.spread));state.revealed.clear();
    $('draw').innerHTML='Faire un nouveau tirage <span aria-hidden="true">↗</span>';
    $('draw-status').textContent=`${state.spread} cartes tirées, sans doublon.`;
    renderTable();renderReading();rememberReading();
    $('card-table').querySelector('button').focus({preventScroll:true});
    if(matchMedia('(max-width:640px)').matches)$('card-table').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  }
  $('card-table').addEventListener('click',e=>{const card=e.target.closest('[data-index]');if(card)reveal(Number(card.dataset.index));});
  $('draw').addEventListener('click',startDraw);
  $('reveal-all').addEventListener('click',()=>{state.drawn.forEach((_,i)=>state.revealed.add(i));renderTable();renderReading();rememberReading();$('draw-status').textContent='Toutes les cartes sont révélées. Votre lecture est disponible.';$('card-table').querySelector('button')?.focus({preventScroll:true});});
  $('question').addEventListener('input',()=>{state.question=$('question').value.trim();updateContextStatus();renderReading();rememberReading();});
  Object.entries(answerFields).forEach(([key,id])=>$(id).addEventListener(['feeling','blocker'].includes(key)?'change':'input',()=>{
    state.answers=window.TAROT_PERSONAL.cleanAnswers(Object.fromEntries(Object.entries(answerFields).map(([name,field])=>[name,$(field).value])));
    updateContextStatus();renderReading();rememberReading();
  }));
  $('clear-context').addEventListener('click',()=>{
    state.answers=window.TAROT_PERSONAL.cleanAnswers({});
    Object.values(answerFields).forEach(id=>{$(id).value='';});
    updateContextStatus();renderReading();rememberReading();$('context-situation').focus();
  });
  $('personal-context').addEventListener('toggle',rememberReading);
  document.querySelectorAll('[data-spread]').forEach(button=>button.addEventListener('click',()=>{
    state.spread=button.dataset.spread;document.querySelectorAll('[data-spread]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));resetDraw();
  }));
  $('deck').addEventListener('change',resetDraw);
  function setView(view) {
    const dictionary=view==='dictionary';$('reading-view').hidden=dictionary;$('dictionary-view').hidden=!dictionary;
    $('tab-reading').setAttribute('aria-pressed',String(!dictionary));$('tab-dictionary').setAttribute('aria-pressed',String(dictionary));
  }
  $('tab-reading').addEventListener('click',()=>setView('reading'));
  $('tab-dictionary').addEventListener('click',()=>setView('dictionary'));
  document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();setView('reading');});
  $('card-select').innerHTML=['Majeurs','Bâtons','Coupes','Épées','Deniers'].map(family=>`<optgroup label="${esc(family==='Majeurs'?'Arcanes majeurs':family)}">${data.cards.filter(c=>c.family===family).map(c=>`<option value="${esc(c.id)}">${esc(c.roman?c.roman+' · '+c.name:c.name)}</option>`).join('')}</optgroup>`).join('');
  $('card-select').value='major-1';
  function renderDictionary() {const card=data.cards.find(c=>c.id===$('card-select').value);$('dictionary-card').innerHTML=`<p class="card-family">${esc(card.family==='Majeurs'?'ARCANE MAJEUR':card.family.toUpperCase())} ${esc(card.roman)}</p><h3>${esc(card.name)}</h3>${definitionHtml(card)}`;}
  $('card-select').addEventListener('change',renderDictionary);
  $('source-list').innerHTML=data.sources.map(source=>`<div class="source-entry"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><small>${source.id==='street'?'21 définitions majeures et tirages de 2 à 5 cartes.':'Méthode d’association des familles et des rangs des 56 mineurs.'}</small></div>`).join('');
  $('open-sources').addEventListener('click',()=>$('sources-dialog').showModal());
  $('close-sources').addEventListener('click',()=>$('sources-dialog').close());
  $('close-sources-bottom').addEventListener('click',()=>$('sources-dialog').close());
  restoreReading();updateContextStatus();renderTable();renderReading();renderDictionary();
  // Structured browser tools are optional; the ordinary interface works without them.
  if(navigator.modelContext?.registerTool){
    navigator.modelContext.registerTool({name:'draw_tarot_cards',description:'Effectuer un nouveau tirage de tarot à l’écran, sans envoyer de question à un service externe.',inputSchema:{type:'object',properties:{count:{type:'integer',enum:[2,3,4,5]}},required:['count']},execute:async({count})=>{const button=document.querySelector(`[data-spread="${count}"]`);if(!button)throw new Error('Choisir de 2 à 5 cartes.');button.click();startDraw();return{content:[{type:'text',text:`${count} cartes tirées. Révélez-les dans la page pour lire leurs définitions.`}]};}});
  }
})();
