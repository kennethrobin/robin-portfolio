import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page setup: one entry per creative direction so all three
// prototypes can be compared live, plus the chooser at "/".
export default defineConfig({
  // The project lives in a Dropbox folder; Dropbox locks files while
  // syncing and breaks Vite's dependency cache (EBUSY). Keeping the
  // cache outside Dropbox avoids that entirely.
  cacheDir: 'C:/Users/kenneth/AppData/Local/vite-cache/kr-portfolio',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        a: resolve(__dirname, 'a.html'),
        b: resolve(__dirname, 'b.html'),
        c: resolve(__dirname, 'c.html'),
        d: resolve(__dirname, 'd.html'),
      },
    },
  },
  server: {
    port: 5180,
    strictPort: true,
  },
});
