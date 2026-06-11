# 문장군 인스타그램 콘텐츠 운영 OS

문장군 인스타그램을 반복 제작, 검수, 발행, 성과 기록까지 운영하기 위한 프로젝트입니다.  
현재 표준은 **MD/JSON 기반 캐러셀 제작**이며, v3 HTML 캐러셀은 발행 완료 레거시로만 보관합니다.

## 핵심 원칙

- 문장군은 인테리어 자랑 계정이 아니라 생활 문제 해결 계정입니다.
- 새 캐러셀은 제품 설명이 아니라 문제에서 출발합니다.
- 신규 캐러셀은 `content/source/carousel/NNN_주제명.md`에 저장합니다.
- HTML 캐러셀 신규 제작은 하지 않습니다.
- 발행 완료 PDF/HTML은 `content/published/`에 보관합니다.
- 검증은 `npm run validate`로 실행합니다.

## 프로젝트 구조

```text
문장군 인스타그램/
├── AGENTS.md                         # 에이전트 운영 규칙
├── README.md                         # 현재 프로젝트 안내
├── index.html                        # 배포용 정적 진입점
├── package.json                      # 검증/레거시 스크립트
├── config/                           # 향후 설정 파일
├── content/
│   ├── source/
│   │   ├── carousel/                 # 현재 캐러셀 MD/JSON 원본
│   │   └── shortform/                # 숏폼 원본 패키지
│   ├── published/
│   │   ├── pdf/                      # v2 PDF 발행 레퍼런스
│   │   └── html-legacy/              # v3 HTML 발행 레퍼런스
│   └── assets/
│       ├── brand/                    # 로고 등 브랜드 자산
│       └── carousel/                 # 콘텐츠별 이미지 카드 자산
├── data/
│   ├── brand/                        # 브랜드 기준
│   ├── hashtags/                     # 해시태그 뱅크
│   ├── problems/                     # 문제은행
│   └── registry/                     # 발행 등록부, 캘린더, 성과 로그
├── docs/
│   ├── audits/                       # 감사 보고서
│   ├── collaboration/                # 대행사/촬영 협업 문서
│   ├── decisions/                    # PRD, 의사결정 로그
│   └── operating/                    # 운영 가이드, 전략, 스코어카드
├── outputs/                          # 로컬 preview/export 산출물, Git 제외
├── scripts/
│   ├── validators/                   # 현재 검증기
│   └── legacy/                       # v3 HTML 보조 도구
├── templates/
│   └── html-legacy/                  # v3 HTML 템플릿
└── tests/
```

## 콘텐츠 제작 흐름

1. `data/brand/BRAND_CONTEXT.md`를 읽어 제품, 지역, 금지사항을 확인합니다.
2. `data/problems/PROBLEM_BANK.md`에서 문제 기반 주제를 고릅니다.
3. `data/registry/INSTAGRAM_POSTING_REGISTRY.md`에서 중복 여부를 확인합니다.
4. Hook Score가 7점 이상인지 확인합니다.
5. `content/source/carousel/NNN_주제명.md` 파일을 만듭니다.
6. JSON에 `visual_intent`, CTA, caption card, hashtags를 포함합니다.
7. `npm run validate`로 구조를 검증합니다.
8. 발행 후 URL과 성과를 `data/registry/INSTAGRAM_POSTING_REGISTRY.md`와 `data/registry/performance_log.md`에 기록합니다.

## 명령어

```bash
npm run validate
```

현재 MD/JSON 캐러셀 원본을 검증합니다.

```bash
npm run legacy:validate-html -- content/published/html-legacy/013_우리집중문선택가이드.html
```

v3 HTML 레퍼런스를 검증할 때만 사용합니다.

```bash
npm run legacy:export-png -- content/published/html-legacy/013_우리집중문선택가이드.html
```

v3 HTML 레퍼런스를 PNG로 추출할 때만 사용합니다. 출력은 `outputs/exports/`에 생성됩니다.

## 중요 문서

- `AGENTS.md`: 에이전트 운영 규칙
- `docs/operating/INSTAGRAM_CONTENT_STRATEGY.md`: 콘텐츠 전략
- `docs/operating/INSTAGRAM_OPERATING_GUIDE.md`: 운영 가이드
- `docs/operating/CONTENT_SCORECARD.md`: 품질 평가 기준
- `data/brand/BRAND_CONTEXT.md`: 브랜드 기준
- `data/problems/PROBLEM_BANK.md`: 문제은행
- `data/hashtags/INSTAGRAM_HASHTAG_BANK.md`: 해시태그 뱅크
- `data/registry/INSTAGRAM_POSTING_REGISTRY.md`: 발행 등록부

## 레거시 정책

v2 PDF와 v3 HTML은 삭제하지 않고 발행 완료 레퍼런스로 보존합니다.  
신규 제작은 v4.2 규칙에 따라 MD/JSON만 사용합니다.
