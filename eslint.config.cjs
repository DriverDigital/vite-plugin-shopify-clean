const js = require('@eslint/js');

module.exports = [
  // Ignore build artifacts
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  // JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      import: require('eslint-plugin-import')
    },
    rules: {
      ...js.configs.recommended.rules,
      // Ensure no external config errors out; we don't enforce this rule here
      'import/no-default-export': 'off'
    }
  },
  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: require('@typescript-eslint/parser')
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      import: require('eslint-plugin-import')
    },
    rules: {
      // Start with the base recommended JS rules
      ...js.configs.recommended.rules,
      // TS is type-checked by the compiler; turn off undefined for TS
      'no-undef': 'off',
      // Ensure no external config errors out; we don't enforce this rule here
      'import/no-default-export': 'off'
    }
  }
];
