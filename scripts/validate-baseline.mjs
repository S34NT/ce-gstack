import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const expectedSkills = [
  "ce-brainstorm",
  "ce-plan",
  "ce-work",
  "ce-simplify-code",
  "ce-code-review",
  "ce-compound",
];

const expectedSkillSupport = {
  "ce-brainstorm": {
    required: [
      "references/brainstorm-sections.md",
      "references/markdown-rendering.md",
      "references/html-rendering.md",
      "references/settled-decisions.md",
      "scripts/context.mjs",
    ],
  },
  "ce-plan": {
    required: [
      "references/plan-sections.md",
      "references/markdown-rendering.md",
      "references/html-rendering.md",
      "references/settled-decisions.md",
      "scripts/context.mjs",
    ],
  },
  "ce-work": {
    required: [
      "references/execution-engines.md",
      "references/implementation-loop.md",
      "references/implementation-result-schema.json",
      "references/shipping-workflow.md",
      "scripts/context.mjs",
    ],
  },
  "ce-simplify-code": {
    required: [
      "references/personas/code-reuse-reviewer.md",
      "references/personas/code-quality-reviewer.md",
      "references/personas/efficiency-reviewer.md",
      "scripts/context.mjs",
    ],
  },
  "ce-code-review": {
    required: [
      "references/findings-schema.json",
      "references/persona-catalog.md",
      "references/dispatch-reviewers.md",
      "references/finish-review.md",
      "scripts/context.mjs",
      "scripts/review-scope.py",
    ],
  },
  "ce-compound": {
    required: [
      "assets/resolution-template.md",
      "references/schema.yaml",
      "references/yaml-schema.md",
      "references/concepts-vocabulary.md",
      "scripts/context.mjs",
      "scripts/validate-frontmatter.py",
      "scripts/validate-doc-claims.py",
    ],
  },
};

const forbiddenRuntimeMarkers = [
  "TELEMETRY:",
  "SESSION_KIND:",
  "MODEL_OVERLAY:",
  "CHECKPOINT_MODE:",
  "UPGRADE_AVAILABLE",
  "JUST_UPGRADED",
  "~/.gstack",
  "GSTACK_HOME",
  "gstack-config",
  "gstack-update-check",
  "gstack-session-kind",
];

function fail(message) {
  console.error(`baseline validation failed: ${message}`);
  process.exitCode = 1;
}

function repoPath(path) {
  return join(root, path);
}

function requireFile(path) {
  const full = repoPath(path);
  if (!existsSync(full) || !statSync(full).isFile()) {
    fail(`missing file ${path}`);
  }
}

function requireDir(path) {
  const full = repoPath(path);
  if (!existsSync(full) || !statSync(full).isDirectory()) {
    fail(`missing directory ${path}`);
  }
}

function readText(path) {
  return readFileSync(repoPath(path), "utf8");
}

function listFiles(dir) {
  const fullDir = repoPath(dir);
  if (!existsSync(fullDir)) return [];

  const entries = readdirSync(fullDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return listFiles(path);
    if (entry.isFile()) return [path];
    return [];
  });
}

function runCheck(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    fail(`${label} could not start: ${result.error.message}`);
    return;
  }

  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || "").trim();
    fail(`${label} failed${details ? `: ${details}` : ""}`);
  }
}

function isActiveConfigLine(text, key, expectedValue) {
  const pattern = new RegExp(`^\\s*${key}\\s*:\\s*${expectedValue}\\s*(?:#.*)?$`, "m");
  return pattern.test(text);
}

function activeConfigValue(text, key) {
  const match = text.match(new RegExp(`^\\s*${key}\\s*:\\s*([^#\\n]+)`, "m"));
  return match?.[1]?.trim();
}

