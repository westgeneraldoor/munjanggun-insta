# 현재 작업 상태 — 문장군 인스타그램

## 프로젝트 상태

- 2026-06-11 기준 v5 폴더 구조로 개편.
- 현재 콘텐츠 표준: 캐러셀은 `content/source/carousel/*.md` MD/JSON 원본.
- 신규 캐러셀은 `visual_intent` 필수.
- v2 PDF와 v3 HTML은 `content/published/`에 발행 완료 레퍼런스로 보관.
- v3 HTML 제작 도구는 `scripts/legacy/`, `templates/html-legacy/`로 격리.

## 핵심 경로

- 브랜드 기준: `data/brand/BRAND_CONTEXT.md`
- 콘텐츠 전략: `docs/operating/INSTAGRAM_CONTENT_STRATEGY.md`
- 운영 가이드: `docs/operating/INSTAGRAM_OPERATING_GUIDE.md`
- 해시태그 뱅크: `data/hashtags/INSTAGRAM_HASHTAG_BANK.md`
- 문제은행: `data/problems/PROBLEM_BANK.md`
- 발행 등록부: `data/registry/INSTAGRAM_POSTING_REGISTRY.md`
- 성과 로그: `data/registry/performance_log.md`

## 검증

- 기본 검증: `npm run validate`
- 현재 검증기: `scripts/validators/validate_content.js`

## 다음 할 일

- 새 콘텐츠 제작 시 `content/source/carousel/NNN_주제명.md`에 생성.
- 발행 후 URL과 성과를 `data/registry` 문서에 반영.
