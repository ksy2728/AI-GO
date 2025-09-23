const playwright = require('playwright');

async function testAASpeedScraping() {
  console.log('=== AA Speed 차트 직접 스크래핑 테스트 ===\n');

  const browser = await playwright.chromium.launch({
    headless: true
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('1. AA 페이지 접속...');
    await page.goto('https://artificialanalysis.ai/', {
      waitUntil: 'networkidle'
    });

    // Speed 차트로 스크롤
    console.log('2. Speed 차트로 스크롤...');
    await page.evaluate(() => {
      const speedSection = document.querySelector('h2')?.parentElement?.parentElement;
      if (speedSection) {
        const speedHeaders = Array.from(document.querySelectorAll('h2, h3'));
        const speedHeader = speedHeaders.find(h => h.textContent.includes('SPEED'));
        if (speedHeader) {
          speedHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    await page.waitForTimeout(2000);

    // Speed 차트 데이터 추출
    console.log('3. Speed 차트 데이터 추출...\n');

    const speedData = await page.evaluate(() => {
      const results = [];

      // Speed 차트 섹션 찾기
      const speedHeaders = Array.from(document.querySelectorAll('h2, h3, div'));
      const speedSection = speedHeaders.find(el =>
        el.textContent && el.textContent.includes('SPEED') &&
        el.textContent.includes('Output Tokens per Second')
      );

      if (speedSection) {
        // 차트 컨테이너 찾기
        let chartContainer = speedSection.parentElement;

        // 차트 막대와 값들 찾기
        const bars = chartContainer.querySelectorAll('[class*="bar"], [class*="chart"], div[style*="height"]');
        const texts = chartContainer.querySelectorAll('text, div, span');

        // 텍스트에서 숫자 추출
        texts.forEach(el => {
          const text = el.textContent.trim();
          // 숫자가 있고 모델명 근처에 있는 경우
          if (/^\d+$/.test(text)) {
            // 근처 모델명 찾기
            const parent = el.closest('div');
            if (parent) {
              const modelTexts = parent.querySelectorAll('text, div, span');
              modelTexts.forEach(modelEl => {
                const modelName = modelEl.textContent.trim();
                if (modelName && modelName.includes('GPT') || modelName.includes('Gemini') || modelName.includes('Claude')) {
                  results.push({
                    model: modelName,
                    speed: parseInt(text)
                  });
                }
              });
            }
          }
        });
      }

      // SVG 차트에서도 시도
      const svgElements = document.querySelectorAll('svg');
      svgElements.forEach(svg => {
        const texts = svg.querySelectorAll('text');
        let currentModel = '';
        texts.forEach(text => {
          const content = text.textContent.trim();
          if (content.includes('GPT-5') || content.includes('Gemini') || content.includes('Claude')) {
            currentModel = content;
          } else if (/^\d+$/.test(content) && currentModel) {
            results.push({
              model: currentModel,
              speed: parseInt(content)
            });
            currentModel = '';
          }
        });
      });

      return results;
    });

    console.log('추출된 Speed 데이터:');
    speedData.forEach(item => {
      console.log(`${item.model}: ${item.speed} t/s`);
    });

    // 스크린샷 저장
    console.log('\n4. 스크린샷 저장...');
    await page.screenshot({
      path: 'screenshots/aa-speed-chart.png',
      fullPage: false
    });

  } catch (error) {
    console.error('❌ 에러:', error.message);
  } finally {
    await browser.close();
  }
}

testAASpeedScraping();