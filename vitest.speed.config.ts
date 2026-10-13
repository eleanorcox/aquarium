import { defineConfig } from 'vitest/config';

// Speed checks are kept apart from the tests: timings vary between machines, so they report numbers
// to compare with the last run and never pass or fail. Run with `npm run speed`.
export default defineConfig({
  test: { include: ['src/**/*.speed.ts'] },
});
