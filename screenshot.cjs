const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    // Use lsof to find the vite port
    const { execSync } = require('child_process');
    let port = 5173;
    try {
      const output = execSync('lsof -i -P -n | grep LISTEN | grep vite').toString();
      const match = output.match(/:(\d+)/);
      if (match) {
        port = parseInt(match[1], 10);
      }
    } catch (e) {
      // Ignore
    }
    console.log('Connecting to port ' + port);
    await page.goto('http://localhost:' + port);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'static-demo.png' });
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
