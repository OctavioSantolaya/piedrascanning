import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve('public/images');

async function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDir(fullPath);
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name) && !entry.name.endsWith('.webp')) {
      const ext = path.extname(entry.name);
      const basePath = fullPath.slice(0, -ext.length);
      const webpPath = basePath + '.webp';
      
      try {
        const image = sharp(fullPath);
        const metadata = await image.metadata();
        let targetWidth = metadata.width > 1920 ? 1920 : metadata.width;
        
        await image
          .resize({ width: targetWidth, withoutEnlargement: true })
          .webp({ quality: 78, effort: 6 })
          .toFile(webpPath);
          
        const origSize = fs.statSync(fullPath).size;
        const webpSize = fs.statSync(webpPath).size;
        console.log(`Generated WebP for ${path.relative(IMAGES_DIR, fullPath)}: ${(origSize/1024).toFixed(1)}KB -> ${(webpSize/1024).toFixed(1)}KB WebP`);
      } catch (err) {
        console.error(`Error WebP ${fullPath}:`, err.message);
      }
    }
  }
}

await processDir(IMAGES_DIR);
console.log('WebP generation complete!');
