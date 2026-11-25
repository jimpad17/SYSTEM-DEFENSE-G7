/* Same-browser two tabs: BroadcastChannel should update admin Dashboard KPI instantly. */
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://127.0.0.1:3000';

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox','--disable-gpu'] });
  const errors = [];
  const mk = async () => { const p=await browser.newPage(); await p.setViewport({width:1440,height:950}); p.on('pageerror',e=>errors.push(e.message)); await p.goto(URL,{waitUntil:'domcontentloaded'}); await sleep(400); return p; };
  const login = async (p,role) => { await p.evaluate(r=>{ if(!document.querySelector('#loginOverlay').classList.contains('hidden')) document.querySelector('#logoutBtn').click(); document.querySelector('.role-tab[data-role="'+r+'"]').click(); document.querySelector('#fillCreds').click(); document.querySelector('#loginForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); },role); await sleep(300); };
  const kpi = p => p.evaluate(() => { const k=[...document.querySelectorAll('#dashboardKpis .kpi')].find(x=>x.innerText.includes('Delivered Today')); return k?k.innerText.replace(/\s+/g,' ').trim():'MISSING'; });

  const admin = await mk();
  await login(admin,'admin');
  await admin.evaluate(()=>document.querySelector('[data-view="dashboard"]').click());
  await sleep(1000);
  const before = await kpi(admin);

  const driver = await mk();
  await login(driver,'driver');
  await driver.evaluate(()=>document.querySelector('[data-app="accept"]').click());
  await driver.evaluate(()=>document.querySelector('[data-app="nav"]').click());
  await sleep(120);
  await driver.evaluate(()=>document.querySelector('[data-app="complete"]').click());

  let after=null, ms=0;
  for(let i=0;i<12;i++){ after=await kpi(admin); if(after!==before) break; await sleep(250); ms+=250; }
  console.log('BEFORE:', before);
  console.log('AFTER:', after, '| waited ms:', ms);
  console.log('SYNC BUTTONS:', await admin.evaluate(()=>({dash:!!document.querySelector('#syncNowDash'),reports:!!document.querySelector('#syncNowReports')})));
  console.log('PAGE ERRORS:', errors.length?errors:'none');
  await browser.close();
  const n0=Number(before.match(/Delivered Today (\d+)/)[1]), n1=Number(after.match(/Delivered Today (\d+)/)[1]);
  if(n1<=n0||errors.length){ console.error('TAB SYNC FAILED'); process.exit(1); }
  console.log('TAB SYNC PASSED');
})().catch(e=>{console.error(e);process.exit(1)});
