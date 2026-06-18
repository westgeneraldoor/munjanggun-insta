#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { readQualityRules, evaluateProblemRefs } = require("../lib/content_quality");
const { loadCustomerQuestionBank } = require("../lib/customer_questions");

const ROOT = path.resolve(__dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT, "content", "source", "carousel");
const REGISTRY_PATH = path.join(ROOT, "data", "registry", "INSTAGRAM_POSTING_REGISTRY.md");
const SCORECARD_LOG_PATH = path.join(ROOT, "data", "registry", "CAROUSEL_SCORECARD_LOG.json");
const CLAIM_REGISTRY_PATH = path.join(ROOT, "data", "claims", "CLAIM_REGISTRY.json");
const REQUIRED_VISUAL_INTENT_FROM_ID = 28;
const REQUIRED_MD_META_FROM_ID = 35;
const REQUIRED_STRICT_QUALITY_FROM_ID = 39;
const REQUIRED_PRIMARY_CTA_FROM_ID = 48;
const REQUIRED_EDITORIAL_REVIEW_FROM_ID = 51;
const HASHTAG_MIN = 20;
const HASHTAG_MAX = 25;
const ALLOWED_HOOK_TYPES = new Set(["손실회피", "실수방지", "공감", "비교", "스토리"]);
const ALLOWED_PURPOSE_TAGS = new Set(["SAVE", "SHARE", "TRUST", "LEAD", "AD"]);
const ALLOWED_SLIDE_TYPES = new Set(["cover", "point", "checklist", "compare", "cta", "caption_card"]);
const SCORECARD_FIELDS = ["hook_power", "saveability", "shareability", "dm_intent", "brand_fit"];
const STRICT_SCHEMA_VERSION = "6.0";
const ALLOWED_VALIDATION_PROFILES = new Set(["legacy", "strict"]);
const ALLOWED_SOURCE_TYPES = new Set([
  "customer_question",
  "customer_case",
  "review",
  "field_observation",
  "internal_data",
  "constructed_example",
]);
const ALLOWED_NARRATIVE_MODES = new Set(["question", "incident", "reveal", "comparison", "checklist"]);
const ALLOWED_TRIGGER_TYPES = new Set(["evergreen", "seasonal", "campaign"]);
const ALLOWED_PRIMARY_GOALS = new Set(["save", "share", "comment", "follow", "lead"]);
const ALLOWED_CLAIM_TYPES = new Set(["medical", "performance", "quantitative", "guarantee", "competitor", "factual", "policy"]);
const ALLOWED_CLAIM_STATUSES = new Set(["verified", "unverified", "rejected", "not_applicable"]);
const CLAIM_TYPES_REQUIRING_EVIDENCE = new Set(["performance", "quantitative", "guarantee", "competitor", "factual", "policy"]);
const RISKY_CLAIM_PATTERNS = [
  { type: "medical", label: "medical/health claim", pattern: /발암|비염|아토피|폐로|폐에|가족\s*폐|유해\s*세균|질병|정서적\s*안정/g },
  { type: "performance", label: "performance claim", pattern: /원천\s*차단|데시벨|차단\s*효과|느끼지\s*못함|줄어듭니다|감소/g },
  { type: "quantitative", label: "quantitative claim", pattern: /\d+[ \t]*%|\d+[ \t]*배|수십만[ \t]*원|평당[ \t]*\d+|\d+[ \t]*~[ \t]*\d+[ \t]*(시간|분|일)|\d+[ \t]*(년|시간|분|일)/g },
  { type: "guarantee", label: "guarantee/policy claim", pattern: /완벽|확실한|100%|무조건|보장|무상|무료\s*방문\s*실측|무료\s*방문실측|A\/S|AS/g },
  { type: "competitor", label: "competitor/superlative claim", pattern: /먹튀|일용직|대충|책임\s*회피|연락\s*두절|업체들은.*마진|저가\s*업체|경쟁사|최고|최장|업계\s*유일|국내\s*최고|업계\s*최장/g },
];

