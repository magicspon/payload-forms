// @ts-check

import jsxA11y from 'eslint-plugin-jsx-a11y'
import payloadEsLintConfig from '@payloadcms/eslint-config'

export const defaultESLintIgnores = [
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/playwright.config.ts',
  '**/vitest.config.js',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
  '**/dist/',
  '**/.yarn/',
  '**/build/',
  '**/node_modules/',
  '**/temp/',
]

export default [
  ...payloadEsLintConfig,
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      'no-restricted-exports': 'off',
      'perfectionist/sort-objects': 'off',
      'jsx-a11y/control-has-associated-label': [
        'warn',
        {
          labelAttributes: ['label'],
          controlComponents: [],
          ignoreElements: ['audio', 'canvas', 'embed', 'input', 'textarea', 'tr', 'video'],
          ignoreRoles: [
            'grid',
            'listbox',
            'menu',
            'menubar',
            'menuitem',
            'menuitemcheckbox',
            'menuitemradio',
            'option',
            'none',
            'presentation',
            'progressbar',
            'radio',
            'radiogroup',
          ],
          depth: 3,
        },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        projectService: {
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 40,
          allowDefaultProject: ['scripts/*.ts', '*.js', '*.mjs', '*.spec.ts', '*.d.ts'],
        },
        // projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]
