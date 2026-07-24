import sharp from 'sharp';
import fs from 'fs';

const input = 'public/images/logo.png';
const tmpPng = 'public/images/logo.png.tmp';
const webp = 'public/images/logo.webp';

const img = sharp(input);

await img
  .resize({ height: 160, withoutEnlargement: true })
  .png({ quality: 90, compressionLevel: 9 })
  .toFile(tmpPng);

await sharp(input)
  .resize({ height: 160, withoutEnlargement: true })
  .webp({ quality: 85 })
  .toFile(webp);

fs.renameSync(tmpPng, input);
console.log('Logo optimization complete!');
