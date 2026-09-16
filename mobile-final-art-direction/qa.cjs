// Local-only visual evidence; uses the Playwright installation already on this Mac.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/private/tmp/claude-501/-Users-songmyeonghee-Documents-tchaikim-all/ebca7e94-ab00-4f56-98bc-25240da86b15/scratchpad/node_modules/playwright');
const ROOT = __dirname;
const PAGES = {
  main: ['main/index.html', ['.hero','.model','.detail','.brand_collage','.promo_bespoke_wrap','.shop','.collection']],
  brand: ['brand/index.html', ['.mood_responsive','.kimyoungjin','.tchaikim_track','.atelier','.heritage']],
  bespoke: ['bespoke/index.html', ['.atelier','.quote','.process','.materials','.begin','.reservation']],
  reservation: ['bespoke/reservation.html', ['.bespoke_choice_grid','.reservation_schedule','.reservation_details']],
  collection: ['col_chaikim/index.html', ['.showcase','.archive','.asworn']],
  'collection-youngjin': ['col_chaikimyoungjin/index.html', ['.showcase','.archive','.asworn']]
};
async function launch() {
  return chromium.launch({channel:'chrome', headless:true, args:['--autoplay-policy=no-user-gesture-required']});
}
async function ready(page, name) {
  await page.goto('http://127.0.0.1:5733/pages/' + PAGES[name][0], {waitUntil:'networkidle', timeout:60000});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
}
async function scroll(page, y) {
  await page.evaluate(y => { if(window.tchaikimmLenis) window.tchaikimmLenis.scrollTo(y,{immediate:true}); else window.scrollTo(0,y); }, y);
  await page.waitForTimeout(250);
}
async function capture(page, name, width, phase) {
  const dir = path.join(ROOT,phase,name); fs.mkdirSync(dir,{recursive:true});
  const errors=[]; page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => {if(m.type()==='error') errors.push(m.text());});
  await ready(page,name);
  // Walk the document to load real lazy media and reveal entrance animations.
  let y=0;
  for(let i=0;i<65;i++) {
    const h=await page.evaluate(()=>document.documentElement.scrollHeight);
    if(y>h) break;
    await scroll(page,y); y+=page.viewportSize().height*0.85;
  }
  await scroll(page,0); await page.waitForTimeout(800);
  await page.screenshot({path:path.join(dir,width+'-full.png'),fullPage:true});
  for(const selector of PAGES[name][1]) {
    const el=page.locator(selector).first();
    if(!await el.count() || !await el.isVisible()) continue;
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(650);
    const box=await el.boundingBox();
    if(box && box.width>0 && box.height>0) await page.screenshot({path:path.join(dir,width+'-'+selector.replace(/\W/g,'')+'.png'),fullPage:false});
  }
  await scroll(page,0);
  const metrics=await page.evaluate(()=>({
    width:innerWidth,height:innerHeight,documentHeight:document.documentElement.scrollHeight,
    overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-document.documentElement.clientWidth,
    zoom:getComputedStyle(document.documentElement).zoom,
    triggers:window.ScrollTrigger?ScrollTrigger.getAll().length:0,
    pins:document.querySelectorAll('.pin-spacer').length,
    images:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.currentSrc),
    media:[...document.querySelectorAll('video')].map(v=>({src:v.getAttribute('src'),width:v.videoWidth,height:v.videoHeight,ready:v.readyState,error:v.error&&v.error.code})),
    geometry:[...document.querySelectorAll('main > *,main section,h1,h2,h3')].filter(e=>e.getBoundingClientRect().height>0).map(e=>{const b=e.getBoundingClientRect();const c=getComputedStyle(e);return {tag:e.tagName,class:e.className,x:b.x,y:b.y+scrollY,w:b.width,h:b.height,font:c.fontSize};})
  }));
  metrics.errors=errors;
  fs.writeFileSync(path.join(dir,width+'-metrics.json'),JSON.stringify(metrics,null,2));
  console.log(phase,name,width,metrics.documentHeight,'errors',errors.length,'overflow',metrics.overflow);
}
async function run() {
  const phase=process.argv[2]||'before'; const names=process.argv[3]?process.argv[3].split(','):Object.keys(PAGES);
  const widths=process.argv[4]?process.argv[4].split(',').map(Number):[1920,1024,390];
  const browser=await launch();
  try { for(const name of names) for(const width of widths) {
    const page=await browser.newPage({viewport:{width,height:width>=1280?1080:width>=768?900:844},deviceScaleFactor:1});
    try {await capture(page,name,width,phase);} finally {await page.close();}
  }} finally {await browser.close();}
}
module.exports={PAGES,launch,ready,scroll};
if(require.main===module) {
  const task=process.argv[2]==='final' ? require('./final.cjs').run() : process.argv[2]==='inputs' ? require('./inputs.cjs').run() : process.argv[2]==='deep' ? require('./deep.cjs').run() : process.argv[2]==='verify' ? require('./verify.cjs').run() : run();
  task.catch(e=>{console.error(e);process.exitCode=1;});
}
