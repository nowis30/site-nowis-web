(function(root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./astro-engine.js') : root.ASTRO_ENGINE, typeof module === 'object' && module.exports ? require('./vendor/astronomy.browser.min.js') : root.Astronomy);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.ORACLE_EXPLORE = api;
})(typeof window !== 'undefined' ? window : globalThis, function(sky, astronomy) {
  'use strict';
  const DAY = 86400000;
  function dateParts(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Saisissez une date complète.');
    const d = new Date(value + 'T12:00:00Z');
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== value || +value.slice(0,4) < 1900 || +value.slice(0,4) > 2100) throw new Error('Choisissez une date valide entre 1900 et 2100.');
    return value.split('-').map(Number);
  }
  function reduce(n, masters = true) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error('Nombre invalide.');
    const steps = [n];
    while (n > 9 && !(masters && [11,22,33].includes(n))) { n = String(n).split('').reduce((a,b)=>a+Number(b),0); steps.push(n); }
    return { value:n, steps };
  }
  function letters(name) {
    if (typeof name !== 'string' || name.length > 160) throw new Error('Le nom doit contenir au plus 160 caractères.');
    const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/gi,'oe').replace(/æ/gi,'ae').toUpperCase();
    if (/[^A-Z '\-’]/.test(normalized)) throw new Error('Cette méthode utilise les lettres A à Z. Saisissez une translittération latine, sans chiffres.');
    const result = normalized.replace(/[^A-Z]/g,'');
    if (!result) throw new Error('Saisissez au moins une lettre.');
    return result;
  }
  function nameNumber(name, mode = 'all', yVowel = false) {
    const vowels = yVowel ? 'AEIOUY' : 'AEIOU';
    const selected = letters(name).split('').filter(c=>mode==='all'||(mode==='vowels'?vowels.includes(c):!vowels.includes(c)));
    if (!selected.length) return null;
    const values = selected.map(c=>(c.charCodeAt(0)-65)%9+1);
    return {...reduce(values.reduce((a,b)=>a+b,0)), letters:selected.join(''), values};
  }
  function numerology(input) {
    const birth = dateParts(input.birthDate), day = dateParts(input.date);
    const parts = birth.map(n=>reduce(n).value);
    const life = {...reduce(parts.reduce((a,b)=>a+b,0)), parts};
    const year = reduce(reduce(birth[1],false).value+reduce(birth[2],false).value+reduce(day[0],false).value,false);
    const month = reduce(year.value+day[1],false), personalDay = reduce(month.value+day[2],false);
    return {life,year,month,day:personalDay,expression:input.name?nameNumber(input.name):null,soul:input.name?nameNumber(input.name,'vowels',input.yVowel):null,personality:input.name?nameNumber(input.name,'consonants',input.yVowel):null};
  }
  function synastry(a,b) {
    const first = sky.calculate(a).natal, second = sky.calculate(b).natal;
    const aspects = [];
    first.planets.filter(p=>!p.uncertain).forEach(p=>second.planets.filter(q=>!q.uncertain).forEach(q=>{
      const distance = sky.angularDistance(p.longitude,q.longitude);
      [0,60,90,120,180].forEach(angle=>{
        const orb = Math.abs(distance-angle), limit = angle===60?3:5;
        if (orb+(first.timeKnown?0:p.uncertaintyDegrees||0)+(second.timeKnown?0:q.uncertaintyDegrees||0)<=limit) aspects.push({first:p,second:q,angle,orb});
      });
    }));
    return {first,second,aspects:aspects.sort((x,y)=>x.orb-y.orb)};
  }
  function moon(date) {
    dateParts(date);
    const start = new Date(date+'T00:00:00Z'), midday = new Date(date+'T12:00:00Z');
    const phase = astronomy.MoonPhase(midday);
    const illumination = astronomy.Illumination(astronomy.Body.Moon,midday).phase_fraction;
    const names = ['Nouvelle Lune','Premier quartier','Pleine Lune','Dernier quartier'];
    const events = [0,90,180,270].map((angle,i)=>({name:names[i],angle,utc:astronomy.SearchMoonPhase(angle,start,40).date.toISOString()})).sort((a,b)=>a.utc.localeCompare(b.utc));
    return {phase,illumination,events,sign:sky.planetaryPositions(midday.getTime()).find(p=>p.id==='Moon')};
  }
  function solarReturn(input,year) {
    if (!Number.isInteger(year)||year<1901||year>2099) throw new Error('Choisissez une année de 1901 à 2099.');
    const natal = sky.calculate(input).natal;
    if (!natal.timeKnown) throw new Error('Une heure de naissance connue est nécessaire pour calculer ce retour précis.');
    const target = natal.planets.find(p=>p.id==='Sun').longitude;
    const [,month,day] = dateParts(input.birthDate);
    const center = Date.UTC(year,month-1,day,12);
    const difference = instant => ((sky.planetaryPositions(instant).find(p=>p.id==='Sun').longitude-target+540)%360)-180;
    let lo=center-4*DAY, hi=center+4*DAY;
    if (difference(lo)>0||difference(hi)<0) throw new Error('Le retour solaire n’a pas pu être encadré.');
    while (hi-lo>1000) {const mid=(lo+hi)/2;if(difference(mid)<0)lo=mid;else hi=mid;}
    const instant = (lo+hi)/2;
    return {utc:new Date(instant).toISOString(),planets:sky.planetaryPositions(instant),angles:sky.chartAngles(instant,input.latitude,input.longitude),error:Math.abs(difference(instant))};
  }
  return Object.freeze({dateParts,reduce,letters,nameNumber,numerology,synastry,moon,solarReturn});
});
