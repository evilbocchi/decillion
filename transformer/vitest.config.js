const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
    test: {
        environment: 'node',
        globals: true,
        root: '.',
        testTimeout: 30000,
        setupFiles: ['./test/setup.ts'],
        include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
        exclude: ['**/node_modules/**', '**/out/**'],
    },
});
