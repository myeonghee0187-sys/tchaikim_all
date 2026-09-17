const fs=require('node:fs');
const {PAGES,launch,ready,scroll}=require('./qa.cjs');
const rows=[];
const anchors={main:'.promo_bespoke_wrap',brand:'.heritage',bespoke:'.materials',reservation:'.reservation_schedule',shop:'.garment_story_section','shop-detail':'.look_visual',collection:'.archive','collection-youngjin':'.archive'};
async function state(p){return p.evaluate(()=>{
 const old=[document.documentElement.style.overflowX,document.body.style.overflowX];document.documentElement.style.overflowX='visible';document.body.style.overflowX='visible';
 const overflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-document.documentElement.clientWidth;
 document.documentElement.style.overflowX=old[0];document.body.style.overflowX=old[1];
 return {overflow,height:document.documentElement.scrollHeight,scroll:Math.round(scrollY),pins:document.querySelectorAll('.pin-spacer').length,triggers:window.ScrollTrigger?ScrollTrigger.getAll().length:0,
 dynamic:Object.fromEntries(['.is_loop_clone','.youngjin_mobile','.occasion_control','.look_stage','.garment_story_unit'].map(s=>[s,document.querySelectorAll(s).length]))};
});}
(async()=>{const b=await launch();const selected=process.argv[2]?process.argv[2].split(','):Object.keys(PAGES),names=[...selected];try{
 await Promise.all([0,1].map(async()=>{while(names.length){const name=names.shift(),p=await b.newPage({viewport:{width:1920,height:1080}}),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));await ready(p,name);
 await scroll(p,await p.locator(anchors[name]).first().evaluate(e=>e.getBoundingClientRect().top+scrollY-120));
 // One-shot reveals legitimately retire when scrolling into the section.
 // Establish the comparison state after that reveal, not at the unvisited top.
 await p.waitForTimeout(1600);const initial=await state(p);
 for(let round=0;round<2;round++){
  const samples=[];
  for(const width of [1280,1279,1024,768,767,390,767,768,1024,1279,1280,1920]){
   await p.setViewportSize({width,height:width>=1280?1080:width>=768?900:844});await p.waitForTimeout(750);
   const s=await state(p);samples.push({width,...s});
  }
  const end=samples.at(-1),pass=samples.every(s=>s.overflow<=1&&s.height>0)&&end.pins===initial.pins&&end.triggers===initial.triggers&&JSON.stringify(end.dynamic)===JSON.stringify(initial.dynamic)&&!errors.length;
  rows.push({name,round,pass,initial,samples,errors:[...errors]});console.log(name,round,pass?'PASS':'FAIL');
 }
 await p.close();}}));
}finally{await b.close();const file=__dirname+'/verification/mid-resize.json',previous=process.argv[2]&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file)).filter(r=>!selected.includes(r.name)):[];fs.writeFileSync(file,JSON.stringify(previous.concat(rows),null,2));}if(rows.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
