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
    include: ['html5-qrcode', '@zxing/browser', 'crypto-js']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor';
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router')) return 'react-router';
          if (id.includes('html5-qrcode') || id.includes('@zxing')) return 'qr-scanner';
          if (id.includes('framer-motion')) return 'framer-motion';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('xlsx') || id.includes('jspdf')) return 'file-libs';
          if (id.includes('@react-oauth/google')) return 'google-oauth';
          if (id.includes('axios') || id.includes('crypto-js') || id.includes('date-fns')) return 'utils';
          if (id.includes('node_modules')) return 'vendor';
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) return `assets/images/[name]-[hash][extname]`;
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) return `assets/fonts/[name]-[hash][extname]`;
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: { safari10: true },
      format: { comments: false }
    },
    cssCodeSplit: true,
    reportCompressedSize: false
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