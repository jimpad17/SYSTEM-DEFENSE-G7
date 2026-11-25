/* ============================================================
   FleetForward — GreenLeaf Logistics (working simulation)
   ============================================================ */
(function () {
  'use strict';

  const KEY = 'fleetforward_db_v1';
  const SESSION_KEY = 'fleetforward_session';
  const ADMIN = { email: 'admin', pass: 'admin123' };
  const DRIVER = { email: 'driver', pass: 'driver123' };
  let session = null, loginRole = 'admin';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';

  const ROUTE_DEFS = [
    { id: 'R1', name: 'Metro Loop North', origin: 'Depot A', destination: 'North Hub', points: [[110, 470], [210, 420], [320, 370], [420, 270], [540, 200], [660, 150]], distanceKm: 48, etaMin: 95, baseFuel: 18.4, optFuel: 14.6, stops: 6 },
    { id: 'R2', name: 'Coastal Express', origin: 'Depot A', destination: 'Port District', points: [[110, 470], [240, 500], [380, 520], [520, 480], [650, 430], [790, 390], [900, 330]], distanceKm: 62, etaMin: 120, baseFuel: 23.8, optFuel: 18.2, stops: 8 },
    { id: 'R3', name: 'East Valley Run', origin: 'Depot B', destination: 'Valley Mall', points: [[300, 120], [400, 170], [520, 220], [640, 290], [760, 350], [880, 420]], distanceKm: 55, etaMin: 105, baseFuel: 21.0, optFuel: 16.4, stops: 7 },
    { id: 'R4', name: 'South Industrial', origin: 'Depot B', destination: 'Industrial Park', points: [[300, 120], [330, 250], [360, 370], [400, 480], [470, 560]], distanceKm: 41, etaMin: 85, baseFuel: 15.7, optFuel: 12.5, stops: 5 },
    { id: 'R5', name: 'Airport Corridor', origin: 'Depot C', destination: 'Airport Cargo', points: [[810, 140], [740, 210], [690, 300], [700, 400], [760, 500], [860, 550]], distanceKm: 58, etaMin: 110, baseFuel: 22.3, optFuel: 17.1, stops: 6 },
    { id: 'R6', name: 'Riverside Circuit', origin: 'Depot C', destination: 'Riverside', points: [[810, 140], [680, 110], [550, 100], [430, 130], [340, 200], [300, 120]], distanceKm: 36, etaMin: 70, baseFuel: 13.8, optFuel: 10.9, stops: 4 },
    { id: 'R7', name: 'Uptown Distribution', origin: 'Depot A', destination: 'Uptown Center', points: [[110, 470], [180, 350], [250, 240], [330, 150], [430, 90]], distanceKm: 44, etaMin: 90, baseFuel: 16.9, optFuel: 13.2, stops: 6 },
    { id: 'R8', name: 'West Hub Shuttle', origin: 'Depot A', destination: 'West Hub', points: [[110, 470], [90, 380], [120, 280], [190, 190], [280, 120], [300, 120]], distanceKm: 33, etaMin: 65, baseFuel: 12.6, optFuel: 9.8, stops: 5 }
  ];

  /* ---- Real General Santos City delivery destinations (Google Maps) ---- */
  const GENSAN_ORIGIN = 'Dadiangas South, General Santos City';
  const GENSAN_PLACES = [
    { id: 'DEPOT', name: 'Dadiangas Depot', area: 'Dadiangas South' },
    { id: 'LAGAO', name: 'SM City General Santos', area: 'Lagao' },
    { id: 'MAKAR', name: 'Port of General Santos (Makar)', area: 'Makar' },
    { id: 'ROB', name: 'Robinsons Place Gensan', area: 'Dadiangas East' },
    { id: 'CITYHALL', name: 'General Santos City Hall', area: 'Dadiangas South' },
    { id: 'AIRPORT', name: 'GSC International Airport', area: 'Bula' },
    { id: 'SISIDRO', name: 'Barangay San Isidro', area: 'San Isidro' },
    { id: 'MARKET', name: 'Dadiangas Public Market', area: 'Dadiangas Norte' },
    { id: 'LABANGAL', name: 'Barangay Labangal', area: 'Labangal' },
    { id: 'BULA', name: 'Bula Public Market', area: 'Bula' }
  ];
  const ROUTE_PLACE = { R1: 'LAGAO', R2: 'MAKAR', R3: 'ROB', R4: 'CITYHALL', R5: 'AIRPORT', R6: 'BULA', R7: 'MARKET', R8: 'LABANGAL' };
  const gensanPlaceOf = r => r ? (GENSAN_PLACES.find(p => p.id === ROUTE_PLACE[r.id]) || null) : null;
  const gmapEmbed = q => 'https://www.google.com/maps?q=' + encodeURIComponent(q + ', General Santos City') + '&output=embed';
  const gmapDirections = (a, b) => 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(a) + '&destination=' + encodeURIComponent(b + ', General Santos City') + '&travelmode=driving';

  const DRIVER_NAMES = [
    'Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Reyes', 'Jose Garcia', 'Liza Fernandez',
    'Ramon Villanueva', 'Cristina Bautista', 'Danilo Castillo', 'Rosalie Torrez', 'Eleazar Gomez',
    'Maricel Ramos', 'Fernando Diaz', 'Jennifer Lopez', 'Gregorio Carlos', 'Shiela Mae Cruz',
    'Ricardo Mendoza', 'Lourdes Flores', 'Norberto Alvarez', 'Jocelyn Navarro', 'Alfredo Padilla',
    'Milagros Rojas', 'Darwin Salazar', 'Evelyn Torres', 'Ignacio Vargas', 'Karen Villar',
    'Leopoldo Yap', 'Noralyn Zamora', 'Orlando Betis', 'Perlita Cordero'
  ];
  const MODELS = ['Isuzu NPR', 'Mitsubishi Canter', 'Toyota Dyna', 'Hino 300', 'Fuso Canter'];
  const TRUCK_TYPES = [
    { model: 'Isuzu NPR', maxKg: 1500, cls: 'Light duty' },
    { model: 'Mitsubishi Canter', maxKg: 3500, cls: 'Medium duty' },
    { model: 'Toyota Dyna', maxKg: 5000, cls: 'Medium duty' },
    { model: 'Hino 300', maxKg: 7000, cls: 'Heavy duty' },
    { model: 'Fuso Canter', maxKg: 10000, cls: 'Heavy duty' }
  ];
  const truckForLoad = kg => TRUCK_TYPES.find(t => Number(kg || 0) <= t.maxKg) || TRUCK_TYPES[TRUCK_TYPES.length - 1];

  let db, storageOK = true, selected = null, paused = false, tickCount = 0;
  let appDriver = null, appScreen = 'jobs', accepted = {}, selectedLoadKg = 6200;
  let currentView = 'map', mapFilter = 'all';
  let infoOpen = false, infoMode = 'truck', mapFocus = false, vbAnim = null;
  const BASE_VB = { x: 0, y: 0, w: 1000, h: 600 };
  let curVB = Object.assign({}, BASE_VB);
  const AV_COLORS = ['#16a34a', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#0ea5a4', '#ef4444', '#6366f1'];

  const money = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = id => '<svg><use href="#i-' + id + '"/></svg>';
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

  /* --- visual helpers: initials avatar + little cargo-truck illustration --- */
  function avatar(name, size) {
    const parts = String(name || '?').trim().split(/\s+/);
    const ini = ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
    let h = 0; const s = String(name || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const c = AV_COLORS[h % AV_COLORS.length];
    const px = size || 38;
    return '<span class="avatar" style="width:' + px + 'px;height:' + px + 'px;line-height:' + px + 'px;background:' + c + ';font-size:' + Math.round(px * .34) + 'px">' + esc(ini.toUpperCase() || '?') + '</span>';
  }
  function truckArt(color) {
    return '<svg class="truck-art" viewBox="0 0 120 64" aria-hidden="true">' +
      '<rect x="5" y="10" width="67" height="36" rx="5" fill="' + color + '"/>' +
      '<rect x="5" y="10" width="67" height="36" rx="5" fill="none" stroke="#fff" stroke-opacity=".55"/>' +
      '<path d="M72 20h17l15 15v11H72z" fill="' + color + '"/>' +
      '<path d="M78 24h10v10H78z" fill="#d8f3e2"/>' +
      '<path d="M20 28c8-6 17-5 24 0-1 8-8 13-16 13-4 0-8-5-8-13Z" fill="#fff" fill-opacity=".92"/>' +
      '<path d="M22 40c4-5 9-8 15-10" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="30" cy="48" r="8" fill="#1f2a24"/><circle cx="30" cy="48" r="3" fill="#a9b9ae"/>' +
      '<circle cx="90" cy="48" r="8" fill="#1f2a24"/><circle cx="90" cy="48" r="3" fill="#a9b9ae"/>' +
      '</svg>';
  }

  /* ---- Real Google Maps renderer for General Santos City ---- */
  function gensanMapHTML(opts) {
    const o = opts || {};
    const list = db.deliveries || [];
    const latest = list[0] || null;
    let vehicle = null, placeName = '', label = '';
    if (o.admin) {
      placeName = latest ? latest.destination : 'General Santos City';
      label = latest ? 'Latest delivery: ' + latest.destination + ' · ' + latest.code : 'No delivery completed yet — showing General Santos City';
    } else {
      const drv = db.drivers.find(x => x.id === appDriver);
      vehicle = drv ? vehicleOfDriver(drv) : null;
      const r = vehicle ? routeOf(vehicle) : null;
      const p = gensanPlaceOf(r);
      placeName = p ? p.name : 'General Santos City';
      label = p ? 'Assigned destination: ' + p.name + (vehicle ? ' · ' + vehicle.code : '') : 'No active delivery destination — showing General Santos City';
    }
    const mapUrl = gmapEmbed(placeName);
    const dirUrl = gmapDirections(GENSAN_ORIGIN, placeName);
    return '<div class="gmap-bar"><span><strong>' + esc(label) + '</strong></span><span>Powered by Google Maps</span></div>' +
      '<iframe class="gmap-frame" src="' + esc(mapUrl) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Google Maps — ' + esc(placeName) + '"></iframe>' +
      '<div class="gmap-foot"><span>Depot reference: ' + esc(GENSAN_ORIGIN) + '</span>' +
      '<a href="' + esc(dirUrl) + '" target="_blank" rel="noopener">Open driving directions in Google Maps ↗</a></div>';
  }
  function renderGensanMaps() {
    const chipText = deliveredTotal() + ' delivered';
    const ac = $('#adminMapChip'); if (ac) ac.textContent = chipText;
    const dc = $('#driverMapChip'); if (dc) dc.textContent = chipText;
    const a = $('#adminGensanMap'); if (a) a.innerHTML = gensanMapHTML({ admin: true });
    const d = $('#driverGensanMap'); if (d) d.innerHTML = gensanMapHTML({ admin: false });
  }

  function toast(msg, err) {
    const el = document.createElement('div');
    el.className = 'toast' + (err ? ' error' : '');
    el.innerHTML = icon(err ? 'alert' : 'check') + '<span>' + esc(msg) + '</span>';
    $('#toastRoot').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.25s'; setTimeout(() => el.remove(), 260); }, 3000);
  }

  /* ---------------- data ---------------- */
  function makeUsers(drivers) {
    return [
      { id: 'U1', name: 'Fleet Administrator', email: ADMIN.email, pass: ADMIN.pass, role: 'Admin', status: 'Active', driverId: null, builtIn: true },
      { id: 'U2', name: drivers[0].name, email: DRIVER.email, pass: DRIVER.pass, role: 'Driver', status: 'Active', driverId: drivers[0].id, builtIn: true },
      { id: 'U3', name: 'Dispatch Officer', email: 'dispatch', pass: 'dispatch123', role: 'Dispatcher', status: 'Active', driverId: null },
      { id: 'U4', name: 'Safety Officer', email: 'safety', pass: 'safety123', role: 'Admin', status: 'Active', driverId: null },
      { id: 'U5', name: drivers[1].name, email: 'maria', pass: 'driver123', role: 'Driver', status: 'Active', driverId: drivers[1].id }
    ];
  }
  function seedDB() {
    const drivers = DRIVER_NAMES.map((n, i) => ({
      id: 'D' + String(i + 1).padStart(2, '0'), name: n,
      license: 'L' + String(100000 + i * 37), phone: '09' + String(1700000000 + i * 12345).slice(-9),
      shift: ['Morning 6AM-2PM', 'Afternoon 2PM-10PM', 'Night 10PM-6AM'][i % 3],
      status: i < 26 ? 'On Duty' : (i < 28 ? 'Off Duty' : 'On Leave')
    }));
    const vehicles = [];
    for (let i = 0; i < 50; i++) {
      const st = i < 26 ? 'On Route' : i < 34 ? 'Idle' : i < 40 ? 'Maintenance' : 'Off Duty';
      const r = ROUTE_DEFS[i % ROUTE_DEFS.length];
      vehicles.push({
        id: 'V' + String(i + 1).padStart(3, '0'),
        code: 'GL-' + (101 + i),
        plate: 'ABC ' + String(1000 + i * 7),
        model: MODELS[i % MODELS.length],
        driverId: i < 30 ? drivers[i].id : null,
        routeId: st === 'On Route' || st === 'Idle' ? r.id : null,
        shift: drivers[i % 30].shift,
        status: st,
        fuel: Math.round(rand(14, 98)),
        idleMin: Math.round(rand(4, 96)),
        speed: Math.round(rand(28, 62)),
        progress: Math.random(),
        odometer: Math.round(rand(12000, 88000)),
        fuelUsed: Math.round(rand(9, 24) * 10) / 10,
        loadKg: [800, 2200, 4200, 6200, 8600][i % 5],
        deliveredCount: 0,
        lastDelivery: null,
        departedAt: st === 'On Route' ? ['06:05', '06:18', '06:34', '06:51', '07:07', '07:22', '07:46', '08:03'][i % 8] : null,
        arrivedAt: null
      });
    }
    const departTimes = ['08:26', '09:01', '09:33'];
    const deliveries = ['09:42', '10:15', '10:48'].map((t, i) => {
      const v = vehicles[i], d = drivers[i], r = ROUTE_DEFS[i % ROUTE_DEFS.length];
      return {
        id: 'DL' + (i + 1), vehicleId: v.id, code: v.code,
        driverId: d.id, driverName: d.name,
        routeId: r.id, routeName: r.name, destination: gensanPlaceOf(r).name,
        placeId: ROUTE_PLACE[r.id], departedAt: departTimes[i], arrivedAt: t, time: t,
        loadKg: [1200, 4200, 7600][i], truckModel: v.model, status: 'Delivered'
      };
    });
    deliveries.forEach(x => {
      const v = vehicles.find(a => a.id === x.vehicleId);
      v.deliveredCount = 1;
      v.departedAt = x.departedAt; v.arrivedAt = x.arrivedAt;
      v.lastDelivery = { time: x.time, destination: x.destination, routeName: x.routeName, placeId: x.placeId };
    });
    const notifications = deliveries.map(x => ({
      id: 'N' + x.id, type: 'Delivered', title: x.code + ' delivered',
      msg: x.driverName + ' delivered to ' + x.destination + ' at ' + x.time + '.',
      time: x.time, vehicleId: x.vehicleId, driverId: x.driverId, read: false
    }));
    const users = makeUsers(drivers);
    const alerts = [
      { id: 'A1', sev: 'high', type: 'Low Fuel', msg: 'GL-104 fuel level critically low (14%). Refuel required.', time: now() },
      { id: 'A2', sev: 'medium', type: 'Excessive Idling', msg: 'GL-117 recorded 96 minutes of idle time today.', time: now() },
      { id: 'A3', sev: 'medium', type: 'Route Delay', msg: 'R2 Coastal Express is running 12 minutes behind schedule.', time: now() },
      { id: 'A4', sev: 'low', type: 'Maintenance', msg: 'GL-138 is due for scheduled maintenance in 3 days.', time: now() },
      { id: 'A5', sev: 'high', type: 'Low Fuel', msg: 'GL-126 fuel level at 18%. Assign refuel stop.', time: now() }
    ];
    return { drivers, vehicles, routes: JSON.parse(JSON.stringify(ROUTE_DEFS)), alerts, deliveries, notifications, users, meta: { optimized: false, created: new Date().toISOString() } };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        db = JSON.parse(raw);
        // Repair older saved sessions that predate deliveries/notifications/users.
        const seed = seedDB();
        if (!Array.isArray(db.deliveries) || !db.deliveries.length) db.deliveries = seed.deliveries;
        if (!Array.isArray(db.notifications) || !db.notifications.length) db.notifications = seed.notifications;
        if (!Array.isArray(db.users) || !db.users.length) db.users = makeUsers(db.drivers);
        db.vehicles.forEach(v => {
          if (typeof v.deliveredCount !== 'number') v.deliveredCount = 0;
          if (!('departedAt' in v)) v.departedAt = null;
          if (!('arrivedAt' in v)) v.arrivedAt = null;
          if (typeof v.loadKg !== 'number') v.loadKg = 6200;
        });
        db.deliveries.forEach(x => {
          if (!x.departedAt) x.departedAt = '—';
          if (!x.arrivedAt) x.arrivedAt = x.time;
          if (typeof x.loadKg !== 'number') x.loadKg = 6200;
          if (!x.truckModel) x.truckModel = (db.vehicles.find(v => v.id === x.vehicleId) || {}).model || '—';
        });
        return;
      }
    } catch (e) { storageOK = false; }
    db = seedDB(); save();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); storageOK = true; } catch (e) { storageOK = false; }
    queueSync();
  }

  /* ---- Cross-device shared sync: deliveries, notifications, and trip times.
         Falls back silently to localStorage-only when opened as a file/offline. ---- */
  const SYNC_URL = '/api/sync';
  let sharedStamp = 0, lastPushed = '', syncTimer = null, syncBusy = false, bc = null;
  try { sharedStamp = Number(localStorage.getItem('fleetforward_sync_stamp')) || 0; } catch (e) { /* storage blocked */ }
  try {
    bc = new BroadcastChannel('fleetforward-sync');
    bc.onmessage = e => {
      const m = e.data;
      if (m && Number(m.stamp) > sharedStamp) applyShared(m);
    };
  } catch (e) { /* older browser — server poll still works */ }
  function timedFetch(url, opts) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    return fetch(url, Object.assign({ signal: ctrl.signal }, opts || {}))
      .finally(() => clearTimeout(t));
  }
  function sharedSnapshot() {
    const trips = {};
    db.vehicles.forEach(v => {
      trips[v.id] = {
        departedAt: v.departedAt || null,
        arrivedAt: v.arrivedAt || null,
        deliveredCount: v.deliveredCount || 0,
        loadKg: v.loadKg || 0,
        lastDelivery: v.lastDelivery || null
      };
    });
    return { deliveries: db.deliveries || [], notifications: db.notifications || [], trips };
  }
  function saveSilently() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* storage blocked */ }
  }
  function applyShared(s) {
    if (!s || typeof s !== 'object') return;
    const before = deliveredTotal();
    // Never let an empty/partial server snapshot erase locally recorded deliveries.
    if (Array.isArray(s.deliveries) && (s.deliveries.length || !db.deliveries.length)) db.deliveries = s.deliveries;
    if (Array.isArray(s.notifications) && (s.notifications.length || !db.notifications.length)) db.notifications = s.notifications;
    if (s.trips) db.vehicles.forEach(v => {
      const t = s.trips[v.id]; if (!t) return;
      if ('departedAt' in t) v.departedAt = t.departedAt;
      if ('arrivedAt' in t) v.arrivedAt = t.arrivedAt;
      if (typeof t.deliveredCount === 'number') v.deliveredCount = t.deliveredCount;
      if (typeof t.loadKg === 'number') v.loadKg = t.loadKg;
      if (t.lastDelivery) v.lastDelivery = t.lastDelivery;
    });
    sharedStamp = Number(s.stamp) || sharedStamp;
    lastPushed = JSON.stringify(sharedSnapshot());
    try { localStorage.setItem('fleetforward_sync_stamp', String(sharedStamp)); } catch (e) { /* storage blocked */ }
    saveSilently();
    render(); renderGensanMaps(); renderNotifications();
    if (deliveredTotal() > before) {
      toast('Driver delivery synced — Delivered Today updated.');
      $$('#dashboardKpis .kpi').forEach(k => {
        if (k.innerText.includes('Delivered Today')) {
          k.classList.remove('flash'); void k.offsetWidth; k.classList.add('flash');
          setTimeout(() => k.classList.remove('flash'), 1900);
        }
      });
    }
  }
  function queueSync() {
    if (location.protocol === 'file:') return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(pushShared, 350);
  }
  async function pushShared() {
    if (location.protocol === 'file:' || syncBusy) return;
    const shared = sharedSnapshot(), json = JSON.stringify(shared);
    if (json === lastPushed) return;
    const stamp = Date.now();
    syncBusy = true;
    try {
      const res = await timedFetch(SYNC_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stamp, shared })
      });
      if (res.ok) {
        const state = await res.json();
        lastPushed = json;
        sharedStamp = Number(state.stamp) || sharedStamp;
        try { localStorage.setItem('fleetforward_sync_stamp', String(sharedStamp)); } catch (e) { /* storage blocked */ }
        if (bc) { try { bc.postMessage(state); } catch (e) { /* ignore */ } }
        if (Number(state.stamp) > stamp) applyShared(state);
      }
    } catch (e) { /* server unavailable — localStorage stays authoritative */ }
    finally { syncBusy = false; }
  }
  async function pullShared() {
    if (location.protocol === 'file:' || syncBusy) return;
    syncBusy = true;
    try {
      const res = await timedFetch(SYNC_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const state = await res.json();
        if (Number(state.stamp) > sharedStamp) applyShared(state);
      }
    } catch (e) { /* offline — keep working locally */ }
    finally { syncBusy = false; }
  }
  const driverOf = v => db.drivers.find(d => d.id === v.driverId) || null;
  const routeOf = v => db.routes.find(r => r.id === v.routeId) || null;
  const vehicleOfDriver = d => db.vehicles.find(v => v.driverId === d.id) || null;
  const deliveriesOf = vid => (db.deliveries || []).filter(x => x.vehicleId === vid).length;
  const deliveredTotal = () => (db.deliveries || []).length;
  const departedTotal = () => db.vehicles.filter(v => !!v.departedAt).length;
  const unreadTotal = () => (db.notifications || []).filter(n => !n.read).length;
  const activeUserTotal = () => (db.users || []).filter(u => u.status === 'Active').length;
  function notify(type, title, msg, meta) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.unshift(Object.assign({
      id: 'N' + Date.now() + Math.random().toString(36).slice(2, 5),
      type, title, msg, time: now(), read: false
    }, meta || {}));
    if (db.notifications.length > 60) db.notifications.pop();
  }
  function loadStats() {
    const list = db.deliveries || [];
    const buckets = TRUCK_TYPES.map(t => ({
      model: t.model, cls: t.cls, maxKg: t.maxKg,
      count: list.filter(x => truckForLoad(x.loadKg).model === t.model).length
    }));
    const max = Math.max(1, ...buckets.map(b => b.count));
    return {
      buckets, max,
      totalKg: list.reduce((s, x) => s + Number(x.loadKg || 0), 0),
      heavy: list.filter(x => Number(x.loadKg || 0) > 5000).length
    };
  }
  function truckStatusStats() {
    const statuses = ['On Route', 'Idle', 'Maintenance', 'Off Duty'];
    return statuses.map(s => {
      const count = db.vehicles.filter(v => v.status === s).length;
      return { status: s, count, pct: Math.round(count / db.vehicles.length * 100) };
    });
  }

  /* ---------------- geometry ---------------- */
  function positionOn(points, t) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push(len); total += len;
    }
    let d = clamp(t, 0, 1) * total;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i] || i === segs.length - 1) {
        const a = points[i], b = points[i + 1];
        const f = segs[i] ? d / segs[i] : 0;
        return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI };
      }
      d -= segs[i];
    }
    return { x: points[0][0], y: points[0][1], angle: 0 };
  }
  function svg(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  /* ---------------- KPI helper ---------------- */
  function kpis(el, arr) {
    el.innerHTML = arr.map(k =>
      '<div class="kpi" style="--c:' + k.c + ';--s:' + k.s + '"><div class="kpi-icon">' + icon(k.i) + '</div>' +
      '<div class="kpi-label">' + k.l + '</div><div class="kpi-value">' + k.v + '</div><div class="kpi-foot">' + (k.f || '') + '</div></div>').join('');
  }
  const GREEN = '#16a34a', GREENS = '#e9f8ee', AMBER = '#f59e0b', AMBERS = '#fff6e5', RED = '#e5484d', REDS = '#fff0f0', BLUE = '#3b82f6', BLUES = '#eaf2ff';

  /* ================= MAP ================= */
  function renderMap() {
    const onRoute = db.vehicles.filter(v => v.status === 'On Route').length;
    const idle = db.vehicles.filter(v => v.status === 'Idle').length;
    const low = db.vehicles.filter(v => v.fuel < 30).length;
    const avgIdle = Math.round(db.vehicles.reduce((s, v) => s + v.idleMin, 0) / db.vehicles.length);
    $('#mapDeliveredChip').textContent = deliveredTotal() + ' delivered';
    kpis($('#mapKpis'), [
      { l: 'Total Vehicles', v: db.vehicles.length, f: 'Fleet size', i: 'truck', c: GREEN, s: GREENS },
      { l: 'On Route', v: onRoute, f: 'Moving now', i: 'route', c: BLUE, s: BLUES },
      { l: 'Idle', v: idle, f: 'Awaiting dispatch', i: 'clock', c: AMBER, s: AMBERS },
      { l: 'Low Fuel', v: low, f: 'Below 30%', i: 'fuel', c: RED, s: REDS },
      { l: 'Avg. Idle Time', v: avgIdle + ' min', f: 'Per vehicle today', i: 'clock', c: GREEN, s: GREENS }
    ]);
    drawBaseMap();
    drawMarkers();
    renderAlerts();
    renderSelected();
    renderVehicleTable();
  }

  function drawBaseMap() {
    const zones = $('#mapZones'), roads = $('#mapRoads'), routesG = $('#mapRoutes'), depot = $('#mapDepot');
    zones.innerHTML = ''; roads.innerHTML = ''; routesG.innerHTML = ''; depot.innerHTML = '';
    const z = [
      ['NORTH DISTRICT', 300, 30], ['WEST ZONE', 30, 180], ['EAST VALLEY', 690, 190], ['SOUTH INDUSTRIAL', 350, 510]
    ];
    z.forEach(v => {
      zones.appendChild(svg('text', { x: v[1], y: v[2], class: 'zone-label' }));
      zones.lastChild.textContent = v[0];
    });
    const roadsDef = [
      'M110 470 L300 120', 'M110 470 L900 330', 'M300 120 L900 330', 'M110 470 L470 560', 'M660 150 L900 330', 'M300 120 L110 470'
    ];
    roadsDef.forEach(d => {
      roads.appendChild(svg('path', { d, class: 'road' }));
      roads.appendChild(svg('path', { d, class: 'road-line' }));
    });
    db.routes.forEach(r => {
      const p = r.points.map(a => a.join(',')).join(' ');
      routesG.appendChild(svg('polyline', { points: p, class: 'route-line', 'data-route': r.id }));
    });
    [[110, 470, 'DEPOT A'], [300, 120, 'DEPOT B'], [810, 140, 'DEPOT C']].forEach(d => {
      depot.appendChild(svg('circle', { cx: d[0], cy: d[1], r: 12, fill: '#3b82f6', stroke: '#fff', 'stroke-width': 3 }));
      const t = svg('text', { x: d[0] + 16, y: d[1] + 4, fill: '#1d4ed8', 'font-size': 11, 'font-weight': 700 });
      t.textContent = d[2]; depot.appendChild(t);
    });
  }

  function visibleVehicles() {
    return db.vehicles.filter(v => {
      if (mapFilter === 'route') return v.status === 'On Route';
      if (mapFilter === 'idle') return v.status === 'Idle';
      if (mapFilter === 'low') return v.fuel < 30;
      return v.status === 'On Route' || v.status === 'Idle';
    });
  }
  function drawMarkers() {
    const g = $('#truckMarkers'); g.innerHTML = '';
    visibleVehicles().forEach(v => {
      const pos = positionOn(routeOf(v) ? routeOf(v).points : ROUTE_DEFS[0].points, v.progress);
      const color = v.fuel < 30 ? RED : v.status === 'Idle' ? AMBER : GREEN;
      const isSel = selected === v.id;
      const grp = svg('g', { class: 'truck' + (isSel ? ' selected' : ''), 'data-truck': v.id, transform: 'translate(' + pos.x + ',' + pos.y + ') rotate(' + pos.angle + ')' });
      if (isSel) grp.appendChild(svg('circle', { r: 17, class: 'sel-ring', fill: 'none', stroke: color, 'stroke-width': 2.5 }));
      grp.appendChild(svg('circle', { r: isSel ? 13 : 10, fill: color, stroke: '#fff', 'stroke-width': 2.5 }));
      grp.appendChild(svg('path', { d: 'M-4 -4 L9 0 L-4 4 Z', fill: '#fff' }));
      const label = svg('text', { x: 0, y: isSel ? -20 : -16, 'text-anchor': 'middle', transform: 'rotate(' + (-pos.angle) + ')', 'font-size': isSel ? 11 : 10 });
      label.textContent = v.code;
      grp.appendChild(label);
      g.appendChild(grp);
    });
    highlightRoute();
    positionInfoCard();
  }

  function highlightRoute() {
    const v = db.vehicles.find(x => x.id === selected);
    $$('#mapRoutes .route-line').forEach(el => el.classList.toggle('hot', !!v && el.getAttribute('data-route') === v.routeId));
  }
  /* ---------------- ON-MAP TRUCK / DRIVER INSPECTOR ---------------- */
  function renderInfoCard() {
    const host = $('#mapInfo');
    const v = db.vehicles.find(x => x.id === selected);
    if (!v || !infoOpen) { host.innerHTML = ''; host.style.display = 'none'; return; }
    const d = driverOf(v), r = routeOf(v);
    const color = v.fuel < 30 ? RED : v.status === 'Idle' ? AMBER : GREEN;
    const pct = Math.round(clamp(v.progress, 0, 1) * 100);
    let body = '';

    if (infoMode === 'driver' && d) {
      body =
        '<div class="info-top">' + avatar(d.name, 50) +
        '<div class="info-ident"><span class="info-kicker">DRIVER PROFILE</span><h4>' + esc(d.name) + '</h4>' +
        '<small>' + (d.status === 'On Duty' ? '<span class="badge ok">On Duty</span>' : '<span class="badge gray">' + esc(d.status) + '</span>') + ' · ' + esc(d.shift) + '</small></div>' +
        '<button class="info-x" data-info="close" title="Close">' + icon('x') + '</button></div>' +
        '<div class="info-stats">' +
        '<div><span>License no.</span><b>' + esc(d.license) + '</b></div>' +
        '<div><span>Contact</span><b>' + esc(d.phone) + '</b></div>' +
        '<div><span>Assigned truck</span><b>' + esc(v.code) + '</b></div>' +
        '<div><span>Duty shift</span><b>' + esc(d.shift.split(' ')[0]) + '</b></div>' +
        '</div>' +
        '<div class="info-route"><span class="info-kicker">LIVE ASSIGNMENT</span><b>' + esc(r ? r.name : 'No route assigned') + '</b>' +
        '<small>Truck ' + esc(v.code) + ' · ' + (v.status === 'On Route' ? v.speed + ' km/h · ' : 'Stopped · ') + 'fuel ' + v.fuel + '%</small></div>' +
        '<div class="info-actions"><button class="mini-btn" data-info="truck">' + icon('truck') + ' Back to truck</button>' +
        '<button class="mini-btn" data-info="call">' + icon('phone') + ' Call driver</button>' +
        '<button class="mini-btn red" data-info="close">Close</button></div>';
    } else {
      body =
        '<div class="info-top">' + truckArt(color) +
        '<div class="info-ident"><span class="info-kicker">VEHICLE · LIVE GPS</span><h4>' + esc(v.code) + ' ' + statusBadge(v.status) + '</h4>' +
        '<small>' + esc(v.plate) + ' · ' + esc(v.model) + '</small></div>' +
        '<button class="info-x" data-info="close" title="Close">' + icon('x') + '</button></div>' +
        '<div class="info-driver-strip">' + avatar(d ? d.name : '?', 36) +
        '<div class="ids"><strong>' + esc(d ? d.name : 'Unassigned driver') + '</strong><small>' + (d ? esc(d.shift) : 'Assign a driver in Dispatch') + '</small></div>' +
        (d ? '<button class="mini-btn" data-info="driver">Profile</button>' : '') + '</div>' +
        '<div class="info-stats">' +
        '<div><span>Speed</span><b>' + (v.status === 'On Route' ? v.speed + ' km/h' : '0 km/h') + '</b></div>' +
        '<div><span>Fuel</span><b style="color:' + (v.fuel < 30 ? RED : GREEN) + '">' + v.fuel + '%</b></div>' +
        '<div><span>Idle time</span><b>' + v.idleMin + ' min</b></div>' +
        '<div><span>Departed</span><b style="color:' + (v.departedAt ? BLUE : 'inherit') + '">' + esc(v.departedAt || '—') + '</b></div>' +
        '<div><span>Arrived</span><b>' + esc(v.arrivedAt || '—') + '</b></div>' +
        '<div><span>Odometer</span><b>' + v.odometer.toLocaleString() + ' km</b></div>' +
        '</div>' +
        '<div class="info-route"><span class="info-kicker">CURRENT ROUTE</span><b>' + esc(r ? r.name : 'No active route') + '</b>' +
        '<small>' + esc(r ? r.origin + ' → ' + r.destination + ' · ' + r.distanceKm + ' km · ETA ' + r.etaMin + ' min' : 'Assign a route in Dispatch') + '</small>' +
        '<div class="progress"><i style="width:' + pct + '%"></i></div><small>Trip progress ' + pct + '%</small></div>' +
        '<div class="info-actions"><button class="mini-btn" data-info="focus">' + icon('map') + ' ' + (mapFocus ? 'Reset view' : 'Focus truck') + '</button>' +
        '<button class="mini-btn" data-info="driver">' + icon('user') + ' Driver</button>' +
        '<button class="mini-btn red" data-info="close">Close</button></div>';
    }
    host.innerHTML = body;
    host.style.display = 'block';
    positionInfoCard();
  }

  function positionInfoCard() {
    const host = $('#mapInfo');
    if (!infoOpen || !selected || host.style.display === 'none') return;
    const v = db.vehicles.find(x => x.id === selected); if (!v) return;
    const svgEl = $('#fleetMap'), wrap = $('#mapWrap');
    if (!svgEl || !wrap || !svgEl.getScreenCTM) return;
    const pos = positionOn(routeOf(v) ? routeOf(v).points : ROUTE_DEFS[0].points, v.progress);
    const pt = svgEl.createSVGPoint(); pt.x = pos.x; pt.y = pos.y;
    const sp = pt.matrixTransform(svgEl.getScreenCTM());
    const wr = wrap.getBoundingClientRect();
    const x = clamp(sp.x - wr.left + 20, 8, Math.max(8, wr.width - host.offsetWidth - 8));
    const y = clamp(sp.y - wr.top - host.offsetHeight - 18, 8, Math.max(8, wr.height - host.offsetHeight - 8));
    host.style.left = x + 'px'; host.style.top = y + 'px';
  }

  function setViewBox(vb) {
    curVB = vb;
    $('#fleetMap').setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
  }
  function animateViewBox(target) {
    if (vbAnim) cancelAnimationFrame(vbAnim);
    const from = Object.assign({}, curVB), t0 = performance.now(), dur = 420;
    const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const step = ts => {
      const t = clamp((ts - t0) / dur, 0, 1), k = ease(t);
      setViewBox({
        x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k,
        w: from.w + (target.w - from.w) * k, h: from.h + (target.h - from.h) * k
      });
      positionInfoCard();
      if (t < 1) vbAnim = requestAnimationFrame(step); else vbAnim = null;
    };
    vbAnim = requestAnimationFrame(step);
  }
  function focusSelected() {
    const v = db.vehicles.find(x => x.id === selected); if (!v) return;
    mapFocus = !mapFocus;
    if (mapFocus) {
      const p = positionOn(routeOf(v) ? routeOf(v).points : ROUTE_DEFS[0].points, v.progress);
      const w = 420, h = 252;
      animateViewBox({ x: clamp(p.x - w / 2, 0, BASE_VB.w - w), y: clamp(p.y - h / 2, 0, BASE_VB.h - h), w, h });
      toast('Tracking ' + v.code + ' — map locked on truck.');
    } else {
      animateViewBox(Object.assign({}, BASE_VB));
      toast('Full fleet view restored.');
    }
    renderInfoCard();
  }
  function resetView() {
    mapFocus = false;
    if (vbAnim) cancelAnimationFrame(vbAnim);
    animateViewBox(Object.assign({}, BASE_VB));
  }
  function trackVehicle(id) {
    const v = db.vehicles.find(x => x.id === id); if (!v) return;
    selected = id; infoOpen = true; infoMode = 'truck';
    if (mapFilter !== 'all' && !visibleVehicles().some(x => x.id === id)) {
      mapFilter = 'all'; $('#mapFilter').value = 'all';
    }
    showView('map');
    renderInfoCard(); highlightRoute();
    $('#fleetMap').scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Tracking ' + v.code + ' — ' + (driverOf(v) ? driverOf(v).name : 'no driver') + '.');
  }

  function tick() {
    tickCount++;
    $('#simClock').textContent = now();
    if (paused || currentView !== 'map') return;
    db.vehicles.forEach(v => {
      if (v.status !== 'On Route') return;
      const r = routeOf(v); if (!r) return;
      v.progress += (v.speed / 60) * 0.00022;
      if (v.progress >= 1) v.progress = 0.02;
      v.odometer += Math.round(v.speed / 3600 * 4);
    });
    const g = $('#truckMarkers');
    visibleVehicles().forEach(v => {
      const el = g.querySelector('[data-truck="' + v.id + '"]');
      if (!el) return;
      const p = positionOn(routeOf(v) ? routeOf(v).points : ROUTE_DEFS[0].points, v.progress);
      el.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ') rotate(' + p.angle + ')');
      const t = el.querySelector('text'); if (t) t.setAttribute('transform', 'rotate(' + (-p.angle) + ')');
    });
    if (infoOpen && selected) positionInfoCard();
    if (mapFocus && selected && !vbAnim) {
      const v = db.vehicles.find(x => x.id === selected);
      if (v) {
        const p = positionOn(routeOf(v) ? routeOf(v).points : ROUTE_DEFS[0].points, v.progress);
        setViewBox({
          x: clamp(p.x - curVB.w / 2, 0, BASE_VB.w - curVB.w),
          y: clamp(p.y - curVB.h / 2, 0, BASE_VB.h - curVB.h),
          w: curVB.w, h: curVB.h
        });
      }
    }
    if (tickCount % 12 === 0) save();
    if (tickCount % 8 === 0 && selected) { renderSelected(); if (infoOpen) renderInfoCard(); }
  }

  function statusBadge(s) {
    const cls = s === 'On Route' ? 'ok' : s === 'Idle' ? 'warn' : s === 'Maintenance' ? 'bad' : 'gray';
    return '<span class="badge ' + cls + '"><i class="pill-dot ' + (cls === 'ok' ? '' : cls === 'warn' ? 'amber' : cls === 'bad' ? 'red' : 'gray') + '"></i>' + s + '</span>';
  }
  function renderSelected() {
    const body = $('#selBody');
    const v = db.vehicles.find(x => x.id === selected);
    if (!v) { $('#selTitle').textContent = 'Vehicle Details'; body.innerHTML = '<div class="sel-empty">Click a truck marker on the map to see live details.</div>'; return; }
    const d = driverOf(v), r = routeOf(v);
    $('#selTitle').textContent = v.code + ' · ' + v.plate;
    body.innerHTML =
      '<div class="sel-driver">' + avatar(d ? d.name : '?', 40) +
      '<div class="ids"><strong>' + esc(d ? d.name : 'Unassigned driver') + '</strong><small>' + (d ? esc(d.license) + ' · ' + esc(d.shift) : 'Assign in Dispatch') + '</small></div>' +
      '<button class="mini-btn" data-sel="locate">Locate</button></div>' +
      '<div class="sel-actions"><button class="mini-btn" data-sel="inspect">Open live inspector</button>' +
      (d ? '<button class="mini-btn" data-sel="driver">Driver profile</button>' : '') + '</div>' +
      '<div class="sel-row"><span>Status</span><strong>' + statusBadge(v.status) + '</strong></div>' +
      '<div class="sel-row"><span>Driver</span><strong>' + esc(d ? d.name : 'Unassigned') + '</strong></div>' +
      '<div class="sel-row"><span>Route</span><strong>' + esc(r ? r.name : '—') + '</strong></div>' +
      '<div class="sel-row"><span>Speed</span><strong>' + (v.status === 'On Route' ? v.speed + ' km/h' : '0 km/h') + '</strong></div>' +
      '<div class="sel-row"><span>Fuel level</span><strong style="color:' + (v.fuel < 30 ? RED : GREEN) + '">' + v.fuel + '%</strong></div>' +
      '<div class="sel-row"><span>Idle time</span><strong>' + v.idleMin + ' min</strong></div>' +
      '<div class="sel-row"><span>Left depot</span><strong style="color:' + (v.departedAt ? BLUE : 'inherit') + '">' + esc(v.departedAt || '—') + '</strong></div>' +
      '<div class="sel-row"><span>Arrived</span><strong>' + esc(v.arrivedAt || '—') + '</strong></div>' +
      '<div class="sel-row"><span>Odometer</span><strong>' + v.odometer.toLocaleString() + ' km</strong></div>' +
      '<div class="sel-row"><span>Delivered today</span><strong style="color:' + GREEN + '">' + deliveriesOf(v.id) + '</strong></div>' +
      '<div class="sel-row"><span>Last delivery</span><strong>' + (v.lastDelivery ? esc(v.lastDelivery.time + ' · ' + v.lastDelivery.destination) : '—') + '</strong></div>' +
      '<div class="sel-row"><span>Vehicle</span><strong>' + esc(v.model) + '</strong></div>';
  }
  function renderAlerts() {
    const a = db.alerts.slice(0, 12);
    $('#alertCount').textContent = db.alerts.length;
    $('#bellCount').textContent = db.alerts.length > 9 ? '9+' : db.alerts.length;
    $('#alertFeed').innerHTML = a.length ? a.map(x =>
      '<div class="alert-item ' + (x.sev === 'high' ? 'high' : x.sev === 'low' ? 'low' : '') + '">' + icon('alert') +
      '<div><strong>' + esc(x.type) + '</strong><small>' + esc(x.msg) + '</small><small>' + esc(x.time) + '</small></div></div>').join('')
      : '<div class="sel-empty">No active alerts.</div>';
  }
  function renderVehicleTable() {
    const q = ($('#vehicleSearch').value || '').toLowerCase();
    const rows = db.vehicles.filter(v => {
      const d = driverOf(v);
      return !q || v.code.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q) || (d && d.name.toLowerCase().includes(q));
    });
    $('#vehicleTable').innerHTML = '<thead><tr><th>Vehicle</th><th>Plate</th><th>Driver</th><th>Route</th><th>Status</th><th>Fuel</th><th class="right">Idle</th><th class="right">Speed</th><th class="right">Left</th><th class="right">Delivered</th><th></th></tr></thead><tbody>' +
      rows.map(v => {
        const d = driverOf(v), r = routeOf(v);
        return '<tr><td><strong>' + v.code + '</strong><br><small class="muted">' + esc(v.model) + '</small></td><td>' + esc(v.plate) + '</td>' +
          '<td>' + (d ? '<button class="link-btn" data-driver-track="' + d.id + '">' + esc(d.name) + '</button>' : 'Unassigned') + '</td><td>' + esc(r ? r.name : '—') + '</td><td>' + statusBadge(v.status) + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:6px"><div class="fuel-track" style="width:55px"><div class="fuel-fill ' + (v.fuel < 30 ? 'low' : v.fuel < 50 ? 'mid' : '') + '" style="width:' + v.fuel + '%"></div></div><small>' + v.fuel + '%</small></div></td>' +
          '<td class="right">' + v.idleMin + 'm</td><td class="right">' + (v.status === 'On Route' ? v.speed : 0) + '</td>' +
          '<td class="right"><span class="time-pill">' + esc(v.departedAt || '—') + '</span></td>' +
          '<td class="right"><span class="delivered-pill">' + deliveriesOf(v.id) + '</span></td>' +
          '<td class="right"><button class="mini-btn" data-track="' + v.id + '">Track</button></td></tr>';
      }).join('') + '</tbody>';
    $('#vehicleFoot').textContent = 'Showing ' + rows.length + ' of ' + db.vehicles.length + ' vehicles';
    $$('[data-track]').forEach(b => b.onclick = () => trackVehicle(b.dataset.track));
    $$('[data-driver-track]').forEach(b => b.onclick = () => {
      const d = db.drivers.find(x => x.id === b.dataset.driverTrack);
      const v = d && vehicleOfDriver(d);
      if (v) trackVehicle(v.id); else toast('This driver has no assigned vehicle.', true);
    });
  }

  /* ================= ROUTES ================= */
  function renderRoutes() {
    const opt = db.meta.optimized;
    const dist = db.routes.reduce((s, r) => s + r.distanceKm, 0);
    const currentFuel = db.routes.reduce((s, r) => s + r.baseFuel, 0);
    const optFuel = db.routes.reduce((s, r) => s + r.optFuel, 0);
    const saved = currentFuel - optFuel;
    $('#routeBannerTitle').textContent = opt ? 'Routes optimized — fuel waste reduced.' : 'Optimize the fleet. Cut the fuel bill.';
    $('#routeBannerText').textContent = opt
      ? 'AI-planned routes are now active. Estimated saving: ' + saved.toFixed(1) + ' L per fleet cycle (~' + money(saved * 3.2 * 260) + '/year).'
      : 'GreenLeaf fuel costs rose 20% due to inefficient routing and idling. Run the optimizer to see the savings.';
    kpis($('#routeKpis'), [
      { l: 'Active Routes', v: db.routes.length, f: 'Across 3 depots', i: 'route', c: GREEN, s: GREENS },
      { l: 'Total Distance', v: dist + ' km', f: 'Per planning cycle', i: 'map', c: BLUE, s: BLUES },
      { l: 'Fuel After AI Plan', v: optFuel.toFixed(1) + ' L', f: opt ? 'Active plan' : 'Projected', i: 'fuel', c: AMBER, s: AMBERS },
      { l: 'Fuel Saved', v: saved.toFixed(1) + ' L', f: '≈ ' + Math.round(saved / currentFuel * 100) + '% reduction', i: 'leaf', c: GREEN, s: GREENS },
      { l: 'Est. Annual Saving', v: money(saved * 3.2 * 260), f: 'At $3.20/L, 260 days', i: 'chart', c: GREEN, s: GREENS }
    ]);
    $('#routeGrid').innerHTML = db.routes.map(r => {
      const save = r.baseFuel - r.optFuel;
      const pct = Math.round(save / r.baseFuel * 100);
      return '<div class="route-card"><div class="rc-top"><div><h4>' + esc(r.name) + '</h4><small>' + r.id + ' · ' + r.stops + ' stops</small></div>' +
        '<span class="badge ' + (opt ? 'ok' : 'gray') + '">' + (opt ? 'Optimized' : 'Current plan') + '</span></div>' +
        '<div class="rc-path"><b>' + esc(r.origin) + '</b><span class="rc-arrow">→</span><b>' + esc(r.destination) + '</b></div>' +
        '<div class="rc-stats"><div class="rc-stat"><span>Distance</span><strong>' + r.distanceKm + ' km</strong></div>' +
        '<div class="rc-stat"><span>ETA</span><strong>' + r.etaMin + ' min</strong></div>' +
        '<div class="rc-stat"><span>Fuel ' + (opt ? 'now' : 'current') + '</span><strong>' + (opt ? r.optFuel : r.baseFuel).toFixed(1) + ' L</strong></div></div>' +
        '<div class="rc-saving">' + icon('leaf') + ' ' + save.toFixed(1) + ' L saved (' + pct + '%)</div>' +
        '<div class="rc-foot"><div class="progress"><i style="width:' + (opt ? 100 : 45 + (r.distanceKm % 5) * 8) + '%"></i></div>' +
        '<button class="mini-btn" data-opt="' + r.id + '">' + (opt ? 'View plan' : 'Optimize') + '</button></div></div>';
    }).join('');
    $$('[data-opt]').forEach(b => b.onclick = () => {
      const r = db.routes.find(x => x.id === b.dataset.opt);
      if (!r) return;
      if (!db.meta.optimized) { db.meta.optimized = true; addAlert('low', 'Route Optimized', r.name + ' optimized: ' + (r.baseFuel - r.optFuel).toFixed(1) + ' L saved.'); save(); }
      toast(r.name + ' — ' + (r.baseFuel - r.optFuel).toFixed(1) + ' L per cycle saved.');
      renderRoutes();
    });
  }

  /* ================= DISPATCH ================= */
  function renderDispatch() {
    const onRoute = db.vehicles.filter(v => v.status === 'On Route').length;
    const noDriver = db.vehicles.filter(v => !v.driverId).length;
    const onDuty = db.drivers.filter(d => d.status === 'On Duty').length;
    kpis($('#dispatchKpis'), [
      { l: 'Dispatched', v: onRoute, f: 'Vehicles on route', i: 'truck', c: GREEN, s: GREENS },
      { l: 'Awaiting Driver', v: noDriver, f: 'Unassigned vehicles', i: 'user', c: AMBER, s: AMBERS },
      { l: 'Drivers On Duty', v: onDuty, f: 'Available for dispatch', i: 'user', c: BLUE, s: BLUES },
      { l: 'Idle Vehicles', v: db.vehicles.filter(v => v.status === 'Idle').length, f: 'Ready to dispatch', i: 'clock', c: AMBER, s: AMBERS },
      { l: 'In Maintenance', v: db.vehicles.filter(v => v.status === 'Maintenance').length, f: 'Not available', i: 'alert', c: RED, s: REDS }
    ]);
    $('#dispatchTable').innerHTML = '<thead><tr><th>Vehicle</th><th>Driver</th><th>Route</th><th>Shift</th><th>Status</th><th class="right">Action</th></tr></thead><tbody>' +
      db.vehicles.map(v => {
        const driversOpts = '<option value="">— Unassigned —</option>' + db.drivers.map(d => '<option value="' + d.id + '"' + (v.driverId === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>').join('');
        const routeOpts = '<option value="">— No route —</option>' + db.routes.map(r => '<option value="' + r.id + '"' + (v.routeId === r.id ? ' selected' : '') + '>' + esc(r.name) + '</option>').join('');
        return '<tr><td><strong>' + v.code + '</strong>' + (deliveriesOf(v.id) ? '<br><small class="muted">' + deliveriesOf(v.id) + ' delivered</small>' : '') + '</td>' +
          '<td><select class="mini-input" data-vdr="' + v.id + '">' + driversOpts + '</select></td>' +
          '<td><select class="mini-input" data-vroute="' + v.id + '">' + routeOpts + '</select></td>' +
          '<td>' + esc(v.shift) + '</td><td>' + statusBadge(v.status) + '</td>' +
          '<td class="right"><button class="mini-btn" data-locate="' + v.id + '" title="Show on Live GPS Map">Locate</button> ' + (v.status === 'On Route'
            ? '<button class="mini-btn red" data-recall="' + v.id + '">Recall</button>'
            : '<button class="mini-btn" data-dispatch="' + v.id + '">Dispatch</button>') + '</td></tr>';
      }).join('') + '</tbody>';
    $('#driverTable').innerHTML = '<thead><tr><th>Driver</th><th>License</th><th>Contact</th><th>Shift</th><th>Status</th><th>Assigned Vehicle</th></tr></thead><tbody>' +
      db.drivers.map(d => {
        const v = vehicleOfDriver(d);
        return '<tr><td><button class="link-btn" data-driver-track="' + d.id + '">' + esc(d.name) + '</button></td><td>' + esc(d.license) + '</td><td>' + esc(d.phone) + '</td><td>' + esc(d.shift) + '</td>' +
          '<td><span class="badge ' + (d.status === 'On Duty' ? 'ok' : 'gray') + '">' + d.status + '</span></td><td>' + (v ? '<button class="link-btn" data-track="' + v.id + '">' + v.code + '</button>' : '—') + '</td></tr>';
      }).join('') + '</tbody>';

    $$('[data-vdr]').forEach(s => s.onchange = () => {
      const v = db.vehicles.find(x => x.id === s.dataset.vdr);
      v.driverId = s.value || null; const d = driverOf(v); v.shift = d ? d.shift : v.shift;
      save(); renderDispatch(); toast('Driver assignment updated.');
    });
    $$('[data-vroute]').forEach(s => s.onchange = () => {
      const v = db.vehicles.find(x => x.id === s.dataset.vroute);
      v.routeId = s.value || null; save(); renderDispatch(); toast('Route assignment updated.');
    });
    $$('[data-dispatch]').forEach(b => b.onclick = () => {
      const v = db.vehicles.find(x => x.id === b.dataset.dispatch);
      if (!v.driverId) return toast('Assign a driver first.', true);
      if (!v.routeId) return toast('Assign a route first.', true);
      v.status = 'On Route'; v.progress = 0.03; save(); renderDispatch(); toast(v.code + ' dispatched on ' + routeOf(v).name + '.');
    });
    $$('[data-recall]').forEach(b => b.onclick = () => {
      const v = db.vehicles.find(x => x.id === b.dataset.recall);
      v.status = 'Idle'; save(); renderDispatch(); toast(v.code + ' recalled and marked idle.');
    });
    $('#autoAssignBtn').onclick = () => {
      const free = db.drivers.filter(d => d.status === 'On Duty' && !vehicleOfDriver(d));
      let n = 0;
      db.vehicles.forEach(v => { if (!v.driverId && free.length) { const d = free.shift(); v.driverId = d.id; v.shift = d.shift; n++; } });
      save(); renderDispatch(); toast(n + ' drivers auto-assigned.');
    };
    $$('[data-locate]', $('#dispatchTable')).forEach(b => b.onclick = () => trackVehicle(b.dataset.locate));
    $$('[data-track]', $('#driverTable')).forEach(b => b.onclick = () => trackVehicle(b.dataset.track));
    $$('[data-driver-track]', $('#driverTable')).forEach(b => b.onclick = () => {
      const d = db.drivers.find(x => x.id === b.dataset.driverTrack);
      const v = d && vehicleOfDriver(d);
      if (v) trackVehicle(v.id); else toast('This driver has no assigned vehicle.', true);
    });
  }

  /* ================= FUEL ================= */
  function renderFuel() {
    const low = db.vehicles.filter(v => v.fuel < 30);
    const idleTotal = db.vehicles.reduce((s, v) => s + v.idleMin, 0);
    const fuelCost = db.vehicles.reduce((s, v) => s + v.fuelUsed, 0) * 3.2;
    const saved = db.routes.reduce((s, r) => s + (r.baseFuel - r.optFuel), 0) * 3.2 * 260;
    kpis($('#fuelKpis'), [
      { l: "Today's Fuel Cost", v: money(fuelCost), f: 'Fleet-wide estimate', i: 'fuel', c: GREEN, s: GREENS },
      { l: 'Total Idle Time', v: idleTotal + ' min', f: 'Across 50 vehicles', i: 'clock', c: AMBER, s: AMBERS },
      { l: 'Low Fuel Vehicles', v: low.length, f: 'Below 30% tank', i: 'alert', c: RED, s: REDS },
      { l: 'Est. Yearly Saving', v: money(saved), f: 'With route optimization', i: 'chart', c: GREEN, s: GREENS },
      { l: 'Fuel Price Used', v: '$3.20/L', f: 'Planning assumption', i: 'leaf', c: BLUE, s: BLUES }
    ]);
    const top = db.vehicles.slice().sort((a, b) => b.idleMin - a.idleMin).slice(0, 10);
    const max = Math.max(1, top[0].idleMin);
    $('#idleChart').innerHTML = top.map(v => '<div class="hrow"><div class="name">' + v.code + '</div><div class="htrack"><div class="hfill amber" style="width:' + (v.idleMin / max * 100) + '%"></div></div><div class="hval">' + v.idleMin + ' min</div></div>').join('');
    $('#fuelList').innerHTML = low.length ? low.slice(0, 10).map(v => '<div class="fuel-row"><strong>' + v.code + '</strong><div class="fuel-track"><div class="fuel-fill low" style="width:' + v.fuel + '%"></div></div><span>' + v.fuel + '%</span><button class="mini-btn" data-refuel="' + v.id + '">Refuel</button></div>').join('') : '<div class="sel-empty">All vehicles above 30%.</div>';
    const list = db.vehicles.slice().sort((a, b) => a.fuel - b.fuel).slice(0, 15);
    $('#fuelTable').innerHTML = '<thead><tr><th>Vehicle</th><th>Driver</th><th>Status</th><th>Fuel Level</th><th class="right">Fuel Used</th><th class="right">Est. Cost</th><th class="right">Idle</th><th></th></tr></thead><tbody>' +
      list.map(v => '<tr><td><strong>' + v.code + '</strong></td><td>' + esc(driverOf(v) ? driverOf(v).name : 'Unassigned') + '</td><td>' + statusBadge(v.status) + '</td>' +
        '<td><div class="fuel-track" style="width:90px"><div class="fuel-fill ' + (v.fuel < 30 ? 'low' : v.fuel < 50 ? 'mid' : '') + '" style="width:' + v.fuel + '%"></div></div> ' + v.fuel + '%</td>' +
        '<td class="right">' + v.fuelUsed.toFixed(1) + ' L</td><td class="right">' + money(v.fuelUsed * 3.2) + '</td><td class="right">' + v.idleMin + 'm</td>' +
        '<td class="right"><button class="mini-btn" data-refuel="' + v.id + '">Refuel</button></td></tr>').join('') + '</tbody>';
    $$('[data-refuel]').forEach(b => b.onclick = () => {
      const v = db.vehicles.find(x => x.id === b.dataset.refuel);
      v.fuel = 100; v.idleMin = Math.max(3, Math.round(v.idleMin * 0.4));
      addAlert('low', 'Refuel Logged', v.code + ' refueled to 100%.'); save(); renderFuel(); toast(v.code + ' refueled to 100%.');
    });
  }

  /* ================= DRIVER APP ================= */
  function renderDriverApp() {
    const sel = $('#driverSelect');
    const opts = db.drivers.filter(d => vehicleOfDriver(d));
    sel.innerHTML = opts.map(d => '<option value="' + d.id + '"' + (appDriver === d.id ? ' selected' : '') + '>' + esc(d.name) + ' — ' + vehicleOfDriver(d).code + '</option>').join('');
    if (!appDriver || !opts.find(d => d.id === appDriver)) appDriver = opts[0] ? opts[0].id : null;
    sel.value = appDriver;
    renderPhone();
    renderGensanMaps();
  }
  function renderPhone() {
    const d = db.drivers.find(x => x.id === appDriver), v = vehicleOfDriver(d);
    const screen = $('#phoneScreen');
    if (!d || !v) { screen.innerHTML = '<div class="sel-empty">No assigned driver found.</div>'; return; }
    const r = routeOf(v);
    const head = '<div class="app-head"><div class="lg-mark"><svg><use href="#i-leaf"/></svg></div><div><h4>GreenLeaf Driver</h4><small>FleetForward mobile app · demo</small></div></div>' +
      '<div class="greeting"><small>Today · ' + esc(d.shift) + '</small><strong>Hello, ' + esc(d.name.split(' ')[0]) + ' 👋</strong></div>';
    if (appScreen === 'jobs') {
      const acceptedJob = accepted[v.id];
      screen.innerHTML = head +
        '<div class="job-card"><div class="job-top"><b>Assigned Vehicle</b><span class="badge ok">' + v.code + '</span></div>' +
        '<div class="job-route">' + esc(v.model) + ' · ' + esc(v.plate) + '</div>' +
        '<div class="job-meta"><span>Fuel ' + v.fuel + '%</span><span>Idle ' + v.idleMin + ' min</span><span>Delivered ' + deliveriesOf(v.id) + '</span></div></div>' +
        (r ? '<div class="job-card"><div class="job-top"><b>' + esc(r.name) + '</b><span class="badge blue">' + r.id + '</span></div>' +
          '<div class="job-route">' + esc(r.origin) + ' → ' + esc(r.destination) + '</div>' +
          '<div class="job-meta"><span>' + r.distanceKm + ' km</span><span>ETA ' + r.etaMin + ' min</span><span>' + r.stops + ' stops</span></div>' +
          '<div class="job-btns">' +
          (acceptedJob ? '<button class="btn btn-ghost" data-app="decline">Cancel Job</button><button class="btn btn-primary" data-app="nav">' + icon('nav') + ' Start Navigation</button>'
            : '<button class="btn btn-primary" data-app="accept">' + icon('check') + ' Accept Job</button>') +
          '</div></div>' : '<div class="app-status">No route assigned to this vehicle. Assign one in Dispatch.</div>') +
        '<div class="app-status"><strong>Quick actions</strong><div class="job-btns" style="margin-top:8px"><button class="btn btn-ghost" data-app="fuel">' + icon('fuel') + ' Log Fuel</button><button class="btn btn-ghost" data-app="status">' + icon('check') + ' Check In</button></div></div>';
    } else if (appScreen === 'nav') {
      screen.innerHTML = head +
        '<div class="nav-screen"><svg viewBox="0 0 300 130"><rect width="300" height="130" fill="#e8f2ea"/><path d="M20 110 L90 80 L150 90 L220 40 L280 25" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="M20 110 L90 80 L150 90 L220 40 L280 25" fill="none" stroke="#16a34a" stroke-width="4" stroke-dasharray="7 6"/><circle cx="90" cy="80" r="7" fill="#3b82f6" stroke="#fff" stroke-width="3"/><circle cx="280" cy="25" r="8" fill="#16a34a" stroke="#fff" stroke-width="3"/></svg>' +
        '<strong style="font-size:13px">Navigating to ' + esc(gensanPlaceOf(r) ? gensanPlaceOf(r).name : (r ? r.destination : 'destination')) + '</strong><div class="muted small">' + (r ? r.distanceKm + ' km · ETA ' + r.etaMin + ' min' : '') + '</div>' +
        '<div class="job-meta"><span>Left depot <b>' + esc(v.departedAt || '—') + '</b></span><span>Arrived <b>' + esc(v.arrivedAt || '—') + '</b></span></div></div>' +
        '<div class="job-card"><div class="job-top"><b>Cargo Load</b><span class="badge blue">' + esc(truckForLoad(selectedLoadKg).cls) + '</span></div>' +
        '<label class="field">Select delivery weight<select id="loadSelect" class="select full">' +
        [1500, 3500, 5000, 6200, 8600].map(kg => '<option value="' + kg + '"' + (selectedLoadKg === kg ? ' selected' : '') + '>' + kg.toLocaleString() + ' kg</option>').join('') +
        '</select></label><div class="job-meta"><span>Recommended truck <b>' + esc(truckForLoad(selectedLoadKg).model) + '</b></span><span>Capacity <b>' + truckForLoad(selectedLoadKg).maxKg.toLocaleString() + ' kg</b></span></div></div>' +
        '<div class="job-card"><div class="step"><i>1</i> Continue on Depot Access Road — 1.2 km</div><div class="step"><i>2</i> Turn right onto Main Avenue — 3.8 km</div><div class="step"><i>3</i> Follow route ' + (r ? r.id : '—') + ' to ' + esc(gensanPlaceOf(r) ? gensanPlaceOf(r).name : (r ? r.destination : 'destination')) + '</div></div>' +
        '<div class="job-btns"><button class="btn btn-ghost" data-app="jobs">Back</button>' +
        (v.arrivedAt ? '<span class="badge ok">Arrived ' + esc(v.arrivedAt) + '</span>' : '<button class="btn btn-ghost" data-app="arrive">' + icon('map') + ' Mark Arrived</button>') +
        '<button class="btn btn-primary" data-app="complete">' + icon('check') + ' Complete Delivery</button></div>' +
        '<div class="info-card">Navigation is simulated. The <b>Google Maps</b> panel below opens the real destination in Google Maps.</div>';
    } else {
      const last = (db.deliveries || []).find(x => x.vehicleId === v.id);
      screen.innerHTML = head + '<div class="done-hero">' + icon('check') + '<strong>DELIVERED</strong><small>Proof of delivery recorded</small></div>' +
        '<div class="job-card"><div class="job-top"><b>' + esc(last ? last.destination : (gensanPlaceOf(r) ? gensanPlaceOf(r).name : (r ? r.destination : 'Destination'))) + '</b><span class="badge ok">Delivered</span></div>' +
        '<div class="job-route">' + esc(v.code) + ' · ' + esc(r ? r.name : 'Route') + '</div>' +
        '<div class="job-meta"><span>Left <b>' + esc((last && last.departedAt) || v.departedAt || '—') + '</b></span><span>Arrived <b>' + esc((last && last.arrivedAt) || v.arrivedAt || '—') + '</b></span><span>Delivered <b>' + esc(last ? last.time : now()) + '</b></span></div>' +
        '<div class="job-meta"><span>' + esc(d.name) + '</span><span>Load <b>' + Number((last && last.loadKg) || selectedLoadKg).toLocaleString() + ' kg</b></span><span> Truck <b>' + esc((last && last.recommendedTruck) || truckForLoad(selectedLoadKg).model) + '</b></span></div>' +
        '<div class="job-meta"><span>ID ' + esc(last ? last.id : '—') + '</span></div>' +
        '<div class="job-btns"><button class="btn btn-primary" data-app="jobs">Back to Jobs</button></div></div>' +
        '<div class="info-card">Admin sees this delivery and its times in the Dashboard, Live GPS Map, Vehicle Board, notifications, and Fleet Reports — synced instantly.</div>';
    }
    $$('[data-app]', screen).forEach(b => b.onclick = () => {
      const act = b.dataset.app, vv = db.vehicles.find(x => x.id === v.id);
      if (act === 'accept') { accepted[v.id] = true; toast('Job accepted — ' + v.code); }
      if (act === 'decline') { accepted[v.id] = false; appScreen = 'jobs'; toast('Job cancelled.'); }
      if (act === 'nav') {
        appScreen = 'nav';
        vv.departedAt = now(); vv.arrivedAt = null; vv.status = 'On Route';
        notify('Departed', vv.code + ' left the depot', d.name + ' departed at ' + vv.departedAt + ' for ' + (gensanPlaceOf(r) ? gensanPlaceOf(r).name : (r ? r.destination : 'delivery')) + '.', { vehicleId: vv.id, driverId: d.id });
        addAlert('low', 'Trip Started', vv.code + ' left the depot at ' + vv.departedAt + ' — ' + d.name + '.');
        toast('Departure recorded at ' + vv.departedAt + '.');
      }
      if (act === 'arrive') {
        vv.arrivedAt = now(); vv.status = 'Idle';
        notify('Arrived', vv.code + ' arrived', d.name + ' arrived at ' + (gensanPlaceOf(r) ? gensanPlaceOf(r).name : 'the delivery point') + ' at ' + vv.arrivedAt + '.', { vehicleId: vv.id, driverId: d.id });
        addAlert('low', 'Arrival Confirmed', vv.code + ' arrived at ' + (gensanPlaceOf(r) ? gensanPlaceOf(r).name : 'destination') + ' at ' + vv.arrivedAt + '.');
        toast('Arrival confirmed at ' + vv.arrivedAt + '.');
      }
      if (act === 'jobs') { appScreen = 'jobs'; }
      if (act === 'fuel') { vv.fuel = 100; addAlert('low', 'Refuel Logged', vv.code + ' refueled from driver app.'); toast('Fuel logged — tank full.'); }
      if (act === 'status') { vv.status = 'Idle'; addAlert('low', 'Driver Check-in', vv.code + ' checked in by ' + d.name + '.'); toast('Check-in recorded.'); }
      if (act === 'complete') {
        vv.status = 'Idle'; vv.progress = 0.02; appScreen = 'done';
        const dest = gensanPlaceOf(r);
        if (!vv.departedAt) vv.departedAt = now();
        if (!vv.arrivedAt) vv.arrivedAt = now();
        const rec = {
          id: 'DL' + Date.now(), vehicleId: vv.id, code: vv.code,
          driverId: d.id, driverName: d.name,
          routeId: v.routeId || '', routeName: r ? r.name : '—',
          destination: dest ? dest.name : (r ? r.destination : 'Destination'),
          placeId: dest ? dest.id : '', departedAt: vv.departedAt, arrivedAt: vv.arrivedAt,
          loadKg: selectedLoadKg, truckModel: vv.model, recommendedTruck: truckForLoad(selectedLoadKg).model,
          time: now(), status: 'Delivered'
        };
        if (!Array.isArray(db.deliveries)) db.deliveries = [];
        db.deliveries.unshift(rec);
        vv.deliveredCount = (vv.deliveredCount || 0) + 1;
        vv.loadKg = selectedLoadKg;
        vv.lastDelivery = { time: rec.time, destination: rec.destination, routeName: rec.routeName, placeId: rec.placeId };
        notify('Delivered', vv.code + ' delivered', d.name + ' delivered to ' + rec.destination + ' at ' + rec.time + '. Left depot ' + rec.departedAt + ', arrived ' + rec.arrivedAt + '.', { vehicleId: vv.id, driverId: d.id });
        addAlert('low', 'Delivery Complete', vv.code + ' delivered to ' + rec.destination + ' by ' + d.name + '.');
        toast('Delivered to ' + rec.destination + ' — admin synced.');
        renderNotifications(); renderGensanMaps();
      }
      save(); renderPhone();
      if (act === 'complete' || act === 'nav' || act === 'arrive') pushShared();
    });
    const loadSel = $('#loadSelect', screen);
    if (loadSel) loadSel.onchange = e => { selectedLoadKg = Number(e.target.value) || 6200; renderPhone(); };
    renderGensanMaps();
  }

  /* ================= REPORTS ================= */
  function renderReports() {
    if (!$('#repFrom').value) $('#repFrom').value = new Date(Date.now() - 6 * 864e5).toLocaleDateString('en-CA');
    if (!$('#repTo').value) $('#repTo').value = new Date().toLocaleDateString('en-CA');
    const onRoute = db.vehicles.filter(v => v.status === 'On Route').length;
    const fuel = db.vehicles.reduce((s, v) => s + v.fuelUsed, 0);
    const dist = db.routes.reduce((s, r) => s + r.distanceKm, 0) * onRoute;
    kpis($('#reportKpis'), [
      { l: 'Active Deliveries', v: onRoute, f: 'Vehicles on route', i: 'truck', c: GREEN, s: GREENS },
      { l: 'Fuel Consumed', v: fuel.toFixed(1) + ' L', f: '≈ ' + money(fuel * 3.2), i: 'fuel', c: AMBER, s: AMBERS },
      { l: 'Distance Covered', v: dist.toLocaleString() + ' km', f: 'Planned cycle total', i: 'map', c: BLUE, s: BLUES },
      { l: 'Efficiency Score', v: db.meta.optimized ? '92%' : '74%', f: db.meta.optimized ? 'After optimization' : 'Before optimization', i: 'chart', c: GREEN, s: GREENS },
      { l: 'Open Alerts', v: db.alerts.length, f: 'Requires attention', i: 'bell', c: RED, s: REDS },
      { l: 'Delivered Today', v: deliveredTotal(), f: 'Synced from driver app', i: 'check', c: GREEN, s: GREENS }
    ]);
    renderDeliveries();
    renderGensanMaps();
    renderTruckStatusReport();
    renderDeliveryReport();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const vals = days.map((_, i) => 210 + ((i * 67) % 190));
    const mx = Math.max(...vals);
    $('#costChart').innerHTML = days.map((d, i) => '<div class="bar-col"><div class="bar-value">$' + Math.round(vals[i]) + '</div><div class="bar" style="height:' + (vals[i] / mx * 76) + '%"></div><div class="bar-label">' + d + '</div></div>').join('');
    const rr = db.routes.map(r => ({ name: r.name, save: r.baseFuel - r.optFuel })).sort((a, b) => b.save - a.save);
    const rmax = Math.max(...rr.map(r => r.save));
    $('#effChart').innerHTML = rr.map(r => '<div class="hrow"><div class="name">' + esc(r.name) + '</div><div class="htrack"><div class="hfill" style="width:' + (r.save / rmax * 100) + '%"></div></div><div class="hval">' + r.save.toFixed(1) + ' L</div></div>').join('');
    $('#alertTable').innerHTML = '<thead><tr><th>Time</th><th>Type</th><th>Severity</th><th>Message</th></tr></thead><tbody>' +
      db.alerts.map(a => '<tr><td>' + esc(a.time) + '</td><td>' + esc(a.type) + '</td><td><span class="badge ' + (a.sev === 'high' ? 'bad' : a.sev === 'low' ? 'blue' : 'warn') + '">' + a.sev + '</span></td><td>' + esc(a.msg) + '</td></tr>').join('') + '</tbody>';
    $('#exportVehicles').onclick = () => exportCSV('fleetforward_vehicles.csv', ['Code', 'Plate', 'Model', 'Driver', 'Route', 'Status', 'Fuel%', 'Idle(min)', 'Odometer'],
      db.vehicles.map(v => [v.code, v.plate, v.model, driverOf(v) ? driverOf(v).name : '', routeOf(v) ? routeOf(v).name : '', v.status, v.fuel, v.idleMin, v.odometer]));
    $('#exportRoutes').onclick = () => exportCSV('fleetforward_routes.csv', ['ID', 'Route', 'Origin', 'Destination', 'Distance(km)', 'ETA(min)', 'Current Fuel(L)', 'Optimized Fuel(L)', 'Saved(L)'],
      db.routes.map(r => [r.id, r.name, r.origin, r.destination, r.distanceKm, r.etaMin, r.baseFuel, r.optFuel, (r.baseFuel - r.optFuel).toFixed(1)]));
    $('#exportAlerts').onclick = () => exportCSV('fleetforward_alerts.csv', ['Time', 'Type', 'Severity', 'Message'], db.alerts.map(a => [a.time, a.type, a.sev, a.msg]));
    $('#exportDeliveries').onclick = () => exportCSV('fleetforward_deliveries.csv', ['Departed', 'Arrived', 'Delivered', 'Delivery ID', 'Vehicle', 'Driver', 'Route', 'Destination', 'Load(kg)', 'Recommended truck', 'Status'],
      (db.deliveries || []).map(x => [x.departedAt || '—', x.arrivedAt || '—', x.time, x.id, x.code, x.driverName, x.routeName, x.destination, x.loadKg || 0, x.recommendedTruck || truckForLoad(x.loadKg).model, x.status]));
    $('#exportTruckStatus').onclick = () => exportCSV('fleetforward_truck_status.csv', ['Status', 'Vehicles', 'Share(%)'],
      truckStatusStats().map(r => [r.status, r.count, r.pct]));
  }
  function renderDeliveries() {
    const list = db.deliveries || [];
    $('#deliveredCountChip').textContent = list.length + ' delivered';
    $('#deliveryTable').innerHTML = '<thead><tr><th>Left depot</th><th>Arrived</th><th>Delivered</th><th>Delivery</th><th>Vehicle</th><th>Driver</th><th>Route</th><th>Delivered at</th><th>Load</th><th>Recommended truck</th><th>Status</th></tr></thead><tbody>' +
      (list.length ? list.map(x =>
        '<tr><td><span class="time-pill">' + esc(x.departedAt || '—') + '</span></td><td>' + esc(x.arrivedAt || '—') + '</td><td>' + esc(x.time) + '</td>' +
        '<td><strong>' + esc(x.id) + '</strong></td><td>' + esc(x.code) + '</td>' +
        '<td>' + esc(x.driverName) + '</td><td>' + esc(x.routeName) + '</td><td>' + esc(x.destination) + '</td>' +
        '<td class="right">' + Number(x.loadKg || 0).toLocaleString() + ' kg</td>' +
        '<td>' + esc(x.recommendedTruck || truckForLoad(x.loadKg).model) + '</td>' +
        '<td><span class="badge ok">Delivered</span></td></tr>').join('')
        : '<tr><td colspan="11" class="center muted">No deliveries completed yet.</td></tr>') + '</tbody>';
  }
  function exportCSV(name, head, rows) {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = [head.map(q).join(','), ...rows.map(r => r.map(q).join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800); toast(name + ' downloaded.');
  }

  /* ================= LOAD / TRUCK STATUS / DELIVERY REPORT ================= */
  function renderLoadStats() {
    const s = loadStats();
    const chip = $('#heavyLoadChip'); if (chip) chip.textContent = s.heavy + ' heavy loads';
    const host = $('#loadStats'); if (!host) return;
    host.innerHTML = s.buckets.map(b =>
      '<div class="load-stat"><div class="ls-top"><strong>' + esc(b.model) + '</strong><span class="ls-cap">' + b.maxKg.toLocaleString() + ' kg max</span></div>' +
      '<div class="bar"><i style="width:' + (b.count / s.max * 100) + '%"></i></div>' +
      '<small>' + b.cls + ' · ' + b.count + ' delivery' + (b.count === 1 ? '' : 's') + '</small></div>'
    ).join('') + '<div class="load-stat"><div class="ls-top"><strong>Total cargo</strong><span class="ls-cap">all deliveries</span></div>' +
      '<div class="bar"><i style="width:100%"></i></div><small>' + s.totalKg.toLocaleString() + ' kg moved</small></div>';
  }
  function renderTruckStatusReport() {
    const rows = truckStatusStats();
    const host = $('#truckStatusTable'); if (!host) return;
    host.innerHTML = '<table class="table"><thead><tr><th>Status</th><th class="right">Vehicles</th><th class="right">Share</th><th>Distribution</th></tr></thead><tbody>' +
      rows.map(r => '<tr><td>' + statusBadge(r.status) + '</td><td class="right"><strong>' + r.count + '</strong></td><td class="right">' + r.pct + '%</td>' +
        '<td><div class="fuel-track" style="width:100%;max-width:260px"><div class="fuel-fill" style="width:' + r.pct + '%"></div></div></td></tr>').join('') +
      '<tr><td><strong>Total</strong></td><td class="right"><strong>' + db.vehicles.length + '</strong></td><td class="right">100%</td><td>—</td></tr></tbody></table>';
  }
  function deliveryReportHTML(latest) {
    if (!latest) return '<div class="sel-empty">No delivery has been completed yet. The report appears here as soon as the driver taps Complete Delivery.</div>';
    const recTruck = latest.recommendedTruck || truckForLoad(latest.loadKg).model;
    return '<div class="gmap-bar"><span><strong>Delivered to ' + esc(latest.destination) + '</strong></span><span>Powered by Google Maps</span></div>' +
      '<iframe class="gmap-frame" src="' + esc(gmapEmbed(latest.destination)) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Delivered location — ' + esc(latest.destination) + '"></iframe>' +
      '<div class="gmap-foot"><span>Map shown to driver before completion</span><a href="' + esc(gmapDirections(GENSAN_ORIGIN, latest.destination)) + '" target="_blank" rel="noopener">Open driving directions in Google Maps ↗</a></div>' +
      '<div class="report-details">' +
      '<div class="report-detail"><span>Delivery ID</span><b>' + esc(latest.id) + '</b></div>' +
      '<div class="report-detail"><span>Vehicle</span><b>' + esc(latest.code) + '</b></div>' +
      '<div class="report-detail"><span>Driver</span><b>' + esc(latest.driverName) + '</b></div>' +
      '<div class="report-detail"><span>Route</span><b>' + esc(latest.routeName) + '</b></div>' +
      '<div class="report-detail"><span>Cargo load</span><b>' + Number(latest.loadKg || 0).toLocaleString() + ' kg</b></div>' +
      '<div class="report-detail"><span>Recommended truck</span><b>' + esc(recTruck) + '</b></div>' +
      '<div class="report-detail"><span>Left depot</span><b>' + esc(latest.departedAt || '—') + '</b></div>' +
      '<div class="report-detail"><span>Arrived</span><b>' + esc(latest.arrivedAt || '—') + '</b></div>' +
      '<div class="report-detail ok"><span>Delivered</span><b>' + esc(latest.time) + '</b></div>' +
      '<div class="report-detail ok"><span>Status</span><b>Delivered</b></div>' +
      '</div>';
  }
  function renderDeliveryReport() {
    const latest = (db.deliveries || [])[0] || null;
    const label = latest ? latest.code + ' · ' + latest.destination : 'No delivery yet';
    const a = $('#deliveryReport'); if (a) a.innerHTML = deliveryReportHTML(latest);
    const b = $('#deliveryReportAdmin'); if (b) b.innerHTML = deliveryReportHTML(latest);
    const c1 = $('#dashReportChip'); if (c1) c1.textContent = label;
    const c2 = $('#adminReportChip'); if (c2) c2.textContent = label;
  }

  /* ================= DASHBOARD / NOTIFICATIONS / USERS ================= */
  function renderDashboard() {
    kpis($('#dashboardKpis'), [
      { l: 'Vehicles On Route', v: db.vehicles.filter(v => v.status === 'On Route').length, f: 'Currently moving', i: 'truck', c: GREEN, s: GREENS },
      { l: 'Departed Today', v: departedTotal(), f: 'Departure times recorded', i: 'clock', c: BLUE, s: BLUES },
      { l: 'Delivered Today', v: deliveredTotal(), f: 'Synced from driver app', i: 'check', c: GREEN, s: GREENS },
      { l: 'Unread Notifications', v: unreadTotal(), f: 'Arrival / delivery confirmations', i: 'bell', c: AMBER, s: AMBERS },
      { l: 'Active Users', v: activeUserTotal(), f: 'Admin, dispatcher, driver', i: 'user', c: BLUE, s: BLUES },
      { l: 'Open Alerts', v: db.alerts.length, f: 'Requires attention', i: 'alert', c: RED, s: REDS }
    ]);
    const notes = (db.notifications || []).slice(0, 10);
    $('#dashUnread').textContent = unreadTotal() + ' unread';
    $('#activityFeed').innerHTML = notes.length ? notes.map(n => {
      const cls = n.type === 'Departed' ? 'warn' : n.type === 'Arrived' ? 'alert' : '';
      return '<div class="activity-row ' + cls + '"><div class="act-ico">' + icon(n.type === 'Delivered' ? 'check' : n.type === 'Arrived' ? 'map' : 'clock') + '</div>' +
        '<div><strong>' + esc(n.title) + '</strong><small>' + esc(n.msg) + '</small></div><time>' + esc(n.time) + '</time></div>';
    }).join('') : '<div class="sel-empty">No activity recorded yet.</div>';
    $('#dashDeliveries').innerHTML = (db.deliveries || []).length ? (db.deliveries || []).slice(0, 5).map(x =>
      '<div class="dash-delivery"><div class="top"><strong>' + esc(x.code) + ' · ' + esc(x.destination) + '</strong><span class="badge ok">Delivered</span></div>' +
      '<div class="times"><span>Left <b>' + esc(x.departedAt || '—') + '</b></span><span>Arrived <b>' + esc(x.arrivedAt || '—') + '</b></span><span>Delivered <b>' + esc(x.time) + '</b></span></div></div>'
    ).join('') : '<div class="sel-empty">No deliveries completed yet.</div>';
    renderLoadStats();
    renderDeliveryReport();
  }
  function renderNotifications() {
    const isDriver = !!(session && session.role === 'driver');
    const all = db.notifications || [];
    const list = isDriver ? all.filter(n => n.driverId === session.driverId) : all;
    const unread = list.filter(n => !n.read).length;
    $('#bellCount').textContent = unread;
    $('#bellCount').classList.toggle('hidden', unread === 0);
    $('#notifSubtitle').textContent = isDriver ? 'Your departure, arrival, and delivery confirmations' : 'Fleet-wide departure, arrival, and delivery confirmations';
    $('#notifList').innerHTML = list.length ? list.map(n =>
      '<div class="notif-item ' + (n.read ? '' : 'unread') + '"><div class="n-top"><strong>' + esc(n.title) + '</strong>' +
      '<span class="badge ' + (n.type === 'Delivered' ? 'ok' : n.type === 'Arrived' ? 'warn' : 'blue') + '">' + esc(n.type) + '</span></div>' +
      '<p>' + esc(n.msg) + '</p><time>' + esc(n.time) + '</time></div>'
    ).join('') : '<div class="sel-empty">No notifications yet.</div>';
  }
  function renderUsers() {
    const users = db.users || [];
    $('#userCountChip').textContent = users.length + ' users';
    kpis($('#userKpis'), [
      { l: 'Total Users', v: users.length, f: 'Demo accounts', i: 'user', c: BLUE, s: BLUES },
      { l: 'Active Users', v: activeUserTotal(), f: 'Can sign in', i: 'check', c: GREEN, s: GREENS },
      { l: 'Driver Accounts', v: users.filter(u => u.role === 'Driver').length, f: 'Linked to drivers', i: 'truck', c: GREEN, s: GREENS },
      { l: 'Admins', v: users.filter(u => u.role === 'Admin').length, f: 'Full module access', i: 'lock', c: AMBER, s: AMBERS }
    ]);
    $('#userTable').innerHTML = '<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Linked driver</th><th>Status</th><th class="right">Actions</th></tr></thead><tbody>' +
      users.map(u => {
        const drv = db.drivers.find(d => d.id === u.driverId);
        const locked = !!u.builtIn;
        return '<tr><td><strong>' + esc(u.name) + '</strong>' + (locked ? ' <span class="badge gray">demo</span>' : '') + '</td>' +
          '<td>' + esc(u.email) + '</td><td>' + esc(u.role) + '</td><td>' + esc(drv ? drv.name : '—') + '</td>' +
          '<td><span class="badge ' + (u.status === 'Active' ? 'ok' : 'warn') + '">' + esc(u.status) + '</span></td>' +
          '<td class="right"><button class="mini-btn" data-user-action="reset" data-id="' + esc(u.id) + '">Reset pass</button>' +
          (locked ? '' : '<button class="mini-btn" data-user-action="toggle" data-id="' + esc(u.id) + '">' + (u.status === 'Active' ? 'Deactivate' : 'Activate') + '</button>' +
            '<button class="mini-btn red" data-user-action="delete" data-id="' + esc(u.id) + '">Delete</button>') + '</td></tr>';
      }).join('') + '</tbody>';
    const sel = $('#userForm [name="driverId"]');
    if (sel) {
      const current = sel.value;
      sel.innerHTML = '<option value="">— None —</option>' + db.drivers.map(d => '<option value="' + d.id + '">' + esc(d.name) + '</option>').join('');
      sel.value = current;
    }
  }

  /* ---------------- shared ---------------- */
  function addAlert(sev, type, msg) {
    db.alerts.unshift({ id: 'A' + Date.now() + Math.random().toString(36).slice(2, 5), sev, type, msg, time: now() });
    if (db.alerts.length > 40) db.alerts.pop();
  }
  const META = {
    map: ['Live GPS Map', 'Real-time fleet visibility across 50 delivery vehicles'],
    dashboard: ['Dashboard', 'Today’s departures, deliveries, users, and confirmations'],
    users: ['User Management', 'Create and manage simulated admin, dispatcher, and driver accounts'],
    routes: ['Smart Route Planning', 'AI-assisted routes to reduce distance, fuel, and idle time'],
    dispatch: ['Dispatch & Drivers', 'Assign vehicles, drivers, and shifts — then dispatch'],
    fuel: ['Fuel & Idle Monitoring', 'Track fuel levels, idle time, and estimated operating cost'],
    driver: ['Driver Mobile App', 'Simulated Samsara-style driver experience'],
    reports: ['Fleet Reports', 'Consolidated performance metrics and alert history']
  };
  function showView(v) {
    if (!META[v]) return;
    if (session && session.role === 'driver' && v !== 'driver') return;
    currentView = v;
    $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === v));
    $('#pageTitle').textContent = META[v][0]; $('#pageSubtitle').textContent = META[v][1];
    $('#sidebar').classList.remove('open');
    $('#notifDrawer').classList.add('hidden');
    render(); renderNotifications();
    if (v === 'reports' || v === 'dashboard') pullShared();
  }
  function render() {
    if (currentView === 'dashboard') renderDashboard();
    if (currentView === 'users') renderUsers();
    if (currentView === 'map') renderMap();
    if (currentView === 'routes') renderRoutes();
    if (currentView === 'dispatch') renderDispatch();
    if (currentView === 'fuel') renderFuel();
    if (currentView === 'driver') renderDriverApp();
    if (currentView === 'reports') renderReports();
  }

  /* ================= ROLE-BASED LOGIN (ADMIN / DRIVER) ================= */
  function saveSession() {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) { /* storage blocked */ }
  }
  function restoreSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && (s.role === 'admin' || (s.role === 'driver' && db.drivers.some(d => d.id === s.driverId)))) return s;
      }
    } catch (e) { /* storage blocked */ }
    return null;
  }
  function applyRole() {
    const isDriver = !!(session && session.role === 'driver');
    $$('.nav-item').forEach(n => n.classList.toggle('hidden', isDriver && n.dataset.view !== 'driver'));
    $('#resetBtn').classList.toggle('hidden', isDriver);
    const d = isDriver ? db.drivers.find(x => x.id === session.driverId) : null;
    if (isDriver && d) {
      const parts = d.name.split(' ');
      $('#adminAvatar').textContent = ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
      $('#adminName').textContent = parts[0] || 'Driver';
      $('#roleMini').textContent = 'DRIVER';
    } else {
      $('#adminAvatar').textContent = 'AD';
      $('#adminName').textContent = 'Admin';
      $('#roleMini').textContent = 'ADMIN';
    }
  }
  function updateLoginRole(role) {
    loginRole = role;
    const isDriver = role === 'driver';
    $$('.role-tab').forEach(t => t.classList.toggle('active', t.dataset.role === role));
    $('#loginKicker').textContent = isDriver ? 'DRIVER ACCESS' : 'ADMIN ACCESS';
    $('#loginTitle').textContent = isDriver ? 'Driver sign in' : 'Welcome back';
    $('#loginDesc').textContent = isDriver ? 'Sign in to see your assigned jobs and routes.' : 'Sign in to open the fleet control dashboard.';
    $('#loginSubmit').innerHTML = icon(isDriver ? 'nav' : 'lock') + (isDriver ? ' Login as Driver' : ' Login as Admin');
    $('#loginEmail').placeholder = isDriver ? DRIVER.email : ADMIN.email;
    $('#demoEmail').textContent = isDriver ? DRIVER.email : ADMIN.email;
    $('#demoPass').textContent = isDriver ? DRIVER.pass : ADMIN.pass;
    $('#loginError').textContent = '';
  }
  function showLogin(msg) {
    $('#loginOverlay').classList.remove('hidden');
    $('#loginError').textContent = msg || '';
    $('#loginPass').value = '';
    updateLoginRole(loginRole);
  }
  function doLogin(email, pass) {
    const mail = String(email || '').trim().toLowerCase();
    const user = (db.users || []).find(u => String(u.email).toLowerCase() === mail && u.status === 'Active');
    if (loginRole === 'admin') {
      if (!user || user.role !== 'Admin' || pass !== user.pass) {
        $('#loginError').textContent = 'Incorrect email or password — use the demo account below.';
        return false;
      }
      session = { role: 'admin' };
      saveSession(); applyRole();
      $('#loginOverlay').classList.add('hidden');
      showView('map'); renderGensanMaps(); renderNotifications();
      toast('Welcome back, Admin.');
      return true;
    }
    const d = user && user.role === 'Driver' ? (db.drivers.find(x => x.id === user.driverId) || db.drivers[0]) : null;
    if (!user || user.role !== 'Driver' || pass !== user.pass || !d) {
      $('#loginError').textContent = 'Driver email or password incorrect — use the demo account below.';
      return false;
    }
    session = { role: 'driver', driverId: d.id };
    appDriver = d.id; appScreen = 'jobs'; accepted = {};
    saveSession(); applyRole();
    $('#loginOverlay').classList.add('hidden');
    showView('driver');
    toast('Signed in as ' + d.name + '.');
    return true;
  }
  function doLogout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* storage blocked */ }
    session = null;
    $$('.nav-item').forEach(n => n.classList.remove('hidden'));
    $('#resetBtn').classList.remove('hidden');
    showLogin();
    toast('Logged out.');
  }

  function init() {
    load();
    session = restoreSession();
    updateLoginRole('admin');
    $('#fillCreds').onclick = () => {
      $('#loginEmail').value = $('#demoEmail').textContent;
      $('#loginPass').value = $('#demoPass').textContent;
      $('#loginError').textContent = '';
      $('#loginPass').focus();
    };
    $$('.role-tab').forEach(t => t.onclick = () => updateLoginRole(t.dataset.role));
    $('#loginForm').addEventListener('submit', e => {
      e.preventDefault();
      doLogin($('#loginEmail').value, $('#loginPass').value);
    });
    $('#logoutBtn').onclick = doLogout;
    if (session) {
      applyRole();
      $('#loginOverlay').classList.add('hidden');
      if (session.role === 'driver') {
        const d = db.drivers.find(x => x.id === session.driverId);
        if (d) { appDriver = d.id; appScreen = 'jobs'; accepted = {}; }
      }
    } else showLogin();
    $$('.nav-item').forEach(b => b.onclick = () => showView(b.dataset.view));
    $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
    $('#pauseBtn').onclick = () => {
      paused = !paused;
      $('#pauseBtn').innerHTML = icon(paused ? 'play' : 'pause') + (paused ? ' Resume' : ' Pause');
      toast(paused ? 'Simulation paused.' : 'Simulation resumed.');
    };
    $('#mapFilter').onchange = e => { mapFilter = e.target.value; drawMarkers(); };
    $('#vehicleSearch').oninput = renderVehicleTable;
    $('#truckMarkers').addEventListener('click', e => {
      const g = e.target.closest('[data-truck]'); if (!g) return;
      selected = g.dataset.truck; infoOpen = true; infoMode = 'truck';
      renderSelected(); drawMarkers(); renderInfoCard();
    });
    $('#mapInfo').addEventListener('click', e => {
      const b = e.target.closest('[data-info]'); if (!b) return;
      const act = b.dataset.info;
      if (act === 'close') { infoOpen = false; renderInfoCard(); }
      if (act === 'truck' || act === 'driver') { infoMode = act; renderInfoCard(); }
      if (act === 'focus') focusSelected();
      if (act === 'call') {
        const v = db.vehicles.find(x => x.id === selected), d = v && driverOf(v);
        toast(d ? 'Simulated call to ' + d.name + ' — ' + d.phone : 'No driver assigned.');
      }
    });
    $('#selBody').addEventListener('click', e => {
      const b = e.target.closest('[data-sel]'); if (!b) return;
      infoOpen = true; infoMode = b.dataset.sel === 'driver' ? 'driver' : 'truck';
      renderInfoCard();
      $('#fleetMap').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        infoOpen = false; renderInfoCard();
        if (mapFocus) { resetView(); renderInfoCard(); }
      }
    });
    window.addEventListener('resize', positionInfoCard);
    window.addEventListener('storage', e => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        const before = deliveredTotal();
        db = JSON.parse(e.newValue);
        if (!Array.isArray(db.deliveries) || !db.deliveries.length) db.deliveries = seedDB().deliveries;
        if (!Array.isArray(db.notifications) || !db.notifications.length) db.notifications = seedDB().notifications;
        render(); renderGensanMaps(); renderNotifications();
        if (deliveredTotal() > before) toast('New delivery synced from the driver app.');
      } catch (err) { /* ignore malformed cross-tab data */ }
    });
    $('#optimizeBtn').onclick = () => {
      db.meta.optimized = true;
      addAlert('low', 'Fleet Optimized', 'All 8 routes optimized. Estimated 29.9 L saved per cycle.');
      save(); renderRoutes(); toast('All routes optimized — fuel savings applied.');
    };
    $('#driverSelect').onchange = e => { appDriver = e.target.value; accepted = {}; appScreen = 'jobs'; renderPhone(); };
    const syncNow = async () => {
      toast('Checking for new deliveries…');
      await pullShared();
      render(); renderNotifications();
    };
    $('#syncNowDash').onclick = syncNow;
    $('#syncNowReports').onclick = syncNow;
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pullShared(); });
    window.addEventListener('focus', pullShared);
    $('#bellBtn').onclick = () => {
      renderNotifications();
      $('#notifDrawer').classList.toggle('hidden');
    };
    $('#notifClose').onclick = () => $('#notifDrawer').classList.add('hidden');
    $('#notifReadAll').onclick = () => {
      (db.notifications || []).forEach(n => { n.read = true; });
      save(); renderNotifications();
      if (currentView === 'dashboard') renderDashboard();
      toast('All notifications marked as read.');
    };
    $$('[data-go]').forEach(b => b.onclick = () => showView(b.dataset.go));
    $('#userForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.currentTarget, el = f.elements, name = el.name.value.trim(), email = el.email.value.trim().toLowerCase(), pass = el.pass.value.trim(), role = el.role.value;
      if (!name || !email || !pass) return toast('Complete all fields.', true);
      if ((db.users || []).some(u => String(u.email).toLowerCase() === email)) return toast('That email is already used.', true);
      if (!Array.isArray(db.users)) db.users = [];
      db.users.push({ id: 'U' + Date.now(), name, email, pass, role, status: 'Active', driverId: el.driverId.value || null });
      f.reset(); save(); renderUsers(); toast('User ' + name + ' created.');
    });
    $('#userTable').addEventListener('click', e => {
      const b = e.target.closest('[data-user-action]'); if (!b) return;
      const u = (db.users || []).find(x => x.id === b.dataset.id); if (!u) return;
      const act = b.dataset.userAction;
      if (act === 'reset') { u.pass = u.role === 'Admin' ? 'admin123' : u.role === 'Driver' ? 'driver123' : 'dispatch123'; toast(u.email + ' password reset to ' + u.pass + '.'); }
      if (act === 'toggle') { u.status = u.status === 'Active' ? 'Inactive' : 'Active'; toast(u.email + ' is now ' + u.status + '.'); }
      if (act === 'delete' && !u.builtIn) { db.users = db.users.filter(x => x.id !== u.id); toast(u.email + ' removed.'); }
      save(); renderUsers();
    });
    $('#resetBtn').onclick = () => {
      if (confirm('Reset all demo data to the original GreenLeaf fleet?')) {
        db = seedDB(); selected = null; appScreen = 'jobs'; accepted = {}; appDriver = null;
        infoOpen = false; infoMode = 'truck'; mapFilter = 'all'; $('#mapFilter').value = 'all';
        $('#notifDrawer').classList.add('hidden');
        resetView(); save(); render(); renderGensanMaps(); renderNotifications(); toast('Demo data restored and synced.');
      }
    };
    $('#simClock').textContent = now();
    setInterval(tick, 1000);
    setInterval(pullShared, 1500);
    pullShared();
    render();
    renderGensanMaps();
    renderNotifications();
    if (session && session.role === 'driver') showView('driver');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
