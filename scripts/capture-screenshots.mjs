import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const url = 'file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch();
  
  const sizes = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
  ];

  for (const size of sizes) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height }
    });
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, `home-${size.name}.png`), fullPage: true });
    
    // go to progress page
    await page.goto(url + '#/progress');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, `progress-${size.name}.png`), fullPage: true });
    
    // go to plan page
    await page.goto(url + '#/plan');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, `plan-${size.name}.png`), fullPage: true });
    
    await context.close();
  }

  await browser.close();
  console.log('Screenshots generated successfully.');
}

run().catch(console.error);
