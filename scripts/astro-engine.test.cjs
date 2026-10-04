const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Astronomy = require('../public/tarot-reader/vendor/astronomy.browser.min.js');
const engine = require('../public/tarot-reader/astro-engine.js');

const base = { birthDate: '2000-01-01', birthTime: '12:00', unknownTime: false, latitude: 51.4779, longitude: 0, timeZone: 'UTC', forecastDate: '2026-10-04' };
const calculate = (overrides = {}) => engine.calculate({ ...base, ...overrides });
const close = (actual, expected, tolerance, label) => assert.ok(engine.angularDistance(actual, expected) <= tolerance, `${label}: ${actual}, expected ${expected} ± ${tolerance}°`);
const rejects = (code, fn) => assert.throws(fn, error => error instanceof engine.AstroInputError && error.code === code);

// Independently retrieved on 2026-10-04 from NASA/JPL Horizons, DE441,
// CENTER='500@399', EPHEM_TYPE='OBSERVER', QUANTITIES='31', at UTC J2000.
// https://ssd-api.jpl.nasa.gov/doc/horizons.html
// https://ssd.jpl.nasa.gov/horizons/manual.html#obsquan
// The slight true-of-date / IAU76/80 model differences require a realistic
// 0.02° tolerance; this is NOT a comparison to the same engine's own results.
const jplJ2000 = { Sun: 280.3689092, Moon: 223.3237860, Mercury: 271.8892699, Venus: 241.5657794, Mars: 327.9632921, Jupiter: 25.2530685, Saturn: 40.3956366, Uranus: 314.8091680, Neptune: 303.1930007, Pluto: 251.4547644 };

test('all ten apparent geocentric tropical longitudes agree with independent JPL DE441', () => {
  const chart = calculate();
  assert.equal(chart.natal.planets.length, 10);
  for (const planet of chart.natal.planets) {
    close(planet.longitude, jplJ2000[planet.id], 0.02, planet.id);
    assert.ok(Number.isFinite(planet.latitude));
    assert.ok(planet.degree >= 0 && planet.degree < 30);
    assert.equal(planet.sign, engine.signs[planet.signIndex]);
    assert.equal(planet.element, engine.elements[planet.signIndex % 4]);
  }
});

test('ascendant and MC agree with independent USNO sidereal time and analytic geometry', () => {
  // USNO API, UTC/UT1=2000-01-01 12:00:00, longitude=0:
  // GAST=18:41:49.6974. Its simple obliquity formula gives 23.4393°.
  // https://aa.usno.navy.mil/api/siderealtime?date=2000-01-01&time=12:00:00&coords=51.4779,0&reps=1&intv_mag=1&intv_unit=hours
  // https://aa.usno.navy.mil/faq/GAST
  // Solving the eastern ecliptic/horizon intersection with these independent
  // inputs gives ASC=24.2685214672°, MC=279.6109720091° at Greenwich.
  const chart = calculate();
  close(chart.natal.ascendant.longitude, 24.26852146719625, 0.01, 'ASC');
  close(chart.natal.midheaven.longitude, 279.6109720091131, 0.01, 'MC');
});

