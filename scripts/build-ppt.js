/* ============================================================
   FleetForward defense presentation — 12 slides
   ============================================================ */
const pptxgen = require('pptxgenjs');
const path = require('path');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'GreenLeaf Logistics Team';
pptx.title = 'Project FleetForward — Samsara Integration for GreenLeaf Logistics';
pptx.subject = 'System Selection & Working Prototype Defense';
pptx.lang = 'en-US';

const C = {
  navy: '10251C', navy2: '173A2B', green: '16A34A', dark: '0F7A37', leaf: '0EA5A4',
  soft: 'E9F8EE', bg: 'F3F6F3', ink: '14251C', muted: '78877E', line: 'E2EAE3',
  white: 'FFFFFF', amber: 'F59E0B', amberSoft: 'FFF6E5', red: 'E5484D', redSoft: 'FFF0F0',
  blue: '3B82F6', blueSoft: 'EAF2FF', slate: '64748B'
};
const F = 'Arial', SH = pptx.ShapeType;
const W = 13.333, H = 7.5;
const S = n => path.join(__dirname, '..', 'assets', 'screens', n);

function bg(s, c) { s.background = { color: c }; }
function rect(s, x, y, w, h, fill, line, shape) {
  s.addShape(shape || SH.roundRect, {
    x, y, w, h,
    fill: fill ? { color: fill } : { type: 'none' },
    line: line ? { color: line, width: 1 } : { color: fill || C.white, width: 0 },
    rectRadius: 0.08
  });
}
function ellipse(s, x, y, w, h, fill, line) {
  s.addShape(SH.ellipse, { x, y, w, h, fill: { color: fill }, line: line ? { color: line, width: 1.2 } : { color: fill, width: 0 } });
}
function line(s, x, y, w, h, color, width, arrow) {
  s.addShape(SH.line, { x, y, w, h, line: { color: color || C.line, width: width || 1.5, ...(arrow ? { endArrowType: 'triangle' } : {}) } });
}
function txt(s, text, x, y, w, h, o) {
  s.addText(text, {
    x, y, w, h, fontFace: F, fontSize: (o && o.size) || 14, bold: !!(o && o.bold),
    color: (o && o.color) || C.ink, align: (o && o.align) || 'left', valign: (o && o.valign) || 'mid',
    margin: o && o.margin !== undefined ? o.margin : 0.04, breakLine: false, fit: 'shrink',
    ...(o && o.spacing ? { charSpacing: o.spacing } : {}), ...(o && o.italic ? { italic: true } : {})
  });
}
function bullets(s, items, x, y, w, h, o) {
  s.addText(items.map(t => ({ text: t, options: { bullet: { code: '25AA' }, breakLine: true, paraSpaceAfter: (o && o.gap) || 9 } })), {
    x, y, w, h, fontFace: F, fontSize: (o && o.size) || 14, color: (o && o.color) || C.ink, margin: 0.04, valign: 'top', fit: 'shrink'
  });
}
function header(s, kicker, title, subtitle) {
  rect(s, 0, 0, W, 0.12, C.green, null, SH.rect);
  txt(s, kicker.toUpperCase(), 0.65, 0.4, 11, 0.25, { size: 10.5, bold: true, color: C.dark, spacing: 2 });
  txt(s, title, 0.65, 0.69, 12, 0.55, { size: 28, bold: true, color: C.navy });
  if (subtitle) txt(s, subtitle, 0.67, 1.23, 12, 0.34, { size: 12.5, color: C.muted });
}
function footer(s, n) {
  line(s, 0.65, 7.03, 12, 0, C.line, 0.8);
  txt(s, 'Project FleetForward  •  GreenLeaf Logistics  •  System Defense', 0.65, 7.08, 9, 0.22, { size: 9, color: C.muted });
  txt(s, String(n).padStart(2, '0'), 12.1, 7.07, 0.55, 0.22, { size: 9, bold: true, color: C.slate, align: 'right' });
}
function card(s, x, y, w, h, o) {
  rect(s, x, y, w, h, (o && o.fill) || C.white, (o && o.border) || C.line);
  if (o && o.accent) rect(s, x, y, 0.06, h, o.accent, null, SH.rect);
}
function img(s, file, x, y, w, h, caption) {
  rect(s, x - 0.04, y - 0.04, w + 0.08, h + 0.08, C.white, C.line);
  s.addImage({ path: file, x, y, w, h, sizing: { type: 'contain', w, h } });
  if (caption) txt(s, caption, x, y + h + 0.1, w, 0.42, { size: 10.5, color: C.slate, valign: 'top' });
}
function table(s, headers, rows, widths, x, y, rowH) {
  const total = widths.reduce((a, b) => a + b, 0);
  rect(s, x, y, total, 0.48, C.navy, C.navy, SH.rect);
  headers.forEach((h, i) => txt(s, h, x + 0.12 + widths.slice(0, i).reduce((a, b) => a + b, 0), y + 0.08, widths[i] - 0.16, 0.3, { size: 10.5, bold: true, color: C.white }));
  rows.forEach((r, ri) => {
    const ry = y + 0.48 + ri * (rowH || 0.6);
    rect(s, x, ry, total, (rowH || 0.6), ri % 2 ? 'F7FAF7' : C.white, C.line, SH.rect);
    r.forEach((v, i) => txt(s, v, x + 0.12 + widths.slice(0, i).reduce((a, b) => a + b, 0), ry + 0.09, widths[i] - 0.16, (rowH || 0.6) - 0.14, { size: 10.8, color: i === 0 ? C.dark : C.ink, bold: i === 0 }));
  });
}

