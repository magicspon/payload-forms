import { defineConfig } from 'tsdown'
import { resolve } from 'node:path'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/exports/client.ts',
    './src/exports/rsc.ts',
    './src/exports/form.ts',
  ],
  outDir: 'dist',
  format: 'esm',
  dts: true,
  clean: true,
  sourcemap: true,
  unbundle: true,
  platform: 'neutral',
  alias: {
    '@': resolve('./src'),
  },
  deps: {
    skipNodeModulesBundle: true,
    neverBundle: /\.css$/,
  },
  copy: [
    {
      from: 'src/**/*.css',
      flatten: false,
    },
  ],
})