test('ascendant is on the eastern horizon and rising, in both hemispheres and polar latitudes', () => {
  for (const [latitude, longitude, birthTime] of [[45.5017, -73.5673, '00:00'], [-33.8688, 151.2093, '12:00'], [0, 0, '06:00'], [69.6492, 18.9553, '20:00'], [-70, 0, '12:00']]) {
    const chart = calculate({ latitude, longitude, birthTime });
    const time = new Date(chart.natal.utc);
    const lambda = chart.natal.ascendant.longitude * Math.PI / 180;
    const vector = new Astronomy.Vector(Math.cos(lambda), Math.sin(lambda), 0, Astronomy.MakeTime(time));
    const eqd = Astronomy.RotateVector(Astronomy.Rotation_ECT_EQD(time), vector);
    const equator = Astronomy.EquatorFromVector(eqd);
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    const horizontal = Astronomy.Horizon(time, observer, equator.ra, equator.dec, null);
    assert.ok(Math.abs(horizontal.altitude) < 1e-8, `ASC altitude=${horizontal.altitude}`);
    assert.ok(horizontal.azimuth > 0 && horizontal.azimuth < 180, `ASC azimuth=${horizontal.azimuth}`);
    const after = Astronomy.Horizon(new Date(time.getTime() + 1000), observer, equator.ra, equator.dec, null);
    assert.ok(after.altitude > horizontal.altitude, 'eastern horizon point must rise as Earth rotates');
    const mcLambda = chart.natal.midheaven.longitude * Math.PI / 180;
    const mcVector = Astronomy.RotateVector(Astronomy.Rotation_ECT_EQD(time), new Astronomy.Vector(Math.cos(mcLambda), Math.sin(mcLambda), 0, Astronomy.MakeTime(time)));
    const mcEquator = Astronomy.EquatorFromVector(mcVector);
    close(mcEquator.ra * 15, Astronomy.SiderealTime(time) * 15 + longitude, 1e-8, 'MC right ascension');
  }
});

test('equal houses start exactly at the ascendant and place boundary planets correctly', () => {
  const chart = calculate();
  const asc = chart.natal.ascendant;
  assert.equal(chart.natal.houses.length, 12);
  chart.natal.houses.forEach((house, index) => {
    assert.equal(house.number, index + 1);
    close(house.longitude, asc.longitude + index * 30, 1e-9, 'equal house cusp');
    assert.equal(engine.houseFor(house.longitude, asc), house.number);
  });
  for (let longitude = 0.12345; longitude < 360; longitude += 1.27131) {
    const arbitraryAsc = { longitude };
    for (let house = 1; house <= 12; house += 1) {
      const cusp = engine.signPosition(longitude + (house - 1) * 30).longitude;
      assert.equal(engine.houseFor(cusp, arbitraryAsc), house, 'wrapped cusp must not fall into the preceding house');
      assert.equal(engine.houseFor(cusp - 0.000001, arbitraryAsc), house === 1 ? 12 : house - 1);
    }
  }
  assert.equal(engine.houseFor(asc.longitude, asc), 1);
  assert.equal(engine.houseFor(asc.longitude - 0.000001, asc), 12);
  assert.equal(engine.houseFor(asc.longitude + 30, asc), 2);
  assert.equal(engine.houseFor(asc.longitude + 180, asc), 7);
  assert.match(chart.methodology.houseSystem, /Maisons égales/);
});

test('sign cusps and zero crossing preserve exact classification', () => {
  assert.equal(engine.signPosition(29.99999999).sign, 'Bélier');
  assert.equal(engine.signPosition(29.99999999).degreeText, '29° 59′');
  assert.equal(engine.signPosition(30).sign, 'Taureau');
  assert.equal(engine.signPosition(359.99999).sign, 'Poissons');
  assert.equal(engine.signPosition(360).sign, 'Bélier');
  assert.equal(engine.signPosition(-1).sign, 'Poissons');
  assert.equal(engine.angularDistance(359, 1), 2);
});

test('Toronto and Montréal spring gaps are rejected and autumn repetitions need explicit choices', () => {
  for (const zone of ['America/Toronto', 'America/Montreal']) {
    rejects('NONEXISTENT_LOCAL_TIME', () => engine.resolveLocalTime('2024-03-10', '02:30', zone));
    const unresolved = engine.resolveLocalTime('2024-11-03', '01:30', zone);
    assert.equal(unresolved.status, 'ambiguous');
    assert.equal(unresolved.utc, null);
    assert.deepEqual(unresolved.occurrences.map(item => item.utc), ['2024-11-03T05:30:00.000Z', '2024-11-03T06:30:00.000Z']);
    assert.equal(engine.resolveLocalTime('2024-11-03', '01:30', zone, 'earlier').utc, '2024-11-03T05:30:00.000Z');
    assert.equal(engine.resolveLocalTime('2024-11-03', '01:30', zone, 'later').utc, '2024-11-03T06:30:00.000Z');
    rejects('AMBIGUOUS_LOCAL_TIME', () => calculate({ birthDate: '2024-11-03', birthTime: '01:30', timeZone: zone }));
    assert.equal(calculate({ birthDate: '2024-11-03', birthTime: '01:30', timeZone: zone, disambiguation: 'later' }).natal.utc, '2024-11-03T06:30:00.000Z');
  }
});

