# 토픽 상태 머신

문장군 캐러셀은 소재를 바로 원고로 만들지 않는다. 모든 소재는 아래 상태를 거친다.

```text
seed -> review -> ready -> used
                 -> hold
                 -> rejected
```

## 상태 정의

| 상태 | 의미 | 원고 제작 가능 여부 |
|---|---|---|
| seed | 후보 씨앗. 아직 브랜드 적합성, 현실성, 중복성을 통과하지 않았다. | 불가 |
| review | 승격 검토 중. 각도 조정, 근거 확인, 중복 점검이 필요하다. | 불가 |
| ready | 제작 가능. Hook Score, Brand Fit, Reality Fit, Duplication Fit을 통과했다. | 가능 |
| used | 이미 원고로 제작됨. `reuse_allowed=false`면 재사용 금지. | 불가 |
| hold | 보류. 계절, 중복, 근거 부족, 각도 불명확 등으로 대기한다. | 불가 |
| rejected | 폐기. 문장군 브랜드/제품/현실 인과와 맞지 않는다. | 불가 |

## 승격 조건

`seed`에서 `ready`로 바로 올리지 않는다. 반드시 `review`를 거친다.

승격 검토 항목:

| 항목 | 통과 기준 |
|---|---|
| Brand Fit | 문장군 제품/서비스와 자연스럽게 연결된다. |
| Reality Fit | 생활 인과가 억지스럽지 않다. |
| Duplication Fit | 기존 원고와 제목, 클러스터, 제품 연결이 겹치지 않는다. |
| Purchase Reason | 무료 방문실측 또는 상담으로 이어질 이유가 있다. |
| Allowed Angle | 쓸 수 있는 각도가 구체적으로 정의되어 있다. |
| Avoid Angle | 쓰면 안 되는 과장/오해 각도가 명시되어 있다. |

## 차단 규칙

아래 중 하나라도 해당하면 `ready`가 될 수 없다.

- 이미 `used`이고 `reuse_allowed=false`
- `duplicate_hold`, `season_hold`, `hold`, `rejected`
- 주방 냄새, 반려동물 체취, 지하주차장 습기처럼 문장군 문/중문 구매 이유와 인과가 약함
- 문/중문을 만능 해결책처럼 표현해야만 성립하는 소재
- 기존 최근 10개 원고의 `semantic_cluster`와 사실상 같은 이야기

## 단일 원천 전환 원칙

현재는 안전을 위해 브릿지 모드다.

- 기존 원천: `data/problems/PROBLEM_BANK.md`, `data/problems/PROBLEM_QUALITY_RULES.json`, `data/planning/TOPIC_EXPANSION_SEEDS.json`
- 브릿지 카탈로그: `data/topics/topics.json`
- 동기화 명령: `npm run topics:sync`

장기 목표는 `data/topics/topics.json`을 단일 원천으로 삼고, Markdown 문제은행은 사람이 읽는 출력물로 전환하는 것이다.
