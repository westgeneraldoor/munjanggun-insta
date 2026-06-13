## 변경 범위

- [ ] 캐러셀 MD 원고
- [ ] 토픽/문제은행/품질 규칙
- [ ] 레지스트리/스코어카드/의사결정 로그
- [ ] 운영 문서/검증 스크립트

## MD-only 확인

- [ ] 신규 HTML을 만들지 않았다.
- [ ] 이미지 생성, 이미지시트, 최종 카드 산출물을 만들지 않았다.
- [ ] 신규 원고는 `content/source/carousel/` 바로 아래 MD 파일이다.

## 소재 게이트

- [ ] `ready` 상태 또는 명시 승인된 소재다.
- [ ] `used` + `reuse_allowed=false` 소재를 재사용하지 않았다.
- [ ] 최근 10개 `semantic_cluster`와 중복되지 않는다.
- [ ] 폐기 골든셋과 같은 인과 오류가 없다.

## 검증

```bash
npm run topics:sync
npm run validate:since -- 045
npm run status
```

## 리뷰 메모

- Hook Power:
- Saveability:
- Shareability:
- DM Intent:
- Brand Fit:
