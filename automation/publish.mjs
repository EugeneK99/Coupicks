import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT = new URL('../', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, ROOT), 'utf8'));
const write = (name, value) => { const p = fileURLToPath(new URL(name,ROOT)); fs.writeFileSync(p+'.tmp', JSON.stringify(value,null,2)+'\n'); fs.renameSync(p+'.tmp',p); };
export function eligible(post, products, now, config) {
  if(config.paused || post.status !== 'scheduled') return false;
  const due = Date.parse(post.scheduledAt);
  if(!Number.isFinite(due) || due>now) return false;
  if(now-due>config.maxDelayMinutes*60000) throw Error('missed_slot');
  if(!post.text?.trim() || [...post.text].length>config.maxTextLength) throw Error('invalid_text');
  if(post.approvedHash !== crypto.createHash('sha256').update(post.text).digest('hex')) throw Error('unverified_revision');
  if((post.productIds || []).length) {
    if(!post.text.startsWith(config.disclosure)) throw Error('missing_disclosure');
    for(const id of post.productIds) {
      const p=products.find(x=>x.id===id);
      if(!p || p.status!=='verified' || !p.checkedAt || now-Date.parse(p.checkedAt)>config.verificationHours*3600000 || Date.parse(p.checkedAt)>now || !Number.isFinite(Date.parse(p.checkedAt))) throw Error('product_unverified');
      if(!p.affiliateUrl?.startsWith('https://link.coupang.com/')) throw Error('invalid_affiliate_link');
      if(post.linkMode==='direct' && !post.text.includes(p.affiliateUrl)) throw Error('link_mismatch');
      if(post.linkMode==='site' && (!p.siteVerifiedAt || !post.text.includes(p.detailUrl))) throw Error('site_unverified');
    }
  }
  return true;
}
async function api(path, token, params={}, method='POST') {
  const body = new URLSearchParams({...params,access_token:token});
  const url = 'https://graph.threads.net/v1.0/'+path;
  const response=await fetch(method==='GET'?url+'?'+body:url, {method, ...(method==='POST'?{body}:{}), signal:AbortSignal.timeout(25000)});
  const result=await response.json();
  if(!response.ok || result.error) throw Error('threads_api_error_'+response.status);
  return result;
}
export async function run({live=false, now=Date.now()}={}) {
  const config=read('automation/config.json'), queue=read('automation/queue.json'), products=read('automation/catalog.json');
  if(config.paused) {console.log('Paused: no publication'); return;}
  for(const post of queue) {
    if(post.status==='publishing') {post.status='needs_remote_check'; write('automation/queue.json',queue);}
  }
  const localDay=new Date(now+9*3600000).toISOString().slice(0,10);
  if(queue.some(p=>p.publishedAt && new Date(Date.parse(p.publishedAt)+9*3600000).toISOString().slice(0,10)===localDay)) return;
  for(const post of queue) {
    let ready;
    try {ready=eligible(post,products,now,config);} catch(e) {post.status='held'; post.reason=e.message; write('automation/queue.json',queue); continue;}
    if(!ready) continue;
    if(!live) {console.log('Dry run eligible:',post.id); continue;}
    if(!process.env.THREADS_ACCESS_TOKEN || !process.env.THREADS_USER_ID) throw Error('missing_connection');
    // Verify token belongs to the intended account before publishing.
    const me=await api('me',process.env.THREADS_ACCESS_TOKEN,{fields:'id,username'},'GET');
    if(me.id!==process.env.THREADS_USER_ID || me.username!==config.username) throw Error('wrong_account');
    post.status='publishing';post.attemptId=crypto.randomUUID();write('automation/queue.json',queue);
    try {
      const container=await api(me.id+'/threads',process.env.THREADS_ACCESS_TOKEN,{media_type:'TEXT',text:post.text});
      post.containerId=container.id;write('automation/queue.json',queue);
      const result=await api(me.id+'/threads_publish',process.env.THREADS_ACCESS_TOKEN,{creation_id:container.id});
      post.remoteId=result.id;post.status='published';post.publishedAt=new Date(now).toISOString();write('automation/queue.json',queue);
    } catch(e) {post.status='needs_remote_check';post.reason=e.message;write('automation/queue.json',queue);throw e;}
    break;
  }
}
if(process.argv[1]===fileURLToPath(import.meta.url)) await run({live:process.argv.includes('--live')});
