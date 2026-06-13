#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildTopicCatalog } = require("../lib/topic_catalog");

const ROOT = path.resolve(__dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT, "content", "source", "carousel");
const REGISTRY_PATH = path.join(ROOT, "data", "registry", "INSTAGRAM_POSTING_REGISTRY.md");
const SCORECARD_PATH = path.join(ROOT, "data", "registry", "CAROUSEL_SCORECARD_LOG.json");
const VALIDATOR_PATH = path.join(ROOT, "scripts", "validators", "validate_content.js");
const OUTPUT_DIR = path.join(ROOT, "outputs", "status");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "CAROUSEL_MD_STATUS.md");
const RECENT_LIMIT = 10;

function toProjectPath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["assets", "prompts", "qa"].includes(entry.name)) continue;
      results.push(...walkMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results.sort((a, b) => a.localeCompare(b));
}

function parseJsonBlock(filePath) {
  const raw = readText(filePath);
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { error: "JSON code block not found" };

  try {
    return { data: JSON.parse(match[1]) };
  } catch (error) {
    return { error: error.message };
  }
}

function extractCodes(value) {
  if (!value) return [];
  return String(Array.isArray(value) ? value.join(" ") : value).match(/[A-Z]\d{2}/g) || [];
}

function getCarouselItems() {
  const items = walkMarkdownFiles(CONTENT_DIR).map((filePath) => {
    const parsed = parseJsonBlock(filePath);
    const data = parsed.data || {};
    const fileId = path.basename(filePath).match(/^(\d{3})_/)?.[1] || "";
    const numericId = Number.parseInt(String(data.id || fileId), 10);
    return {
      filePath,
      projectPath: toProjectPath(filePath),
      data,
      parseError: parsed.error || "",
      id: data.id || fileId,
      numericId: Number.isNaN(numericId) ? -1 : numericId,
      title: data.title || data.theme || "",
      hookType: data.hook_type || data.visual_intent?.hook_type || "",
      hookScore: data.hook_score,
      problemCodes: extractCodes(data.problem_bank_ref),
      duplicateSignature: data.duplicate_signature || "",
      slideCount: Array.isArray(data.slides) ? data.slides.length : 0,
    };
  });

  const sorted = [...items].sort((a, b) => b.numericId - a.numericId);
  const latest = sorted.find((item) => item.numericId >= 0);

  return {
    items,
    sorted,
    latest,
    recent: sorted.slice(0, RECENT_LIMIT),
    total: items.length,
    nextId: String((latest?.numericId || 0) + 1).padStart(3, "0"),
    parseErrors: items.filter((item) => item.parseError),
  };
}

function runValidator(args = []) {
  const result = spawnSync(process.execPath, [VALIDATOR_PATH, ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  const warnings = Number(output.match(/Warnings:\s*(\d+)/)?.[1] || 0);
  const errors = Number(output.match(/Errors:\s*(\d+)/)?.[1] || (result.status === 0 ? 0 : 1));
  return { exitCode: result.status, warnings, errors, output };
}

function getRegistryStatus(items) {
  const raw = readText(REGISTRY_PATH);
  const pathMatches = raw.match(/content\/source\/carousel\/[^|\s]+?\.md/g) || [];
  const registryPaths = [...new Set(pathMatches)];
  const missingPaths = registryPaths.filter((registryPath) => !fs.existsSync(path.join(ROOT, ...registryPath.split("/"))));
  const registeredIds = new Set();

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\|\s*(\d{3})\s*\|/);
    if (match) registeredIds.add(match[1]);
  }

  return {
    registeredCount: registeredIds.size,
    missingPaths,
    unregistered: items.filter((item) => item.id && !registeredIds.has(String(item.id).padStart(3, "0"))),
  };
}

function getTopicStatus(carousel) {
  const catalog = buildTopicCatalog();
  const recentCodes = new Set(carousel.recent.flatMap((item) => item.problemCodes));
  const recentClusters = new Map();

  for (const topic of catalog.topics) {
    if (recentCodes.has(topic.code) && topic.semantic_cluster) {
      recentClusters.set(topic.semantic_cluster, (recentClusters.get(topic.semantic_cluster) || 0) + 1);
    }
  }

  const counts = catalog.topics.reduce((acc, topic) => {
    acc[topic.state] = (acc[topic.state] || 0) + 1;
    return acc;
  }, {});

  const ready = catalog.topics
    .filter((topic) => topic.state === "ready")
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  const seeds = catalog.topics
    .filter((topic) => topic.state === "seed")
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  return { catalog, counts, ready, seeds, recentClusters };
}

function getScorecardStatus(items) {
  const scorecard = readJson(SCORECARD_PATH, { entries: [] });
  const entries = new Map((scorecard.entries || []).map((entry) => [String(entry.id).padStart(3, "0"), entry]));
  const recentRows = items.recent.map((item) => {
    const entry = entries.get(String(item.id).padStart(3, "0"));
    return [
      item.id,
      item.title,
      entry?.total_score ?? "-",
      entry?.verdict ?? "missing",
      entry?.notes ?? "-",
    ];
  });

  return {
    entries,
    recentRows,
    missingRecent: items.recent.filter((item) => item.numericId >= 45 && !entries.has(String(item.id).padStart(3, "0"))),
  };
}

function makeTable(headers, rows) {
  const headerLine = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  return [headerLine, separator, ...rowLines].join("\n");
}

