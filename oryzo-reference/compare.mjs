import fs from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
await fs.mkdir('reports',{recursive:true});
const report={views:{}};
for(const view of ['desktop','mobile']){
 try{
  const src=PNG.sync.read(await fs.readFile(path.join('captures','source',view+'.png')));
  const dst=PNG.sync.read(await fs.readFile(path.join('captures','local',view+'.png')));
  if(src.width!==dst.width||src.height!==dst.height){report.views[view]={status:'dimension_mismatch',source:[src.width,src.height],local:[dst.width,dst.height]};continue;}
  const diff=new PNG({width:src.width,height:src.height});
  const count=pixelmatch(src.data,dst.data,diff.data,src.width,src.height,{threshold:.1});
  await fs.writeFile(path.join('reports',view+'-diff.png'),PNG.sync.write(diff));
  report.views[view]={status:'compared',mismatched_pixels:count,total_pixels:src.width*src.height,ratio:count/(src.width*src.height)};
 }catch(e){report.views[view]={status:'not_compared',reason:String(e)};}
}
await fs.writeFile('reports/visual.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
