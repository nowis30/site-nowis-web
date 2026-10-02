/** Prepare WAV-derived album MP3s; write new storage objects only with --apply.
 * node scripts/upload-album-audio.cjs ../output/album-promo/audio-inventory.json [--apply]
 * The inventory is produced by output/album-promo/prepare_album_audio.py.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');
const { S3Client, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.album.local', quiet: true });
require('dotenv').config({ path: '.env.radio.local', quiet: true });
const album = require('../src/data/album-tracks.json');
const inventory = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).tracks;
const apply = process.argv.includes('--apply');
const prefix = '/audio/album-lamour-de-nowis/';

if (album.length !== 32 || inventory.length !== 32 || new Set(album.map(t => t.id)).size !== 32) {
  throw new Error('The album must contain exactly 32 unique tracks.');
}
const planned = album.map(track => {
  const source = inventory.find(item => item.id === track.id);
  if (!source || source.src !== track.src || !track.src.startsWith(prefix)
      || !/^album-\d+$/.test(track.id) || !/^\d+\.mp3$/.test(track.src.slice(prefix.length))) {
    throw new Error('The local inventory does not match the album manifest.');
  }
  const Body = fs.readFileSync(source.path);
  const sha256 = crypto.createHash('sha256').update(Body).digest('hex');
  if (sha256 !== source.sha256 || Body.length !== source.bytes || Body.length < 1000) {
    throw new Error(`Changed or invalid local audio: ${track.id}`);
  }
  return { id: track.id, Key: track.src.slice(1), path: source.path, sha256, bytes: Body.length };
});

async function main() {
  console.log(JSON.stringify({ apply, tracks: planned.length,
    megabytes: Math.round(planned.reduce((sum, item) => sum + item.bytes, 0) / 1e4) / 100 }));
  if (!apply) return;
  const accessKeyId = process.env.AWS_MEDIA_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_MEDIA_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_MEDIA_REGION || process.env.S3_REGION || process.env.AWS_REGION;
  const Bucket = process.env.AWS_MEDIA_BUCKET || process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  if (!accessKeyId || !secretAccessKey || !region || Bucket !== 'nowis-crm-files') {
    throw new Error('The existing media storage configuration is required.');
  }
  const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  for (const item of planned) {
    let existing;
    try {
      existing = await client.send(new HeadObjectCommand({ Bucket, Key: item.Key }));
    } catch (error) {
      if (error.$metadata?.httpStatusCode !== 404) throw error;
    }
    if (existing) {
      if (existing.Metadata?.sha256 !== item.sha256 || existing.ContentLength !== item.bytes) {
        throw new Error(`An existing object differs: ${item.id}`);
      }
      console.log(`Verified existing ${item.id}`);
      continue;
    }
    const Body = fs.readFileSync(item.path);
    if (Body.length !== item.bytes || crypto.createHash('sha256').update(Body).digest('hex') !== item.sha256) {
      throw new Error(`Local audio changed before upload: ${item.id}`);
    }
    await client.send(new PutObjectCommand({ Bucket, Key: item.Key,
      Body, ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: { sha256: item.sha256, album: 'lamour-de-nowis' }, IfNoneMatch: '*' }));
    console.log(`Uploaded ${item.id}`);
  }
  console.log('All 32 album recordings uploaded or verified.');
}
main().catch(error => { console.error(error.name, error.message); process.exitCode = 1; });
