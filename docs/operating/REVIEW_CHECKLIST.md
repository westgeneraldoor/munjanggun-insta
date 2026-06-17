# 캐러셀 MD 리뷰 체크리스트

신규 캐러셀 원고는 아래 순서로 검수한다.

## 1. 소재 검수

| 항목 | 확인 |
|---|---|
| `topics.json` 또는 품질 규칙에서 `ready`인가? |  |
| 이미 `used`된 소재를 재사용하지 않았는가? |  |
| 최근 10개 원고와 `semantic_cluster`가 겹치지 않는가? |  |
| 제목/후킹이 기존 원고와 유사하지 않은가? |  |
| 문장군 제품/서비스와 구매 이유가 자연스러운가? |  |

## 2. 원고 검수

| 항목 | 확인 |
|---|---|
| 첫 장이 제품 설명이 아니라 생활 문제로 시작하는가? |  |
| 슬라이드 흐름이 문제 -> 원인 -> 체크 -> 판단 -> CTA로 이어지는가? |  |
| 이 캐러셀이 말하려는 단 하나의 메시지가 보이는가? |  |
| 고객에게 도움 되는 정보와 문장군에 남는 신뢰/전환 이유가 함께 있는가? |  |
| 고객 질문을 FAQ처럼 답변만 늘어놓지 않았는가? |  |
| 중문/도어를 만능 해결책처럼 말하지 않는가? |  |
| 근거 없는 가격, 수치, 보장 표현이 없는가? |  |
| 한 슬라이드에 메시지가 하나만 있는가? |  |

## 2-1. 총괄팀 5문장 게이트

051번 이후 신규 원고는 JSON에 `editorial_review`를 남긴다.

| 항목 | 확인 |
|---|---|
| `customer_problem`: 고객이 실제로 불안해하는 문제가 한 문장으로 선명한가? |  |
| `single_message`: 원고 전체의 단일 메시지가 한 문장으로 정리되는가? |  |
| `brand_benefit`: 문장군을 더 믿게 만드는 이유가 있는가? |  |
| `conversion_reason`: 댓글/DM/무료 방문실측 견적상담으로 이어지는 이유가 자연스러운가? |  |
| `rejection_risks`: 반려 위험을 최소 1개 이상 기록했는가? |  |
| 고객 질문을 2개 이상 묶었다면 `merged_question_rationale`이 있는가? |  |

## 3. 전환 검수

| 항목 | 확인 |
|---|---|
| CTA가 댓글 한 단어 중심으로 명확한가? |  |
| 댓글 키워드가 무엇이든 최종 CTA가 무료 방문실측 견적상담으로 이어지는가? |  |
| DM 유도 문구가 과장 광고처럼 보이지 않는가? |  |
| caption_card에 캡션과 해시태그가 들어 있는가? |  |

## 4. 운영 데이터 검수

| 항목 | 확인 |
|---|---|
| `CAROUSEL_SCORECARD_LOG.json`에 점수가 남았는가? |  |
| `INSTAGRAM_POSTING_REGISTRY.md`에 원고가 등록됐는가? |  |
| 사용한 문제 코드가 `used`로 전환됐는가? |  |
| 보류/폐기 판단은 `CONTENT_DECISION_LOG.md`에 남겼는가? |  |

## 5. 명령 검증

```bash
npm run topics:sync
npm run validate:file -- content/source/carousel/NNN_주제명.md
npm run qa:carousel -- --file content/source/carousel/NNN_주제명.md --stage final
npm run status
```

`validate:file` 또는 `validate:since`에서 신규 오류가 0이어야 하며, 최종 완료 보고 전에는 `qa:carousel`도 통과해야 한다.
