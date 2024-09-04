import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [react(), nodePolyfills(), svgr()],
  build: {
    sourcemap: process.env.NODE_ENV === "development",
  },
});
