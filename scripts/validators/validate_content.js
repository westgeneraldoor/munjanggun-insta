#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { readQualityRules, evaluateProblemRefs } = require("../lib/content_quality");

const ROOT = path.resolve(__dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT, "content", "source", "carousel");
const REGISTRY_PATH = path.join(ROOT, "data", "registry", "INSTAGRAM_POSTING_REGISTRY.md");
const SCORECARD_LOG_PATH = path.join(ROOT, "data", "registry", "CAROUSEL_SCORECARD_LOG.json");
const REQUIRED_VISUAL_INTENT_FROM_ID = 28;
const REQUIRED_MD_META_FROM_ID = 35;
const REQUIRED_STRICT_QUALITY_FROM_ID = 39;
const HASHTAG_MIN = 20;
const HASHTAG_MAX = 25;
const ALLOWED_HOOK_TYPES = new Set(["손실회피", "실수방지", "공감", "비교", "스토리"]);
const ALLOWED_PURPOSE_TAGS = new Set(["SAVE", "SHARE", "TRUST", "LEAD", "AD"]);
const ALLOWED_SLIDE_TYPES = new Set(["cover", "point", "checklist", "compare", "cta", "caption_card"]);
const SCORECARD_FIELDS = ["hook_power", "saveability", "shareability", "dm_intent", "brand_fit"];
const RISKY_CLAIM_PATTERNS = [
  { label: "absolute guarantee", pattern: /완벽|확실한|100%|무조건/g },
  { label: "superlative claim", pattern: /최고|최장|업계\s*유일|국내\s*최고|업계\s*최장/g },
  { label: "unsupported numeric claim", pattern: /\d+\s*%|\d+\s*배|수십만\s*원|평당\s*\d+/g },
  { label: "competitor attack tone", pattern: /먹튀|일용직|대충|책임\s*회피|연락\s*두절/g },
];

const errors = [];
const warnings = [];

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    since: null,
    files: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--since") {
      options.since = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg.startsWith("--since=")) {
      options.since = Number.parseInt(arg.split("=")[1], 10);
    } else if (arg === "--file" || arg === "validate:file") {
      const value = argv[index + 1];
      if (value) options.files.push(path.resolve(ROOT, value));
      index += 1;
    } else if (arg.startsWith("--file=")) {
      options.files.push(path.resolve(ROOT, arg.split("=")[1]));
    }
  }

  return options;
}

function getNumericIdFromPath(filePath) {
  const base = path.basename(filePath);
  const match = base.match(/^(\d{3})_/);
  return match ? Number.parseInt(match[1], 10) : -1;
}

function filterCarouselFiles(files, options) {
  let selected = files;

  if (Number.isInteger(options.since)) {
    selected = selected.filter((filePath) => getNumericIdFromPath(filePath) >= options.since);
  }

  if (options.files.length > 0) {
    const requested = new Set(options.files.map((filePath) => path.resolve(filePath)));
    selected = selected.filter((filePath) => requested.has(path.resolve(filePath)));
    for (const requestedPath of requested) {
      if (!files.some((filePath) => path.resolve(filePath) === requestedPath)) {
        errors.push(`Requested file is not under carousel source or does not exist: ${path.relative(ROOT, requestedPath)}`);
      }
    }
  }

  return selected;
}

function readCarouselFiles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    errors.push(`Missing carousel source directory: ${path.relative(ROOT, CONTENT_DIR)}`);
    return [];
  }

  const results = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["assets", "prompts", "qa"].includes(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }

  walk(CONTENT_DIR);
  return results.sort((a, b) => a.localeCompare(b));
}

function parseJsonBlock(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match) {
    throw new Error("JSON code block not found");
  }
  return JSON.parse(match[1]);
}

