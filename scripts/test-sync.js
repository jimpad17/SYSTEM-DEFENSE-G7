/* Cross-device delivery sync test.
   Two browsers on different origins (localhost vs 127.0.0.1) => separate localStorage,
   same server. A driver completes a delivery on one; admin sees it on the other. */
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STATE = path.join(ROOT, '.shared-state.json');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 3100;
const BASE = 'http://localhost:' + PORT;
const OTHER = 'http://127.0.0.1:' + PORT;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  if (fs.existsSync(STATE)) fs.unlinkSync(STATE);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  const cleanup = () => { try { server.kill(); } catch (e) {} if (fs.existsSync(STATE)) fs.unlinkSync(STATE); };
  process.on('exit', cleanup);

  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(BASE + '/api/sync'); if (r.ok) { ready = true; break; } } catch (e) {}
    await sleep(150);
  }
  if (!ready) throw new Error('sync server did not start');

  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const errors = [];
  const mk = async url => {
    const p = await browser.newPage();
    await p.setViewport({ width: 1440, height: 950 });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await sleep(400);
    return p;
  };
  const login = async (p, role) => {
    await p.evaluate(r => {
      if (!document.querySelector('#loginOverlay').classList.contains('hidden')) document.querySelector('#logoutBtn').click();
      document.querySelector('.role-tab[data-role="' + r + '"]').click();
      document.querySelector('#fillCreds').click();
      document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, role);
    await sleep(300);
  };

  // Admin device first — open the Completed Deliveries report.
  const admin = await mk(BASE);
  await login(admin, 'admin');
  await admin.evaluate(() => document.querySelector('[data-view="reports"]').click());
  await sleep(700);
  const before = await admin.evaluate(() => ({
    rows: document.querySelectorAll('#deliveryTable tbody tr').length,
    first: document.querySelector('#deliveryTable tbody tr').innerText.replace(/\s+/g, ' ').trim(),
    chip: document.querySelector('#deliveredCountChip').textContent,
    reportChip: document.querySelector('#adminReportChip').textContent
  }));

  // Separate device/origin — driver completes a delivery.
  const driver = await mk(OTHER);
  await login(driver, 'driver');
  await driver.evaluate(() => document.querySelector('[data-app="accept"]').click());
  await driver.evaluate(() => document.querySelector('[data-app="nav"]').click());
  await sleep(150);
  await driver.evaluate(() => {
    const s = document.querySelector('#loadSelect');
    s.value = '8600'; s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(120);
  await driver.evaluate(() => document.querySelector('[data-app="arrive"]').click());
  await sleep(120);
  await driver.evaluate(() => document.querySelector('[data-app="complete"]').click());
  await sleep(600);

  const driverRec = await driver.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('fleetforward_db_v1'));
    return { id: db.deliveries[0].id, loadKg: db.deliveries[0].loadKg, dest: db.deliveries[0].destination };
  });

  // Server should now hold the delivery.
  const serverState = await (await fetch(BASE + '/api/sync')).json();
  const serverHas = serverState.deliveries.some(d => d.id === driverRec.id);

  // Poll the admin device until the report updates (proves it came through the server).
  let after = null;
  for (let i = 0; i < 20; i++) {
    after = await admin.evaluate(() => ({
      rows: document.querySelectorAll('#deliveryTable tbody tr').length,
      first: document.querySelector('#deliveryTable tbody tr').innerText.replace(/\s+/g, ' ').trim(),
      chip: document.querySelector('#deliveredCountChip').textContent,
      reportChip: document.querySelector('#adminReportChip').textContent,
      reportMap: (document.querySelector('#deliveryReportAdmin iframe.gmap-frame') || {}).src || '',
      hasId: document.querySelector('#deliveryTable').innerText.includes('DL') &&
             document.querySelector('#deliveryTable').innerText.includes('8,600 kg')
    }));
    if (after.rows > before.rows && after.hasId) break;
    await sleep(500);
  }

  // Admin dashboard report should be updated too.
  await admin.evaluate(() => document.querySelector('[data-view="dashboard"]').click());
  await sleep(500);
  const dash = await admin.evaluate(() => ({
    chip: document.querySelector('#dashReportChip').textContent,
    map: (document.querySelector('#deliveryReport iframe.gmap-frame') || {}).src || '',
    loadCards: document.querySelectorAll('#loadStats .load-stat').length
  }));

  console.log('BEFORE:', before);
  console.log('DRIVER RECORD:', driverRec);
  console.log('SERVER HAS DELIVERY:', serverHas, '| stamp:', serverState.stamp);
  console.log('AFTER:', after);
  console.log('ADMIN DASHBOARD:', dash);
  console.log('PAGE ERRORS:', errors.length ? errors : 'none');

  await browser.close();
  cleanup();
  if (!serverHas || !(after.rows > before.rows) || !after.hasId || !after.reportMap || !dash.map || errors.length) {
    console.error('SYNC TEST FAILED');
    process.exit(1);
  }
  console.log('SYNC TEST PASSED');
})().catch(e => { console.error(e); process.exit(1); });
