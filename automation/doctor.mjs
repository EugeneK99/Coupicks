import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync(new URL('./config.json',import.meta.url)));
const checks={
  threadsToken:Boolean(process.env.THREADS_ACCESS_TOKEN),
  threadsUser:Boolean(process.env.THREADS_USER_ID),
  durableStorage:process.env.PUBLISH_STATE_BACKEND==='durable-db',
  catalogVerification:process.env.CATALOG_VERIFIER==='configured',
  paused:config.paused,
};
console.log(JSON.stringify({checks,ready:false,next:'OAuth, durable storage and verifier must be integrated and tested before activation'},null,2));
