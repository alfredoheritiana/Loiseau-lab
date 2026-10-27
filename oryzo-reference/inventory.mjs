import fs from 'node:fs/promises';
import path from 'node:path';

const views=['desktop','tablet','mobile'];
const classify=(url,resourceType)=>{
 const value=new URL(url);
 const ext=(value.pathname.split('/').pop()?.match(/\.([a-z0-9]+)$/i)?.[1]||'').toLowerCase();
 const buckets={
  'webgl-geometry':['buf','bin','glb','gltf','obj','fbx','sog','ply'],
  'webgl-texture':['ktx2','basis','hdr','exr'],
  'rive-wasm':['riv','wasm','lottie'],
  'font-atlas':['woff','woff2','ttf','otf','eot'],
  'media':['mp4','webm','mov','ogg','mp3','wav'],
  'image':['png','jpg','jpeg','webp','avif','svg','gif'],
  'code':['js','mjs','css'],
  'data':['json','webmanifest']
 };
 const group=Object.entries(buckets).find(([_,extensions])=>extensions.includes(ext))?.[0]||resourceType||'other';
 return {ext,group};
};
const groups={};const resources=new Map();
for(const view of views){
 const p=path.resolve('captures','source',view,'capture.json');
 let data;try{data=JSON.parse(await fs.readFile(p,'utf8'));}catch{continue;}
 for(const item of data.requests||[]){
  let u;try{u=new URL(item.url);}catch{continue;}
  if(!/^https?:$/.test(u.protocol))continue;
  const key=u.origin+u.pathname;
  const existing=resources.get(key)||{
   url:item.url,origin:u.origin,path:u.pathname,
   views:[],types:[],statuses:[],...classify(item.url,item.type),
   originType:u.hostname==='oryzo.ai'||u.hostname.endsWith('.oryzo.ai')?'same-origin':'third-party'
  };
  if(!existing.views.includes(view))existing.views.push(view);
  if(item.type&&!existing.types.includes(item.type))existing.types.push(item.type);
  if(item.status&&!existing.statuses.includes(item.status))existing.statuses.push(item.status);
  resources.set(key,existing);
 }
}
if(!resources.size)throw new Error('No source captures. Run npm run capture first.');
const all=[...resources.values()].sort((a,b)=>a.group.localeCompare(b.group)||a.path.localeCompare(b.path));
for(const entry of all)(groups[entry.group]??=[]).push(entry);
const directory=path.resolve('reports');await fs.mkdir(directory,{recursive:true});
await fs.writeFile(path.join(directory,'assets-manifest.json'),JSON.stringify({
 generatedAt:new Date().toISOString(),source:'oryzo.ai public browser request inventory',
 note:'URLs recorded for research, not copied files; assess asset licences before redistribution.',
 total:all.length,groups
},null,2));
const lines=['# ORYZO — Resource inventory','','Recorded from public browser requests. URL listing is not an asset download or ownership proof.','',
 '|Category|Count|','|---|---:|',
 ...Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([key,list])=>'|'+key+'|'+list.length+'|'),
 '','## High-priority 3D and motion assets',''];
for(const entry of all.filter(e=>['webgl-geometry','webgl-texture','rive-wasm','font-atlas'].includes(e.group)))
 lines.push('- '+entry.group+' — '+entry.url+' ['+entry.views.join(',')+']');
lines.push('','## Coverage caveats','','- Some scenes lazy-load only after hover, click, or extended scroll. Run interaction capture for those states.','- External/domain-bound resources may not work locally. Record the blocker rather than bypassing access.','- Images and textures are protected by their respective owners; do not commit downloaded copies into this repository.','');
await fs.writeFile(path.join(directory,'assets-manifest.md'),lines.join('\n'));
console.log('Captured resource URLs:',all.length);
console.log(Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])));
