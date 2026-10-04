import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function parseDrafts(markdown, year=2026) {
  const sections=markdown.replace(/\r\n/g,'\n').split(/^## /m).slice(1);
  const result=[];
  for(const section of sections) {
    const [heading,...lines]=section.split('\n');
    const match=heading.match(/^(\d{1,2})\/(\d{1,2})\s+[월화수목금토일]\s+·\s+(.+)$/);
    if(!match) continue;
    const month=Number(match[1]), day=Number(match[2]);
    const date=new Date(Date.UTC(year,month-1,day,8));
    if(date.getUTCFullYear()!==year || date.getUTCMonth()!==month-1 || date.getUTCDate()!==day) throw Error('Invalid calendar date: '+heading);
    const id=`draft-${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if(result.some(p=>p.id===id)) throw Error('Duplicate slot: '+id);
    const affiliate=heading.includes('[상품 확인 대기]');
    result.push({id,title:match[3].replace(' [상품 확인 대기]',''),text:lines.join('\n').trim(),status:'draft',scheduledAt:date.toISOString(),productIds:[],linkMode:affiliate?'unassigned':'none',requiresProductSelection:affiliate,reviewRequired:true,source:'docs/month-one-drafts.md'});
  }
  if(!result.length) throw Error('No dated drafts found');
  return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const source=new URL('../docs/month-one-drafts.md',import.meta.url);
  // Separate staging output: never overwrite live queue or produce approval hashes.
  const output=new URL('./draft-queue.json',import.meta.url);
  const posts=parseDrafts(fs.readFileSync(source,'utf8'));
  fs.writeFileSync(output,JSON.stringify(posts,null,2)+'\n');
  console.log(`Imported ${posts.length} drafts; live queue unchanged; human review required`);
}
