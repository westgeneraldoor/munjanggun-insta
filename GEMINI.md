# 문장군 인스타그램 프로젝트 신분증

이 저장소는 문장군 인스타그램 콘텐츠 운영 전용 프로젝트다.  
블로그 프로젝트와 분리되어 있으며, 신규 캐러셀 제작 표준은 **MD/JSON 원본 + visual_intent**다.

## 최신 기준 경로

- 에이전트 지침: `AGENTS.md`
- 현재 상태: `_context.md`
- 브랜드 기준: `data/brand/BRAND_CONTEXT.md`
- 콘텐츠 전략: `docs/operating/INSTAGRAM_CONTENT_STRATEGY.md`
- 운영 가이드: `docs/operating/INSTAGRAM_OPERATING_GUIDE.md`
- 품질 스코어카드: `docs/operating/CONTENT_SCORECARD.md`
- 해시태그 뱅크: `data/hashtags/INSTAGRAM_HASHTAG_BANK.md`
- 문제은행: `data/problems/PROBLEM_BANK.md`
- 발행 등록부: `data/registry/INSTAGRAM_POSTING_REGISTRY.md`
- 성과 로그: `data/registry/performance_log.md`
- 현재 캐러셀 원본: `content/source/carousel/`
- 발행 완료 PDF/HTML 레퍼런스: `content/published/`

## 운영 원칙

- 문장군은 인테리어 자랑 계정이 아니라 생활 문제 해결 계정이다.
- 신규 콘텐츠는 문제은행에서 출발한다.
- 신규 캐러셀은 HTML이 아니라 MD/JSON으로 만든다.
- HTML 템플릿과 렌더링 도구는 v3 레거시로만 취급한다.
- 콘텐츠 제작 후 `npm run validate`를 실행한다.

## 금지

- 브랜드 기준을 읽지 않고 콘텐츠 작성 금지
- 없는 제품/불가 지역/근거 없는 가격 수치 언급 금지
- AI 이미지로 실제 시공 결과물처럼 꾸미기 금지
- 신규 HTML 캐러셀 생성 금지
