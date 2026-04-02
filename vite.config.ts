import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/explorador_estruturas/",
  define: {
    global: "globalThis",
  },
  plugins: [react(), tailwindcss()],
});
