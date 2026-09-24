import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const nextDir = path.join(projectRoot, ".next");
const chunksDir = path.join(nextDir, "static", "chunks");
const buildManifestPath = path.join(nextDir, "build-manifest.json");

const INITIAL_JS_BUDGET_KB = 220;
const WEB3_VENDORS_BUDGET_KB = 180;
const CSS_BUDGET_KB = 60;

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
const web3VendorFiles = new Set();

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
  for (const file of allChunkFiles) {
    const rel = path.relative(nextDir, file).replace(/\\/g, "/");
    if (rel.includes("web3-vendors") || rel.includes("wagmi") || rel.includes("viem") || rel.includes("ethers")) {
      web3VendorFiles.add(rel);
    }
  }
}

let initialBytes = 0;
const initialOffenders = [];
for (const relativePath of initialFiles) {
  const filePath = path.join(nextDir, relativePath);
  if (!fs.existsSync(filePath)) continue;
  const size = fs.statSync(filePath).size;
  initialBytes += size;
  if (size > 100 * 1024) {
    initialOffenders.push({ file: relativePath, kb: (size / 1024).toFixed(1) });
  }
}

let web3Bytes = 0;
for (const rel of web3VendorFiles) {
  const filePath = path.join(nextDir, rel);
  if (!fs.existsSync(filePath)) continue;
  web3Bytes += fs.statSync(filePath).size;
}

const cssDir = path.join(nextDir, "static", "css");
let cssBytes = 0;
if (fs.existsSync(cssDir)) {
  const walk = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) walk(full);
      else if (item.isFile() && item.name.endsWith(".css")) {
        cssBytes += fs.statSync(full).size;
      }
    }
  };
  walk(cssDir);
}

const initialKb = initialBytes / 1024;
const web3Kb = web3Bytes / 1024;
const cssKb = cssBytes / 1024;

console.log("Initial JS:      " + initialKb.toFixed(1) + " KB  (budget: " + INITIAL_JS_BUDGET_KB + " KB)");
console.log("Web3-vendor JS:  " + web3Kb.toFixed(1) + " KB  (budget: " + WEB3_VENDORS_BUDGET_KB + " KB)");
console.log("CSS:             " + cssKb.toFixed(1) + " KB  (budget: " + CSS_BUDGET_KB + " KB)");

let hasError = false;

if (initialKb > INITIAL_JS_BUDGET_KB) {
  console.error("FAIL: Initial JS exceeded by " + (initialKb - INITIAL_JS_BUDGET_KB).toFixed(1) + " KB");
  hasError = true;
}
if (web3Kb > WEB3_VENDORS_BUDGET_KB) {
  console.error("FAIL: Web3 vendor JS exceeded by " + (web3Kb - WEB3_VENDORS_BUDGET_KB).toFixed(1) + " KB");
  hasError = true;
}
if (cssKb > CSS_BUDGET_KB) {
  console.error("FAIL: CSS exceeded by " + (cssKb - CSS_BUDGET_KB).toFixed(1) + " KB");
  hasError = true;
}
if (initialOffenders.length > 0) {
  console.error("Large initial chunks:");
  for (const item of initialOffenders) {
    console.error("  - " + item.file + ": " + item.kb + " KB");
  }
  hasError = true;
}

if (hasError) {
  process.exit(1);
}
console.log("All performance budgets passed.");
