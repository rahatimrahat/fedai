module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'prettier', // Uses eslint-config-prettier to disable ESLint rules that would conflict with Prettier
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'node/no-unpublished-require': 'off', // Allows require() for devDependencies like in build scripts, adjust if needed
    'node/no-missing-require': 'off', // Often too noisy with dynamic requires or specific project structures
    // Add any project-specific rules here
    // Example:
    // 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
};
