import { configDefaults, defineConfig } from 'vitest/config';

// Helpers working in their own copies of the project keep them under .claude/worktrees; their tests are not ours.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
});
