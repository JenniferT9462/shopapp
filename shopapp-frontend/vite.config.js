import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/products": "http://127.0.0.1:5000",
      "/customers": "http://127.0.0.1:5000",
      "/orders": "http://127.0.0.1:5000",
      "/cart": "http://127.0.0.1:5000",
    },
  },
  build: {
    outDir: "../static",
    assetsDir: "assets",
    emptyOutDir: false,
  },
});
