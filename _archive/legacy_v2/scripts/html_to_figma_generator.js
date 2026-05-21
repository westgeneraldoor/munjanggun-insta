const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateFigmaCode(htmlFilePath) {
  const filename = path.basename(htmlFilePath, '.html');
  const targetDir = path.dirname(htmlFilePath);
  const absolutePath = path.resolve(htmlFilePath).replace(/\\/g, '/');
  const fileUrl = 'file:///' + encodeURI(absolutePath);

  console.log(`[PARSING] HTML 파일 분석 시작: ${filename}.html (URL: ${fileUrl})`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 디버깅용 콘솔 및 에러 바인딩
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
  
  await page.setViewport({ width: 1200, height: 1500 });
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  const htmlContent = await page.content();
  console.log(`[DEBUG] 로드된 HTML 길이: ${htmlContent.length} bytes`);

  // 폰트 로드 대기
  try {
    await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
  } catch (e) {
    console.warn(`[WARN] 폰트 로딩 시간 초과`);
  }

  // 브라우저 내부에서 스타일 및 좌표 정보 추출
  const layoutData = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('.slide'));
    
    // RGB 색상 파싱 유틸리티
    function parseColor(colorStr) {
      if (!colorStr || colorStr === 'rgba(0, 0, 0, 0)' || colorStr === 'transparent') {
        return null;
      }
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return null;
      return {
        r: parseInt(match[1]) / 255,
        g: parseInt(match[2]) / 255,
        b: parseInt(match[3]) / 255,
        a: match[4] !== undefined ? parseFloat(match[4]) : 1.0
      };
    }

    return slides.map((slide, slideIdx) => {
      const slideRect = slide.getBoundingClientRect();
      const elements = [];

      // 재귀적으로 슬라이드 내부의 모든 visual 요소 추출
      function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (!text) return;
          
          const parent = node.parentElement;
          const rect = parent.getBoundingClientRect();
          const style = window.getComputedStyle(parent);
          
          // 텍스트는 부모 요소를 기준으로 폰트 및 스타일 수집
          elements.push({
            type: 'text',
            text: text,
            x: rect.left - slideRect.left,
            y: rect.top - slideRect.top,
            w: rect.width,
            h: rect.height,
            fontSize: parseInt(style.fontSize) || 16,
            fontWeight: style.fontWeight,
            fontFamily: style.fontFamily,
            color: parseColor(style.color) || { r: 0, g: 0, b: 0, a: 1 },
            textAlign: style.textAlign,
            lineHeight: style.lineHeight
          });
          return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const rect = node.getBoundingClientRect();
          const style = window.getComputedStyle(node);
          
          const bg = parseColor(style.backgroundColor);
          const borderW = parseInt(style.borderWidth) || 0;
          const borderC = parseColor(style.borderColor);
          const radius = parseInt(style.borderRadius) || 0;

          // 배경색이 있거나 테두리가 있는 사각형 영역 수집
          if (bg || borderW > 0) {
            // 슬라이드 본체 사각형은 제외 (슬라이드 프레임 자체로 처리)
            if (!node.classList.contains('slide')) {
              elements.push({
                type: 'rect',
                x: rect.left - slideRect.left,
                y: rect.top - slideRect.top,
                w: rect.width,
                h: rect.height,
                bg: bg,
                borderWidth: borderW,
                borderColor: borderC,
                borderRadius: radius
              });
            }
          }

          // 카메라 슬롯 등의 플레이스홀더 감지
          if (node.textContent.includes('📷') && node.children.length === 0) {
            elements.push({
              type: 'image_slot',
              x: rect.left - slideRect.left,
              y: rect.top - slideRect.top,
              w: rect.width,
              h: rect.height,
              desc: node.textContent.replace('📷', '').trim()
            });
            return; // 자식 노드 순회 안 함
          }

          // 자식 노드 순회
          Array.from(node.childNodes).forEach(traverse);
        }
      }

      // 슬라이드 내 배경색/그라데이션 수집
      const slideStyle = window.getComputedStyle(slide);
      const isDark = slide.classList.contains('cover') || slideStyle.backgroundColor === 'rgb(30, 28, 24)';
      
      Array.from(slide.childNodes).forEach(traverse);

      return {
        index: slideIdx,
        isDark: isDark,
        elements: elements
      };
    });
  });

  await browser.close();

  // 피그마에서 실행될 자바스크립트 코드 생성
  let figmaCode = `
(async () => {
  console.log("=== Figma Carousel Draw Start ===");
  
  // 1. 필요한 폰트 사전 로드
  const fonts = [
    { family: "Noto Sans KR", style: "Regular" },
    { family: "Noto Sans KR", style: "Medium" },
    { family: "Noto Sans KR", style: "Bold" },
    { family: "Noto Sans KR", style: "Black" },
    { family: "Montserrat", style: "Regular" },
    { family: "Montserrat", style: "Medium" },
    { family: "Montserrat", style: "Bold" },
    { family: "Montserrat", style: "Black" }
  ];
  for (const font of fonts) {
    try {
      await figma.loadFontAsync(font);
    } catch(e) {
      // 폰트 로드 실패 시 폴백처리 (시스템 기본 폰트 사용 방지)
    }
  }

  const slideWidth = 1080;
  const slideHeight = 1350;
  const gap = 120;
  let startX = figma.viewport.center.x - ((slideWidth + gap) * ${layoutData.length}) / 2;
  let startY = figma.viewport.center.y - slideHeight / 2;

  // 메인 컨테이너 섹션 생성
  const section = figma.createSection();
  section.name = "${filename} 캐러셀";
  section.x = startX - 50;
  section.y = startY - 150;
  
  const createdFrames = [];

  const layout = ${JSON.stringify(layoutData, null, 2)};

  for (const slide of layout) {
    const frame = figma.createFrame();
    frame.name = "Slide " + (slide.index + 1);
    frame.resize(slideWidth, slideHeight);
    frame.x = startX + slide.index * (slideWidth + gap);
    frame.y = startY;
    
    // 배경색 지정
    if (slide.isDark) {
      frame.fills = [{ type: 'SOLID', color: { r: 30/255, g: 28/255, b: 24/255 } }];
    } else {
      frame.fills = [{ type: 'SOLID', color: { r: 245/255, g: 240/255, b: 232/255 } }];
    }

    section.appendChild(frame);
    createdFrames.push(frame);

    // 내부 요소들 그리기
    for (const el of slide.elements) {
      if (el.type === 'rect') {
        const rect = figma.createRectangle();
        rect.resize(el.w, el.h);
        rect.x = el.x;
        rect.y = el.y;
        
        if (el.bg) {
          rect.fills = [{ type: 'SOLID', color: { r: el.bg.r, g: el.bg.g, b: el.bg.b }, opacity: el.bg.a }];
        } else {
          rect.fills = [];
        }

        if (el.borderWidth > 0 && el.borderColor) {
          rect.strokes = [{ type: 'SOLID', color: { r: el.borderColor.r, g: el.borderColor.g, b: el.borderColor.b } }];
          rect.strokeWeight = el.borderWidth;
        }

        if (el.borderRadius > 0) {
          rect.cornerRadius = el.borderRadius;
        }
        
        frame.appendChild(rect);
      } 
      else if (el.type === 'text') {
        const text = figma.createText();
        
        // 폰트 스타일 매핑
        let style = "Regular";
        const weight = parseInt(el.fontWeight) || 400;
        if (weight >= 900) style = "Black";
        else if (weight >= 700) style = "Bold";
        else if (weight >= 500) style = "Medium";

        let family = "Noto Sans KR";
        if (el.fontFamily.toLowerCase().includes("montserrat")) {
          family = "Montserrat";
        }

        text.fontName = { family: family, style: style };
        text.characters = el.text;
        text.fontSize = el.fontSize;
        
        text.x = el.x;
        text.y = el.y;
        text.resize(el.w + 10, el.h + 5); // 텍스트 영역 잘림 방지용 패딩
        
        text.fills = [{ type: 'SOLID', color: { r: el.color.r, g: el.color.g, b: el.color.b } }];
        
        if (el.textAlign === 'center') {
          text.textAlignHorizontal = 'CENTER';
        } else if (el.textAlign === 'right') {
          text.textAlignHorizontal = 'RIGHT';
        }

        frame.appendChild(text);
      }
      else if (el.type === 'image_slot') {
        // 시공 현장 사진 가이드용 플레이스홀더 영역 생성
        const group = figma.createFrame();
        group.name = "📸 이미지 슬롯";
        group.resize(el.w, el.h);
        group.x = el.x;
        group.y = el.y;
        group.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 }, opacity: 0.3 }];
        
        const line1 = figma.createLine();
        line1.resize(Math.sqrt(el.w*el.w + el.h*el.h), 0);
        line1.rotation = -Math.atan2(el.h, el.w) * 180 / Math.PI;
        line1.x = 0;
        line1.y = el.h;
        line1.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
        group.appendChild(line1);

        const label = figma.createText();
        label.fontName = { family: "Noto Sans KR", style: "Medium" };
        label.characters = "📷 " + (el.desc || "시공 현장 사진");
        label.fontSize = 24;
        label.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
        label.x = el.w / 2 - 200;
        label.y = el.h / 2 - 15;
        label.resize(400, 40);
        label.textAlignHorizontal = 'CENTER';
        label.textAlignVertical = 'CENTER';
        group.appendChild(label);

        frame.appendChild(group);
      }
    }
  }

  // 섹션 크기 자동 맞춤
  section.resize(
    (slideWidth + gap) * ${layoutData.length} + 100,
    slideHeight + 300
  );

  figma.viewport.scrollAndZoomIntoView(createdFrames);
  console.log("=== Figma Carousel Draw Complete ===");
  return { status: "success", count: ${layoutData.length} };
})();
  `;

  const outputPath = path.join(targetDir, `${filename}_figma_code.js`);
  fs.writeFileSync(outputPath, figmaCode, 'utf-8');
  console.log(`[SUCCESS] Figma 코드 파일 생성 완료: ${filename}_figma_code.js`);
  return outputPath;
}

// CLI 실행
async function main() {
  if (process.argv.length < 3) {
    console.log('사용법: node scripts/html_to_figma_generator.js <HTML파일명_또는_번호>');
    process.exit(1);
  }

  const arg = process.argv[2];
  const contentDir = path.join(__dirname, '..', 'instagram', 'content');
  let inputPath = arg;

  if (!inputPath.endsWith('.html')) {
    const files = fs.readdirSync(contentDir).filter(f => f.startsWith(inputPath) && f.endsWith('.html'));
    if (files.length > 0) {
      inputPath = path.join(contentDir, files[0]);
    } else {
      console.error(`[ERROR] 매칭되는 HTML 파일을 찾을 수 없습니다: ${inputPath}`);
      process.exit(1);
    }
  }

  await generateFigmaCode(inputPath);
}

main().catch(console.error);
