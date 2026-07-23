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
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      const stat = fs.statSync(fullPath);
      if (stat.size < 40 * 1024 || entry.name === 'logo.png' || entry.name.includes('favicon')) continue;
      
      const tmpPath = fullPath + '.tmp';
      try {
        const image = sharp(fullPath);
        const metadata = await image.metadata();
        
        let targetWidth = metadata.width;
        if (metadata.width > 1920) {
          targetWidth = 1920;
        }

        let pipeline = image.resize({ width: targetWidth, withoutEnlargement: true });

        if (entry.name.endsWith('.png')) {
          pipeline = pipeline.png({ quality: 80, compressionLevel: 9, palette: true });
        } else {
          pipeline = pipeline.jpeg({ quality: 80, progressive: true, mozjpeg: true });
        }

        await pipeline.toFile(tmpPath);
        const newStat = fs.statSync(tmpPath);

        if (newStat.size < stat.size) {
          fs.renameSync(tmpPath, fullPath);
          console.log(`Optimized ${path.relative(IMAGES_DIR, fullPath)}: ${(stat.size/1024).toFixed(1)}KB -> ${(newStat.size/1024).toFixed(1)}KB`);
        } else {
          fs.unlinkSync(tmpPath);
        }
      } catch (err) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        console.error(`Error optimizing ${fullPath}:`, err.message);
      }
    }
  }
}

console.log('Optimizing images in', IMAGES_DIR);
await processDir(IMAGES_DIR);
console.log('Image optimization complete!');
