import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function parseDrafts(markdown, year=2026, {published=[], fromDate}={}) {
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
  // Intro was posted manually; the container question has a different live queue ID.
  const norm=text=>String(text||'').replace(/\r\n/g,'\n').trim();
  const remaining=result.filter(p=>p.id!=='draft-2026-10-05' && !published.some(q=>q.status==='published' && (q.id===p.id || norm(q.text)===norm(p.text) || (p.id==='draft-2026-10-06' && q.id==='2026-10-06-container-question'))));
  if(fromDate) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) throw Error('Invalid from-date');
    const cursor=new Date(fromDate+'T08:00:00.000Z');
    if(!Number.isFinite(cursor.getTime()) || cursor.toISOString().slice(0,10)!==fromDate) throw Error('Invalid from-date');
    for(const p of remaining) {
      while([0,6].includes(cursor.getUTCDay())) cursor.setUTCDate(cursor.getUTCDate()+1);
      p.originalScheduledAt=p.scheduledAt;
      p.scheduledAt=cursor.toISOString();
      cursor.setUTCDate(cursor.getUTCDate()+1);
    }
  }
  return remaining;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const source=new URL('../docs/month-one-drafts.md',import.meta.url);
  // Separate staging output: never overwrite live queue or produce approval hashes.
  const output=new URL('./draft-queue.json',import.meta.url);
  const args=process.argv.slice(2);
  if(args.length && (args.length!==2 || args[0]!=='--from-date')) throw Error('Usage: import-drafts.mjs [--from-date YYYY-MM-DD]');
  const published=JSON.parse(fs.readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
  const posts=parseDrafts(fs.readFileSync(source,'utf8'),2026,{published,fromDate:args[1]});
  fs.writeFileSync(output,JSON.stringify(posts,null,2)+'\n');
  console.log(`Imported ${posts.length} drafts; live queue unchanged; human review required`);
}
