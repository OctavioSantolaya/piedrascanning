import fs from 'fs';
import path from 'path';
import https from 'https';
import sharp from 'sharp';

const PRODUCTS_FILE = path.resolve('src/data/products.json');
const OUT_DIR = path.resolve('public/images/productos');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));

  let successCount = 0;
  let failCount = 0;

  for (const cat of data) {
    if (!cat.items) continue;
    for (const item of cat.items) {
      for (const key of ['image', 'thumb']) {
        let origUrl = item[key];
        if (!origUrl) continue;
        
        // If it's already local, skip
        if (origUrl.startsWith('/images/productos/')) continue;

        // Replace piedrascanning.com with piedras.brikerly.com
        const fetchUrl = origUrl.replace('https://piedrascanning.com', 'https://piedras.brikerly.com');
        
        const fileName = path.basename(origUrl.split('?')[0]);
        const localPath = path.join(OUT_DIR, fileName);
        const publicUrl = `/images/productos/${fileName}`;

        if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
          item[key] = publicUrl;
          continue;
        }

        try {
          const buffer = await fetchBuffer(fetchUrl);
          const optimized = await sharp(buffer)
            .resize({ width: 800, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

          fs.writeFileSync(localPath, optimized);
          item[key] = publicUrl;
          successCount++;
          console.log(`Saved ${fileName} (${(optimized.length/1024).toFixed(1)} KB)`);
        } catch (err) {
          console.error(`Failed ${fileName} (${fetchUrl}): ${err.message}`);
          failCount++;
        }
      }
    }
  }

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
  console.log(`Done! Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
