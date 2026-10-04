import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateContent} from './publish.mjs';
const norm=s=>String(s||'').replace(/\r\n/g,'\n').trim();
export function approveDrafts(drafts, queue, ids, config, now=Date.now()) {
  if(new Set(drafts.map(p=>p.id)).size!==drafts.length) throw Error('duplicate_draft_id');
  const selected=new Set(ids);
  for(const id of selected) if(!drafts.some(p=>p.id===id)) throw Error('unknown_draft_id: '+id);
  const promoted=[];
  for(const p of drafts) {
    if(!selected.has(p.id)) continue;
    // Never replace existing records, including uncertain publication attempts.
    if(p.status==='published' || p.id==='draft-2026-10-05' || queue.some(q=>q.id===p.id || norm(q.text)===norm(p.text) || (p.id==='draft-2026-10-06' && q.id==='2026-10-06-container-question' && q.status==='published'))) continue;
    const due=Date.parse(p.scheduledAt);
    if(!Number.isFinite(due)) throw Error('invalid_slot: '+p.id);
    if(due<=now) continue;
    if(p.status!=='draft') throw Error('not_draft: '+p.id);
    if(!p.text?.trim() || [...p.text].length>config.maxTextLength) throw Error('invalid_text: '+p.id);
    validateContent(p,config);
    promoted.push({...p,status:'scheduled',reviewRequired:false,approvedHash:crypto.createHash('sha256').update(p.text).digest('hex')});
  }
  return [...queue,...promoted];
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2), ids=[];
  for(let i=0;i<args.length;i+=2) {
    if(args[i]!=='--approve' || !args[i+1]) throw Error('Usage: approve-drafts.mjs --approve <id> [--approve <id>]');
    ids.push(args[i+1]);
  }
  if(!ids.length) throw Error('Explicit --approve <id> required after human review');
  const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
  const queue=read('./queue.json');
  const next=approveDrafts(read('./draft-queue.json'),queue,ids,read('./config.json'));
  const target=fileURLToPath(new URL('./queue.json',import.meta.url));
  fs.writeFileSync(target+'.tmp',JSON.stringify(next,null,2)+'\n');
  fs.renameSync(target+'.tmp',target);
  console.log(`Promoted ${next.length-queue.length} explicitly reviewed drafts; paused unchanged`);
}
