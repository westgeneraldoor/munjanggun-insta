const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { parseArgs, parseControlChecks, runCarouselQa } = require("../scripts/validators/carousel_qa");

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "carousel-qa-"));
}

function writeFixtureCarousel(root, id = "099") {
  const dir = path.join(root, "content", "source", "carousel");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${id}_fixture.md`);
  fs.writeFileSync(
    filePath,
    [
      "```json",
      JSON.stringify({
        id,
        format: "carousel",
        title: "fixture",
        slides: [],
      }),
      "```",
      "",
    ].join("\n"),
    "utf8",
  );
  return filePath;
}

function writeCustomCarousel(root, id, payload, filename = `${id}_fixture.md`) {
  const dir = path.join(root, "content", "source", "carousel");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, ["```json", JSON.stringify(payload), "```", ""].join("\n"), "utf8");
  return filePath;
}

function writeControls(root, id, statusChecks = {}, approvalChecks = {}) {
  const qaDir = path.join(root, "outputs", "qa", "carousel", id);
  fs.mkdirSync(qaDir, { recursive: true });
  const statusLines = Object.entries(statusChecks).map(([key, value]) =>
    typeof value === "string" ? `${key}: ${value}` : `- [${value ? "x" : " "}] ${key}`,
  );
  const approvalLines = Object.entries(approvalChecks).map(([key, value]) =>
    typeof value === "string" ? `${key}: ${value}` : `- [${value ? "x" : " "}] ${key}`,
  );
  fs.writeFileSync(path.join(qaDir, "STATUS.md"), ["# STATUS", ...statusLines, ""].join("\n"), "utf8");
  fs.writeFileSync(path.join(qaDir, "APPROVAL_LOG.md"), ["# APPROVAL_LOG", ...approvalLines, ""].join("\n"), "utf8");
}

function writePassingControls(root, id) {
  writeControls(
    root,
    id,
    {
      topic_approved: true,
      md_created: true,
      brand_fact_checked: true,
      duplicate_checked: true,
      cta_checked: true,
      scope_checked: true,
    },
    {
      planning_approved_by_user: true,
      md_approved_by_user: true,
      planning_approval_source: "user said proceed in chat",
      planning_approval_at: "2026-06-16T10:00:00+09:00",
      md_approval_source: "user approved MD in chat",
      md_approval_at: "2026-06-16T10:10:00+09:00",
    },
  );
}

test("parseControlChecks reads markdown checkbox gates", () => {
  const checks = parseControlChecks("- [x] topic_approved\n- [ ] user_md_approved\n");
  assert.equal(checks.topic_approved, true);
  assert.equal(checks.user_md_approved, false);
});

test("parseArgs rejects missing option values and unknown options", () => {
  assert.match(parseArgs(["--file"]).errors.join("\n"), /--file requires a value/);
  assert.match(parseArgs(["--file", "--stage", "final"]).errors.join("\n"), /--file requires a value/);
  assert.match(parseArgs(["--stage"]).errors.join("\n"), /--stage requires a value/);
  assert.match(parseArgs(["--unknown"]).errors.join("\n"), /Unknown argument/);
});

test("runCarouselQa fails when STATUS.md is missing", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /STATUS\.md is required/);
});

test("runCarouselQa draft stage allows missing APPROVAL_LOG.md", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  const qaDir = path.join(root, "outputs", "qa", "carousel", "099");
  fs.mkdirSync(qaDir, { recursive: true });
  fs.writeFileSync(
    path.join(qaDir, "STATUS.md"),
    [
      "# STATUS",
      "- [x] topic_approved",
      "- [x] md_created",
      "- [x] brand_fact_checked",
      "- [x] duplicate_checked",
      "- [x] cta_checked",
      "- [x] scope_checked",
      "",
    ].join("\n"),
    "utf8",
  );

  const result = runCarouselQa({
    root,
    file: filePath,
    stage: "draft",
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, true);
});

test("runCarouselQa blocks final stage without explicit user MD approval", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  writeControls(
    root,
    "099",
    {
      topic_approved: true,
      md_created: true,
      brand_fact_checked: true,
      duplicate_checked: true,
      cta_checked: true,
      scope_checked: true,
    },
    {
      planning_approved_by_user: true,
      md_approved_by_user: false,
    },
  );

  const result = runCarouselQa({
    root,
    file: filePath,
    stage: "final",
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /md_approved_by_user/);
});

