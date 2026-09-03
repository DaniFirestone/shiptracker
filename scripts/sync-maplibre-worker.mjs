// maplibre-gl's worker script imports a sibling "maplibre-gl-shared.mjs"
// chunk via a relative path. Bundling the worker through Vite (e.g. a `?url`
// import) copies only that one file and breaks the relative import once
// deployed, silently killing all GeoJSON rendering in production. Instead we
// mirror both files verbatim into public/, preserving their relative
// sibling relationship, and point maplibre-gl at them with `setWorkerUrl()`.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, "..", "node_modules", "maplibre-gl", "dist");
const destDir = join(__dirname, "..", "public", "maplibre-worker");

const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

mkdirSync(destDir, { recursive: true });

for (const file of files) {
  const src = join(srcDir, file);
  if (!existsSync(src)) {
    console.warn(`[sync-maplibre-worker] missing ${src}, skipping`);
    continue;
  }
  copyFileSync(src, join(destDir, file));
}

console.log("[sync-maplibre-worker] synced", files.join(", "));
