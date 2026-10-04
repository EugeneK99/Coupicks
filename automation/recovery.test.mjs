import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publishPost} from './publish.mjs';
import {verifyRefreshedToken} from './refresh-token.mjs';
const now=Date.parse('2026-10-05T08:00:00Z');
const post=()=>({text:'hello',status:'publishing',scheduledAt:new Date(now).toISOString()});
const transient=()=>Object.assign(Error('temporary'),{transient:true});
const opts=apiFn=>({apiFn,nowFn:()=>now,sleep:async()=>{}});
test('container creation retries at most twice and persists retry count',async()=>{
 let attempts=0,saves=0;const p=post();
 await publishPost(p,'u','test',{maxDelayMinutes:30},{...opts(async path=>{
  if(path==='u/threads'){if(++attempts<3)throw transient();return {id:'c'};}
  if(path==='c')return {status:'FINISHED'};
  return {id:'r'};
 }),save:()=>saves++});
 assert.equal(attempts,3);assert.equal(p.creationRetries,2);assert.equal(p.status,'published');assert.ok(saves>=4);
 const bad=post();attempts=0;
 await assert.rejects(()=>publishPost(bad,'u','test',{maxDelayMinutes:30},opts(async()=>{attempts++;throw transient();})),/temporary/);
 assert.equal(attempts,3);assert.equal(bad.status,'held');
 const previous={...post(),creationRetries:2};attempts=0;
 await assert.rejects(()=>publishPost(previous,'u','test',{maxDelayMinutes:30},opts(async()=>{attempts++;throw transient();})),/temporary/);
 assert.equal(attempts,1);
});
test('permanent errors and expired slots do not retry',async()=>{
 let n=0;const p=post();
 await assert.rejects(()=>publishPost(p,'u','test',{maxDelayMinutes:30},opts(async()=>{n++;throw Error('400');})),/400/);
 assert.equal(n,1);assert.equal(p.status,'held');
 const expired={...post(),scheduledAt:new Date(now-31*60000).toISOString()};
 await assert.rejects(()=>publishPost(expired,'u','test',{maxDelayMinutes:30},opts(async()=>{n++;})),/missed_slot/);
 assert.equal(n,1);
 const boundary=post();
 await assert.rejects(()=>publishPost(boundary,'u','test',{maxDelayMinutes:30},{...opts(async()=>{n++;throw transient();}),nowFn:()=>now+30*60000}),/missed_slot/);
 assert.equal(boundary.creationRetries,undefined);
});
test('ambiguous publish or existing container stops for remote check without retry',async()=>{
 const p=post();let publishes=0;
 await assert.rejects(()=>publishPost(p,'u','test',{maxDelayMinutes:30},opts(async path=>{
  if(path==='u/threads')return {id:'c'};
  if(path==='c')return {status:'FINISHED'};
  publishes++;throw transient();
 })),/temporary/);
 assert.equal(publishes,1);assert.equal(p.status,'needs_remote_check');
 let calls=0;
 await assert.rejects(()=>publishPost({...post(),containerId:'c'},'u','test',{maxDelayMinutes:30},opts(async()=>{calls++;})),/remote_check/);
 assert.equal(calls,0);
});
test('new token must identify expected username and id; errors remain generic',async()=>{
 const ok=async()=>({ok:true,json:async()=>({id:'42',username:'salraemallae.pick'})});
 assert.equal(await verifyRefreshedToken('TEST','salraemallae.pick','42',ok),true);
 await assert.rejects(()=>verifyRefreshedToken('TEST','other','42',ok),/wrong_account/);
 await assert.rejects(()=>verifyRefreshedToken('TEST','salraemallae.pick','7',ok),/wrong_account/);
 await assert.rejects(()=>verifyRefreshedToken('TEST','salraemallae.pick','42',async()=>{throw Error('secret TEST');}),e=>e.message==='token_account_check_failed');
});