const errors = [];
const warnings = [];

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    since: null,
    files: [],
    requireStrict: false,
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
    } else if (arg === "--require-strict") {
      options.requireStrict = true;
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

function readCustomerQuestionBank() {
  try {
    return loadCustomerQuestionBank(ROOT);
  } catch (error) {
    errors.push(`Customer question bank is not valid JSON: data/questions/CUSTOMER_QUESTION_BANK.json - ${error.message}`);
    return { questions: [] };
  }
}

function readClaimRegistry() {
  if (!fs.existsSync(CLAIM_REGISTRY_PATH)) return { claims: [] };
  try {
    return JSON.parse(fs.readFileSync(CLAIM_REGISTRY_PATH, "utf8"));
  } catch (error) {
    errors.push(`Claim registry is not valid JSON: data/claims/CLAIM_REGISTRY.json - ${error.message}`);
    return { claims: [] };
  }
}

function makeClaimRegistryMap(claimRegistry) {
  return new Map((claimRegistry.claims || []).map((claim) => [String(claim.id), claim]));
}

function isStrictSchema(data) {
  return data?.schema_version === STRICT_SCHEMA_VERSION || data?.validation_profile === "strict";
}

function addIssue(issues, level, message) {
  const target = issues || { errors, warnings };
  target[level].push(message);
}

function validateValidationProfile(fileName, data, options = {}, issues) {
  if (!data.validation_profile) {
    addIssue(issues, "errors", `${fileName}: validation_profile is required; use legacy for allowlisted old files or strict for new files`);
    return;
  }
  if (!ALLOWED_VALIDATION_PROFILES.has(data.validation_profile)) {
    addIssue(issues, "errors", `${fileName}: validation_profile must be legacy or strict`);
  }
  if (options.requireStrict && !isStrictSchema(data)) {
    addIssue(issues, "errors", `${fileName}: --require-strict requires schema_version=${STRICT_SCHEMA_VERSION} and validation_profile=strict`);
  }
}

function collectClaimText(data) {
  const skipKeys = new Set([
    "id",
    "slide",
    "hashtags",
    "problem_bank_ref",
    "customer_question_ref",
    "duplicate_signature",
    "evidence_ref",
    "evidence_refs",
    "verification_status",
    "created_at",
    "updated_at",
    "approved_at",
    "qa_completed_at",
    "published_at",
    "rejection_risks",
    "avoid",
  ]);
  const text = [];

  function walk(value, key = "") {
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
      if (!skipKeys.has(key)) text.push(value);
      return;
    }
    if (Array.isArray(value)) {
      if (skipKeys.has(key)) return;
      value.forEach((item) => walk(item, key));
      return;
    }
    if (typeof value === "object") {
      for (const [childKey, child] of Object.entries(value)) {
        if (skipKeys.has(childKey)) continue;
        walk(child, childKey);
      }
    }
  }

  walk(data);
  return text.join("\n");
}

function findClaimRisks(data) {
  const claimText = collectClaimText(data);
  const risks = [];
  for (const { type, label, pattern } of RISKY_CLAIM_PATTERNS) {
    const matches = [...claimText.matchAll(pattern)].map((match) => match[0]);
    for (const match of [...new Set(matches)]) {
      risks.push({ type, label, match });
    }
  }
  return risks;
}

function normalizeClaimText(value) {
  return normalizeText(value).replace(/년|개월|시간|분|일|원/g, "");
}

function claimMatchesRisk(claim, risk) {
  const claimText = normalizeClaimText(claim.text || "");
  const riskText = normalizeClaimText(risk.match || "");
  if (!claimText || !riskText) return false;
  return claimText.includes(riskText) || riskText.includes(claimText);
}

function registryClaimCoversText(claim, registryClaim) {
  const claimText = normalizeText(claim.text || "");
  const allowed = [registryClaim.text, ...(Array.isArray(registryClaim.allowed_phrases) ? registryClaim.allowed_phrases : [])]
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .map(normalizeText);
  if (!claimText || allowed.length === 0) return false;
  return allowed.some((allowedText) => allowedText.includes(claimText) || claimText.includes(allowedText));
}

function registryClaimSupportsClaim(claim, registryClaim) {
  return Boolean(
    registryClaim
      && registryClaim.status === "verified"
      && registryClaim.type === claim.type
      && registryClaimCoversText(claim, registryClaim),
  );
}

function isVerifiedClaim(claim, claimRegistryMap) {
  if (claim.verification_status !== "verified") return false;
  if (!Array.isArray(claim.evidence_refs) || claim.evidence_refs.length === 0) return false;
  return claim.evidence_refs.every((ref) => {
    const registryClaim = claimRegistryMap.get(String(ref));
    return registryClaimSupportsClaim(claim, registryClaim);
  });
}

