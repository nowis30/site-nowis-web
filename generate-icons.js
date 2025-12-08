#!/usr/bin/env node
/**
 * Génère les icônes PNG et maskable à partir de icons/icon.svg
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'icons', 'icon.svg');
if (!fs.existsSync(svgPath)) {
  console.error('icons/icon.svg introuvable');
  process.exit(1);
}

async function run(){
  try {
    await sharp(svgPath).resize(192,192).png().toFile(path.join(__dirname,'icons','icon-192.png'));
    await sharp(svgPath).resize(512,512).png().toFile(path.join(__dirname,'icons','icon-512.png'));
    // Version maskable: ajouter un padding transparent autour si nécessaire
    const tmp = path.join(__dirname,'icons','icon-512.png');
    await sharp(tmp).extend({top:50,bottom:50,left:50,right:50,background:{r:0,g:0,b:0,alpha:0}})
      .resize(512,512) // recadrer à 512
      .png()
      .toFile(path.join(__dirname,'icons','icon-512-maskable.png'));
    console.log('Icônes générées avec succès.');
  } catch(e){
    console.error('Erreur génération icônes:', e);
    process.exit(1);
  }
}
run();
