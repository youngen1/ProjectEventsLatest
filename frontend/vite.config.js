import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: '/', 
    define: {
      'process.env': env,
    },
    plugins: [react()],
    build: {
      outDir: 'dist', // Explicitly set output directory
      emptyOutDir: true, // Clear the directory before building
      sourcemap: false,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/analytics', 'firebase/storage'],
          },
        },
      },
    },
    server: {
      // This helps with routing in development
      historyApiFallback: true,
    },
    preview: {
      // This helps with routing when running vite preview
      historyApiFallback: true,
    }
  };
});
