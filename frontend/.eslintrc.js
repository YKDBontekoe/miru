module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
  env: {
    jest: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.expo/',
    'web-build/',
    'coverage/',
    'android/',
    'ios/',
  ],
};
