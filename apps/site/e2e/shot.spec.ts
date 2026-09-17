import { test } from '@playwright/test';

test('docs shell', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/react-rtekit/');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shot-overview.png' });
  console.log('H1:', await page.locator('h1').first().innerText().catch(()=>'none'));
  console.log('SIDEBAR SECTIONS:', await page.locator('.docs-nav__section-title').allInnerTexts());
  console.log('CANONICAL:', await page.locator('link[rel=canonical]').getAttribute('href').catch(()=>'none'));
  console.log('OG:', await page.locator('meta[property="og:title"]').getAttribute('content').catch(()=>'none'));
  console.log('DESC:', (await page.locator('meta[name=description]').getAttribute('content'))?.slice(0,60));

  await page.goto('/react-rtekit/tables/');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shot-capability.png' });
  console.log('TOC:', await page.locator('.toc__link').allInnerTexts());
  console.log('DESC2:', (await page.locator('meta[name=description]').getAttribute('content'))?.slice(0,60));
});
