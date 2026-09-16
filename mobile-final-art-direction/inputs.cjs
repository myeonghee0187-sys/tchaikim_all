const fs=require('node:fs'),path=require('node:path');
const {PAGES,launch,ready,scroll}=require('./qa.cjs');
const OUT=path.join(__dirname,'verification'),results=[];
function check(name,pass,detail={}){results.push({name,pass:!!pass,...detail});console.log(pass?'PASS':'FAIL',name,JSON.stringify(detail));}
async function point(p,s){
 const e=p.locator(s).first();await scroll(p,await e.evaluate(e=>e.getBoundingClientRect().top+scrollY-160));
 const b=await e.boundingBox();return {x:Math.min(p.viewportSize().width-80,b.x+b.width/2),y:Math.min(p.viewportSize().height-90,Math.max(210,b.y+Math.min(b.height/2,300)))};
}
async function panY(p,s){
 const {x,y}=await point(p,s),old=await p.evaluate(()=>scrollY),c=await p.context().newCDPSession(p);
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=12;i++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*15}]});await p.waitForTimeout(15);}
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();await p.waitForTimeout(500);
 check('Vertical touch allowed '+s,await p.evaluate(()=>scrollY)>old+30,{old,now:await p.evaluate(()=>scrollY)});
}
async function input(browser){
 for(const width of [390,1024]){
  const p=await browser.newPage({viewport:{width,height:width<768?844:900},hasTouch:true});
  for(const [name,selectors]of [['main',['.brand_collage_row','.collection_row']],['brand',['.mood_slides']],['reservation',['.bespoke_choice_grid.is_three_up']],['collection',['.showcase_carousel_viewport','.archive_deck']],['collection-youngjin',['.showcase_carousel_viewport','.archive_deck']]]){
   await ready(p,name);
   for(const s of selectors)await panY(p,s);
   if(name==='main'||name==='brand'){
    const s=name==='main'?'.brand_collage_row':'.mood_slides';await point(p,s);
    const e=p.locator(s);await e.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(700);
    check('Rail keyboard '+name+' '+width,await e.evaluate(e=>e.scrollLeft)>20);
    await e.evaluate(e=>e.scrollLeft=0);await p.waitForTimeout(350);
    const pos=await point(p,s),before=await e.evaluate(e=>e.scrollLeft);await p.mouse.move(pos.x,pos.y);await p.mouse.wheel(600,0);await p.waitForTimeout(800);
    check('Rail trackpad '+name+' '+width,await e.evaluate(e=>e.scrollLeft)>before);
   }
   if(name.startsWith('collection')){
    await point(p,'.showcase_carousel_viewport');const v=p.locator('.showcase_carousel_viewport');await v.focus();
    for(const key of ['Home','ArrowRight','ArrowRight','ArrowRight','End','Home']){
     await p.keyboard.press(key);await p.waitForTimeout(750);
     const index=await p.locator('.showcase_counter_current').textContent();
     console.log('Showcase index',name,width,key,index,await v.evaluate(e=>({x:e.scrollLeft,max:e.scrollWidth-e.clientWidth,offsets:[...e.querySelectorAll('.showcase_slide')].map(x=>x.offsetLeft)})));
     if(key==='End')check('Showcase last image reachable '+name+' '+width,index==='05');
     if(key==='Home')check('Showcase first image reachable '+name+' '+width,index==='01');
    }
    const deck=p.locator('.archive_deck');const pos=await point(p,'.archive_deck');await p.mouse.move(pos.x,pos.y);
    const first=await p.locator('.archive_deck_index').textContent();await p.mouse.wheel(180,0);await p.waitForTimeout(500);
    const second=await p.locator('.archive_deck_index').textContent();await p.mouse.wheel(-180,0);await p.waitForTimeout(500);
    check('Archive trackpad '+name+' '+width,second!==first&&await p.locator('.archive_deck_index').textContent()===first);
   }
  }
  await p.close();
 }
}
async function lifecycle(browser){
 for(const name of Object.keys(PAGES)){
  const p=await browser.newPage({viewport:{width:1920,height:1080}});
  await p.addInitScript(()=>{
   window.qaSignals=[];window.qaIntervals=new Map();window.qaFrames=new Map();
   const add=EventTarget.prototype.addEventListener;
   EventTarget.prototype.addEventListener=function(type,fn,options){
    if(options&&options.signal)qaSignals.push({target:this,type,fn,signal:options.signal});
    return add.call(this,type,fn,options);
   };
   const si=window.setInterval,ci=window.clearInterval,raf=window.requestAnimationFrame,caf=window.cancelAnimationFrame;
   window.setInterval=function(fn,delay,...args){const id=si(fn,delay,...args);qaIntervals.set(id,delay);return id;};
   window.clearInterval=function(id){qaIntervals.delete(id);return ci(id);};
   window.requestAnimationFrame=function(fn){const id=raf(t=>{qaFrames.delete(id);fn(t);});qaFrames.set(id,fn.name);return id;};
   window.cancelAnimationFrame=function(id){qaFrames.delete(id);return caf(id);};
  });
  await ready(p,name);
  const original=await p.evaluate(()=>({text:[...document.querySelectorAll('.model_desc,.detail_part_desc,.promo_desc,.collection_desc,.tchaikim_panel_desc,.bespoke_hero_desc,.philosophy_desc,.process_stage_desc,.materials_caption_desc,.materials_intro,.begin_desc,.asworn_text')].filter(e=>!e.closest('.asworn_item[aria-hidden="true"]')).map(e=>e.textContent.replace(/\s+/g,' ').trim()).join('|'),order:[...document.querySelector('main').children].map(e=>e.tagName+':'+e.className)}));
  const samples=[];
  for(const width of [1024,390,1024,1920,1024,390,1024,1920]){
   await p.setViewportSize({width,height:width>=1280?1080:width>=768?900:844});await scroll(p,0);await p.waitForTimeout(500);
   const data=await p.evaluate(()=>({signals:qaSignals.filter(x=>!x.signal.aborted).map(x=>x.type).sort(),timers:[...qaIntervals.values()].filter(x=>x===7500),animations:[...qaFrames.values()].filter(x=>x==='animate'),clones:document.querySelectorAll('.is_rail_clone').length,title:document.querySelectorAll('.brand_rail_title').length,hero:document.querySelectorAll('.is_crossfade_ready').length,st:ScrollTrigger.getAll().length,pins:document.querySelectorAll('.pin-spacer').length}));
   samples.push({width,...data});
   check('Lifecycle '+name+' '+width,width>=1280?data.signals.length===0&&!data.timers.length&&!data.animations.length&&!data.clones&&!data.title&&!data.hero:data.timers.length<=1&&data.animations.length<=1&&data.clones<=24&&data.title<=1&&data.hero<=1,data);
   if(width===390&&name==='main'){await p.locator('.detail_part_tab').first().click();}
   if(width===390&&name==='brand'){await p.locator('.tchaikim_tab').nth(4).click();await point(p,'.heritage');}
   if(width===390&&name.startsWith('collection')){await p.locator('.archive_deck').focus();await p.keyboard.press('ArrowRight');}
  }
  const last=samples.at(-1),first=samples[3];
  check('No accumulated resources '+name,JSON.stringify(first)===JSON.stringify(last),{first,last});
  const restored=await p.evaluate(()=>({text:[...document.querySelectorAll('.model_desc,.detail_part_desc,.promo_desc,.collection_desc,.tchaikim_panel_desc,.bespoke_hero_desc,.philosophy_desc,.process_stage_desc,.materials_caption_desc,.materials_intro,.begin_desc,.asworn_text')].filter(e=>!e.closest('.asworn_item[aria-hidden="true"]')).map(e=>e.textContent.replace(/\s+/g,' ').trim()).join('|'),order:[...document.querySelector('main').children].map(e=>e.tagName+':'+e.className),lens:document.querySelector('.detail_stage')?.style.getPropertyValue('--compact_lens_size')||'',fades:[...document.querySelectorAll('.heritage_stage')].some(e=>e.style.getPropertyValue('--heritage_fade'))}));
  check('Desktop copy/DOM/style restored '+name,original.text===restored.text&&JSON.stringify(original.order)===JSON.stringify(restored.order)&&!restored.lens&&!restored.fades,{text:original.text===restored.text,order:JSON.stringify(original.order)===JSON.stringify(restored.order),lens:restored.lens,fades:restored.fades});
  await p.close();
 }
}
async function processDesktop(browser){
 const p=await browser.newPage({viewport:{width:1920,height:1080}});await ready(p,'bespoke');
 for(let i=0;i<5;i++){
  await p.locator('.process_step_head').nth(i).click();await p.waitForTimeout(1100);
  const d=await p.locator('.process').evaluate(e=>({active:e.querySelector('.process_step.is_active').dataset.step,body:e.querySelector('.process_stage_item.is_active').dataset.step,y:scrollY}));
  const selected=await p.locator('.process_step').nth(i).getAttribute('data-step');
  check('Desktop Process click/scroll '+i,d.active===selected&&d.body===selected,d);
 }
 const trigger=await p.evaluate(()=>{const t=ScrollTrigger.getAll().find(t=>t.trigger?.classList.contains('process'));return {start:t.start,end:t.end};});
 for(let i=0;i<5;i++){
  await scroll(p,trigger.start+(trigger.end-trigger.start)*(i+.5)/5);await p.waitForTimeout(800);
  check('Desktop Process scroll/click '+i,await p.locator('.process_step').nth(i).getAttribute('class').then(c=>c.includes('is_active')));
 }
 await p.close();
}
async function run(){const b=await launch(),group=process.argv[3];try{await({input,lifecycle,processDesktop})[group](b);}finally{fs.writeFileSync(path.join(OUT,'inputs-'+group+'.json'),JSON.stringify(results,null,2));await b.close();}}
module.exports={run};
