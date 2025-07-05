import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    outDir: 'dist',
    target: 'node16',
    rollupOptions: {
      input: './src/app.ts',
    },
    sourcemap: true,
    minify: false,
  },
}); 