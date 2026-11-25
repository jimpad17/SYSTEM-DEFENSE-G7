/* Verify departure/arrival/delivery times, real Google Maps, notifications, dashboard, and user management. */
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
  await page.goto(file, { waitUntil: 'domcontentloaded' });
  await sleep(500);

  const login = role => page.evaluate(r => {
    if (!document.querySelector('#loginOverlay').classList.contains('hidden')) document.querySelector('#logoutBtn').click();
    document.querySelector('.role-tab[data-role="' + r + '"]').click();
    document.querySelector('#fillCreds').click();
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }, role);

  await login('admin');
  await sleep(350);

  // Dashboard + real Google Maps from admin side.
  await page.evaluate(() => document.querySelector('[data-view="dashboard"]').click());
  await sleep(250);
  const dashboard = await page.evaluate(() => ({
    view: document.querySelector('.nav-item.active').dataset.view,
    kpis: [...document.querySelectorAll('#dashboardKpis .kpi')].map(k => k.innerText.replace(/\s+/g, ' ').trim()),
    activity: document.querySelectorAll('#activityFeed .activity-row').length,
    deliveries: document.querySelectorAll('#dashDeliveries .dash-delivery').length,
    unread: document.querySelector('#dashUnread').textContent,
    loadCards: document.querySelectorAll('#loadStats .load-stat').length,
    heavy: document.querySelector('#heavyLoadChip').textContent,
    reportIframe: (document.querySelector('#deliveryReport iframe.gmap-frame') || {}).src || '',
    reportChip: document.querySelector('#dashReportChip').textContent
  }));

  await page.evaluate(() => document.querySelector('[data-view="reports"]').click());
  await sleep(250);
  const adminMap = await page.evaluate(() => ({
    iframe: !!document.querySelector('#adminGensanMap iframe.gmap-frame'),
    src: (document.querySelector('#adminGensanMap iframe.gmap-frame') || {}).src || '',
    directions: (document.querySelector('#adminGensanMap .gmap-foot a') || {}).href || '',
    chip: document.querySelector('#adminMapChip').textContent
  }));

  // User management: create + deactivate a demo user.
  await page.evaluate(() => document.querySelector('[data-view="users"]').click());
  await sleep(200);
  const usersBefore = await page.$$eval('#userTable tbody tr', r => r.length);
  await page.evaluate(() => {
    const f = document.querySelector('#userForm');
    f.elements.name.value = 'Test Dispatcher'; f.elements.email.value = 'testdispatch';
    f.elements.pass.value = 'test123'; f.elements.role.value = 'Dispatcher';
    f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await sleep(200);
  const usersAfter = await page.evaluate(() => ({
    rows: document.querySelectorAll('#userTable tbody tr').length,
    hasNew: document.querySelector('#userTable').innerText.includes('testdispatch')
  }));

  // Driver flow: start navigation -> mark arrived -> complete delivery.
  await login('driver');
  await sleep(350);
  await page.evaluate(() => document.querySelector('[data-app="accept"]').click());
  await page.evaluate(() => document.querySelector('[data-app="nav"]').click());
  await sleep(180);
  await page.evaluate(() => {
    const s = document.querySelector('#loadSelect');
    s.value = '8600'; s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(150);
  const loadChoice = await page.evaluate(() => ({
    screen: document.querySelector('#phoneScreen').innerText,
    select: document.querySelector('#loadSelect').value
  }));
  const departed = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('fleetforward_db_v1'));
    const v = db.vehicles.find(x => x.id === 'V001');
    return {
      screenHasLeft: document.querySelector('#phoneScreen').innerText.includes('Left depot'),
      departedAt: v.departedAt,
      status: v.status,
      notifications: db.notifications.filter(n => n.type === 'Departed').length
    };
  });

  await page.evaluate(() => document.querySelector('[data-app="arrive"]').click());
  await sleep(180);
  const arrived = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('fleetforward_db_v1'));
    return {
      arrivedAt: db.vehicles.find(x => x.id === 'V001').arrivedAt,
      notification: db.notifications.some(n => n.type === 'Arrived' && n.vehicleId === 'V001')
    };
  });

  await page.evaluate(() => document.querySelector('[data-app="complete"]').click());
  await sleep(250);
  const delivered = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('fleetforward_db_v1'));
    const rec = db.deliveries[0];
    return {
      hero: (document.querySelector('.done-hero') || {}).innerText || '',
      screenTimes: ['Left', 'Arrived', 'Delivered'].every(t => document.querySelector('#phoneScreen').innerText.includes(t)),
      departedAt: rec.departedAt, arrivedAt: rec.arrivedAt, deliveredAt: rec.time,
      loadKg: rec.loadKg, recommendedTruck: rec.recommendedTruck,
      destination: rec.destination,
      mapSrc: (document.querySelector('#driverGensanMap iframe.gmap-frame') || {}).src || '',
      notification: db.notifications.some(n => n.type === 'Delivered' && n.vehicleId === 'V001')
    };
  });

  // Driver notification drawer shows confirmations without changing view.
  await page.evaluate(() => document.querySelector('#bellBtn').click());
  await sleep(150);
  const driverNotif = await page.evaluate(() => ({
    open: !document.querySelector('#notifDrawer').classList.contains('hidden'),
    count: document.querySelectorAll('#notifList .notif-item').length,
    hasArrived: document.querySelector('#notifList').innerText.includes('Arrived'),
    hasDelivered: document.querySelector('#notifList').innerText.includes('Delivered'),
    view: document.querySelector('.nav-item.active').dataset.view
  }));

  // Admin sees the same delivery + times + Google Map.
  await login('admin');
  await sleep(300);
  await page.evaluate(() => document.querySelector('[data-view="reports"]').click());
  await sleep(250);
  const adminAfter = await page.evaluate(() => {
    const row = document.querySelector('#deliveryTable tbody tr').innerText.replace(/\s+/g, ' ').trim();
    return {
      row,
      chip: document.querySelector('#deliveredCountChip').textContent,
      exportBtn: !!document.querySelector('#exportDeliveries'),
      mapDirections: (document.querySelector('#adminGensanMap .gmap-foot a') || {}).href || '',
      reportIframe: (document.querySelector('#deliveryReportAdmin iframe.gmap-frame') || {}).src || '',
      reportChip: document.querySelector('#adminReportChip').textContent,
      statusRows: document.querySelectorAll('#truckStatusTable tbody tr').length,
      statusExport: !!document.querySelector('#exportTruckStatus')
    };
  });
  await page.evaluate(() => document.querySelector('#bellBtn').click());
  await sleep(150);
  const adminNotif = await page.evaluate(() => ({
    open: !document.querySelector('#notifDrawer').classList.contains('hidden'),
    hasDelivery: document.querySelector('#notifList').innerText.includes('GL-101 delivered')
  }));

  console.log('DASHBOARD:', dashboard);
  console.log('ADMIN GOOGLE MAP:', adminMap);
  console.log('USERS:', { before: usersBefore, after: usersAfter });
  console.log('LOAD CHOICE:', { select: loadChoice.select, recommended: loadChoice.screen.includes('Fuso Canter') });
  console.log('DEPARTED:', departed);
  console.log('ARRIVED:', arrived);
  console.log('DELIVERED:', delivered);
  console.log('DRIVER NOTIFICATIONS:', driverNotif);
  console.log('ADMIN AFTER:', adminAfter);
  console.log('ADMIN NOTIFICATIONS:', adminNotif);
  console.log('PAGE ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
