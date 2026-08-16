#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync, readlinkSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const skillsRoot = join(repoRoot, "skills");
const expectedSkills = [
  "ce-brainstorm",
  "ce-plan",
  "ce-work",
  "ce-simplify-code",
  "ce-code-review",
  "ce-compound",
];

function usage() {
  return [
    "Usage: node scripts/dev-install.mjs <local|status|remove> [--host=codex|claude|all]",
    "",
    "Commands:",
    "  local   Link this checkout's skills into local agent skill locations.",
    "  status  Show whether local links are active.",
    "  remove  Remove only links managed by this script.",
  ].join("\n");
}

function parseArgs(argv) {
  const command = argv.find((arg) => !arg.startsWith("--")) ?? "status";
  const hostArg = argv.find((arg) => arg.startsWith("--host="));
  const host = hostArg ? hostArg.slice("--host=".length) : "all";
  if (!["local", "status", "remove"].includes(command)) throw new Error(`Unknown command '${command}'.\n${usage()}`);
  if (!["codex", "claude", "all"].includes(host)) throw new Error(`Unknown host '${host}'. Use codex, claude, or all.`);
  return { command, host };
}

function homePath(path) {
  return path.replace(/^~(?=$|\/)/, homedir());
}

function codexHome() {
  return resolve(homePath(process.env.CODEX_HOME || "~/.codex"));
}

function claudeHome() {
  return resolve(homePath(process.env.CLAUDE_CONFIG_DIR || "~/.claude"));
}

function resolveExisting(path) {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

function linkState(path, expectedTarget) {
  if (!existsSync(path)) return { kind: "absent", path, expectedTarget };
  const stat = lstatSync(path);
  if (!stat.isSymbolicLink()) return { kind: "collision", path, expectedTarget };
  const rawTarget = readlinkSync(path);
  const resolvedTarget = resolveExisting(path);
  if (!resolvedTarget) return { kind: "broken", path, rawTarget, expectedTarget };
  if (resolvedTarget !== realpathSync(expectedTarget)) {
    return { kind: "unrelated", path, rawTarget, resolvedTarget, expectedTarget };
  }
  return { kind: "active", path, rawTarget, resolvedTarget, expectedTarget };
}

function assertRepoShape() {
  for (const skill of expectedSkills) {
    const skillPath = join(skillsRoot, skill, "SKILL.md");
    if (!existsSync(skillPath)) throw new Error(`Missing ${skillPath}`);
  }
  const sharedContext = join(skillsRoot, "_shared", "context.mjs");
  if (!existsSync(sharedContext)) throw new Error(`Missing ${sharedContext}`);
}

function createManagedSymlink(path, expectedTarget) {
  const state = linkState(path, expectedTarget);
  if (state.kind === "active") return state;
  if (state.kind !== "absent") {
    throw new Error(`${path} is ${state.kind}; refusing to overwrite a path not managed by this checkout.`);
  }
  mkdirSync(dirname(path), { recursive: true });
  symlinkSync(expectedTarget, path, "dir");
  return linkState(path, expectedTarget);
}

function removeManagedSymlink(path, expectedTarget) {
  const state = linkState(path, expectedTarget);
  if (state.kind === "active" || state.kind === "broken") {
    rmSync(path);
    return { ...state, removed: true };
  }
  return { ...state, removed: false };
}

function codexLinks() {
  return [
    {
      label: "codex collection",
      path: join(codexHome(), "skills", "ce-gstack-local"),
      target: skillsRoot,
    },
  ];
}

function claudeLinks() {
  const root = join(claudeHome(), "skills");
  return [
    { label: "claude shared support", path: join(root, "_shared"), target: join(skillsRoot, "_shared") },
    ...expectedSkills.map((skill) => ({
      label: `claude ${skill}`,
      path: join(root, skill),
      target: join(skillsRoot, skill),
    })),
  ];
}

function selectedLinks(host) {
  if (host === "codex") return codexLinks();
  if (host === "claude") return claudeLinks();
  return [...codexLinks(), ...claudeLinks()];
}

function formatState(link, state) {
  if (state.kind === "active") return `${link.label}: active -> ${state.resolvedTarget}`;
  if (state.kind === "absent") return `${link.label}: absent (${link.path})`;
  if (state.kind === "broken") return `${link.label}: broken symlink at ${link.path}`;
  if (state.kind === "collision") return `${link.label}: collision at ${link.path}`;
  return `${link.label}: unrelated -> ${state.resolvedTarget}`;
}

function run() {
  const { command, host } = parseArgs(process.argv.slice(2));
  assertRepoShape();
  const links = selectedLinks(host);

  if (command === "status") {
    for (const link of links) console.log(formatState(link, linkState(link.path, link.target)));
    return;
  }

  if (command === "local") {
    for (const link of links) console.log(formatState(link, createManagedSymlink(link.path, link.target)));
    console.log("Restart the target agent session if newly linked skills do not appear.");
    return;
  }

  for (const link of links) {
    const state = removeManagedSymlink(link.path, link.target);
    const suffix = state.removed ? "removed" : "left unchanged";
    console.log(`${formatState(link, state)} (${suffix})`);
  }
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
