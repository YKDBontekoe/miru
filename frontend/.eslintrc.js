module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  env: {
    jest: true,
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