function buildReport({ carousel, registry, validationAll, validationNew, topics, scorecard }) {
  const generatedAt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

  const recentRows = carousel.recent.map((item) => [
    item.id,
    item.title,
    item.problemCodes.join(", ") || "-",
    item.hookType || "-",
    item.hookScore ?? "-",
    item.projectPath,
  ]);

  const readyRows = topics.ready.slice(0, 20).map((topic) => [
    topic.code,
    topic.category || topic.category_key,
    topic.situation,
    topic.hook_type || "-",
    topic.semantic_cluster || "-",
    topic.allowed_angle || "-",
  ]);

  const seedRows = topics.seeds.slice(0, 20).map((topic) => [
    topic.priority_score || "-",
    topic.code,
    topic.category || topic.category_key,
    topic.situation,
    topic.semantic_cluster || "-",
    topic.allowed_angle || "-",
  ]);

  const recentClusterRows = [...topics.recentClusters.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cluster, count]) => [cluster, count]);

  return [
    "# 문장군 캐러셀 MD 상태 리포트",
    "",
    `> 생성 시각: ${generatedAt}`,
    "> 범위: MD/JSON 원고, 토픽 상태, 스코어카드, 레지스트리, 검증 결과",
    "",
    "## 요약",
    "",
    makeTable(
      ["항목", "상태"],
      [
        ["캐러셀 MD 수", carousel.total],
        ["최신 원고 번호", carousel.latest ? carousel.latest.id : "-"],
        ["다음 추천 번호", carousel.nextId],
        ["토픽 상태", topics.catalog.state_machine.map((state) => `${state}:${topics.counts[state] || 0}`).join(" / ")],
        ["제작 가능 ready 후보", topics.ready.length],
        ["승격 검토 seed 후보", topics.seeds.length],
        ["전체 검증", `${validationAll.errors} errors / ${validationAll.warnings} warnings`],
        ["신규 검증(045+)", `${validationNew.errors} errors / ${validationNew.warnings} warnings`],
        ["레지스트리 누락 경로", registry.missingPaths.length],
        ["레지스트리 미등록 MD", registry.unregistered.length],
        ["최근 스코어카드 누락", scorecard.missingRecent.length],
      ],
    ),
    "",
    "## 최근 원고",
    "",
    recentRows.length ? makeTable(["ID", "제목", "problem_ref", "hook_type", "Hook Score", "파일"], recentRows) : "최근 원고가 없습니다.",
    "",
    "## 최근 스코어카드",
    "",
    scorecard.recentRows.length ? makeTable(["ID", "제목", "총점", "판정", "메모"], scorecard.recentRows) : "스코어카드 기록이 없습니다.",
    "",
    "## 제작 가능 후보",
    "",
    readyRows.length
      ? makeTable(["코드", "카테고리", "상황", "훅", "semantic_cluster", "허용 각도"], readyRows)
      : "현재 ready 상태의 제작 가능 후보가 없습니다. seed 후보를 승격 검토해야 합니다.",
    "",
    "## 승격 검토 후보",
    "",
    seedRows.length
      ? makeTable(["우선순위", "코드", "카테고리", "상황", "semantic_cluster", "필수 각도"], seedRows)
      : "승격 검토 후보가 없습니다.",
    "",
    "## 최근 10개 클러스터",
    "",
    recentClusterRows.length
      ? makeTable(["semantic_cluster", "최근 등장 횟수"], recentClusterRows)
      : "최근 클러스터 정보가 없습니다.",
    "",
    "## 레지스트리 점검",
    "",
    registry.missingPaths.length
      ? makeTable(["누락 경로"], registry.missingPaths.map((item) => [item]))
      : "누락된 레지스트리 경로가 없습니다.",
    "",
    registry.unregistered.length
      ? "### 미등록 MD\n\n" + makeTable(["ID", "파일"], registry.unregistered.map((item) => [item.id, item.projectPath]))
      : "레지스트리 미등록 MD가 없습니다.",
    "",
    "## 운영 메모",
    "",
    "- `seed`는 제작 승인이 아니라 승격 검토 씨앗입니다.",
    "- `ready` 후보만 신규 캐러셀 제작 후보로 볼 수 있습니다.",
    "- 신규 원고 검증은 `npm run validate:since -- 045` 또는 `npm run validate:file -- <파일>`로 분리해서 봅니다.",
    "- `topics.json`은 현재 브릿지 모드입니다. 기존 문제은행/품질규칙과 동기화한 뒤 점진적으로 단일 원천으로 전환합니다.",
    "",
  ].join("\n");
}

function main() {
  const carousel = getCarouselItems();
  const registry = getRegistryStatus(carousel.items);
  const validationAll = runValidator();
  const validationNew = runValidator(["--since", "045"]);
  const topics = getTopicStatus(carousel);
  const scorecard = getScorecardStatus(carousel);
  const report = buildReport({ carousel, registry, validationAll, validationNew, topics, scorecard });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, report, "utf8");

  console.log(`Status report written: ${toProjectPath(OUTPUT_PATH)}`);
  console.log(`Carousel MD: ${carousel.total}, next ID: ${carousel.nextId}`);
  console.log(`Topics: ready=${topics.ready.length}, seed=${topics.seeds.length}`);
  console.log(`Validate all: ${validationAll.errors} errors / ${validationAll.warnings} warnings`);
  console.log(`Validate 045+: ${validationNew.errors} errors / ${validationNew.warnings} warnings`);

  process.exit(validationAll.errors > 0 || validationNew.errors > 0 ? 1 : 0);
}

main();
