// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.vite/**',
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true, allowNullish: true },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...react.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // A scrollable region has to be focusable or a keyboard cannot read it — axe's
      // `scrollable-region-focusable` rule is the other half of this argument. Named
      // regions and tab panels are the two places we give a tab stop to something
      // that is not itself a control.
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'] }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}', '**/e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },
  {
    // Build scripts are plain ESM JavaScript and are not part of any tsconfig project.
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      parserOptions: { projectService: false, project: false },
      globals: globals.node,
    },
  },
  prettier,
);
