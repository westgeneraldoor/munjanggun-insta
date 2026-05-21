# 작업지시서 #002 (Theme 7 콘텐츠 제작)
📅 발행: 2026-05-20 13:15
🤖 추천 모델: Gemini 3.5 Sonnet / Pro
⏱️ 예상 시간: ~15분

## 작업 내용
Theme 7 ("중문 시공, 이거 모르면 100% 후회")의 숏폼 및 캐러셀 콘텐츠 패키지를 제작하고, 관련 리소스 빌드 및 레지스트리 업데이트를 수행합니다.

### 1. 콘텐츠 폴더 생성
- `instagram/content/007_중문시공이거모르면후회/` 폴더를 생성합니다.

### 2. 숏폼 패키지 작성 (`shortform_package.md`)
- `instagram/content/007_중문시공이거모르면후회/shortform_package.md` 파일을 생성합니다.
- 구조는 `인스타엔진/SKILL.md` 저장 규칙의 표준을 따릅니다.
- 목적 태그: `SAVE`
- 내레이터(문장군) 1인칭 시점으로 작성합니다. (대화 핑퐁 금지, 10문장 이상 30초 이내)
- 3초 이내에 시선을 끄는 훅, 댐퍼/레일/천장보강 디테일의 중요성 설명, 1:1 무료실측 유도 CTA를 포함합니다.
- 씬 프롬프트 작성 시, 댐퍼/레일/시공결과물 등 제품 및 핵심 결과는 `[실사진 사용]`을 명시하고, 고민 상황 등 추상적인 부분은 AI 프롬프트(7대 필수요소 준수)로 작성합니다.
- 해시태그는 `INSTAGRAM_HASHTAG_BANK.md`에서 Theme 7용 세트를 복사하여 넣습니다.

### 3. 캐러셀 패키지 작성 (`carousel_package.md`)
- `instagram/content/007_중문시공이거모르면후회/carousel_package.md` 파일을 생성합니다.
- 디자인 테마는 `mocha-v2.3`을 타겟으로 합니다.
- 슬라이드는 총 6장으로 구성합니다:
  - P1: 커버 ("중문 시공,\n이거 모르면\n100% 후회", accentWord: "후회", badge: "체크리스트", sub: "모르면 나중에 돈 버립니다")
  - P2: 댐퍼 디테일 (포인트형)
  - P3: 하부 레일 디테일 (포인트형)
  - P4: 천장 보강 디테일 (포인트형)
  - P5: 계약 전 체크리스트 3가지 (체크리스트형)
  - P6: 무료 실측 유도 (CTA형, cta: "무료 실측 예약하기", highlightWord: "무료")
- `CAROUSEL_DATA` JSON을 `<!-- CAROUSEL_DATA_START -->` ~ `<!-- CAROUSEL_DATA_END -->` 내에 유효한 JSON 배열 형태로 작성합니다.

### 4. 렌더링 및 에셋 빌드
- 터미널에서 아래 명령을 실행합니다:
  ```bash
  python scripts/generate_tts.py 007
  node scripts/generate_carousel.js 007
  ```
- `shortform.wav`, `shortform.srt` 및 `slide_01.png` ~ `slide_06.png`가 해당 폴더 내에 오류 없이 정상 생성되었는지 확인합니다.

### 5. 레지스트리 및 컨텍스트 동기화
- `INSTAGRAM_POSTING_REGISTRY.md`에 `007` 행을 추가하고 "테마 로테이션 현황"의 테마 7 상태를 `✅`로 업데이트하고 "제작 콘텐츠 #"을 `007`로 업데이트합니다.
- `_context.md` 및 `PROJECT_TASKS.md` 내에 완료 현황을 업데이트합니다.

## 대상 파일
- `instagram/content/007_중문시공이거모르면후회/shortform_package.md` [NEW]
- `instagram/content/007_중문시공이거모르면후회/carousel_package.md` [NEW]
- `INSTAGRAM_POSTING_REGISTRY.md`
- `_context.md`
- `PROJECT_TASKS.md`

## 완료 기준
- [ ] 007 폴더 아래 숏폼 패키지, 캐러셀 패키지가 완벽히 작성될 것.
- [ ] generate_tts.py 007 및 generate_carousel.js 007이 성공적으로 실행되어 WAV, SRT, PNG 슬라이드들이 생성될 것.
- [ ] 포스팅 레지스트리에 007이 등록될 것.

---
## 작업 결과 (작업자가 작성)
- 수정 파일:
  - [shortform_package.md](file:///c:/Users/hjh/안티그래비티/문장군%20인스타그램/instagram/content/007_중문시공이거모르면후회/shortform_package.md) (신규)
  - [carousel_package.md](file:///c:/Users/hjh/안티그래비티/문장군%20인스타그램/instagram/content/007_중문시공이거모르면후회/carousel_package.md) (신규)
  - [INSTAGRAM_POSTING_REGISTRY.md](file:///c:/Users/hjh/안티그래비티/문장군%20인스타그램/INSTAGRAM_POSTING_REGISTRY.md)
  - [_context.md](file:///c:/Users/hjh/안티그래비티/문장군%20인스타그램/_context.md)
  - [PROJECT_TASKS.md](file:///c:/Users/hjh/안티그래비티/문장군%20인스타그램/PROJECT_TASKS.md)
- 변경 요약:
  - Theme 7 ("중문 시공, 이거 모르면 100% 후회")에 해당하는 숏폼 및 캐러셀 패키지를 신규 작성하고, 빌드 스크립트를 통해 오디오(WAV), 자막(SRT), 이미지(PNG) 에셋을 정상 생성했습니다.
  - 포스팅 레지스트리에 007 콘텐츠 발행 기록을 추가하고 테마 7의 완료 상태를 업데이트했습니다.
  - 프로젝트 태스크 현황과 컨텍스트 파일에 최근 완료된 태스크 및 다음 할 일(Theme 8 준비)을 반영했습니다.
- 자체 확인:
  - [x] generate_tts.py 실행 결과로 WAV(2360KB) 및 SRT(1299B) 정상 생성됨
  - [x] generate_carousel.js 실행 결과로 slide_01.png ~ slide_06.png (총 6장) 정상 생성됨
  - [x] 포스팅 레지스트리 및 컨텍스트 정상 매핑됨
