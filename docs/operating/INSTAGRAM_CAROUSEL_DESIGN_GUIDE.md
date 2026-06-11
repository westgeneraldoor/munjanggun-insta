# 인스타그램 캐러셀 디자인 가이드 v2.3 (문장군) — 확정
> **발행:** 2026-05-15 → **v2.3 확정:** 2026-05-16
> **목적:** 압도적인 첫 페이지 훅(Hook)과 전환을 부르는 캐러셀 디자인 시스템.
> **레퍼런스:** 에디토리얼 잡지 스타일 + 모카 브라운 프리미엄 톤

---

## 1. 디자인 철학 (v2.3 핵심)

### 3대 원칙
1. **에디토리얼 잡지 스타일** — 좌측 정렬, 대형 타이포, 여백의 미
2. **상하 50:50 분할** — 상단 텍스트 / 하단 이미지 (콘텐츠 양과 무관하게 일관)
3. **모카 브라운 프리미엄 톤** — 인테리어 업종에 맞는 따뜻하고 고급스러운 컬러

### 슬라이드 유형별 구조
| 유형 | 레이아웃 | 핵심 |
|------|---------|------|
| **cover** | 다크 배경 + 하단 텍스트 | 3초 훅, 배지 + 대형 제목 |
| **point** | 상50% 텍스트 + 하50% 이미지 | 넘버 + 서브 + 제목 + 본문 |
| **compare** | 상68% 비교표 + 하32% 이미지 | 좌우 대비 컬럼 |
| **checklist** | 상50% 체크 + 하50% 이미지 | 아이콘 체크 아이템 |
| **cta** | 풀 텍스트 + 트러스트 배지 | 인용부호 + CTA 버튼 |

---

## 2. 컬러 시스템 (v2.3 확정 — 모카 브라운)

### 🎨 메인 팔레트
| 용도 | 색상명 | Hex | 사용처 |
|------|--------|-----|--------|
| **메인 액센트** | 모카 브라운 | `#8B7355` | 넘버, 배지, CTA버튼, 강조 |
| **액센트 소프트** | 모카 10% | `rgba(139,115,85,0.10)` | 강조 항목 배경 |
| **액센트 보더** | 모카 25% | `rgba(139,115,85,0.25)` | 강조 항목 테두리, 장식선 |
| **다크 (커버)** | 웜 다크 | `#1E1C18` | 커버 배경 |
| **골드 하이라이트** | 웜 골드 | `#D4B896` | 커버 강조 단어 |
| **텍스트 1차** | 차콜 | `#2A2622` | 제목, 주요 텍스트 |
| **텍스트 2차** | 다크 그레이 | `#4A4540` | 본문 텍스트 |
| **텍스트 보조** | 미디엄 | `#8B8680` | 서브타이틀, TIP |
| **텍스트 연한** | 라이트 | `#B5B0A8` | 페이지넘버, 코너마크 |
| **배경 1** | 크림 | `#F5F0E8` | 내부 슬라이드 상단 |
| **배경 2** | 딥 크림 | `#EDE8DD` | 내부 슬라이드 하단 (그라데이션) |

### ❌ 금지 컬러
- `#FF6B6B` (코랄 레드) → 모카 브라운으로 교체 완료
- 순수 검정 `#000000` → `#2A2622` 사용
- 순수 흰색 `#FFFFFF` → `#F5F0E8` 사용

---

## 3. 타이포그래피 시스템 (v2.3 확정)

### 폰트 패밀리
- **한글:** `Noto Sans KR` (weights: 400, 500, 700, 900)
- **영문/숫자:** `Montserrat` (weights: 600, 700, 900)

