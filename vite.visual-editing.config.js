import { defineConfig } from 'vite'

// Separate build for the Sanity visual-editing overlay bundle.
// Bundles @sanity/visual-editing + React into a single self-contained IIFE
// (dist/visual-editing.js). Loaded ONLY inside the Studio Presentation iframe,
// so it stays out of the lean public main.js. See src/visual-editing-entry.js.
export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // keep main.js from the primary build
    minify: true,
    target: 'es2020',
    rollupOptions: {
      input: './src/visual-editing-entry.js',
      output: {
        format: 'iife',
        entryFileNames: 'visual-editing.js',
        inlineDynamicImports: true, // IIFE can't code-split
      },
    },
  },
})
