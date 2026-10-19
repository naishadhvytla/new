// CI-only smoke test. The deployed site has no build step and does not ship this file's dependencies.
// Usage: node tests/smoke.mjs http://127.0.0.1:8080/
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8080/';
const failures = [];
const fail = (where, msg) => failures.push(`[${where}] ${msg}`);

const browser = await chromium.launch();
for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  for (const motion of ['full', 'calm']) {
    const where = `${vp.width}px FX ${motion}`;
    const ctx = await browser.newContext({ viewport: vp });
    await ctx.addInitScript((m) => { try { localStorage.setItem('nv-motion', JSON.stringify({ m, os: 'none' })); } catch (e) {} }, motion);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => fail(where, `page error: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') fail(where, `console error: ${m.text()}`); });
    page.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) fail(where, `HTTP ${r.status()} ${r.url()}`); });
    page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) fail(where, `request failed ${r.url()}`); });

    await page.goto(BASE, { waitUntil: 'networkidle' });
    if ((await page.evaluate(() => document.documentElement.dataset.motion)) !== motion) fail(where, 'motion level not applied');

    const dom = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      const h1 = [...document.querySelectorAll('h1')];
      const broken = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.getElementById(h.slice(1)));
      const unnamed = [...document.querySelectorAll('button')].filter((b) => !(b.getAttribute('aria-label') || b.textContent.trim())).map((b) => b.outerHTML.slice(0, 80));
      return { dupes, h1: h1.length, h1Name: h1[0] && (h1[0].getAttribute('aria-label') || h1[0].textContent.trim()), broken, unnamed, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    if (dom.dupes.length) fail(where, `duplicate ids: ${dom.dupes.join(', ')}`);
    if (dom.h1 !== 1 || !dom.h1Name) fail(where, 'expected exactly one named h1');
    if (dom.broken.length) fail(where, `anchors with no target: ${dom.broken.join(', ')}`);
    if (dom.unnamed.length) fail(where, `buttons without a name: ${dom.unnamed.join(' | ')}`);
    if (dom.overflow) fail(where, 'page scrolls sideways');

    // Filter race: two quick clicks must end with every card visible.
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.click('.chip[data-filter="llm"]');
    await page.click('.chip[data-filter="all"]');
    await page.waitForTimeout(600);
    const visible = await page.$$eval('.proj', (cs) => cs.filter((c) => !c.hidden).length);
    if (visible !== 4) fail(where, `filter race left ${visible} of 4 cards visible`);

    // Project file opens from a deep link and closes cleanly.
    await page.goto(`${BASE}?project=rag`, { waitUntil: 'networkidle' });
    if (!(await page.evaluate(() => document.getElementById('modal').open))) fail(where, '?project=rag did not open the file');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    if (await page.evaluate(() => document.getElementById('modal').open)) fail(where, 'Escape did not close the file');

    // Message composer: valid submit shows the draft; Copy message must not throw.
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.fill('#f-name', 'Test Reviewer');
    await page.fill('#f-email', 'reviewer@example.com');
    await page.fill('#f-msg', 'Hello, this is a smoke-test message.');
    await page.click('.btn--submit');
    await page.waitForSelector('#signal-result:not([hidden])', { timeout: 3000 }).catch(() => fail(where, 'draft panel did not appear'));
    await page.click('#copy-msg').catch(() => fail(where, 'Copy message not clickable'));
    await page.waitForTimeout(200);

    if (vp.width === 1440 && motion === 'full') {
      await page.goto(BASE, { waitUntil: 'networkidle' });
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
        .forEach((v) => fail(where, `axe ${v.impact}: ${v.id} (${v.nodes.length} nodes) ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`));
    }
    await ctx.close();
  }
}
await browser.close();

if (failures.length) {
  console.error(`${failures.length} problem(s):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('Smoke test passed.');