test('Paris conversion uses DST on the birth date, including historical second offsets', () => {
  rejects('NONEXISTENT_LOCAL_TIME', () => engine.resolveLocalTime('2024-03-31', '02:30', 'Europe/Paris'));
  assert.deepEqual(engine.resolveLocalTime('2024-10-27', '02:30', 'Europe/Paris').occurrences.map(item => item.utc), ['2024-10-27T00:30:00.000Z', '2024-10-27T01:30:00.000Z']);
  assert.equal(engine.resolveLocalTime('1900-01-01', '12:00', 'Europe/Paris').utc, '1900-01-01T11:50:39.000Z');
  assert.equal(engine.resolveLocalTime('2000-01-01', '00:00', 'Europe/Paris').utc, '1999-12-31T23:00:00.000Z');
  assert.equal(engine.resolveLocalTime('2024-07-01', '00:00', 'Asia/Kathmandu').utc, '2024-06-30T18:15:00.000Z');
});

test('unknown time never produces angles, houses or Moon-based transits', () => {
  const chart = calculate({ unknownTime: true, birthTime: '' });
  assert.equal(chart.natal.timeKnown, false);
  assert.equal(chart.natal.ascendant, null);
  assert.equal(chart.natal.midheaven, null);
  assert.deepEqual(chart.natal.houses, []);
  assert.equal(chart.natal.localTime, '12:00');
  assert.ok(chart.natal.planets.every(planet => planet.house === null && planet.indicative));
  assert.ok(chart.transits.every(transit => !['Moon', 'Ascendant', 'Midheaven'].includes(transit.natalId)));
  assert.ok(chart.natal.aspects.every(aspect => aspect.fromId !== 'Moon' && aspect.toId !== 'Moon'));
  const moon = chart.natal.planets.find(planet => planet.id === 'Moon');
  assert.equal(moon.uncertain, true);
  assert.ok(moon.uncertaintyDegrees > 5);
});

test('unknown time exposes all possible signs on an equinox date and omits uncertain targets', () => {
  const chart = calculate({ unknownTime: true, birthDate: '2024-03-20' });
  const sun = chart.natal.planets.find(planet => planet.id === 'Sun');
  assert.deepEqual(sun.possibleSigns, ['Poissons', 'Bélier']);
  assert.equal(sun.uncertain, true);
  assert.ok(chart.transits.every(transit => transit.natalId !== 'Sun'));
  const birthTargets = new Map(chart.natal.planets.map(planet => [planet.id, planet]));
  assert.ok(chart.transits.every(transit => transit.orb + birthTargets.get(transit.natalId).uncertaintyDegrees <= transit.maxOrb + 0.00005));
});

test('unknown-time day ranges cover the real 23/25-hour civil day, including midnight jumps', () => {
  const spring = calculate({ birthDate: '2024-03-10', unknownTime: true, timeZone: 'America/Toronto' });
  const autumn = calculate({ birthDate: '2024-11-03', unknownTime: true, timeZone: 'America/Toronto' });
  assert.equal(Date.parse(spring.natal.dayRange.endUtc) - Date.parse(spring.natal.dayRange.startUtc) + 1, 23 * 3600000);
  assert.equal(Date.parse(autumn.natal.dayRange.endUtc) - Date.parse(autumn.natal.dayRange.startUtc) + 1, 25 * 3600000);
  const midnightGap = calculate({ birthDate: '2018-11-04', unknownTime: true, timeZone: 'America/Sao_Paulo' });
  assert.equal(midnightGap.natal.dayRange.startUtc, '2018-11-04T03:00:00.000Z');
  assert.equal(Date.parse(midnightGap.natal.dayRange.endUtc) - Date.parse(midnightGap.natal.dayRange.startUtc) + 1, 23 * 3600000);
  rejects('NONEXISTENT_LOCAL_TIME', () => calculate({ birthDate: '2011-12-30', unknownTime: true, timeZone: 'Pacific/Apia' }));
});

