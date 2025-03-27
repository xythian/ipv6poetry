// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  // Configuration for Cloudflare Pages deployment
  site: 'https://ipv6poetry.org',
  build: {
    format: 'directory',
    assets: 'assets',
  },
  vite: {
    build: {
      // This helps for Cloudflare Pages compatibility
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
        },
      },
    },
  },
});
