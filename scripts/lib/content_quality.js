const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const QUALITY_RULES_PATH = path.join(ROOT, "data", "problems", "PROBLEM_QUALITY_RULES.json");
const BLOCKED_VERDICTS = new Set(["제작금지", "브랜드부적합", "중복주의", "계절대기", "보류"]);
const HARD_FAIL_STATUSES = new Set(["rejected", "hold", "duplicate_hold", "season_hold"]);

function readQualityRules() {
  if (!fs.existsSync(QUALITY_RULES_PATH)) {
    return { problems: {}, hard_fail_verdicts: [] };
  }

  return JSON.parse(fs.readFileSync(QUALITY_RULES_PATH, "utf8"));
}

function getProblemCodes(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(" ") : String(value);
  return raw.match(/[A-Z]\d{2}/g) || [];
}

function getRuleForProblem(code, rules = readQualityRules()) {
  return rules.problems?.[code] || null;
}

function isHardFailStatus(status) {
  return HARD_FAIL_STATUSES.has(status);
}

function isBlockedVerdict(verdict) {
  return BLOCKED_VERDICTS.has(verdict);
}

function normalizeProblemRule(code, rule) {
  return {
    code,
    status: rule?.status || "missing_rule",
    semanticCluster: rule?.semantic_cluster || "",
    purchaseReason: rule?.purchase_reason || "",
    allowedAngle: rule?.allowed_angle || "",
    avoidAngle: rule?.avoid_angle || "",
    rejectReason: rule?.reject_reason || "",
    usedIds: Array.isArray(rule?.used_ids) ? rule.used_ids : [],
    reuseAllowed: rule?.reuse_allowed === true,
  };
}

function evaluateProblemRule(code, rules = readQualityRules(), options = {}) {
  const rule = normalizeProblemRule(code, getRuleForProblem(code, rules));
  const issues = [];
  const currentId = options.currentId ? String(options.currentId).padStart(3, "0") : "";
  const belongsToCurrentContent = currentId && rule.usedIds.includes(currentId);

  if (rule.status === "missing_rule") {
    issues.push({
      verdict: "보류",
      reason: "PROBLEM_QUALITY_RULES.json에 문제 코드 품질 규칙이 없음",
    });
  }

  if (rule.status === "rejected") {
    issues.push({
      verdict: "제작금지",
      reason: rule.rejectReason || "문장군 브랜드/현실 인과 기준에서 제외된 문제",
    });
  }

  if (rule.status === "hold") {
    issues.push({
      verdict: "보류",
      reason: rule.rejectReason || "추가 근거 또는 각도 재설계가 필요한 문제",
    });
  }

  if (rule.status === "duplicate_hold") {
    issues.push({
      verdict: "중복주의",
      reason: rule.rejectReason || "기존 원고와 의미 중복 위험이 큰 문제",
    });
  }

  if (rule.status === "season_hold") {
    issues.push({
      verdict: "계절대기",
      reason: rule.rejectReason || "현재 시즌과 맞지 않는 문제",
    });
  }

  if (rule.status === "used" && !rule.reuseAllowed && !belongsToCurrentContent) {
    issues.push({
      verdict: "중복주의",
      reason: `이미 사용된 문제(${rule.usedIds.join(", ") || "used"})이며 재사용 금지 상태`,
    });
  }

  return {
    ...rule,
    issues,
    blocked: issues.some((issue) => isBlockedVerdict(issue.verdict)),
    primaryVerdict: issues[0]?.verdict || "통과",
    primaryReason: issues[0]?.reason || "품질 규칙 통과",
  };
}

function evaluateProblemRefs(value, rules = readQualityRules(), options = {}) {
  return getProblemCodes(value).map((code) => evaluateProblemRule(code, rules, options));
}

module.exports = {
  QUALITY_RULES_PATH,
  readQualityRules,
  getProblemCodes,
  getRuleForProblem,
  evaluateProblemRule,
  evaluateProblemRefs,
  isBlockedVerdict,
  isHardFailStatus,
};
