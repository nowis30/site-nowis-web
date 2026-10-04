(function (root, astronomyLibrary) {
  'use strict';

  // Astronomy Engine (MIT): https://github.com/cosinekitty/astronomy
  // GeoVector gives light-time corrected EQJ coordinates; Ecliptic converts them
  // to the true equinox/ecliptic of date. EclipticLongitude is heliocentric and
  // deliberately is NOT used for this geocentric tropical chart.
  const DAY = 86400000;
  const HOUR = 3600000;
  const RAD = Math.PI / 180;
  const SIGNS = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'];
  const ELEMENTS = ['Feu', 'Terre', 'Air', 'Eau'];
  const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const NAMES = { Sun: 'Soleil', Moon: 'Lune', Mercury: 'Mercure', Venus: 'Vénus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturne', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluton', Ascendant: 'Ascendant', Midheaven: 'Milieu du ciel' };
  const ASPECTS = [{ angle: 0, name: 'Conjonction', maxOrb: 3 }, { angle: 60, name: 'Sextile', maxOrb: 2 }, { angle: 90, name: 'Carré', maxOrb: 3 }, { angle: 120, name: 'Trigone', maxOrb: 3 }, { angle: 180, name: 'Opposition', maxOrb: 3 }];

  class AstroInputError extends Error {
    constructor(code, message, field, details) {
      super(message);
      this.name = 'AstroInputError';
      this.code = code;
      this.field = field || null;
      this.details = details || {};
    }
  }

  function fail(code, message, field, details) { throw new AstroInputError(code, message, field, details); }
  function normalize(value) { return ((value % 360) + 360) % 360; }
  function signedDifference(a, b) { return normalize(a - b + 180) - 180; }
  function angularDistance(a, b) { return Math.abs(signedDifference(a, b)); }
  function round(value, places) { const scale = Math.pow(10, places); return Math.round(value * scale) / scale; }

  function parseDate(value, field) {
    const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) fail('INVALID_DATE', 'Saisissez une date complète au format année-mois-jour.', field);
    const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
    const instant = new Date(Date.UTC(year, month - 1, day));
    if (year < 1900 || year > 2100 || instant.getUTCFullYear() !== year || instant.getUTCMonth() !== month - 1 || instant.getUTCDate() !== day) {
      fail('INVALID_DATE', 'Choisissez une date réelle entre 1900 et 2100.', field);
    }
    return { year, month, day, stamp: instant.getTime(), text: value };
  }

  function parseTime(value) {
    const match = typeof value === 'string' && /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || Number(match[3] || 0) > 59) {
      fail('INVALID_TIME', 'Saisissez une heure réelle de 00:00 à 23:59.', 'birthTime');
    }
    return { hour: Number(match[1]), minute: Number(match[2]), second: Number(match[3] || 0) };
  }

  function formatterFor(timeZone) {
    if (typeof timeZone !== 'string' || !timeZone || timeZone.length > 100 || !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)*$/.test(timeZone)) {
      fail('INVALID_TIME_ZONE', 'Choisissez un fuseau horaire reconnu, par exemple America/Toronto.', 'timeZone');
    }
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    } catch (error) {
      fail('INVALID_TIME_ZONE', 'Ce fuseau horaire n’est pas reconnu par votre navigateur.', 'timeZone');
    }
  }

  function localParts(formatter, instant) {
    const result = {};
    formatter.formatToParts(new Date(instant)).forEach(part => { if (part.type !== 'literal') result[part.type] = Number(part.value); });
    // hourCycle h23 avoids Intl's locale-dependent midnight-as-24 representation.
    if (result.hour === 24) result.hour = 0;
    return result;
  }

  function partsStamp(parts) { return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second); }

  function offsetLabel(minutes) {
    const seconds = Math.round(Math.abs(minutes) * 60);
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return 'UTC' + (minutes >= 0 ? '+' : '−') + String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + (remainder ? ':' + String(remainder).padStart(2, '0') : '');
  }

  /** Resolve a civil clock reading using the browser's historical IANA rules.
   * No implicit choice is made for an autumn clock repetition.
   * resolveLocalTime('2024-11-03', '01:30', 'America/Toronto') has two occurrences.
   */
  function resolveLocalTime(dateText, timeText, timeZone, disambiguation) {
    const date = parseDate(dateText, 'birthDate');
    const time = parseTime(timeText);
    const formatter = formatterFor(timeZone);
    if (disambiguation !== undefined && disambiguation !== null && disambiguation !== '' && !['earlier', 'later'].includes(disambiguation)) {
      fail('INVALID_DISAMBIGUATION', 'Choisissez la première ou la seconde occurrence de cette heure.', 'disambiguation');
    }
    const wanted = { year: date.year, month: date.month, day: date.day, hour: time.hour, minute: time.minute, second: time.second };
    const naive = partsStamp(wanted);
    const offsets = new Set();
    // Includes both sides of transitions, fractional-hour zones and historical
    // second-based offsets. Round-trip checks, rather than a current UTC offset,
    // establish which instants actually existed on the requested birth date.
    for (let step = -48; step <= 48; step += 6) {
      const stamp = naive + step * HOUR;
      offsets.add(partsStamp(localParts(formatter, stamp)) - stamp);
    }
    const found = new Map();
    offsets.forEach(offset => {
      const candidate = naive - offset;
      if (partsStamp(localParts(formatter, candidate)) === naive) {
        const offsetMinutes = offset / 60000;
        found.set(candidate, { utc: new Date(candidate).toISOString(), offsetMinutes, label: offsetLabel(offsetMinutes) });
      }
    });
    const occurrences = Array.from(found.entries()).sort((a, b) => a[0] - b[0]).map(entry => entry[1]);
    if (!occurrences.length) {
      fail('NONEXISTENT_LOCAL_TIME', 'Cette heure locale n’existait pas à cette date, lors d’un changement d’heure. Vérifiez l’heure inscrite sur votre acte de naissance.', 'birthTime', { date: dateText, time: timeText, timeZone });
    }
    const ambiguous = occurrences.length > 1;
    const selected = ambiguous ? (disambiguation === 'earlier' ? occurrences[0] : disambiguation === 'later' ? occurrences[occurrences.length - 1] : null) : occurrences[0];
    return { status: ambiguous ? 'ambiguous' : 'unique', utc: selected ? selected.utc : null, offsetMinutes: selected ? selected.offsetMinutes : null, occurrences, timeZone, date: dateText, time: timeText };
  }

  function selectedInstant(dateText, timeText, timeZone, disambiguation, field) {
    let resolution;
    try {
      resolution = resolveLocalTime(dateText, timeText, timeZone, disambiguation);
    } catch (error) {
      if (error instanceof AstroInputError && field === 'forecastDate' && error.code === 'NONEXISTENT_LOCAL_TIME') {
        fail(error.code, 'La date choisie n’existe pas à midi dans ce fuseau horaire. Choisissez une autre date.', field, error.details);
      }
      throw error;
    }
    if (!resolution.utc) {
      fail('AMBIGUOUS_LOCAL_TIME', 'Cette heure a eu lieu deux fois. Choisissez la première ou la seconde occurrence.', field || 'birthTime', { occurrences: resolution.occurrences, timeZone });
    }
    return resolution;
  }

  function astronomy() {
    const api = astronomyLibrary || root.Astronomy;
    if (!api || typeof api.GeoVector !== 'function' || typeof api.Ecliptic !== 'function') {
      fail('ENGINE_UNAVAILABLE', 'Le moteur de calcul du ciel est indisponible. Rechargez la page.', null);
    }
    return api;
  }

  function longitudeAt(body, instant) {
    const api = astronomy();
    return normalize(api.Ecliptic(api.GeoVector(api.Body[body], new Date(instant), true)).elon);
  }

  function signPosition(longitude) {
    const value = normalize(longitude);
    const signIndex = Math.floor(value / 30);
    // Keep full precision for classification: rounding 29.99999° to 30° must
    // never silently move an object into the following sign.
    const rawDegree = value - signIndex * 30;
    const wholeDegree = Math.floor(rawDegree);
    const minute = Math.min(59, Math.floor((rawDegree - wholeDegree) * 60));
    return { longitude: value, signIndex, sign: SIGNS[signIndex], element: ELEMENTS[signIndex % 4], degree: rawDegree, degreeText: wholeDegree + '° ' + String(minute).padStart(2, '0') + '′' };
  }

  function planetaryPositions(instant) {
    const api = astronomy();
    return BODIES.map(body => {
      const coordinates = api.Ecliptic(api.GeoVector(api.Body[body], new Date(instant), true));
      const speed = signedDifference(longitudeAt(body, instant + 3 * HOUR), longitudeAt(body, instant - 3 * HOUR)) / 0.25;
      return Object.assign({ id: body, name: NAMES[body], latitude: coordinates.elat, speed, retrograde: speed < -0.00001, stationary: Math.abs(speed) <= 0.00001, uncertain: false, possibleSigns: [] }, signPosition(coordinates.elon));
    });
  }

  /** Ecliptic/horizon plane intersection, selecting the eastern (rising) point.
   * The mean-obliquity shortcut is avoided: use the actual true-of-date rotation.
   * Independently test this point using EquatorFromVector + Horizon, and the
   * USNO's sidereal/altitude formulas (see scripts/astro-engine.test.cjs).
   */
  function chartAngles(instant, latitude, longitude) {
    const api = astronomy();
    const date = new Date(instant);
    const time = api.MakeTime(date);
    const rotation = api.Rotation_ECT_EQD(time);
    const eclipticX = api.RotateVector(rotation, new api.Vector(1, 0, 0, time));
    const eclipticY = api.RotateVector(rotation, new api.Vector(0, 1, 0, time));
    const theta = normalize(api.SiderealTime(date) * 15 + longitude) * RAD;
    const phi = latitude * RAD;
    const zenith = [Math.cos(phi) * Math.cos(theta), Math.cos(phi) * Math.sin(theta), Math.sin(phi)];
    const east = [-Math.sin(theta), Math.cos(theta), 0];
    const dot = (a, b) => a[0] * b.x + a[1] * b.y + a[2] * b.z;
    const a = dot(zenith, eclipticX);
    const b = dot(zenith, eclipticY);
    if (Math.abs(latitude) >= 89.999999 || Math.hypot(a, b) < 1e-10) {
      return { ascendant: null, midheaven: null, houses: [], reason: 'Les angles du thème sont indéfinis à ce lieu ou à cet instant.' };
    }
    let lambda = Math.atan2(-a, b);
    const eastDot = dot(east, eclipticX) * Math.cos(lambda) + dot(east, eclipticY) * Math.sin(lambda);
    if (Math.abs(eastDot) < 1e-10) {
      return { ascendant: null, midheaven: null, houses: [], reason: 'Le point de lever n’est pas défini de façon stable à cet instant.' };
    }
    if (eastDot < 0) lambda += Math.PI;
    const ascendant = Object.assign({ id: 'Ascendant', name: NAMES.Ascendant }, signPosition(lambda / RAD));
    // The MC is on the upper meridian: its equatorial RA equals local sidereal
    // time. At extreme latitudes this meridian point can be below the horizon.
    const obliquity = Math.atan2(eclipticY.z, eclipticY.y);
    const midheaven = Object.assign({ id: 'Midheaven', name: NAMES.Midheaven }, signPosition(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(obliquity)) / RAD));
    const houses = Array.from({ length: 12 }, (_, index) => Object.assign({ number: index + 1 }, signPosition(ascendant.longitude + index * 30)));
    return { ascendant, midheaven, houses, reason: null };
  }

  function houseFor(longitude, ascendant) {
    if (!ascendant) return null;
    const fraction = normalize(longitude - ascendant.longitude) / 30;
    // Subtracting/wrapping floating-point cusp longitudes can turn exactly 30°
    // into 29.99999999999994°. Snap only arithmetic noise (below 3e-9 degrees).
    const nearestCusp = Math.round(fraction);
    const stableFraction = Math.abs(fraction - nearestCusp) < 1e-10 ? nearestCusp : fraction;
    return (Math.floor(stableFraction) % 12) + 1;
  }

  function localDayBounds(dateText, timeZone, noonInstant) {
    const formatter = formatterFor(timeZone);
    const wanted = parseDate(dateText, 'birthDate');
    const isDay = instant => { const p = localParts(formatter, instant); return p.year === wanted.year && p.month === wanted.month && p.day === wanted.day; };
    let startInside = noonInstant; let endInside = noonInstant;
    while (isDay(startInside - HOUR)) startInside -= HOUR;
    while (isDay(endInside + HOUR)) endInside += HOUR;
    function boundary(outside, inside) {
      // Integer milliseconds maintain a strict real-time boundary, including
      // 23/25-hour local dates and a transition occurring at midnight.
      while (Math.abs(inside - outside) > 1) {
        const mid = Math.floor((inside + outside) / 2);
        if (isDay(mid)) inside = mid; else outside = mid;
      }
      return inside;
    }
    return { start: boundary(startInside - HOUR, startInside), end: boundary(endInside + HOUR, endInside) };
  }

  function addUnknownTimeRanges(planets, dateText, timeZone, noonInstant) {
    const bounds = localDayBounds(dateText, timeZone, noonInstant);
    const samples = [];
    for (let instant = bounds.start; instant <= bounds.end; instant += HOUR / 2) samples.push(instant);
    if (samples[samples.length - 1] !== bounds.end) samples.push(bounds.end);
    planets.forEach(planet => {
      let minimum = Infinity; let maximum = -Infinity;
      samples.forEach(instant => {
        const value = signedDifference(longitudeAt(planet.id, instant), planet.longitude);
        minimum = Math.min(minimum, value); maximum = Math.max(maximum, value);
      });
      const firstSign = Math.floor((planet.longitude + minimum) / 30);
      const lastSign = Math.floor((planet.longitude + maximum) / 30);
      const possibleSigns = [];
      for (let index = firstSign; index <= lastSign; index += 1) possibleSigns.push(SIGNS[((index % 12) + 12) % 12]);
      planet.possibleSigns = possibleSigns;
      planet.uncertaintyDegrees = Math.max(Math.abs(minimum), Math.abs(maximum));
      planet.longitudeRange = { start: normalize(planet.longitude + minimum), end: normalize(planet.longitude + maximum), width: maximum - minimum };
      planet.uncertain = planet.id === 'Moon' || planet.possibleSigns.length > 1 || planet.uncertaintyDegrees > 1;
      planet.indicative = true;
      planet.house = null;
    });
    return { startUtc: new Date(bounds.start).toISOString(), endUtc: new Date(bounds.end).toISOString(), samplingMinutes: 30 };
  }

  function compareTransits(natal, forecast) {
    const targets = natal.planets.filter(planet => !planet.uncertain).concat(natal.timeKnown && natal.ascendant ? [natal.ascendant, natal.midheaven] : []);
    const transits = [];
    forecast.planets.forEach(planet => targets.forEach(target => {
      const distance = angularDistance(planet.longitude, target.longitude);
      ASPECTS.forEach(aspect => {
        const orb = Math.abs(distance - aspect.angle);
        // Unknown birth time cannot support an aspect that only fits for the
        // noon guess: keep it only when the whole sampled natal range fits.
        const uncertainty = natal.timeKnown ? 0 : (target.uncertaintyDegrees || 0);
        if (orb + uncertainty <= aspect.maxOrb) {
          transits.push({ transitId: planet.id, transitName: planet.name, natalId: target.id, natalName: target.name, angle: aspect.angle, aspect: aspect.name, orb: round(orb, 4), maxOrb: aspect.maxOrb, separation: round(distance, 4), natalHouse: target.house || null, transitHouse: natal.timeKnown ? houseFor(planet.longitude, natal.ascendant) : null, retrograde: planet.retrograde });
        }
      });
    }));
    return transits.sort((a, b) => a.orb - b.orb || a.transitId.localeCompare(b.transitId) || a.natalId.localeCompare(b.natalId));
  }

  function natalAspects(planets, timeKnown) {
    const eligible = planets.filter(planet => !planet.uncertain);
    const aspects = [];
    eligible.forEach((from, index) => eligible.slice(index + 1).forEach(to => {
      const separation = angularDistance(from.longitude, to.longitude);
      ASPECTS.forEach(aspect => {
        const orb = Math.abs(separation - aspect.angle);
        const maxOrb = aspect.angle === 0 || aspect.angle === 180 ? 5 : aspect.angle === 60 ? 3 : 4;
        const uncertainty = timeKnown ? 0 : (from.uncertaintyDegrees || 0) + (to.uncertaintyDegrees || 0);
        if (orb + uncertainty <= maxOrb) aspects.push({ fromId: from.id, fromName: from.name, toId: to.id, toName: to.name, angle: aspect.angle, aspect: aspect.name, orb: round(orb, 4), maxOrb, separation: round(separation, 4) });
      });
    }));
    return aspects.sort((a, b) => a.orb - b.orb || a.fromId.localeCompare(b.fromId) || a.toId.localeCompare(b.toId));
  }

  /** calculate({birthDate,birthTime,unknownTime,latitude,longitude,timeZone,forecastDate,disambiguation?})
   * All computations are local; this module performs no network/storage calls.
   * Forecast is a snapshot at 12:00 in the explicitly selected birth timezone.
   */
  function calculate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('INVALID_INPUT', 'Complétez les informations de naissance.', null);
    parseDate(input.birthDate, 'birthDate');
    parseDate(input.forecastDate, 'forecastDate');
    if (typeof input.latitude !== 'number' || !Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) fail('INVALID_COORDINATES', 'La latitude doit être comprise entre −90° et 90°.', 'latitude');
    if (typeof input.longitude !== 'number' || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) fail('INVALID_COORDINATES', 'La longitude doit être comprise entre −180° et 180°.', 'longitude');
    if (input.unknownTime !== undefined && typeof input.unknownTime !== 'boolean') fail('INVALID_INPUT', 'Indiquez si votre heure de naissance est connue.', 'unknownTime');
    formatterFor(input.timeZone);
    const timeKnown = !input.unknownTime;
    const birth = selectedInstant(input.birthDate, timeKnown ? input.birthTime : '12:00', input.timeZone, timeKnown ? input.disambiguation : undefined, 'birthTime');
    const forecastResolution = selectedInstant(input.forecastDate, '12:00', input.timeZone, undefined, 'forecastDate');
    const birthInstant = Date.parse(birth.utc);
    const forecastInstant = Date.parse(forecastResolution.utc);
    const natalPlanets = planetaryPositions(birthInstant);
    const angles = timeKnown ? chartAngles(birthInstant, input.latitude, input.longitude) : { ascendant: null, midheaven: null, houses: [], reason: 'L’heure de naissance est inconnue : aucun ascendant, milieu du ciel ou maison n’est calculé.' };
    natalPlanets.forEach(planet => { planet.house = timeKnown ? houseFor(planet.longitude, angles.ascendant) : null; planet.possibleSigns = [planet.sign]; });
    const dayRange = timeKnown ? null : addUnknownTimeRanges(natalPlanets, input.birthDate, input.timeZone, birthInstant);
    const natal = { utc: birth.utc, timeKnown, planets: natalPlanets, ascendant: angles.ascendant, midheaven: angles.midheaven, houses: angles.houses, aspects: natalAspects(natalPlanets, timeKnown), anglesUnavailableReason: angles.reason, dayRange, offsetMinutes: birth.offsetMinutes, localDate: input.birthDate, localTime: timeKnown ? input.birthTime : '12:00' };
    const forecast = { utc: forecastResolution.utc, planets: planetaryPositions(forecastInstant), localDate: input.forecastDate, localTime: '12:00', offsetMinutes: forecastResolution.offsetMinutes, timeZone: input.timeZone };
    const warnings = [];
    if (!timeKnown) warnings.push('Les positions de naissance sont indicatives, calculées à midi. Les signes pouvant changer pendant la journée sont signalés. La Lune et les points trop incertains sont exclus des transits.');
    if (angles.reason) warnings.push(angles.reason);
    return { natal, forecast, transits: compareTransits(natal, forecast), warnings, location: { latitude: input.latitude, longitude: input.longitude, timeZone: input.timeZone }, methodology: { zodiac: 'tropical', coordinates: 'géocentriques, écliptique vraie de date', houseSystem: 'Maisons égales de 30° à partir de l’ascendant', forecastTime: '12:00 dans le fuseau choisi pour le lieu de naissance', engine: 'Astronomy Engine', localTimeRules: 'Données historiques IANA fournies par Intl dans le navigateur', aspectOrbs: ASPECTS.map(aspect => ({ angle: aspect.angle, maxOrb: aspect.maxOrb })), scientificNote: 'Les positions célestes sont calculées. Leur interprétation astrologique est symbolique et ne constitue pas une prédiction établie.' } };
  }

  const api = Object.freeze({ calculate, resolveLocalTime, signPosition, angularDistance, houseFor, AstroInputError, signs: SIGNS.slice(), elements: ELEMENTS.slice(), bodies: BODIES.slice() });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ASTRO_ENGINE = api;
})(typeof window !== 'undefined' ? window : globalThis, typeof module === 'object' && module.exports ? require('./vendor/astronomy.browser.min.js') : null);
