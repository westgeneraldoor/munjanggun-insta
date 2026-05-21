#!/usr/bin/env node
/**
 * validate_carousel.js — 문장군 캐러셀 HTML 규격 검사기
 * 
 * v3.0 표준 HTML 캐러셀이 문장군 디자인 규격을 준수하는지 검증합니다.
 * 
 * 사용법:
 *   node scripts/validate_carousel.js <html-file>
 *   node scripts/validate_carousel.js instagram/content/013_우리집중문선택가이드.html
 * 
 * 검증 항목 (13개):
 *   1. 파일 확장자 .html
 *   2. slide 클래스 6~7개 (HTML 마크업 한정)
 *   3. cover slide 존재
 *   4. CTA slide 존재
 *   5. 마지막 slide가 caption card
 *   6. 이미지 슬롯 최소 1개
 *   7. 폰트 import 존재 (Noto Sans KR / Montserrat)
 *   8. copyCaption() 함수 존재
 *   9. 1080×1350 비율 설정
 *  10. CSS 변수 (--mocha-accent 등) 사용
 *  11. 해시태그 블록 존재
 *  12. 캡션 복사 카드 UI 존재
 *  13. 카테고리 뱃지 존재
 */

const fs = require('fs');
const path = require('path');

const CHECKS = [
  {
    id: 1,
    name: '파일 확장자',
    desc: '.html 파일이어야 합니다',
    check: (filePath, _body, _full) => path.extname(filePath).toLowerCase() === '.html',
  },
  {
    id: 2,
    name: '슬라이드 개수',
    desc: 'slide 클래스를 가진 HTML 요소가 6~7개여야 합니다',
    check: (_filePath, body, _full) => {
      // class="내용" 속성을 추출하고 공백으로 쪼개서 정확히 'slide' 토큰을 가진 개수를 셉니다.
      const classAttrRegex = /class=["']([^"']*)["']/g;
      let count = 0;
      let match;
      while ((match = classAttrRegex.exec(body)) !== null) {
        const classes = match[1].split(/\s+/);
        if (classes.includes('slide')) {
          count++;
        }
      }
      return { pass: count >= 6 && count <= 7, detail: `${count}개 발견` };
    },
  },
  {
    id: 3,
    name: 'COVER 슬라이드',
    desc: 'cover 타입 슬라이드가 body에 존재해야 합니다',
    check: (_filePath, body, _full) => {
      const classAttrRegex = /class=["']([^"']*)["']/g;
      let hasCover = false;
      let match;
      while ((match = classAttrRegex.exec(body)) !== null) {
        const classes = match[1].split(/\s+/);
        if (classes.includes('cover') || classes.some(c => c.startsWith('slide-cover'))) {
          hasCover = true;
          break;
        }
      }
      return hasCover;
    },
  },
  {
    id: 4,
    name: 'CTA 슬라이드',
    desc: 'CTA 타입 슬라이드가 body에 존재해야 합니다',
    check: (_filePath, body, _full) => {
      const classAttrRegex = /class=["']([^"']*)["']/g;
      let hasCta = false;
      let match;
      while ((match = classAttrRegex.exec(body)) !== null) {
        const classes = match[1].split(/\s+/);
        if (classes.includes('cta') || classes.some(c => c.startsWith('slide-cta')) || classes.includes('slide-cta')) {
          hasCta = true;
          break;
        }
      }
      return hasCta;
    },
  },
  {
    id: 5,
    name: '마지막 슬라이드 = 캡션 카드',
    desc: '마지막 slide가 caption card여야 합니다',
    check: (_filePath, body, _full) => {
      // 1. 모든 div 블록 중 class에 slide가 들어간 블록들을 찾아내거나, 구조가 단순하므로 slide 클래스 요소 안의 텍스트로 판정
      // body 내에서 class="slide"인 최상위 요소의 대략적인 개수를 먼저 파악
      const slideStartIndices = [];
      const classAttrRegex = /class=["']([^"']*)["']/g;
      let match;
      
      // body에서 class="slide" 요소를 찾아서 그 시작점 위치를 기록
      const regex = /<div[^>]*class=["']([^"']*)["']/g;
      while ((match = regex.exec(body)) !== null) {
        const classes = match[1].split(/\s+/);
        if (classes.includes('slide')) {
          slideStartIndices.push(match.index);
        }
      }

      if (slideStartIndices.length === 0) return { pass: false, detail: '슬라이드 요소를 찾을 수 없음' };
      
      // 마지막 슬라이드 시작점부터 끝까지 자름
      const lastSlideStart = slideStartIndices[slideStartIndices.length - 1];
      const lastSlideContent = body.substring(lastSlideStart);
      const isCaptionCard = /caption|캡션|clipboard|copy|slide-caption-card/i.test(lastSlideContent);
      return { pass: isCaptionCard, detail: isCaptionCard ? '캡션 카드 확인' : '마지막 슬라이드에 캡션 카드 없음' };
    },
  },
  {
    id: 6,
    name: '이미지 슬롯',
    desc: '이미지 슬롯(컨테이너 또는 img 태그)이 최소 1개 있어야 합니다',
    check: (_filePath, body, _full) => {
      const imgTags = (body.match(/<img[\s\S]*?>/g) || []).length;
      const bgImages = (body.match(/background-image/g) || []).length;
      const imageSlots = (body.match(/image-slot/g) || []).length;
      const total = imgTags + bgImages + imageSlots;
      return { pass: total >= 1, detail: `img: ${imgTags}, background-image: ${bgImages}, image-slot 클래스: ${imageSlots}` };
    },
  },
  {
    id: 7,
    name: '폰트 임포트',
    desc: 'Noto Sans KR 또는 Montserrat 폰트가 임포트되어야 합니다',
    check: (_filePath, _body, full) => {
      const hasNoto = /Noto\+Sans\+KR|Noto Sans KR|noto-sans-kr/i.test(full);
      const hasMontserrat = /Montserrat/i.test(full);
      return { pass: hasNoto || hasMontserrat, detail: `Noto: ${hasNoto}, Montserrat: ${hasMontserrat}` };
    },
  },
  {
    id: 8,
    name: 'copyCaption() 함수',
    desc: '캡션 복사 함수가 존재해야 합니다',
    check: (_filePath, _body, full) => /copyCaption|navigator\.clipboard|copy.*caption/i.test(full),
  },
  {
    id: 9,
    name: '1080×1350 비율',
    desc: '1080×1350 뷰포트/사이즈 설정이 있어야 합니다',
    check: (_filePath, _body, full) => {
      const has1080 = /1080/g.test(full);
      const has1350 = /1350/g.test(full);
      return { pass: has1080 && has1350, detail: `1080: ${has1080}, 1350: ${has1350}` };
    },
  },
  {
    id: 10,
    name: 'CSS 변수 (모카 토큰)',
    desc: '--mocha-accent 또는 브랜드 컬러 CSS 변수가 사용되어야 합니다',
    check: (_filePath, _body, full) => {
      const cssVars = (full.match(/--[a-z][a-z0-9-]*/g) || []);
      const hasMocha = cssVars.some(v => /mocha|accent|cream|mocha-v/i.test(v)) || full.includes('--accent') || full.includes('--cream');
      return { pass: hasMocha, detail: `CSS 변수 ${cssVars.length}개, 모카 토큰: ${hasMocha}` };
    },
  },
  {
    id: 11,
    name: '해시태그 블록',
    desc: '해시태그 영역이 존재해야 합니다',
    check: (_filePath, body, _full) => {
      const hasHashtags = /#문장군|#중문|hashtag|해시태그/i.test(body);
      return { pass: hasHashtags, detail: hasHashtags ? '해시태그 발견' : '해시태그 없음' };
    },
  },
  {
    id: 12,
    name: '캡션 복사 카드 UI',
    desc: '캡션 복사 카드 UI 요소가 존재해야 합니다',
    check: (_filePath, body, _full) => /caption-card|caption-copy|캡션.*복사|복사.*버튼/i.test(body),
  },
  {
    id: 13,
    name: '카테고리 뱃지',
    desc: '카테고리/시리즈 뱃지가 존재해야 합니다',
    check: (_filePath, body, _full) => /category|카테고리|badge|뱃지|시리즈/i.test(body),
  },
];