### 사이즈 테이블 (1080×1350px 기준)
| 요소 | 폰트 | 크기 | 굵기 | 비고 |
|------|------|------|------|------|
| **커버 제목** | Noto Sans KR | 58px | 900 | letter-spacing: -2px |
| **커버 배지** | Noto Sans KR | 22px | 900 | 필 배지 (border-radius: 100px) |
| **커버 서브** | Noto Sans KR | 24px | 500 | 투명도 60% |
| **포인트 넘버** | Montserrat | 52px | 900 | 모카 브라운 |
| **포인트 서브** | Noto Sans KR | 24px | 700 | 미디엄 그레이 |
| **포인트 제목** | Noto Sans KR | 72px | 900 | letter-spacing: -2px, 줄바꿈 OK |
| **포인트 본문** | Noto Sans KR | 30px | 500 | line-height: 1.65 |
| **비교 제목** | Noto Sans KR | 52px | 900 | 중앙 정렬 |
| **비교 라벨** | Noto Sans KR | 30px | 900 | 컬럼 라벨 |
| **비교 아이템** | Noto Sans KR | 24px | 500 | ✕/✓ prefix |
| **체크 제목** | Noto Sans KR | 56px | 900 | - |
| **체크 아이템** | Noto Sans KR | 28px | 600 | - |
| **CTA 제목** | Noto Sans KR | 56px | 900 | 하이라이트 단어 = 모카 |
| **CTA 본문** | Noto Sans KR | 26px | 500 | - |
| **CTA 버튼** | Noto Sans KR | 30px | 900 | 모카 배경 + 흰 텍스트 |
| **TIP 라벨** | Montserrat | 17px | 900 | 모카 컬러, letter-spacing: 2px |
| **TIP 텍스트** | Noto Sans KR | 21px | 500 | 미디엄 그레이 |
| **카테고리 태그** | Noto Sans KR | 16px | 700 | 모카 테두리 필 태그 |
| **코너마크** | Montserrat | 28px | 300 | 우상단 "+" |

---

## 4. 잡지풍 디테일 컴포넌트 (v2.3 신규)

모든 내부 슬라이드(cover 제외)에 공통 적용:

### 필수 컴포넌트
| 컴포넌트 | 위치 | 설명 |
|---------|------|------|
| **카테고리 필태그** | 텍스트 영역 최상단 | 시리즈명 표시 (예: "중문 가격 가이드"), 모카 보더 |
| **넘버 + 서브타이틀** | 카테고리 아래 | 큰 넘버(01) + 서브라벨 한 줄 |
| **장식 구분선** | 넘버↔제목 사이 | ● 도트 + ── 가로선 (mocha-border 색) |
| **디바이더** | 제목↔본문 사이 | 48px 굵은 선 (차콜) |
| **TIP 바** | 슬라이드 하단 고정 | "TIP \| 팁 텍스트" — 모든 내부 슬라이드 |
| **+ 코너마크** | 우상단 | 잡지 크롭마크 느낌, 투명도 50% |
| **좌측 액센트 바** | 좌측 가장자리 (point만) | 5px 모카 세로선 |

### 커버 전용 컴포넌트
| 컴포넌트 | 위치 | 설명 |
|---------|------|------|
| **그라데이션 오버레이** | 전체 | 상단 투명→하단 95% 다크 |
| **세로 장식선** | 좌측 (72px) | 미세한 흰색 세로선 |
| **배지** | 제목 위 | 모카 배경 필 배지 |
| **SWIPE 안내** | 우하단 | "SWIPE ──────→" |
| **브랜드 마크** | 좌하단 | "문장군 MUNJANGGUN" |

---

## 5. 레이아웃 규격

### 여백 (Padding)
- **커버:** 좌우 72px, 상단 56px, 하단 48px
- **내부 슬라이드:** 좌우 80px, 상단 64px
- **비교 슬라이드:** 좌우 64px (컬럼이라 좀 더 좁게)

### 이미지 슬롯
- **point/checklist:** 하단 50% (border-top: 2.5px dashed, 3% 어두운 배경)
- **compare:** 하단 32%
- **인디케이터:** 좌상단 40px 원형 배지 (✕=차콜, ✓=모카)
- **슬롯 안내:** 📷 아이콘 + 설명 텍스트 (투명도 15%)

