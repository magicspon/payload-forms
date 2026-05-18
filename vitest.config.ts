import { defaultExclude, defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			'@payload-config': path.resolve(__dirname, 'dev/payload.config.ts'),
		},
	},
	test: {
		include: ['src/**/*.test.ts', 'dev/int.spec.ts'],
		exclude: [
			...defaultExclude,
			'src/integration/**',
			'dev/e2e/**',
			'dev/e2e.spec.ts',
		],
	},
})
