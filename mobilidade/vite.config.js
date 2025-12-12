import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/narrative': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        rewrite: (path) => '/uc?export=download&id=1-o0LleJ9kcmERDP5eEfd_H_wV0R2FnXy',
      },
    },
  },
})