/* ---------- 1 TITLE ---------- */
{
  const s = pptx.addSlide(); bg(s, C.navy);
  rect(s, 0, 0, 0.16, H, C.green, null, SH.rect);
  ellipse(s, 9.4, -1.7, 5.6, 5.6, C.navy2);
  txt(s, 'SYSTEM SELECTION & WORKING PROTOTYPE DEFENSE', 0.85, 0.8, 8, 0.3, { size: 11.5, bold: true, color: '86EFAC', spacing: 2 });
  txt(s, 'Project FleetForward', 0.8, 1.3, 7.4, 0.95, { size: 48, bold: true, color: C.white });
  txt(s, 'Samsara Integration for GreenLeaf Logistics', 0.85, 2.28, 7.0, 0.55, { size: 21, bold: true, color: '86EFAC' });
  txt(s, 'Fleet visibility, AI route planning, driver dispatch,\nand fuel monitoring — demonstrated in a working prototype.', 0.85, 2.9, 6.6, 0.8, { size: 13.5, color: 'D1FAE5' });
  rect(s, 0.85, 4.05, 6.0, 2.3, C.navy2, '2E5B42');
  [['Submitted by', '[GROUP MEMBERS]'], ['Program', '[COURSE / YEAR & SECTION]'], ['Instructor', '[INSTRUCTOR NAME]'], ['Institution', '[SCHOOL NAME]'], ['Date', '[DATE]']].forEach((m, i) => {
    const y = 4.26 + i * 0.41;
    txt(s, m[0], 1.1, y, 1.7, 0.3, { size: 10.5, color: '94A3A0' });
    txt(s, m[1], 2.8, y, 3.85, 0.3, { size: 11, bold: true, color: C.white });
  });
  rect(s, 7.95, 1.5, 4.75, 3.15, C.white, '2E5B42');
  s.addImage({ path: S('01-live-map.png'), x: 8.05, y: 1.6, w: 4.55, h: 2.95, sizing: { type: 'contain', w: 4.55, h: 2.95 } });
  rect(s, 8.2, 4.95, 4.25, 0.62, C.green);
  txt(s, '50 TRUCKS   •   8 ROUTES   •   6 MODULES', 8.35, 5.04, 4, 0.42, { size: 11, bold: true, color: C.white, align: 'center' });
  txt(s, 'Live simulation · Screen-share ready', 8.05, 5.95, 4.6, 0.3, { size: 11, color: '94A3A0', align: 'center' });
  s.addNotes('Introduce the team and Project FleetForward. We evaluated four platforms, chose Samsara, and built a working prototype that demonstrates how it solves the client problem.');
}

