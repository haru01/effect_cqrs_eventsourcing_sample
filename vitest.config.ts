import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared-kernel'),
      '@course-registration': path.resolve(__dirname, './src/contexts/course-registration'),
      '@class-management': path.resolve(__dirname, './src/contexts/class-management'),
      '@academic-record': path.resolve(__dirname, './src/contexts/academic-record'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure')
    }
  }
});