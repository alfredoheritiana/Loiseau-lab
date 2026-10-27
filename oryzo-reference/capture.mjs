import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const mode = process.env.MODE === 'local' ? 'local' : 'source';
const url = process.env.URL || (mode === 'source' ? 'https://oryzo.ai/' : 'http://127.0.0.1:3000');
const frames = Math.max(4, Math.min(128, Number(process.env.FRAMES || 24)));
const delay = Math.max(250, Number(process.env.SETTLE_MS || 850));
const out = path.resolve('captures', mode);
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];
await fs.mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: process.env.HEADED !== '1' });
const all = { mode, url, generatedAt: new Date().toISOString(), views: {} };

const inspect = async page => page.evaluate(() => {
  const documentHeight = document.documentElement.scrollHeight;
  const headings = [...document.querySelectorAll('h1,h2,h3,h4')].map(e => ({
    text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180),
    tag: e.tagName.toLowerCase(),
    top: Math.round(e.getBoundingClientRect().top + window.scrollY)
  }));
  const actions = [...document.querySelectorAll('button,a,input,textarea,select')]
    .slice(0, 250).map(e => ({
      tag: e.tagName.toLowerCase(),
      text: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 100),
      type: e.getAttribute('type'),
      href: e.getAttribute('href')
    }));
  const nodes = [...document.querySelectorAll('canvas')].map((e, i) => {
    const r = e.getBoundingClientRect();
    return { i, pixelWidth: e.width, pixelHeight: e.height, cssWidth: Math.round(r.width), cssHeight: Math.round(r.height) };
  });
  const assets = [...new Set([
    ...performance.getEntriesByType('resource').map(r => r.name),
    ...[...document.querySelectorAll('[src]')].map(e => e.src),
    ...[...document.querySelectorAll('[href]')].map(e => e.href)
  ].filter(Boolean))];
  const fontFamilies = [...new Set([...document.querySelectorAll('h1,h2,h3,p,button')].slice(0, 60).map(e => getComputedStyle(e).fontFamily))];
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    url: location.href, title: document.title,
    scrollY: Math.round(window.scrollY), scrollHeight: documentHeight,
    viewport: { width: innerWidth, height: innerHeight },
    canvas: nodes, headings, actions, resources: assets, fontFamilies, prefersReducedMotion,
    hasWebGL2: (() => { try { const c=document.createElement('canvas'); return Boolean(c.getContext('webgl2')); } catch { return false; } })()
  };
});

for (const viewport of viewports) {
  const dir = path.join(out, viewport.name);
  await fs.mkdir(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1, reducedMotion: 'no-preference',
    locale: 'en-US', colorScheme: 'light'
  });
  const page = await context.newPage();
  const consoleErrors = [], requestFailures = [], requests = new Map(), frameRecords = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('request', r => { requests.set(r.url(), { url: r.url(), type: r.resourceType(), method: r.method() }); });
  page.on('requestfailed', r => requestFailures.push({ url: r.url(), reason: r.failure()?.errorText || 'unknown' }));
  page.on('response', r => {
    const record = requests.get(r.url());
    if (record) record.status = r.status();
    if (r.status() >= 400) requestFailures.push({ url: r.url(), status: r.status() });
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(Number(process.env.INITIAL_MS || 6000));
    await fs.writeFile(path.join(dir, 'initial.html'), await page.content());
    const first = await inspect(page);
    const maxScroll = Math.max(0, first.scrollHeight - viewport.height);
    for (let i = 0; i < frames; i++) {
      const target = Math.round(maxScroll * (i / (frames - 1)));
      // Wheel events run smooth-scroll and scroll-trigger handlers unlike direct scrollTo alone.
      const current = await page.evaluate(() => window.scrollY);
      await page.mouse.move(Math.round(viewport.width / 2), Math.round(viewport.height / 2));
      await page.mouse.wheel(0, target - current);
      await page.waitForTimeout(delay);
      // Fallback only if the source did not respond to normal wheel scrolling.
      const actual = await page.evaluate(() => window.scrollY);
      if (Math.abs(actual - target) > viewport.height * 0.7) {
        await page.evaluate(y => window.scrollTo(0, y), target);
        await page.waitForTimeout(delay);
      }
      const file = 'frame-' + String(i).padStart(2, '0') + '.png';
      try { await page.screenshot({ path: path.join(dir, file), timeout: 45000 }); }
      catch (e) { consoleErrors.push('screenshot ' + file + ': ' + String(e)); }
      const state = await inspect(page);
      frameRecords.push({ index: i, intendedScrollY: target, actualScrollY: state.scrollY, screenshot: file, canvas: state.canvas, headingPositions: state.headings });
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(delay);
    const final = await inspect(page);
    const report = {
      mode, url, viewport, first, final, frames: frameRecords,
      consoleErrors, requestFailures,
      requests: [...requests.values()].sort((a, b) => a.url.localeCompare(b.url))
    };
    await fs.writeFile(path.join(dir, 'capture.json'), JSON.stringify(report, null, 2));
    all.views[viewport.name] = {
      frames: frameRecords.length, canvas: final.canvas.length,
      resources: report.requests.length,
      failedRequests: requestFailures.length, consoleErrors: consoleErrors.length,
      firstScrollHeight: first.scrollHeight, lastScrollHeight: final.scrollHeight
    };
  } catch (e) {
    all.views[viewport.name] = { error: String(e), consoleErrors, requestFailures };
    await fs.writeFile(path.join(dir, 'capture-error.txt'), String(e));
  } finally {
    await context.close();
  }
}
await browser.close();
await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify(all, null, 2));
console.log(JSON.stringify(all, null, 2));
