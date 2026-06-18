# 캐러셀 MD QA 하드게이트

이 문서는 문장군 인스타그램 캐러셀 MD 원고를 최종 통과시키기 전에 반드시 거쳐야 하는 CLI 기반 차단 규칙이다.

이 프로젝트는 캐러셀 MD/JSON 원고까지만 만든다. 이미지 생성, 이미지시트 생성, HTML, MP4, 최종 카드 제작은 이 QA 범위가 아니다.

## 목적

- 구조 검증 통과와 콘텐츠 승인 통과를 분리한다.
- 사용자 승인 없이 파일 생성 또는 최종 완료 처리되는 일을 막는다.
- CTA, 중복, 브랜드 사실, 프로젝트 범위 오류를 CLI에서 차단한다.
- 신규 세션에서도 같은 절차로 움직이게 한다.

## 파일 위치

캐러셀 MD 원고는 기존 규칙대로 아래에 직접 저장한다.

```text
content/source/carousel/NNN_주제명.md
```

상태와 승인 기록은 원고 폴더 안에 만들지 않고 아래에 둔다.

```text
outputs/qa/carousel/NNN/
  STATUS.md
  APPROVAL_LOG.md
  qa_manifest.json
```

## 필수 제어 파일

### STATUS.md

최소한 아래 체크가 모두 있어야 한다.

```markdown
# STATUS

- [x] topic_approved
- [x] md_created
- [x] brand_fact_checked
- [x] duplicate_checked
- [x] cta_checked
- [x] scope_checked
```

각 의미는 다음과 같다.

- `topic_approved`: 소재/고객질문이 ready 상태이며 사용자 기획 승인 또는 명시 위임을 받았다.
- `md_created`: 캐러셀 MD 원고 파일이 생성되었다.
- `brand_fact_checked`: 비용, AS, 시공시간, 철거폐기물, 제품 사실이 문장군 기준과 충돌하지 않는다.
- `duplicate_checked`: 기존 원고, 최근 10개 클러스터, 제목/각도 유사도를 확인했다.
- `cta_checked`: CTA 최종 목적지가 무료 방문실측 견적상담이다.
- `scope_checked`: 이미지 생성, 이미지시트, HTML, 카드 제작 지시가 원고에 포함되지 않았다.

### APPROVAL_LOG.md

최종 통과 단계에서는 아래 체크가 모두 있어야 한다.

```markdown
# APPROVAL_LOG

- [x] planning_approved_by_user
planning_approval_source: 사용자 채팅 승인 문구 또는 명시 위임 근거
planning_approval_at: 2026-06-16T10:00:00+09:00

- [x] md_approved_by_user
md_approval_source: 사용자 최종 MD 승인 문구
md_approval_at: 2026-06-16T10:10:00+09:00
```

- `planning_approved_by_user`: 파일 생성 전 기획안 승인 또는 명시적 실행 위임이 있었다.
- `md_approved_by_user`: 생성된 MD 원고를 사용자가 최종 승인했다.
- `planning_approval_source`, `md_approval_source`: 승인 근거 문구 또는 대화 출처.
- `planning_approval_at`, `md_approval_at`: 승인 시각.
- 승인 근거에는 `none`, `todo`, `placeholder`, `soon`, `later`, `pending confirmation`, `not available` 같은 임시값을 쓰지 않는다.
- 승인 시각은 ISO 형태에 가깝게 기록한다. 예: `2026-06-16T10:10:00+09:00`

## CLI

초안 QA:

```bash
npm run qa:carousel -- --file content/source/carousel/NNN_주제명.md --stage draft
```

최종 QA:

```bash
npm run qa:carousel -- --file content/source/carousel/NNN_주제명.md --stage final
```

기본값은 `final`이다.

하나라도 실패하면 exit code 1로 종료한다. 이 경우 원고를 최종 완료 처리하지 않는다.

## 차단 조건

초안 QA는 `STATUS.md`만 있어도 실행할 수 있다. 최종 QA는 `APPROVAL_LOG.md`와 승인 근거가 반드시 있어야 한다.

다음 중 하나라도 걸리면 FAIL이다.

- `STATUS.md` 없음
- `APPROVAL_LOG.md` 없음
- 필수 STATUS 체크 누락
- final 단계에서 사용자 승인 체크 누락
- final 단계에서 승인 출처/시각 근거 누락
- `validate_content.js --file` 실패
- 기존 검증기의 중복 위험 경고 발생
  - `duplicate_signature`
  - `title is very similar`
  - `semantic_cluster ... appears again`
- 대상 원고가 기존 corpus의 제목 또는 `duplicate_signature`와 직접 충돌
- 대상 원고 번호가 기존 다른 파일의 `id`와 충돌
- 파일명에 `NNN_` prefix가 없음
- 파일명 `NNN_` prefix와 JSON `id`가 불일치
- JSON `id`가 1~3자리 숫자 형식이 아님. 예: `099_draft`, `099-temp` 금지
- 대상 원고의 `problem_bank_ref`가 최근 corpus의 같은 `semantic_cluster`와 충돌
- `problem_bank_ref`가 있는데 `data/problems/PROBLEM_QUALITY_RULES.json`이 없거나 파싱되지 않음
- MD-only 범위를 벗어나는 키 포함
  - `image_generation`
  - `image_prompt`
  - `image_sheet`
  - `full_card_prompt`
  - `image_asset`
  - `source_html`
  - `html_generation`
  - `card_export`
  - `final_card`
  - `video_script`
  - `mp4`
- 위 키를 살짝 바꾼 변형도 금지한다. 예: `slide_image_prompt`, `image_prompts`, `image_sheet_prompt`, `card_image`

## qa_manifest.json

QA 실행 때마다 아래 파일이 생성된다.

```text
outputs/qa/carousel/NNN/qa_manifest.json
```

여기에는 실행 시각, 대상 파일, stage, STATUS/APPROVAL 체크, validate 결과, 중복 경고, 에러가 기록된다.

## 운영 원칙

- `npm run validate:file` 통과는 구조 검증 통과일 뿐이다.
- `npm run qa:carousel` 통과 전에는 최종 완료라고 말하지 않는다.
- 신규 세션에서 “캐러셀 만들어줘”라고만 하면 기획안을 먼저 보여주고 승인 대기한다.
- “알아서 끝까지 해”처럼 명시 위임이 있어도 QA 하드게이트는 생략하지 않는다.
- 최종 목적 CTA는 항상 무료 방문실측 견적상담이어야 한다.