### 이미지 슬롯 가이드
> 사진은 총괄이 직접 삽입합니다.
> 엔진은 플레이스홀더와 사진 설명 �| 2026-05-16 | **v2.3 확정** | 잡지풍 디테일(코너마크/필태그/장식선), 여백 확대, 세로 워터마크 제거 |
| 2026-05-18 | v2.4 | 디자인 토큰 분리 (`CAROUSEL_TOKENS.json`), JS 하드코딩 제거 |
| 2026-05-18 | **v2.5 확정** | 완전 데이터 주도 렌더러 — `number`/`sub` 전 슬라이드 필수화, JSON 배열 형식 확정 |
| 2026-05-21 | **v3.0 전환** | CSS 변수 내장 단일 HTML 방식으로 전환. JSON+puppeteer 레거시화. 섹션 13 신설. |

---

## 11. 디자인 구현 방식 (v3.0 전환)

> **v2.5 이전:** `CAROUSEL_TOKENS.json` + `generate_carousel.js` (puppeteer) 기반 PNG 렌더링
> **v3.0 이후 (현행):** CSS 변수 내장 단일 HTML 파일 직접 작성

### 왜 전환했나?
| 항목 | 기존 (JSON+puppeteer) | 현행 (HTML 직접) |
|------|----------------------|------------------|
| 의존성 | Node.js + puppeteer 필수 | 브라우저만 있으면 됨 |
| 프리뷰 | 스크립트 실행 후 PNG 확인 | HTML 더블클릭으로 즉시 확인 |
| 스타일링 | inline style (유지보수 어려움) | CSS 클래스 기반 (재사용 용이) |
| 캡션 | 별도 파일에 텍스트로 존재 | 7번째 슬라이드에 복사 카드 UI 내장 |
| 협업 | PNG 전달 → 수정 불가 | HTML 공유 → 내용 수정 가능 |

### CSS 디자인 토큰 (HTML `<style>` 내 `:root`에 선언)
```css
:root {
  /* ── 컬러 ── */
  --accent: #8B7355;            /* 모카 브라운 (버튼, 숫자, TIP, 태그) */
  --accent-soft: rgba(139,115,85,0.10);  /* 모카 틴트 (배경) */
  --mocha-border: rgba(139,115,85,0.25); /* 테두리, 장식선 */
  --mocha-dark: #6B5840;        /* 다크 모카 */
  --mocha-shadow: rgba(139,115,85,0.25); /* 그림자 */
  --gold: #D4B896;              /* 커버 강조 단어 */
  --dk-cover: #1E1C18;          /* 커버 배경 (웜 다크) */
  --dk: #2A2622;                /* 차콜 */
  --tx: #2A2622;                /* 제목 텍스트 */
  --tx2: #4A4540;               /* 본문 텍스트 */
  --txm: #8B8680;               /* 보조 텍스트 */
  --txl: #B5B0A8;               /* 연한 텍스트 */
  --cream: #F5F0E8;             /* 내부 배경 상단 */
  --cream2: #EDE8DD;            /* 내부 배경 하단 */

  /* ── 폰트 ── */
  --font-kr: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  --font-en: 'Montserrat', sans-serif;

  /* ── 캔버스 ── */
  --canvas-w: 1080px;
  --canvas-h: 1350px;
}
```

### ⚠️ 레거시 파일 (더 이상 사용하지 않음)
| 파일 | 역할 | 상태 |
|------|------|------|
| `CAROUSEL_TOKENS.json` | 디자인 수치 JSON | ❌ 레거시 — CSS 변수로 대체 |
| `scripts/generate_carousel.js` | puppeteer PNG 렌더러 | ❌ 레거시 — HTML 직접 작성으로 대체 |

> 기존 001~012 PDF 산출물은 그대로 보존. 신규 캐러셀만 HTML 방식 적용.

---

## 12. ~~JSON 스키마 명세~~ (레거시 — v2.5 이전)

> ⚠️ **이 섹션은 v2.5 이전 `generate_carousel.js` 기반 파이프라인의 레퍼런스입니다.**
> v3.0부터는 JSON이 아닌 **HTML을 직접 작성**합니다.
> 새 캐러셀 제작 시에는 섹션 13의 HTML 템플릿 구조를 따르세요.

<details>
<summary>레거시 JSON 스키마 (접기)</summary>

