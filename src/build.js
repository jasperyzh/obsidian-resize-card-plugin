// src/build.js
import { context } from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Compute __dirname for ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read manifest.json from the plugin root.
const manifestPath = path.join(__dirname, "..", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// Determine the entry file (defaults to "src/main.ts")
const entryFile = manifest.entry || path.join("src", "main.ts");

// Determine if we are in watch mode
const isWatch = process.argv.includes("--watch");

async function build() {
  const ctx = await context({
    entryPoints: [path.join(__dirname, "main.ts")],
    bundle: true,
    format: "cjs",         // Output CommonJS as required by Obsidian.
    platform: "browser",
    outfile: path.join(__dirname, "..", "main.js"),
    external: ["obsidian"],
    keepNames: true,
    minify: false,         // For development, disable minification.
  });

  if (isWatch) {
    await ctx.watch();
    console.log("Build complete. Watching for changes...");
    // The process will remain alive and rebuild on file changes.
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log("Build complete.");
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