test("runCarouselQa final stage requires approval evidence", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  writeControls(
    root,
    "099",
    {
      topic_approved: true,
      md_created: true,
      brand_fact_checked: true,
      duplicate_checked: true,
      cta_checked: true,
      scope_checked: true,
    },
    {
      planning_approved_by_user: true,
      md_approved_by_user: true,
    },
  );

  const result = runCarouselQa({
    root,
    file: filePath,
    stage: "final",
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /planning_approval_source/);
  assert.match(result.errors.join("\n"), /md_approval_source/);
});

test("runCarouselQa final stage rejects placeholder approval evidence", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  writeControls(
    root,
    "099",
    {
      topic_approved: true,
      md_created: true,
      brand_fact_checked: true,
      duplicate_checked: true,
      cta_checked: true,
      scope_checked: true,
    },
    {
      planning_approved_by_user: true,
      md_approved_by_user: true,
      planning_approval_source: "none",
      planning_approval_at: "soon",
      md_approval_source: "todo",
      md_approval_at: "later",
    },
  );

  const result = runCarouselQa({
    root,
    file: filePath,
    stage: "final",
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /placeholder approval evidence/);
  assert.match(result.errors.join("\n"), /valid ISO-like approval timestamp/);
});

test("runCarouselQa final stage rejects pending approval source evidence", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  writeControls(
    root,
    "099",
    {
      topic_approved: true,
      md_created: true,
      brand_fact_checked: true,
      duplicate_checked: true,
      cta_checked: true,
      scope_checked: true,
    },
    {
      planning_approved_by_user: true,
      md_approved_by_user: true,
      planning_approval_source: "pending confirmation",
      planning_approval_at: "2026-06-16T10:00:00+09:00",
      md_approval_source: "not available",
      md_approval_at: "2026-06-16T10:10:00+09:00",
    },
  );

  const result = runCarouselQa({
    root,
    file: filePath,
    stage: "final",
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /placeholder approval evidence/);
});

test("runCarouselQa accepts concrete user confirmation approval source", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  writeControls(
    root,
    "099",
    {
      topic_approved: true,
      md_created: true,
      brand_fact_checked: true,
      duplicate_checked: true,
      cta_checked: true,
      scope_checked: true,
    },
    {
      planning_approved_by_user: true,
      md_approved_by_user: true,
      planning_approval_source: "user confirmation in chat",
      planning_approval_at: "2026-06-16T10:00:00+09:00",
      md_approval_source: "user confirmed final MD in chat",
      md_approval_at: "2026-06-16T10:10:00+09:00",
    },
  );

  const result = runCarouselQa({
    root,
    file: filePath,
    stage: "final",
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, true);
});

test("runCarouselQa accepts approval source that mentions a pending issue as evidence", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  writeControls(
    root,
    "099",
    {
      topic_approved: true,
      md_created: true,
      brand_fact_checked: true,
      duplicate_checked: true,
      cta_checked: true,
      scope_checked: true,
    },
    {
      planning_approved_by_user: true,
      md_approved_by_user: true,
      planning_approval_source: "approved in pending issue #123",
      planning_approval_at: "2026-06-16T10:00:00+09:00",
      md_approval_source: "approved in pending issue #123",
      md_approval_at: "2026-06-16T10:10:00+09:00",
    },
  );

  const result = runCarouselQa({
    root,
    file: filePath,
    stage: "final",
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, true);
});

test("runCarouselQa treats duplicate warnings from validate_content as hard failures", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  writeControls(
    root,
    "099",
    {
      topic_approved: true,
      md_created: true,
      brand_fact_checked: true,
      duplicate_checked: true,
      cta_checked: true,
      scope_checked: true,
    },
    {
      planning_approved_by_user: true,
      md_approved_by_user: true,
    },
  );

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({
      exitCode: 0,
      stdout: "Warnings: 1\n  WARN content/source/carousel/099_fixture.md: title is very similar to 098_fixture.md (80%)\nErrors: 0\n",
      stderr: "",
    }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /duplicate-risk warning/);
});

test("runCarouselQa catches target title duplication against the existing corpus", () => {
  const root = makeTempRoot();
  writeCustomCarousel(root, "098", {
    id: "098",
    format: "carousel",
    title: "중문 설치 전에 꼭 확인할 일정",
    duplicate_signature: "middle-door-schedule",
    slides: [],
  });
  const filePath = writeCustomCarousel(root, "099", {
    id: "099",
    format: "carousel",
    title: "중문 설치 전에 꼭 확인할 일정",
    duplicate_signature: "middle-door-schedule-new",
    slides: [],
  });
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /title duplicates or nearly duplicates/);
});

