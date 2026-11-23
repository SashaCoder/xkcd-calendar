import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/xkcd-calendar/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/xkcd/rss.xml': {
        target: 'https://xkcd.com',
        changeOrigin: true,
        rewrite: () => '/rss.xml',
      },
      '^/api/xkcd/(\\d+)/info\\.0\\.json$': {
        target: 'https://xkcd.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/xkcd\//, '/'),
      },
    },
  },
}))
