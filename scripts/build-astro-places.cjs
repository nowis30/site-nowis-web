#!/usr/bin/env node
'use strict';

// Build-time GeoNames import. The website serves the generated JSON locally;
// this script and GeoNames are never contacted with a visitor's birth details.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

const projectRoot = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
function option(name, fallback) {
  const index = argv.indexOf(name);
  if (index < 0) return fallback;
  if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`Missing value for ${name}`);
  return argv[index + 1];
}
const inputDir = path.resolve(option('--input-dir', path.join(projectRoot, '..', 'astro-geography')));
const outputDir = path.resolve(option('--output-dir', path.join(projectRoot, 'public', 'tarot-reader', 'astro-places')));
const generatedAt = option('--generated-at', new Date().toISOString());
if (!Number.isFinite(Date.parse(generatedAt))) throw new Error('Invalid --generated-at');

const sourceBase = 'https://download.geonames.org/export/dump/';
const sourceNames = ['cities1000.zip', 'countryInfo.txt', 'admin1CodesASCII.txt', 'admin2Codes.txt', 'readme.txt'];
const displayNames = new Intl.DisplayNames('fr', { type: 'region', fallback: 'code' });
const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
const zoneStatus = new Map();

function normalizeName(value) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replace(/[’'`\-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function isValidZone(zone) {
  if (!zoneStatus.has(zone)) {
    try {
      new Intl.DateTimeFormat('fr', { timeZone: zone }).format(0);
      zoneStatus.set(zone, true);
    } catch (_) {
      zoneStatus.set(zone, false);
    }
  }
  return zoneStatus.get(zone);
}

function editDistance(left, right) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++) {
      current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[right.length];
}

// These variants are only retained when they actually occur in the GeoNames
// alternate-name column. Prefer recognisable French search names over codes.
const preferredFrenchAliases = new Set([
  'Londres', 'Moscou', 'Pékin', 'Pekin', 'Munich', 'Rome', 'Florence', 'Venise', 'Naples',
  'Varsovie', 'Cracovie', 'Prague', 'Vienne', 'Lisbonne', 'Athènes', 'Copenhague',
  'Bucarest', 'Belgrade', 'Le Caire', 'Alexandrie', 'Alger', 'Tunis', 'Le Cap',
  'La Haye', 'Anvers', 'Bruges', 'Gand', 'Bruxelles', 'Cologne', 'Francfort-sur-le-Main',
  'Aix-la-Chapelle', 'Nuremberg', 'Mayence', 'Trèves', 'Bâle', 'Genève', 'Zurich',
  'Berne', 'Lausanne', 'Saint-Pétersbourg', 'Saint-Petersbourg', 'Bombay', 'Calcutta',
  'Madras', 'Dacca', 'Séoul', 'Mexico', 'Buenos Aires', 'São Paulo', 'Téhéran',
  'Damas', 'Beyrouth', 'Bagdad', 'Jérusalem', 'Montréal', 'Montreal', 'Québec', 'Quebec City',
  'New York', 'New York City',
].map(normalizeName));

function aliasesFor(name, asciiName, rawAlternates) {
  const base = normalizeName(name);
  const comparisonName = normalizeName(asciiName || name);
  const candidates = [asciiName, ...rawAlternates.split(',')];
  const seen = new Set([base]);
  const usable = [];
  for (const raw of candidates) {
    const alias = raw.trim();
    const key = normalizeName(alias);
    if (!key || seen.has(key) || alias.length > 80 || alias.length < 4) continue;
    if (!/^[\p{Script=Latin}\p{M}\p{N}\p{P}\p{Zs}]+$/u.test(alias) || !/\p{L}/u.test(alias)) continue;
    if (/^[A-Z]{1,4}$/.test(alias) || /(?:https?:\/\/|www\.)/i.test(alias)) continue;
    const priority = preferredFrenchAliases.has(key) ? 0 : raw === asciiName ? 1 : 2;
    const distance = editDistance(comparisonName, key);
    if (priority === 2 && distance > Math.max(3, comparisonName.length * 0.45)) continue;
    seen.add(key);
    usable.push({ alias, key, priority, distance });
  }
  usable.sort((a, b) => a.priority - b.priority || a.distance - b.distance || Math.abs(a.alias.length - name.length) - Math.abs(b.alias.length - name.length));
  return usable.slice(0, 3).map(item => item.alias);
}

