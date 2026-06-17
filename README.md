# 문장군 인스타그램 콘텐츠 운영 OS

최종 캐러셀 MD 완료 보고 전에는 `npm run qa:carousel -- --file content/source/carousel/NNN_주제명.md --stage final`을 통과해야 합니다. 자세한 규칙은 `docs/operating/CAROUSEL_QA_HARDGATE.md`를 봅니다.

문장군 인스타그램 캐러셀 원고를 반복 제작하고 검수하기 위한 프로젝트입니다.  
현재 표준은 **캐러셀 MD/JSON 원고 제작 전용**입니다.  
이 프로젝트는 이미지 생성, 이미지시트 생성, 최종 카드 제작을 하지 않습니다.

## 핵심 원칙

- 문장군은 인테리어 자랑 계정이 아니라 생활 문제 해결 계정입니다.
- 새 캐러셀은 제품 설명이 아니라 문제에서 출발합니다.
- 신규 캐러셀은 `content/source/carousel/NNN_주제명.md` 파일로 바로 저장합니다.
- 산출물은 캐러셀 MD/JSON 원고입니다.
- HTML 캐러셀 신규 제작은 하지 않습니다.
- 이미지 생성 프롬프트, 이미지시트, 최종 카드 이미지는 만들지 않습니다.
- 발행 완료 PDF/HTML은 `content/published/`에 보관합니다.
- 검증은 `npm run validate`로 실행합니다.
- 현재 상태 리포트는 `npm run status`로 생성합니다.
- 신규 원고만 검증할 때는 `npm run validate:since -- 045` 또는 `npm run validate:file -- <파일>`을 사용합니다.
- 소재는 `seed -> review -> ready -> used/hold/rejected` 상태 머신으로 관리합니다.
- 고객 질문은 `raw -> triage_review -> answer_review -> ready -> used/hold/rejected` 상태로 관리하며, `triage_review`와 `answer_review` 상태에서는 바로 MD로 만들지 않습니다.

## 프로젝트 구조

```text
문장군 인스타그램/
├── AGENTS.md                         # 에이전트 운영 규칙
├── README.md                         # 현재 프로젝트 안내
├── index.html                        # 배포용 정적 진입점
├── package.json                      # MD/JSON 검증 스크립트
├── config/                           # 향후 설정 파일
├── content/
│   ├── source/
│   │   └── carousel/                 # 현재 캐러셀 MD/JSON 원고, NNN_주제명.md 직접 저장
│   ├── published/
│   │   ├── pdf/                      # v2 PDF 발행 레퍼런스
│   │   └── html-legacy/              # v3 HTML 발행 레퍼런스
│   └── assets/
│       ├── brand/                    # 로고 등 브랜드 자산
│       └── carousel/                 # 과거 콘텐츠별 이미지 카드 자산
├── data/
│   ├── brand/                        # 브랜드 기준
│   ├── hashtags/                     # 해시태그 뱅크
│   ├── questions/                    # 실제 고객 질문 목차와 질문별 상세 JSON
│   ├── planning/                     # 제작 가능 후보와 차단 클러스터
│   ├── problems/                     # 문제은행
│   ├── topics/                       # 토픽 상태 카탈로그
│   ├── evals/                        # 골든셋 평가 예시
│   └── registry/                     # 원고 레지스트리
├── docs/
│   ├── audits/                       # 감사 보고서
│   ├── collaboration/                # 대행사/촬영 협업 문서
│   ├── decisions/                    # PRD, 의사결정 로그
│   └── operating/                    # 운영 가이드, 전략, 스코어카드
├── outputs/                          # 비활성/임시 산출물, 신규 제작 기준 아님
├── scripts/
│   ├── lib/                          # 검증/리포트 공통 로직
│   ├── reports/                      # 상태 리포트 생성기
│   └── validators/                   # 현재 검증기
├── templates/                        # 현재 비활성
├── _archive/                         # 과거 HTML/미디어 도구 보관
└── tests/
```

## 콘텐츠 제작 흐름

1. `data/brand/BRAND_CONTEXT.md`를 읽어 제품, 지역, 금지사항을 확인합니다.
2. `data/topics/topics.json`과 `docs/operating/TOPIC_STATE_MACHINE.md`에서 소재 상태를 확인합니다.
3. `data/problems/PROBLEM_BANK.md`와 `data/problems/PROBLEM_QUALITY_RULES.json`에서 문제 기반 주제, hold/rejected 상태, semantic cluster를 확인합니다.
4. 고객 질문 기반 소재라면 `data/questions/CUSTOMER_QUESTION_BANK.json`, `data/questions/items/Q###.json`, `docs/operating/CUSTOMER_QUESTION_WORKFLOW.md`를 확인합니다.
5. `data/registry/INSTAGRAM_POSTING_REGISTRY.md`와 `data/registry/CAROUSEL_SCORECARD_LOG.json`에서 이미 다룬 소재와 점수 이력을 확인합니다.
6. `data/evals/`의 골든셋과 비교해 좋은 예/애매한 예/폐기 예와 같은 패턴인지 확인합니다.
7. `npm run status`에서 제작 가능 후보인지 확인합니다.
8. Hook Score가 7점 이상인지 확인합니다.
9. 기획안을 사용자에게 제시하고 승인을 받습니다.
10. 고객 질문이 `triage_review` 상태라면 먼저 독립 유지, 병합, 분리, 보류, 폐기 여부를 정리합니다.
11. 고객 질문이 `answer_review` 상태라면 먼저 공식 답변, 조건, 예외, 금지 표현을 사용자와 협의합니다.
12. 승인 후 `content/source/carousel/NNN_주제명.md` 원고 파일을 만듭니다.
13. 051번 이후 신규 원고는 `editorial_review`에 고객 문제, 단일 메시지, 문장군 이득, 전환 이유, 반려 리스크를 기록합니다.
14. JSON에 `visual_intent`, CTA, caption card, hashtags를 포함합니다.
15. CTA는 댓글 키워드를 쓰더라도 최종 목적지가 `무료 방문실측 견적상담`으로 명확히 이어져야 합니다.
16. `docs/operating/CAROUSEL_EDITORIAL_TEAM.md` 기준으로 소재 분석, 브랜드 팩트, 인스타 작가, 전환 설계, 중복 감시, QA 감시를 통과했는지 확인합니다.
17. `npm run validate:file -- content/source/carousel/NNN_주제명.md`로 신규 원고 구조를 검증합니다.
18. `outputs/qa/carousel/NNN/STATUS.md`와 `APPROVAL_LOG.md`를 확인합니다.
19. `npm run qa:carousel -- --file content/source/carousel/NNN_주제명.md --stage final`을 통과해야 최종 완료로 보고합니다.

