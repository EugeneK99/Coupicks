import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {approveDrafts} from './approve-drafts.mjs';
const now=Date.parse('2026-10-04T10:00:00Z');
const config={maxTextLength:500,disclosure:'고지'};
const draft=(id='a')=>({id,text:'본문 '+id,status:'draft',scheduledAt:'2026-10-05T08:00:00Z',productIds:[],linkMode:'none'});
test('only explicitly approved drafts get hashes; no input mutation',()=>{
 const drafts=[draft(),draft('b')];
 const out=approveDrafts(drafts,[],['a'],config,now);
 assert.equal(out.length,1);assert.equal(out[0].status,'scheduled');
 assert.equal(out[0].approvedHash,crypto.createHash('sha256').update(out[0].text).digest('hex'));
 assert.equal(drafts[0].approvedHash,undefined);
 assert.deepEqual(approveDrafts(drafts,[],[],config,now),[]);
 assert.throws(()=>approveDrafts(drafts,[],['missing'],config,now),/unknown/);
});
test('published, past and existing uncertain records are excluded',()=>{
 const existing={...draft(),status:'needs_remote_check'};
 const drafts=[draft(),{...draft('past'),scheduledAt:'2026-10-04T08:00:00Z'},{...draft('done'),status:'published'},draft('draft-2026-10-05'),draft('draft-2026-10-06')];
 const q=[existing,{id:'2026-10-06-container-question',status:'published',text:'other'}];
 assert.deepEqual(approveDrafts(drafts,q,drafts.map(p=>p.id),config,now),q);
 assert.deepEqual(approveDrafts([draft('different-id')],[{...draft('different-id'),id:'old',status:'published'}],['different-id'],config,now).length,1);
});
test('affiliate selection and link mode must be final; placeholders rejected',()=>{
 const p={...draft(),text:'고지 https://link.coupang.com/a/x',requiresProductSelection:true};
 assert.throws(()=>approveDrafts([p],[],['a'],config,now),/product_ids/);
 assert.throws(()=>approveDrafts([{...p,productIds:['x']}],[],['a'],config,now),/link_mode/);
 assert.equal(approveDrafts([{...p,productIds:['x'],linkMode:'direct'}],[],['a'],config,now).length,1);
 assert.throws(()=>approveDrafts([{...draft(),text:'본문 [파트너스 링크]'}],[],['a'],config,now),/placeholder/);
});
