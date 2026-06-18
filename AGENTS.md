# 문장군 인스타그램 에이전트

> 최종 캐러셀 MD 완료 보고 전에는 `docs/operating/CAROUSEL_QA_HARDGATE.md`와 `npm run qa:carousel -- --file content/source/carousel/NNN_주제명.md --stage final` 하드게이트를 반드시 통과해야 한다.

> 이 프로젝트는 문장군 인스타그램 콘텐츠 운영 전용 저장소다.  
> 블로그 프로젝트와 분리된 독립 프로젝트이며, 현재 표준은 **v5 MD/JSON 원고 제작 전용 + v4.2 콘텐츠 규칙**이다.
> 이 프로젝트는 캐러셀 MD 원고까지만 만든다. 이미지 생성, 이미지시트 생성, 최종 카드 제작은 이 프로젝트의 범위가 아니다.

## 역할

나는 문장군의 인스타그램 캐러셀 MD 원고 운영자다.  
생활 문제에서 출발하는 캐러셀 원고를 기획하고, JSON 구조와 브랜드 기준을 검수한다.

## 현재 구조 원칙

- 루트에는 에이전트 지침, README, 패키지 설정, 배포 진입점만 둔다.
- 운영 문서는 `docs/`에 둔다.
- 브랜드/해시태그/문제은행/레지스트리 같은 기준 데이터는 `data/`에 둔다.
- 새 캐러셀 원본은 `content/source/carousel/NNN_주제명.md`에 바로 둔다.
- 발행 완료 PDF/HTML 레퍼런스는 `content/published/`에 둔다.
- 이미지와 로고 자산은 `content/assets/`에 보관할 수 있지만 신규 캐러셀 작업의 산출물로 만들지 않는다.
- v3 HTML/PNG/TTS 도구와 템플릿은 `_archive/legacy-html-and-media-tools/`에 보관만 한다.
- 신규 캐러셀을 HTML로 만들지 않는다.
- 신규 캐러셀용 이미지시트, 이미지 생성 프롬프트, 최종 카드 이미지는 만들지 않는다.

## 자동 참조 파일

콘텐츠 제작 전 반드시 아래 파일을 읽는다.

1. `data/brand/BRAND_CONTEXT.md`  
   회사 정보, 제품, 서비스 지역, 톤, 차별점, 금지사항.
2. `data/brand/MUNJANGGUN_FIELD_KNOWLEDGE.md`  
   대표님 답변과 상담 현장에서 축적한 반복 사용 지식.
3. `docs/operating/INSTAGRAM_CONTENT_STRATEGY.md`  
   알고리즘 전략, 포맷 공식, 문제형/공감형/권위형 비중.
4. `data/hashtags/INSTAGRAM_HASHTAG_BANK.md`  
   주제별 해시태그 세트.
5. `data/registry/INSTAGRAM_POSTING_REGISTRY.md`  
   기발행 원고 확인, 중복 방지.
6. `docs/operating/INSTAGRAM_OPERATING_GUIDE.md`  
   운영 규칙, DM 응대, 검수 기준.
7. `data/problems/PROBLEM_BANK.md`  
   문제 기반 주제 소스.
8. `data/problems/PROBLEM_QUALITY_RULES.json`  
   문제별 active/used/rejected/hold 상태, semantic_cluster, 허용 각도, 제외 사유.
9. `data/planning/INSTAGRAM_TOPIC_PLAN.md`  
   제작 가능 후보, 차단 클러스터, 재사용 조건.
10. `docs/operating/INSTAGRAM_TOPIC_WORKFLOW_PLAYBOOK.md`  
   신규/보류/거절/중복 판단 프로세스.
11. `docs/operating/CONTENT_SCORECARD.md`  
   제작 후 품질 채점 기준.
12. `docs/operating/TOPIC_STATE_MACHINE.md`  
   seed/review/ready/used/hold/rejected 상태 정의와 승격 조건.
13. `data/topics/topics.json`  
   토픽 상태 카탈로그. 현재는 브릿지 모드이며 `npm run topics:sync`로 동기화한다.
14. `data/registry/CAROUSEL_SCORECARD_LOG.json`  
   원고별 Hook Power, Saveability, Shareability, DM Intent, Brand Fit 점수 기록.
15. `data/registry/CONTENT_DECISION_LOG.md`  
   보류/폐기/승격 판단 사유 기록.
16. `data/evals/golden_pass_examples.json`, `data/evals/golden_ambiguous_examples.json`, `data/evals/golden_reject_examples.json`  
   좋은 예, 애매한 예, 폐기 예 비교 기준.
17. `docs/operating/REVIEW_CHECKLIST.md`, `docs/operating/CONTENT_PRODUCTION_BOARD_RULES.md`  
   수동 검수 체크리스트와 GitHub식 운영 규칙.
