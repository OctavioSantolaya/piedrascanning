// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  build: {
    inlineStylesheets: 'always'
  }
});

