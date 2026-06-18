#!/usr/bin/env node
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const LEGACY_ALLOWLIST_PATH = path.join(ROOT, "data", "schema", "LEGACY_CAROUSEL_ALLOWLIST.json");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.stdio || "pipe",
  });
}

function getChangedCarouselEntries() {
  const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "origin/main";
  try {
    run("git", ["fetch", "--no-tags", "origin", process.env.GITHUB_BASE_REF || "main"], { stdio: "ignore" });
  } catch {
    // The checkout may already have the base commit when fetch-depth is 0.
  }

  const output = run("git", [
    "-c",
    "core.quotepath=false",
    "diff",
    "--name-status",
    "--diff-filter=AM",
    `${baseRef}...HEAD`,
    "--",
    "content/source/carousel",
  ]);

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\t+/);
      return { status: parts[0], file: parts[parts.length - 1] };
    })
    .filter((entry) => entry.file.endsWith(".md"));
}

function readLegacyAllowlist() {
  if (!require("node:fs").existsSync(LEGACY_ALLOWLIST_PATH)) return new Set();
  const parsed = JSON.parse(require("node:fs").readFileSync(LEGACY_ALLOWLIST_PATH, "utf8"));
  return new Set(parsed.legacy_files || []);
}

function readCarouselProfile(file) {
  const fs = require("node:fs");
  const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match) throw new Error(`JSON code block not found: ${file}`);
  const data = JSON.parse(match[1]);
  return data.validation_profile || "";
}

function main() {
  const entries = getChangedCarouselEntries();
  if (entries.length === 0) {
    console.log("No changed carousel MD files.");
    return;
  }

  const legacyAllowlist = readLegacyAllowlist();
  console.log(`Changed carousel MD files: ${entries.length}`);
  for (const { file } of entries) {
    const profile = readCarouselProfile(file);
    if (profile === "strict") {
      console.log(`Validating strict schema: ${file}`);
      run("node", ["scripts/validators/validate_content.js", "--require-strict", "--file", file], { stdio: "inherit" });
      console.log(`Running final QA: ${file}`);
      run("node", ["scripts/validators/carousel_qa.js", "--file", file, "--stage", "final"], { stdio: "inherit" });
      continue;
    }

    if (profile === "legacy" && legacyAllowlist.has(file)) {
      console.log(`Validating allowlisted legacy carousel: ${file}`);
      run("node", ["scripts/validators/validate_content.js", "--file", file], { stdio: "inherit" });
      continue;
    }

    throw new Error(`${file}: changed carousel MD must be schema v6 strict or an explicit allowlisted legacy file`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getChangedCarouselEntries,
};
