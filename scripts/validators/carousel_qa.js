#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const REQUIRED_STATUS_CHECKS = [
  "topic_approved",
  "md_created",
  "brand_fact_checked",
  "duplicate_checked",
  "cta_checked",
  "scope_checked",
];
const REQUIRED_FINAL_APPROVALS = ["planning_approved_by_user", "md_approved_by_user"];
const REQUIRED_FINAL_APPROVAL_EVIDENCE = [
  "planning_approval_source",
  "planning_approval_at",
  "md_approval_source",
  "md_approval_at",
];
const DUPLICATE_WARNING_PATTERNS = [
  /duplicate_signature/i,
  /title is very similar/i,
  /semantic_cluster .*appears again/i,
];
const OUT_OF_SCOPE_KEYS = new Set([
  "image_generation",
  "image_prompt",
  "image_sheet",
  "full_card_prompt",
  "image_asset",
  "source_html",
  "html_generation",
  "card_export",
  "final_card",
  "video_script",
  "mp4",
]);
const OUT_OF_SCOPE_KEY_PATTERNS = [
  /image.*(prompt|generation|sheet|asset)/i,
  /(prompt|generation|sheet|asset).*image/i,
  /card.*(prompt|export|image|final)/i,
  /(prompt|export|image|final).*card/i,
  /html.*(generation|source|export)/i,
  /(generation|source|export).*html/i,
  /video/i,
  /mp4/i,
];
const PLACEHOLDER_EVIDENCE_VALUES = new Set(["none", "n/a", "na", "todo", "tbd", "later", "soon", "placeholder", "-"]);
const PLACEHOLDER_EVIDENCE_PATTERNS = [
  /not\s+available/i,
  /pending\s+confirmation/i,
  /awaiting\s+confirmation/i,
  /needs?\s+confirmation/i,
  /미정/,
  /대기/,
  /나중/,
  /확인\s*예정/,
];

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    file: null,
    stage: "final",
    errors: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--file") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        options.errors.push("--file requires a value");
        continue;
      }
      options.file = value;
      index += 1;
    } else if (arg.startsWith("--file=")) {
      const value = arg.slice("--file=".length);
      if (!value) options.errors.push("--file requires a value");
      else options.file = value;
    } else if (arg === "--stage") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        options.errors.push("--stage requires a value");
        continue;
      }
      options.stage = value;
      index += 1;
    } else if (arg.startsWith("--stage=")) {
      const value = arg.slice("--stage=".length);
      if (!value) options.errors.push("--stage requires a value");
      else options.stage = value;
    } else {
      options.errors.push(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function toProjectRelative(root, filePath) {
  return path.relative(root, path.resolve(filePath)).split(path.sep).join("/");
}

function readCarouselJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match) throw new Error("JSON code block not found");
  return JSON.parse(match[1]);
}

function getCarouselId(filePath, data) {
  if (data && data.id !== undefined && data.id !== null && data.id !== "") {
    const rawValue = String(data.id);
    if (!/^\d{1,3}$/.test(rawValue)) {
      throw new Error("JSON id must be a 1-3 digit number");
    }
    return rawValue.padStart(3, "0");
  }
  const match = path.basename(filePath).match(/^(\d{3})_/);
  if (match) return match[1];
  throw new Error("Carousel id must be a 3-digit value or filename prefix");
}

function getFilenameId(filePath) {
  const match = path.basename(filePath).match(/^(\d{3})_/);
  return match ? match[1] : "";
}

function parseControlChecks(markdown) {
  const checks = {};
  const checkboxPattern = /^\s*[-*]\s+\[(x|X| )\]\s+([A-Za-z0-9_-]+)\s*$/gm;
  let match;
  while ((match = checkboxPattern.exec(markdown)) !== null) {
    checks[match[2]] = match[1].toLowerCase() === "x";
  }

  const keyValuePattern = /^\s*([A-Za-z0-9_-]+)\s*:\s*(.+?)\s*$/gmi;
  while ((match = keyValuePattern.exec(markdown)) !== null) {
    const value = match[2].trim();
    if (/^(true|false)$/i.test(value)) checks[match[1]] = value.toLowerCase() === "true";
    else checks[match[1]] = value;
  }

  return checks;
}

