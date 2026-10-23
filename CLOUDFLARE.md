# Cloudflare Pages (Free)

- Production branch: `main`.
- Build command: `npm run build:pages`.
- Output directory: `dist`.
- Node.js: 22 or newer (minimum 22.12).
- No runtime Functions, Workers or paid storage are required.
- `public/_headers` retains the security and compiled-asset cache headers.

## Catalogue download

The original `public/files/Catalogo-Piedras-Canning-2026.pdf` exceeds the Pages 25 MiB per-asset limit. Its unchanged public copy is attached to the GitHub release `catalog-2026`. `public/_redirects` preserves the existing website URL and redirects the download there. Only `build:pages` excludes this PDF from the generated `dist`, so the existing Docker build remains usable for rollback.

When updating the catalogue, publish a new release asset first, update the redirect, then deploy. Do not remove the current asset while a published site still references it.

The preparation script rejects other files larger than 25 MiB and sites exceeding 20,000 files. The site uses no dynamic requests and therefore does not consume the Workers Free invocation quota.