기존 `carousel_package.md` 안의 CAROUSEL_DATA JSON 필드 레퍼런스.
배열 형식(`[{...}, {...}]`)으로 시작하며, `cover`, `point`, `compare`, `checklist`, `cta` 타입을 지원했음.
상세 필드는 이전 버전의 이 문서 참조.

</details>

---

## 13. HTML 템플릿 표준 구조 (v3.0 — 현행)

> **레퍼런스 파일:** `templates/html-legacy/CAROUSEL_HTML_TEMPLATE.html`
> **실제 예시:** `content/published/html-legacy/003_체리색방문의환생.html`

### 파일 구조
```
단일 HTML 파일 (NNN_테마명.html)
├── <head>
│   ├── Google Fonts 링크 (Montserrat + Noto Sans KR)
│   └── <style> — CSS 디자인 토큰 + 모든 컴포넌트 클래스
├── <body>
│   ├── SLIDE 1 / 7 — COVER (다크 배경, 훅 제목)
│   ├── SLIDE 2 / 7 — POINT (텍스트 50% + 이미지 50%)
│   ├── SLIDE 3 / 7 — POINT (텍스트 50% + 이미지 50%)
│   ├── SLIDE 4 / 7 — COMPARE (비교표 + 이미지 32%)
│   ├── SLIDE 5 / 7 — CHECKLIST (체크리스트 + 이미지 50%)
│   ├── SLIDE 6 / 7 — CTA (전환 유도 + 트러스트 배지)
│   └── SLIDE 7 / 7 — 캡션 복사 카드 (본문+해시태그 복사 UI)
└── <script> — copyCaption() 함수 + toast 알림
```

### 슬라이드별 CSS 클래스 매핑

| 슬라이드 유형 | 루트 클래스 | 핵심 내부 클래스 |
|-------------|-----------|----------------|
| **cover** | `.slide-cover` | `.cover-badge`, `.cover-hook`, `.cover-sub`, `.cover-brand`, `.cover-swipe` |
| **point** | `.slide-inner` | `.text-area`, `.category-tag`, `.num-row`, `.num`, `.sub`, `.deco-line`, `.slide-title`, `.divider`, `.slide-body` |
| **compare** | `.slide-inner` | `.compare-area`, `.compare-cols`, `.compare-col.left`, `.compare-col.right`, `.compare-label`, `.compare-item`, `.compare-verdict` |
| **checklist** | `.slide-inner` | `.check-items`, `.check-item`, `.check-icon` |
| **cta** | `.slide-cta` | `.cta-quote`, `.cta-title`, `.cta-body`, `.cta-button`, `.trust-badges`, `.trust-badge` |
| **caption card** | `.slide-caption-card` | `.caption-text-area`, `.caption-copy-btn`, `.toast` |

### 공통 컴포넌트
| 컴포넌트 | 클래스 | 적용 범위 |
|---------|--------|----------|
| 슬라이드 기본 | `.slide` | 모든 슬라이드 (1080×1350) |
| 좌측 액센트 바 | `.slide-inner::before` | 내부 슬라이드 (cover/cta 제외) |
| 코너마크 (+) | `.corner-mark` | 내부 슬라이드 |
| 이미지 플레이스홀더 | `.image-slot` | point/compare/checklist |
| 인디케이터 | `.indicator.check` / `.indicator.x` | 이미지 슬롯 좌상단 |
| TIP 바 | `.tip-bar` | 내부 슬라이드 하단 |
| 슬라이드 라벨 | `.slide-label` | 모든 슬라이드 위 (프리뷰용) |

### 이미지 슬롯 규칙
- 실사진 삽입 전까지 📷 아이콘 + 설명 텍스트로 플레이스홀더 표시
- `.image-slot` — 기본 50% 높이 (point/checklist)
- `.image-slot.short` — 32% 높이 (compare)
- 실사진 삽입 시: `background-image: url(...)` + `background-size: cover` 적용

