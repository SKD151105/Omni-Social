import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configure Vite for React + support for .jsx/.js imports.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Forward API calls to the backend to avoid CORS during local dev
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/healthcheck": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  }
});
