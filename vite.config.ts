import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Mantemos a base relativa que ajuda a achar os arquivos
  base: './',
  
  plugins: [react()],
  
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },

  // Esta parte é crucial: expõe a variável para o navegador
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY)
  }
});
