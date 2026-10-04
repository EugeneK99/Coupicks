import {spawnSync} from 'node:child_process';
import readline from 'node:readline/promises';
import {fileURLToPath} from 'node:url';
// Threads OAuth 로그인으로 장기 토큰을 받아 GitHub Secret 에 바로 저장한다 (토큰 발급기 우회용).
// 토큰·앱 시크릿은 절대 출력하지 않는다. 앱 시크릿은 환경변수 THREADS_APP_SECRET 로만 받는다.
//
//   node automation/oauth-token.mjs url        로그인 승인 주소를 출력
//   node automation/oauth-token.mjs exchange   승인 후 돌아온 주소(또는 code)를 붙여 넣으면 토큰 저장
//   (exchange 에 --dry 를 붙이면 계정 확인만 하고 Secret 은 저장하지 않는다)
const APP_ID = process.env.THREADS_APP_ID || '1584291259544800';
const REDIRECT = process.env.THREADS_REDIRECT_URI || 'https://eugenek99.github.io/Coupicks/';
const REPO = process.env.GITHUB_REPOSITORY_SLUG || 'EugeneK99/Coupicks';
const USERNAME = 'salraemallae.pick';
const SCOPES = 'threads_basic,threads_content_publish';

export function authorizeUrl(appId=APP_ID, redirect=REDIRECT) {
  const u = new URL('https://threads.net/oauth/authorize');
  u.searchParams.set('client_id', appId);
  u.searchParams.set('redirect_uri', redirect);
  u.searchParams.set('scope', SCOPES);
  u.searchParams.set('response_type', 'code');
  return u.toString();
}
// 돌아온 전체 주소를 붙여도, code 만 붙여도 된다. Threads 가 붙이는 '#_' 꼬리는 제거한다.
export function parseCode(input) {
  const s = String(input || '').trim();
  if(!s) throw Error('code_missing');
  let code = s;
  if(/^https?:\/\//.test(s)) {
    code = new URL(s).searchParams.get('code');
    if(!code) throw Error('code_missing');
  }
  return code.replace(/#_$/, '').replace(/#.*$/, '');
}
async function call(url, opts, fetchFn) {
  const r = await fetchFn(url, {...opts, signal: AbortSignal.timeout(25000)});
  const data = await r.json();
  if(!r.ok || data.error || data.error_message) throw Error('threads_oauth_error_' + r.status + (data.error_type ? '_' + data.error_type : ''));
  return data;
}
// 단기 토큰 → 장기 토큰 → 계정 확인. 반환: {token, userId, username, expiresIn}
export async function exchange(code, secret, fetchFn=fetch) {
  if(!secret) throw Error('THREADS_APP_SECRET is not configured');
  const short = await call('https://graph.threads.net/oauth/access_token', {
    method: 'POST',
    body: new URLSearchParams({client_id: APP_ID, client_secret: secret, grant_type: 'authorization_code', redirect_uri: REDIRECT, code}),
  }, fetchFn);
  const lu = new URL('https://graph.threads.net/access_token');
  lu.searchParams.set('grant_type', 'th_exchange_token');
  lu.searchParams.set('client_secret', secret);
  lu.searchParams.set('access_token', short.access_token);
  const long = await call(lu, {}, fetchFn);
  const mu = new URL('https://graph.threads.net/v1.0/me');
  mu.searchParams.set('fields', 'id,username');
  mu.searchParams.set('access_token', long.access_token);
  const me = await call(mu, {}, fetchFn);
  if(me.username !== USERNAME) throw Error('wrong_account');
  return {token: long.access_token, userId: String(me.id), username: me.username, expiresIn: long.expires_in};
}
function setSecret(name, value) {
  const r = spawnSync('gh', ['secret', 'set', name, '--repo', REPO], {input: value, encoding: 'utf8'});
  if(r.status !== 0) throw Error('gh_secret_set_failed_' + name);
}
if(process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if(mode === 'url') {
    console.log('@' + USERNAME + ' 로 로그인된 브라우저에서 아래 주소를 열고 승인하세요:\n\n' + authorizeUrl());
  } else if(mode === 'exchange') {
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    const code = parseCode(await rl.question('승인 후 돌아온 주소(또는 code)를 붙여 넣고 Enter: '));
    rl.close();
    const r = await exchange(code, process.env.THREADS_APP_SECRET);
    if(process.argv.includes('--dry')) {
      console.log(JSON.stringify({ok: true, dry: true, username: r.username, userId: r.userId, expiresInDays: Math.round((r.expiresIn || 0) / 86400)}));
    } else {
      setSecret('THREADS_ACCESS_TOKEN', r.token);
      setSecret('THREADS_USER_ID', r.userId);
      console.log(JSON.stringify({ok: true, stored: ['THREADS_ACCESS_TOKEN', 'THREADS_USER_ID'], username: r.username, userId: r.userId, expiresInDays: Math.round((r.expiresIn || 0) / 86400)}));
    }
  } else {
    console.log('usage: node automation/oauth-token.mjs url | exchange [--dry]');
    process.exitCode = 1;
  }
}
