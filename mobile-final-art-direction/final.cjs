const fs=require('node:fs'),path=require('node:path');
const {PAGES,launch,ready,scroll}=require('./qa.cjs');
const OUT=path.join(__dirname,'verification'),results=[];
function check(name,pass,detail={}){results.push({name,pass:!!pass,...detail});console.log(pass?'PASS':'FAIL',name,JSON.stringify(detail));}
async function shot(p,name){await p.screenshot({path:path.join(OUT,name+'.png')});}
async function run(){
 const browser=await launch();
 try {
 for(const width of [390,1024]){
  const p=await browser.newPage({viewport:{width,height:width<768?844:900},hasTouch:true});
  await ready(p,'main');
  await p.waitForTimeout(8400);await shot(p,'main-'+width+'-hero-second');
  const active=await p.locator('.hero_panel.is_active').getAttribute('class');
  await p.locator('.hero_panel.is_active a').focus();await p.waitForTimeout(8200);
  check('Hero focus pauses '+width,active===await p.locator('.hero_panel.is_active').getAttribute('class'));
  await p.locator('.hero_panel.is_active a').evaluate(e=>e.blur());
  await p.waitForTimeout(8200);check('Hero resumes '+width,active!==await p.locator('.hero_panel.is_active').getAttribute('class'));
  const rail=p.locator('.collection_row');await rail.scrollIntoViewIfNeeded();await p.waitForTimeout(300);
  const before=await rail.evaluate(e=>{
   const orig=[...e.children].find(n=>!n.classList.contains('is_rail_clone'));
   const period=orig.offsetLeft-e.firstElementChild.offsetLeft;e.scrollLeft=2*period-5;
   e.dispatchEvent(new WheelEvent('wheel',{deltaX:0,bubbles:true}));
   const bounds=e.getBoundingClientRect();
   return [...e.querySelectorAll('img')].filter(i=>{const r=i.getBoundingClientRect();return r.right>bounds.left&&r.left<bounds.right;}).map(i=>({src:i.src,x:Math.round(i.getBoundingClientRect().x)}));
  });
  await p.waitForTimeout(400);
  const after=await rail.evaluate(e=>{const b=e.getBoundingClientRect();return [...e.querySelectorAll('img')].filter(i=>{const r=i.getBoundingClientRect();return r.right>b.left&&r.left<b.right;}).map(i=>({src:i.src,x:Math.round(i.getBoundingClientRect().x)}));});
  check('Seamless rail boundary '+width,JSON.stringify(before)===JSON.stringify(after),{before,after});
  for(const name of ['collection','collection-youngjin']){
   await ready(p,name);
   for(const year of ['2019','2020','2021']){
    await p.locator('.archive_year_button[data-year="'+year+'"]').click();await p.waitForTimeout(600);
    const count=await p.locator('.archive_photo').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').length);
    await p.locator('.archive_deck').focus();
    for(let i=0;i<count;i++){
     const s=await p.locator('.archive_deck').evaluate(e=>({index:Number(e.querySelector('.archive_deck_index').textContent),total:Number(e.querySelector('.archive_deck_total').textContent.replace('/','')),photos:[...e.querySelectorAll('.archive_photo')].filter(n=>getComputedStyle(n).display!=='none').map(n=>({active:n.classList.contains('is_active'),alt:n.querySelector('img').alt,complete:n.querySelector('img').complete,valid:n.querySelector('img').naturalWidth>0}))}));
     check('Archive image/index '+name+' '+width+' '+year+' '+i,s.index===i+1&&s.total===count&&s.photos.filter(x=>x.active).length===1&&s.photos[i].active&&s.photos.every(x=>x.alt.startsWith(year)&&x.complete&&x.valid));
     await p.keyboard.press('ArrowRight');await p.waitForTimeout(400);
    }
    check('Archive wraps '+name+' '+width+' '+year,await p.locator('.archive_deck_index').textContent()==='1');
   }
   await shot(p,name+'-'+width+'-final-deck');
  }
  for(const name of Object.keys(PAGES)){
   await ready(p,name);
   const d=await p.evaluate(()=>{
    const selectors='.detail_part_tab,.hero_panel.is_active a,.tchaikim_tab,.heritage_button,.materials_swatch_button,.process_step_head,.reservation_button,.archive_year_button,.bespoke_choice_grid.is_three_up .bespoke_choice';
    return [...document.querySelectorAll(selectors)].filter(e=>e.getBoundingClientRect().width>0&&!e.disabled).map(e=>{const b=e.getBoundingClientRect();return {label:e.textContent.trim().slice(0,32),w:b.width,h:b.height};});
   });
   check('Touched controls >=44 '+name+' '+width,d.length>0&&d.every(x=>x.w>=43.9&&x.h>=43.9),{controls:d});
  }
  await p.close();
 }
 }finally{fs.writeFileSync(path.join(OUT,'final-checks.json'),JSON.stringify(results,null,2));await browser.close();}
}
module.exports={run};
