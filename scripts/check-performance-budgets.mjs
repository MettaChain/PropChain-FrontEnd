import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const nextDir = path.join(projectRoot, ".next");
const chunksDir = path.join(nextDir, "static", "chunks");
const buildManifestPath = path.join(nextDir, "build-manifest.json");

const totalBudgetKb = Number(process.env.TOTAL_JS_BUDGET_KB || 650);
const chunkBudgetKb = Number(process.env.MAX_CHUNK_BUDGET_KB || 220);

if (!fs.existsSync(chunksDir)) {
  console.error("Missing .next/static/chunks. Run `next build` first.");
  process.exit(1);
}

const allChunkFiles = [];
const stack = [chunksDir];
while (stack.length > 0) {
  const current = stack.pop();
  for (const item of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, item.name);
    if (item.isDirectory()) {
      stack.push(fullPath);
    } else if (item.isFile() && item.name.endsWith(".js")) {
      allChunkFiles.push(fullPath);
    }
  }
}

const manifest = fs.existsSync(buildManifestPath)
  ? JSON.parse(fs.readFileSync(buildManifestPath, "utf8"))
  : null;

const initialFiles = new Set();
if (manifest) {
  for (const file of [...(manifest.polyfillFiles || []), ...(manifest.rootMainFiles || [])]) {
    if (typeof file === "string" && file.endsWith(".js")) {
      initialFiles.add(file);
    }
  }
  for (const pageFiles of Object.values(manifest.pages || {})) {
    for (const file of pageFiles || []) {
      if (typeof file === "string" && file.endsWith(".js")) {
        initialFiles.add(file);
      }
    }
  }
}

let allBytes = 0;
for (const filePath of allChunkFiles) {
  const size = fs.statSync(filePath).size;
  allBytes += size;
}

let initialBytes = 0;
const offenders = [];
for (const relativePath of initialFiles) {
  const filePath = path.join(nextDir, relativePath);
  if (!fs.existsSync(filePath)) continue;
  const size = fs.statSync(filePath).size;
  initialBytes += size;
  if (size > chunkBudgetKb * 1024) {
    offenders.push({
      file: relativePath,
      kb: (size / 1024).toFixed(1),
    });
  }
}

const totalKb = initialBytes / 1024;
console.log(`Initial JS size (build manifest): ${totalKb.toFixed(1)} KB`);
console.log(`All chunk JS size: ${(allBytes / 1024).toFixed(1)} KB`);
console.log(`Budget: ${totalBudgetKb} KB`);

let hasError = false;
if (totalKb > totalBudgetKb) {
  console.error(`Total JS budget exceeded by ${(totalKb - totalBudgetKb).toFixed(1)} KB`);
  hasError = true;
}

if (offenders.length > 0) {
  console.error(`Chunks above ${chunkBudgetKb} KB:`);
  for (const item of offenders) {
    console.error(`- ${item.file}: ${item.kb} KB`);
  }
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

console.log("Performance budgets passed.");
