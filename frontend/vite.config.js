import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
  },
  theme: {
    extend: {
      fontSize: {
        '9px': '9px',
        '10px': '10px',
      },
      colors: {
        'text-gray': '#666',
      },
    },
  },
})
