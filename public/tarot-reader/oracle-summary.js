/* Session-only completed draws and a separate, explicit opt-in conclusion. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('summary-section')) return;

  const storageKey = 'nowis-oracle-summary-v1';
  const corpus = new Map(window.TAROT_DATA.cards.map(card => [card.id, card]));
  const spreads = window.TAROT_DATA.spreads;
  const validId = value => typeof value === 'string' && /^[A-Za-z0-9:._-]{1,120}$/.test(value);
  const text = (value, length) => typeof value === 'string' ? value.trim().slice(0, length) : '';
  const unavailable = 'La conclusion IA est momentanément indisponible. Vos lectures restent disponibles sur cette page.';
  const failureMessages = {
    timeout: 'L’IA a mis trop de temps à répondre. Vos résultats sont conservés : vous pouvez réessayer.',
    incomplete: 'L’IA n’a pas terminé sa conclusion. Vos résultats sont conservés : vous pouvez réessayer.',
    auth: 'Le service de conclusion IA est momentanément indisponible. Vos résultats sont conservés.',
    configuration: 'Le service de conclusion IA est momentanément indisponible. Vos résultats sont conservés.',
    http: 'Le service d’IA n’a pas pu répondre. Vos résultats sont conservés : vous pouvez réessayer.',
    quota: 'Le service de conclusion IA a atteint sa limite temporaire. Vos résultats sont conservés.',
    refusal: 'L’IA n’a pas pu proposer de conclusion pour cette demande. Vos résultats sont conservés.',
    empty: 'L’IA n’a pas renvoyé de conclusion utilisable. Vos résultats sont conservés : vous pouvez réessayer.',
    output_limit: 'L’IA n’a pas pu terminer une conclusion adaptée. Vos résultats sont conservés : vous pouvez réessayer.',
    error: 'La demande n’a pas abouti. Vos résultats sont conservés : vous pouvez réessayer.'
  };
  const initialStatus = 'La conclusion IA est facultative. Retenez une carte du ciel ou un tirage révélé, puis donnez votre accord.';
  let readings = [];
  let dismissedDrawIds = [];
  let astrology = null;
  let available = false;
  let busy = false;
  let requestVersion = 0;
  let controller = null;
  let changedSinceLoad = false;

  function cleanReading(value, requireRevealed) {
    if (!value || typeof value !== 'object' || !validId(value.drawId)) return null;
    const spread = String(value.spread);
    if (!Object.prototype.hasOwnProperty.call(spreads, spread) || !Array.isArray(value.cardIds)) return null;
    const expected = spreads[spread].length;
    if (value.cardIds.length !== expected || new Set(value.cardIds).size !== expected || !value.cardIds.every(id => corpus.has(id))) return null;
    if (requireRevealed) {
      if (!Array.isArray(value.revealed) || value.revealed.length !== expected || new Set(value.revealed).size !== expected) return null;
      if (!value.revealed.every(index => Number.isInteger(index) && index >= 0 && index < expected)) return null;
    }
    return {
      drawId: value.drawId,
      question: text(value.question, 500),
      answers: window.TAROT_PERSONAL.cleanAnswers(value.answers),
      spread,
      cardIds: [...value.cardIds]
    };
  }

  function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  }

  function cleanAstrology(value) {
    if (!value || typeof value !== 'object' || !validDate(value.birthDate) || !validDate(value.forecastDate)) return null;
    if (typeof value.unknownTime !== 'boolean' || !Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90 || !Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180) return null;
    if (typeof value.timeZone !== 'string' || !value.timeZone.trim() || value.timeZone.length > 100) return null;
    if (!value.unknownTime && (typeof value.birthTime !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.birthTime))) return null;
    const cleaned = {
      birthDate: value.birthDate,
      birthTime: value.unknownTime ? '' : value.birthTime,
      unknownTime: value.unknownTime,
      latitude: value.latitude,
      longitude: value.longitude,
      timeZone: value.timeZone.trim(),
      forecastDate: value.forecastDate,
      placeName: text(value.placeName, 160)
    };
    if (['earlier', 'later'].includes(value.disambiguation)) cleaned.disambiguation = value.disambiguation;
    return cleaned;
  }

  function persist() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({version: 1, readings, dismissedDrawIds})); } catch {}
  }

  try {
    const saved = sessionStorage.getItem(storageKey);
    const record = saved && saved.length <= 22000 ? JSON.parse(saved) : null;
    if (record?.version === 1 && Array.isArray(record.readings)) {
      const seen = new Set();
      readings = record.readings.slice(-5).map(value => cleanReading(value, false)).filter(value => {
        if (!value || seen.has(value.drawId)) return false;
        seen.add(value.drawId); return true;
      });
      dismissedDrawIds = Array.isArray(record.dismissedDrawIds) ? [...new Set(record.dismissedDrawIds.filter(validId))].slice(-10) : [];
      readings = readings.filter(value => !dismissedDrawIds.includes(value.drawId));
    }
  } catch {}
  persist(); // Replace malformed or extra stored fields with the bounded whitelist.

  function syncButton() {
    $('summary-request').disabled = !available || busy || (!readings.length && !astrology) || !$('summary-consent').checked;
    $('summary-clear').disabled = !readings.length;
  }

  function invalidate(message) {
    requestVersion++;
    controller?.abort(); controller = null; busy = false;
    $('summary-consent').checked = false;
    $('summary-result').replaceChildren(); $('summary-result').hidden = true;
    $('summary-status').textContent = message;
    syncButton();
  }

  function renderReadings() {
    const children = readings.map((reading, index) => {
      const entry = document.createElement('article'); entry.className = 'summary-entry';
      const heading = document.createElement('h3'); heading.textContent = `Tirage ${index + 1} · ${reading.cardIds.length} cartes`;
      const question = document.createElement('p'); question.className = 'summary-question'; question.textContent = reading.question || 'Tirage libre, sans question précisée.';
      const cards = document.createElement('p'); cards.className = 'summary-card-list';
      cards.textContent = reading.cardIds.map((id, position) => `${spreads[reading.spread][position].title} : ${corpus.get(id).name}`).join(' · ');
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'summary-remove';
      remove.dataset.summaryRemove = reading.drawId; remove.textContent = 'Retirer ce tirage';
      remove.setAttribute('aria-label', `Retirer le tirage ${index + 1} de la conclusion`);
      entry.replaceChildren(heading, question, cards, remove);
      return entry;
    });
    if (!children.length) {
      const empty = document.createElement('p'); empty.className = 'summary-empty';
      empty.textContent = 'Vos tirages entièrement révélés apparaîtront ici. Vous pouvez aussi demander une conclusion de la carte du ciel seule.';
      children.push(empty);
    }
    $('summary-readings').replaceChildren(...children);
    $('summary-count').textContent = `${readings.length} tirage${readings.length > 1 ? 's' : ''} retenu${readings.length > 1 ? 's' : ''} sur 5`;
    $('summary-astro-status').textContent = astrology
      ? 'La carte du ciel et la date choisie seront prises en compte dans la conclusion.'
      : 'Aucune carte du ciel complète n’est retenue. La conclusion peut utiliser vos tirages seuls.';
    syncButton();
  }

  function synchronize(changed) {
    const reading = cleanReading(window.TAROT_SESSION?.getReading?.(), true);
    if (reading && !dismissedDrawIds.includes(reading.drawId)) {
      const existing = readings.findIndex(value => value.drawId === reading.drawId);
      if (existing >= 0) readings[existing] = reading;
      else readings = [...readings, reading].slice(-5);
      persist();
    }
    astrology = cleanAstrology(window.ASTRO_SESSION?.getContext?.());
    if (changed) {
      changedSinceLoad = true;
      invalidate('Vos éléments de lecture ont changé. Vérifiez la sélection et donnez à nouveau votre accord pour régénérer la conclusion.');
    }
    renderReadings();
  }

  function dismiss(ids) {
    dismissedDrawIds = [...new Set([...dismissedDrawIds, ...ids])].slice(-10);
    readings = readings.filter(reading => !ids.includes(reading.drawId));
    persist();
    changedSinceLoad = true;
    invalidate('La sélection a changé. Donnez à nouveau votre accord pour générer une conclusion avec les éléments restants.');
    renderReadings();
  }

  $('summary-readings').addEventListener('click', event => {
    const target = event.target?.closest?.('[data-summary-remove]');
    if (target && readings.some(reading => reading.drawId === target.dataset.summaryRemove)) dismiss([target.dataset.summaryRemove]);
  });
  $('summary-clear').addEventListener('click', () => { if (readings.length) dismiss(readings.map(reading => reading.drawId)); });
  window.addEventListener('tarot:changed', () => synchronize(true));
  window.addEventListener('astro:changed', () => synchronize(true));
  $('summary-consent').addEventListener('change', () => {
    if (!$('summary-consent').checked) invalidate('Votre accord a été retiré. Aucun nouvel envoi ne sera effectué sans votre accord.');
    else syncButton();
  });

  function requestPayload() {
    const payload = {
      consent: true,
      readings: readings.map(reading => ({question: reading.question, answers: {...reading.answers}, spread: reading.spread, cardIds: [...reading.cardIds]}))
    };
    if (astrology) payload.astrology = {...astrology};
    return payload;
  }

  function limitReply(value) {
    let reply = value.trim().slice(0, 11000);
    const words = [...reply.matchAll(/\S+/g)];
    if (words.length > 800) reply = reply.slice(0, words[799].index + words[799][0].length);
    return reply;
  }

  $('summary-request').addEventListener('click', async () => {
    if (!available || busy || (!readings.length && !astrology) || !$('summary-consent').checked) return;
    const payload = requestPayload();
    const submittedSignature = JSON.stringify(payload);
    const version = ++requestVersion;
    controller = new AbortController(); const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 70000);
    busy = true; syncButton();
    $('summary-result').replaceChildren(); $('summary-result').hidden = true;
    $('summary-status').textContent = 'L’IA rapproche les symboles de la carte du ciel et les tirages retenus pour proposer une conclusion…';
    try {
      const response = await fetch('/api/tarot/conclusion', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload), signal: requestController.signal, cache: 'no-store'
      });
      const result = await response.json();
      if (version !== requestVersion || submittedSignature !== JSON.stringify(requestPayload())) return;
      if (requestController.signal.aborted) { $('summary-status').textContent = failureMessages.timeout; return; }
      if (!response.ok || result.mode !== 'ai' || typeof result.reply !== 'string' || !result.reply.trim()) {
        $('summary-status').textContent = response.status === 429
          ? 'Plusieurs conclusions ont été demandées récemment. Prenez le temps de lire vos résultats avant de réessayer.'
          : response.status === 400
            ? 'Vérifiez les informations de la carte du ciel et les tirages retenus avant de réessayer.'
            : Object.prototype.hasOwnProperty.call(failureMessages, result.reason) ? failureMessages[result.reason] : unavailable;
        return;
      }
      const paragraphs = limitReply(result.reply).split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
        const paragraph = document.createElement('p'); paragraph.textContent = line; return paragraph;
      });
      $('summary-result').replaceChildren(...paragraphs); $('summary-result').hidden = false;
      $('summary-status').textContent = 'Conclusion IA générée pour les éléments retenus. Ces pistes restent à rapprocher de votre vécu; vos choix vous appartiennent.';
      window.dispatchEvent(new Event('oracle:scroll-summary-result'));
      if(window.parent&&window.parent!==window&&window.parent.postMessage)window.parent.postMessage({type:'nowis-reader-scroll',target:'summary-result'},location.origin);
    } catch {
      if (version === requestVersion) $('summary-status').textContent = requestController.signal.aborted
        ? failureMessages.timeout
        : 'La connexion avec l’IA a été interrompue. Vos résultats sont conservés : vous pouvez réessayer.';
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion) { busy = false; controller = null; syncButton(); }
    }
  });

  $('summary-status').textContent = initialStatus;
  synchronize(false);
  const capabilityController = new AbortController();
  const capabilityTimeout = setTimeout(() => capabilityController.abort(), 7000);
  fetch('/api/tarot/conclusion', {cache: 'no-store', signal: capabilityController.signal})
    .then(response => response.ok ? response.json() : null)
    .then(result => {
      if (capabilityController.signal.aborted) return;
      available = result?.available === true;
      $('summary-ai-controls').hidden = !available;
      if (!available) $('summary-status').textContent = unavailable;
      else if (!changedSinceLoad) $('summary-status').textContent = initialStatus;
      syncButton();
    })
    .catch(() => { $('summary-status').textContent = unavailable; })
    .finally(() => clearTimeout(capabilityTimeout));
})();
