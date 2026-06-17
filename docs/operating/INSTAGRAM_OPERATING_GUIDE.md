# 문장군 인스타그램 캐러셀 MD 운영 가이드

> 최종 업데이트: 2026-06-12  
> 현재 범위: 캐러셀 MD/JSON 원고 제작 전용  
> 제외 범위: 이미지 생성, 이미지시트 제작, 최종 카드 제작, HTML 신규 제작, 숏폼 제작, 발행 대행, 성과 기록 자동화

## 1. 운영 원칙

문장군 인스타그램 원고는 제품 자랑이 아니라 생활 문제 해결에서 출발한다.

캐러셀 MD의 목표는 다음 세 가지다.

1. 저장할 만한 문제 진단 또는 체크 기준을 제공한다.
2. 댓글/DM 문의로 이어질 수 있는 자연스러운 CTA를 만든다.
3. 문장군 제품과 서비스 범위를 왜곡하지 않는다.

원고 생성 작업은 `content/source/carousel/NNN_주제명.md` 파일을 만들고 `npm run validate:file -- content/source/carousel/NNN_주제명.md`로 구조를 확인한 뒤, `npm run qa:carousel -- --file content/source/carousel/NNN_주제명.md --stage final`까지 통과해야 최종 완료로 보고한다.

## 2. 신규 요청 처리

사용자가 단순히 “캐러셀 만들어줘” 또는 “추천해서 만들어줘”라고 말하면 바로 파일을 만들지 않는다.

먼저 아래 항목을 제시하고 승인을 기다린다.

- 주제
- problem_bank_ref
- hook_type
- Hook Score
- target_persona
- purpose_tags
- 슬라이드 흐름
- CTA

사용자가 “바로 만들어”, “MD까지 만들어”, “승인 없이 진행”, “알아서 끝까지 해”처럼 명확히 위임한 경우에는 기획안 승인만 생략할 수 있다.

단, 품질 게이트는 생략할 수 없다. `npm run status`에서 `제작금지`, `브랜드부적합`, `중복주의`, `계절대기`, `보류`로 나온 소재는 MD 파일을 만들지 않는다.

## 3. 제작 전 확인 파일

캐러셀 MD를 만들기 전 아래 파일을 반드시 확인한다.

- `data/brand/BRAND_CONTEXT.md`
- `docs/operating/INSTAGRAM_CONTENT_STRATEGY.md`
- `data/hashtags/INSTAGRAM_HASHTAG_BANK.md`
- `data/registry/INSTAGRAM_POSTING_REGISTRY.md`
- `data/problems/PROBLEM_BANK.md`
- `data/problems/PROBLEM_QUALITY_RULES.json`
- `data/planning/INSTAGRAM_TOPIC_PLAN.md`
- `docs/operating/INSTAGRAM_TOPIC_WORKFLOW_PLAYBOOK.md`
- `docs/operating/CONTENT_SCORECARD.md`

이미지 생성 관련 문서는 제작 기준으로 사용하지 않는다.

## 4. 캐러셀 기본 구조

문제 해결형 캐러셀을 기본값으로 한다.

1. 훅: 문제 제시
2. 공감: 사용자가 겪는 상황
3. 원인: 왜 생기는 문제인지
4. 해결 기준: 무엇을 확인해야 하는지
5. 제품/서비스 연결: 문장군이 해결할 수 있는 범위
6. CTA: 댓글 또는 무료 방문실측 견적상담 유도
7. caption_card: 인스타 캡션과 해시태그

필요하면 6~8장 사이에서 조정할 수 있지만, 캡션카드는 기본 포함한다.

## 5. JSON 필수 기준

신규 캐러셀 MD는 JSON 코드블록 하나를 가진 Markdown이다.

필수 핵심 필드:

- `id`
- `theme`
- `title`
- `format: "carousel"`
- `total_slides`
- `content_type`
- `hook_type`
- `hook_score`
- `hook_score_reason`
- `purpose_tags`
- `problem_bank_ref`
- `target_persona`
- `variation_angle`
- `duplicate_signature`
- `cta_type`
- `visual_intent`
- `slides`

`visual_intent`는 이미지 생성 프롬프트가 아니다. 원고의 장면 의도를 기록하는 필드다.

## 6. 금지 필드

아래 필드는 신규 MD에 넣지 않는다. 검증기가 발견하면 에러 처리한다.

- `image_generation`
- `full_card_prompt`
- `image_asset`
- `source_html`

## 7. 문장 기준

- 첫 장은 제품 설명이 아니라 생활 문제로 시작한다.
- 가격, 보장, 기간은 근거 없는 수치로 단정하지 않는다.
- “완벽”, “무조건”, “100%”, “최고”, “업계 유일” 같은 표현은 피한다.
- 불가 지역을 가능하다고 쓰지 않는다.
- 중문/도어를 만능 해결책처럼 쓰지 않는다.
- CTA는 하나만 둔다.
- 댓글 키워드는 주제별로 달라도 최종 전환 목적지는 무료 방문실측 견적상담으로 고정한다.

## 8. 검증

원고 생성 또는 구조 변경 후 반드시 실행한다.

```bash
npm run validate
```

완료 기준:

- Errors 0
- 신규 원고에 MD-only 금지 필드 없음
- 신규 원고의 `problem_bank_ref`가 `PROBLEM_QUALITY_RULES.json`에서 차단 상태가 아님
- 신규 원고의 `duplicate_signature`, `target_persona`, `variation_angle`, `cta_type`이 존재함
- 신규 원고의 `visual_intent`, CTA, caption_card, hashtags가 구조상 유효함

기존 레거시 원고의 경고는 별도 정리 대상이며, 신규 원고 생성 자체를 막는 오류와 구분한다.

## 9. 범위 밖 요청

아래 요청은 이 프로젝트에서 수행하지 않는다.

- 이미지 만들어줘
- 이미지시트 만들어줘
- 카드까지 만들어줘
- HTML로 만들어줘
- 숏폼 만들어줘
- 배포해줘
- 발행해줘

이런 요청을 받으면 캐러셀 MD 원고 제작까지만 가능하다고 안내하고 멈춘다.
