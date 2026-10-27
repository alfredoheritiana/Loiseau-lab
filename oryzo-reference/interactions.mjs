import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const mode=process.env.MODE==='local'?'local':'source';
const url=process.env.URL||(mode==='source'?'https://oryzo.ai/':'http://127.0.0.1:3000');
const folder=path.resolve('captures',mode,'interactions');
await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:process.env.HEADED!=='1'});
const tasks=[
 {id:'menu',intent:'Open navigation and dismiss with Escape',role:'button',name:/menu/i,method:'click',escape:true},
 {id:'variant-pro',intent:'Change product variant to ORYZO Pro',role:'button',name:/^ORYZO Pro$/i,method:'click'},
 {id:'variant-max',intent:'Change product variant to ORYZO Pro Max',role:'button',name:/^ORYZO Pro Max$/i,method:'click'},
 {id:'hero-pointer',intent:'Trigger first visible canvas hover state',css:'canvas',method:'hover'},
 {id:'copy-url',intent:'Verify non-navigation button state, but do not execute side effects',role:'button',name:/copy url/i,method:'observe'}
];
const output={mode,url,generatedAt:new Date().toISOString(),results:[]};
for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,permissions:[]});
 for(const task of tasks){
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const record={viewport:viewport.name,task:task.id,intent:task.intent};
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForTimeout(Number(process.env.INITIAL_MS||6000));
   const locator=task.css?page.locator(task.css).first():page.getByRole(task.role,{name:task.name}).first();
   if(await locator.count()===0){record.status='not_found';continue;}
   await locator.scrollIntoViewIfNeeded({timeout:10000});
   await page.waitForTimeout(650);
   const basename=viewport.name+'-'+task.id;
   await page.screenshot({path:path.join(folder,basename+'-before.png'),timeout:45000});
   if(task.method==='click')await locator.click({timeout:10000});
   else if(task.method==='hover')await locator.hover({timeout:10000});
   await page.waitForTimeout(1100);
   await page.screenshot({path:path.join(folder,basename+'-after.png'),timeout:45000});
   if(task.escape)await page.keyboard.press('Escape');
   record.status='captured';
   record.scrollY=await page.evaluate(()=>scrollY);
   record.canvasCount=await page.locator('canvas').count();
  }catch(e){record.status='error';record.error=String(e);}
  finally{record.errors=errors;output.results.push(record);await page.close();}
 }
 await context.close();
}
await browser.close();
await fs.writeFile(path.join(folder,'results.json'),JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
