// 파트너스 위젯 주소(coupa.ng/xxxx)에서 상품 이미지·상품명을 읽어 온다.
// 위젯은 partners.coupangcdn.com/widget/... 로 리다이렉트되며, 상품 정보가 쿼리에 들어 있다.
//
// 사용법:
//   node scripts/widget-info.mjs coupa.ng/cqh2Rj            # 이미지·상품명 출력
//   node scripts/widget-info.mjs --fill                     # products.js 의 image 가 빈 상품 중 widget 이 있는 것을 채움
//
// 주의: 쿠팡 CDN 이미지를 직접 링크하므로 주소가 바뀌면 깨질 수 있다. 위젯(iframe)은 상세 페이지에 그대로 둔다.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

export function parseWidgetUrl(finalUrl) {
  const u=new URL(finalUrl);
  const img=u.searchParams.get('productImage');
  const title=u.searchParams.get('productDescription');
  if(!img||!title) throw Error('widget_info_missing');
  // 위젯은 212px 썸네일을 준다. 카드용으로 492px 로 키운다(뷰티 상품과 같은 크기).
  return {image:img.replace('/212x212ex/','/492x492ex/'),title};
}

export async function widgetInfo(widget) {
  const url=/^https?:/.test(widget)?widget:'https://'+widget;
  const res=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(20000)});
  if(!res.ok) throw Error('widget_fetch_failed_'+res.status);
  return parseWidgetUrl(res.url);
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const arg=process.argv[2];
  if(!arg) throw Error('Usage: widget-info.mjs <coupa.ng/xxxx> | --fill');
  if(arg!=='--fill') {
    const info=await widgetInfo(arg);
    console.log(JSON.stringify(info,null,2));
  } else {
    const file=fileURLToPath(new URL('../products.js',import.meta.url));
    let s=fs.readFileSync(file,'utf8');
    const re=/slug: "([^"]+)",\s*\n\s*widget: "([^"]+)",[\s\S]*?\n(\s*)image: ""/g;
    const jobs=[...s.matchAll(re)].map(m=>({slug:m[1],widget:m[2]}));
    if(!jobs.length) console.log('채울 상품 없음');
    for(const j of jobs) {
      const info=await widgetInfo(j.widget);
      const pat=new RegExp('(slug: "'+j.slug+'",[\\s\\S]*?\\n\\s*image: )""');
      s=s.replace(pat,(_,a)=>a+JSON.stringify(info.image));
      console.log(`${j.slug}: ${info.title}`);
    }
    fs.writeFileSync(file,s);
    if(jobs.length) console.log('products.js 갱신 완료. node build.js 로 빌드하세요.');
  }
}
