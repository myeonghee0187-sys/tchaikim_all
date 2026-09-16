const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {PAGES,launch,ready,scroll}=require('./qa.cjs');
const OUT=path.join(__dirname,'verification');
const HEAD='76499f23cd2c5e550e7f80a8aa7ef4ec2222c2f5';
const records=[];
function check(name,pass,detail={}){records.push({name,pass:!!pass,...detail});console.log(pass?'PASS':'FAIL',name,JSON.stringify(detail));}
const cache=new Map();
async function baseline(page){
  await page.route('http://127.0.0.1:5733/**/*',async route=>{
    const rel=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);
    if(!/\.(html|css|js)$/.test(rel)) return route.continue();
    if(!cache.has(rel))cache.set(rel,execFileSync('git',['show',HEAD+':'+rel],{cwd:path.dirname(__dirname),encoding:'utf8',maxBuffer:5e6}));
    return route.fulfill({body:cache.get(rel),contentType:rel.endsWith('.css')?'text/css':rel.endsWith('.js')?'application/javascript':'text/html'});
  });
}
async function geometry(page){
 return page.evaluate(()=>({
  height:document.documentElement.scrollHeight,
  triggers:window.ScrollTrigger?ScrollTrigger.getAll().map(t=>({start:Math.round(t.start),end:Math.round(t.end),pin:!!t.pin})):[],
  elements:[...document.querySelectorAll('main > *, main section,main h1,main h2,main h3')].filter(e=>e.getBoundingClientRect().height>1).map(e=>{
   const b=e.getBoundingClientRect(),c=getComputedStyle(e),marquee=e.closest('.asworn_list');
   const movingX=marquee?new DOMMatrix(getComputedStyle(marquee).transform).m41:0;
   return {tag:e.tagName,cls:e.className.replace(/\bis_\w+/g,''),rect:[b.x-movingX,b.y+scrollY,b.width,b.height].map(v=>Math.round(v)),font:c.fontSize,text:/H[123]/.test(e.tagName)?e.textContent.trim():''};
  })
 }));
}
async function desktop(browser){
 for(const name of Object.keys(PAGES))for(const width of [1920,1440,1280]){
  const pair=[];
  for(const old of [true,false]){
   const page=await browser.newPage({viewport:{width,height:1080}});
   if(old)await baseline(page);
   await ready(page,name);await page.waitForTimeout(name==='brand'?6000:1000);
   pair.push(await geometry(page));
   if(width===1920)await page.screenshot({path:path.join(OUT,name+'-desktop-'+(old?'head':'current')+'.png')});
   await page.close();
  }
  const diffs=[];
  for(let i=0;i<Math.max(pair[0].elements.length,pair[1].elements.length);i++){
   const a=pair[0].elements[i],b=pair[1].elements[i];
   if(!a||!b||a.font!==b.font||a.text!==b.text||a.cls!==b.cls||a.rect.some((v,j)=>Math.abs(v-b.rect[j])>1))diffs.push({a,b});
  }
  check('Desktop HEAD comparison '+name+' '+width,diffs.length===0&&pair[0].height===pair[1].height&&JSON.stringify(pair[0].triggers)===JSON.stringify(pair[1].triggers),{diffs,heights:pair.map(x=>x.height),triggers:pair.map(x=>x.triggers)});
 }
}
async function overflow(browser){
 const widths=[1920,1440,1280,1279,1024,820,768,767,430,402,390,375,360];
 for(const name of Object.keys(PAGES)){
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{window.qaRejections=[];addEventListener('unhandledrejection',e=>qaRejections.push(String(e.reason)));});
  await ready(page,name);
  await page.locator('img[loading="lazy"]').evaluateAll(es=>es.forEach(e=>e.loading='eager'));
  for(const width of widths){
   await page.setViewportSize({width,height:width>=1280?1080:width>=768?900:844});
   await scroll(page,0);await page.waitForTimeout(350);
   const states=[];
   for(const selector of ['main',...PAGES[name][1],'footer']){
    if(!await page.locator(selector).count()||!await page.locator(selector).first().isVisible())continue;
    const top=await page.locator(selector).first().evaluate(e=>e.getBoundingClientRect().top+scrollY);
    await scroll(page,top);
    states.push(await page.evaluate(selector=>{
     const old=[document.documentElement.style.overflowX,document.body.style.overflowX];
     document.documentElement.style.overflowX='visible';document.body.style.overflowX='visible';
     const overflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-document.documentElement.clientWidth;
     const out=[...document.querySelectorAll('main > section')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.left<-1||b.right>innerWidth+1);}).map(e=>e.className);
     document.documentElement.style.overflowX=old[0];document.body.style.overflowX=old[1];
     return {selector,overflow,out};
    },selector));
   }
   const broken=await page.locator('img').evaluateAll(es=>es.filter(e=>e.complete&&!e.naturalWidth&&e.getAttribute('src')).map(e=>e.getAttribute('src')));
   check('All-section overflow/media '+name+' '+width,states.every(s=>s.overflow<=1)&&broken.length===0,{maxOverflow:Math.max(...states.map(s=>s.overflow)),broken,offscreenSections:states.filter(s=>s.out.length)});
  }
  check('Runtime '+name,errors.length===0&&(await page.evaluate(()=>qaRejections)).length===0,{errors,rejections:await page.evaluate(()=>qaRejections)});
  await page.close();
 }
}
async function layout(browser){
 for(const width of [390,1024]){
  const p=await browser.newPage({viewport:{width,height:width===390?844:900},hasTouch:true});
  async function inspect(name,fn){await ready(p,name);return p.evaluate(fn,width);}
  let d=await inspect('main',width=>{
   const b=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,visible:getComputedStyle(e).display!=='none'};};
   const promo=s=>{const selectors=['.promo_title','.promo_media','.promo_lead_group','.main_button'];return selectors.map(x=>b(s+' '+x));};
   return {bespoke:promo('.promo_bespoke_wrap'),shop:promo('.shop'),ratio:b('.promo_bespoke_wrap .promo_media').w/b('.promo_bespoke_wrap .promo_media').h,
    images:document.querySelectorAll('.brand_collage_row .brand_collage_card').length,title:document.querySelectorAll('.brand_rail_title').length,support:b('.promo_bespoke_wrap .promo_figure'),
    products:b('.shop_products_viewport')};
  });
  check('M4 editorial four-photo rail '+width,d.images===4&&d.title===1,d);
  check('M5/6 original video ratio and order '+width,Math.abs(d.ratio-1122/720)<.01&&d.bespoke.every((v,i,a)=>!i||v.y>a[i-1].y)&&d.bespoke[1].w>=width*.85&&(width>=768||!d.support.h),d);
  check('M7/8 Shop order/product flow '+width,d.shop.every((v,i,a)=>!i||v.y>a[i-1].y)&&(width>=768||!d.products.h),d);
  d=await inspect('brand',width=>{
   const b=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,display:getComputedStyle(e).display};};
   return {mood:getComputedStyle(document.querySelector('.mood_responsive')).backgroundColor,arrows:b('.mood_arrow'),counter:b('.mood_navigation'),slide:getComputedStyle(document.querySelector('.mood_slide')).backgroundColor,
    red:b('.youngjin_photo_red'),yellow:b('.youngjin_photo_yellow'),blue:b('.youngjin_photo_blue'),black:b('.youngjin_photo_black'),
    title:b('.tchaikim_panel:not([hidden]) .tchaikim_panel_title'),video:b('.tchaikim_panel:not([hidden]) .tchaikim_media'),copy:b('.tchaikim_panel:not([hidden]) .tchaikim_panel_desc'),
    tabs:b('.tchaikim_tabs'),atelier:b('.atelier'),track:b('.tchaikim_track'),runway:b('.heritage').h/innerHeight};
  });
  check('B1/2/3 olive, no box, centered UI '+width,d.mood==='rgb(88, 90, 77)'&&d.slide==='rgba(0, 0, 0, 0)'&&d.arrows.display==='none',d);
  check('B4 primary/support hierarchy '+width,d.red.w>d.blue.w&&d.red.w>d.yellow.w&&d.red.w>d.black.w,d);
  check('B5 media before short copy mobile '+width,width>=768||(d.title.display==='none'&&d.tabs.y<d.video.y&&d.video.y<d.copy.y),d);
  check('B6/8 section breath and short runway '+width,d.atelier.y-(d.track.y+d.track.h)>=-1&&d.runway>=1.2&&d.runway<=1.8,d);
  d=await inspect('bespoke',width=>{
   const e=document.querySelector('.reservation_button'),r=e.getBoundingClientRect();
   const q=document.querySelector('.quote_text')||document.querySelector('.quote blockquote');
   return {button:{w:r.width,h:r.height,font:getComputedStyle(e).fontSize},quote:q&&getComputedStyle(q).textAlign,
    swatches:document.querySelectorAll('.materials_swatch_button').length,body:[...document.querySelectorAll('.materials_caption_desc,.process_stage_desc')].map(e=>({text:e.textContent,lines:e.getBoundingClientRect().height/parseFloat(getComputedStyle(e).lineHeight)}))};
  });
  check('BS1/4/6 compact copy '+width,width>=768||d.body.every(t=>t.lines<=3.1),d);
  check('BS5/7 materials and CTA '+width,d.swatches===6&&d.button.h>=44,d);
  await ready(p,'reservation');
  d=await p.locator('.bespoke_choice_grid.is_three_up').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,cards:[...e.children].map(c=>{const b=c.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width};})}));
  check('R1 readable cards '+width,width<768?d.scroll>d.width&&d.cards[0].w/d.width>.7:d.cards.every(c=>Math.abs(c.y-d.cards[0].y)<1),d);
  for(const name of ['collection','collection-youngjin']){
   d=await inspect(name,()=>{
    const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
    const circle=rect('.archive_deck_counter');
    const count=document.querySelector('.archive_deck_counter'),range=document.createRange();range.selectNodeContents(count);const t=range.getBoundingClientRect();
    return {order:['.archive_title','.archive_years','.archive_deck','.archive_more'].map(rect),circle,text:{x:t.x,y:t.y,w:t.width,h:t.height},
     arrow:getComputedStyle(document.querySelector('.archive_deck'),'::after').content,
     caption:getComputedStyle(document.querySelector('.asworn_text')).display,
     href:document.querySelector('.archive_more').getAttribute('href'),
     label:document.querySelector('.archive_more').textContent.trim()};
   });
   check('C2 order and real reservation link '+name+' '+width,d.order.every((r,i,a)=>!i||r.y>=a[i-1].y+a[i-1].h-1)&&d.href==='../bespoke/reservation.html'&&d.label.includes('Reserve Now'),d);
   check('C3/4 counter centered and no arrow '+name+' '+width,Math.abs(d.circle.x+d.circle.w/2-d.text.x-d.text.w/2)<2&&d.arrow==='none',d);
   check('C6 mobile copy only hidden '+name+' '+width,width<768?d.caption==='none':d.caption!=='none',d);
  }
  await p.close();
 }
}
async function reduced(browser){
 for(const name of Object.keys(PAGES)){
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await ready(p,name);
  let detail={pins:await p.locator('.pin-spacer').count()};
  if(name==='main'){
   const first=await p.locator('.hero_panel.is_active').getAttribute('class');
   await p.waitForTimeout(7900);
   detail.heroStopped=first===await p.locator('.hero_panel.is_active').getAttribute('class');
   await p.locator('.collection_row').scrollIntoViewIfNeeded();const x=await p.locator('.collection_row').evaluate(e=>e.scrollLeft);await p.waitForTimeout(900);
   detail.railStopped=x===await p.locator('.collection_row').evaluate(e=>e.scrollLeft);
   detail.noClones=await p.locator('.is_rail_clone').count()===0;
  }
  if(name==='brand')detail.height=await p.locator('.heritage').evaluate(e=>({h:e.offsetHeight,position:getComputedStyle(e.querySelector('.heritage_frame')).position,visible:[...e.querySelectorAll('.heritage_photos .heritage_stage')].filter(n=>getComputedStyle(n).display!=='none').length}));
  check('Reduced motion '+name,detail.pins===0&&(!('heroStopped'in detail)||(detail.heroStopped&&detail.railStopped&&detail.noClones))&&(!detail.height||(detail.height.position!=='sticky'&&detail.height.visible===1)),detail);
  await p.close();
 }
}
async function run(){
 const browser=await launch();const group=process.argv[3];
 try{await ({desktop,overflow,layout,reduced})[group](browser);}
 finally{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'deep-'+group+'.json'),JSON.stringify(records,null,2));await browser.close();}
}
module.exports={run};
