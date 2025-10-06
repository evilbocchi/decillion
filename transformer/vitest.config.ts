import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        root: '.',
        testTimeout: 30000,
        setupFiles: ['./test/setup.ts'],
        include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
        exclude: ['**/node_modules/**', '**/out/**'],
        coverage: {
            include: ['src/**'],
        },
    },
});
