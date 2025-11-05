module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: ['./tsconfig.json'],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': 'error',
    'no-restricted-syntax': [
      'warn',
      {
        selector:
          "JSXAttribute[name.name='className'][value.type='Literal'][value.value=/\\b(?:bg|border|shadow|ring|outline)-\\[[^\\]]+\\]/]",
        message: 'Используй дизайн-токен вместо Tailwind arbitrary класса.',
      },
      {
        selector:
          "JSXAttribute[name.name='className'][value.type='Literal'][value.value=/\\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\\b/]",
        message: 'Используй компонент Text и токенизированные размеры (text-body, text-heading и т.д.).',
      },
    ],
  },
};
