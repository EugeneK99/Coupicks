// No token values are printed. Provision secrets through the deployment environment.
const token=process.env.THREADS_ACCESS_TOKEN;
if(!token) throw Error('THREADS_ACCESS_TOKEN is not configured');
const url=new URL('https://graph.threads.net/v1.0/me');
url.searchParams.set('access_token',token);
url.searchParams.set('fields','id,username');
const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
const data=await response.json();
if(!response.ok || data.error) throw Error(`connection_check_failed_${response.status}`);
if(data.username!=='salraemallae.pick') throw Error('Unexpected Threads account');
if(process.env.THREADS_USER_ID && String(data.id)!==process.env.THREADS_USER_ID) throw Error('user_id_mismatch');
console.log(JSON.stringify({connected:true,username:data.username,userId:data.id}));
