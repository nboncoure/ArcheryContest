import fs from "node:fs";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron/simple";
import pkg from "./package.json";
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isServe = command === "serve";
  const isBuild = command === "build";
  const isElectron = mode === "electron";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  // Nettoyer le répertoire dist-electron uniquement si on construit pour Electron
  if (isBuild && isElectron) {
    fs.rmSync("dist-electron", { recursive: true, force: true });
  }

  const plugins = [vue()];

  // N'ajouter le plugin Electron que si on est en mode Electron
  if (isElectron) {
    plugins.push(
      electron({
        main: {
          entry: "electron/main/index.ts",
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              console.log("[startup] Electron App");
            } else {
              startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        preload: {
          input: "electron/preload/index.ts",
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined,
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        renderer: {},
      })
    );
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins,
    // Configuration du serveur de développement
    server: {
      host: '0.0.0.0',
      port: 3344,
      strictPort: true, // Échouer si le port est déjà utilisé
      open: !isElectron, // Ouvrir le navigateur sauf en mode Electron
    },
    // Configuration de prévisualisation
    preview: {
      host: '0.0.0.0',
      port: 3344, 
      strictPort: true,
    },
    // Configuration de build
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets',
    },
  };
});