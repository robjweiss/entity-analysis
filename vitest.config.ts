import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['web/**/*.spec.ts', 'bff/**/*.spec.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        include: ['web/**/*.ts', 'web/**/*.vue'],
        exclude: ['web/**/*.spec.ts', 'web/components/ui/**'],
        reporter: ['text', 'html'],
        reportsDirectory: './coverage/web',
      },
    },
  }),
)