function hasVerifiedEvidenceForRisk(claims, risk, claimRegistryMap) {
  return claims.some((claim) => {
    if (claim.type !== risk.type) return false;
    if (!claimMatchesRisk(claim, risk)) return false;
    return isVerifiedClaim(claim, claimRegistryMap);
  });
}

function validateCustomerQuestionBank(customerQuestions) {
  const questions = Array.isArray(customerQuestions.questions) ? customerQuestions.questions : [];

  function scan(value, pathLabel) {
    if (typeof value === "string") {
      if (/\?{3,}|�/.test(value)) {
        errors.push(`Customer question text appears corrupted: ${pathLabel}`);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => scan(item, `${pathLabel}[${index}]`));
      return;
    }

    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, item]) => scan(item, `${pathLabel}.${key}`));
    }
  }

  questions.forEach((question) => scan(question, question.id || "unknown_question"));
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
  if (!hasCta && !isStrictSchema(data)) {
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
  if (validateStrictCta(fileName, data)) return;
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

  if (numericId >= REQUIRED_PRIMARY_CTA_FROM_ID && !ctaText.includes("무료 방문실측 견적상담")) {
    errors.push(`${fileName}: CTA slide must route to 무료 방문실측 견적상담`);
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

function validateSchemaV6(fileName, data, claimRegistry, issues) {
  if (!isStrictSchema(data)) return;

  const claimRegistryMap = makeClaimRegistryMap(claimRegistry);
  if (data.schema_version !== STRICT_SCHEMA_VERSION) {
    addIssue(issues, "errors", `${fileName}: strict carousel must declare schema_version=${STRICT_SCHEMA_VERSION}`);
  }
  if (data.validation_profile !== "strict") {
    addIssue(issues, "errors", `${fileName}: schema v6 carousel must declare validation_profile=strict`);
  }
  if (!ALLOWED_VALIDATION_PROFILES.has(data.validation_profile)) {
    addIssue(issues, "errors", `${fileName}: validation_profile must be legacy or strict`);
  }
  if (!ALLOWED_SOURCE_TYPES.has(data.source_type)) {
    addIssue(issues, "errors", `${fileName}: source_type must be one of ${[...ALLOWED_SOURCE_TYPES].join(", ")}`);
  }
  if (!ALLOWED_NARRATIVE_MODES.has(data.narrative_mode)) {
    addIssue(issues, "errors", `${fileName}: narrative_mode must be one of ${[...ALLOWED_NARRATIVE_MODES].join(", ")}`);
  }
  if (!ALLOWED_TRIGGER_TYPES.has(data.trigger_type)) {
    addIssue(issues, "errors", `${fileName}: trigger_type must be one of ${[...ALLOWED_TRIGGER_TYPES].join(", ")}`);
  }
  if (!ALLOWED_PRIMARY_GOALS.has(data.primary_goal)) {
    addIssue(issues, "errors", `${fileName}: primary_goal must be one of ${[...ALLOWED_PRIMARY_GOALS].join(", ")}`);
  }
  if (!Array.isArray(data.evidence_ref)) {
    addIssue(issues, "errors", `${fileName}: evidence_ref must be an array`);
  } else if (data.source_type !== "constructed_example" && data.evidence_ref.length === 0) {
    addIssue(issues, "errors", `${fileName}: evidence_ref is required for ${data.source_type}`);
  }
  if (data.source_type === "customer_case" || data.source_type === "review") {
    const evidenceText = Array.isArray(data.evidence_ref) ? data.evidence_ref.join(" ") : "";
    if (!evidenceText.trim()) {
      addIssue(issues, "errors", `${fileName}: ${data.source_type} must carry a real source evidence_ref`);
    }
  }
  if (!data.primary_cta || typeof data.primary_cta !== "object" || Array.isArray(data.primary_cta)) {
    addIssue(issues, "errors", `${fileName}: primary_cta object is required`);
  } else {
    if (typeof data.primary_cta.action !== "string" || data.primary_cta.action.trim() === "") {
      addIssue(issues, "errors", `${fileName}: primary_cta.action is required`);
    }
    if (typeof data.primary_cta.text !== "string" || data.primary_cta.text.trim() === "") {
      addIssue(issues, "errors", `${fileName}: primary_cta.text is required`);
    }
  }

  const claims = Array.isArray(data.claims) ? data.claims : [];
  if (!Array.isArray(data.claims)) {
    addIssue(issues, "errors", `${fileName}: claims must be an array in schema v6 strict`);
  }

  for (const claim of claims) {
    const claimLabel = claim.id || claim.text || "unknown";
    if (!claim.id) addIssue(issues, "errors", `${fileName}: claim is missing id`);
    if (!ALLOWED_CLAIM_TYPES.has(claim.type)) {
      addIssue(issues, "errors", `${fileName}: claim ${claimLabel} has unsupported type=${claim.type}`);
    }
    if (typeof claim.text !== "string" || claim.text.trim() === "") {
      addIssue(issues, "errors", `${fileName}: claim ${claimLabel} is missing text`);
    }
    if (!ALLOWED_CLAIM_STATUSES.has(claim.verification_status)) {
      addIssue(issues, "errors", `${fileName}: claim ${claimLabel} has unsupported verification_status=${claim.verification_status}`);
    }
    if (CLAIM_TYPES_REQUIRING_EVIDENCE.has(claim.type) && !isVerifiedClaim(claim, claimRegistryMap)) {
      addIssue(issues, "errors", `${fileName}: claim ${claimLabel} requires verified evidence_refs from CLAIM_REGISTRY.json`);
    }
  }
}

function validateStrictCta(fileName, data, issues) {
  if (!isStrictSchema(data)) return false;
  const ctaSlides = Array.isArray(data.slides) ? data.slides.filter((slide) => slide.type === "cta") : [];
  const primaryText = JSON.stringify(data.primary_cta || {});
  const secondaryText = JSON.stringify(data.secondary_cta || {});
  const ctaSlideText = ctaSlides.map((slide) => JSON.stringify(slide)).join("\n");
  const allCtaText = `${primaryText}\n${secondaryText}\n${ctaSlideText}`;

  if (data.primary_goal === "lead") {
    if (ctaSlides.length !== 1) {
      addIssue(issues, "errors", `${fileName}: lead carousel must have exactly one CTA slide`);
    }
    if (!allCtaText.includes("무료 방문실측 견적상담")) {
      addIssue(issues, "errors", `${fileName}: lead CTA must route to 무료 방문실측 견적상담`);
    }
    return true;
  }

  if (ctaSlides.length > 1) {
    addIssue(issues, "errors", `${fileName}: non-lead carousel must not have more than one CTA slide`);
  }
  if (data.secondary_cta && typeof data.secondary_cta === "object" && secondaryText.includes("상담") && !secondaryText.includes("무료 방문실측 견적상담")) {
    addIssue(issues, "errors", `${fileName}: consultation secondary_cta must mention 무료 방문실측 견적상담`);
  }
  return true;
}

function validateClaimSafety(fileName, data, numericId, claimRegistry, issues) {
  const risks = findClaimRisks(data);
  if (risks.length === 0) return;

  if (isStrictSchema(data)) {
    const claims = Array.isArray(data.claims) ? data.claims : [];
    const claimRegistryMap = makeClaimRegistryMap(claimRegistry);
    for (const risk of risks) {
      if (risk.type === "medical") {
        addIssue(issues, "errors", `${fileName}: medical claim is not allowed in strict carousel: ${risk.match}`);
        continue;
      }
      if (!hasVerifiedEvidenceForRisk(claims, risk, claimRegistryMap)) {
        addIssue(issues, "errors", `${fileName}: ${risk.label} requires a matching verified claim: ${risk.match}`);
      }
    }
    return;
  }

  for (const risk of risks) {
    const message = `${fileName}: legacy risky claim/tone (${risk.label}): ${risk.match}`;
    if (numericId >= REQUIRED_STRICT_QUALITY_FROM_ID) warnings.push(message);
    else warnings.push(message);
  }
}

function validateStrictSchemaPayload(data, options = {}) {
  const issues = { errors: [], warnings: [] };
  const fileName = options.fileName || "fixture.md";
  const claimRegistry = options.claimRegistry || { claims: [] };
  validateValidationProfile(fileName, data, { requireStrict: options.requireStrict }, issues);
  validateSchemaV6(fileName, data, claimRegistry, issues);
  validateStrictCta(fileName, data, issues);
  validateClaimSafety(fileName, data, Number.parseInt(String(data.id), 10) || 999, claimRegistry, issues);
  return issues;
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

function validateCustomerQuestionRef(fileName, data, numericId, customerQuestionEntries) {
  if (!data.customer_question_ref) return;
  if (numericId < REQUIRED_STRICT_QUALITY_FROM_ID) return;

  const refs = Array.isArray(data.customer_question_ref) ? data.customer_question_ref : [data.customer_question_ref];
  for (const ref of refs) {
    const question = customerQuestionEntries.get(String(ref));
    if (!question) {
      errors.push(`${fileName}: customer_question_ref ${ref} is not found in CUSTOMER_QUESTION_BANK.json`);
      continue;
    }

    if (!["ready", "used"].includes(question.state)) {
      errors.push(`${fileName}: customer_question_ref ${ref} is ${question.state}; official answer review is required before MD creation`);
    }
  }
}

function validateEditorialReview(fileName, data, numericId) {
  if (numericId < REQUIRED_EDITORIAL_REVIEW_FROM_ID) return;

  if (!data.editorial_review || typeof data.editorial_review !== "object" || Array.isArray(data.editorial_review)) {
    errors.push(`${fileName}: editorial_review is required for production MD from 051 onward`);
    return;
  }

  const requiredTextFields = ["customer_problem", "single_message", "brand_benefit", "conversion_reason"];
  for (const field of requiredTextFields) {
    if (typeof data.editorial_review[field] !== "string" || data.editorial_review[field].trim().length < 12) {
      errors.push(`${fileName}: editorial_review.${field} must explain the editorial gate in one clear sentence`);
    }
  }

  if (!Array.isArray(data.editorial_review.rejection_risks) || data.editorial_review.rejection_risks.length === 0) {
    errors.push(`${fileName}: editorial_review.rejection_risks must list at least one risk checked before approval`);
  }

  const questionRefs = Array.isArray(data.customer_question_ref)
    ? data.customer_question_ref
    : data.customer_question_ref
      ? [data.customer_question_ref]
      : [];
  if (questionRefs.length > 1 && typeof data.editorial_review.merged_question_rationale !== "string") {
    errors.push(`${fileName}: editorial_review.merged_question_rationale is required when multiple customer questions are combined`);
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

function validateFile(filePath, seenIds, qualityRules, scorecardEntries, customerQuestionEntries, claimRegistry, options = {}) {
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

  validateValidationProfile(fileName, data, options);

  const numericId = Number.parseInt(String(data.id), 10);
  if (Number.isNaN(numericId)) {
    errors.push(`${fileName}: id must start with a number`);
  }

  validateVisualIntent(fileName, data, numericId);
  validateNewMetadata(fileName, data, numericId);
  validateSchemaV6(fileName, data, claimRegistry);
  validateProblemQuality(fileName, data, numericId, qualityRules);
  validateMdOnlySchema(fileName, data);
  validateSlides(fileName, data, numericId);
  validateCta(fileName, data, numericId);
  validateHashtags(fileName, data);
  validateClaimSafety(fileName, data, numericId, claimRegistry);
  validateScorecard(fileName, data, numericId, scorecardEntries);
  validateCustomerQuestionRef(fileName, data, numericId, customerQuestionEntries);
  validateEditorialReview(fileName, data, numericId);
}

function main() {
  const options = parseArgs();
  const allFiles = readCarouselFiles();
  const files = filterCarouselFiles(allFiles, options);
  const seenIds = new Map();
  const qualityRules = readQualityRules();
  const scorecard = readScorecardLog();
  const scorecardEntries = new Map((scorecard.entries || []).map((entry) => [String(entry.id).padStart(3, "0"), entry]));
  const customerQuestions = readCustomerQuestionBank();
  validateCustomerQuestionBank(customerQuestions);
  const customerQuestionEntries = new Map((customerQuestions.questions || []).map((question) => [String(question.id), question]));
  const claimRegistry = readClaimRegistry();
  files.forEach((file) => validateFile(file, seenIds, qualityRules, scorecardEntries, customerQuestionEntries, claimRegistry, options));

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
  if (options.requireStrict) console.log("Mode: require strict schema");
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((warning) => console.log(`  WARN ${warning}`));
  console.log(`Errors: ${errors.length}`);
  errors.forEach((error) => console.log(`  ERROR ${error}`));

  process.exit(errors.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  collectClaimText,
  findClaimRisks,
  isStrictSchema,
  parseArgs,
  validateStrictSchemaPayload,
};
