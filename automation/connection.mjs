// No token values are printed. Provision secrets through the deployment environment.
const token=process.env.THREADS_ACCESS_TOKEN;
if(!token) throw Error('THREADS_ACCESS_TOKEN is not configured');
const refresh=process.argv.includes('--refresh');
const url=new URL(refresh?'https://graph.threads.net/refresh_access_token':'https://graph.threads.net/v1.0/me');
url.searchParams.set('access_token',token);
if(refresh) url.searchParams.set('grant_type','th_refresh_token');
else url.searchParams.set('fields','id,username');
const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
const data=await response.json();
if(!response.ok || data.error) throw Error(`connection_check_failed_${response.status}`);
if(refresh) {
  // Persist via a secret manager adapter, never stdout/Git. Fail closed until configured.
  throw Error('Secret persistence adapter required before automatic refresh; response discarded');
}
if(data.username!=='salraemallae.pick') throw Error('Unexpected Threads account');
console.log(JSON.stringify({connected:true,username:data.username,userId:data.id}));
