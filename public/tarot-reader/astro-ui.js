(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('astro-form')) return;
  const engine = window.ASTRO_ENGINE, meanings = window.ASTRO_MEANINGS;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const source = item => item?.source ? `<a class="astro-source" href="${esc(item.source.url)}" target="_blank" rel="noopener noreferrer">Source : ${esc(item.source.title)} ↗</a>` : '';
  const dateText = value => { const [y,m,d] = value.split('-'); return `${d}/${m}/${y}`; };
  const today = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; };
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim();
  let manifest, selectedPlace = null, context = null, searchVersion = 0;
  const placesCache = new Map(), displayedPlaces = new Map();
  window.ASTRO_SESSION = Object.freeze({ getContext: () => context ? {...context} : null });
  function notifyParentScroll(target) {
    if(window.parent&&window.parent!==window&&window.parent.postMessage)window.parent.postMessage({type:'nowis-reader-scroll',target},location.origin);
  }

  function invalidate() {
    context = null; $('astro-result').hidden = true;
    $('astro-status').textContent = '';
    window.dispatchEvent(new Event('astro:changed'));
  }
  function resetTimeChoice() {
    $('astro-time-choice').hidden = true;
    $('astro-disambiguation').innerHTML = '<option value="">Choisir l’occurrence…</option>';
  }
  function customMode(enabled) {
    $('astro-place-select').disabled=enabled;
    ['astro-custom-name','astro-latitude','astro-longitude','astro-time-zone'].forEach(id=>{
      $(id).disabled=!enabled;
      $(id).required=enabled&&id!=='astro-custom-name';
    });
  }
  function clearPlace() {
    searchVersion++; selectedPlace = null; displayedPlaces.clear();
    $('astro-place-results').hidden = true;
    $('astro-place-select').innerHTML = '<option value="">Choisir un lieu…</option>';
    $('astro-place-status').textContent = 'Cherchez puis choisissez votre lieu de naissance.';
    resetTimeChoice(); invalidate();
  }
  async function getJson(url) {
    const response = await fetch(url, {credentials:'same-origin'});
    if (!response.ok) throw new Error('PLACE_LOAD');
    return response.json();
  }
  async function loadPlaces() {
    try {
      manifest = await getJson('/tarot-reader/astro-places/manifest.json');
      $('astro-country').innerHTML = manifest.countries.map(country => `<option value="${esc(country.code)}">${esc(country.name)}</option>`).join('');
      $('astro-country').value = 'CA'; $('astro-country').disabled = false;
      $('astro-search-place').disabled = false;
      $('astro-time-zone').innerHTML = '<option value="">Choisir le fuseau…</option>' + manifest.timeZones.map(zone => `<option value="${esc(zone)}">${esc(zone.replace(/_/g,' '))}</option>`).join('');
      $('astro-place-status').textContent = 'Cherchez puis choisissez votre lieu de naissance. Les lieux proviennent de GeoNames.';
    } catch {
      $('astro-place-status').textContent = 'La liste des lieux n’a pas pu être chargée. Vous pouvez utiliser les coordonnées ci-dessous.';
      $('astro-time-zone').innerHTML = '<option value="">Choisir le fuseau…</option>' + (Intl.supportedValuesOf?.('timeZone') || ['America/Toronto','Europe/Paris','UTC']).map(zone => `<option value="${esc(zone)}">${esc(zone.replace(/_/g,' '))}</option>`).join('');
    }
  }
  async function searchPlace() {
    const query = normalize($('astro-city-query').value);
    clearPlace();
    if (query.length < 2) { $('astro-place-status').textContent = 'Saisissez au moins deux lettres du lieu.'; return; }
    const country = manifest?.countries.find(item => item.code === $('astro-country').value);
    if (!country) return;
    const version = searchVersion;
    $('astro-place-status').textContent = 'Recherche du lieu…';
    try {
      let places = placesCache.get(country.code);
      if (!places) { places = await getJson(country.url); placesCache.set(country.code,places); }
      if (version !== searchVersion) return;
      const matches = places.map(place => ({place,names:[place.name,...(place.aliases || [])].map(normalize)}))
        .filter(item => item.names.some(name => name.includes(query)))
        .sort((a,b) => Number(b.names.includes(query))-Number(a.names.includes(query)) || Number(b.names.some(n=>n.startsWith(query)))-Number(a.names.some(n=>n.startsWith(query))) || a.place.name.localeCompare(b.place.name,'fr'));
      matches.slice(0,60).forEach(item => displayedPlaces.set(String(item.place.id),item.place));
      $('astro-place-select').innerHTML = '<option value="">Choisir un lieu…</option>' + [...displayedPlaces.values()].map(place => `<option value="${esc(place.id)}">${esc(place.name)} — ${esc(place.region || country.name)}</option>`).join('');
      $('astro-place-results').hidden = !matches.length;
      $('astro-place-status').textContent = matches.length ? `${matches.length} lieu${matches.length>1?'x':''} trouvé${matches.length>1?'s':''}. Choisissez le lieu exact${matches.length>60?' ; précisez la recherche pour voir au-delà des 60 premiers résultats':''}.` : 'Aucun lieu trouvé. Essayez une autre orthographe ou précisez les coordonnées ci-dessous.';
      if (matches.length) $('astro-place-select').focus({preventScroll:true});
    } catch {
      if (version === searchVersion) $('astro-place-status').textContent = 'Impossible de charger les lieux de ce pays. Réessayez ou utilisez les coordonnées ci-dessous.';
    }
  }
  function placeInput() {
    if ($('astro-use-custom').checked) {
      const lat = $('astro-latitude').value, lon = $('astro-longitude').value;
      if (!lat.trim() || !lon.trim() || !$('astro-time-zone').value) throw new Error('Précisez la latitude, la longitude et le fuseau horaire du lieu.');
      return {latitude:Number(lat),longitude:Number(lon),timeZone:$('astro-time-zone').value,placeName:$('astro-custom-name').value.trim() || 'Lieu saisi'};
    }
    if (!selectedPlace) throw new Error('Cherchez puis choisissez votre lieu de naissance.');
    return {latitude:selectedPlace.latitude,longitude:selectedPlace.longitude,timeZone:selectedPlace.timeZone,placeName:`${selectedPlace.name}${selectedPlace.region?' — '+selectedPlace.region:''}`};
  }
  function signEntries(planet) {
    return (planet.possibleSigns?.length ? planet.possibleSigns : [planet.sign]).map(name => meanings.signs.find(item => item.name === name)).filter(Boolean);
  }
  function bodyMeaning(planet, angleKey) {
    const meaning = angleKey ? meanings.angles[angleKey] : meanings.planets[planet.id];
    const signs = signEntries(planet), house = planet.house ? meanings.houses[planet.house-1] : null;
    const uncertain = planet.possibleSigns?.length > 1;
    const title = `${meaning.name} ${uncertain?'entre '+signs.map(sign=>sign.name).join(' et '):'en '+planet.sign}`;
    const position = `${planet.degreeText} ${planet.sign}${house?' · Maison '+planet.house:''}${planet.retrograde?' · Rétrograde':''}${planet.indicative?' · Position indicative à midi':''}`;
    const parts = [`<p>${esc(meaning.meaning)}</p>`];
    if (uncertain) parts.push('<p class="astro-uncertain">Sans l’heure de naissance, ce repère peut changer de signe durant la journée. Les deux nuances restent possibles.</p>');
    signs.forEach(sign => parts.push(`<p>${uncertain?`<strong>${esc(sign.name)} :</strong> `:''}${esc(sign.meaning)} Ce repère invite à explorer ${esc(meaning.focus)} ${esc(sign.style)}.</p>`));
    if (house) parts.push(`<p><strong>Maison ${house.number} · ${esc(house.name)}.</strong> ${esc(house.meaning)}</p>`);
    else if (!angleKey) parts.push('<p>La maison dépend de l’heure et du lieu de naissance. Elle n’est pas interprétée ici lorsqu’elle ne peut pas être calculée.</p>');
    parts.push(`<p class="astro-action"><strong>Pour votre réflexion :</strong> vous pourriez ${esc(meaning.action)}${signs.length===1?`, puis ${esc(signs[0].balance)}`:''}.</p>`);
    if (planet.retrograde) parts.push('<p>« Rétrograde » décrit un mouvement apparent vu de la Terre. Symboliquement, il peut inviter à reprendre ou à revoir ce thème ; il n’annonce pas un obstacle certain.</p>');
    parts.push(`<div class="astro-sources">${source(meaning)}${signs.map(source).join('')}${source(house)}</div>`);
    return {title,position,html:parts.join('')};
  }
  function detail(heading, body, open = false, extra = '') {
    return `<details class="astro-details" ${open?'open':''}><summary>${esc(heading)}${extra}</summary><div>${body}</div></details>`;
  }
  function renderMeanings(result) {
    const sun = result.natal.planets.find(p=>p.id==='Sun'), moon = result.natal.planets.find(p=>p.id==='Moon');
    const keys = [bodyMeaning(sun),bodyMeaning(moon)];
    $('astro-key-meanings').innerHTML = keys.map(item => detail(item.title,`<p class="astro-position">${esc(item.position)}</p>${item.html}`,true)).join('') + (result.natal.ascendant ? (()=>{const item=bodyMeaning(result.natal.ascendant,'ascendant');return detail(item.title,`<p class="astro-position">${esc(item.position)}</p>${item.html}`,true);})() : '<article class="astro-unavailable"><h4>Ascendant non calculé</h4><p>'+esc(result.natal.anglesUnavailableReason)+'</p></article>');
    if (result.natal.ascendant) {
      const descendant=engine.signPosition(result.natal.ascendant.longitude+180), sign=meanings.signs[descendant.signIndex];
      $('astro-key-meanings').innerHTML+=detail('Descendant en '+descendant.sign,`<p class="astro-position">${esc(descendant.degreeText)} ${esc(descendant.sign)} · opposé à l’ascendant</p><p>Le descendant se trouve sur l’horizon ouest et ouvre la septième maison. Dans cette tradition, il invite à explorer les attentes envers les autres, les accords et les relations durables. Il ne désigne pas un partenaire idéal et ne prédit pas votre vie amoureuse.</p><p>${esc(sign.meaning)}</p><p>Piste NOWIS : quelle qualité recherchez-vous dans une relation, et comment pouvez-vous aussi la développer vous-même ?</p><a class="astro-source" href="https://www.astro.com/astrowiki/en/Descendant" target="_blank" rel="noopener noreferrer">Source : Astrodienst — Descendant ↗</a>${source(sign)}`,true);
    }
    const all = result.natal.planets.filter(p=>!['Sun','Moon'].includes(p.id)).map(p=>bodyMeaning(p));
    if (result.natal.midheaven) all.push(bodyMeaning(result.natal.midheaven,'midheaven'));
    $('astro-planet-meanings').innerHTML = all.map(item=>detail(item.title,`<p class="astro-position">${esc(item.position)}</p>${item.html}`)).join('');
    const counts = {Feu:0,Terre:0,Air:0,Eau:0};
    const stable = result.natal.planets.filter(p=>!p.uncertain);
    stable.forEach(p=>counts[p.element]++);
    $('astro-elements').innerHTML = Object.values(meanings.elements).map(item=>`<article class="astro-element"><div class="astro-element-heading"><h4>${esc(item.name)}</h4><span>${counts[item.name]} / ${stable.length} repères${result.natal.timeKnown?'':' stables'}</span></div><div class="astro-element-bar" aria-hidden="true"><i style="width:${stable.length?counts[item.name]/stable.length*100:0}%"></i></div><p>${esc(item.meaning)}</p><p><strong>Une piste :</strong> ${esc(item.action)}.</p>${source(item)}</article>`).join('') + (!result.natal.timeKnown?'<p class="astro-uncertain">Sans l’heure de naissance, la Lune et les positions trop incertaines sont écartées de ce décompte. Les autres repères restent indicatifs. La conclusion IA utilise cette même répartition.</p>':'');
  }
  function aspectMeaning(aspect, transit) {
    const meaning = meanings.aspects.find(item=>item.angle===aspect.angle);
    const first = meanings.planets[transit?aspect.transitId:aspect.fromId];
    const second = meanings.planets[transit?aspect.natalId:aspect.toId] || meanings.angles[aspect.natalId==='Ascendant'?'ascendant':'midheaven'];
    return `<p>${esc(meaning.meaning)}</p>${transit?`<p>${esc(first.transitMeaning)}</p>`:''}<p>Dans cette lecture, ${esc(first.name)} évoque ${esc(first.focus)} ; ${esc(second.name)} évoque ${esc(second.focus)}. Leur ${esc(meaning.name.toLowerCase())} ${esc(meaning.bridge)}. Vous pouvez observer comment ces deux sujets se rencontrent dans votre expérience, puis ${esc(meaning.action)}.</p><p class="astro-position">Écart à l’angle exact : ${aspect.orb.toFixed(2)}° · Tolérance retenue : ${aspect.maxOrb}°${transit&&aspect.transitHouse?' · Passage dans la maison natale '+aspect.transitHouse:''}</p>${source(meaning)}`;
  }
  function renderAspects(result) {
    $('astro-natal-aspects').innerHTML = result.natal.aspects.length ? result.natal.aspects.map((aspect,index)=>detail(`${aspect.fromName} · ${aspect.aspect} · ${aspect.toName}`,aspectMeaning(aspect,false),index===0)).join('') : '<p>Aucun lien entre les planètes suffisamment précises ne se trouve dans les tolérances retenues. Cela ne signifie pas que votre ciel manque de sens.</p>';
    $('astro-transits-title').textContent = `Les transits du ${dateText(result.forecast.localDate)}`;
    $('astro-transits').innerHTML = result.transits.length ? result.transits.map((aspect,index)=>detail(`${aspect.transitName} en transit · ${aspect.aspect} · ${aspect.natalName} de naissance`,aspectMeaning(aspect,true),index<2)).join('') : '<p>Aucun transit ne correspond aux angles et tolérances retenus pour cette date. Aucun événement n’en est déduit.</p>';
    $('astro-forecast-positions').innerHTML = `<div class="astro-table-wrap"><table><caption>Positions à midi dans ${esc(result.forecast.timeZone)}</caption><thead><tr><th scope="col">Planète</th><th scope="col">Signe et degré</th><th scope="col">Mouvement apparent</th></tr></thead><tbody>${result.forecast.planets.map(planet=>`<tr><th scope="row">${esc(planet.name)}</th><td>${esc(planet.degreeText)} ${esc(planet.sign)}</td><td>${planet.retrograde?'Rétrograde':'Direct'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderChart(result) {
    const base = result.natal.ascendant?.longitude || 0, center = 350;
    const point = (longitude,radius) => {const a=(180-(longitude-base))*Math.PI/180;return [center+radius*Math.cos(a),center+radius*Math.sin(a)];};
    const xy = pair => pair.map(n=>n.toFixed(2));
    const line = (a,b,klass) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${klass}"/>`;
    let svg = '<svg viewBox="0 0 700 700" role="img" aria-labelledby="astro-svg-title astro-svg-desc"><title id="astro-svg-title">Carte du ciel de naissance et transits</title><desc id="astro-svg-desc">Les positions de naissance sont en or et les positions à la date de lecture en bleu. Les noms et significations de chaque planète sont disponibles sous la roue.</desc><circle cx="350" cy="350" r="322" class="chart-outline"/><circle cx="350" cy="350" r="276" class="chart-outline"/><circle cx="350" cy="350" r="230" class="chart-guide"/><circle cx="350" cy="350" r="174" class="chart-guide"/>';
    meanings.signs.forEach((sign,index) => {
      svg += line(xy(point(index*30,276)),xy(point(index*30,322)),'chart-outline');
      const p = xy(point(index*30+15,300));
      svg += `<text x="${p[0]}" y="${p[1]}" class="chart-sign" text-anchor="middle" dominant-baseline="middle">${esc(sign.glyph)}\uFE0E<title>${esc(sign.name)}</title></text>`;
    });
    result.natal.houses.forEach(house => {
      svg += line(xy(point(house.longitude,58)),xy(point(house.longitude,270)),'chart-house');
      const p=xy(point(house.longitude+15,132)); svg += `<text x="${p[0]}" y="${p[1]}" class="chart-house-number" text-anchor="middle">${house.number}</text>`;
    });
    result.natal.aspects.slice(0,12).forEach(aspect => {
      const a=result.natal.planets.find(p=>p.id===aspect.fromId),b=result.natal.planets.find(p=>p.id===aspect.toId);
      svg += line(xy(point(a.longitude,170)),xy(point(b.longitude,170)),[90,180].includes(aspect.angle)?'chart-aspect tension':'chart-aspect');
    });
    function markers(planets,radius,color) {
      const ordered = planets.slice().sort((a,b)=>a.longitude-b.longitude);
      const occupied=[];
      ordered.forEach(planet => {
        let labelLongitude=planet.longitude;
        for(let i=0;i<40&&occupied.some(l=>engine.angularDistance(l,labelLongitude)<13);i++)labelLongitude=(labelLongitude+3)%360;
        occupied.push(labelLongitude);
        const exact=xy(point(planet.longitude,radius-19)),label=xy(point(labelLongitude,radius));
        const glyph=meanings.planets[planet.id].glyph;
        svg += line(exact,label,'chart-pointer '+color);
        svg += `<circle cx="${exact[0]}" cy="${exact[1]}" r="2.6" class="chart-dot ${color}"/><circle cx="${label[0]}" cy="${label[1]}" r="12" class="chart-badge"/><text x="${label[0]}" y="${label[1]}" text-anchor="middle" dominant-baseline="middle" class="chart-planet ${color}">${esc(glyph)}<title>${esc(planet.name)} : ${esc(planet.degreeText)} ${esc(planet.sign)}${planet.indicative?' (indicatif à midi)':''}</title></text>`;
      });
    }
    markers(result.natal.planets,198,'natal'); markers(result.forecast.planets,255,'transit');
    if(result.natal.ascendant){const p=xy(point(base,335));svg+=`<text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle" class="chart-angle">ASC</text>`;}
    svg += '<circle cx="350" cy="350" r="50" class="chart-center"/><text x="350" y="345" text-anchor="middle" class="chart-center-text">VOTRE</text><text x="350" y="365" text-anchor="middle" class="chart-center-text">CIEL</text></svg>';
    $('astro-chart').innerHTML = svg;
  }
  function calculate(event) {
    event.preventDefault(); invalidate();
    try {
      const input = {...placeInput(),birthDate:$('astro-birth-date').value,birthTime:$('astro-unknown-time').checked?'':$('astro-birth-time').value,unknownTime:$('astro-unknown-time').checked,forecastDate:$('astro-forecast-date').value};
      if ($('astro-disambiguation').value) input.disambiguation=$('astro-disambiguation').value;
      const result = engine.calculate(input);
      context = input;
      $('astro-result-context').textContent = `${input.placeName} · Naissance le ${dateText(input.birthDate)}${input.unknownTime?' · Heure inconnue':' à '+input.birthTime} · ${input.timeZone}. Lecture du ${dateText(input.forecastDate)} à 12:00 dans ce fuseau.`;
      $('astro-warnings').hidden = !result.warnings.length;
      $('astro-warnings').innerHTML = result.warnings.map(warning=>`<p>${esc(warning)}</p>`).join('');
      renderChart(result); renderMeanings(result); renderAspects(result);
      $('astro-result').hidden = false;
      $('astro-status').textContent = 'Votre carte est calculée. Retrouvez la roue et ses explications ci-dessous.';
      window.dispatchEvent(new Event('astro:changed'));
      $('astro-result').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
      window.dispatchEvent(new Event('oracle:scroll-result'));
      notifyParentScroll('astro-result');
    } catch(error) {
      context = null;
      $('astro-status').textContent = error.message || 'Le calcul n’a pas abouti. Vérifiez les informations.';
      if(error.code === 'AMBIGUOUS_LOCAL_TIME') {
        const occurrences = error.details.occurrences || [];
        $('astro-time-choice').hidden=false;
        $('astro-disambiguation').innerHTML = '<option value="">Choisir l’occurrence…</option>' + occurrences.map((occurrence,index)=>`<option value="${index===0?'earlier':'later'}">${index===0?'Première':'Seconde'} occurrence — ${esc(occurrence.label)}</option>`).join('');
        $('astro-disambiguation').focus({preventScroll:true});
      }
    }
  }
  $('astro-forecast-date').value=today();
  $('astro-form').addEventListener('submit',calculate);
  $('astro-form').addEventListener('input',event=>{
    invalidate();
    if (event.target.id !== 'astro-disambiguation') resetTimeChoice();
    if (event.target.id === 'astro-city-query') clearPlace();
  });
  $('astro-form').addEventListener('change',event=>{
    invalidate();
    if(event.target.id==='astro-unknown-time'){$('astro-birth-time').disabled=event.target.checked;$('astro-birth-time').required=!event.target.checked;}
    if(event.target.id==='astro-country') clearPlace();
    if(event.target.id==='astro-place-select'){
      selectedPlace=displayedPlaces.get(event.target.value) || null; resetTimeChoice();
      $('astro-place-status').textContent = selectedPlace ? `${selectedPlace.name} · ${selectedPlace.timeZone.replace(/_/g,' ')} · ${selectedPlace.latitude}°, ${selectedPlace.longitude}°` : 'Choisissez un lieu de naissance.';
    }
    if(event.target.id==='astro-use-custom'){
      customMode(event.target.checked);
      resetTimeChoice();
    }
  });
  $('astro-city-query').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();searchPlace();}});
  $('astro-search-place').addEventListener('click',searchPlace);
  $('astro-result').querySelector('a[href="#summary-section"]')?.addEventListener('click',()=>{window.dispatchEvent(new Event('oracle:scroll-summary'));notifyParentScroll('summary-section');});
  $('astro-clear').addEventListener('click',()=>{
    $('astro-form').reset(); $('astro-forecast-date').value=today(); $('astro-country').value='CA';
    $('astro-birth-time').disabled=false; $('astro-birth-time').required=true;
    customMode(false);
    ['astro-result-context','astro-chart','astro-key-meanings','astro-elements','astro-planet-meanings','astro-natal-aspects','astro-transits','astro-forecast-positions','astro-warnings'].forEach(id=>{$(id).textContent='';});
    clearPlace(); $('astro-status').textContent='Vos informations de naissance ont été effacées.';
  });
  customMode(false); loadPlaces();
})();
