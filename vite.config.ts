import { defineConfig } from 'vite';

// Relative base so the build works at a subdomain root or under a subpath of a larger site.
export default defineConfig({
  base: './',
});
