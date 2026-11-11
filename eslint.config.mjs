// Managed additions: project-setup v1

import setupPrettier from 'eslint-config-prettier/flat'
import setupGlobals from 'globals'
const setupRules = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.astro/**',
      '.next/**',
      'out/**',
      'coverage/**',
      '.agents/**',
    ],
  },
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx,jsx,astro}'],
    languageOptions: { globals: { ...setupGlobals.node, ...setupGlobals.browser } },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}', 'tests/**'],
    languageOptions: { globals: setupGlobals.vitest },
  },
  setupPrettier,
]

import js from '@eslint/js'
import ts from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
const projectSetupConfig = [
  ...[js.configs.recommended, ...ts.configs.recommended, ...astro.configs.recommended],
  ...setupRules,
]
export default projectSetupConfig