단, 사용자가 "알아서 끝까지 해", "바로 만들어", "MD까지 만들어"처럼 명시적으로 위임한 경우에는 기획안 승인 게이트만 생략할 수 있습니다.
품질 게이트는 생략할 수 없습니다. `브랜드부적합`, `제작금지`, `중복주의`, `계절대기`, `보류` 후보는 MD로 만들지 않습니다.

"만들어줘"라는 단어만으로는 승인 게이트를 생략하지 않습니다. 신규 세션은 먼저 기획안을 제시하고 사용자 승인을 기다립니다.

## 명령어

```bash
npm run topics:sync
```

기존 문제은행, 품질 규칙, 후보 씨앗을 `data/topics/topics.json` 브릿지 카탈로그로 동기화합니다.

```bash
npm run status
```

현재 캐러셀 MD 수, 다음 번호, 문제은행 사용 현황, 100점 기준 소재 후보 점수표, 검증 요약을 `outputs/status/CAROUSEL_MD_STATUS.md`로 생성합니다.
제작 가능 후보가 부족하면 같은 리포트에 `후보 보강 제안`이 표시됩니다. 이 항목은 바로 MD로 만들지 않고 문제은행과 품질 규칙에 승격 검토한 뒤 사용합니다.

```bash
npm run validate
```

현재 MD/JSON 캐러셀 원본을 검증합니다.

```bash
npm run validate:since -- 045
npm run validate:file -- content/source/carousel/NNN_주제명.md
```

레거시 경고와 신규 원고 품질을 분리해서 검증합니다.

## 중요 문서

- `AGENTS.md`: 에이전트 운영 규칙
- `docs/operating/INSTAGRAM_CONTENT_STRATEGY.md`: 콘텐츠 전략
- `docs/operating/INSTAGRAM_OPERATING_GUIDE.md`: 운영 가이드
- `docs/operating/CONTENT_SCORECARD.md`: 품질 평가 기준
- `docs/operating/TOPIC_STATE_MACHINE.md`: 소재 상태 머신
- `docs/operating/REVIEW_CHECKLIST.md`: 신규 원고 리뷰 체크리스트
- `docs/operating/CAROUSEL_EDITORIAL_TEAM.md`: 캐러셀 총괄팀 역할, 승인 전 5문장 게이트, 강제 반려 기준
- `docs/operating/CONTENT_PRODUCTION_BOARD_RULES.md`: GitHub식 운영 규칙
- `docs/operating/CUSTOMER_QUESTION_WORKFLOW.md`: 고객 질문 기반 소재 운영 규칙
- `docs/operating/INSTAGRAM_TOPIC_WORKFLOW_PLAYBOOK.md`: 소재 선정/보류/거절/중복 판단 기준
- `data/brand/BRAND_CONTEXT.md`: 브랜드 기준
- `data/topics/topics.json`: 토픽 상태 카탈로그
- `data/questions/CUSTOMER_QUESTION_BANK.json`: 실제 고객 질문 목차와 상태 인덱스
- `data/questions/items/Q###.json`: 질문별 공식 답변, 조건, 금지 표현, 파생 캐러셀 후보
- `data/evals/golden_pass_examples.json`: 좋은 원고 예시
- `data/evals/golden_ambiguous_examples.json`: 보류/각도 조정 예시
- `data/evals/golden_reject_examples.json`: 폐기 소재 예시
- `data/problems/PROBLEM_BANK.md`: 문제은행
- `data/problems/PROBLEM_QUALITY_RULES.json`: 문제별 품질 게이트
- `data/planning/INSTAGRAM_TOPIC_PLAN.md`: 제작 가능 후보와 차단 클러스터
- `data/hashtags/INSTAGRAM_HASHTAG_BANK.md`: 해시태그 뱅크
- `data/registry/INSTAGRAM_POSTING_REGISTRY.md`: 발행 등록부
- `data/registry/CAROUSEL_SCORECARD_LOG.json`: 원고별 100점 스코어카드
- `data/registry/CONTENT_DECISION_LOG.md`: 보류/폐기/승격 판단 로그

## 레거시 정책

v2 PDF와 v3 HTML은 삭제하지 않고 발행 완료 레퍼런스로 보존합니다.  
과거 HTML/PNG/TTS 제작 도구는 `_archive/legacy-html-and-media-tools/`에 보관합니다.  
신규 제작은 MD/JSON 원고까지만 수행합니다.
