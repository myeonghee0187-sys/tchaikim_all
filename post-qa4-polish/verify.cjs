const fs=require('node:fs'),path=require('node:path');
const {PAGES,launch,ready,scroll,baseline}=require('./qa.cjs');
const OUT=path.join(__dirname,'verification');fs.mkdirSync(OUT,{recursive:true});
const results=[];
function check(name,pass,detail={}){results.push({name,pass:!!pass,...detail});console.log(pass?'PASS':'FAIL',name,JSON.stringify(detail));}
async function view(p,s){await scroll(p,await p.locator(s).first().evaluate(e=>e.getBoundingClientRect().top+scrollY-100));await p.waitForTimeout(400);}
async function shot(p,name){await p.screenshot({path:path.join(OUT,name+'.png')});}
async function gesture(p,s,d=1,touch=false){
 await view(p,s);const b=await p.locator(s).first().boundingBox(),w=p.viewportSize().width;
 const x=d>0?Math.min(w-35,b.x+b.width*.8):Math.max(35,b.x+b.width*.2),y=Math.min(520,b.y+Math.min(b.height*.5,260)),end=x-d*Math.min(b.width*.65,w*.65);
 if(touch){const c=await p.context().newCDPSession(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=12;i++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(end-x)*i/12,y}]});await p.waitForTimeout(25);}await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
 else{await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(end,y,{steps:15});await p.mouse.up();}await p.waitForTimeout(750);
}
async function state(p){return p.evaluate(()=>({height:document.documentElement.scrollHeight,triggers:window.ScrollTrigger?ScrollTrigger.getAll().length:0,pins:document.querySelectorAll('.pin-spacer').length,clones:document.querySelectorAll('.is_loop_clone,.is_rail_clone').length,titles:document.querySelectorAll('.brand_tablet_title').length,button:document.querySelectorAll('.atelier_button').length,buttonParent:document.querySelector('.atelier_button')?.parentElement.className,fade:document.querySelectorAll('.is_compact_fade').length}));}
async function geometry(browser){
 const names=(process.env.QA_PAGES||Object.keys(PAGES).join(',')).split(','),widths=[1920,1280,1279,1024,768,767,430,390,375,360];
 await Promise.all([0,1].map(async()=>{while(names.length){const name=names.shift(),p=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.addInitScript(()=>addEventListener('unhandledrejection',e=>console.error('Unhandled: '+e.reason)));
 await ready(p,name);const start=await state(p);
 for(const w of widths){await p.setViewportSize({width:w,height:w>=1280?1080:w>=768?900:844});await scroll(p,0);await p.waitForTimeout(800);
 // Unmask body/root; sample the whole scroll path, including late lazy images.
 await p.evaluate(()=>{document.documentElement.style.overflowX='visible';document.body.style.overflowX='visible';});
 let overflow=0;for(let f=0;f<=1;f+=.125){await scroll(p,await p.evaluate(f=>f*(document.documentElement.scrollHeight-innerHeight),f));overflow=Math.max(overflow,await p.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth));}
 const metrics=await p.evaluate(()=>({height:document.documentElement.scrollHeight,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth&&i.getAttribute('src')).map(i=>i.src),sections:[...document.querySelectorAll('main>*,main section')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1);}).map(e=>e.className)}));
 await p.evaluate(()=>{document.documentElement.style.removeProperty('overflow-x');document.body.style.removeProperty('overflow-x');});check('width '+name+' '+w,overflow<=1&&!metrics.broken.length,{overflow,...metrics});
 if(w<1280&&name==='shop'){
 const cards=await p.evaluate(()=>[...document.querySelectorAll('.new_arrivals_grid .card_product,.shop_grid .card_product')].map(e=>{const r=e.getBoundingClientRect();const slots=Object.fromEntries(['media','name','price','swatches','desc','tags'].map(s=>{const n=e.querySelector('.card_product_'+s),b=n.getBoundingClientRect();return [s,{y:+(b.y-r.y).toFixed(2),w:+b.width.toFixed(2),h:+b.height.toFixed(2)}];}));return {name:e.querySelector('h3').textContent.trim(),...slots};}));
 const reference=cards[0],aligned=cards.every(c=>['media','name','price','swatches','desc','tags'].every(s=>Math.abs(c[s].y-reference[s].y)<1));
 check('catalogue slots '+w,aligned,{cards});
 }
 }
 for(let round=0;round<2;round++){for(const w of [1920,1024,390,1024,1920]){await p.setViewportSize({width:w,height:w>=1280?1080:w>=768?900:844});await scroll(p,0);await p.waitForTimeout(800);}await p.waitForTimeout(1000);const end=await state(p);check('resize cycle '+name+' '+round,Object.keys(start).every(k=>k==='triggers'?end[k]<=start[k]:end[k]===start[k]),{start,end,note:'Completed once-only entrance triggers may be removed; no accumulation is allowed.'});}
 check('console/rejection '+name,!errors.length,{errors});
 await p.emulateMedia({reducedMotion:'reduce'});await p.setViewportSize({width:390,height:844});await p.waitForTimeout(800);check('reduced motion pins '+name,await p.locator('.pin-spacer').count()===0);
 if(name==='brand'){await view(p,'.heritage');const s=await p.locator('.heritage_photos .heritage_stage').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none'&&Number(getComputedStyle(e).opacity)===1).length);check('Heritage reduced static visible',s===1);}
 await p.close();}}));
}
async function desktop(browser){
 for(const name of Object.keys(PAGES))for(const width of [1920,1280]){
 const pages=await Promise.all([0,1].map(()=>browser.newPage({viewport:{width,height:1080}})));
 await baseline(pages[0]);const data=[];
 for(const p of pages){await ready(p,name);await p.evaluate(()=>{document.querySelectorAll('video').forEach(v=>v.pause());document.getAnimations().forEach(a=>{a.pause();a.currentTime=0;});});
 data.push(await p.evaluate(()=>({height:document.documentElement.scrollHeight,triggers:window.ScrollTrigger?ScrollTrigger.getAll().map(t=>({pin:!!t.pin,start:Math.round(t.start),end:Math.round(t.end)})):[],elements:[...document.querySelectorAll('main>*,main section,main h1,main h2,main h3,main img,main button,main a')].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),marquee=e.closest('.asworn_list');return {tag:e.tagName,cls:e.className,x:Math.round(r.x-(marquee?marquee.getBoundingClientRect().x:0)),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height),font:s.fontSize};})})));}
 const a=data[0],b=data[1],diff=[];for(let i=0;i<Math.max(a.elements.length,b.elements.length);i++){const x=a.elements[i],y=b.elements[i];if(!x||!y||x.tag!==y.tag||x.w!==y.w||x.h!==y.h||x.font!==y.font||Math.abs(x.x-y.x)>2||Math.abs(x.y-y.y)>2)diff.push({before:x,after:y});}
 check('desktop '+name+' '+width,a.height===b.height&&JSON.stringify(a.triggers)===JSON.stringify(b.triggers)&&!diff.length,{beforeHeight:a.height,afterHeight:b.height,beforeTriggers:a.triggers,afterTriggers:b.triggers,diff});await Promise.all(pages.map(p=>p.close()));
 }
}
async function functions(browser){
 for(const width of [390,1024]){
 const p=await browser.newPage({viewport:{width,height:width<768?844:900},hasTouch:true});await ready(p,'brand');
 await p.locator('.mood_slides').focus();const sequence=[];
 for(const key of ['ArrowRight','ArrowRight','ArrowRight','ArrowLeft','ArrowLeft','ArrowLeft']){await p.keyboard.press(key);await p.waitForTimeout(900);sequence.push((await p.locator('.mood_current').textContent()).trim());}
 check('Mood seamless keys '+width,sequence.join()==='02,03,01,03,02,01',{sequence});
 const boundary=await p.locator('.mood_slides').evaluate(async e=>{const get=()=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('.mood_slide_media img')].map(i=>({src:i.src,x:Math.round(i.getBoundingClientRect().x),w:Math.round(i.getBoundingClientRect().width)})).filter(i=>i.x<r.right&&i.x+i.w>r.left);};e.scrollTo({left:0,behavior:'instant'});const before=get();await new Promise(r=>setTimeout(r,500));return {before,after:get()};});
 check('Mood clone normalization '+width,JSON.stringify(boundary.before)===JSON.stringify(boundary.after),boundary);
 await p.locator('.mood_slides').evaluate(e=>e.scrollTo({left:e.clientWidth,behavior:'instant'}));await p.waitForTimeout(450);
 for(const touch of [true,false]){await gesture(p,'.mood_slides',1,touch);const next=await p.locator('.mood_current').textContent();await gesture(p,'.mood_slides',-1,touch);check('Mood '+(touch?'touch':'mouse')+' '+width,next==='02'&&await p.locator('.mood_current').textContent()==='01',{next});}
 await view(p,'.mood_slides');await p.mouse.move(width/2,300);await p.mouse.wheel(width,0);await p.waitForTimeout(800);check('Mood trackpad '+width,await p.locator('.mood_current').textContent()==='02');
 for(let i=0;i<5;i++){await p.locator('.tchaikim_tab').nth(i).click();await p.waitForTimeout(350);check('Tchaikim tabs '+width+' '+i,await p.locator('.tchaikim_panel:not([hidden])').count()===1);}
 await shot(p,'brand-'+width+'-tabs');
 const heritage=[];for(const f of [0,.25,.5,.7,1]){const y=await p.evaluate(f=>{const t=ScrollTrigger.getById('heritage_compact_fade');return t.start+(t.end-t.start)*f;},f);await scroll(p,y);await p.waitForTimeout(200);heritage.push(await p.locator('.heritage_photos .heritage_stage').evaluateAll(es=>es.map(e=>+getComputedStyle(e).opacity)));await shot(p,'brand-'+width+'-heritage-'+f);}
 check('Heritage same-frame fades '+width,heritage[0][0]===1&&heritage[2][1]===1&&heritage[4][2]===1&&heritage[1][0]>0&&heritage[1][1]>0,{heritage});
 const title=await p.locator('.heritage_frame').evaluate(e=>{const nodes=[e.querySelector('.heritage_stage_title'),e.querySelector('.heritage_photos'),e.querySelector('.heritage_button')];return nodes.map(n=>{const r=n.getBoundingClientRect();return {cx:r.x+r.width/2,top:r.top,bottom:r.bottom};});});check('Heritage centered '+width,title.every(t=>Math.abs(t.cx-width/2)<1),{title});
 await ready(p,'bespoke');const bs=await p.evaluate(()=>({hidden:['.philosophy','.atelier','.atelier_head','.atelier_image'].every(s=>!document.querySelector(s)?.getClientRects().length||!document.querySelector(s)?.checkVisibility()),buttonParent:document.querySelector('.atelier_button').parentElement.className,count:document.querySelectorAll('.atelier_button').length,triggers:ScrollTrigger.getAll().filter(t=>t.trigger.closest('.philosophy,.atelier')).length,center:Math.abs(document.querySelector('.atelier_button').getBoundingClientRect().x+document.querySelector('.atelier_button').offsetWidth/2-innerWidth/2)}));check('Bespoke compact hero '+width,bs.hidden&&bs.buttonParent==='bespoke_hero_stage'&&bs.count===1&&bs.triggers===0&&bs.center<1,bs);await view(p,'.bespoke_hero_stage');await shot(p,'bespoke-'+width+'-hero');
 // Protection checks: existing Process and Materials controllers, no writes beyond local state.
 for(let i=0;i<5;i++){await p.locator('.process_step_head').nth(i).click();await p.waitForTimeout(250);const s=await p.locator('.process').evaluate(e=>({key:e.querySelector('.process_step.is_active').dataset.step,body:e.querySelector('.process_stage_item.is_active').dataset.step}));check('Process '+width+' '+i,s.key===s.body,s);}
 for(let i=0;i<6;i++){await p.locator('.materials_swatch_button').nth(i).click();await p.waitForTimeout(250);const s=await p.locator('.materials').evaluate(e=>({key:e.querySelector('.materials_swatch.is_active').dataset.fabric,caption:e.querySelector('.materials_caption_item.is_active').dataset.fabric}));check('Materials '+width+' '+i,s.key===s.caption,s);}
 for(const name of ['collection','collection-youngjin']){await ready(p,name);check('Showcase nav absent '+name+' '+width,!await p.locator('.showcase_carousel_nav').isVisible());await gesture(p,'.showcase_carousel_viewport',1,true);const show=await p.locator('.showcase_counter_current').textContent();await gesture(p,'.showcase_carousel_viewport',-1,true);check('Showcase swipe '+name+' '+width,show!=='01'&&await p.locator('.showcase_counter_current').textContent()==='01',{show});
 await view(p,'.asworn_track');const a=await p.locator('.asworn_list').evaluate(e=>e.getBoundingClientRect().x);await gesture(p,'.asworn_track',1,false);const z=await p.locator('.asworn_list').evaluate(e=>e.getBoundingClientRect().x);check('AsWorn drag '+name+' '+width,Math.abs(z-a)>10,{a,z});if(width>=768)check('AsWorn image only '+name,await p.locator('.asworn_body:visible').count()===0);await shot(p,name+'-'+width+'-asworn');
 }
 await ready(p,'shop');await view(p,'.new_arrivals_grid');const swatches=p.locator('.new_arrivals_grid .card_product').first().locator('.card_product_swatch');await swatches.nth(1).click();check('Shop swatch '+width,await swatches.nth(1).getAttribute('aria-pressed')==='true');
 const links=await p.locator('.card_product_name a').evaluateAll(es=>es.map(e=>e.getAttribute('href')));check('Shop product links '+width,links.every(h=>h&&h!=='#'),{links});await shot(p,'shop-'+width+'-catalogue');
 await p.close();
 }
}
async function run(){const group=process.argv[2]||'geometry',browser=await launch();try{await ({geometry,desktop,functions}[group])(browser);}finally{fs.writeFileSync(path.join(OUT,group+(process.env.QA_PAGES?'-final':'')+'.json'),JSON.stringify(results,null,2));await browser.close();}}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
