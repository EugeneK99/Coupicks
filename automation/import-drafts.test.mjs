import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseDrafts} from './import-drafts.mjs';
import {eligible} from './publish.mjs';
test('monthly staging contains 19 non-publishable drafts without approval hashes',()=>{
 const p=parseDrafts(fs.readFileSync(new URL('../docs/month-one-drafts.md',import.meta.url),'utf8'));
 assert.equal(p.length,19);assert.equal(p.filter(x=>x.requiresProductSelection).length,8);
 assert.equal(p[0].scheduledAt,'2026-10-06T08:00:00.000Z');
 for(const x of p){assert.equal(x.status,'draft');assert.equal(Object.hasOwn(x,'approvedHash'),false);assert.equal(eligible(x,[],Date.now(),{paused:false}),false);}
});
test('reject impossible dates and duplicate slots',()=>{
 assert.throws(()=>parseDrafts('## 2/30 월 · X\ntext'),/Invalid/);
 assert.throws(()=>parseDrafts('## 10/5 월 · X\ntext\n## 10/5 월 · Y\ntext'),/Duplicate/);
});

test('latest affiliate drafts use configured disclosure',()=>{
 const config=JSON.parse(fs.readFileSync(new URL('./config.json',import.meta.url)));
 const posts=parseDrafts(fs.readFileSync(new URL('../docs/month-one-drafts.md',import.meta.url),'utf8'));
 for(const p of posts.filter(x=>x.requiresProductSelection)) assert.ok(p.text.startsWith(config.disclosure));
});
test('excludes manual intro and published question with a different id',()=>{
 const md=fs.readFileSync(new URL('../docs/month-one-drafts.md',import.meta.url),'utf8');
 const posts=parseDrafts(md,2026,{published:[{id:'2026-10-06-container-question',status:'published',text:'different text'}]});
 assert.equal(posts.length,18);
 assert.ok(!posts.some(p=>['draft-2026-10-05','draft-2026-10-06'].includes(p.id)));
 const published={...posts[0],id:'another-id',status:'published'};
 assert.ok(!parseDrafts(md,2026,{published:[published]}).some(p=>p.text===published.text));
});
test('from-date moves remaining slots to weekdays at 17 KST without changing ids',()=>{
 const md='## 10/7 수 · A\na\n## 10/8 목 · B\nb';
 const posts=parseDrafts(md,2026,{fromDate:'2026-10-10'});
 assert.deepEqual(posts.map(p=>p.scheduledAt),['2026-10-12T08:00:00.000Z','2026-10-13T08:00:00.000Z']);
 assert.equal(posts[0].id,'draft-2026-10-07');
 assert.throws(()=>parseDrafts(md,2026,{fromDate:'2026-02-30'}),/Invalid/);
});
