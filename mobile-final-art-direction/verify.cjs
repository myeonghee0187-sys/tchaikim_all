const fs=require('node:fs');
const path=require('node:path');
const {PAGES,launch,ready,scroll}=require('./qa.cjs');
const OUT=path.join(__dirname,'verification');
fs.mkdirSync(OUT,{recursive:true});
const results=[];
function check(name,value,detail={}) {results.push({name,pass:Boolean(value),...detail});console.log(value?'PASS':'FAIL',name,JSON.stringify(detail));}
async function shot(page,name) {await page.screenshot({path:path.join(OUT,name+'.png')});}
async function view(page,selector) {
  const y=await page.locator(selector).first().evaluate(e=>e.getBoundingClientRect().top+scrollY-120);
  await scroll(page,y); await page.waitForTimeout(550);
}
async function gesture(page,selector,direction=1,touch=false) {
  await view(page,selector);
  const b=await page.locator(selector).first().boundingBox();
  const x=Math.max(70,Math.min(page.viewportSize().width-70,b.x+b.width*.65));
  const y=Math.min(page.viewportSize().height-90,Math.max(160,b.y+Math.min(b.height*.4,240)));
  const end=x-direction*Math.min(320,b.width*.5);
  if(touch) {
    const client=await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=10;i++) {await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(end-x)*i/10,y}]});await page.waitForTimeout(20);}
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await client.detach();
  } else {await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(end,y,{steps:12});await page.mouse.up();}
  await page.waitForTimeout(700);
}
async function getIndex(page,selector) {return page.locator(selector).textContent();}
async function functionChecks(browser) {
  for(const width of [390,1024]) {
    const page=await browser.newPage({viewport:{width,height:width===390?844:900},hasTouch:true});
    await ready(page,'main');
    const hero=await page.locator('.hero .is_active').getAttribute('class');
    await page.waitForTimeout(8100);
    check('M1 crossfade '+width,hero!==await page.locator('.hero .is_active').getAttribute('class'));
    check('M2 model '+width,await page.locator('.model').isVisible()===(width>=768));
    await view(page,'.detail');
    await page.locator('.detail_part_tab').first().click();
    await page.waitForTimeout(650);
    check('M3 circle opens '+width,await page.locator('.detail').evaluate(e=>e.classList.contains('is_magnified')));
    await shot(page,'main-'+width+'-magnifier');
    await page.locator('.detail_part_tab').first().click();
    check('M3 toggle closes '+width,!await page.locator('.detail').evaluate(e=>e.classList.contains('is_magnified')));
    await gesture(page,'.brand_collage_row',1,true);
    const railLeft=await page.locator('.brand_collage_row').evaluate(e=>e.scrollLeft);
    await gesture(page,'.brand_collage_row',-1,true);
    check('M4 bidirectional touch '+width,railLeft>20&&await page.locator('.brand_collage_row').evaluate(e=>e.scrollLeft)<railLeft);
    check('M8 products '+width,await page.locator('.shop_products_viewport').isVisible()===(width>=768));
    await view(page,'.collection_row');
    await page.waitForTimeout(4700);
    const x=await page.locator('.collection_row').evaluate(e=>e.scrollLeft);
    await page.waitForTimeout(1200);
    const x2=await page.locator('.collection_row').evaluate(e=>e.scrollLeft);
    check('M9 auto movement '+width,x2>x,{x,x2});
    await gesture(page,'.collection_row',1,true);
    const paused=await page.locator('.collection_row').evaluate(e=>e.scrollLeft);
    await page.waitForTimeout(500);
    check('M9 yields to touch '+width,Math.abs(await page.locator('.collection_row').evaluate(e=>e.scrollLeft)-paused)<3);
    await ready(page,'brand');
    await gesture(page,'.mood_slides',1,true);
    const mood=await getIndex(page,'.mood_current');
    await gesture(page,'.mood_slides',-1,true);
    check('B3 Mood touch '+width,mood!=='01'&&await getIndex(page,'.mood_current')==='01',{mood});
    await view(page,'.tchaikim_track');
    const tabGeometry=[];
    for(let i=0;i<5;i++) {
      await page.locator('.tchaikim_tab').nth(i).click();
      await page.waitForTimeout(350);
      tabGeometry.push(await page.locator('.atelier').evaluate(e=>e.getBoundingClientRect().top+scrollY));
      check('B5 tab '+width+' '+i,await page.locator('.tchaikim_panel:not([hidden])').count()===1);
    }
    check('B5 layout stability '+width,Math.max(...tabGeometry)-Math.min(...tabGeometry)<2,{tabGeometry});
    check('B7 Atelier copy '+width,await page.locator('.atelier_desc').isVisible()===(width>=768));
    const bounds=await page.locator('.heritage').evaluate(e=>({top:e.offsetTop,height:e.offsetHeight}));
    const states=[];
    for(const progress of [0,.45,.85]) {
      await scroll(page,bounds.top-80+progress*(bounds.height-600));await page.waitForTimeout(300);
      states.push(await page.locator('.heritage_photos .heritage_stage').evaluateAll(es=>es.map(e=>getComputedStyle(e).opacity)));
      await shot(page,'brand-'+width+'-heritage-'+progress);
    }
    check('B8 same-frame sequence '+width,JSON.stringify(states[0])!==JSON.stringify(states[2]),{states});
    await ready(page,'bespoke');
    await view(page,'.process');
    const processHeights=[];
    for(let i=0;i<5;i++) {
      await page.locator('.process_step_head').nth(i).click();await page.waitForTimeout(650);
      const state=await page.locator('.process').evaluate(e=>({active:e.querySelectorAll('.process_step.is_active').length,visible:e.querySelectorAll('.process_stage_img.is_visible').length,key:e.querySelector('.process_step.is_active').dataset.step,body:e.querySelector('.process_stage_item.is_active').dataset.step,height:e.offsetHeight}));
      check('BS4 step '+width+' '+i,state.active===1&&state.visible===1&&state.key===state.body,state);
      processHeights.push(state.height);
    }
    check('BS4 steady stage '+width,Math.max(...processHeights)-Math.min(...processHeights)<2);
    const materialHeights=[];
    for(let i=0;i<6;i++) {
      await page.locator('.materials_swatch_button').nth(i).click();await page.waitForTimeout(800);
      const state=await page.locator('.materials').evaluate(e=>({active:e.querySelectorAll('.materials_swatch.is_active').length,key:e.querySelector('.materials_swatch.is_active').dataset.fabric,caption:e.querySelector('.materials_caption_item.is_active').dataset.fabric,height:e.offsetHeight,body:e.querySelector('.materials_caption_item.is_active .materials_caption_desc').textContent}));
      check('BS5/6 fabric '+width+' '+i,state.active===1&&state.key===state.caption,state);
      materialHeights.push(state.height);
    }
    check('BS6 steady materials '+width,Math.max(...materialHeights)-Math.min(...materialHeights)<2);
    await shot(page,'bespoke-'+width+'-material-last');
    check('BS8 order '+width,await page.locator('.begin').evaluate(e=>e.nextElementSibling.classList.contains('reservation')));
    for(const name of ['collection','collection-youngjin']) {
      await ready(page,name);
      await gesture(page,'.showcase_carousel_viewport',1,true);
      const show=await getIndex(page,'.showcase_counter_current');
      await gesture(page,'.showcase_carousel_viewport',-1,true);
      check('C1 '+name+' '+width,show!=='01'&&await getIndex(page,'.showcase_counter_current')==='01',{show});
      for(const touch of [true,false]) {
        await gesture(page,'.archive_deck',1,touch);
        const index=await getIndex(page,'.archive_deck_index');
        await gesture(page,'.archive_deck',-1,touch);
        check('C5 '+name+' '+width+' '+(touch?'touch':'mouse'),index==='2'&&await getIndex(page,'.archive_deck_index')==='1',{index});
      }
      await page.locator('.archive_deck').focus();await page.keyboard.press('ArrowRight');
      check('C5 keyboard '+name+' '+width,await getIndex(page,'.archive_deck_index')==='2');
      for(const year of ['2019','2020','2021']) {
        await page.locator('.archive_year_button[data-year="'+year+'"]').click();await page.waitForTimeout(700);
        check('C3 year sync '+name+' '+width+' '+year,await getIndex(page,'.archive_deck_index')==='1');
      }
      await shot(page,name+'-'+width+'-archive');
    }
    await page.close();
  }
}
async function reservationChecks(browser) {
  for(const width of [390,768,1024]) for(const mode of ['atelier','phone']) {
    const page=await browser.newPage({viewport:{width,height:width<768?844:900},hasTouch:true});
    await ready(page,'reservation');
    await page.locator('label:has(input[name="silhouette"][value="durumagi"])').click();
    await page.locator('label:has(input[name="fabric"][value="traditional_silk"])').click();
    // Mode round-trip must keep the selected weekday/time state.
    await page.locator('label:has(input[name="meeting_mode"][value="phone"])').click();
    await page.locator('label:has(input[name="meeting_mode"][value="atelier"])').click();
    await page.locator('label:has(input[name="meeting_mode"][value="'+mode+'"])').click();
    check('R validation initially blocked '+width+' '+mode,await page.locator('#reservation_submit_button').isDisabled());
    const disabled=page.locator('.reservation_day[aria-label*="weekend"]').first();
    const before=await page.locator('#reservation_date_value').inputValue();
    if(await disabled.count()) await disabled.evaluate(e=>e.click());
    check('R weekends ignored '+width+' '+mode,(await page.locator('#reservation_date_value').inputValue())===before);
    await page.locator('.reservation_day:not(:disabled)').first().click();
    await page.locator('label:has(input[name="meeting_time"])').first().click();
    const selectedDate=await page.locator('#reservation_date_value').inputValue();
    const selectedTime=await page.locator('input[name="meeting_time"]:checked').inputValue();
    for(const trip of ['phone','atelier',mode]) await page.locator('label:has(input[name="meeting_mode"][value="'+trip+'"])').click();
    check('R mode round-trip '+width+' '+mode,selectedDate===await page.locator('#reservation_date_value').inputValue()&&selectedTime===await page.locator('input[name="meeting_time"]:checked').inputValue());
    check('R agreement required '+width+' '+mode,await page.locator('#reservation_submit_button').isDisabled());
    await page.locator('#field_name').fill('Responsive QA');
    await page.locator('#field_phone').fill('010-0000-0000');
    await page.locator('#field_email').fill('responsive-qa@example.com');
    await page.locator('#field_notes').fill('Local browser verification only.');
    await page.locator('label[for="agree_all"]').click();
    await shot(page,'reservation-'+width+'-'+mode);
    await page.locator('#reservation_submit_button').click();
    await page.waitForURL('**/reservation_done.html');
    await page.waitForTimeout(800);
    const data=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('tchaiBespokeReservation')));
    check('R Done transfer '+width+' '+mode,data.meetingValue===mode&&data.silhouette.includes('Durumagi')&&data.fabric.includes('Silk'),data);
    check('R Done mode '+width+' '+mode,await page.locator(mode==='phone'?'#done_phone':'#done_visit').isVisible());
    await shot(page,'done-'+width+'-'+mode);
    await page.close();
  }
}
async function geometryChecks(browser) {
  for(const name of Object.keys(PAGES)) {
    const page=await browser.newPage({viewport:{width:1920,height:1080}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
    await ready(page,name);
    const start=await page.evaluate(()=>({height:document.documentElement.scrollHeight,triggers:ScrollTrigger.getAll().length,pins:document.querySelectorAll('.pin-spacer').length}));
    for(const width of [1440,1280,1279,1024,820,768,767,430,402,390,375,360,390,1024,1920]) {
      await page.setViewportSize({width,height:width>=1280?1080:width>=768?900:844});
      await scroll(page,0);await page.waitForTimeout(450);
      const metric=await page.evaluate(()=>{
        const old=[document.documentElement.style.overflowX,document.body.style.overflowX];
        document.documentElement.style.overflowX='visible';document.body.style.overflowX='visible';
        const overflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-document.documentElement.clientWidth;
        document.documentElement.style.overflowX=old[0];document.body.style.overflowX=old[1];
        return {overflow,height:document.documentElement.scrollHeight,pins:document.querySelectorAll('.pin-spacer').length,clones:document.querySelectorAll('.is_rail_clone').length,hero:document.querySelectorAll('.hero.is_crossfade_ready').length};
      });
      check('overflow '+name+' '+width,metric.overflow<=1,metric);
    }
    await page.waitForTimeout(1200);
    const end=await page.evaluate(()=>({height:document.documentElement.scrollHeight,triggers:ScrollTrigger.getAll().length,pins:document.querySelectorAll('.pin-spacer').length}));
    check('resize '+name,JSON.stringify(start)===JSON.stringify(end),{start,end});
    check('console '+name,errors.length===0,{errors});
    await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await scroll(page,0);
    await page.waitForTimeout(700);
    check('reduced pins '+name,await page.locator('.pin-spacer').count()===0);
    await page.close();
  }
}
async function run() {
  const browser=await launch();
  try {
    const group=process.argv[3]||'all';
    if(group==='all'||group==='functions') await functionChecks(browser);
    if(group==='all'||group==='reservation') await reservationChecks(browser);
    if(group==='all'||group==='geometry') await geometryChecks(browser);
  } finally {
    fs.writeFileSync(path.join(OUT,'results-'+(process.argv[3]||'all')+'.json'),JSON.stringify(results,null,2));
    await browser.close();
  }
}
module.exports={run};
