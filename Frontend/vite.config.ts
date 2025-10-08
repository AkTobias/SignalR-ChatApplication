import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
//added mkcert
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    proxy: {
      "/chathub": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
