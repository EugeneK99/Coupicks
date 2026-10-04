import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
// Threads 장기 토큰(약 60일)을 갱신한다. 토큰 값은 절대 출력하지 않고 TOKEN_OUT 파일에만 쓴다.
export async function refreshToken(token, fetchFn=fetch) {
  if(!token) throw Error('THREADS_ACCESS_TOKEN is not configured');
  const url=new URL('https://graph.threads.net/refresh_access_token');
  url.searchParams.set('grant_type','th_refresh_token');
  url.searchParams.set('access_token',token);
  const response=await fetchFn(url,{signal:AbortSignal.timeout(25000)});
  const data=await response.json();
  if(!response.ok || data.error || !data.access_token) throw Error('token_refresh_failed_'+response.status);
  return data;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const out=process.env.TOKEN_OUT;
  if(!out) throw Error('TOKEN_OUT is required');
  const data=await refreshToken(process.env.THREADS_ACCESS_TOKEN);
  console.log('::add-mask::'+data.access_token);
  fs.writeFileSync(out,data.access_token,{mode:0o600});
  console.log(JSON.stringify({refreshed:true,expiresInDays:Math.round((data.expires_in||0)/86400)}));
}
