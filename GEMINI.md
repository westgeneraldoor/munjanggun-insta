# 문장군 인스타그램

## 프로젝트 개요
문장군(도어/중문/현관문 시공 전문업체)의 인스타그램 콘텐츠 운영 OS.
블로그 SEO 시스템과 완전 분리된 독립 파이프라인.
검색 엔진이 아닌 **발견 엔진 + 감정 엔진 + 반복 노출 엔진**으로 설계됨.
목표: 릴스 노출 → 캐러셀 저장 → DM 문의 → 무료 실측 예약 전환.

## 기술 스택
- 콘텐츠 제작: 인스타엔진 스킬 v3.0 (전역 스킬)
- 캐러셀 검증: scripts/validate_carousel.js (디자인 규격 자동 검사)
- 이미지 추출: tools/export/render_png.js (puppeteer 기반 보조 렌더러)
- TTS 생성: scripts/generate_tts.py (Google Gemini TTS, env fallback 적용)
- 현장 사진: AppSheet (시공 사진 라벨링·검색)

## 핵심 문서 위치
- 에이전트: `./AGENTS.md`
- 브랜드: `./BRAND_CONTEXT.md`
- 콘텐츠 전략: `./INSTAGRAM_CONTENT_STRATEGY.md`
- 해시태그 뱅크: `./INSTAGRAM_HASHTAG_BANK.md`
- 발행 등록부: `./INSTAGRAM_POSTING_REGISTRY.md` (성과 데이터 통합)
- 운영 가이드: `./INSTAGRAM_OPERATING_GUIDE.md`
- 캐러셀 디자인: `./INSTAGRAM_CAROUSEL_DESIGN_GUIDE.md`
- 품질 평가: `./CONTENT_SCORECARD.md` (8차원 평가 시스템)
- 결정 로그: `./DECISION_LOG.md`
- 현재 상태: `./_context.md`

## 현재 단계
인스타엔진 v3.0 구조 정비 완료 단계.
- v2.5 레거시 파일을 `_archive/legacy_v2/`로 격리.
- v3.0 HTML 단일 포맷 표준으로 일원화 완료 (003, 013 적용).
- HTML 규격 검사기(`validate`) 및 품질 스코어카드(`CONTENT_SCORECARD.md`) 구축 완료.
- 다음 테마 콘텐츠 제작 지시 대기 중.

## 문서 우선순위
충돌 시 `AGENTS.md` → `DECISION_LOG.md` → `PRD_*.md` → 운영/브랜드 문서 → 전역 `SKILL.md` → `_context.md` → 채팅 순서로 판단.

## 연결 채널
- 블로그 프로젝트: `c:\Users\hjh\안티그래비티\문장군블로그` (별도 독립 프로젝트)
- BRAND_CONTEXT.md: 블로그 원본을 복사. 브랜드 정보 업데이트 시 양쪽 동기화 필요.
