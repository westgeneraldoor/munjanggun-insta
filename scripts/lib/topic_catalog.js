const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const PROBLEM_BANK_PATH = path.join(ROOT, "data", "problems", "PROBLEM_BANK.md");
const QUALITY_RULES_PATH = path.join(ROOT, "data", "problems", "PROBLEM_QUALITY_RULES.json");
const EXPANSION_SEEDS_PATH = path.join(ROOT, "data", "planning", "TOPIC_EXPANSION_SEEDS.json");

const STATE_FROM_STATUS = {
  active: "ready",
  used: "used",
  hold: "hold",
  duplicate_hold: "hold",
  season_hold: "hold",
  rejected: "rejected",
  missing_rule: "review",
};

const PREFIX_CATEGORY = {
  N: "noise",
  S: "smell",
  C: "cost",
  F: "safety",
  A: "appearance",
  M: "moisture_mold",
  W: "wind_insulation",
  D: "door_operation",
  E: "entry_middle_door",
};

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function parseProblemBank() {
  const raw = readText(PROBLEM_BANK_PATH);
  const problems = new Map();
  let category = "";

  for (const line of raw.split(/\r?\n/)) {
    const categoryMatch = line.match(/^##\s+.+?:\s+(.+)$/);
    if (categoryMatch) {
      category = categoryMatch[1].replace(/\s+[^\s]+$/, "").trim();
      continue;
    }

    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 6) continue;

    const code = cells[1];
    if (!/^[A-Z]\d{2}$/.test(code)) continue;

    problems.set(code, {
      code,
      source: "problem_bank",
      category,
      category_key: PREFIX_CATEGORY[code[0]] || "unknown",
      situation: cells[2] || "",
      hook_type: cells[3] || "",
      hook_example: cells[4] || "",
      bank_used_raw: cells[5] || "",
    });
  }

  return problems;
}

function statusToState(status) {
  return STATE_FROM_STATUS[status || "missing_rule"] || "review";
}

function buildTopicCatalog() {
  const qualityRules = readJson(QUALITY_RULES_PATH, { problems: {} });
  const seeds = readJson(EXPANSION_SEEDS_PATH, { seeds: [] });
  const bank = parseProblemBank();
  const topics = [];

  const allCodes = new Set([...bank.keys(), ...Object.keys(qualityRules.problems || {})]);
  for (const code of [...allCodes].sort()) {
    const bankRow = bank.get(code) || {
      code,
      source: "quality_rules",
      category: "",
      category_key: PREFIX_CATEGORY[code[0]] || "unknown",
      situation: "",
      hook_type: "",
      hook_example: "",
      bank_used_raw: "",
    };
    const rule = qualityRules.problems?.[code] || {};
    const status = rule.status || "missing_rule";

    topics.push({
      code,
      state: statusToState(status),
      legacy_status: status,
      source: bank.has(code) ? "problem_bank" : "quality_rules",
      category: bankRow.category,
      category_key: bankRow.category_key,
      situation: bankRow.situation,
      hook_type: bankRow.hook_type,
      hook_example: bankRow.hook_example,
      semantic_cluster: rule.semantic_cluster || "",
      duplicate_signature_base: rule.semantic_cluster || code,
      purchase_reason: rule.purchase_reason || "",
      allowed_angle: rule.allowed_angle || "",
      avoid_angle: rule.avoid_angle || "",
      reject_reason: rule.reject_reason || "",
      used_ids: Array.isArray(rule.used_ids) ? rule.used_ids : [],
      reuse_allowed: rule.reuse_allowed === true,
    });
  }

  const seedTopics = (seeds.seeds || []).map((seed) => ({
    code: seed.proposed_code,
    state: "seed",
    legacy_status: "seed",
    source: "topic_expansion_seed",
    category: seed.category || "",
    category_key: PREFIX_CATEGORY[String(seed.proposed_code || "")[0]] || "unknown",
    situation: seed.situation || "",
    hook_type: seed.hook_type || "",
    hook_example: "",
    semantic_cluster: seed.semantic_cluster || "",
    duplicate_signature_base: seed.semantic_cluster || seed.proposed_code,
    purchase_reason: seed.purchase_reason || "",
    allowed_angle: seed.required_angle || "",
    avoid_angle: seed.avoid_angle || "",
    reject_reason: "",
    priority_score: seed.priority_score || 0,
    used_ids: [],
    reuse_allowed: false,
  }));

  return {
    version: new Date().toISOString().slice(0, 10),
    source_mode: "bridge",
    note: "Phase 1 bridge catalog. 신규 운영은 topics.json 상태 모델을 기준으로 보되, 기존 PROBLEM_BANK/PROBLEM_QUALITY_RULES와 동기화하여 안전하게 전환한다.",
    state_machine: ["seed", "review", "ready", "used", "hold", "rejected"],
    transition_rules: {
      seed: ["review", "rejected"],
      review: ["ready", "hold", "rejected"],
      ready: ["used", "hold", "rejected"],
      used: ["hold"],
      hold: ["review", "rejected"],
      rejected: [],
    },
    topics: [...topics, ...seedTopics],
  };
}

function writeTopicCatalog(outputPath = path.join(ROOT, "data", "topics", "topics.json")) {
  const catalog = buildTopicCatalog();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return catalog;
}

module.exports = {
  ROOT,
  PROBLEM_BANK_PATH,
  QUALITY_RULES_PATH,
  EXPANSION_SEEDS_PATH,
  PREFIX_CATEGORY,
  buildTopicCatalog,
  writeTopicCatalog,
};
