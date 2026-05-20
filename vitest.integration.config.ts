import path from 'path'
import { defaultExclude, defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@payload-config': path.resolve(__dirname, 'dev/payload.config.ts'),
    },
  },
  test: {
    include: ['**/*.integration.test.ts'],
    exclude: defaultExclude,
    testTimeout: 60_000,
    hookTimeout: 180_000,
    pool: 'forks',
    singleFork: true,
  },
})
