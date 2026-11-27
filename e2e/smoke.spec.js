const { test, expect } = require('@playwright/test');

const SITE = 'http://127.0.0.1:4199/';
const ADMIN = 'http://127.0.0.1:4198/';

// Cloud off: no anonymous sign-in, no network writes. Seeds localStorage the way the app stores it (lt: + JSON).
async function open(page, seed = {}) {
  await page.route(SITE + 'config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.ECHOLAC_CONFIG={};' }));
  await page.addInitScript(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem('lt:' + k, JSON.stringify(v)); }, seed);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}
const noSideScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const LEARNER = { user: { name: 'Lan', consent: { terms: true }, placeId: 'other' }, lang: 'vi' };

test('new learner: signup form validates and continues to choosing a place', async ({ page }) => {
  const errors = await open(page);
  await page.goto(SITE);
  await expect(page.locator('#submit')).toBeDisabled();
  await page.fill('#name', 'Lan');
  await page.fill('#dob', '01011995');
  await page.check('#terms');
  await expect(page.locator('#submit')).toBeEnabled();
  await page.click('#submit');
  await expect(page).toHaveURL(/#place/);
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('learner: four tabs, roleplay menu slides up, no sideways scroll at 360 px', async ({ page }) => {
  const errors = await open(page, LEARNER);
  await page.goto(SITE + '#home');
  const tabs = page.locator('#nav a');
  await expect(tabs).toHaveCount(4);
  await expect(page.locator('#nav')).toContainText('Kết nối');
  expect(await noSideScroll(page)).toBe(true);
  await page.locator('#nav a[href="#roleplay"]').click();
  await expect(page.locator('body')).toHaveClass(/play-open/);
  await page.evaluate(() => { location.hash = '#profile'; });
  await expect(page.locator('#settings')).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('tourist: English screens, three tabs, learning pages redirect to Discover', async ({ page }) => {
  const errors = await open(page, { ...LEARNER, 'connect-role': 'tourist' });
  await page.goto(SITE + '#home'); // the router renders Discover in place of #home; the hash stays
  await expect(page.locator('h1')).toContainText('Discover');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#nav a')).toHaveCount(3);
  await expect(page.locator('#nav')).toContainText('Discover');
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('admin page: local only, strict CSP, shows sign-in and nothing else', async ({ page }) => {
  const res = await page.goto(ADMIN);
  expect(res.headers()['content-security-policy'] || '').toContain("default-src 'none'");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('table')).toHaveCount(0);
  const site = await page.request.get(SITE + 'admin/index.html');
  expect(site.status()).toBe(404);
});
