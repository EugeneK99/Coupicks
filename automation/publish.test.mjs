import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {eligible,reconcile,waitForContainer} from './publish.mjs';
import {refreshToken} from './refresh-token.mjs';
import {authorizeUrl,parseCode,exchange} from './oauth-token.mjs';
const now=Date.parse('2026-10-05T08:00:00Z');
const config={paused:false,maxDelayMinutes:30,maxTextLength:500,verificationHours:2,disclosure:'広告'};
const make=()=>({id:'intro',text:'Hello',status:'scheduled',scheduledAt:'2026-10-05T08:00:00Z',approvedHash:crypto.createHash('sha256').update('Hello').digest('hex'),productIds:[]});
test('due verified revision passes, future and paused do not',()=>{assert.equal(eligible(make(),[],now,config),true);assert.equal(eligible(make(),[],now-1,config),false);assert.equal(eligible(make(),[],now,{...config,paused:true}),false);});
test('changed text, missed slot and published records cannot publish',()=>{assert.throws(()=>eligible({...make(),text:'Changed'},[],now,config),/revision/);assert.throws(()=>eligible(make(),[],now+31*60000,config),/missed/);assert.equal(eligible({...make(),status:'published'},[],now,config),false);});
test('affiliate requires disclosure and fresh evidence',()=>{assert.throws(()=>eligible({...make(),productIds:['x']},[],now,config),/disclosure/);const p={...make(),text:'広告 https://link.coupang.com/a/x',productIds:['x'],linkMode:'direct'};p.approvedHash=crypto.createHash('sha256').update(p.text).digest('hex');assert.throws(()=>eligible(p,[{id:'x',status:'verified',checkedAt:'bad'}],now,config),/unverified/);assert.equal(eligible(p,[{id:'x',status:'verified',checkedAt:new Date(now).toISOString(),affiliateUrl:'https://link.coupang.com/a/x'}],now,config),true);});

test('remote reconcile marks an already-posted text as published and ignores unrelated or older posts',()=>{
  const q=[{...make(),text:'Hello\r\n'},{...make(),id:'other',text:'Other'}];
  const remote=[{id:'r1',text:'Hello',timestamp:'2026-10-05T08:00:05+0000'},{id:'old',text:'Other',timestamp:'2026-10-01T08:00:00+0000'}];
  assert.equal(reconcile(q,remote),true);
  assert.equal(q[0].status,'published');assert.equal(q[0].remoteId,'r1');
  assert.equal(q[1].status,'scheduled');
  assert.equal(reconcile(q,remote),false);
});
test('reconcile also resolves needs_remote_check but never touches held posts',()=>{
  const q=[{...make(),status:'needs_remote_check'},{...make(),id:'h',status:'held'}];
  const remote=[{id:'r1',text:'Hello',timestamp:'2026-10-05T08:01:00+0000'}];
  reconcile(q,remote);
  assert.equal(q[0].status,'published');assert.equal(q[1].status,'held');
});

test('token refresh returns the new token, and failures never leak the token',async()=>{
  const ok=async u=>({ok:true,status:200,json:async()=>({access_token:'NEW',expires_in:5184000}),_u:String(u)});
  assert.equal((await refreshToken('OLD',ok)).access_token,'NEW');
  const bad=async()=>({ok:false,status:400,json:async()=>({error:{message:'secret-OLD-token'}})});
  await assert.rejects(()=>refreshToken('OLD',bad),e=>/refresh_failed_400/.test(e.message)&&!/OLD/.test(e.message));
  await assert.rejects(()=>refreshToken('',ok),/not configured/);
});

test('oauth: authorize url has the needed scopes and code parsing accepts a full url or a bare code',()=>{
  const u=new URL(authorizeUrl('123','https://example.com/cb/'));
  assert.equal(u.searchParams.get('client_id'),'123');assert.equal(u.searchParams.get('scope'),'threads_basic,threads_content_publish');assert.equal(u.searchParams.get('response_type'),'code');
  assert.equal(parseCode('https://example.com/cb/?code=ABC123#_'),'ABC123');
  assert.equal(parseCode('ABC123#_'),'ABC123');assert.equal(parseCode('  ABC123 '),'ABC123');
  assert.throws(()=>parseCode(''),/code_missing/);assert.throws(()=>parseCode('https://example.com/cb/'),/code_missing/);
});
test('oauth: exchange goes code -> short -> long token, checks the account, and never leaks secrets in errors',async()=>{
  const seen=[];
  const ok=async(u,o)=>{u=String(u);seen.push(u.split('?')[0]);
    if(u.includes('/oauth/access_token'))return {ok:true,status:200,json:async()=>({access_token:'SHORT',user_id:'42'})};
    if(u.includes('th_exchange_token'))return {ok:true,status:200,json:async()=>({access_token:'LONG',expires_in:5184000})};
    return {ok:true,status:200,json:async()=>({id:'42',username:'salraemallae.pick'})};};
  const r=await exchange('CODE','SECRET',ok);
  assert.deepEqual([r.token,r.userId,r.username],['LONG','42','salraemallae.pick']);
  assert.equal(seen.length,3);
  const other=async u=>({ok:true,status:200,json:async()=>String(u).includes('/me')?{id:'7',username:'someone.else'}:{access_token:'X'}});
  await assert.rejects(()=>exchange('CODE','SECRET',other),/wrong_account/);
  const bad=async()=>({ok:false,status:400,json:async()=>({error_message:'leaked SECRET CODE'})});
  await assert.rejects(()=>exchange('CODE1234','SECRET1234',async()=>({ok:false,status:400,json:async()=>({error_message:'Invalid code CODE1234 for SECRET1234'})})),e=>/oauth_error_400/.test(e.message)&&/Invalid code \*\*\* for \*\*\*/.test(e.message)&&!/CODE1234|SECRET1234/.test(e.message));
  await assert.rejects(()=>exchange('CODE','',ok),/not configured/);
});

test('waitForContainer polls until FINISHED, fails fast on ERROR, and gives up after the retry limit',async()=>{
  const seq=['IN_PROGRESS','IN_PROGRESS','FINISHED'];let n=0;
  const noSleep=async()=>{};
  const ok=async()=>({status:seq[n++]});
  assert.equal((await waitForContainer(ok,'c','t',{sleep:noSleep})).status,'FINISHED');assert.equal(n,3);
  await assert.rejects(()=>waitForContainer(async()=>({status:'ERROR'}),'c','t',{sleep:noSleep}),/container_error/);
  await assert.rejects(()=>waitForContainer(async()=>({status:'IN_PROGRESS'}),'c','t',{sleep:noSleep,tries:3}),/container_not_ready/);
});

test('affiliate URLs cannot bypass disclosure and product IDs',()=>{
 for(const url of ['https://link.coupang.com/a/x','https://coupa.ng/test']) {
  const p={...make(),text:url};p.approvedHash=crypto.createHash('sha256').update(p.text).digest('hex');
  assert.throws(()=>eligible(p,[],now,config),/missing_disclosure/);
  p.text='広告 '+url;p.approvedHash=crypto.createHash('sha256').update(p.text).digest('hex');
  assert.throws(()=>eligible(p,[],now,config),/missing_product_ids/);
 }
});
test('unfilled bracket placeholders are held by eligibility guard',()=>{
 const p={...make(),text:'Hello [A 정확한 옵션]'};
 p.approvedHash=crypto.createHash('sha256').update(p.text).digest('hex');
 assert.throws(()=>eligible(p,[],now,config),/placeholder_remaining/);
});
