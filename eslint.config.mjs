import nextConfig from 'eslint-config-next'

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      // Build output anywhere, not only at the root: a second checkout of this
      // repository under .claude/worktrees/ brings its own .next/ with it, and
      // linting generated bundles produces dozens of errors about code nobody
      // wrote. CI never sees these paths; a local working copy does.
      '**/.next/**',
      '.claude/worktrees/**',
      // The runner-only clone of main used by the automation's decision steps.
      '.trusted-policy/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
]

export default eslintConfig
