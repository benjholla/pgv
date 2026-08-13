import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname),
  plugins: [],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "pgv",
      formats: ["iife"],
      fileName: () => "pgv-bundle.js"
    },
    rollupOptions: {
      external: [],
    }
  },
  server: {
    open: false,
  },
})
