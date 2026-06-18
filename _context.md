# 현재 작업 상태 — 문장군 인스타그램

## 프로젝트 상태

- 2026-06-12 기준 프로젝트 범위를 캐러셀 MD/JSON 원고 제작 전용으로 재확정.
- 현재 콘텐츠 표준: 캐러셀은 `content/source/carousel/NNN_주제명.md` MD/JSON 원고.
- 신규 캐러셀은 `visual_intent` 필수.
- v2 PDF와 v3 HTML은 `content/published/`에 발행 완료 레퍼런스로 보관.
- v3 HTML/PNG/TTS 제작 도구는 `_archive/legacy-html-and-media-tools/`에 보관만 하며 신규 작업에 사용하지 않음.
- 이미지 생성, 이미지시트, 이미지 프롬프트, 최종 카드 제작은 이 프로젝트 범위 밖.

## 핵심 경로

- 브랜드 기준: `data/brand/BRAND_CONTEXT.md`
- 콘텐츠 전략: `docs/operating/INSTAGRAM_CONTENT_STRATEGY.md`
- 운영 가이드: `docs/operating/INSTAGRAM_OPERATING_GUIDE.md`
- 해시태그 뱅크: `data/hashtags/INSTAGRAM_HASHTAG_BANK.md`
- 문제은행: `data/problems/PROBLEM_BANK.md`
- 문제별 품질 규칙: `data/problems/PROBLEM_QUALITY_RULES.json`
- 소재 운영 플랜: `data/planning/INSTAGRAM_TOPIC_PLAN.md`
- 발행 등록부: `data/registry/INSTAGRAM_POSTING_REGISTRY.md`
- 상태 리포트: `outputs/status/CAROUSEL_MD_STATUS.md`

## 검증

- 기본 검증: `npm run validate`
- 상태 리포트/후보 점수표: `npm run status`
- 통합 품질 확인: `npm run quality`
- 현재 검증기: `scripts/validators/validate_content.js`
- 현재 상태 리포트 생성기: `scripts/reports/generate_status.js`

## 다음 할 일

- 새 콘텐츠 제작 전 `npm run status`로 제작 가능 후보인지 확인.
- `제작금지`, `브랜드부적합`, `중복주의`, `계절대기`, `보류` 판정 소재는 MD 생성 금지.
- 새 콘텐츠 제작 시 `content/source/carousel/NNN_주제명.md`에 생성.
- 원고 생성 후 `npm run validate`를 실행하고 멈춤.
