module.exports = {
  root: true,
  extends: ['@moser-inc/eslint-config'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },
};