### 7번째 슬라이드 (캡션 복사 카드) 필수 구조
```html
<div class="slide slide-caption-card">
  <div class="caption-card-header">📋 본문 캡션 (복사해서 인스타에 붙여넣기)</div>
  <div class="caption-text-area" id="captionText">
    <!-- 캡션 본문 + 해시태그 -->
  </div>
  <button class="caption-copy-btn" onclick="copyCaption()">📋 캡션 복사하기</button>
</div>
<div class="toast" id="toast">✅ 캡션이 복사되었습니다!</div>
```

### 반응형 (미리보기용)
```css
@media (max-width: 1100px) {
  .slide { width: 540px; height: 675px; }
}
```

### 제작 흐름
1. `templates/html-legacy/CAROUSEL_HTML_TEMPLATE.html`을 복사
2. 테마에 맞게 슬라이드 내용 채우기 (텍스트, 이미지 설명)
3. 7번째 슬라이드에 캡션+해시태그 삽입
4. 브라우저에서 열어 프리뷰 확인
5. `content/published/html-legacy/NNN_테마명.html`로 저장�️ JSON 형식 규칙

```
[  ← 배열로 시작 (객체 X. {"theme":"light","slides":[...]} 형식 사용 금지)
  { "type": "cover", ... },
  { "type": "point", ... },
  ...
]
```

---

### 공통 필드

| 필드 | 타입 | `cover` | 그 외 | 설명 |
|------|------|:-------:|:-----:|------|
| `type` | string | ✅ | ✅ | `cover` `point` `compare` `checklist` `cta` |
| `number` | string | ❌ (없음) | ✅ **필수** | 슬라이드 번호. `"01"` `"02"` 형식. 커버 제외 순차 부여 |
| `sub` | string | ❌ (없음) | ✅ **필수** | 번호 옆 소제목. 예: `"시공 시간"`, `"거주 중 시공 비교"` |
| `category` | string | — | 권장 | 상단 필태그 텍스트. 예: `"거주 중 시공"` |
| `imageDesc` | string | — | 권장 | 이미지 슬롯 설명 (실사진 촬영 지시 포함) |
| `indicator` | string\|null | — | — | 이미지 위 아이콘: `"check"` (✓) / `"x"` (✕) / `null` |
| `tip` | string | — | 권장 | 슬라이드 하단 TIP 바 텍스트 |

> ★ `number`가 JSON에 없으면 JS가 순차 자동 부여하지만, **항상 명시적으로 작성할 것.**

---

### `cover` 필드

| 필드 | 필수 | 설명 |
|------|:----:|------|
| `hook` | ✅ | 메인 제목. `\n`으로 줄바꿈 |
| `accentWord` | — | hook 안에서 골드(`#D4B896`)로 강조할 단어 (1개만) |
| `badge` | — | 제목 위 모카 배지. 예: `"거주 중 시공"` |
| `sub` | — | 제목 아래 서브카피 |

---

### `point` 필드

| 필드 | 필수 | 설명 |
|------|:----:|------|
| `number` | ✅ | 공통 참조 |
| `sub` | ✅ | 공통 참조 |
| `category` | 권장 | 공통 참조 |
| `title` | ✅ | 메인 제목. `\n`으로 줄바꿈 |
| `body` | ✅ | 본문 텍스트. `\n`으로 줄바꿈 |
| `imageDesc` | 권장 | 공통 참조 |
| `indicator` | — | 공통 참조 |
| `tip` | 권장 | 공통 참조 |

---

### `compare` 필드

| 필드 | 필수 | 설명 |
|------|:----:|------|
| `number` | ✅ | 공통 참조 |
| `sub` | ✅ | 비교 소제목. 예: `"거주 중 시공 비교"` |
| `category` | 권장 | 공통 참조 |
| `title` | ✅ | 비교 섹션 메인 제목 |
| `leftLabel` | ✅ | 왼쪽 컬럼 레이블 (비교 대상) |
| `leftItems` | ✅ | 왼쪽 항목 배열 (✕ 자동 표시) |
| `rightLabel` | ✅ | 오른쪽 컬럼 레이블 (문장군) |
| `rightItems` | ✅ | 오른쪽 항목 배열 (✓ 자동 표시) |
| `verdict` | 권장 | 비교 결론 (모카 컬러, `→` 자동 앞에 붙음) |
| `imageDesc` | 권장 | 공통 참조 |
| `tip` | 권장 | 공통 참조 |

