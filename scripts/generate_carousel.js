#!/usr/bin/env node
/**
 * generate_carousel.js v2.5 — 문장군 캐러셀 생성 엔진
 * ★ 완전한 데이터 주도 렌더러 (Zero Hardcoding)
 *   - 모든 디자인 수치:  CAROUSEL_TOKENS.json → tokens / typography / layout
 *   - 모든 브랜드 텍스트: CAROUSEL_TOKENS.json → brand
 *   - 모든 슬라이드 내용: carousel_package.md → CAROUSEL_DATA JSON
 *   - JS는 오직 렌더링만 담당. 어떤 내용도 스스로 결정하지 않는다.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ── 토큰 파일 로드 ──
const tokensPath = path.join(__dirname, '..', 'CAROUSEL_TOKENS.json');
if (!fs.existsSync(tokensPath)) {
  console.error('[ERROR] CAROUSEL_TOKENS.json not found.');
  process.exit(1);
}
const tokenFile  = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
const T          = tokenFile.tokens;            // 색상 토큰
const TY         = tokenFile.typography || {};  // 타이포 토큰
const L          = tokenFile.layout    || {};   // 레이아웃 토큰
const B          = tokenFile.brand     || {};   // 브랜드 상수

const WIDTH  = L.canvasWidth  || 1080;
const HEIGHT = L.canvasHeight || 1350;
const PAD    = L.paddingH     || 80;
const PAD_C  = L.paddingHCover|| 72;

console.log(`[THEME] ${tokenFile._meta.name} (v${tokenFile._meta.version})`);

const SLIDE_BG = `linear-gradient(180deg,${T.cream},${T.cream2})`;
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Montserrat:wght@300;600;700;900&display=swap" rel="stylesheet">`;

// ── carousel_package.md 찾기 ──
function findPackage(arg) {
  if (fs.existsSync(arg)) return path.resolve(arg);
  const instaDir = path.join(__dirname, '..', 'instagram', 'content');
  if (fs.existsSync(instaDir)) {
    const dirs = fs.readdirSync(instaDir).filter(d => d.startsWith(arg + '_'));
    for (const dir of dirs) {
      const c = path.join(instaDir, dir, 'carousel_package.md');
      if (fs.existsSync(c)) return c;
    }
  }
  return null;
}

// ── CAROUSEL_DATA JSON 파싱 ──
function parseCarouselData(content) {
  const match = content.match(/<!--\s*CAROUSEL_DATA_START\s*-->\s*\n([\s\S]*?)\n\s*<!--\s*CAROUSEL_DATA_END\s*-->/);
  if (!match) { console.error('[ERROR] CAROUSEL_DATA markers not found'); process.exit(1); }
  try { return JSON.parse(match[1]); }
  catch (e) { console.error('[ERROR] JSON parse failed:', e.message); process.exit(1); }
}

// ── 슬라이드 번호 자동 부여 (커버 제외, JSON number 우선) ──
function assignNumbers(slides) {
  let n = 0;
  return slides.map(slide => {
    if (slide.type === 'cover') return slide;
    n++;
    return {
      ...slide,
      number: slide.number || String(n).padStart(2, '0'),
      sub:    slide.sub    || '',
    };
  });
}

// ══════════════════════════════════════
// SHARED COMPONENTS (모두 토큰/데이터 기반)
// ══════════════════════════════════════

const cornerMark = () =>
  `<div style="position:absolute;top:40px;right:56px;font-size:${L.cornerMarkSize||'28px'};font-weight:300;color:${T.txl};font-family:'Montserrat',sans-serif;letter-spacing:2px;opacity:.5;">+</div>`;

const categoryTag = (label) =>
  `<div style="display:inline-block;font-size:16px;font-weight:700;color:${T.accent};letter-spacing:1px;border:1.5px solid ${T.mochaBorder};padding:5px 16px;border-radius:100px;margin-bottom:16px;">${label}</div>`;

const numLabel = (num, sub) =>
  `<div style="display:flex;align-items:baseline;gap:14px;margin-bottom:0px;">
    <span style="font-family:'Montserrat',sans-serif;font-size:${TY.sizeNum||'52px'};font-weight:${TY.weightBlack||'900'};color:${T.accent};letter-spacing:2px;line-height:1;">${num}</span>
    <span style="font-size:24px;font-weight:${TY.weightBold||'700'};color:${T.txm};letter-spacing:.5px;">${sub}</span>
  </div>`;

const hdeco = () =>
  `<div style="display:flex;align-items:center;gap:12px;margin:16px 0 8px;">
    <div style="width:6px;height:6px;border-radius:50%;background:${T.accent};"></div>
    <div style="flex:1;height:1px;background:${T.mochaBorder};"></div>
  </div>`;

const divider = () =>
  `<div style="width:48px;height:3px;background:${T.dk};border-radius:2px;margin:24px 0 28px;"></div>`;

const tipBar = (text) =>
  `<div style="position:absolute;bottom:${L.tipBarBottom||'32px'};left:${PAD}px;right:${PAD}px;display:flex;align-items:center;gap:14px;padding-top:14px;border-top:1.5px solid rgba(0,0,0,.06);">
    <span style="font-family:'Montserrat',sans-serif;font-size:17px;font-weight:900;color:${T.accent};letter-spacing:2px;">${B.tipLabel||'TIP'}</span>
    <span style="color:${T.txl};">|</span>
    <span style="font-size:21px;font-weight:500;color:${T.txm};flex:1;">${text}</span>
  </div>`;

const brandMark = (onDark) => {
  const c = onDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.2)';
  return `<div style="display:flex;align-items:center;gap:10px;">
    <span style="font-size:18px;font-weight:900;color:${c};letter-spacing:2px;">${B.name||'문장군'}</span>
    <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:700;color:${c};letter-spacing:2px;opacity:.7;">${B.nameEn||'MUNJANGGUN'}</span>
  </div>`;
};

const imageSlot = (desc, heightPct = '50%', indicatorType = null) => {
  const defDesc = B.defaultImageDesc || '시공 현장 사진';
  let ind = '';
  if (indicatorType === 'x')
    ind = `<div style="position:absolute;top:16px;left:16px;width:40px;height:40px;border-radius:50%;background:${T.dk};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);">✕</div>`;
  else if (indicatorType === 'check')
    ind = `<div style="position:absolute;top:16px;left:16px;width:40px;height:40px;border-radius:50%;background:${T.accent};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);">✓</div>`;
  return `<div style="position:absolute;left:0;right:0;bottom:0;height:${heightPct};display:flex;align-items:center;justify-content:center;border-top:2.5px dashed rgba(0,0,0,.08);background:rgba(0,0,0,.02);overflow:hidden;">
    ${ind}
    <div style="text-align:center;color:rgba(0,0,0,.15);">
      <div style="font-size:44px;margin-bottom:10px;">📷</div>
      <div style="font-size:16px;line-height:1.6;padding:0 60px;">${desc || defDesc}</div>
    </div>
  </div>`;
};

const trustBadges = () => {
  // 브랜드 신뢰 배지 — 항상 CTA에 고정 (문장군 브랜드 규칙)
  const items = B.trustBadges || [
    { icon: '✎', label: '실측 기반', desc: '정확한 상담' },
    { icon: '✓', label: '공간 맞춤', desc: '맞춤 제안'  },
    { icon: '♡', label: '부담 없는', desc: '1:1 상담'   },
  ];
  return `<div style="display:flex;gap:14px;width:100%;margin-top:32px;">
    ${items.map(b => `<div style="flex:1;text-align:center;padding:22px 12px;background:rgba(0,0,0,.03);border-radius:16px;">
      <div style="width:52px;height:52px;border-radius:50%;border:2px solid ${T.accent};display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:20px;color:${T.accent};">${b.icon}</div>
      <div style="font-size:21px;font-weight:700;color:${T.tx};">${b.label}</div>
      <div style="font-size:16px;color:${T.txm};">${b.desc}</div>
    </div>`).join('')}
  </div>`;
};

// ══════════════════════════════════════
// HTML WRAPPER
// ══════════════════════════════════════
function wrapHTML(body, darkBg = false) {
  const bg = darkBg ? T.dkCover : SLIDE_BG;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${FONTS}
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${WIDTH}px;height:${HEIGHT}px;background:${bg};font-family:'Noto Sans KR',sans-serif;overflow:hidden;position:relative;}
</style></head><body>${body}</body></html>`;
}

// ══════════════════════════════════════
// SLIDE RENDERERS — JSON 읽기만. 내용 결정 없음.
// ══════════════════════════════════════

// ── COVER ── (브랜드 워터마크 → CAROUSEL_TOKENS.json brand 섹션)
function renderCover(slide) {
  let hookHTML = (slide.hook || '').replace(/\n/g, '<br>');
  if (slide.accentWord) {
    hookHTML = hookHTML.replace(slide.accentWord, `<span style="color:${T.gold};">${slide.accentWord}</span>`);
  }
  return wrapHTML(`
  <!-- gradient overlay -->
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,rgba(30,28,24,.2) 30%,rgba(30,28,24,.75) 65%,rgba(30,28,24,.95) 100%);z-index:1;"></div>
  <!-- 좌측 세로선 -->
  <div style="position:absolute;left:${PAD_C}px;top:160px;bottom:200px;width:2px;background:rgba(255,255,255,.06);z-index:2;"></div>
  <!-- 상단 워터마크 (brand 섹션에서 읽음) -->
  <div style="position:absolute;top:56px;left:${PAD_C}px;z-index:2;">
    <div style="font-family:'Montserrat',sans-serif;font-size:32px;font-weight:900;color:rgba(255,255,255,.35);letter-spacing:2px;">${B.coverWatermarkNum||''}</div>
    <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,.35);letter-spacing:1.5px;margin-top:4px;">${B.coverWatermarkText||''}</div>
  </div>
  <!-- 메인 텍스트 -->
  <div style="position:absolute;bottom:140px;left:${PAD_C}px;right:${PAD_C}px;z-index:2;">
    ${slide.badge ? `<div style="display:inline-block;background:${T.accent};color:#fff;font-weight:900;font-size:22px;padding:10px 26px;border-radius:100px;margin-bottom:18px;letter-spacing:1px;">${slide.badge}</div>` : ''}
    <h1 style="font-size:${TY.sizeHook||'58px'};font-weight:${TY.weightBlack||'900'};line-height:1.2;letter-spacing:-2px;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.4);">${hookHTML}</h1>
    ${slide.sub ? `<p style="font-size:24px;font-weight:500;color:rgba(255,255,255,.6);margin-top:12px;">${slide.sub}</p>` : ''}
  </div>
  <!-- 하단 바 -->
  <div style="position:absolute;bottom:48px;left:${PAD_C}px;right:${PAD_C}px;z-index:2;display:flex;justify-content:space-between;align-items:center;">
    ${brandMark(true)}
    <span style="font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:1px;">${B.swipeText||'SWIPE →'}</span>
  </div>`, true);
}

// ── POINT ── (number, sub, category 모두 JSON에서)
function renderPoint(slide) {
  const imgDesc = slide.imageDesc || '';
  const indType = slide.indicator || null;
  return wrapHTML(`
  <!-- 좌측 액센트 바 -->
  <div style="position:absolute;left:0;top:64px;bottom:50%;width:${L.accentBarWidth||'5px'};background:${T.accent};border-radius:0 3px 3px 0;"></div>
  ${cornerMark()}
  <!-- 텍스트 영역 (상단 50%) -->
  <div style="position:absolute;top:0;left:0;right:0;height:50%;padding:64px ${PAD}px 0;">
    ${slide.category ? categoryTag(slide.category) : ''}
    ${numLabel(slide.number, slide.sub)}
    ${hdeco()}
    <h2 style="font-size:${TY.sizeTitle||'72px'};font-weight:${TY.weightBlack||'900'};line-height:1.15;letter-spacing:-2px;color:${T.tx};margin-top:8px;">${(slide.title||'').replace(/\n/g,'<br>')}</h2>
    ${divider()}
    <p style="font-size:${TY.sizeBody||'30px'};font-weight:500;line-height:1.65;color:${T.tx2};">${(slide.body||'').replace(/\n/g,'<br>')}</p>
  </div>
  <!-- 이미지 슬롯 (하단 50%) -->
  ${imageSlot(imgDesc, '50%', indType)}
  ${slide.tip ? tipBar(slide.tip) : ''}`);
}

// ── COMPARE ── (number, sub → numLabel, category → categoryTag, 모두 JSON에서)
function renderCompare(slide) {
  const imgDesc = slide.imageDesc || '';
  return wrapHTML(`
  ${cornerMark()}
  <div style="position:absolute;top:0;left:0;right:0;padding:64px 64px 0;">
    ${slide.category ? categoryTag(slide.category) : ''}
    ${numLabel(slide.number, slide.sub)}
    ${hdeco()}
    <h2 style="font-size:52px;font-weight:900;letter-spacing:-1px;color:${T.tx};margin:8px 0 28px;text-align:center;">${(slide.title||'').replace(/\n/g,'<br>')}</h2>
    <div style="display:flex;gap:16px;">
      <!-- 왼쪽 -->
      <div style="flex:1;border-radius:18px;padding:28px 24px;background:rgba(0,0,0,.035);">
        <div style="font-size:30px;font-weight:900;color:${T.tx};margin-bottom:18px;">${slide.leftLabel||''}</div>
        ${(slide.leftItems||[]).map(i=>`<div style="font-size:24px;font-weight:500;color:${T.tx2};line-height:1.5;margin-bottom:14px;padding-left:28px;position:relative;"><span style="position:absolute;left:0;color:${T.txl};font-weight:900;">✕</span>${i}</div>`).join('')}
      </div>
      <!-- VS -->
      <div style="display:flex;align-items:center;font-family:'Montserrat',sans-serif;font-size:26px;font-weight:900;color:${T.txl};writing-mode:vertical-lr;">VS</div>
      <!-- 오른쪽 -->
      <div style="flex:1;border-radius:18px;padding:28px 24px;background:${T.accentSoft};border:2px solid ${T.mochaBorder};">
        <div style="font-size:30px;font-weight:900;color:${T.accent};margin-bottom:18px;">${slide.rightLabel||''}</div>
        ${(slide.rightItems||[]).map(i=>`<div style="font-size:24px;font-weight:500;color:${T.tx2};line-height:1.5;margin-bottom:14px;padding-left:28px;position:relative;"><span style="position:absolute;left:0;color:${T.accent};font-weight:900;">✓</span>${i}</div>`).join('')}
      </div>
    </div>
    ${slide.verdict ? `<div style="text-align:center;margin-top:28px;font-size:28px;font-weight:900;color:${T.accent};">→ ${slide.verdict}</div>` : ''}
  </div>
  <!-- 이미지 슬롯 (하단 30%) -->
  <div style="position:absolute;left:0;right:0;bottom:0;height:30%;display:flex;align-items:center;justify-content:center;border-top:2.5px dashed rgba(0,0,0,.08);background:rgba(0,0,0,.02);">
    <div style="text-align:center;color:rgba(0,0,0,.15);">
      <div style="font-size:36px;margin-bottom:8px;">📷</div>
      <div style="font-size:15px;line-height:1.5;">${imgDesc || (B.defaultImageDesc||'현장 사진')}</div>
    </div>
  </div>
  ${slide.tip ? tipBar(slide.tip) : ''}`);
}

// ── CHECKLIST ── (number, sub → numLabel, category → categoryTag, 모두 JSON에서)
function renderChecklist(slide) {
  const imgDesc = slide.imageDesc || '';
  const indType = slide.indicator || 'check';
  return wrapHTML(`
  ${cornerMark()}
  <!-- 텍스트 영역 (상단 50%) -->
  <div style="position:absolute;top:0;left:0;right:0;height:50%;padding:64px ${PAD}px 0;">
    ${slide.category ? categoryTag(slide.category) : ''}
    ${numLabel(slide.number, slide.sub)}
    ${hdeco()}
    <h2 style="font-size:56px;font-weight:900;line-height:1.2;letter-spacing:-1px;color:${T.tx};margin:8px 0 24px;">${(slide.title||'').replace(/\n/g,'<br>')}</h2>
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${(slide.items||[]).map((item,i)=>`
        <div style="display:flex;align-items:center;gap:18px;padding:20px 24px;border-radius:14px;${i===0?`background:${T.accentSoft};border:2px solid ${T.mochaBorder};`:'background:rgba(0,0,0,.025);'}">
          <div style="width:36px;height:36px;border-radius:10px;background:${i===0?T.accent:T.dk};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;">✓</div>
          <div style="font-size:28px;font-weight:600;color:${T.tx};">${item}</div>
        </div>`).join('')}
    </div>
  </div>
  <!-- 이미지 슬롯 (하단 50%) -->
  ${imageSlot(imgDesc, '50%', indType)}
  ${slide.tip ? tipBar(slide.tip) : ''}`);
}

// ── CTA ── (number, sub → numLabel, title/body/cta 모두 JSON에서)
function renderCTA(slide) {
  let titleHTML = (slide.title||'').replace(/\n/g,'<br>');
  if (slide.highlightWord) {
    titleHTML = titleHTML.replace(slide.highlightWord, `<span style="color:${T.accent};">${slide.highlightWord}</span>`);
  }
  return wrapHTML(`
  <!-- 좌측 세로 장식선 -->
  <div style="position:absolute;left:${PAD_C}px;top:48px;height:160px;width:3px;background:${T.accent};opacity:.15;border-radius:2px;"></div>
  ${cornerMark()}
  <div style="position:absolute;top:0;left:0;right:0;padding:64px ${PAD}px 0;">
    ${slide.category ? categoryTag(slide.category) : ''}
    ${numLabel(slide.number, slide.sub)}
    ${hdeco()}
    <!-- 인용부호 -->
    <div style="font-size:100px;font-weight:900;color:${T.accent};opacity:.15;line-height:.8;font-family:Georgia,serif;margin:8px 0 4px;">❝</div>
    <h2 style="font-size:56px;font-weight:900;line-height:1.25;letter-spacing:-1px;color:${T.tx};margin-bottom:14px;">${titleHTML}</h2>
    <p style="font-size:26px;font-weight:500;color:${T.txm};line-height:1.6;">${(slide.body||'').replace(/\n/g,'<br>')}</p>
    ${trustBadges()}
    <!-- CTA 버튼 -->
    <div style="margin-top:28px;text-align:center;background:${T.accent};color:#fff;font-size:30px;font-weight:900;padding:24px 0;border-radius:100px;box-shadow:0 6px 20px ${T.mochaShadow};letter-spacing:1px;">${slide.cta||''}</div>
    <!-- 브랜드 마크 -->
    <div style="text-align:center;margin-top:28px;display:flex;justify-content:center;">
      ${brandMark(false)}
    </div>
  </div>`);
}

// ── SLIDE ROUTER ──
function renderSlide(slide) {
  switch (slide.type) {
    case 'cover':     return renderCover(slide);
    case 'point':     return renderPoint(slide);
    case 'compare':   return renderCompare(slide);
    case 'checklist': return renderChecklist(slide);
    case 'cta':       return renderCTA(slide);
    default:
      console.warn(`[WARN] Unknown type: ${slide.type}, using 'point'`);
      return renderPoint(slide);
  }
}

// ══════════════════════════════════════
// MAIN
// ══════════════════════════════════════
async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node scripts/generate_carousel.js <post_number>');
    console.log('Example: node scripts/generate_carousel.js 005');
    process.exit(1);
  }

  const arg    = process.argv[2];
  const mdPath = findPackage(arg);
  if (!mdPath) { console.error(`[ERROR] Not found: ${arg}`); process.exit(1); }

  console.log(`[INPUT] ${mdPath}`);
  const content    = fs.readFileSync(mdPath, 'utf-8');
  const parsedData = parseCarouselData(content);

  // 배열 & 구 포맷(object.slides) 모두 지원
  let slides = Array.isArray(parsedData) ? parsedData : (parsedData.slides || []);
  if (!slides.length) { console.error('[ERROR] No slides'); process.exit(1); }

  // 번호 자동 부여 (JSON에 없는 경우 폴백)
  slides = assignNumbers(slides);
  console.log(`[SLIDES] ${slides.length} slides`);

  const outputDir = path.dirname(mdPath);
  const browser   = await puppeteer.launch({ headless: true });
  const page      = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

  for (let i = 0; i < slides.length; i++) {
    const slide   = slides[i];
    const html    = renderSlide(slide);
    const isCover = slide.type === 'cover';

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
    } catch (e) {
      console.warn(`[WARN] Font timeout slide ${i+1}`);
    }
    await new Promise(r => setTimeout(r, 600));

    const filename = `slide_${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(outputDir, filename), omitBackground: isCover, type: 'png' });
    console.log(`[OK] ${filename} (${slide.type}) #${slide.number||'cover'} — ${slide.sub||slide.title||''}`);
  }

  await browser.close();
  console.log(`[DONE] ${slides.length} PNGs → ${outputDir}`);
}

main().catch(err => { console.error('[ERROR]', err.message); process.exit(1); });
