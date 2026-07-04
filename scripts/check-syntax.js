const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const targets = [path.join(root, "index.js")];

function collectJavaScriptFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectJavaScriptFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      targets.push(fullPath);
    }
  }
}

collectJavaScriptFiles(path.join(root, "src"));

let failed = false;

for (const file of targets) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log(`Checked ${targets.length} JavaScript files successfully.`);
