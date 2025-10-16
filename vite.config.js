import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    }
  },
  optimizeDeps: {
    include: ['@zxing/browser', 'crypto-js', 'react', 'react-dom', 'axios']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-vendor';
          if (id.includes('node_modules/scheduler/')) return 'react-vendor';
          
          // Router
          if (id.includes('react-router')) return 'router';
          
          // QR Libraries (largest - keep separate)
          if (id.includes('@zxing')) return 'qr-scanner';
          
          // Heavy libraries
          if (id.includes('xlsx')) return 'xlsx-lib';
          if (id.includes('jspdf')) return 'pdf-lib';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          
          // UI/Animation
          if (id.includes('framer-motion')) return 'animations';
          if (id.includes('lucide-react')) return 'icons';
          
          // Auth
          if (id.includes('@react-oauth/google')) return 'oauth';
          
          // Utils (smaller libs together)
          if (id.includes('axios') || id.includes('crypto-js') || id.includes('date-fns') || 
              id.includes('react-hot-toast') || id.includes('react-dropzone')) return 'utils';
          
          // Everything else
          if (id.includes('node_modules')) return 'vendor';
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) return `assets/img/[name]-[hash][extname]`;
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) return `assets/fonts/[name]-[hash][extname]`;
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    sourcemap: false,
    minify: 'esbuild', // Much faster than terser, still good compression
    target: 'es2020',
    cssCodeSplit: true,
    cssMinify: 'esbuild',
    reportCompressedSize: false,
    modulePreload: {
      polyfill: false
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    hmr: {
      overlay: false,
      clientPort: 5173
    },
    watch: {
      usePolling: true
    }
  }
});