function validate(filePath) {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${absolutePath}`);
    process.exit(1);
  }

  const fullContent = fs.readFileSync(absolutePath, 'utf-8');
  const fileName = path.basename(absolutePath);

  // body 태그 내의 내용만 추출하여 style 태그 내부의 클래스 선택자 혼선을 제거
  let bodyContent = fullContent;
  const bodyMatch = fullContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
  }

  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  문장군 캐러셀 규격 검사기 v1.1        ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`\n📄 대상: ${fileName}`);
  console.log(`${'─'.repeat(50)}`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const check of CHECKS) {
    const result = check.check(filePath, bodyContent, fullContent);
    const pass = typeof result === 'object' ? result.pass : result;
    const detail = typeof result === 'object' ? result.detail : '';

    if (pass) {
      console.log(`  ✅ [${String(check.id).padStart(2, '0')}] ${check.name}${detail ? ` — ${detail}` : ''}`);
      passed++;
    } else {
      console.log(`  ❌ [${String(check.id).padStart(2, '0')}] ${check.name}${detail ? ` — ${detail}` : ''}`);
      console.log(`       → ${check.desc}`);
      failures.push(check);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  결과: ${passed}/${CHECKS.length} PASS | ${failed} FAIL`);
  
  if (failed === 0) {
    console.log(`\n  🎉 PASS — 문장군 캐러셀 규격 준수`);
  } else {
    console.log(`\n  ⚠️  FAIL — ${failed}개 항목 미준수`);
    console.log(`  수정 필요:`);
    failures.forEach(f => console.log(`    - [${String(f.id).padStart(2, '0')}] ${f.name}: ${f.desc}`));
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('사용법: node scripts/validate_carousel.js <html-file>');
  console.log('예시:   node scripts/validate_carousel.js instagram/content/013_우리집중문선택가이드.html');
  process.exit(0);
}

validate(args[0]);