function extractLocalReferences(skill, markdownPath) {
  const text = readText(markdownPath);
  const refs = new Set();
  const referencePattern = /(?:^|[\s`"'\[(])((?:references|scripts|assets)\/[A-Za-z0-9._/@()+,\-\/]+)(?=[\s`"')\],.:;]|$)/g;

  for (const match of text.matchAll(referencePattern)) {
    const ref = match[1].replace(/[.,;:)]+$/g, "");
    if (ref.includes("<") || ref.includes(">") || ref.includes("…")) continue;
    if (ref === "references" || ref === "scripts" || ref === "assets") continue;
    if (!ref.endsWith("/") && !basename(ref).includes(".")) continue;
    refs.add(ref);
  }

  for (const ref of refs) {
    const target = `skills/${skill}/${ref}`;
    const full = repoPath(target);
    if (!existsSync(full)) {
      fail(`${markdownPath} references missing local asset ${ref}`);
    }
  }
}

for (const path of [
  ".compound-engineering/config.yaml",
  ".compound-engineering/config.local.yaml",
  "STRATEGY.md",
  "CONCEPTS.md",
  "AGENTS.md",
  "docs/plans/.gitkeep",
  "docs/solutions/.gitkeep",
]) {
  requireFile(path);
}

requireDir("skills");
requireDir("docs/plans");
requireDir("docs/solutions");

for (const skill of expectedSkills) {
  requireFile(`skills/${skill}/SKILL.md`);
  for (const supportPath of expectedSkillSupport[skill].required) {
    requireFile(`skills/${skill}/${supportPath}`);
  }
}

const actualSkills = existsSync(join(root, "skills"))
  ? readdirSync(join(root, "skills"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  : [];

const sortedExpectedSkills = [...expectedSkills].sort();
if (actualSkills.join(",") !== sortedExpectedSkills.join(",")) {
  fail(`expected skills ${sortedExpectedSkills.join(", ")}, found ${actualSkills.join(", ")}`);
}

for (const path of [
  "package.json",
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".compound-engineering/config.yaml",
  ...expectedSkills.map((skill) => `skills/${skill}/SKILL.md`),
]) {
  const text = readText(path);
  for (const marker of forbiddenRuntimeMarkers) {
    if (text.includes(marker)) {
      fail(`${path} contains forbidden Phase 1 runtime marker ${JSON.stringify(marker)}`);
    }
  }
}

const docsEntries = readdirSync(repoPath("docs"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (docsEntries.join(",") !== "plans,solutions") {
  fail(`docs/ must contain only plans/ and solutions/ in Phase 1, found ${docsEntries.join(", ")}`);
}

const config = readText(".compound-engineering/config.yaml");
if (!isActiveConfigLine(config, "plan_output", "md")) {
  fail(".compound-engineering/config.yaml must set plan_output: md");
}
if (!isActiveConfigLine(config, "brainstorm_output", "md")) {
  fail(".compound-engineering/config.yaml must set brainstorm_output: md");
}
if (activeConfigValue(config, "docs_root") && activeConfigValue(config, "docs_root") !== "docs") {
  fail(".compound-engineering/config.yaml must leave docs_root unset or set it to docs in Phase 1");
}

const localConfig = readText(".compound-engineering/config.local.yaml");
if (activeConfigValue(localConfig, "docs_root")) {
  fail(".compound-engineering/config.local.yaml must not set docs_root");
}

const gitignore = readText(".gitignore");
if (!gitignore.split(/\r?\n/).includes(".compound-engineering/config.local.yaml")) {
  fail(".gitignore must ignore .compound-engineering/config.local.yaml");
}

for (const skill of expectedSkills) {
  for (const markdownPath of listFiles(`skills/${skill}`).filter((path) => path.endsWith(".md"))) {
    extractLocalReferences(skill, markdownPath);
  }
}

for (const path of listFiles("skills")) {
  if (path.endsWith(".json")) {
    try {
      JSON.parse(readText(path));
    } catch (error) {
      fail(`${path} is not valid JSON: ${error.message}`);
    }
  }

  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    runCheck(`YAML parse ${path}`, "python3", [
      "-c",
      "import pathlib, sys, yaml; yaml.safe_load(pathlib.Path(sys.argv[1]).read_text())",
      repoPath(path),
    ]);
  }

  if (path.endsWith(".py")) {
    runCheck(`Python compile ${path}`, "python3", ["-m", "py_compile", repoPath(path)]);
  }

  if (path.endsWith(".mjs") || path.endsWith(".js")) {
    runCheck(`Node syntax ${path}`, "node", ["--check", repoPath(path)]);
  }

  if (path.endsWith(".sh")) {
    runCheck(`Shell syntax ${path}`, "bash", ["-n", repoPath(path)]);
  }
}

for (const path of [
  "skills/ce-code-review/references/findings-schema.json",
  "skills/ce-work/references/implementation-result-schema.json",
]) {
  const schema = JSON.parse(readText(path));
  if (schema.type !== "object" || !schema.properties || typeof schema.properties !== "object") {
    fail(`${path} must be an object JSON schema with properties`);
  }
}

runCheck("Compound schema parse", "python3", [
  "-c",
  "import pathlib, sys, yaml; data=yaml.safe_load(pathlib.Path(sys.argv[1]).read_text()); assert isinstance(data, dict), 'schema must be a mapping'; assert data, 'schema must not be empty'",
  repoPath("skills/ce-compound/references/schema.yaml"),
]);

if (!process.exitCode) {
  console.log("baseline validation passed");
}
