/* Verify admin login: overlay, demo credentials, validation, session, logout. */
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
  await sleep(400);

  const initial = await page.evaluate(() => ({
    overlayVisible: getComputedStyle(document.querySelector('#loginOverlay')).display !== 'none',
    email: document.querySelector('#demoEmail').textContent,
    pass: document.querySelector('#demoPass').textContent,
    placeholder: document.querySelector('#loginEmail').placeholder,
    hasLoginBtn: !!document.querySelector('.login-submit'),
    hasEmailField: !!document.querySelector('#loginEmail'),
    hasPassField: !!document.querySelector('#loginPass')
  }));

  // wrong password
  await page.evaluate(() => {
    document.querySelector('#loginEmail').value = document.querySelector('#demoEmail').textContent;
    document.querySelector('#loginPass').value = 'wrong';
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await sleep(120);
  const wrong = await page.evaluate(() => ({
    stillLocked: !document.querySelector('#loginOverlay').classList.contains('hidden'),
    error: document.querySelector('#loginError').textContent
  }));

  // use demo account -> login
  await page.evaluate(() => {
    document.querySelector('#fillCreds').click();
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await sleep(300);
  const loggedIn = await page.evaluate(() => ({
    overlayHidden: document.querySelector('#loginOverlay').classList.contains('hidden'),
    filledEmail: document.querySelector('#loginEmail').value,
    filledPass: document.querySelector('#loginPass').value,
    kpis: document.querySelectorAll('#mapKpis .kpi').length,
    trucks: document.querySelectorAll('#truckMarkers [data-truck]').length
  }));

  // session persists on reload
  await page.reload({ waitUntil: 'load' });
  await sleep(400);
  const persisted = await page.evaluate(() => document.querySelector('#loginOverlay').classList.contains('hidden'));

  // logout -> login screen returns
  await page.evaluate(() => document.querySelector('#logoutBtn').click());
  await sleep(150);
  const afterLogout = await page.evaluate(() => !document.querySelector('#loginOverlay').classList.contains('hidden'));

  // login again and confirm a module still works
  await page.evaluate(() => {
    document.querySelector('#fillCreds').click();
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    document.querySelector('[data-view="dispatch"]').click();
  });
  await sleep(250);
  const dispatchRows = await page.$$eval('#dispatchTable tbody tr', els => els.length);

  // ---- DRIVER ROLE ----
  await page.evaluate(() => document.querySelector('#logoutBtn').click());
  await sleep(120);
  await page.evaluate(() => document.querySelector('.role-tab[data-role="driver"]').click());
  await sleep(120);
  const driverTab = await page.evaluate(() => ({
    kicker: document.querySelector('#loginKicker').textContent,
    title: document.querySelector('#loginTitle').textContent,
    email: document.querySelector('#demoEmail').textContent,
    pass: document.querySelector('#demoPass').textContent,
    submit: document.querySelector('#loginSubmit').textContent.trim()
  }));

  // wrong driver password
  await page.evaluate(() => {
    document.querySelector('#loginEmail').value = document.querySelector('#demoEmail').textContent;
    document.querySelector('#loginPass').value = 'wrong';
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await sleep(100);
  const wrongDriver = await page.evaluate(() => !document.querySelector('#loginOverlay').classList.contains('hidden'));

  // driver login
  await page.evaluate(() => {
    document.querySelector('#fillCreds').click();
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await sleep(350);
  const driverIn = await page.evaluate(() => ({
    overlayHidden: document.querySelector('#loginOverlay').classList.contains('hidden'),
    view: (document.querySelector('.nav-item.active') || {}).dataset ? document.querySelector('.nav-item.active').dataset.view : '',
    visibleNav: [...document.querySelectorAll('.nav-item')].filter(n => getComputedStyle(n).display !== 'none').map(n => n.dataset.view),
    chipName: document.querySelector('#adminName').textContent,
    chipRole: document.querySelector('#roleMini').textContent,
    greeting: document.querySelector('#phoneScreen').innerText.includes('Hello,'),
    hasJob: document.querySelector('#phoneScreen').innerText.includes('Assigned Vehicle')
  }));

  // RBAC: hidden nav item and bell must NOT switch the driver away from the app
  await page.evaluate(() => {
    document.querySelector('[data-view="map"]').click();
    document.querySelector('#bellBtn').click();
  });
  await sleep(150);
  const rbacView = await page.evaluate(() => (document.querySelector('.nav-item.active') || {}).dataset
    ? document.querySelector('.nav-item.active').dataset.view : '');

  // driver session survives reload
  await page.reload({ waitUntil: 'load' });
  await sleep(350);
  const driverPersist = await page.evaluate(() => ({
    overlayHidden: document.querySelector('#loginOverlay').classList.contains('hidden'),
    view: (document.querySelector('.nav-item.active') || {}).dataset ? document.querySelector('.nav-item.active').dataset.view : ''
  }));

  console.log('INITIAL:', initial);
  console.log('WRONG PASS:', wrong);
  console.log('LOGGED IN:', loggedIn);
  console.log('SESSION PERSISTS ON RELOAD:', persisted);
  console.log('LOGOUT SHOWS LOGIN:', afterLogout);
  console.log('DISPATCH ROWS AFTER RE-LOGIN:', dispatchRows);
  console.log('DRIVER TAB:', driverTab);
  console.log('WRONG DRIVER PASS BLOCKED:', wrongDriver);
  console.log('DRIVER LOGGED IN:', driverIn);
  console.log('RBAC VIEW AFTER BLOCKED CLICKS:', rbacView);
  console.log('DRIVER SESSION PERSISTS:', driverPersist);
  console.log('PAGE ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
