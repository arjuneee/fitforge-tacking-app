import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // Ensure service worker and manifest are copied to dist
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
  publicDir: "public",
});

