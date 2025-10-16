import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: "http://localhost:8507",
        changeOrigin: true,
        secure: false,
      },
      '/events': {
        target: "http://localhost:8507",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});