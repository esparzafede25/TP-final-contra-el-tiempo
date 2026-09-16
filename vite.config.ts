import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Permite que los assets se carguen con rutas relativas en GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