test("runCarouselQa blocks a different file that reuses the same carousel id", () => {
  const root = makeTempRoot();
  writeCustomCarousel(root, "099", {
    id: "099",
    format: "carousel",
    title: "first title",
    duplicate_signature: "first-signature",
    slides: [],
  }, "099_first.md");
  const filePath = writeCustomCarousel(root, "099", {
    id: "099",
    format: "carousel",
    title: "second title",
    duplicate_signature: "second-signature",
    slides: [],
  }, "099_second.md");
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /duplicate id/);
});

test("runCarouselQa blocks mismatch between filename prefix and JSON id", () => {
  const root = makeTempRoot();
  const filePath = writeCustomCarousel(root, "099", {
    id: "098",
    format: "carousel",
    title: "mismatch fixture",
    duplicate_signature: "mismatch-signature",
    slides: [],
  }, "099_mismatch.md");
  writePassingControls(root, "098");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /filename prefix 099 does not match JSON id 098/);
});

test("runCarouselQa blocks malformed JSON id instead of falling back to filename", () => {
  const root = makeTempRoot();
  const filePath = writeCustomCarousel(root, "099", {
    id: "099_draft",
    format: "carousel",
    title: "malformed id fixture",
    duplicate_signature: "malformed-id",
    slides: [],
  }, "099_malformed.md");
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /JSON id must be a 1-3 digit number/);
});

test("runCarouselQa blocks carousel filename without NNN prefix", () => {
  const root = makeTempRoot();
  const filePath = writeCustomCarousel(root, "099", {
    id: "099",
    format: "carousel",
    title: "missing prefix fixture",
    duplicate_signature: "missing-prefix",
    slides: [],
  }, "fixture.md");
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /filename must start with NNN_/);
});

test("runCarouselQa fails semantic QA when problem refs exist but quality rules are missing", () => {
  const root = makeTempRoot();
  const filePath = writeCustomCarousel(root, "099", {
    id: "099",
    format: "carousel",
    title: "quality rules missing fixture",
    duplicate_signature: "quality-rules-missing",
    problem_bank_ref: "G05",
    slides: [],
  });
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /PROBLEM_QUALITY_RULES\.json is required/);
});

test("runCarouselQa catches semantic cluster duplication against recent corpus", () => {
  const root = makeTempRoot();
  fs.mkdirSync(path.join(root, "data", "problems"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "data", "problems", "PROBLEM_QUALITY_RULES.json"),
    JSON.stringify({
      semantic_cluster_recent_limit: 10,
      problems: {
        X01: { semantic_cluster: "same_cluster" },
        X02: { semantic_cluster: "same_cluster" },
      },
    }),
    "utf8",
  );
  writeCustomCarousel(root, "098", {
    id: "098",
    format: "carousel",
    title: "older different title",
    duplicate_signature: "older-signature",
    problem_bank_ref: "X01",
    slides: [],
  });
  const filePath = writeCustomCarousel(root, "099", {
    id: "099",
    format: "carousel",
    title: "new completely different title",
    duplicate_signature: "new-signature",
    problem_bank_ref: "X02",
    slides: [],
  });
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /semantic_cluster duplicates recent corpus/);
});

test("runCarouselQa blocks out-of-scope image html and video instructions", () => {
  const root = makeTempRoot();
  const filePath = writeCustomCarousel(root, "099", {
    id: "099",
    format: "carousel",
    title: "scope fixture",
    html_generation: true,
    video_script: "make mp4",
    slides: [],
  });
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /out-of-scope key/);
});

test("runCarouselQa blocks out-of-scope variant keys", () => {
  const root = makeTempRoot();
  const filePath = writeCustomCarousel(root, "099", {
    id: "099",
    format: "carousel",
    title: "variant scope fixture",
    slide_image_prompt: "make card image",
    image_prompts: ["prompt"],
    card_image: "final",
    slides: [{ image_sheet_prompt: "sheet" }],
  });
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /slide_image_prompt/);
  assert.match(result.errors.join("\n"), /image_sheet_prompt/);
});

test("runCarouselQa passes with valid controls and clean validator output", () => {
  const root = makeTempRoot();
  const filePath = writeFixtureCarousel(root, "099");
  writePassingControls(root, "099");

  const result = runCarouselQa({
    root,
    file: filePath,
    validateRunner: () => ({ exitCode: 0, stdout: "Checked 1 carousel source files.\nWarnings: 0\nErrors: 0\n", stderr: "" }),
  });

  assert.equal(result.ok, true);
  assert.equal(fs.existsSync(path.join(root, "outputs", "qa", "carousel", "099", "qa_manifest.json")), true);
});
