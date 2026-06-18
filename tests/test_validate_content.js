const assert = require("node:assert");
const test = require("node:test");

const { findClaimRisks, validateStrictSchemaPayload } = require("../scripts/validators/validate_content");

const claimRegistry = {
  claims: [
    {
      id: "BRAND_FREE_MEASUREMENT",
      type: "guarantee",
      text: "무료 방문실측 견적상담",
      allowed_phrases: ["무료 방문실측", "무료 방문실측 견적상담"],
      status: "verified",
    },
    {
      id: "BRAND_DOOR_AS_3Y",
      type: "guarantee",
      text: "도어 A/S 3년",
      allowed_phrases: ["도어 A/S 3년", "도어 AS 3년"],
      status: "verified",
    },
    {
      id: "BRAND_INSTALL_2_3H",
      type: "quantitative",
      text: "일반 중문은 보통 2~3시간",
      allowed_phrases: ["보통 2~3시간", "2~3시간"],
      status: "verified",
    },
    {
      id: "BRAND_SITE_CHECKS",
      type: "factual",
      text: "방문실측에서 폭과 수평을 확인",
      allowed_phrases: ["방문실측에서 폭과 수평을 확인"],
      status: "verified",
    },
  ],
};

function basePayload(overrides = {}) {
  return {
    id: "999",
    format: "carousel",
    schema_version: "6.0",
    validation_profile: "strict",
    source_type: "customer_question",
    narrative_mode: "question",
    trigger_type: "evergreen",
    evidence_ref: ["Q999"],
    primary_goal: "lead",
    primary_cta: {
      action: "comment",
      keyword: "견적",
      text: "댓글로 견적을 남기면 무료 방문실측 견적상담 안내",
    },
    secondary_cta: null,
    claims: [
      {
        id: "CLAIM_999_01",
        type: "guarantee",
        text: "무료 방문실측 견적상담",
        evidence_refs: ["BRAND_FREE_MEASUREMENT"],
        verification_status: "verified",
      },
    ],
    slides: [
      { slide: 1, type: "cover", hook: "문 하나 때문에 고민된다면" },
      { slide: 2, type: "point", body: "현장 조건을 먼저 확인해야 합니다." },
      { slide: 3, type: "cta", body: "댓글로 견적을 남기면 무료 방문실측 견적상담 안내" },
      { slide: 4, type: "caption_card", caption: "저장해두세요." },
    ],
    ...overrides,
  };
}

