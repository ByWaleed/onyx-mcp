import { readFile, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
await writeFile(
  "src/version.ts",
  `// Generated from package.json by scripts/sync-version.mjs.\nexport const VERSION = ${JSON.stringify(packageJson.version)};\n`,
);