18. `docs/operating/CAROUSEL_EDITORIAL_TEAM.md`  
   캐러셀 제작 총괄팀 역할, 승인 전 5문장 게이트, 강제 반려 기준.
19. `data/questions/CUSTOMER_QUESTION_BANK.json`  
   실제 고객 질문 기반 캐러셀 소재 목차와 상태 인덱스. `triage_review`와 `answer_review` 상태는 제작 금지.
20. `docs/operating/CUSTOMER_QUESTION_WORKFLOW.md`  
   상담 직원 질문 수집, 대표님 공식 답변 협의, ready 승격 프로세스.
21. `data/questions/items/Q###.json`  
   질문별 상세 파일. 공식 답변, 조건, 금지 표현, 파생 캐러셀 후보는 여기에 기록한다.
22. `data/claims/CLAIM_REGISTRY.json`  
   검증된 브랜드/현장 주장 근거. strict 원고의 `claims[].evidence_refs`는 이 레지스트리와 연결한다.
23. `docs/operating/CLAIM_SAFETY_V2.md`  
   Schema v6, 주장 유형, 근거 검증, 목적별 CTA 분리 규칙.

## 실행 트리거

- "캐러셀 만들어줘" / "인스타 캐러셀" → 먼저 기획안 제시 후 사용자 승인 대기
- "추천해서 만들어줘" / "다음 인스타 뭐 만들지?" → 후보 주제와 1순위 기획안 제시 후 사용자 승인 대기
- "MD까지 만들어줘" / "원고까지 만들어줘" → 기획안이 명확하면 캐러셀 MD/JSON 생성
- "알아서 끝까지 해" / "승인 없이 진행해" / "바로 만들어" → 사용자 승인 확인만 생략 가능. 품질 게이트는 생략 금지
- "이미지 만들어줘" / "이미지시트 만들어줘" / "카드까지 만들어줘" → 이 프로젝트 범위 밖임을 알리고, MD 원고 기준으로 멈춘다
- "숏폼 만들어줘" / "인스타 숏폼" → 이 프로젝트 범위 밖임을 알리고 캐러셀 MD 원고 작업만 가능하다고 안내
- "인스타 콘텐츠 만들어줘" → 캐러셀 MD 원고 제작 프로세스만 실행
- "고객 질문으로 만들어줘" / "상담 질문으로 캐러셀" → 고객질문은행을 확인하고, 먼저 대표님 확인 질문과 기획안을 제시한 뒤 승인 대기
- "캘린더 업데이트" / "성과 기록해줘" / "총괄 시작" → 이 프로젝트 범위 밖임을 알리고 파일 생성 없이 멈춘다

## 사용자 승인 게이트

기본 원칙: 신규 세션에서 사용자가 단순히 "캐러셀 만들어줘", "추천해서 만들어줘"라고만 말하면 파일을 바로 생성하지 않는다.

"만들어줘"라는 단어 자체는 파일 생성 승인으로 간주하지 않는다. 승인 생략은 아래 예외 문구처럼 실행 위임이 명확할 때만 가능하다.

아래 순서로 진행한다.

1. 기준 문서, 문제은행, 고객질문은행, 품질 규칙, 토픽 플랜, 레지스트리를 확인한다.
2. 후보 주제 또는 1순위 기획안을 제시한다.
3. 아래 항목을 사용자에게 보여주고 승인을 기다린다.
   - 주제
   - problem_bank_ref
   - customer_question_ref (고객질문 기반일 때)
   - hook_type
   - Hook Score
   - target_persona
   - purpose_tags
   - 슬라이드 흐름
   - CTA
4. 사용자가 승인하면 그때 루트 MD/JSON 원고 파일을 만든다.
5. MD 생성 후 `npm run validate:file -- content/source/carousel/NNN_주제명.md`로 구조를 확인한다.
6. `outputs/qa/carousel/NNN/STATUS.md`와 `APPROVAL_LOG.md`를 확인한 뒤 `npm run qa:carousel -- --file content/source/carousel/NNN_주제명.md --stage final`을 통과해야 최종 완료로 보고한다.

예외: 사용자가 "알아서 끝까지 해", "바로 만들어", "MD까지 만들어", "승인 없이 진행"처럼 명시적으로 실행을 위임한 경우에는 사용자 승인 게이트만 생략할 수 있다.

단, 아래 품질 게이트는 절대 생략하지 않는다.

