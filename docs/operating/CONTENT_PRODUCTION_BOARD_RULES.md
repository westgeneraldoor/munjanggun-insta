# 콘텐츠 제작 보드 규칙

과한 CMS는 쓰지 않는다. 대신 GitHub식 경량 운영으로 소재, 원고, 검수를 추적한다.

## 보드 컬럼

```text
Seed -> Review -> Ready -> Drafted -> Validated -> Used -> Hold/Rejected
```

| 컬럼 | 의미 | 이동 조건 |
|---|---|---|
| Seed | 후보 씨앗 | 아직 제작 금지 |
| Review | 승격 검토 | 브랜드/현실/중복 검토 시작 |
| Ready | 제작 가능 | Hook Score 7+, 상태 규칙 통과 |
| Drafted | MD 원고 작성 | 파일 생성 완료 |
| Validated | 검증 통과 | `npm run validate:file` 통과 후 `npm run qa:carousel -- --file ... --stage final` 통과 |
| Used | 문제 코드 사용 완료 | 레지스트리/품질규칙/스코어카드 기록 완료 |
| Hold/Rejected | 보류 또는 폐기 | 사유 기록 필수 |

## 라벨

| 라벨 | 의미 |
|---|---|
| `topic:seed` | 승격 전 후보 |
| `topic:review` | 검토 중 |
| `topic:ready` | 제작 가능 |
| `risk:duplicate` | 중복 위험 |
| `risk:brand-fit` | 브랜드 연결 약함 |
| `risk:reality-fit` | 현실 인과 약함 |
| `format:carousel-md` | MD/JSON 원고 |

## PR 체크 기준

- 신규 캐러셀은 `content/source/carousel/` 바로 아래 MD 파일 하나로 저장한다.
- 이미지, 이미지시트, HTML, 최종 카드 산출물을 만들지 않는다.
- 새 원고는 `CAROUSEL_SCORECARD_LOG.json`과 레지스트리에 연결한다.
- 보류/폐기한 소재는 `CONTENT_DECISION_LOG.md`에 이유를 남긴다.
- 신규 원고 검증은 전체 검증과 별도로 실행한다.
