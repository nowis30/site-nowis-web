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
  const unavailable = 'La vision IA est momentanément indisponible. Votre lecture symbolique reste disponible ci-dessus.';
  const ready = () => {const reading=window.TAROT_SESSION.getReading();return reading.cardIds.length>0 && reading.revealed.length===reading.cardIds.length;};
  const payload = () => {const reading=window.TAROT_SESSION.getReading();return {consent:true,question:reading.question,spread:reading.spread,cardIds:reading.cardIds,answers:reading.answers,intention};};
  const syncButton = () => {$('oracle-ai-request').disabled=!available||busy||!ready()||!$('oracle-ai-consent').checked;};
  function invalidate() {
    requestVersion++;
    controller?.abort();controller=null;busy=false;
    $('oracle-ai-consent').checked=false;
    $('oracle-ai-result').replaceChildren();$('oracle-ai-result').hidden=true;
    $('oracle-ai-status').textContent=available?'La vision IA est facultative. Elle nécessite votre accord avant chaque nouvelle lecture.':unavailable;
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
    if(!available||busy||!ready()||!$('oracle-ai-consent').checked)return;
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
      if(!response.ok||result.mode!=='ai'||typeof result.reply!=='string'||!result.reply.trim()){
        $('oracle-ai-status').textContent=response.status===429?'Plusieurs visions ont été demandées récemment. Prenez le temps de lire votre tirage avant de réessayer.':unavailable;
        return;
      }
      const paragraphs=result.reply.slice(0,7000).split(/\n+/).filter(line=>line.trim()).map(line=>{const paragraph=document.createElement('p');paragraph.textContent=line;return paragraph;});
      $('oracle-ai-result').replaceChildren(...paragraphs);$('oracle-ai-result').hidden=false;
      $('oracle-ai-status').textContent='Vision générée par l’IA pour cette question et ce tirage. Elle peut contenir des erreurs ; gardez votre discernement.';
    } catch {
      if(version===requestVersion)$('oracle-ai-status').textContent=unavailable;
    } finally {
      clearTimeout(timeout);
      if(version===requestVersion){busy=false;controller=null;syncButton();}
    }
  });
  render();
  const capabilityController=new AbortController();
  const capabilityTimeout=setTimeout(()=>capabilityController.abort(),7000);
  fetch('/api/tarot/oracle',{cache:'no-store',signal:capabilityController.signal}).then(response=>response.ok?response.json():null).then(result=>{
    available=result?.available===true;$('oracle-ai-controls').hidden=!available;
    $('oracle-ai-status').textContent=available?'La vision IA est facultative. Elle nécessite votre accord avant chaque nouvelle lecture.':unavailable;
    syncButton();
  }).catch(()=>{$('oracle-ai-status').textContent=unavailable;}).finally(()=>clearTimeout(capabilityTimeout));
})();
