import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const expectedName = "ce-gstack";
const expectedVersion = "0.1.0";

function fail(message) {
  console.error(`manifest validation failed: ${message}`);
  process.exitCode = 1;
}

function readJson(path) {
  const full = join(root, path);
  if (!existsSync(full)) {
    fail(`missing ${path}`);
    return {};
  }

  try {
    return JSON.parse(readFileSync(full, "utf8"));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
    return {};
  }
}

for (const path of [
  "package.json",
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
]) {
  const json = readJson(path);
  if (path !== ".claude-plugin/marketplace.json") {
    if (json.name !== expectedName) fail(`${path} name must be ${expectedName}`);
    if (json.version !== expectedVersion) fail(`${path} version must be ${expectedVersion}`);
  }
}

const codex = readJson(".codex-plugin/plugin.json");
if (codex.skills !== "./skills/") {
  fail(".codex-plugin/plugin.json must expose ./skills/");
}

const marketplace = readJson(".claude-plugin/marketplace.json");
const plugins = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
if (plugins.length !== 1 || plugins[0]?.name !== expectedName || plugins[0]?.source !== "./") {
  fail(".claude-plugin/marketplace.json must contain exactly one local ce-gstack plugin");
}

if (!process.exitCode) {
  console.log("manifest validation passed");
}
