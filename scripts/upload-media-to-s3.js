#!/usr/bin/env node

/**
 * Upload media files (audio and games) to AWS S3
 * Usage: npm run upload:media
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const accessKeyId = process.env.AWS_MEDIA_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_MEDIA_SECRET_ACCESS_KEY;
const region = process.env.AWS_MEDIA_REGION;
const bucket = process.env.AWS_MEDIA_BUCKET;

if (!accessKeyId || !secretAccessKey || !region || !bucket) {
  console.error('❌ Missing AWS credentials in .env.local');
  console.error('Required: AWS_MEDIA_ACCESS_KEY_ID, AWS_MEDIA_SECRET_ACCESS_KEY, AWS_MEDIA_REGION, AWS_MEDIA_BUCKET');
  process.exit(1);
}

const s3Client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

function toPublicUrl(key) {
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

async function uploadFile(filePath, s3Key) {
  const fileStream = fs.createReadStream(filePath);
  const stats = fs.statSync(filePath);
  
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: fileStream,
        ContentType: getContentType(filePath),
      })
    );
    console.log(`✅ Uploaded: ${s3Key} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (error) {
    console.error(`❌ Failed to upload ${s3Key}:`, error.message);
    throw error;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.mp3': 'audio/mpeg',
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
  };
  return types[ext] || 'application/octet-stream';
}

async function uploadDirectory(localDir, s3Prefix) {
  const files = fs.readdirSync(localDir, { recursive: true });
  const mediaFiles = files.filter(f => fs.statSync(path.join(localDir, f)).isFile());
  
  console.log(`\n📁 Uploading ${mediaFiles.length} files from ${localDir}...`);
  
  for (const file of mediaFiles) {
    const filePath = path.join(localDir, file);
    const s3Key = `${s3Prefix}/${file}`.replace(/\\/g, '/');
    await uploadFile(filePath, s3Key);
  }
}

async function uploadPlaylistManifest(audioDir) {
  const entries = fs
    .readdirSync(audioDir)
    .filter((file) => fs.statSync(path.join(audioDir, file)).isFile())
    .filter((file) => path.extname(file).toLowerCase() === '.mp3')
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map((file) => {
      const key = `audio/nowis-radio/${file}`;
      return {
        title: path.basename(file, path.extname(file)),
        src: toPublicUrl(key),
      };
    });

  const manifestKey = 'audio/nowis-radio/playlist.json';

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: manifestKey,
      Body: JSON.stringify(entries, null, 2),
      ContentType: 'application/json; charset=utf-8',
    })
  );

  console.log(`✅ Uploaded: ${manifestKey} (${entries.length} tracks)`);
}

async function main() {
  try {
    console.log(`\n🚀 Starting upload to S3...\n`);
    console.log(`📍 Bucket: ${bucket}\n`);

    // Upload audio files
    const audioDir = path.join(__dirname, '..', '..', 'Mp3');
    if (fs.existsSync(audioDir)) {
      await uploadDirectory(audioDir, 'audio/nowis-radio');
      await uploadPlaylistManifest(audioDir);
    } else {
      console.warn(`⚠️  Audio directory not found: ${audioDir}`);
    }

    // Upload games
    const gamesDir = path.join(__dirname, '..', '..', 'html-css-javascript-games-main');
    if (fs.existsSync(gamesDir)) {
      await uploadDirectory(gamesDir, 'games/html-css-javascript-games-main');
    } else {
      console.warn(`⚠️  Games directory not found: ${gamesDir}`);
    }

    console.log(`\n✨ Upload complete!`);
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

main();