function readZipEntry(archive, wantedName) {
  // Parse the central directory, then inflate just the requested text entry.
  // This avoids a dependency and never writes archive-controlled paths.
  let end = -1;
  for (let position = archive.length - 22; position >= Math.max(0, archive.length - 65557); position--) {
    if (archive.readUInt32LE(position) === 0x06054b50) { end = position; break; }
  }
  if (end < 0) throw new Error('ZIP central directory missing');
  const entryCount = archive.readUInt16LE(end + 10);
  let cursor = archive.readUInt32LE(end + 16);
  for (let index = 0; index < entryCount; index++) {
    if (archive.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid ZIP central entry');
    const method = archive.readUInt16LE(cursor + 10);
    const compressedLength = archive.readUInt32LE(cursor + 20);
    const uncompressedLength = archive.readUInt32LE(cursor + 24);
    const nameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentLength = archive.readUInt16LE(cursor + 32);
    const localOffset = archive.readUInt32LE(cursor + 42);
    const name = archive.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    if (name === wantedName) {
      if (uncompressedLength > 200 * 1024 * 1024) throw new Error('Unexpectedly large GeoNames text entry');
      if (archive.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('Invalid ZIP local entry');
      const localNameLength = archive.readUInt16LE(localOffset + 26);
      const localExtraLength = archive.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = archive.subarray(dataOffset, dataOffset + compressedLength);
      const text = method === 0 ? compressed : method === 8 ? zlib.inflateRawSync(compressed, { maxOutputLength: uncompressedLength }) : null;
      if (!text || text.length !== uncompressedLength) throw new Error('Unsupported or incomplete GeoNames ZIP entry');
      return text.toString('utf8');
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${wantedName} missing in GeoNames ZIP`);
}

function rows(text) {
  return text.split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => line.split('\t'));
}
function readAdminNames(text) {
  return new Map(rows(text).map(fields => [fields[0], fields[1]]));
}
function rounded(value) {
  return Number(Number(value).toFixed(4));
}

async function build() {
  await fs.mkdir(inputDir, { recursive: true });
  if (argv.includes('--download')) {
    await Promise.all(sourceNames.map(async name => {
      const response = await fetch(sourceBase + name);
      if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(path.join(inputDir, name), bytes);
    }));
  }
  const [archive, countryText, admin1Text, admin2Text, readmeText] = await Promise.all(
    sourceNames.map(name => fs.readFile(path.join(inputDir, name), name.endsWith('.zip') ? undefined : 'utf8'))
  );
  if (!/Creative Commons Attribution 4\.0/.test(readmeText)) throw new Error('GeoNames licence changed: inspect readme before rebuilding');
  const countries = new Map(rows(countryText).map(fields => [fields[0], fields[4]]));
  const admin1Names = readAdminNames(admin1Text);
  const admin2Names = readAdminNames(admin2Text);
  const byCountry = new Map();
  const rejected = { malformed: 0, noCountry: 0, invalidZone: 0, coordinates: 0 };
  let sourceCount = 0;
  for (const fields of rows(readZipEntry(archive, 'cities1000.txt'))) {
    sourceCount++;
    if (fields.length !== 19 || !/^\d+$/.test(fields[0]) || !fields[1]) { rejected.malformed++; continue; }
    const code = fields[8];
    if (!countries.has(code)) { rejected.noCountry++; continue; }
    const latitude = Number(fields[4]);
    const longitude = Number(fields[5]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) { rejected.coordinates++; continue; }
    if (!isValidZone(fields[17])) { rejected.invalidZone++; continue; }
    const countryName = displayNames.of(code) || countries.get(code);
    const admin1Key = `${code}.${fields[10]}`;
    const admin2Key = `${admin1Key}.${fields[11]}`;
    const aliases = aliasesFor(fields[1], fields[2], fields[3]);
    const place = {
      id: Number(fields[0]),
      name: fields[1],
      ...(aliases.length ? { aliases } : {}),
      region: admin1Names.get(admin1Key) || countryName,
      countryCode: code,
      latitude: rounded(latitude),
      longitude: rounded(longitude),
      timeZone: fields[17],
    };
    if (!byCountry.has(code)) byCountry.set(code, []);
    byCountry.get(code).push({ place, admin2: admin2Names.get(admin2Key) || '' });
  }

  // A first-level region suffices for most homonyms. Where it does not, add
  // the sourced second-level region; coordinates distinguish the remainder.
  let differentiatedHomonyms = 0;
  let exactLocationDuplicates = 0;
  for (const places of byCountry.values()) {
    const groups = new Map();
    for (const entry of places) {
      const key = `${normalizeName(entry.place.name)}|${normalizeName(entry.place.region)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    }
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      differentiatedHomonyms += group.length;
      for (const entry of group) {
        if (entry.admin2 && normalizeName(entry.admin2) !== normalizeName(entry.place.region)) entry.place.region += ` · ${entry.admin2}`;
      }
      const refined = new Map();
      for (const entry of group) {
        if (!refined.has(entry.place.region)) refined.set(entry.place.region, []);
        refined.get(entry.place.region).push(entry);
      }
      for (const sameRegion of refined.values()) {
        if (sameRegion.length < 2) continue;
        for (const entry of sameRegion) entry.place.region += ` · ${entry.place.latitude}°, ${entry.place.longitude}°`;
      }
    }
    // Keep each GeoNames id. If both name and rounded coordinates coincide,
    // append the id to the region label rather than silently merging records.
    const labels = new Map();
    for (const entry of places) {
      const key = `${normalizeName(entry.place.name)}|${entry.place.region}`;
      if (!labels.has(key)) labels.set(key, []);
      labels.get(key).push(entry);
    }
    for (const group of labels.values()) {
      if (group.length < 2) continue;
      exactLocationDuplicates += group.length;
      for (const entry of group) entry.place.region += ` · lieu ${entry.place.id}`;
    }
  }

  await fs.mkdir(outputDir, { recursive: true });
  const manifestCountries = [];
  let totalBytes = 0;
  let totalGzipBytes = 0;
  const sizes = [];
  for (const [code, entries] of byCountry) {
    const places = entries.map(entry => entry.place).sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.region, b.region) || a.id - b.id);
    const json = JSON.stringify(places) + '\n';
    const bytes = Buffer.byteLength(json);
    const gzipBytes = zlib.gzipSync(json, { level: 9 }).length;
    await fs.writeFile(path.join(outputDir, `${code}.json`), json);
    totalBytes += bytes;
    totalGzipBytes += gzipBytes;
    sizes.push({ code, count: places.length, bytes, gzipBytes });
    manifestCountries.push({ code, name: displayNames.of(code) || countries.get(code), count: places.length, url: `/tarot-reader/astro-places/${code}.json` });
  }
  manifestCountries.sort((a, b) => collator.compare(a.name, b.name));
  const timeZones = [...new Set([...Intl.supportedValuesOf('timeZone'), ...[...zoneStatus].filter(([, valid]) => valid).map(([zone]) => zone), 'UTC'])].filter(isValidZone).sort();
  const placeCount = manifestCountries.reduce((sum, country) => sum + country.count, 0);
  const manifest = {
    version: 1,
    generatedAt,
    source: {
      name: 'GeoNames',
      url: 'https://www.geonames.org/',
      downloadUrl: sourceBase + 'cities1000.zip',
      documentationUrl: sourceBase + 'readme.txt',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      attribution: 'Données géographiques : GeoNames (CC BY 4.0). Adaptation NOWIS : champs réduits, coordonnées arrondies et répartition par pays.',
      inputs: sourceNames.map(name => sourceBase + name),
      sha256: crypto.createHash('sha256').update(archive).digest('hex'),
    },
    coverage: 'Villes de plus de 1 000 habitants et sièges administratifs jusqu’au niveau PPLA3. Certaines petites localités peuvent manquer. Les coordonnées sont celles du lieu, arrondies à quatre décimales.',
    placeCount,
    timeZones,
    countries: manifestCountries,
  };
  await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest) + '\n');
  await fs.writeFile(path.join(outputDir, 'ATTRIBUTION.txt'), [
    manifest.source.attribution,
    manifest.source.url,
    `Licence : ${manifest.source.licenseUrl}`,
    `Source : ${manifest.source.downloadUrl}`,
    `Format et couverture : ${manifest.source.documentationUrl}`,
    `Construction : ${generatedAt}`,
    '',
  ].join('\n'));
  console.log(JSON.stringify({ sourceCount, placeCount, countries: manifestCountries.length, timeZones: timeZones.length, rejected, differentiatedHomonyms, exactLocationDuplicates, totalBytes, totalGzipBytes, largestCountries: sizes.sort((a, b) => b.bytes - a.bytes).slice(0, 8), sha256: manifest.source.sha256 }, null, 2));
}

build().catch(error => { console.error(error); process.exitCode = 1; });
