// Serves Octopus's real frontend (../octopus/src) with a mocked Tauri backend (demo.ts), to take the
// site's screenshots. Run from octopus-site: node screens/serve.mjs
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const octopus = resolve(process.env.OCTOPUS_DIR ?? resolve(here, "../../octopus"));
const { default: react } = await import(resolve(octopus, "node_modules/@vitejs/plugin-react/dist/index.js"));

export default {
  root: here,
  plugins: [react()],
  resolve: {
    alias: { "@octopus": resolve(octopus, "src"), "@tauri-apps/api": resolve(octopus, "node_modules/@tauri-apps/api") },
  },
  server: { port: 1430, strictPort: true, fs: { allow: [here, octopus] } },
  logLevel: "warn",
};
