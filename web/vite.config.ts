import { cp } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sirv from 'sirv'

import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const filesDir = fileURLToPath(new URL('../files', import.meta.url))
  let resolvedConfig: import('vite').ResolvedConfig | null = null

  return {
    plugins: [
      react(),
      {
        name: 'nuaa-files-static-serve',
        apply: 'serve',
        configureServer(server) {
          const serve = sirv(filesDir, {
            dev: true,
            etag: true,
          })
          server.middlewares.use('/files', serve)
        },
      },
      {
        name: 'nuaa-files-static-copy',
        apply: 'build',
        configResolved(config) {
          resolvedConfig = config
        },
        async writeBundle() {
          if (!resolvedConfig) return
          const outDir = path.resolve(
            resolvedConfig.root,
            resolvedConfig.build.outDir,
            'files',
          )
          await cp(filesDir, outDir, { recursive: true, force: true })
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
        '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@themes': fileURLToPath(new URL('./src/themes', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: Number(process.env.VITE_PORT ?? 4173),
    },
    preview: {
      host: true,
      port: Number(process.env.VITE_PORT ?? 4173),
    },
    css: {
      postcss: path.resolve(process.cwd(), 'postcss.config.cjs'),
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_ENV__: JSON.stringify(mode),
    },
  }
})
