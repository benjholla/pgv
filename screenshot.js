const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174'); // Vite default port for dev:static if not 5173
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'static-demo.png' });
  await browser.close();
})();