test("strict schema rejects medical claims", () => {
  const payload = basePayload({
    slides: [
      { slide: 1, type: "cover", hook: "곰팡이가 가족 폐로 들어갑니다" },
      { slide: 2, type: "cta", body: "댓글로 견적을 남기면 무료 방문실측 견적상담 안내" },
      { slide: 3, type: "caption_card", caption: "저장해두세요." },
    ],
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert(result.errors.some((error) => error.includes("medical claim is not allowed")));
});

test("validation_profile is required", () => {
  const payload = basePayload();
  delete payload.validation_profile;

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert(result.errors.some((error) => error.includes("validation_profile is required")));
});

test("requireStrict rejects legacy profile", () => {
  const payload = basePayload({
    schema_version: undefined,
    validation_profile: "legacy",
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry, requireStrict: true });
  assert(result.errors.some((error) => error.includes("--require-strict requires")));
});

test("strict schema rejects quantitative claims without verified evidence", () => {
  const payload = basePayload({
    slides: [
      { slide: 1, type: "cover", hook: "시공은 2~3시간이면 충분합니다" },
      { slide: 2, type: "cta", body: "댓글로 견적을 남기면 무료 방문실측 견적상담 안내" },
      { slide: 3, type: "caption_card", caption: "저장해두세요." },
    ],
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert(result.errors.some((error) => error.includes("quantitative claim")));
});

test("strict schema accepts verified quantitative and guarantee claims", () => {
  const payload = basePayload({
    claims: [
      {
        id: "CLAIM_999_01",
        type: "quantitative",
        text: "시공은 2~3시간",
        evidence_refs: ["BRAND_INSTALL_2_3H"],
        verification_status: "verified",
      },
      {
        id: "CLAIM_999_02",
        type: "guarantee",
        text: "무료 방문실측 견적상담",
        evidence_refs: ["BRAND_FREE_MEASUREMENT"],
        verification_status: "verified",
      },
    ],
    slides: [
      { slide: 1, type: "cover", hook: "시공은 2~3시간이면 충분합니다" },
      { slide: 2, type: "cta", body: "댓글로 견적을 남기면 무료 방문실측 견적상담 안내" },
      { slide: 3, type: "caption_card", caption: "저장해두세요." },
    ],
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert.deepStrictEqual(result.errors, []);
});

test("strict schema rejects quantitative claim with guarantee evidence ref", () => {
  const payload = basePayload({
    claims: [
      {
        id: "CLAIM_999_01",
        type: "quantitative",
        text: "시공은 2~3시간",
        evidence_refs: ["BRAND_FREE_MEASUREMENT"],
        verification_status: "verified",
      },
      {
        id: "CLAIM_999_02",
        type: "guarantee",
        text: "무료 방문실측 견적상담",
        evidence_refs: ["BRAND_FREE_MEASUREMENT"],
        verification_status: "verified",
      },
    ],
    slides: [
      { slide: 1, type: "cover", hook: "시공은 2~3시간이면 충분합니다" },
      { slide: 2, type: "cta", body: "댓글로 견적을 남기면 무료 방문실측 견적상담 안내" },
      { slide: 3, type: "caption_card", caption: "저장해두세요." },
    ],
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert(result.errors.some((error) => error.includes("requires verified evidence_refs")));
});

test("strict schema rejects performance claim with unrelated factual evidence ref", () => {
  const payload = basePayload({
    claims: [
      {
        id: "CLAIM_999_01",
        type: "performance",
        text: "소음이 90% 줄어듭니다",
        evidence_refs: ["BRAND_SITE_CHECKS"],
        verification_status: "verified",
      },
      {
        id: "CLAIM_999_02",
        type: "guarantee",
        text: "무료 방문실측 견적상담",
        evidence_refs: ["BRAND_FREE_MEASUREMENT"],
        verification_status: "verified",
      },
    ],
    slides: [
      { slide: 1, type: "cover", hook: "소음이 90% 줄어듭니다" },
      { slide: 2, type: "cta", body: "댓글로 견적을 남기면 무료 방문실측 견적상담 안내" },
      { slide: 3, type: "caption_card", caption: "저장해두세요." },
    ],
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert(result.errors.some((error) => error.includes("requires verified evidence_refs")));
});

test("strict schema rejects claim text outside registry coverage", () => {
  const payload = basePayload({
    claims: [
      {
        id: "CLAIM_999_01",
        type: "quantitative",
        text: "시공은 5분",
        evidence_refs: ["BRAND_INSTALL_2_3H"],
        verification_status: "verified",
      },
      {
        id: "CLAIM_999_02",
        type: "guarantee",
        text: "무료 방문실측 견적상담",
        evidence_refs: ["BRAND_FREE_MEASUREMENT"],
        verification_status: "verified",
      },
    ],
    slides: [
      { slide: 1, type: "cover", hook: "시공은 5분이면 끝납니다" },
      { slide: 2, type: "cta", body: "댓글로 견적을 남기면 무료 방문실측 견적상담 안내" },
      { slide: 3, type: "caption_card", caption: "저장해두세요." },
    ],
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert(result.errors.some((error) => error.includes("requires verified evidence_refs")));
});

test("claim risk detector does not flag demolition waste as medical 폐 claim", () => {
  const risks = findClaimRisks({ body: "철거 폐기물 처리비는 별도 안내됩니다." });
  assert(!risks.some((risk) => risk.type === "medical"));
});

test("strict non-lead goal can use primary_cta without forced CTA slide", () => {
  const payload = basePayload({
    primary_goal: "save",
    primary_cta: {
      action: "save",
      text: "이사 전 일정 체크용으로 저장",
    },
    slides: [
      { slide: 1, type: "cover", hook: "이사 전 중문 일정 체크" },
      { slide: 2, type: "point", body: "큰 짐이 들어오는 순서부터 확인하세요." },
      { slide: 3, type: "caption_card", caption: "저장해두세요." },
    ],
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert(!result.errors.some((error) => error.includes("CTA slide")));
});

test("strict customer_case requires evidence_ref", () => {
  const payload = basePayload({
    source_type: "customer_case",
    evidence_ref: [],
  });

  const result = validateStrictSchemaPayload(payload, { claimRegistry });
  assert(result.errors.some((error) => error.includes("evidence_ref is required")));
});
