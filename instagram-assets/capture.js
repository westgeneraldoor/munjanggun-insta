import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureScreenshots() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("🚀 Puppeteer 브라우저 시작 중...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1080, height: 1350 }
  });

  const page = await browser.newPage();
  
  // URL은 로컬 파일(file://) 경로를 사용합니다. (또는 http-server 주소도 가능)
  const filePath = path.join(__dirname, 'render.html');
  const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
  
  console.log(`🌐 페이지 로딩 중: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // 폰트와 이미지가 완벽히 렌더링되도록 약간의 추가 대기 시간을 가집니다.
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`📸 슬라이드 요소(.slide) 탐색 중...`);
  const slides = await page.$$('.slide');
  console.log(`▶ 총 ${slides.length}개의 슬라이드를 발견했습니다.`);

  const topic = process.argv[2] ? process.argv[2] : 'unnamed';
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const subFolderName = `${dateStr}_${topic}`;
  const targetDir = path.join(outputDir, subFolderName);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const fileName = `slide${i + 1}.png`;
    const outputPath = path.join(targetDir, fileName);
    
    console.log(`  ⏳ [${i + 1}/${slides.length}] 캡처 저장 중: ${fileName}`);
    
    await slide.screenshot({
      path: outputPath,
      type: 'png'
    });
  }

  console.log(`\n✅ 모든 슬라이드 캡처가 완료되었습니다!`);
  console.log(`📁 저장 경로: ${targetDir}`);
  
  await browser.close();
}

captureScreenshots().catch(err => {
  console.error("❌ 캡처 중 오류가 발생했습니다:", err);
  process.exit(1);
});
