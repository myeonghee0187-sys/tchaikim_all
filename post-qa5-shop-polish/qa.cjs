const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {launch,scroll,ready}=require('../responsive-v2-61/qa.cjs');
const HEAD='e5532468d19993394af752a49b297cf37a09d6a6';
const PAGES={shop:['.shop_more_button','.motif_product_strip'],'shop-detail':['.product_hero','.narrative_copy','.narrative_media','.craft_media']};
const cache=new Map();
async function baseline(p){await p.route('http://127.0.0.1:5733/**/*',async r=>{const rel=decodeURIComponent(new URL(r.request().url()).pathname).slice(1);if(!/\.(html|css|js)$/.test(rel))return r.continue();if(!cache.has(rel))cache.set(rel,execFileSync('git',['show',HEAD+':'+rel],{encoding:'utf8',maxBuffer:8e6}));return r.fulfill({body:cache.get(rel),contentType:rel.endsWith('.css')?'text/css':rel.endsWith('.js')?'application/javascript':'text/html'});});}
async function walk(p){for(let y=0,i=0;i<65;i++,y+=p.viewportSize().height*.9){if(y>await p.evaluate(()=>document.documentElement.scrollHeight))break;await scroll(p,y);}await scroll(p,0);await p.waitForTimeout(800);}
async function capture(p,name,width,phase){
 const dir=path.join(__dirname,phase,name);fs.mkdirSync(dir,{recursive:true});if(phase==='before')await baseline(p);
 await ready(p,name);await walk(p);await p.screenshot({path:path.join(dir,width+'-full.png'),fullPage:true});
 for(const sel of PAGES[name]){const e=p.locator(sel);await e.scrollIntoViewIfNeeded();await p.waitForTimeout(650);await p.screenshot({path:path.join(dir,width+'-'+sel.slice(1)+'.png')});}
 const data=await p.evaluate(()=>({height:document.documentElement.scrollHeight,borders:[...document.querySelectorAll('.craft_main_image,.craft_media_row>img')].map(e=>{const c=getComputedStyle(e);return {selector:e.className||e.alt,width:c.borderWidth,style:c.borderStyle,color:c.borderColor,radius:c.borderRadius,natural:[e.naturalWidth,e.naturalHeight]};})}));
 fs.writeFileSync(path.join(dir,width+'-metrics.json'),JSON.stringify(data,null,2));console.log(phase,name,width,JSON.stringify(data));
}
module.exports={launch,scroll,ready,baseline,walk,HEAD,PAGES};
if(require.main===module)(async()=>{const b=await launch(),phase=process.argv[2]||'before',tasks=Object.keys(PAGES).flatMap(n=>[1920,1024,390].map(w=>[n,w]));try{await Promise.all([0,1].map(async()=>{while(tasks.length){const[n,w]=tasks.shift(),p=await b.newPage({viewport:{width:w,height:w>=1280?1080:w>=768?900:844}});try{await capture(p,n,w,phase);}finally{await p.close();}}}));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
