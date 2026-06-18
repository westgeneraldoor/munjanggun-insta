# Claim Safety v2

문장군 캐러셀 MD 원고의 주장은 단순 금칙어가 아니라 `주장 유형 + 검증 상태 + 근거 ID`로 검수한다.

## 적용 기준

신규 strict 원고는 아래 필드를 반드시 가진다.

```json
{
  "schema_version": "6.0",
  "validation_profile": "strict"
}
```

ID 번호로 신규/레거시를 판단하지 않는다. 번호가 바뀌거나 외부 원고가 들어와도 위 필드가 strict 적용 기준이다.

모든 캐러셀 MD는 `validation_profile`을 가져야 한다. 기존 원고는 `validation_profile: "legacy"`로 명시하고, 신규 원고는 `validation_profile: "strict"`를 기본으로 한다.

레거시 원고는 `data/schema/LEGACY_CAROUSEL_ALLOWLIST.json`에 명시된 파일만 허용한다. allowlist 밖의 non-strict 원고는 PR 하드게이트에서 실패한다.

Allowlisted legacy 파일은 오탈자, 메타데이터, 경로 정리 같은 유지보수 수정만 허용한다. 본문, claim, CTA를 의미 있게 바꾸는 경우 해당 파일을 Schema v6 strict로 마이그레이션해야 한다.

## 필수 출처 필드

```json
{
  "source_type": "customer_question",
  "narrative_mode": "question",
  "trigger_type": "evergreen",
  "evidence_ref": ["Q003"],
  "primary_goal": "lead"
}
```

- `source_type`: `customer_question`, `customer_case`, `review`, `field_observation`, `internal_data`, `constructed_example`
- `narrative_mode`: `question`, `incident`, `reveal`, `comparison`, `checklist`
- `trigger_type`: `evergreen`, `seasonal`, `campaign`
- `primary_goal`: `save`, `share`, `comment`, `follow`, `lead`
- `customer_case`, `review`, `field_observation`, `internal_data`는 `evidence_ref`가 비어 있으면 실패한다.

## claims 구조

```json
{
  "claims": [
    {
      "id": "CLAIM_054_01",
      "type": "quantitative",
      "text": "일반 중문 시공은 보통 2~3시간",
      "evidence_refs": ["BRAND_MIDDLE_DOOR_INSTALL_2_3H"],
      "verification_status": "verified"
    }
  ]
}
```

- `verified_brand_fact`는 claim type이 아니다.
- `type`은 주장 종류다.
- `verification_status`가 검증 상태다.
- `evidence_refs`는 `data/claims/CLAIM_REGISTRY.json`의 `verified` 항목과 연결되어야 한다.
- `evidence_refs`는 status만 보지 않는다. registry의 `type`이 claim의 `type`과 같아야 하고, claim 문장이 registry의 `text` 또는 `allowed_phrases` 범위 안에 있어야 한다.

## 주장 유형

- `medical`: 건강/질병/의학 주장. strict 원고에서는 원칙적으로 실패한다.
- `performance`: 차단, 감소, 효과, 안정 같은 성능 주장.
- `quantitative`: 숫자, 기간, 퍼센트, 비용 규모 주장.
- `guarantee`: 무료, 무상, 보장, A/S 같은 정책/보증 주장.
- `competitor`: 경쟁사 비방, 업계 최고/최장 같은 비교 주장.
- `factual`: 현장 확인, 시공 방식, 제품 사실.
- `policy`: 회사 운영 정책.

## CTA 분리

모든 strict 원고는 `primary_cta`를 가진다.

- `lead`: CTA 슬라이드 1개 필수, `무료 방문실측 견적상담` 문구 필수.
- `save`, `share`, `comment`, `follow`: 핵심 행동을 `primary_cta`에 둔다. 상담 연결이 필요하면 `secondary_cta`에 짧게 둔다.

이 규칙의 목적은 모든 게시물이 같은 광고형 CTA로 끝나는 문제를 막는 것이다.

## PR 하드게이트

PR에서 추가되거나 수정된 `content/source/carousel/*.md`는 `npm run qa:changed`로 검증한다.

이 검증은 각 변경 파일에 대해 아래를 강제한다.

```bash
node scripts/validators/validate_content.js --require-strict --file <file>
node scripts/validators/carousel_qa.js --file <file> --stage final
```

따라서 신규 원고가 `schema_version` 또는 `validation_profile`을 빼먹으면 레거시처럼 통과하지 못한다.
