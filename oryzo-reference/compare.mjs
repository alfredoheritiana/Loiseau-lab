import fs from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const names=['desktop','tablet','mobile'];
const output=path.resolve('reports');
await fs.mkdir(output,{recursive:true});
const result={generatedAt:new Date().toISOString(),note:'Pixel mismatch is NOT an overall fidelity score; GPU and animation timing introduce nondeterminism.',views:{}};
const readJson=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const normalizeText=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
const average=a=>a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;

for(const name of names){
 const record={screenshots:[],geometry:[],issues:[]};
 result.views[name]=record;
 const base=path.resolve('captures','source',name);
 const candidate=path.resolve('captures','local',name);
 let ref,local;
 try {
  ref=await readJson(path.join(base,'capture.json'));
  local=await readJson(path.join(candidate,'capture.json'));
 } catch(e) {record.issues.push('Missing capture JSON: '+String(e));continue;}
 if(ref.frames.length!==local.frames.length)record.issues.push('Frame count differs: source='+ref.frames.length+' local='+local.frames.length);
 const n=Math.min(ref.frames.length,local.frames.length);
 for(let i=0;i<n;i++){
  const a=ref.frames[i],b=local.frames[i];
  const item={index:i,referenceScrollY:a.actualScrollY,localScrollY:b.actualScrollY};
  if(Math.abs(a.actualScrollY-b.actualScrollY)>60)record.issues.push('Scroll divergence at frame '+i);
  try{
   const first=PNG.sync.read(await fs.readFile(path.join(base,a.screenshot)));
   const second=PNG.sync.read(await fs.readFile(path.join(candidate,b.screenshot)));
   if(first.width!==second.width||first.height!==second.height){
     item.status='different_dimensions';
     item.refSize=[first.width,first.height];item.localSize=[second.width,second.height];
   } else {
     const diff=new PNG({width:first.width,height:first.height});
     const mismatched=pixelmatch(first.data,second.data,diff.data,first.width,first.height,{threshold:0.1,includeAA:false});
     const file=name+'-frame-'+String(i).padStart(2,'0')+'-diff.png';
     await fs.writeFile(path.join(output,file),PNG.sync.write(diff));
     item.status='compared';item.mismatchRatio=+(mismatched/(first.width*first.height)).toFixed(5);item.diff=file;
   }
  }catch(e){item.status='screenshot_missing_or_failed';item.reason=String(e);}
  record.screenshots.push(item);
 }
 const baselineHeadings=ref.final.headings||[];
 const candidateHeadings=local.final.headings||[];
 for(const heading of baselineHeadings){
  const match=candidateHeadings.find(x=>x.tag===heading.tag&&normalizeText(x.text)===normalizeText(heading.text));
  record.geometry.push({tag:heading.tag,text:heading.text,sourceTop:heading.top,localTop:match?.top??null,deltaPx:match?match.top-heading.top:null});
 }
 record.statistics={
   matchedHeadings:record.geometry.filter(x=>x.localTop!==null).length,
   sourceHeadings:baselineHeadings.length,
   meanAbsHeadingDeltaPx:average(record.geometry.filter(x=>x.deltaPx!==null).map(x=>Math.abs(x.deltaPx))),
   sourceCanvasCount:ref.final.canvas.length,
   localCanvasCount:local.final.canvas.length,
   sourceScrollHeight:ref.final.scrollHeight,
   localScrollHeight:local.final.scrollHeight,
   sourceFailures:ref.requestFailures.length,
   localFailures:local.requestFailures.length,
   localConsoleErrors:local.consoleErrors.length,
   meanPixelMismatch:average(record.screenshots.filter(x=>x.status==='compared').map(x=>x.mismatchRatio))
 };
 if(local.requestFailures.length)record.issues.push('Local network failures: '+local.requestFailures.length);
 if(local.consoleErrors.length)record.issues.push('Local console errors: '+local.consoleErrors.length);
 if(ref.final.canvas.length!==local.final.canvas.length)record.issues.push('Canvas count mismatch; investigate actual WebGL behavior');
 if(ref.final.scrollHeight!==local.final.scrollHeight)record.issues.push('Page heights differ (may indicate section or lazy-loading gap)');
}
await fs.writeFile(path.join(output,'comparison.json'),JSON.stringify(result,null,2));
let markdown='# ORYZO reference versus reconstruction\n\n';
markdown+='Comparison date: '+result.generatedAt+'\n\n';
markdown+='**Important:** a pixel mismatch ratio is not a complete accuracy score. Test motion, physics, timing, interactions, and the same browser/GPU separately.\n\n';
for(const [view,r] of Object.entries(result.views)){
 markdown+='## '+view+'\n\n';
 if(!r.statistics){markdown+='Not compared: '+r.issues.join('; ')+'\n\n';continue;}
 const s=r.statistics;
 markdown+='- Mean screenshot pixel mismatch: '+(s.meanPixelMismatch===null?'not measured':(s.meanPixelMismatch*100).toFixed(2)+'%')+'\n';
 markdown+='- Matched headings: '+s.matchedHeadings+'/'+s.sourceHeadings+'\n';
 markdown+='- Mean heading vertical error: '+(s.meanAbsHeadingDeltaPx===null?'not measured':s.meanAbsHeadingDeltaPx.toFixed(1)+' px')+'\n';
 markdown+='- Canvas count, source / local: '+s.sourceCanvasCount+' / '+s.localCanvasCount+'\n';
 markdown+='- Scroll height, source / local: '+s.sourceScrollHeight+' / '+s.localScrollHeight+'\n';
 markdown+='- Local failed requests: '+s.localFailures+'; console errors: '+s.localConsoleErrors+'\n';
 markdown+='- Differences to investigate: '+(r.issues.length?r.issues.join(' | '):'none flagged by automatic checks')+'\n\n';
}
await fs.writeFile(path.join(output,'comparison.md'),markdown);
console.log(markdown);