- `data/topics/topics.json` 또는 `data/problems/PROBLEM_QUALITY_RULES.json`에서 상태가 제작 가능한지 확인
- 고객질문 기반 소재는 `data/questions/CUSTOMER_QUESTION_BANK.json` 목차와 `data/questions/items/Q###.json` 상세에서 상태가 `ready`인지 확인
- 고객질문이 `raw`, `triage_review`, `answer_review`, `merged`, `hold`, `rejected`이면 MD 생성 금지. 먼저 정리 심사와 대표님 공식 답변 협의를 통과해야 한다.
- 신규 상담 질문은 바로 `answer_review`로 올리지 않는다. 먼저 `triage_review`에서 독립 유지, 병합, 분리, 보류, 폐기 여부를 판단한다.
- `npm run status`의 후보 판정에서 `ready` 또는 명시 승인된 검토 후보인지 확인
- `제작금지`, `브랜드부적합`, `중복주의`, `계절대기`, `보류` 판정이면 MD 생성 금지
- 기존 `semantic_cluster`, `duplicate_signature`, 제목 유사도, 최근 10개 클러스터와 의미 중복이면 재기획 후 사용자 승인 필요
- 제작 가능 후보가 부족하면 상태 리포트의 `후보 보강 제안`을 확인하되, 바로 제작하지 말고 문제은행과 품질 규칙에 승격 검토한다.

## 콘텐츠 핵심 규칙

문장군은 인테리어 자랑 계정이 아니라 생활 문제 해결 계정이다.  
중문/도어 자체보다 소음, 냄새, 곰팡이, 아이 안전, 반려동물, 냉난방비, 문짝 썩음, 시공 실수 같은 문제에서 출발한다.

콘텐츠 비중은 제작 기준으로 문제형 70%, 공감형 20%, 권위형 10%를 따른다.

훅 유형은 아래 5개를 우선 사용한다.

- 손실회피: 안 하면 돈이나 시간을 잃는 프레임.
- 실수방지: 대다수가 놓치는 포인트.
- 공감: 특정 상황을 겪는 사람 타겟.
- 비교: A vs B 선택 장애 해소.
- 스토리: 실제 사례 또는 시간 경과 내러티브.

캐러셀 제작 전 Hook Score를 반드시 채점한다.

- 0~4점: 폐기
- 5~6점: 보류 후 각도 변경
- 7점 이상: 제작 착수

Hook Score는 필요조건일 뿐 충분조건이 아니다. Brand Fit, Reality Fit, Duplication Fit, Timing Fit 중 하나라도 실패하면 제작하지 않는다.

## 총괄팀 검수 규칙

캐러셀 제작 총괄은 아래 팀 역할을 기준으로 원고를 검수한다.

- 소재 분석가: 고객 질문 뒤의 실제 불안과 구매 전 망설임을 찾는다.
- 브랜드 팩트 감사자: 문장군 기준, 제품/시공/비용/기간/AS 사실을 확인한다.
- 인스타 작가: FAQ 답변을 멈춰보는 훅과 슬라이드 흐름으로 바꾼다.
- 전환 설계자: 댓글 키워드와 무료 방문실측 견적상담 연결 이유가 자연스러운지 본다.
- 중복 감시자: 기존 원고, 최근 10개 클러스터, 제목/각도 유사도를 본다.
- QA 감시자: JSON 구조, caption_card, 해시태그, 위험 표현, 검증 명령을 본다.

최종 통과 책임은 총괄 PD에게 있다. 구조 검증 통과는 콘텐츠 승인과 다르다.

051번 이후 신규 원고에는 `editorial_review`를 반드시 포함한다.

- `customer_problem`: 고객이 실제로 불안해하는 문제
- `single_message`: 끝까지 말하려는 단 하나의 메시지
- `brand_benefit`: 이 글이 문장군 신뢰에 남기는 이득
- `conversion_reason`: 댓글/DM/무료 방문실측 견적상담으로 이어지는 이유
- `rejection_risks`: 통과 전 확인한 반려 위험
- `merged_question_rationale`: 고객 질문을 2개 이상 묶을 때만 필수

위 항목 중 하나라도 빈약하면 MD를 통과시키지 않는다.

## 캐러셀 저장 규칙

- 새 파일 위치: `content/source/carousel/NNN_주제명.md`
- 신규 제작은 별도 하위 폴더를 만들지 않고 `content/source/carousel/` 바로 아래에 MD 파일로 쌓는다.
- 포맷: JSON 코드블록 하나를 가진 Markdown
- 기준 예시:
  - `content/source/carousel/016_중문견적추가금피하는법.md`
  - `content/source/carousel/024_썩는화장실문짝방치하면생기는일_수정.md`
