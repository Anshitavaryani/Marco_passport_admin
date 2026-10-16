import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The rich-text editors load TinyMCE from /tinymce (see tinymceScriptSrc).
// Copy it out of node_modules so what's served always matches package.json.
const copyTinymce = (): Plugin => ({
  name: "copy-tinymce",
  buildStart() {
    const src = path.resolve(import.meta.dirname, "node_modules/tinymce");
    const dest = path.resolve(import.meta.dirname, "public/tinymce");
    const version = (dir: string) =>
      existsSync(`${dir}/package.json`) && JSON.parse(readFileSync(`${dir}/package.json`, "utf8")).version;
    if (version(src) === version(dest)) return;
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
  },
});

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), tailwindcss(), copyTinymce()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
