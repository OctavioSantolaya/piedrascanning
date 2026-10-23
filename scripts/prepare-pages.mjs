import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The original catalogue is preserved as a public GitHub release asset.
// Pages redirects the existing download URL without reducing PDF quality.
await unlink(new URL('../dist/files/Catalogo-Piedras-Canning-2026.pdf', import.meta.url));

let count = 0;
async function validate(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await validate(path);
    else {
      count++;
      if ((await stat(path)).size > 25 * 1024 * 1024) {
        throw new Error(`Asset exceeds Cloudflare Pages 25 MiB limit: ${path}`);
      }
    }
  }
}
await validate(fileURLToPath(new URL('../dist/', import.meta.url)));
if (count > 20000) throw new Error(`Pages Free file limit exceeded: ${count}`);
console.log(`Pages ready: ${count} files, all within the free plan limits.`);
