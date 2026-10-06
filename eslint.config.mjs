import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules } from '@eslint/compat';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...fixupConfigRules([...nextVitals, ...nextTypescript]),
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Compiler diagnostics are advisory until this existing app enables React Compiler.
      // Keep the traditional Rules of Hooks and dependency checks enforced.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    files: ['src/components/jeux/gameUpgrades/**/*.{ts,js}'],
    rules: { 'prefer-const': 'off' },
  },
]);
