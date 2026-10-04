import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseDrafts} from './import-drafts.mjs';
import {eligible} from './publish.mjs';
test('monthly staging contains 20 non-publishable drafts without approval hashes',()=>{
 const p=parseDrafts(fs.readFileSync(new URL('../docs/month-one-drafts.md',import.meta.url),'utf8'));
 assert.equal(p.length,20);assert.equal(p.filter(x=>x.requiresProductSelection).length,8);
 assert.equal(p[0].scheduledAt,'2026-10-05T08:00:00.000Z');
 for(const x of p){assert.equal(x.status,'draft');assert.equal(Object.hasOwn(x,'approvedHash'),false);assert.equal(eligible(x,[],Date.now(),{paused:false}),false);}
});
test('reject impossible dates and duplicate slots',()=>{
 assert.throws(()=>parseDrafts('## 2/30 월 · X\ntext'),/Invalid/);
 assert.throws(()=>parseDrafts('## 10/5 월 · X\ntext\n## 10/5 월 · Y\ntext'),/Duplicate/);
});
