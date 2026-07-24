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
    .resize({ height: 140, withoutEnlargement: true })
    .png({ quality: 80, palette: true, compressionLevel: 9 })
    .toBuffer();
    
  fs.writeFileSync(logoPath, pngBuffer);
  
  const webpBuffer = await img.clone()
    .resize({ height: 140, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toBuffer();
    
  fs.writeFileSync(webpPath, webpBuffer);
  
  console.log(`Logo optimized: PNG ${(pngBuffer.length/1024).toFixed(1)} KB / WebP ${(webpBuffer.length/1024).toFixed(1)} KB`);
}

async function processImage(fullPath) {
  const ext = path.extname(fullPath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

  const normalizedPath = fullPath.replace(/\\/g, '/');

  let maxW = 900;
  let targetQuality = 70;

  if (normalizedPath.includes('/proyectos/') && normalizedPath.includes('featured')) {
    maxW = 600;
    targetQuality = 65;
  } else if (normalizedPath.includes('/productos/')) {
    maxW = 450;
    targetQuality = 70;
  } else if (normalizedPath.includes('/galeria/')) {
    maxW = 700;
    targetQuality = 65;
  } else if (normalizedPath.includes('/proyectos/')) {
    maxW = 850;
    targetQuality = 70;
  } else if (normalizedPath.includes('sobre-nosotros-bg')) {
    maxW = 900;
    targetQuality = 65;
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

console.log('Starting parallel image re-compression...');
await optimizeLogo();

const allFiles = getAllFiles(path.resolve('public/images'));
const batchSize = 10;

for (let i = 0; i < allFiles.length; i += batchSize) {
  const batch = allFiles.slice(i, i + batchSize);
  await Promise.all(batch.map(f => processImage(f)));
}

console.log('Parallel image re-compression finished!');
