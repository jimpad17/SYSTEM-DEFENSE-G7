/* Test the app and capture real screenshots for the presentation. */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.join(__dirname, '..', 'assets', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const file = 'file:///' + path.join(__dirname, '..', 'app', 'index.html').replace(/\\/g, '/');
  await page.goto(file, { waitUntil: 'load' });
  await page.evaluate(() => {
    if (!document.querySelector('#loginOverlay').classList.contains('hidden')) {
      document.querySelector('#fillCreds').click();
      document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });
  await wait(1200);

  const results = {};
  results.mapKpis = await page.$$eval('#mapKpis .kpi', els => els.length);
  results.trucksOnMap = await page.$$eval('#truckMarkers [data-truck]', els => els.length);
  results.vehicleRows = await page.$$eval('#vehicleTable tbody tr', els => els.length);
  await page.screenshot({ path: path.join(OUT, '01-live-map.png') });

  // select a truck for detail screenshot
  await page.evaluate(() => document.querySelector('#truckMarkers [data-truck]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await wait(250);
  results.selectedDetail = await page.$eval('#selTitle', el => el.textContent);
  await page.screenshot({ path: path.join(OUT, '02-truck-detail.png') });

  const views = [
    ['routes', '03-routes-before.png'],
    ['dispatch', '04-dispatch.png'],
    ['fuel', '05-fuel.png'],
    ['driver', '06-driver-app.png'],
    ['reports', '07-reports.png']
  ];
  for (const [v, f] of views) {
    await page.evaluate(v => document.querySelector('[data-view="' + v + '"]').click(), v);
    await wait(350);
    results[v + 'Title'] = await page.$eval('#pageTitle', el => el.textContent);
    await page.screenshot({ path: path.join(OUT, f) });
  }

  // driver app interaction
  await page.evaluate(() => document.querySelector('[data-view="driver"]').click());
  await wait(200);
  await page.evaluate(() => document.querySelector('[data-app="accept"]')?.click());
  await wait(150);
  await page.evaluate(() => document.querySelector('[data-app="nav"]')?.click());
  await wait(250);
  results.navScreen = await page.$eval('#phoneScreen', el => el.innerText.includes('Navigating to'));
  await page.screenshot({ path: path.join(OUT, '08-driver-navigation.png') });

  // optimize routes
  await page.evaluate(() => document.querySelector('[data-view="routes"]').click());
  await wait(200);
  await page.evaluate(() => document.querySelector('#optimizeBtn').click());
  await wait(350);
  results.optimized = await page.$eval('#routeBannerTitle', el => el.textContent);
  await page.screenshot({ path: path.join(OUT, '09-routes-optimized.png') });

  console.log('RESULTS:', JSON.stringify(results, null, 2));
  console.log('PAGE ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