---

### `checklist` 필드

| 필드 | 필수 | 설명 |
|------|:----:|------|
| `number` | ✅ | 공통 참조 |
| `sub` | ✅ | 체크리스트 소제목. 예: `"준비사항"` |
| `category` | 권장 | 공통 참조 |
| `title` | ✅ | 체크리스트 제목. `\n`으로 줄바꿈 |
| `items` | ✅ | 체크 항목 배열. 첫 번째 항목 모카 강조 |
| `imageDesc` | 권장 | 공통 참조 |
| `indicator` | — | 공통 참조 (기본값 `"check"`) |
| `tip` | 권장 | 공통 참조 |

---

### `cta` 필드

| 필드 | 필수 | 설명 |
|------|:----:|------|
| `number` | ✅ | 공통 참조 |
| `sub` | ✅ | CTA 소제목. 예: `"무료 실측"` |
| `title` | ✅ | CTA 메인 제목. `\n`으로 줄바꿈 |
| `highlightWord` | — | 제목에서 모카 컬러로 강조할 단어 |
| `body` | ✅ | 서브 텍스트 |
| `cta` | ✅ | 버튼 문구. 예: `"무료 실측 예약하기"` |

> ✅ CTA 슬라이드에는 신뢰 배지(실측 기반 / 공간 맞춤 / 1:1 상담)가 **자동 배치**됨.  
> ⚠️ `summary` 타입 사용 금지 — 자동으로 `point`로 렌더링됨.

---

### 완성 JSON 예시 (005_살면서시공)

```json
[
  {
    "type":        "cover",
    "hook":        "살면서\n중문 시공\n3시간이면 끝",
    "accentWord":  "3시간",
    "badge":       "거주 중 시공",
    "sub":         "짐 뺄 필요 없습니다"
  },
  {
    "type":        "point",
    "number":      "01",
    "sub":         "시공 시간",
    "category":    "거주 중 시공",
    "title":       "현관 중문,\n단 3시간 완성",
    "body":        "아침에 아이 등원시키고,\n점심 먹고 오면 끝납니다.",
    "imageDesc":   "중문 설치 완료 현장 — 깔끔하게 마무리된 현관 실사진",
    "indicator":   null,
    "tip":         "방문 교체는 1짝당 단 30분이면 충분합니다."
  },
  {
    "type":        "compare",
    "number":      "02",
    "sub":         "거주 중 시공 비교",
    "category":    "거주 중 시공",
    "title":       "이것이\n차이입니다",
    "leftLabel":   "일반 인테리어",
    "leftItems":   ["모든 짐을 비워야 함", "며칠씩 걸리는 소음"],
    "rightLabel":  "문장군",
    "rightItems":  ["현관 주변 잔짐만 치우기", "단 3시간 만에 완성"],
    "verdict":     "거주 중 시공은 속도와 깔끔함이 생명입니다.",
    "imageDesc":   "시공 전후 비교 실사진",
    "tip":         "시공 중 먼지 최소화, 바닥 보호재 사용"
  },
  {
    "type":        "checklist",
    "number":      "03",
    "sub":         "준비사항",
    "category":    "거주 중 시공",
    "title":       "시공 전\n이것만\n치우면 됩니다",
    "items":       ["현관 신발장 위 잡동사니", "문 바로 앞 짐 50cm 이내", "나머지는 그대로 두셔도 됩니다"],
    "imageDesc":   "시공 준비 완료된 현관 실사진",
    "indicator":   "check",
    "tip":         "반려동물은 잠시 방에 격리 권장"
  },
  {
    "type":          "cta",
    "number":        "04",
    "sub":           "무료 실측",
    "title":         "안 하셔도\n실측은 전면\n무료입니다",
    "highlightWord": "무료",
    "body":          "담당 매니저가 샘플북을 들고\n직접 방문해 꼼꼼히 진단해 드립니다.",
    "cta":           "무료 실측 예약하기"
  }
]
```