/* ---------- 2 CLIENT SCENARIO + PROBLEM ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 1 · Client Scenario', 'GreenLeaf Logistics — the problem', '50 trucks, manual processes, and fuel costs up 20%.');
  const facts = [
    ['~50', 'delivery trucks', 'Metro-wide fleet', C.green],
    ['Paper', 'logs & spreadsheets', 'Routing kept manually', C.amber],
    ['+20%', 'fuel costs', 'Poor routing & idling', C.red],
    ['$125k', 'annual budget', 'Available for a solution', C.blue]
  ];
  facts.forEach((f, i) => {
    const x = 0.7 + i * 3.05;
    card(s, x, 1.72, 2.8, 1.5, {});
    txt(s, f[0], x + 0.15, 1.9, 2.5, 0.55, { size: 27, bold: true, color: f[3], align: 'center' });
    txt(s, f[1], x + 0.15, 2.47, 2.5, 0.3, { size: 12.5, bold: true, color: C.navy, align: 'center' });
    txt(s, f[2], x + 0.15, 2.82, 2.5, 0.3, { size: 10.5, color: C.muted, align: 'center' });
  });
  card(s, 0.7, 3.45, 5.75, 3.15, { accent: C.red });
  txt(s, 'Four linked problems', 1.02, 3.68, 5.0, 0.4, { size: 17, bold: true, color: C.navy });
  bullets(s, [
    'No live visibility — paper logs cannot show truck locations.',
    'Inefficient routes add distance and fuel use.',
    'Manual scheduling relies on repeated phone calls.',
    'Idling and fuel waste are not measured.'
  ], 1.02, 4.18, 5.0, 2.1, { size: 12, gap: 9 });
  card(s, 6.7, 3.45, 5.9, 3.15, { accent: C.green });
  txt(s, 'Impact on the business', 7.02, 3.68, 5.2, 0.4, { size: 17, bold: true, color: C.navy });
  bullets(s, [
    'Higher fuel spend and shrinking margins.',
    'Late deliveries and poor responsiveness.',
    'Low driver utilization and slow dispatch.',
    'No reliable data for management decisions.'
  ], 7.02, 4.18, 5.2, 2.1, { size: 12, gap: 9 });
  footer(s, 2);
  s.addNotes('Set the scene: 50 trucks, manual processes, fuel up 20%. Every requirement later maps back to one of these problems.');
}

/* ---------- 3 REQUIREMENTS ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 1 · Requirements', 'What the system must do', 'Seven requirements gathered from the client scenario.');
  const reqs = [
    ['Real-time GPS tracking', 'Know where every truck is at any moment.'],
    ['Smart AI route planning', 'Reduce distance, time, and fuel per route.'],
    ['Automated scheduling & dispatch', 'Assign shifts and trucks without phone chains.'],
    ['Fuel and idle monitoring', 'Detect waste and measure savings.'],
    ['Driver mobile application', 'Jobs, navigation, and check-in for drivers.'],
    ['Fleet reporting', 'Turn raw activity into management information.'],
    ['Quick setup & cloud management', 'Add vehicles fast; manage everything centrally.']
  ];
  reqs.forEach((r, i) => {
    const x = 0.7 + (i % 2) * 6.15, y = 1.75 + Math.floor(i / 2) * 1.22;
    card(s, x, y, 5.75, 1.04, {});
    ellipse(s, x + 0.2, y + 0.27, 0.5, 0.5, i % 2 ? C.leaf : C.green);
    txt(s, String(i + 1), x + 0.2, y + 0.33, 0.5, 0.35, { size: 13, bold: true, color: C.white, align: 'center' });
    txt(s, r[0], x + 0.85, y + 0.14, 4.7, 0.36, { size: 13.5, bold: true, color: C.navy });
    txt(s, r[1], x + 0.85, y + 0.52, 4.7, 0.4, { size: 11.2, color: C.slate, valign: 'top' });
  });
  txt(s, 'All seven requirements are represented in the prototype demonstrated later.', 0.75, 6.55, 11.8, 0.3, { size: 11.5, bold: true, color: C.dark, align: 'center' });
  footer(s, 3);
  s.addNotes('Read the requirements as a checklist. Later, map each prototype module back to one of these seven items.');
}

/* ---------- 4 MARKET SCAN ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 2 · System Selection', 'Market scan', 'Four fleet-management platforms were evaluated.');
  table(s, ['SYSTEM', 'MAIN FEATURES', 'ADVANTAGE', 'DISADVANTAGE'], [
    ['Samsara', 'Live GPS, AI routing, driver app, fuel & idle reports', 'Best fit for rising fuel costs', 'Upfront hardware may be required'],
    ['Motive', 'GPS, ELD, safety scores, diagnostics', 'Cheaper start; easy compliance', 'Less advanced route optimization'],
    ['Verizon Connect', 'GPS, dispatch, maintenance, driver app', 'Reliable network; strong reporting', 'Older interface; longer setup'],
    ['Teletrac Navman', 'Tracking, dispatch, scorecards, fuel analytics', 'Good driver app; simple scheduling', 'Pricing less transparent']
  ], [1.8, 4.1, 3.0, 3.0], 0.7, 1.9, 1.05);
  rect(s, 0.7, 6.25, 11.9, 0.5, C.soft, 'CDEBD6');
  txt(s, 'Samsara scored highest because routing directly targets the +20% fuel problem.', 1, 6.34, 11.3, 0.32, { size: 12, bold: true, color: C.dark, align: 'center' });
  footer(s, 4);
  s.addNotes('Every candidate offers basic GPS. The differentiator was advanced routing tied to the client’s main cost problem.');
}

/* ---------- 5 DECISION MATRIX + RECOMMENDATION ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 2 · Selection & Recommendation', 'Why Samsara won', 'Weighted criteria, highest score, and the final recommendation.');
  table(s, ['CRITERION', 'WEIGHT', 'WHY IT MATTERS'], [
    ['Live GPS & smart routing', '25%', 'Directly addresses fuel cost and routing inefficiency'],
    ['Driver app & scheduling', '20%', 'Needed for dispatch and driver adoption'],
    ['Easy setup', '20%', '50 vehicles must be onboarded quickly'],
    ['3-year total cost', '20%', 'Must fit the $125,000 annual budget'],
    ['Customer support', '15%', 'Important for a first fleet platform']
  ], [3.5, 1.3, 7.1], 0.7, 1.8, 0.52);
  rect(s, 0.7, 5.05, 4.0, 1.55, C.green);
  txt(s, '8.85 / 10', 0.95, 5.2, 2.6, 0.6, { size: 29, bold: true, color: C.white });
  txt(s, 'Highest weighted score', 0.95, 5.85, 3.4, 0.4, { size: 11.5, color: 'DCFCE7' });
  rect(s, 4.95, 5.05, 7.65, 1.55, C.navy, C.navy);
  txt(s, 'RECOMMENDATION: Samsara Fleet Cloud Platform', 5.25, 5.22, 7.0, 0.42, { size: 16, bold: true, color: '86EFAC' });
  txt(s, 'Cloud / SaaS + OBD-II hardware  •  ~$24,000/year (planning estimate)  •  subject to formal vendor quotation', 5.25, 5.75, 7.0, 0.6, { size: 11.5, color: 'D1FAE5', valign: 'top' });
  footer(s, 5);
  s.addNotes('Routing carried the highest weight because it is closest to the financial problem. Samsara scored 8.85/10. The $24,000 is an estimate, not a quote.');
}

/* ---------- 6 COST + RISK ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 3 · Cost & Risk', 'Budget fit and the main risk', 'Affordable — but driver adoption must be managed.');
  const boxes = [
    ['$125,000', 'Available / year', C.green],
    ['$375,000', 'Three-year budget', C.blue],
    ['$24,000', 'Estimated / year', C.amber],
    ['$72,000', 'Three-year estimate', C.dark]
  ];
  boxes.forEach((b, i) => {
    const x = 0.7 + i * 3.05;
    card(s, x, 1.75, 2.8, 1.3, {});
    txt(s, b[0], x + 0.15, 1.94, 2.5, 0.55, { size: 26, bold: true, color: b[2], align: 'center' });
    txt(s, b[1], x + 0.15, 2.55, 2.5, 0.3, { size: 11.5, color: C.muted, align: 'center' });
  });
  card(s, 0.7, 3.3, 5.75, 3.25, { accent: C.red });
  txt(s, 'PRIMARY RISK', 1.02, 3.55, 5.0, 0.3, { size: 10.5, bold: true, color: C.red, spacing: 1.5 });
  txt(s, 'Driver resistance to new tracking technology', 1.02, 3.95, 5.0, 0.8, { size: 17, bold: true, color: C.navy, valign: 'top' });
  txt(s, 'Drivers may see GPS and idle monitoring as surveillance. Without adoption, the data needed for routing and fuel savings will be incomplete.', 1.02, 4.95, 5.0, 1.25, { size: 12, color: C.slate, valign: 'top' });
  card(s, 6.7, 3.3, 5.9, 3.25, { accent: C.green });
  txt(s, 'MITIGATION PLAN', 7.02, 3.55, 5.2, 0.3, { size: 10.5, bold: true, color: C.dark, spacing: 1.5 });
  bullets(s, [
    'Hands-on driver training before rollout.',
    'Explain how the data will — and will not — be used.',
    'Pilot group first, then expand to all 50 trucks.',
    'Monthly bonuses for top fuel-efficiency scores.'
  ], 7.02, 3.98, 5.2, 2.3, { size: 12, gap: 10 });
  footer(s, 6);
  s.addNotes('Cost uses about 19% of the annual budget; projected fuel savings may offset it in year one. Be ready to answer the adoption question with the four mitigations.');
}

/* ---------- 7 ARCHITECTURE + MODULES ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 4 · Working Prototype', 'How the demo works', 'Browser-based simulation of the selected fleet platform.');
  const layers = [
    ['Presentation', 'GPS map · routes · dispatch · fuel · driver app · reports', C.green],
    ['Logic', 'Movement engine · optimizer · dispatch rules · alerts · CSV export', C.leaf],
    ['Data', '50 vehicles · 30 drivers · 8 routes · alerts (localStorage)', C.amber]
  ];
  layers.forEach((l, i) => {
    const y = 1.8 + i * 1.3;
    card(s, 0.7, y, 7.35, 1.02, {});
    rect(s, 0.7, y, 2.1, 1.02, l[2], null, SH.roundRect);
    txt(s, l[0], 0.85, y + 0.2, 1.8, 0.6, { size: 12.5, bold: true, color: C.white, align: 'center' });
    txt(s, l[1], 3.05, y + 0.18, 4.8, 0.68, { size: 11.3, color: C.ink });
    if (i < 2) line(s, 4.35, y + 1.03, 0, 0.26, C.slate, 1.6, true);
  });
  rect(s, 0.7, 5.95, 7.35, 0.6, C.soft, 'CDEBD6');
  txt(s, 'No Samsara login, hardware, or internet needed — fully offline.', 0.9, 6.05, 6.95, 0.38, { size: 11.5, bold: true, color: C.dark, align: 'center' });
  card(s, 8.35, 1.8, 4.25, 4.75, { fill: C.navy, border: C.navy });
  txt(s, 'SIX WORKING MODULES', 8.65, 2.05, 3.6, 0.32, { size: 11, bold: true, color: '86EFAC', spacing: 1.3 });
  const mods = ['Live GPS Map', 'Smart Routes', 'Dispatch & Drivers', 'Fuel & Idle', 'Driver App', 'Fleet Reports'];
  mods.forEach((m, i) => {
    const y = 2.55 + i * 0.62;
    ellipse(s, 8.65, y, 0.42, 0.42, i % 2 ? C.leaf : C.green);
    txt(s, String(i + 1), 8.65, y + 0.05, 0.42, 0.3, { size: 11, bold: true, color: C.white, align: 'center' });
    txt(s, m, 9.25, y, 3.0, 0.42, { size: 12.5, bold: true, color: C.white });
  });
  footer(s, 7);
  s.addNotes('Be transparent: this is a simulation of the recommended system, not a real Samsara integration. The workflow and data logic are fully demonstrable.');
}

/* ---------- 8 MAP SCREEN ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 4 · Module Demo', 'Live GPS map & vehicle status', 'Requirement: real-time GPS tracking and fleet visibility.');
  img(s, S('01-live-map.png'), 0.7, 1.72, 8.2, 4.35);
  card(s, 9.15, 1.72, 3.45, 4.5, {});
  txt(s, 'What to notice', 9.45, 1.98, 2.9, 0.4, { size: 16, bold: true, color: C.navy });
  bullets(s, [
    'Truck markers move every second.',
    'Green = on route, amber = idle, red = low fuel.',
    'KPIs summarize the 50-vehicle fleet.',
    'Live alerts flag fuel and idle problems.',
    'Click any truck for detailed telemetry.'
  ], 9.45, 2.5, 2.85, 3.4, { size: 11.3, gap: 9 });
  txt(s, 'Screenshot from the working prototype — not a mockup.', 0.75, 6.4, 11.8, 0.3, { size: 11.3, italic: true, color: C.muted, align: 'center' });
  footer(s, 8);
  s.addNotes('Demo: point at moving markers, click one for the detail card, then pause and resume the simulation.');
}

/* ---------- 9 ROUTES ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 4 · Module Demo', 'Smart route planning', 'Requirement: AI routing to reduce fuel waste and distance.');
  img(s, S('03-routes-before.png'), 0.7, 1.72, 5.85, 3.5, 'Before: current manual routes');
  img(s, S('09-routes-optimized.png'), 6.75, 1.72, 5.85, 3.5, 'After: AI-optimized routes and savings');
  rect(s, 0.7, 5.92, 11.9, 0.75, C.soft, 'CDEBD6');
  txt(s, 'Fleet result: 144.0 L saved per cycle (~24%)  •  ~$124,800 saved per year at $3.20/L, 260 days', 1, 6.1, 11.3, 0.4, { size: 12.5, bold: true, color: C.dark, align: 'center' });
  footer(s, 9);
  s.addNotes('Click “Optimize All Routes” live. Show each card change from Current plan to Optimized with liters saved.');
}

/* ---------- 10 DISPATCH + FUEL ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 4 · Module Demo', 'Dispatch & fuel monitoring', 'Requirements: automated scheduling, dispatch, fuel and idle monitoring.');
  img(s, S('04-dispatch.png'), 0.7, 1.72, 5.85, 3.5, 'Dispatch board — assign driver and route, then dispatch');
  img(s, S('05-fuel.png'), 6.75, 1.72, 5.85, 3.5, 'Fuel & idle monitor — alerts, idle ranking, refuel action');
  card(s, 0.7, 5.92, 11.9, 0.75, { fill: C.navy, border: C.navy });
  txt(s, 'Live interaction: dispatch a vehicle or log a refuel, then return to the map to see the data change.', 1, 6.1, 11.3, 0.4, { size: 12.3, color: 'D1FAE5', align: 'center' });
  footer(s, 10);
  s.addNotes('Show assignment dropdowns and Dispatch. Then demonstrate a refuel and point out that the low-fuel count drops.');
}

/* ---------- 11 DRIVER APP + REPORTS ---------- */
{
  const s = pptx.addSlide(); bg(s, C.bg);
  header(s, 'Section 4 · Module Demo', 'Driver app & fleet reports', 'Requirements: driver mobile app and fleet reporting.');
  img(s, S('08-driver-navigation.png'), 0.7, 1.72, 5.2, 3.95, 'Driver app — accept job, navigate, check in');
  img(s, S('07-reports.png'), 6.15, 1.72, 6.45, 3.95, 'Reports — KPIs, cost chart, efficiency, alerts');
  txt(s, 'Prototype note: the driver app is a mobile-style simulation of the Samsara Driver App workflow.', 0.75, 6.4, 11.8, 0.3, { size: 11.3, italic: true, color: C.muted, align: 'center' });
  footer(s, 11);
  s.addNotes('Walk through the driver app: accept, navigate, complete. Then show reports and export a CSV if the panel wants proof of output.');
}

