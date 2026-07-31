// AlphaTab loads its music font, soundfont and web workers over HTTP at runtime,
// not through the bundler. Turbopack cannot resolve the `new Worker(new URL(...))`
// calls inside the package, so we serve the whole dist folder from /public and
// point `core.scriptFile` at it instead (see components/tab-player.tsx).
import { cp, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@coderline", "alphatab", "dist");
const target = join(root, "public", "alphatab");

await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });

console.log("[alphatab] assets copied to public/alphatab");
