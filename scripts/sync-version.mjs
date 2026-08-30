import { readFile, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
await writeFile(
  "src/version.ts",
  `// Generated from package.json by scripts/sync-version.mjs.\nexport const VERSION = ${JSON.stringify(packageJson.version)};\n`,
);

const server = JSON.parse(await readFile("server.json", "utf8"));
server.version = packageJson.version;
for (const packageEntry of server.packages ?? []) {
  packageEntry.version = packageJson.version;
}
await writeFile("server.json", `${JSON.stringify(server, null, 2)}\n`);
