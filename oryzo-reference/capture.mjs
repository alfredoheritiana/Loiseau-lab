import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const mode=process.env.MODE==='local'?'local':'source';
const url=process.env.URL || (mode==='source'?'https://oryzo.ai/':'http://127.0.0.1:3000');
const base=path.resolve('captures',mode);
await fs.mkdir(base,{recursive:true});
const browser=await chromium.launch({headless:true});
for(const v of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
 const page=await browser.newPage({viewport:{width:v.width,height:v.height},deviceScaleFactor:1});
 const errors=[],failures=[],resources=[];
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>failures.push({url:r.url(),reason:r.failure()?.errorText}));
 page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()})});
 page.on('request',r=>resources.push({url:r.url(),type:r.resourceType()}));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(4500);
  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<height;y+=Math.max(300,Math.floor(v.height*.75))){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(450)}
  await page.waitForTimeout(1500);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(base,v.name+'.png'),fullPage:true,animations:'disabled',timeout:60000});
  await fs.writeFile(path.join(base,v.name+'.html'),await page.content());
  const state=await page.evaluate(()=>({title:document.title,height:document.documentElement.scrollHeight,canvas:[...document.querySelectorAll('canvas')].map(c=>({width:c.width,height:c.height})),performance:performance.getEntriesByType('resource').map(r=>r.name)}));
  await fs.writeFile(path.join(base,v.name+'.json'),JSON.stringify({url,viewport:v,state,errors,failures,resources:[...new Map(resources.map(x=>[x.url,x])).values()]},null,2));
 }catch(e){await fs.writeFile(path.join(base,v.name+'-error.txt'),String(e));}
 await page.close();
}
await browser.close();
console.log('Capture:',base);
