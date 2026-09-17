const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const old=require('../responsive-v2-61/qa.cjs');
const HEAD='0bb829963e6c9bb91b2b813225f4b2938f13816e';
const PAGES={shop:['shop/index.html',['.new_arrivals_section','.shop_section']],brand:['brand/index.html',['.mood_responsive','.kimyoungjin','.tchaikim_track','.heritage']],bespoke:['bespoke/index.html',['.bespoke_hero','.atelier']],collection:['col_chaikim/index.html',['.showcase','.asworn']],'collection-youngjin':['col_chaikimyoungjin/index.html',['.showcase','.asworn']]};
const cache=new Map();
async function baseline(p){await p.route('http://127.0.0.1:5733/**/*',async r=>{const rel=decodeURIComponent(new URL(r.request().url()).pathname).slice(1);if(!/\.(html|css|js)$/.test(rel))return r.continue();if(!cache.has(rel))cache.set(rel,execFileSync('git',['show',HEAD+':'+rel],{encoding:'utf8',maxBuffer:8e6}));return r.fulfill({body:cache.get(rel),contentType:rel.endsWith('.css')?'text/css':rel.endsWith('.js')?'application/javascript':'text/html'});});}
async function capture(p,name,width,phase){
 const dir=path.join(__dirname,phase,name);fs.mkdirSync(dir,{recursive:true});if(phase==='before')await baseline(p);await old.ready(p,name);
 // Decode actual local images before evidence capture; production loading is unchanged.
 await p.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.getAttribute('src')).map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
 for(let y=0,i=0;i<70;i++,y+=p.viewportSize().height*.9){if(y>await p.evaluate(()=>document.documentElement.scrollHeight))break;await old.scroll(p,y);}
 await old.scroll(p,0);await p.waitForTimeout(700);
 const top=await p.screenshot({path:path.join(dir,width+'-top.png')});
 const moodTileHeight=name==='brand'&&width<1280?await p.locator('.mood_responsive').evaluate(e=>Math.min(innerHeight,e.getBoundingClientRect().bottom)):0;
 const full=await p.screenshot({path:path.join(dir,width+'-full.png'),fullPage:true});
 if(name==='brand'&&width<1280){
  // Chrome beyond-viewport capture repaints scroll-snap at a different offset.
  // Replace only the top viewport with its immediately preceding, real screenshot.
  // No page CSS/content is changed and the uncomposited tile is also retained.
  const composed=await p.evaluate(async({full,top,moodTileHeight})=>{const decode=async s=>{const i=new Image();i.src='data:image/png;base64,'+s;await i.decode();return i;};const a=await decode(full),b=await decode(top),c=document.createElement('canvas');c.width=a.width;c.height=a.height;const ctx=c.getContext('2d');ctx.drawImage(a,0,0);ctx.drawImage(b,0,0,b.width,moodTileHeight,0,0,b.width,moodTileHeight);return c.toDataURL('image/png').split(',')[1];},{full:full.toString('base64'),top:top.toString('base64'),moodTileHeight});
  fs.writeFileSync(path.join(dir,width+'-full.png'),Buffer.from(composed,'base64'));
 }
 for(const s of PAGES[name][1]){const e=p.locator(s).first();if(!await e.count()||!await e.isVisible())continue;await old.scroll(p,await e.evaluate(e=>e.getBoundingClientRect().top+scrollY-90));await p.waitForTimeout(600);await p.screenshot({path:path.join(dir,width+'-'+s.slice(1)+'.png')});}
 await old.scroll(p,0);fs.writeFileSync(path.join(dir,width+'-metrics.json'),JSON.stringify(await old.metrics(p),null,2));console.log(phase,name,width);
}
async function run(){const phase=process.argv[2]||'before',names=process.argv[3]?process.argv[3].split(','):Object.keys(PAGES),widths=process.argv[4]?process.argv[4].split(',').map(Number):[1920,1024,390],jobs=names.flatMap(n=>widths.map(w=>[n,w])),b=await old.launch();try{await Promise.all([0,1].map(async()=>{while(jobs.length){const [n,w]=jobs.shift(),p=await b.newPage({viewport:{width:w,height:w>=1280?1080:w>=768?900:844}});try{await capture(p,n,w,phase);}finally{await p.close();}}}));}finally{await b.close();}}
module.exports={...old,PAGES,HEAD,baseline};if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
