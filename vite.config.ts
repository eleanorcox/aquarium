import { defineConfig } from 'vite';

// Relative base so the build works at a subdomain root or under a subpath of a larger site.
// The phone page is its own entry so phones do not download the operator app.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: { main: 'index.html', visit: 'visit.html' },
    },
  },
});
