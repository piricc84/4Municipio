import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/4Municipio/' : '/',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
}));
