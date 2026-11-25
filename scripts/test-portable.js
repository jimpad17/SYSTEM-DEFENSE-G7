/* Verify the single-file version works from file:// with no external files. */
const puppeteer = require('puppeteer-core');
const path = require('path');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  const errors = [];
  const failed = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => failed.push(r.url()));
  const file = 'file:///' + path.join(__dirname, '..', 'FleetForward-Portable.html').replace(/\\/g, '/');
  await page.goto(file, { waitUntil: 'load' });
  await page.evaluate(() => {
    if (!document.querySelector('#loginOverlay').classList.contains('hidden')) {
      document.querySelector('#fillCreds').click();
      document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });
  await new Promise(r => setTimeout(r, 700));
  const out = await page.evaluate(() => ({
    title: document.title,
    kpis: document.querySelectorAll('#mapKpis .kpi').length,
    trucks: document.querySelectorAll('#truckMarkers [data-truck]').length,
    rows: document.querySelectorAll('#vehicleTable tbody tr').length,
    styled: getComputedStyle(document.body).backgroundColor
  }));
  console.log('PORTABLE RESULT:', out);
  console.log('page errors:', errors.length ? errors : 'none');
  console.log('failed requests:', failed.length ? failed : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
