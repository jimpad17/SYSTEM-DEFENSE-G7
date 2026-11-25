/* Verify click-a-truck / click-a-driver reveals live vehicle + driver details. */
const puppeteer = require('puppeteer-core');
const path = require('path');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const file = 'file:///' + path.join(__dirname, '..', 'FleetForward-Portable.html').replace(/\\/g, '/');
  await page.goto(file, { waitUntil: 'load' });
  await page.evaluate(() => {
    if (!document.querySelector('#loginOverlay').classList.contains('hidden')) {
      document.querySelector('#fillCreds').click();
      document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });
  await sleep(500);
  // freeze the 1-second simulation so synthetic clicks can't chase a moving marker
  await page.click('#pauseBtn');
  await sleep(100);

  // baseline counts must stay the same
  const base = await page.evaluate(() => ({
    kpis: document.querySelectorAll('#mapKpis .kpi').length,
    trucks: document.querySelectorAll('#truckMarkers [data-truck]').length,
    rows: document.querySelectorAll('#vehicleTable tbody tr').length
  }));

  // 1) click first truck marker (direct event: SVG group bbox centre can miss the circle)
  await page.evaluate(() => document.querySelector('#truckMarkers [data-truck]')
    .dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(250);
  const truckInfo = await page.evaluate(() => {
    const el = document.querySelector('#mapInfo');
    return {
      visible: getComputedStyle(el).display !== 'none',
      hasTruckArt: !!el.querySelector('.truck-art'),
      hasDriverStrip: !!el.querySelector('.info-driver-strip'),
      driverName: (el.querySelector('.info-driver-strip .ids strong') || {}).textContent || '',
      hasStats: el.querySelectorAll('.info-stats div').length,
      hasRoute: !!el.querySelector('.info-route'),
      ring: !!document.querySelector('#truckMarkers .sel-ring'),
      hotRoute: document.querySelectorAll('#mapRoutes .route-line.hot').length,
      left: el.style.left, top: el.style.top
    };
  });

  // 2) driver profile button inside card (DOM click avoids tick() re-render races)
  await page.evaluate(() => document.querySelector('#mapInfo [data-info="driver"]').click());
  await sleep(200);
  const driverProfile = await page.evaluate(() => {
    const el = document.querySelector('#mapInfo');
    return {
      kicker: (el.querySelector('.info-kicker') || {}).textContent || '',
      license: (el.querySelector('.info-stats b') || {}).textContent || '',
      hasCall: !!el.querySelector('[data-info="call"]')
    };
  });

  // 3) focus truck -> viewBox changes
  await page.evaluate(() => document.querySelector('#mapInfo [data-info="truck"]').click());
  await sleep(150);
  const vbBefore = await page.$eval('#fleetMap', el => el.getAttribute('viewBox'));
  await page.evaluate(() => document.querySelector('#mapInfo [data-info="focus"]').click());
  await sleep(650);
  const vbAfter = await page.$eval('#fleetMap', el => el.getAttribute('viewBox'));

  // 4) click a driver name in the status board -> locate truck on map
  await page.evaluate(() => { document.querySelector('[data-info="close"]').click(); });
  await page.click('#vehicleTable [data-driver-track]');
  await sleep(300);
  const fromTable = await page.evaluate(() => ({
    view: (document.querySelector('.nav-item.active') || {}).textContent || '',
    infoVisible: getComputedStyle(document.querySelector('#mapInfo')).display !== 'none',
    selected: document.querySelectorAll('#truckMarkers .truck.selected').length
  }));

  // 5) dispatch Locate button
  await page.evaluate(() => document.querySelector('[data-view="dispatch"]').click());
  await sleep(200);
  const locateCount = await page.$$eval('#dispatchTable [data-locate]', els => els.length);
  await page.click('#dispatchTable [data-locate]');
  await sleep(300);
  const dispatchLocate = await page.evaluate(() => ({
    view: (document.querySelector('.nav-item.active') || {}).textContent || '',
    infoVisible: getComputedStyle(document.querySelector('#mapInfo')).display !== 'none'
  }));

  console.log('BASE:', base);
  console.log('TRUCK CLICK:', truckInfo);
  console.log('DRIVER PROFILE:', driverProfile);
  console.log('VIEWBOX:', vbBefore, '->', vbAfter, '| changed:', vbBefore !== vbAfter);
  console.log('TABLE DRIVER CLICK:', fromTable);
  console.log('DISPATCH LOCATE:', locateCount, dispatchLocate);
  console.log('PAGE ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