test('forecast is noon in the chosen IANA zone on the requested date', () => {
  const chart = calculate({ timeZone: 'America/Toronto', forecastDate: '2024-07-01' });
  assert.equal(chart.forecast.utc, '2024-07-01T16:00:00.000Z');
  assert.equal(chart.forecast.localTime, '12:00');
  assert.equal(chart.forecast.offsetMinutes, -240);
  assert.equal(calculate({ timeZone: 'America/Toronto', forecastDate: '2024-01-01' }).forecast.utc, '2024-01-01T17:00:00.000Z');
});

test('retrogradation is computed from geocentric motion and every aspect has a bounded orb', () => {
  const chart = calculate({ birthDate: '2024-04-10' });
  assert.equal(chart.natal.planets.find(planet => planet.id === 'Mercury').retrograde, true);
  assert.equal(chart.natal.planets.find(planet => planet.id === 'Sun').retrograde, false);
  assert.equal(chart.natal.planets.find(planet => planet.id === 'Moon').retrograde, false);
  assert.ok(chart.transits.length > 0);
  for (const transit of chart.transits) {
    assert.ok([0, 60, 90, 120, 180].includes(transit.angle));
    assert.ok(transit.orb >= 0 && transit.orb <= transit.maxOrb);
    assert.ok(transit.maxOrb >= 2 && transit.maxOrb <= 3);
    assert.equal('probability' in transit, false);
  }
});

test('invalid dates, clocks, zones and coordinates fail clearly instead of inventing a chart', () => {
  for (const birthDate of ['2023-02-29', '2000-02-30', '1899-12-31', '2101-01-01', '2000-13-01', '01/01/2000']) rejects('INVALID_DATE', () => calculate({ birthDate }));
  for (const birthTime of ['24:00', '12:60', 'ab:cd', '', '1:00']) rejects('INVALID_TIME', () => calculate({ birthTime }));
  for (const latitude of [91, -91, Infinity, NaN, '', null]) rejects('INVALID_COORDINATES', () => calculate({ latitude }));
  for (const longitude of [181, -181, NaN, null]) rejects('INVALID_COORDINATES', () => calculate({ longitude }));
  for (const timeZone of ['Europe/DoesNotExist', '+05:00', '', null]) rejects('INVALID_TIME_ZONE', () => calculate({ timeZone }));
  rejects('INVALID_DISAMBIGUATION', () => calculate({ disambiguation: 'compatible' }));
  rejects('INVALID_INPUT', () => calculate({ unknownTime: 'yes' }));
  rejects('INVALID_INPUT', () => engine.calculate(null));
  assert.equal(calculate({ birthDate: '2000-02-29' }).natal.localDate, '2000-02-29');
});

test('geographic poles give an explicit unavailable state and never a fabricated ascendant', () => {
  for (const latitude of [-90, 90]) {
    const chart = calculate({ latitude });
    assert.equal(chart.natal.ascendant, null);
    assert.equal(chart.natal.midheaven, null);
    assert.deepEqual(chart.natal.houses, []);
    assert.match(chart.natal.anglesUnavailableReason, /indéfinis/);
    assert.ok(chart.transits.every(transit => !['Ascendant', 'Midheaven'].includes(transit.natalId)));
  }
});

test('browser global contract matches CommonJS and performs no network or storage I/O', () => {
  const calls = [];
  const context = vm.createContext({ window: { Astronomy }, Intl, Date, fetch: () => { calls.push('fetch'); throw new Error('Network must not be used'); }, localStorage: { getItem: () => { calls.push('storage'); throw new Error('Storage must not be used'); } } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/tarot-reader/astro-engine.js'), 'utf8'), context);
  assert.equal(typeof context.window.ASTRO_ENGINE.calculate, 'function');
  const chart = context.window.ASTRO_ENGINE.calculate(base);
  close(chart.natal.planets[0].longitude, calculate().natal.planets[0].longitude, 1e-10, 'browser/commonjs');
  assert.deepEqual(calls, []);
});