function countHashtags(value) {
  if (!value || typeof value !== "string") return 0;
  return (value.match(/#[^\s#]+/g) || []).length;
}

function charLength(value) {
  return typeof value === "string" ? [...value].length : 0;
}

function countSentences(value) {
  if (typeof value !== "string") return 0;
  return value
    .split(/[.!?。？！\n]|다\.|요\.|니다\./)
    .map((part) => part.trim())
    .filter(Boolean).length;
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

function readScorecardLog() {
  if (!fs.existsSync(SCORECARD_LOG_PATH)) return { entries: [] };
  try {
    return JSON.parse(fs.readFileSync(SCORECARD_LOG_PATH, "utf8"));
  } catch (error) {
    errors.push(`Scorecard log is not valid JSON: ${path.relative(ROOT, SCORECARD_LOG_PATH)} - ${error.message}`);
    return { entries: [] };
  }
}

function validateVisualIntent(fileName, data, numericId) {
  if (!data.visual_intent) {
    const message = `${fileName}: visual_intent is missing`;
    if (numericId >= REQUIRED_VISUAL_INTENT_FROM_ID) errors.push(message);
    else warnings.push(`${message} (legacy schema before DEC-028)`);
    return;
  }

  for (const key of ["hook_type", "emotion", "scene", "focus", "avoid"]) {
    if (data.visual_intent[key] === undefined || data.visual_intent[key] === "") {
      errors.push(`${fileName}: visual_intent.${key} is required`);
    }
  }

  if (!Array.isArray(data.visual_intent.avoid)) {
    errors.push(`${fileName}: visual_intent.avoid must be an array`);
  }

  if (charLength(data.visual_intent.scene) < 40) {
    warnings.push(`${fileName}: visual_intent.scene is very short`);
  }

  if (numericId >= REQUIRED_STRICT_QUALITY_FROM_ID && !ALLOWED_HOOK_TYPES.has(data.visual_intent.hook_type)) {
    errors.push(`${fileName}: visual_intent.hook_type must be one of ${[...ALLOWED_HOOK_TYPES].join(", ")}`);
  }

  if (numericId >= REQUIRED_STRICT_QUALITY_FROM_ID && countSentences(data.visual_intent.scene) < 2) {
    warnings.push(`${fileName}: visual_intent.scene should describe at least two concrete sentences`);
  }
}

function validateSlides(fileName, data, numericId) {
  if (!Array.isArray(data.slides)) {
    errors.push(`${fileName}: slides must be an array`);
    return;
  }

  if (typeof data.total_slides === "number" && data.total_slides !== data.slides.length) {
    errors.push(`${fileName}: total_slides=${data.total_slides}, slides.length=${data.slides.length}`);
  }

  if (data.slides.length < 6 || data.slides.length > 8) {
    warnings.push(`${fileName}: unusual slide count (${data.slides.length})`);
  }

  const first = data.slides[0];
  const last = data.slides[data.slides.length - 1];
  if (!first || first.type !== "cover") {
    errors.push(`${fileName}: first slide must be type=cover`);
  }

  const hasCta = data.slides.some((slide) => slide.type === "cta");
  if (!hasCta) {
    errors.push(`${fileName}: CTA slide is missing`);
  }

  if (!last || last.type !== "caption_card") {
    if (data.caption_card === false) {
      warnings.push(`${fileName}: caption_card intentionally disabled`);
    } else {
      errors.push(`${fileName}: last slide should be type=caption_card`);
    }
  }

  for (const slide of data.slides) {
    if (numericId >= REQUIRED_STRICT_QUALITY_FROM_ID && !ALLOWED_SLIDE_TYPES.has(slide.type)) {
      errors.push(`${fileName}: slide ${slide.slide} has unsupported type=${slide.type}`);
    }
    if (typeof slide.slide === "number" && slide.slide !== data.slides.indexOf(slide) + 1) {
      errors.push(`${fileName}: slide number sequence is broken at slide=${slide.slide}`);
    }
    if (slide.body && charLength(slide.body) > 120) {
      warnings.push(`${fileName}: slide ${slide.slide} body exceeds 120 chars`);
    }
    if (slide.tip && charLength(slide.tip) > 45) {
      warnings.push(`${fileName}: slide ${slide.slide} tip exceeds 45 chars`);
    }
    if (slide.hook && charLength(slide.hook) > 45) {
      warnings.push(`${fileName}: slide ${slide.slide} hook exceeds 45 chars`);
    }
  }
}

function validateHashtags(fileName, data) {
  let hashtags = data.hashtags;
  const captionSlide = Array.isArray(data.slides)
    ? data.slides.find((slide) => slide.type === "caption_card")
    : null;

  if (!hashtags && captionSlide) {
    hashtags = captionSlide.hashtags;
  }

  const count = countHashtags(hashtags);
  if (count === 0) {
    errors.push(`${fileName}: hashtags are missing`);
    return;
  }

  if (count < HASHTAG_MIN || count > HASHTAG_MAX) {
    warnings.push(`${fileName}: hashtag count is ${count}, expected ${HASHTAG_MIN}-${HASHTAG_MAX}`);
  }

  for (const tag of ["#문장군", "#문장군중문", "#문장군시공"]) {
    if (!hashtags.includes(tag)) {
      warnings.push(`${fileName}: brand hashtag missing: ${tag}`);
    }
  }
}

function validateNewMetadata(fileName, data, numericId) {
  if (numericId < REQUIRED_MD_META_FROM_ID) return;

  for (const key of ["content_type", "hook_type", "hook_score", "hook_score_reason", "purpose_tags", "problem_bank_ref", "target_persona", "variation_angle", "duplicate_signature", "cta_type"]) {
    if (data[key] === undefined || data[key] === "" || (Array.isArray(data[key]) && data[key].length === 0)) {
      errors.push(`${fileName}: ${key} is required for MD carousel schema`);
    }
  }

  if (typeof data.hook_score !== "number" || data.hook_score < 0 || data.hook_score > 10) {
    errors.push(`${fileName}: hook_score must be a number between 0 and 10`);
  }

  if (numericId >= REQUIRED_STRICT_QUALITY_FROM_ID && data.hook_score < 7) {
    errors.push(`${fileName}: hook_score must be at least 7 for production MD`);
  }

  if (numericId >= REQUIRED_STRICT_QUALITY_FROM_ID && !ALLOWED_HOOK_TYPES.has(data.hook_type)) {
    errors.push(`${fileName}: hook_type must be one of ${[...ALLOWED_HOOK_TYPES].join(", ")}`);
  }

  if (!Array.isArray(data.purpose_tags)) {
    errors.push(`${fileName}: purpose_tags must be an array`);
  } else if (numericId >= REQUIRED_STRICT_QUALITY_FROM_ID) {
    for (const tag of data.purpose_tags) {
      if (!ALLOWED_PURPOSE_TAGS.has(tag)) {
        errors.push(`${fileName}: unsupported purpose_tags value=${tag}`);
      }
    }
  }

  if (!Array.isArray(data.problem_bank_ref) && typeof data.problem_bank_ref !== "string") {
    errors.push(`${fileName}: problem_bank_ref must be a string or array`);
  }

}

function validateCta(fileName, data, numericId) {
  if (numericId < REQUIRED_STRICT_QUALITY_FROM_ID) return;
  const ctaType = String(data.cta_type || "");
  const ctaSlides = Array.isArray(data.slides) ? data.slides.filter((slide) => slide.type === "cta") : [];
  if (ctaSlides.length !== 1) {
    errors.push(`${fileName}: production MD must have exactly one CTA slide`);
    return;
  }

  const ctaText = JSON.stringify(ctaSlides[0]);
  if (ctaType.includes("댓글") && !ctaText.includes("댓글")) {
    errors.push(`${fileName}: cta_type says 댓글 but CTA slide does not ask for a comment`);
  }
}

function validateProblemQuality(fileName, data, numericId, qualityRules) {
  if (numericId < REQUIRED_STRICT_QUALITY_FROM_ID) return;

  const evaluations = evaluateProblemRefs(data.problem_bank_ref, qualityRules, { currentId: data.id });
  if (evaluations.length === 0) {
    errors.push(`${fileName}: problem_bank_ref must contain at least one known problem code`);
    return;
  }

  for (const evaluation of evaluations) {
    if (evaluation.blocked) {
      errors.push(
        `${fileName}: problem_bank_ref ${evaluation.code} is blocked (${evaluation.primaryVerdict}) - ${evaluation.primaryReason}`,
      );
    }

    if (!evaluation.purchaseReason) {
      errors.push(`${fileName}: problem_bank_ref ${evaluation.code} is missing purchase_reason in PROBLEM_QUALITY_RULES.json`);
    }

    if (!evaluation.semanticCluster) {
      errors.push(`${fileName}: problem_bank_ref ${evaluation.code} is missing semantic_cluster in PROBLEM_QUALITY_RULES.json`);
    }
  }
}

function validateMdOnlySchema(fileName, data) {
  const disallowedKeys = new Set(["image_generation", "full_card_prompt", "image_asset", "source_html"]);
  const found = [];

  function walk(value, trail) {
    if (!value || typeof value !== "object") return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${trail}[${index}]`));
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const childTrail = trail ? `${trail}.${key}` : key;
      if (disallowedKeys.has(key)) {
        found.push(childTrail);
      }
      walk(child, childTrail);
    }
  }

  walk(data, "");

  for (const keyPath of found) {
    errors.push(`${fileName}: ${keyPath} is not allowed in MD-only carousel schema`);
  }
}

function validateClaimSafety(fileName, data, numericId) {
  const serialized = JSON.stringify(data);
  for (const { label, pattern } of RISKY_CLAIM_PATTERNS) {
    const matches = [...serialized.matchAll(pattern)].map((match) => match[0]);
    const uniqueMatches = [...new Set(matches)];
    if (uniqueMatches.length > 0) {
      const message = `${fileName}: risky claim/tone (${label}): ${uniqueMatches.join(", ")}`;
      if (numericId >= REQUIRED_STRICT_QUALITY_FROM_ID) errors.push(message);
      else warnings.push(message);
    }
  }
}

function validateScorecard(fileName, data, numericId, scorecardEntries) {
  if (numericId < 45) return;
  const entry = scorecardEntries.get(String(data.id).padStart(3, "0"));
  if (!entry) {
    warnings.push(`${fileName}: scorecard entry is missing in data/registry/CAROUSEL_SCORECARD_LOG.json`);
    return;
  }

  for (const field of SCORECARD_FIELDS) {
    const value = entry.scores?.[field];
    if (typeof value !== "number" || value < 0 || value > 20) {
      errors.push(`${fileName}: scorecard.${field} must be a number between 0 and 20`);
    }
  }

  if (typeof entry.total_score !== "number" || entry.total_score < 0 || entry.total_score > 100) {
    errors.push(`${fileName}: scorecard.total_score must be a number between 0 and 100`);
  }

  if (!["pass", "revise", "hold", "reject"].includes(entry.verdict)) {
    errors.push(`${fileName}: scorecard.verdict must be pass, revise, hold, or reject`);
  }
}

function collectProductionMetadata(filePath) {
  const parsed = parseJsonBlock(filePath);
  const numericId = Number.parseInt(String(parsed.id), 10);
  return {
    filePath,
    fileName: path.relative(ROOT, filePath),
    data: parsed,
    numericId: Number.isNaN(numericId) ? getNumericIdFromPath(filePath) : numericId,
  };
}

function validateDuplicationSignals(items, qualityRules) {
  const signatureMap = new Map();
  const titleItems = [];
  const recentClusters = items
    .filter((item) => item.numericId >= REQUIRED_STRICT_QUALITY_FROM_ID)
    .sort((a, b) => b.numericId - a.numericId)
    .slice(0, qualityRules.semantic_cluster_recent_limit || 10);
  const recentClusterById = new Map();

  for (const item of items) {
    const data = item.data;
    if (!data || item.numericId < REQUIRED_MD_META_FROM_ID) continue;
    const signature = normalizeText(data.duplicate_signature);
    if (signature) {
      if (signatureMap.has(signature)) {
        const previous = signatureMap.get(signature);
        errors.push(`${item.fileName}: duplicate_signature duplicates ${previous.fileName}`);
      } else {
        signatureMap.set(signature, item);
      }
    }

    titleItems.push(item);

    const evaluations = evaluateProblemRefs(data.problem_bank_ref, qualityRules, { currentId: data.id });
    for (const evaluation of evaluations) {
      if (evaluation.semanticCluster) {
        recentClusterById.set(item.data.id, evaluation.semanticCluster);
      }
    }
  }

  for (let leftIndex = 0; leftIndex < titleItems.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < titleItems.length; rightIndex += 1) {
      const left = titleItems[leftIndex];
      const right = titleItems[rightIndex];
      if (left.numericId < REQUIRED_STRICT_QUALITY_FROM_ID && right.numericId < REQUIRED_STRICT_QUALITY_FROM_ID) continue;
      const score = similarity(left.data.title || left.data.theme, right.data.title || right.data.theme);
      if (score >= 0.72) {
        warnings.push(`${left.fileName}: title is very similar to ${right.fileName} (${Math.round(score * 100)}%)`);
      }
    }
  }

  for (const item of recentClusters) {
    const cluster = recentClusterById.get(item.data.id);
    if (!cluster) continue;
    const others = recentClusters.filter((other) => other.data.id !== item.data.id && recentClusterById.get(other.data.id) === cluster);
    if (others.length > 0) {
      warnings.push(`${item.fileName}: semantic_cluster ${cluster} appears again in recent ${recentClusters.length} production files`);
    }
  }
}

function validateRegistryPaths() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    warnings.push(`Registry not found: ${path.relative(ROOT, REGISTRY_PATH)}`);
    return;
  }

  const registry = fs.readFileSync(REGISTRY_PATH, "utf8");
  const matches = registry.match(/content\/source\/carousel\/[^|\s]+?\.md/g) || [];
  for (const registryPath of [...new Set(matches)]) {
    const fullPath = path.join(ROOT, ...registryPath.split("/"));
    if (!fs.existsSync(fullPath)) {
      errors.push(`Registry path does not exist: ${registryPath}`);
    }
  }
}

function validateFile(filePath, seenIds, qualityRules, scorecardEntries) {
  const fileName = path.relative(ROOT, filePath);
  let data;

  try {
    data = parseJsonBlock(filePath);
  } catch (error) {
    errors.push(`${fileName}: ${error.message}`);
    return;
  }

  if (!data.id) {
    errors.push(`${fileName}: id is required`);
  } else if (seenIds.has(data.id)) {
    const previous = seenIds.get(data.id);
    const previousNumericId = Number.parseInt(String(data.id), 10);
    const message = `${fileName}: duplicate id ${data.id} (also used by ${previous})`;
    if (previousNumericId >= REQUIRED_MD_META_FROM_ID) errors.push(message);
    else warnings.push(message);
  } else {
    seenIds.set(data.id, fileName);
  }

  if (data.format !== "carousel") {
    errors.push(`${fileName}: format must be carousel`);
  }

  const numericId = Number.parseInt(String(data.id), 10);
  if (Number.isNaN(numericId)) {
    errors.push(`${fileName}: id must start with a number`);
  }

  validateVisualIntent(fileName, data, numericId);
  validateNewMetadata(fileName, data, numericId);
  validateProblemQuality(fileName, data, numericId, qualityRules);
  validateMdOnlySchema(fileName, data);
  validateSlides(fileName, data, numericId);
  validateCta(fileName, data, numericId);
  validateHashtags(fileName, data);
  validateClaimSafety(fileName, data, numericId);
  validateScorecard(fileName, data, numericId, scorecardEntries);
}

function main() {
  const options = parseArgs();
  const allFiles = readCarouselFiles();
  const files = filterCarouselFiles(allFiles, options);
  const seenIds = new Map();
  const qualityRules = readQualityRules();
  const scorecard = readScorecardLog();
  const scorecardEntries = new Map((scorecard.entries || []).map((entry) => [String(entry.id).padStart(3, "0"), entry]));
  files.forEach((file) => validateFile(file, seenIds, qualityRules, scorecardEntries));

  const metadataItems = [];
  for (const filePath of files) {
    try {
      metadataItems.push(collectProductionMetadata(filePath));
    } catch {
      // JSON parsing errors are already reported by validateFile.
    }
  }
  validateDuplicationSignals(metadataItems, qualityRules);

  if (options.files.length === 0 && !Number.isInteger(options.since)) {
    validateRegistryPaths();
  }

  console.log(`Checked ${files.length} carousel source files.`);
  if (Number.isInteger(options.since)) console.log(`Mode: since ${String(options.since).padStart(3, "0")}`);
  if (options.files.length > 0) console.log(`Mode: file ${options.files.map((filePath) => path.relative(ROOT, filePath)).join(", ")}`);
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((warning) => console.log(`  WARN ${warning}`));
  console.log(`Errors: ${errors.length}`);
  errors.forEach((error) => console.log(`  ERROR ${error}`));

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
