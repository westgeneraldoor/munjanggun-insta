# 문장군 인스타그램 프로젝트 신분증

이 저장소는 문장군 인스타그램 캐러셀 MD 원고 제작 전용 프로젝트다.  
블로그 프로젝트와 분리되어 있으며, 신규 캐러셀 제작 표준은 **MD/JSON 원고 + visual_intent**다.
이미지 생성, 이미지시트 제작, 최종 카드 제작, HTML 신규 제작은 하지 않는다.

## 최신 기준 경로

- 에이전트 지침: `AGENTS.md`
- 현재 상태: `_context.md`
- 브랜드 기준: `data/brand/BRAND_CONTEXT.md`
- 콘텐츠 전략: `docs/operating/INSTAGRAM_CONTENT_STRATEGY.md`
- 운영 가이드: `docs/operating/INSTAGRAM_OPERATING_GUIDE.md`
- 품질 스코어카드: `docs/operating/CONTENT_SCORECARD.md`
- 해시태그 뱅크: `data/hashtags/INSTAGRAM_HASHTAG_BANK.md`
- 문제은행: `data/problems/PROBLEM_BANK.md`
- 문제별 품질 규칙: `data/problems/PROBLEM_QUALITY_RULES.json`
- 소재 운영 플랜: `data/planning/INSTAGRAM_TOPIC_PLAN.md`
- 발행 등록부: `data/registry/INSTAGRAM_POSTING_REGISTRY.md`
- 상태 리포트: `outputs/status/CAROUSEL_MD_STATUS.md`
- 현재 캐러셀 원본: `content/source/carousel/`
- 발행 완료 PDF/HTML 레퍼런스: `content/published/`

## 운영 원칙

- 문장군은 인테리어 자랑 계정이 아니라 생활 문제 해결 계정이다.
- 신규 콘텐츠는 문제은행에서 출발한다.
- `PROBLEM_QUALITY_RULES.json`와 `npm run status`에서 제작 가능 판정이 난 소재만 사용한다.
- 신규 캐러셀은 HTML이 아니라 MD/JSON 원고까지만 만든다.
- HTML 템플릿과 렌더링 도구는 v3 레거시 보관물로만 취급한다.
- 콘텐츠 제작 후 `npm run validate`를 실행한다.
- 현재 후보/다음 번호/차단 사유 확인은 `npm run status`로 한다.

## 금지

- 브랜드 기준을 읽지 않고 콘텐츠 작성 금지
- 없는 제품/불가 지역/근거 없는 가격 수치 언급 금지
- 이미지 생성 프롬프트, 이미지시트, 최종 카드 이미지 제작 금지
- AI 이미지로 실제 시공 결과물처럼 꾸미기 금지
- 신규 HTML 캐러셀 생성 금지
- `제작금지`, `브랜드부적합`, `중복주의`, `계절대기`, `보류` 판정 소재로 신규 MD 생성 금지
