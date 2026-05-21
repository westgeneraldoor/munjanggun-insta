#!/usr/bin/env node
/**
 * html_to_vector.js
 * HTML 캐러셀 파일을 피그마로 제한 없이 가져올 수 있도록
 * 로컬 Puppeteer를 활용해 단일 벡터 PDF 및 개별 SVG 파일로 변환해주는 유틸리티.
 * 최종 결과물을 부모 폴더에 직접 생성하고 원본 HTML 파일은 스스로 삭제(Self-cleanup)합니다.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const WIDTH = 1080;
const HEIGHT = 1350;

async function convertHtmlToVector(htmlFilePath) {
  const filename = path.basename(htmlFilePath, '.html');
  const targetDir = path.dirname(htmlFilePath); // HTML 파일이 위치한 바로 그 폴더 (instagram/content/)

  console.log(`[START] 변환 작업 시작: ${filename}.html`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // HTML 파일을 절대 경로 URL로 로드
  const fileUrl = `file://${path.resolve(htmlFilePath)}`;
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Noto Sans KR 폰트 로드 대기
  try {
    await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
  } catch (e) {
    console.warn(`[WARN] 폰트 로드 시간 초과. 기본 폰트로 렌더링될 수 있습니다.`);
  }

  // 1. 단일 다중 페이지 PDF 생성 (완전한 무제한 피그마 연동용)
  // 기존 가로 배치 Flex 레이아웃을 인쇄용 세로 배치로 변경하고 페이지 브레이크 적용
  await page.addStyleTag({
    content: `
      body { background: transparent !important; padding: 0 !important; }
      .carousel-container { display: block !important; gap: 0 !important; }
      .slide { 
        page-break-after: always !important; 
        break-after: page !important; 
        box-shadow: none !important; 
        border-radius: 0 !important; 
        margin: 0 !important; 
      }
    `
  });

  const pdfPath = path.join(targetDir, `${filename}.pdf`);
  await page.pdf({
    path: pdfPath,
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log(`  [OK] 다중 페이지 PDF 생성 완료 -> ${filename}.pdf`);

  // 2. 개별 SVG 추출 (부모 폴더 직하에 [파일명]_slide[번호].svg 형태로 플랫하게 저장)
  const slidesData = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('.slide'));
    return slides.map(slide => slide.outerHTML);
  });

  const styles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');
  });

  for (let i = 0; i < slidesData.length; i++) {
    const slideHtml = slidesData[i];
    const padIndex = String(i + 1).padStart(2, '0');
    const svgPath = path.join(targetDir, `${filename}_slide${padIndex}.svg`);
    
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
      ${styles}
      <style>
        .slide { box-shadow: none !important; border-radius: 0 !important; }
      </style>
      ${slideHtml}
    </div>
  </foreignObject>
</svg>`;
    fs.writeFileSync(svgPath, svgContent, 'utf-8');
  }
  console.log(`  [OK] 개별 슬라이드 SVG 생성 완료 -> ${filename}_slide[번호].svg`);

  await browser.close();
  
  // 3. 원본 HTML 파일 자동 제거 (Self-cleanup)
  try {
    fs.unlinkSync(htmlFilePath);
    console.log(`  [CLEANUP] 임시 HTML 파일 삭제 완료 -> ${filename}.html`);
  } catch (err) {
    console.error(`  [WARN] HTML 파일 삭제 실패:`, err.message);
  }

  console.log(`[DONE] ${filename} 변환 및 정리가 완료되었습니다!`);
}

// CLI 실행
async function main() {
  if (process.argv.length < 3) {
    console.log('사용법: node scripts/html_to_vector.js <HTML파일명_또는_경로_또는_all>');
    console.log('예시 1: node scripts/html_to_vector.js instagram/content/001_좁은현관의기적.html');
    console.log('예시 2: node scripts/html_to_vector.js 001'); // 번호만 입력 시 자동 매칭
    console.log('예시 3: node scripts/html_to_vector.js all'); // 모든 HTML 파일 일괄 변환
    process.exit(1);
  }

  const arg = process.argv[2];
  const contentDir = path.join(__dirname, '..', 'instagram', 'content');

  if (arg.toLowerCase() === 'all') {
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html'));
    console.log(`[BATCH] 총 ${files.length}개의 캐러셀 HTML 일괄 변환을 시작합니다...`);
    for (const file of files) {
      const fullPath = path.join(contentDir, file);
      try {
        await convertHtmlToVector(fullPath);
      } catch (err) {
        console.error(`[ERROR] ${file} 변환 중 에러 발생:`, err.message);
      }
    }
    console.log(`[BATCH] 모든 캐러셀 일괄 변환 완료!`);
    return;
  }

  let inputPath = arg;
  
  // 번호만 입력한 경우 매칭
  if (!inputPath.endsWith('.html')) {
    const files = fs.readdirSync(contentDir).filter(f => f.startsWith(inputPath) && f.endsWith('.html'));
    if (files.length > 0) {
      inputPath = path.join(contentDir, files[0]);
    } else {
      console.error(`[ERROR] 입력하신 테마 번호에 매칭되는 HTML 파일을 찾을 수 없습니다: ${inputPath}`);
      process.exit(1);
    }
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`[ERROR] 파일이 존재하지 않습니다: ${inputPath}`);
    process.exit(1);
  }

  await convertHtmlToVector(inputPath);
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
