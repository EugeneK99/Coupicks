import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT = new URL('../', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, ROOT), 'utf8'));
const write = (name, value) => { const p = fileURLToPath(new URL(name,ROOT)); fs.writeFileSync(p+'.tmp', JSON.stringify(value,null,2)+'\n'); fs.renameSync(p+'.tmp',p); };
export function validateContent(post, config) {
  if(/\[[^\]\r\n]+\]/u.test(post.text||'')) throw Error('placeholder_remaining');
  const affiliate=/(?:link\.coupang\.com|coupa\.ng)(?:[\/:?#\s]|$)/i.test(post.text||'') || (post.productIds||[]).length>0 || post.requiresProductSelection;
  if(affiliate) {
    if(!config.disclosure || !post.text?.startsWith(config.disclosure)) throw Error('missing_disclosure');
    if(!Array.isArray(post.productIds) || !post.productIds.length) throw Error('missing_product_ids');
    if(!['direct','site'].includes(post.linkMode)) throw Error('unassigned_link_mode');
  }
}
export function eligible(post, products, now, config) {
  if(config.paused || post.status !== 'scheduled') return false;
  const due = Date.parse(post.scheduledAt);
  if(!Number.isFinite(due) || due>now) return false;
  if(now-due>config.maxDelayMinutes*60000) throw Error('missed_slot');
  if(!post.text?.trim() || [...post.text].length>config.maxTextLength) throw Error('invalid_text');
  validateContent(post,config);
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
const norm = s => String(s||'').replace(/\r\n/g,'\n').trim();
const ACTIVE = ['scheduled','publishing','needs_remote_check'];
// 원격(Threads)에 같은 본문이 이미 있으면 published 로 맞춘다.
// 상태 저장(push)이 실패해 로컬 상태를 잃어도 같은 글이 두 번 올라가지 않게 하는 안전장치.
export function reconcile(queue, remote) {
  let changed=false;
  for(const post of queue) {
    if(!ACTIVE.includes(post.status)) continue;
    const since=Date.parse(post.scheduledAt)-5*60000;
    const hit=remote.find(r=>norm(r.text)===norm(post.text) && Date.parse(r.timestamp)>=since);
    if(!hit) continue;
    post.status='published'; post.remoteId=hit.id; post.publishedAt=new Date(hit.timestamp).toISOString(); post.reason='reconciled_from_remote';
    changed=true;
  }
  return changed;
}
async function api(path, token, params={}, method='POST') {
  const body = new URLSearchParams({...params,access_token:token});
  const url = 'https://graph.threads.net/v1.0/'+path;
  let response;
  try {response=await fetch(method==='GET'?url+'?'+body:url, {method, ...(method==='POST'?{body}:{}), signal:AbortSignal.timeout(25000)});}
  catch {throw Object.assign(Error('threads_network_error'),{transient:true});}
  let result;
  try {result=await response.json();} catch {throw Object.assign(Error('threads_invalid_response_'+response.status),{transient:response.status>=500});}
  if(!response.ok || result.error) {
    const e=result.error||{};
    const detail=String(e.message||'').split(token).join('***');
    throw Object.assign(Error('threads_api_error_'+response.status+(e.code?'_'+e.code:'')+(e.error_subcode?'_'+e.error_subcode:'')+(detail?': '+detail:'')),{transient:response.status>=500 && response.status<=599});
  }
  return result;
}
// 게시(publish) 전에 컨테이너가 FINISHED 인지 확인한다. 만들자마자 게시하면 400 이 날 수 있다.
export async function waitForContainer(apiFn, id, token, {tries=12, delayMs=3000, sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
  for(let i=0;i<tries;i++) {
    const s=await apiFn(id,token,{fields:'status,error_message'},'GET');
    if(s.status==='FINISHED') return s;
    if(['ERROR','EXPIRED'].includes(s.status)) throw Error('container_'+String(s.status).toLowerCase());
    await sleep(delayMs);
  }
  throw Error('container_not_ready');
}
// Retry only container creation, never an ambiguous publish request.
export async function publishPost(post, userId, token, config, {apiFn=api,save=()=>{},nowFn=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
  try {
    if(post.containerId) throw Error('existing_container_requires_remote_check');
    while(true) {
      if(nowFn()>Date.parse(post.scheduledAt)+config.maxDelayMinutes*60000) throw Error('missed_slot');
      try {
        const container=await apiFn(userId+'/threads',token,{media_type:'TEXT',text:post.text});
        if(!container.id) throw Error('missing_container_id');
        post.containerId=container.id;save();break;
      } catch(e) {
        if(post.containerId || !e.transient || (post.creationRetries||0)>=2) throw e;
        const delay=1000;
        if(nowFn()+delay>Date.parse(post.scheduledAt)+config.maxDelayMinutes*60000) throw Error('missed_slot');
        post.creationRetries=(post.creationRetries||0)+1;save();
        await sleep(delay);
      }
    }
    await waitForContainer(apiFn,post.containerId,token,{sleep});
    const result=await apiFn(userId+'/threads_publish',token,{creation_id:post.containerId});
    if(!result.id) throw Error('missing_publish_id');
    post.remoteId=result.id;post.status='published';post.publishedAt=new Date(nowFn()).toISOString();save();
  } catch(e) {
    post.status=post.containerId?'needs_remote_check':'held';post.reason=e.message;save();throw e;
  }
}
export async function run({live=false, now=Date.now()}={}) {
  const config=read('automation/config.json'), queue=read('automation/queue.json'), products=read('automation/catalog.json');
  if(config.paused) {console.log('Paused: no publication'); return;}
  for(const post of queue) {
    if(post.status==='publishing') {post.status='needs_remote_check'; write('automation/queue.json',queue);}
  }
  let me;
  if(live && queue.some(p=>ACTIVE.includes(p.status))) {
    if(!process.env.THREADS_ACCESS_TOKEN || !process.env.THREADS_USER_ID) throw Error('missing_connection');
    // Verify token belongs to the intended account before reading or publishing.
    me=await api('me',process.env.THREADS_ACCESS_TOKEN,{fields:'id,username'},'GET');
    if(me.id!==process.env.THREADS_USER_ID || me.username!==config.username) throw Error('wrong_account');
    const remote=(await api(me.id+'/threads',process.env.THREADS_ACCESS_TOKEN,{fields:'id,text,timestamp',limit:'25'},'GET')).data||[];
    if(reconcile(queue,remote)) write('automation/queue.json',queue);
  }
  const localDay=new Date(now+9*3600000).toISOString().slice(0,10);
  if(queue.some(p=>p.publishedAt && new Date(Date.parse(p.publishedAt)+9*3600000).toISOString().slice(0,10)===localDay)) return;
  for(const post of queue) {
    let ready;
    try {ready=eligible(post,products,now,config);} catch(e) {post.status='held'; post.reason=e.message; write('automation/queue.json',queue); continue;}
    if(!ready) continue;
    if(!live) {console.log('Dry run eligible:',post.id); continue;}
    post.status='publishing';post.attemptId=crypto.randomUUID();write('automation/queue.json',queue);
    await publishPost(post,me.id,process.env.THREADS_ACCESS_TOKEN,config,{save:()=>write('automation/queue.json',queue)});
    break;
  }
}
if(process.argv[1]===fileURLToPath(import.meta.url)) await run({live:process.argv.includes('--live')});