function runValidateContent(root, filePath) {
  const relativeFile = toProjectRelative(root, filePath);
  const result = spawnSync(process.execPath, ["scripts/validators/validate_content.js", "--file", relativeFile], {
    cwd: root,
    encoding: "utf8",
  });
  return {
    exitCode: result.status === null ? 1 : result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function getWarningLines(output) {
  return String(output || "")
    .split(/\r?\n/)
    .filter((line) => line.includes("WARN "));
}

function findDuplicateWarnings(output) {
  return getWarningLines(output).filter((line) => DUPLICATE_WARNING_PATTERNS.some((pattern) => pattern.test(line)));
}

function readControlFile(filePath, label, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${label} is required: ${filePath}`);
    return {};
  }
  return parseControlChecks(fs.readFileSync(filePath, "utf8"));
}

function requireChecks(checks, requiredKeys, label, errors) {
  for (const key of requiredKeys) {
    if (checks[key] !== true) {
      errors.push(`${label}.${key} must be checked before carousel QA can pass`);
    }
  }
}

function requireEvidence(checks, requiredKeys, label, errors) {
  for (const key of requiredKeys) {
    const value = typeof checks[key] === "string" ? checks[key].trim() : "";
    if (value.length < 4) {
      errors.push(`${label}.${key} must record approval evidence before final QA can pass`);
      continue;
    }
    if (PLACEHOLDER_EVIDENCE_VALUES.has(value.toLowerCase())) {
      errors.push(`${label}.${key} contains placeholder approval evidence`);
    }
    if (PLACEHOLDER_EVIDENCE_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(`${label}.${key} contains placeholder approval evidence`);
    }
    if (key.endsWith("_at") && (Number.isNaN(Date.parse(value)) || !value.includes("T"))) {
      errors.push(`${label}.${key} must be a valid ISO-like approval timestamp`);
    }
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function bigrams(value) {
  const normalized = normalizeText(value);
  const result = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
}

function similarity(a, b) {
  const left = bigrams(a);
  const right = bigrams(b);
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const item of left) {
    if (right.has(item)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

function readCorpusItems(root) {
  const dir = path.join(root, "content", "source", "carousel");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(dir, entry.name))
    .map((filePath) => {
      try {
        const data = readCarouselJson(filePath);
        return { filePath, data, id: getCarouselId(filePath, data) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function readQualityRules(root) {
  const filePath = path.join(root, "data", "problems", "PROBLEM_QUALITY_RULES.json");
  if (!fs.existsSync(filePath)) return { semantic_cluster_recent_limit: 10, problems: {}, missing: true };
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { semantic_cluster_recent_limit: 10, problems: {}, parseError: true };
  }
}

function getProblemCodes(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(" ") : String(value);
  return raw.match(/[A-Z]\d{2}/g) || [];
}

function hasProblemRefs(data) {
  return getProblemCodes(data.problem_bank_ref).length > 0;
}

function getSemanticClusters(data, qualityRules) {
  return getProblemCodes(data.problem_bank_ref)
    .map((code) => qualityRules.problems?.[code]?.semantic_cluster)
    .filter(Boolean);
}

function findOutOfScopeKeys(value, trail = "") {
  const found = [];
  if (!value || typeof value !== "object") return found;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      found.push(...findOutOfScopeKeys(item, `${trail}[${index}]`));
    });
    return found;
  }

  for (const [key, child] of Object.entries(value)) {
    const keyPath = trail ? `${trail}.${key}` : key;
    const normalizedKey = key.toLowerCase();
    if (OUT_OF_SCOPE_KEYS.has(normalizedKey) || OUT_OF_SCOPE_KEY_PATTERNS.some((pattern) => pattern.test(normalizedKey))) {
      found.push(keyPath);
    }
    found.push(...findOutOfScopeKeys(child, keyPath));
  }

  return found;
}

function findCorpusDuplicateRisks(root, targetFilePath, targetData, targetId) {
  const risks = [];
  const targetTitle = targetData.title || targetData.theme || "";
  const targetSignature = normalizeText(targetData.duplicate_signature);
  const qualityRules = readQualityRules(root);
  const targetClusters = new Set(getSemanticClusters(targetData, qualityRules));
  const recentLimit = Number.isInteger(qualityRules.semantic_cluster_recent_limit)
    ? qualityRules.semantic_cluster_recent_limit
    : 10;
  const corpusItems = readCorpusItems(root)
    .sort((a, b) => Number.parseInt(b.id, 10) - Number.parseInt(a.id, 10));
  const recentItems = corpusItems
    .filter((item) => path.resolve(item.filePath) !== path.resolve(targetFilePath))
    .slice(0, recentLimit);

  if ((qualityRules.missing || qualityRules.parseError) && (hasProblemRefs(targetData) || corpusItems.some((item) => hasProblemRefs(item.data)))) {
    risks.push("PROBLEM_QUALITY_RULES.json is required for semantic cluster QA when problem_bank_ref exists");
    return risks;
  }

  for (const item of corpusItems) {
    if (path.resolve(item.filePath) === path.resolve(targetFilePath)) continue;

    if (item.id === targetId) {
      risks.push(`duplicate id ${targetId} is also used by ${toProjectRelative(root, item.filePath)}`);
    }

    const otherTitle = item.data.title || item.data.theme || "";
    const titleScore = similarity(targetTitle, otherTitle);
    if (targetTitle && otherTitle && titleScore >= 0.72) {
      risks.push(
        `title duplicates or nearly duplicates ${toProjectRelative(root, item.filePath)} (${Math.round(titleScore * 100)}%)`,
      );
    }

    const otherSignature = normalizeText(item.data.duplicate_signature);
    if (targetSignature && otherSignature && targetSignature === otherSignature) {
      risks.push(`duplicate_signature duplicates ${toProjectRelative(root, item.filePath)}`);
    }
  }

  for (const item of recentItems) {
    const otherClusters = getSemanticClusters(item.data, qualityRules);
    for (const cluster of otherClusters) {
      if (targetClusters.has(cluster)) {
        risks.push(`semantic_cluster duplicates recent corpus (${cluster}) at ${toProjectRelative(root, item.filePath)}`);
      }
    }
  }

  return risks;
}

function writeQaManifest(root, id, manifest) {
  const qaDir = path.join(root, "outputs", "qa", "carousel", id);
  fs.mkdirSync(qaDir, { recursive: true });
  const manifestPath = path.join(qaDir, "qa_manifest.json");
  fs.writeFileSync(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.renameSync(`${manifestPath}.tmp`, manifestPath);
  return manifestPath;
}

function runCarouselQa({
  root = ROOT,
  file,
  stage = "final",
  argumentErrors = [],
  validateRunner = runValidateContent,
  writeManifest = true,
} = {}) {
  const errors = [...argumentErrors];
  const warnings = [];
  const startedAt = new Date().toISOString();

  if (!file) {
    errors.push("--file is required");
    return { ok: false, errors, warnings, manifestPath: null };
  }

  const filePath = path.resolve(root, file);
  let id = "unknown";
  let data = null;

  if (!fs.existsSync(filePath)) {
    errors.push(`Carousel MD file does not exist: ${filePath}`);
  } else {
    try {
      data = readCarouselJson(filePath);
      id = getCarouselId(filePath, data);
      const filenameId = getFilenameId(filePath);
      if (!filenameId) {
        errors.push("filename must start with NNN_ prefix");
      } else if (filenameId !== id) {
        errors.push(`filename prefix ${filenameId} does not match JSON id ${id}`);
      }
    } catch (error) {
      errors.push(`Carousel MD JSON is not readable: ${error.message}`);
    }
  }

  const qaDir = path.join(root, "outputs", "qa", "carousel", id);
  const statusPath = path.join(qaDir, "STATUS.md");
  const approvalPath = path.join(qaDir, "APPROVAL_LOG.md");

  const statusChecks = readControlFile(statusPath, "STATUS.md", errors);
  const approvalChecks = stage === "final" || fs.existsSync(approvalPath)
    ? readControlFile(approvalPath, "APPROVAL_LOG.md", errors)
    : {};
  requireChecks(statusChecks, REQUIRED_STATUS_CHECKS, "STATUS", errors);

  if (stage === "final") {
    requireChecks(approvalChecks, REQUIRED_FINAL_APPROVALS, "APPROVAL_LOG", errors);
    requireEvidence(approvalChecks, REQUIRED_FINAL_APPROVAL_EVIDENCE, "APPROVAL_LOG", errors);
  } else if (!["draft", "final"].includes(stage)) {
    errors.push(`Unsupported --stage value: ${stage}`);
  }

  const validation = filePath && fs.existsSync(filePath)
    ? validateRunner(root, filePath)
    : { exitCode: 1, stdout: "", stderr: "" };

  if (validation.exitCode !== 0) {
    errors.push("validate_content.js failed for this carousel file");
  }

  const duplicateWarnings = findDuplicateWarnings(`${validation.stdout}\n${validation.stderr}`);
  for (const warning of duplicateWarnings) {
    errors.push(`duplicate-risk warning must be resolved before QA pass: ${warning.trim()}`);
  }

  if (data && id !== "unknown" && fs.existsSync(filePath)) {
    for (const risk of findCorpusDuplicateRisks(root, filePath, data, id)) {
      errors.push(`corpus duplicate risk must be resolved before QA pass: ${risk}`);
    }
    for (const keyPath of findOutOfScopeKeys(data)) {
      errors.push(`out-of-scope key is not allowed in MD-only carousel QA: ${keyPath}`);
    }
  }

  const manifest = {
    version: 1,
    generated_at: startedAt,
    carousel_id: id,
    file: filePath && fs.existsSync(filePath) ? toProjectRelative(root, filePath) : String(file || ""),
    stage,
    ok: errors.length === 0,
    gates: {
      status: statusChecks,
      approval: approvalChecks,
      validate_content_exit_code: validation.exitCode,
      duplicate_warnings: duplicateWarnings,
    },
    errors,
    warnings,
  };

  const manifestPath = writeManifest && id !== "unknown" ? writeQaManifest(root, id, manifest) : null;
  return { ok: errors.length === 0, errors, warnings, manifestPath, manifest };
}

function main() {
  const options = parseArgs();
  const result = runCarouselQa({ ...options, argumentErrors: options.errors });
  console.log(`Carousel QA: ${result.ok ? "PASS" : "FAIL"}`);
  if (result.manifestPath) console.log(`Manifest: ${toProjectRelative(ROOT, result.manifestPath)}`);
  console.log(`Errors: ${result.errors.length}`);
  result.errors.forEach((error) => console.log(`  ERROR ${error}`));
  console.log(`Warnings: ${result.warnings.length}`);
  result.warnings.forEach((warning) => console.log(`  WARN ${warning}`));
  process.exit(result.ok ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  parseControlChecks,
  runCarouselQa,
  runValidateContent,
  findDuplicateWarnings,
};
