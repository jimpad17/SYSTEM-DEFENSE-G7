/* Reproduce: admin stays on Dashboard while a driver on another device completes a delivery. */
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const STATE = path.join(ROOT, '.shared-state.json');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 3101;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  if (fs.existsSync(STATE)) fs.unlinkSync(STATE);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  process.on('exit', () => { try { server.kill(); } catch(e){} if (fs.existsSync(STATE)) fs.unlinkSync(STATE); });
  for (let i=0;i<40;i++){ try { if ((await fetch('http://localhost:'+PORT+'/api/sync')).ok) break; } catch(e){} await sleep(150); }

  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox','--disable-gpu'] });
  const errors=[];
  const mk = async url => { const p=await browser.newPage(); await p.setViewport({width:1440,height:950}); p.on('pageerror',e=>errors.push(e.message)); await p.goto(url,{waitUntil:'domcontentloaded'}); await sleep(400); return p; };
  const login = async (p,role) => { await p.evaluate(r=>{ if(!document.querySelector('#loginOverlay').classList.contains('hidden')) document.querySelector('#logoutBtn').click(); document.querySelector('.role-tab[data-role="'+r+'"]').click(); document.querySelector('#fillCreds').click(); document.querySelector('#loginForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); },role); await sleep(300); };
  const kpi = p => p.evaluate(() => {
    const el=[...document.querySelectorAll('#dashboardKpis .kpi')].find(k=>k.innerText.includes('Delivered Today'));
    return { text: el ? el.innerText.replace(/\s+/g,' ').trim() : 'MISSING', view: document.querySelector('.nav-item.active').dataset.view };
  });

  const admin = await mk('http://localhost:'+PORT);
  await login(admin,'admin');
  await admin.evaluate(()=>document.querySelector('[data-view="dashboard"]').click());
  await sleep(1200);
  const before = await kpi(admin);

  const driver = await mk('http://127.0.0.1:'+PORT);
  await login(driver,'driver');
  await driver.evaluate(()=>document.querySelector('[data-app="accept"]').click());
  await driver.evaluate(()=>document.querySelector('[data-app="nav"]').click());
  await sleep(150);
  await driver.evaluate(()=>document.querySelector('[data-app="complete"]').click());
  await sleep(500);
  const rec = await driver.evaluate(()=>JSON.parse(localStorage.getItem('fleetforward_db_v1')).deliveries[0].id);

  let after=null;
  for(let i=0;i<20;i++){ after=await kpi(admin); if(!after.text.includes(before.text.match(/Delivered Today (\d+)/)[1]+' ')) break; await sleep(500); }

  const srv = await (await fetch('http://localhost:'+PORT+'/api/sync')).json();
  console.log('BEFORE:', before);
  console.log('DRIVER REC:', rec);
  console.log('AFTER:', after);
  console.log('SERVER COUNT:', srv.deliveries.length, 'stamp:', srv.stamp);
  console.log('PAGE ERRORS:', errors.length?errors:'none');
  await browser.close(); server.kill(); if(fs.existsSync(STATE)) fs.unlinkSync(STATE);
  const n0=Number(before.text.match(/Delivered Today (\d+)/)[1]), n1=Number(after.text.match(/Delivered Today (\d+)/)[1]);
  if(n1<=n0||errors.length){ console.error('DASHBOARD SYNC FAILED'); process.exit(1); }
  console.log('DASHBOARD SYNC PASSED');
})().catch(e=>{console.error(e);process.exit(1)});
