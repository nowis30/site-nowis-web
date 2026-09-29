/** Upload only the verified public Suno catalog. Existing objects are never overwritten.
 * node scripts/upload-radio-audio.cjs <inventory.json>
 * Requires the existing AWS_MEDIA_* settings in .env.radio.local (gitignored).
 */
const fs = require('node:fs');
const crypto = require('node:crypto');
const { S3Client, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({path:'.env.radio.local', quiet:true});
const tracks = require('../src/data/radio-tracks.json');
const inventory = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const required = ['AWS_MEDIA_ACCESS_KEY_ID','AWS_MEDIA_SECRET_ACCESS_KEY','AWS_MEDIA_REGION','AWS_MEDIA_BUCKET'];
if (required.some(key=>!process.env[key])) throw new Error('Existing AWS_MEDIA configuration is required.');
if (tracks.length !== 141 || inventory.missing.length || inventory.matched.length !== 141) throw new Error('All 141 verified MP3s are required before publishing.');
const ids = new Set(tracks.map(track=>track.id));
if (new Set(inventory.matched.map(track=>track.id)).size !== 141 || inventory.matched.some(track=>!ids.has(track.id))) throw new Error('Inventory does not match the public catalog.');
const Bucket = process.env.AWS_MEDIA_BUCKET;
const client = new S3Client({region:process.env.AWS_MEDIA_REGION, credentials:{accessKeyId:process.env.AWS_MEDIA_ACCESS_KEY_ID, secretAccessKey:process.env.AWS_MEDIA_SECRET_ACCESS_KEY}});
(async()=>{
  for (const track of inventory.matched) {
    const Body = fs.readFileSync(track.path);
    const sha256 = crypto.createHash('sha256').update(Body).digest('hex');
    const Key = `audio/nowis-radio-suno/${track.id}.mp3`;
    try {
      const existing = await client.send(new HeadObjectCommand({Bucket,Key}));
      if (existing.Metadata?.sha256 !== sha256) throw new Error(`Existing object differs: ${track.id}`);
      console.log(`Verified existing ${track.id}`);
      continue;
    } catch(error) { if (error.$metadata?.httpStatusCode !== 404) throw error; }
    await client.send(new PutObjectCommand({Bucket,Key,Body,ContentType:'audio/mpeg',CacheControl:'public, max-age=31536000, immutable',Metadata:{sha256},IfNoneMatch:'*'}));
    console.log(`Uploaded ${track.id}`);
  }
  console.log('All 141 objects uploaded or verified.');
})().catch(error=>{ console.error(error.name, error.message); process.exitCode=1; });
