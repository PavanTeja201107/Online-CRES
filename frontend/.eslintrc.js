module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['airbnb', 'plugin:prettier/recommended'],
  plugins: ['react'],
  rules: {
    // project-specific overrides (safe, non-behavioral)
    'no-console': 'off',
    'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.js'] }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