/* ---------- 12 TESTING + CLOSING ---------- */
{
  const s = pptx.addSlide(); bg(s, C.navy);
  txt(s, 'SECTION 4 · VALIDATION & CLOSING', 0.7, 0.38, 11, 0.28, { size: 10.5, bold: true, color: '86EFAC', spacing: 2 });
  txt(s, 'Tested and ready to demonstrate', 0.7, 0.7, 11.8, 0.5, { size: 26, bold: true, color: C.white });
  table(s, ['TEST', 'SCENARIO', 'EXPECTED RESULT', 'STATUS'], [
    ['T-01', 'Open app in any browser', 'All six modules load with sample data', 'PASS'],
    ['T-02', 'Select a truck on the GPS map', 'Live telemetry detail is shown', 'PASS'],
    ['T-03', 'Optimize all routes', 'Savings and optimized status appear', 'PASS'],
    ['T-04', 'Dispatch an assigned vehicle', 'Status changes to On Route', 'PASS'],
    ['T-05', 'Accept job in driver app', 'Navigation and check-in work', 'PASS'],
    ['T-06', 'Export reports to CSV', 'File downloads with correct rows', 'PASS']
  ], [0.95, 4.25, 5.0, 1.0], 0.7, 1.4, 0.42);
  rect(s, 0.7, 4.75, 11.9, 1.55, C.navy2, '2E5B42');
  txt(s, 'THANK YOU', 0.9, 4.95, 11.5, 0.7, { size: 40, bold: true, color: C.white, align: 'center' });
  txt(s, 'Questions & Discussion', 0.9, 5.7, 11.5, 0.4, { size: 18, color: '86EFAC', align: 'center' });
  txt(s, 'Recommendation: proceed with Samsara, subject to a formal vendor quotation.', 0.9, 6.35, 11.5, 0.3, { size: 11.5, color: 'A7BDB0', align: 'center' });
  txt(s, '[GROUP MEMBERS]  •  [COURSE / SECTION]  •  [DATE]', 0.9, 6.72, 11.5, 0.3, { size: 10, color: '8FA89A', align: 'center' });
  s.addNotes('Close with the test summary and recommendation. Keep the prototype open in a second window in case the panel wants another look.');
}

const out = path.join(__dirname, '..', 'FleetForward-Defense-Presentation.pptx');
pptx.writeFile({ fileName: out })
  .then(() => console.log('Presentation saved:', out, '| slides:', pptx.slides.length))
  .catch(e => { console.error(e); process.exit(1); });
