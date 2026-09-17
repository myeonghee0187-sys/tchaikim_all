const fs=require('node:fs'),path=require('node:path');
const {launch,ready,baseline,scroll}=require('./qa.cjs');
const results=[];const out=path.join(__dirname,'verification');
function check(name,pass,data){results.push({name,pass,...data});console.log(pass?'PASS':'FAIL',name,JSON.stringify(data));}
async function crop(p,selector,file,offset=70){await scroll(p,await p.locator(selector).first().evaluate((e,o)=>e.getBoundingClientRect().top+scrollY-o,offset));await p.waitForTimeout(450);await p.screenshot({path:path.join(out,file+'.png')});}
(async()=>{const b=await launch();try{
 for(const width of [1024,390])for(const phase of ['before','after']){
  const p=await b.newPage({viewport:{width,height:width===390?844:900}});if(phase==='before')await baseline(p);
  await ready(p,'shop');await crop(p,'.shop_list_section',`${phase}-shop-${width}-all`);await crop(p,'.shop_filter_bar',`${phase}-shop-${width}-filter`);
  const axis=await p.evaluate(()=>['.new_arrivals_title','.new_arrivals_grid','.shop_filter_bar','.shop_list_title','.shop_grid','.shop_more_button'].map(s=>({s,x:document.querySelector(s).getBoundingClientRect().x})));
  if(phase==='after')check('Shop common axis '+width,axis.every(e=>Math.abs(e.x-axis[0].x)<1),{axis});
  await p.locator('#shop_search_input').fill('Jeogori');await p.locator('#shop_select_button').click();await p.locator('[data-category="dress"]').click();
  const ui=await p.evaluate(()=>({query:document.querySelector('#shop_search_input').value,label:document.querySelector('.shop_select_label').textContent,open:document.querySelector('#shop_select_button').getAttribute('aria-expanded'),focused:document.activeElement.id,cards:document.querySelectorAll('.shop_grid .card_product').length}));
  check('Shop baseline controls '+phase+' '+width,ui.query==='Jeogori'&&ui.label==='DRESS'&&ui.open==='false'&&ui.focused==='shop_select_button'&&ui.cards===6,{ui,note:'HEAD has no catalogue filtering/search handler; only the existing controls/state are protected.'});
  await p.locator('#shop_select_button').click();await p.keyboard.press('Escape');check('Shop Escape '+phase+' '+width,await p.locator('#shop_select_button').getAttribute('aria-expanded')==='false',{});
  await ready(p,'bespoke');await crop(p,phase==='before'?'.atelier':'.bespoke_hero_stage',`${phase}-bespoke-${width}-hero-button`);
  for(const name of ['collection','collection-youngjin']){await ready(p,name);await crop(p,'.showcase_carousel_viewport',`${phase}-${name}-${width}-showcase`);}
  await p.close();
 }
 // Compact / Desktop transitions: exact intended owners and no duplicate DOM.
 for(const name of ['brand','bespoke','collection','collection-youngjin']){
  const p=await b.newPage({viewport:{width:1280,height:900}});await ready(p,name);
  for(const width of [1280,1279,768,767,768,1279,1280]){
   await p.setViewportSize({width,height:900});await scroll(p,0);await p.waitForTimeout(900);
   const s=await p.evaluate(()=>({clones:document.querySelectorAll('.mood_slides .is_loop_clone').length,titles:document.querySelectorAll('.brand_tablet_title').length,fade:document.querySelectorAll('.is_compact_fade').length,button:document.querySelectorAll('.atelier_button').length,buttonParent:document.querySelector('.atelier_button')?.parentElement.className,philosophy:document.querySelector('.philosophy')?.checkVisibility(),nav:document.querySelector('.showcase_carousel_nav')?.checkVisibility(),overlays:[...document.querySelectorAll('.asworn_body')].filter(e=>e.checkVisibility()).length,drag:document.querySelector('.asworn_track')?.classList.contains('is_draggable')}));
   const tablet=width>=768&&width<1280,compact=width<1280;const pass=name==='brand'?s.clones===(compact?2:0)&&s.titles===(tablet?2:0)&&s.fade===(compact?1:0):name==='bespoke'?s.button===1&&s.buttonParent===(compact?'bespoke_hero_stage':'atelier_body')&&s.philosophy===!compact:(!compact||s.nav===false)&&(tablet?s.overlays===0:s.overlays>0)&&s.drag;
   check('Boundary '+name+' '+width,!!pass,{s});
  }await p.close();
 }
}finally{fs.writeFileSync(path.join(out,'details.json'),JSON.stringify(results,null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
