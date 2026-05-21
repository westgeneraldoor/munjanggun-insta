#!/usr/bin/env node
/**
 * render_png.js — 문장군 캐러셀 HTML → PNG 슬라이스 유틸리티
 * 
 * v3.0 표준 HTML 캐러셀을 개별 슬라이드 PNG로 렌더링합니다.
 * puppeteer 기반. 제작 표준은 HTML이며, 이 스크립트는 보조 유틸입니다.
 * 
 * 사용법:
 *   node tools/export/render_png.js <html-file> [output-dir]
 *   node tools/export/render_png.js instagram/content/013_우리집중문선택가이드.html
 *   node tools/export/render_png.js instagram/content/013_우리집중문선택가이드.html ./output
 * 
 * 출력: slide_01.png, slide_02.png, ... (1080x1350, 2x scale)
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const VIEWPORT = { width: 1080, height: 1350, deviceScaleFactor: 2 };

async function renderSlides(htmlFile, outputDir) {
  const absolutePath = path.resolve(htmlFile);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${absolutePath}`);
    process.exit(1);
  }

  if (!outputDir) {
    outputDir = path.join(path.dirname(absolutePath), 'export');
  }
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`🎨 렌더링 시작: ${path.basename(htmlFile)}`);
  console.log(`📁 출력 디렉토리: ${outputDir}`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  await page.goto(`file://${absolutePath}`, { waitUntil: 'networkidle0' });

  // 캡션 복사 카드(마지막 슬라이드)를 제외한 콘텐츠 슬라이드만 렌더링
  const slides = await page.$$('.slide');
  
  let renderCount = 0;
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    
    // caption-card 클래스가 있으면 스킵 (캡션 복사 카드)
    const isCaptionCard = await slide.evaluate(el => 
      el.classList.contains('caption-card') || 
      el.querySelector('.caption-copy') !== null
    );
    
    if (isCaptionCard) {
      console.log(`  ⏭️  슬라이드 ${i + 1}: 캡션 카드 — 스킵`);
      continue;
    }

    const num = String(renderCount + 1).padStart(2, '0');
    const outputPath = path.join(outputDir, `slide_${num}.png`);
    
    await slide.screenshot({ path: outputPath, type: 'png' });
    console.log(`  ✅ slide_${num}.png 저장 완료`);
    renderCount++;
  }

  await browser.close();
  console.log(`\n🎉 렌더링 완료: ${renderCount}장 PNG 생성`);
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('사용법: node tools/export/render_png.js <html-file> [output-dir]');
  process.exit(0);
}

renderSlides(args[0], args[1]).catch(err => {
  console.error('❌ 렌더링 오류:', err.message);
  process.exit(1);
});
