/* Optional ritual, local reflection and explicit opt-in AI. No diary is transmitted. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const storageKey = 'nowis-oracle-carnet-v1';
  const intentions = {
    clarte: {label:'la clarté', lens:'Distinguez ce que vous savez, ce que vous supposez et ce qui reste à vérifier.', action:'Écrivez un fait que vous pouvez vérifier et une question encore ouverte.'},
    elan: {label:'un nouvel élan', lens:'Cherchez dans ces symboles une marge de mouvement, sans vous obliger à tout changer.', action:'Choisissez un petit geste réversible à essayer, puis observez ce qu’il change.'},
    apaisement: {label:'l’apaisement', lens:'Laissez une place à votre ressenti sans lui demander de décider de tout.', action:'Nommez un besoin et ce que vous pouvez laisser en suspens pour le moment.'}
  };
  let intention = 'clarte';
  let lastSignature = '';
  let available = false;
  let busy = false;
  let controller = null;
  let requestVersion = 0;
  let authRequired = false;
  let quota = null;
  let resetTimer = null;
  const unavailable = 'La vision IA est momentanément indisponible. Votre lecture symbolique reste disponible ci-dessus.';
  const dailyLimit = 'Votre limite de 20 commandes IA pour aujourd’hui est atteinte. Vous pourrez réessayer après minuit (heure de Toronto). Vos lectures symboliques restent disponibles.';
  const signIn = 'Connectez-vous pour utiliser vos 20 commandes IA par jour. Vos lectures symboliques restent disponibles.';
  const quotaRule = '20 commandes IA par jour et par compte, partagées avec l’assistant du site et la conclusion du tarot. Remise à zéro à minuit (heure de Toronto).';
  const availabilityMessage = () => authRequired ? signIn : quota?.remaining === 0 ? dailyLimit : available ? 'La vision IA est facultative. Elle nécessite votre accord avant chaque nouvelle lecture.' : unavailable;
  function updateQuota(value, publish = true) {
    if (!value || value.limit !== 20 || !Number.isInteger(value.remaining) || value.remaining < 0 || value.remaining > 20 || value.timeZone !== 'America/Toronto' || typeof value.resetAt !== 'string' || !Number.isFinite(Date.parse(value.resetAt))) return;
    quota = value;
    clearTimeout(resetTimer);
    const delay = Date.parse(quota.resetAt) - Date.now();
    if (delay > 0) resetTimer = setTimeout(refreshCapability, Math.min(delay + 500, 2147483647));
    if (publish) { const event = new Event('nowis:ai-quota'); event.quota = quota; window.dispatchEvent(event); }
    syncButton();
  }
  const ready = () => {const reading=window.TAROT_SESSION.getReading();return reading.cardIds.length>0 && reading.revealed.length===reading.cardIds.length;};
  const payload = () => {const reading=window.TAROT_SESSION.getReading();return {consent:true,question:reading.question,spread:reading.spread,cardIds:reading.cardIds,answers:reading.answers,intention};};
  const syncButton = () => {
    $('oracle-ai-request').disabled=!available||authRequired||quota?.remaining===0||busy||!ready()||!$('oracle-ai-consent').checked;
    $('oracle-ai-controls').hidden=!available||authRequired;
    $('oracle-ai-login').hidden=!authRequired;
    $('oracle-ai-quota').textContent=quota ? `${quota.remaining} commande${quota.remaining>1?'s':''} IA restante${quota.remaining>1?'s':''} aujourd’hui. ${quotaRule}` : quotaRule;
  };
  function invalidate() {
    requestVersion++;
    controller?.abort();controller=null;busy=false;
    $('oracle-ai-consent').checked=false;
    $('oracle-ai-result').replaceChildren();$('oracle-ai-result').hidden=true;
    $('oracle-ai-status').textContent=availabilityMessage();
    syncButton();
  }
  function saveJournal() {
    try {sessionStorage.setItem(storageKey,JSON.stringify({intention,journal:$('oracle-journal').value.slice(0,1600)}));} catch {}
    $('oracle-journal-clear').disabled=!$('oracle-journal').value;
  }
  try {
    const saved=sessionStorage.getItem(storageKey);
    const record=saved&&saved.length<10000?JSON.parse(saved):null;
    if(record&&intentions[record.intention])intention=record.intention;
    if(typeof record?.journal==='string')$('oracle-journal').value=record.journal.slice(0,1600);
  } catch {}
  document.querySelectorAll('[name="oracle-intention"]').forEach(radio=>{
    radio.checked=radio.value===intention;
    radio.addEventListener('change',()=>{if(radio.checked){intention=radio.value;saveJournal();render();}});
  });
  $('oracle-journal').addEventListener('input',saveJournal);
  $('oracle-journal-clear').addEventListener('click',()=>{$('oracle-journal').value='';saveJournal();$('oracle-journal').focus();});
  $('oracle-journal-clear').disabled=!$('oracle-journal').value;
  const pauses=['Sentez les points d’appui de vos pieds. Respirez naturellement, sans forcer.','Laissez votre attention revenir à votre question. Vous pouvez prendre le temps qu’il vous faut.','Vous pouvez maintenant tirer les cartes et accueillir les symboles à votre rythme.'];
  let pauseIndex=0;
  $('ritual-breath').addEventListener('click',()=>{$('ritual-status').textContent=pauses[pauseIndex];pauseIndex=(pauseIndex+1)%pauses.length;});
  function render() {
    const reading=window.TAROT_SESSION.getReading();
    const signature=JSON.stringify({...payload(),revealed:reading.revealed});
    if(signature!==lastSignature){lastSignature=signature;invalidate();}
    const complete=ready();$('oracle-vision').hidden=!complete;
    if(!complete)return;
    const context=window.TAROT_READING.detectContext(reading.question,reading.answers);
    const entries=reading.cardIds.map((id,index)=>({card:window.TAROT_DATA.cards.find(card=>card.id===id),position:window.TAROT_DATA.spreads[reading.spread][index].title}));
    const known=entries.filter(entry=>entry.card.coverage!=='missing');
    const selected=intentions[intention];
    const opening=reading.question?`Autour de « ${reading.question} », `:'Pour ce tirage libre, ';
    $('vision-mirror').textContent=opening+(known.length?known.slice(0,2).map(entry=>`${entry.card.name} en position « ${entry.position} » invite à explorer les thèmes ${entry.card.keywords.slice(0,2).map(word=>`« ${word} »`).join(' et ')}`).join(' ; ')+'.':'aucune définition vérifiée ne permet encore de relier les cartes à votre question.')+(known.length!==entries.length?' Une carte sans définition vérifiée reste une question ouverte.':'');
    $('vision-intention').textContent=`Vous avez choisi ${selected.label}. ${selected.lens} Relisez la place de chaque carte : ce qui décrit une difficulté ne joue pas le même rôle que ce qui propose une ressource.`;
    $('vision-step').textContent=`${selected.action} Pour ${context.area}, vous pouvez ${context.step}. Retenez ce qui vous semble juste après l’avoir rapproché de votre situation réelle.`;
    syncButton();
  }
  window.addEventListener('tarot:changed',render);
  $('oracle-ai-consent').addEventListener('change',()=>{if(!$('oracle-ai-consent').checked)invalidate();else syncButton();});
  $('oracle-ai-request').addEventListener('click',async()=>{
    if(!available||authRequired||quota?.remaining===0||busy||!ready()||!$('oracle-ai-consent').checked)return;
    const version=++requestVersion;
    const submittedSignature=lastSignature;
    controller=new AbortController();const requestController=controller;
    const timeout=setTimeout(()=>requestController.abort(),32000);
    busy=true;syncButton();$('oracle-ai-result').hidden=true;
    $('oracle-ai-status').textContent='L’IA relie votre question aux symboles et aux positions de ce tirage…';
    try {
      const response=await fetch('/api/tarot/oracle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload()),signal:requestController.signal,cache:'no-store'});
      const result=await response.json();
      if(version!==requestVersion||submittedSignature!==lastSignature)return;
      if(requestController.signal.aborted){$('oracle-ai-status').textContent=unavailable;return;}
      updateQuota(result.quota);
      if (response.status === 401 || result.reason === 'AUTH_REQUIRED' || result.code === 'AUTH_REQUIRED') {
        authRequired=true;available=false;quota=null;clearTimeout(resetTimer);$('oracle-ai-consent').checked=false;$('oracle-ai-status').textContent=signIn;return;
      }
      if(!response.ok||result.mode!=='ai'||typeof result.reply!=='string'||!result.reply.trim()){
        if (response.status===429) {available=false;if(quota)updateQuota({...quota,remaining:0});}
        $('oracle-ai-status').textContent=response.status===429?dailyLimit:unavailable;
        return;
      }
      const paragraphs=result.reply.slice(0,7000).split(/\n+/).filter(line=>line.trim()).map(line=>{const paragraph=document.createElement('p');paragraph.textContent=line;return paragraph;});
      $('oracle-ai-result').replaceChildren(...paragraphs);$('oracle-ai-result').hidden=false;
      $('oracle-ai-status').textContent='Vision générée par l’IA pour cette question et ce tirage. Elle peut contenir des erreurs ; gardez votre discernement.'+(quota?.remaining===0?' '+dailyLimit:'');
    } catch {
      if(version===requestVersion)$('oracle-ai-status').textContent=unavailable;
    } finally {
      clearTimeout(timeout);
      if(version===requestVersion){busy=false;controller=null;syncButton();}
    }
  });
  window.addEventListener('nowis:ai-quota', event => {updateQuota(event.quota, false);if(quota?.remaining===0)$('oracle-ai-status').textContent=dailyLimit;});
  window.addEventListener('focus', refreshCapability);
  render();
  function refreshCapability() {
    const capabilityController=new AbortController();
    const capabilityTimeout=setTimeout(()=>capabilityController.abort(),7000);
    return fetch('/api/tarot/oracle',{cache:'no-store',signal:capabilityController.signal}).then(response=>response.json()).then(result=>{
      if(capabilityController.signal.aborted)return;
      authRequired=result?.reason==='AUTH_REQUIRED'||result?.code==='AUTH_REQUIRED';
      available=result?.available===true;
      if(authRequired){quota=null;clearTimeout(resetTimer);$('oracle-ai-consent').checked=false;}
      updateQuota(result?.quota);
      $('oracle-ai-status').textContent=availabilityMessage();
      syncButton();
    }).catch(()=>{available=false;$('oracle-ai-status').textContent=unavailable;syncButton();}).finally(()=>clearTimeout(capabilityTimeout));
  }
  refreshCapability();
})();
