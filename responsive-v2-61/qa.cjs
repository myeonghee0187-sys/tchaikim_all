const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const base=require('../mobile-final-art-direction/qa.cjs');
const PAGES={...base.PAGES,shop:['shop/index.html',['.banner','.garment_story_section','.motif_detail_section']], 'shop-detail':['shop_detail/index.html',['.product_hero','.narrative_section','.craft_section','.look_visual']]};
const HEAD='fbed57a53f2d9205e4c790b15b1258cc97e89485',OUT=__dirname;
const sourceCache=new Map();
async function baseline(p){await p.route('http://127.0.0.1:5733/**/*',async r=>{const rel=decodeURIComponent(new URL(r.request().url()).pathname).slice(1);if(!/\.(html|css|js)$/.test(rel))return r.continue();if(!sourceCache.has(rel))sourceCache.set(rel,execFileSync('git',['show',HEAD+':'+rel],{encoding:'utf8',maxBuffer:8e6}));return r.fulfill({body:sourceCache.get(rel),contentType:rel.endsWith('.css')?'text/css':rel.endsWith('.js')?'application/javascript':'text/html'});});}
async function ready(p,name){await p.goto('http://127.0.0.1:5733/pages/'+PAGES[name][0],{waitUntil:'networkidle',timeout:60000});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(name==='brand'?5000:850);}
async function metrics(p){return p.evaluate(()=>({width:innerWidth,height:innerHeight,documentHeight:document.documentElement.scrollHeight,overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth,triggers:window.ScrollTrigger?ScrollTrigger.getAll().map(t=>({start:Math.round(t.start),end:Math.round(t.end),pin:!!t.pin})):[],geometry:[...document.querySelectorAll('main>*,main section,main h1,main h2,main h3')].filter(e=>e.getBoundingClientRect().height>1).map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {tag:e.tagName,cls:e.className,x:r.x,y:r.y+scrollY,w:r.width,h:r.height,font:c.fontSize};}),broken:[...document.images].filter(e=>e.complete&&!e.naturalWidth&&e.getAttribute('src')).map(e=>e.src)}));}
async function capture(p,name,width,phase){
 const dir=path.join(OUT,phase,name);fs.mkdirSync(dir,{recursive:true});const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 if(phase==='before')await baseline(p);await ready(p,name);
 for(let y=0,i=0;i<70;i++,y+=p.viewportSize().height*.9){if(y>await p.evaluate(()=>document.documentElement.scrollHeight))break;await base.scroll(p,y);}
 await base.scroll(p,0);await p.waitForTimeout(700);
 // Chromium's beyond-viewport paint resets nested scrollLeft mid-capture.
 // Preserve the real top viewport as a pixel-for-pixel tile, not a CSS mockup.
 const topTile=name==='brand'&&width<1280?await p.screenshot():null;
 const full=await p.screenshot({path:path.join(dir,width+'-full.png'),fullPage:true});
 if(topTile){
   const composed=await p.evaluate(async({full,top})=>{
     const decode=async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();return image;};
     const a=await decode(full),b=await decode(top),canvas=document.createElement('canvas');canvas.width=a.width;canvas.height=a.height;
     const ctx=canvas.getContext('2d');ctx.drawImage(a,0,0);ctx.drawImage(b,0,0);return canvas.toDataURL('image/png').split(',')[1];
   },{full:full.toString('base64'),top:topTile.toString('base64')});
   fs.writeFileSync(path.join(dir,width+'-full.png'),Buffer.from(composed,'base64'));
 }
 for(const selector of PAGES[name][1]){const e=p.locator(selector).first();if(!await e.count()||!await e.isVisible())continue;await e.scrollIntoViewIfNeeded();await p.waitForTimeout(500);await p.screenshot({path:path.join(dir,width+'-'+selector.replace(/\W/g,'')+'.png')});}
 await base.scroll(p,0);const d=await metrics(p);d.errors=errors;fs.writeFileSync(path.join(dir,width+'-metrics.json'),JSON.stringify(d,null,2));console.log(phase,name,width,d.documentHeight,'overflow',d.overflow,'errors',errors.length);
}
async function run(){const phase=process.argv[2]||'before',names=process.argv[3]?process.argv[3].split(','):Object.keys(PAGES),widths=process.argv[4]?process.argv[4].split(',').map(Number):[1920,1024,390];const tasks=names.flatMap(n=>widths.map(w=>[n,w]));const b=await base.launch();try{await Promise.all([0,1].map(async()=>{while(tasks.length){const [n,w]=tasks.shift();const p=await b.newPage({viewport:{width:w,height:w>=1280?1080:w>=768?900:844}});try{await capture(p,n,w,phase);}finally{await p.close();}}}));}finally{await b.close();}}
module.exports={PAGES,HEAD,OUT,baseline,ready,metrics,launch:base.launch,scroll:base.scroll};
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
