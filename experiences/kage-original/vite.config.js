import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "/experience/",
  build: {
    outDir: resolve(projectRoot, "../../public/experience"),
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false,
    target: "es2020",
  },
});
