import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function optimizeLogo() {
  const logoPath = path.resolve('public/logo.png');
  const webpPath = path.resolve('public/logo.webp');
  if (!fs.existsSync(logoPath)) return;

  const fileBuf = fs.readFileSync(logoPath);
  const img = sharp(fileBuf);
  
  const pngBuffer = await img.clone()
    .resize({ height: 160, withoutEnlargement: true })
    .png({ quality: 85, palette: true, compressionLevel: 9 })
    .toBuffer();
    
  fs.writeFileSync(logoPath, pngBuffer);
  
  const webpBuffer = await img.clone()
    .resize({ height: 160, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toBuffer();
    
  fs.writeFileSync(webpPath, webpBuffer);
  
  console.log(`Logo optimized: PNG ${(pngBuffer.length/1024).toFixed(1)} KB / WebP ${(webpBuffer.length/1024).toFixed(1)} KB`);
}

async function processImage(fullPath) {
  const ext = path.extname(fullPath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

  const normalizedPath = fullPath.replace(/\\/g, '/');

  let maxW = 1000;
  let targetQuality = 75;

  if (normalizedPath.includes('/proyectos/') && normalizedPath.includes('featured')) {
    maxW = 750;
    targetQuality = 72;
  } else if (normalizedPath.includes('/productos/')) {
    maxW = 500;
    targetQuality = 75;
  } else if (normalizedPath.includes('/galeria/')) {
    maxW = 800;
    targetQuality = 72;
  } else if (normalizedPath.includes('/proyectos/')) {
    maxW = 900;
    targetQuality = 75;
  }

  try {
    const fileBuf = fs.readFileSync(fullPath);
    const originalSize = fileBuf.length;
    const img = sharp(fileBuf);
    const metadata = await img.metadata();
    
    const width = Math.min(metadata.width || maxW, maxW);
    const resizedPipeline = img.clone().resize({ width, withoutEnlargement: true });

    // Re-encode original file
    let origBuf;
    if (ext === '.png') {
      origBuf = await resizedPipeline.clone().png({ quality: targetQuality, palette: true, compressionLevel: 9 }).toBuffer();
    } else {
      origBuf = await resizedPipeline.clone().jpeg({ quality: targetQuality, progressive: true, mozjpeg: true }).toBuffer();
    }

    fs.writeFileSync(fullPath, origBuf);

    // Re-encode or generate .webp version
    const basePath = fullPath.slice(0, -ext.length);
    const webpPath = basePath + '.webp';
    const webpBuf = await resizedPipeline.clone().webp({ quality: targetQuality, effort: 6 }).toBuffer();
    fs.writeFileSync(webpPath, webpBuf);

    console.log(`Optimized ${path.relative('public', fullPath)}: ${(originalSize/1024).toFixed(1)}KB -> orig ${(origBuf.length/1024).toFixed(1)}KB / webp ${(webpBuf.length/1024).toFixed(1)}KB`);
  } catch (err) {
    console.error(`Error optimizing ${fullPath}:`, err.message);
  }
}

function getAllFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

console.log('Starting parallel image optimization...');
await optimizeLogo();

const allFiles = getAllFiles(path.resolve('public/images'));
const batchSize = 10;

for (let i = 0; i < allFiles.length; i += batchSize) {
  const batch = allFiles.slice(i, i + batchSize);
  await Promise.all(batch.map(f => processImage(f)));
}

console.log('Parallel image optimization finished!');
