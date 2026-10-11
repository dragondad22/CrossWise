import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // New in eslint-plugin-react-hooks 7 (Next 16). Existing effects that reset
    // state are tracked for refactor in #131; warn until then.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  globalIgnores([
    'node_modules/',
    '.next/',
    'coverage/',
    'dist/',
    'src/generated/',
    'next-env.d.ts',
    '*.config.js',
    '*.config.ts',
    '*.config.mjs',
    'scripts/',
  ]),
])
