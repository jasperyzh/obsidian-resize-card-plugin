import esbuild from "esbuild";
import fs from "fs";

// Read manifest.json to determine the entry file.
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const entryFile = manifest.entry || "main.ts";

// Build with esbuild.
esbuild.build({
  entryPoints: [entryFile],
  bundle: true,
  minify: true,
  sourcemap: false,
  target: "es6",
  platform: "browser",
  outfile: "main.js",
  // Mark "obsidian" as external so it isn't bundled.
  external: ["obsidian"]
})
  .then(() => console.log("Build complete."))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
