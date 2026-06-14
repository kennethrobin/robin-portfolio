import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page setup: one entry per creative direction so all three
// prototypes can be compared live, plus the chooser at "/".
export default defineConfig({
  // NOTE: node_modules is flagged "Dropbox-ignored" (an NTFS stream) so
  // Dropbox no longer syncs/locks it. That keeps Vite's default cache
  // (node_modules/.vite) safe locally — without hardcoding a machine
  // path here, which would break the Vercel (Linux) build.
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
