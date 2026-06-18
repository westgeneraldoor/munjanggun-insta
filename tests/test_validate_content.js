const assert = require("node:assert");
const test = require("node:test");

const { findClaimRisks, validateStrictSchemaPayload } = require("../scripts/validators/validate_content");

const claimRegistry = {
  claims: [
    { id: "BRAND_FREE_MEASUREMENT", status: "verified" },
    { id: "BRAND_DOOR_AS_3Y", status: "verified" },
    { id: "BRAND_INSTALL_2_3H", status: "verified" },
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