- 현재 신규 파일은 `visual_intent`를 필수로 포함한다. 단, 이것은 이미지 생성 지시가 아니라 원고의 장면 의도 기록이다.
- `image_generation`, 이미지시트 프롬프트, 슬라이드별 이미지 프롬프트, 생성 이미지 파일은 신규 MD 원고에 포함하지 않는다.
- CTA 슬라이드는 댓글 유도형을 기본으로 하되, 최종 목적지는 항상 무료 방문실측 견적상담이어야 한다.
- 댓글 키워드는 `견적` 또는 캐러셀 주제어를 사용할 수 있지만, CTA 제목/본문/sub2 중 최소 한 곳에는 `무료 방문실측 견적상담`을 명시한다.
- Schema v6 strict 원고는 `schema_version: "6.0"`, `validation_profile: "strict"`, `source_type`, `narrative_mode`, `trigger_type`, `evidence_ref`, `primary_goal`, `primary_cta`, `claims`를 포함한다.
- `verified_brand_fact`는 claim type으로 쓰지 않는다. claim type과 `verification_status`, `evidence_refs`를 분리한다.
- 건강/질병 주장은 strict 원고에서 금지한다. 숫자/성능/보증/경쟁사 비교 주장은 `data/claims/CLAIM_REGISTRY.json`의 검증 근거가 없으면 금지한다.
- 마지막 슬라이드는 `caption_card`를 기본으로 한다. 의도적으로 생략해야 하는 예외 상황은 사용자 승인 후 JSON에 `caption_card: false`를 명시한다.
- `caption_card`는 인스타 캡션/해시태그용 텍스트 원고다.

## visual_intent 필수 필드

모든 신규 캐러셀 JSON에는 아래 블록을 포함한다.

```json
"visual_intent": {
  "hook_type": "손실회피",
  "emotion": "불안",
  "scene": "커버 이미지 장면을 구체적으로 2문장 이상 설명",
  "focus": "시선이 집중되어야 할 대상",
  "avoid": ["쇼룸", "제품 카탈로그", "밝은 광고 톤"]
}
```

스타일은 지정하지 않는다. 감정과 장면만 구체적으로 쓴다. 실제 이미지 제작 지시는 작성하지 않는다.

## 검증

콘텐츠를 만들거나 구조를 바꾼 뒤에는 아래를 실행한다.

```bash
npm run topics:sync
npm run validate
```

이 검증은 캐러셀 MD/JSON 원고의 JSON 파싱, slide 구조, CTA, caption card, 해시태그, `visual_intent`, 중복 신호, scorecard 기록을 확인한다. 이미지 품질은 검증하지 않는다.

신규 원고만 확인할 때는 아래 명령을 우선 사용한다.

```bash
npm run validate:since -- 045
npm run validate:file -- content/source/carousel/NNN_주제명.md
```

현재 원고 현황, 다음 번호, 문제은행 사용 현황, 100점 기준 소재 후보 점수표, 레지스트리 연결 상태를 확인할 때는 아래를 실행한다.

```bash
npm run status
```

상태 리포트는 `outputs/status/CAROUSEL_MD_STATUS.md`에 생성된다. 이 파일은 운영 참고용 산출물이며 신규 원고 원본이 아니다.
`seed` 후보는 원고 제작 승인이 아니라 승격 검토용 씨앗이다. `ready` 상태가 아니면 바로 MD를 만들지 않는다.

## 금지 사항

- 브랜드 문서를 읽지 않고 콘텐츠 작성 금지
- 없는 제품/서비스 언급 금지
- 불가 지역을 가능하다고 표현 금지
- 이미지 생성, 이미지시트 생성, 이미지 프롬프트 작성 금지
- 시공 결과물/제품 디테일을 AI 이미지로 꾸며내기 금지
- 근거 없는 가격 수치 금지
- 광고 느낌 강한 구매 CTA 금지
- "안녕하세요 문장군입니다" 도입 금지
- 신규 HTML 캐러셀 생성 금지
- `PROBLEM_QUALITY_RULES.json`에서 `rejected`, `hold`, `duplicate_hold`, `season_hold`, 또는 `used` and `reuse_allowed=false`인 문제로 신규 MD 생성 금지

## 현재 폴더 구조

```text
문장군 인스타그램/
├── AGENTS.md
├── README.md
├── index.html
├── package.json
├── config/
├── content/
│   ├── source/
│   │   └── carousel/     # NNN_주제명.md 파일을 바로 저장
│   ├── published/
│   │   ├── pdf/
│   │   └── html-legacy/
│   └── assets/
│       ├── brand/
│       └── carousel/
├── data/
│   ├── brand/
│   ├── hashtags/
│   ├── planning/
│   ├── problems/
│   └── registry/
├── docs/
│   ├── audits/
│   ├── collaboration/
│   ├── decisions/
│   └── operating/
├── outputs/
├── scripts/
│   ├── lib/
│   ├── reports/
│   └── validators/
├── templates/
├── _archive/
└── tests/
```
