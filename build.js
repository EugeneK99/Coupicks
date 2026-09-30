#!/usr/bin/env node
// 정적 빌드: products.js → 상품 상세 페이지(p/<slug>/), sitemap.xml, robots.txt,
// 그리고 index.html 의 SEO 태그/링크 블록을 자동 생성합니다.
// 사용법:  node build.js      (의존성 없음, Node 18+)

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const src = fs.readFileSync(path.join(ROOT, "products.js"), "utf8");
const ctx = {};
vm.runInNewContext(src + "\n;this.PRODUCTS=PRODUCTS;this.SITE_CONFIG=SITE_CONFIG;", ctx);
const { PRODUCTS, SITE_CONFIG } = ctx;

const BASE = String(SITE_CONFIG.siteUrl || "").replace(/\/$/, "");
if (!BASE) throw new Error("SITE_CONFIG.siteUrl 이 필요합니다.");

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 더미(EXAMPLE) 링크가 하나라도 있으면 검색엔진 색인을 막아 샘플 사이트가 노출되지 않게 함
const isPlaceholder = (p) => /EXAMPLE/i.test(p.link || "");
const hasPlaceholder = PRODUCTS.some(isPlaceholder);
const robotsMeta = hasPlaceholder
  ? '<meta name="robots" content="noindex, nofollow" />'
  : "";

const items = PRODUCTS.filter((p) => p && p.title && p.link).map((p, i) => ({
  ...p,
  slug: (p.slug || "item-" + (i + 1)).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
}));

const slugs = new Set();
items.forEach((p) => {
  if (slugs.has(p.slug)) throw new Error("slug 중복: " + p.slug);
  slugs.add(p.slug);
});

const ogImage = (p) => (p && p.image) || "";

// ── 상품 상세 페이지 ──
function productPage(p) {
  const url = `${BASE}/p/${p.slug}/`;
  const desc = p.desc || SITE_CONFIG.tagline;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: desc,
    ...(p.image ? { image: p.image } : {}),
    ...(p.rating != null && p.reviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(p.rating),
            reviewCount: Number(p.reviews),
          },
        }
      : {}),
  };
  const price =
    SITE_CONFIG.showPrice && p.price
      ? `<div class="price">${esc(p.price)}</div>`
      : "";
  const rating =
    p.rating != null
      ? `<div class="rating"><span class="stars">★</span><span>${Number(p.rating).toFixed(1)}${
          p.reviews != null ? ` (${Number(p.reviews).toLocaleString()})` : ""
        }</span></div>`
      : "";
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(p.title)} | ${esc(SITE_CONFIG.siteName)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${url}" />
    ${robotsMeta}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(p.title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${url}" />
    ${ogImage(p) ? `<meta property="og:image" content="${esc(ogImage(p))}" />` : ""}
    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
    <link rel="stylesheet" href="../../styles.css" />
    <script>try{if(localStorage.getItem("theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}</script>
  </head>
  <body>
    <div class="disclosure">${esc(SITE_CONFIG.disclosure)}</div>
    <main class="detail">
      <a class="back" href="../../">← ${esc(SITE_CONFIG.siteName)} 전체 보기</a>
      <article>
        ${p.category ? `<span class="cat-tag static">${esc(p.category)}</span>` : ""}
        <h1>${esc(p.title)}</h1>
        ${p.image ? `<img class="hero" src="${esc(p.image)}" alt="${esc(p.title)}" />` : ""}
        <p class="lead">${esc(desc)}</p>
        ${rating}
        ${price}
        ${p.review ? `<div class="review">${esc(p.review).replace(/\n/g, "<br>")}</div>` : ""}
        <a class="buy" href="${esc(p.link)}" target="_blank" rel="nofollow sponsored noopener">쿠팡에서 최저가 확인 →</a>
        <p class="note">${esc(SITE_CONFIG.disclosure)}<br>가격·재고는 수시로 변동되므로 쿠팡 상품 페이지에서 확인해 주세요.</p>
      </article>
    </main>
  </body>
</html>
`;
}

for (const p of items) {
  const dir = path.join(ROOT, "p", p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), productPage(p));
}

// 삭제된 상품의 옛 페이지 정리
const pDir = path.join(ROOT, "p");
if (fs.existsSync(pDir)) {
  for (const d of fs.readdirSync(pDir)) {
    if (!slugs.has(d)) fs.rmSync(path.join(pDir, d), { recursive: true, force: true });
  }
}

// ── index.html 블록 치환 ──
const head = [
  `<link rel="canonical" href="${BASE}/" />`,
  robotsMeta,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:title" content="${esc(SITE_CONFIG.siteName)}" />`,
  `<meta property="og:description" content="${esc(SITE_CONFIG.tagline)}" />`,
  `<meta property="og:url" content="${BASE}/" />`,
  items[0] && ogImage(items[0])
    ? `<meta property="og:image" content="${esc(ogImage(items[0]))}" />`
    : "",
  `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: SITE_CONFIG.siteName,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/p/${p.slug}/`,
      name: p.title,
    })),
  }).replace(/</g, "\\u003c")}</script>`,
]
  .filter(Boolean)
  .join("\n    ");

const links = `<nav class="seo-list" aria-label="상품 상세">${items
  .map((p) => `<a href="p/${p.slug}/">${esc(p.title)}</a>`)
  .join("")}</nav>`;

let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const swap = (name, body) => {
  const re = new RegExp(`<!--BUILD:${name}-->[\\s\\S]*?<!--/BUILD:${name}-->`);
  if (!re.test(html)) throw new Error(`index.html 에 BUILD:${name} 마커가 없습니다.`);
  html = html.replace(re, () => `<!--BUILD:${name}-->\n    ${body}\n    <!--/BUILD:${name}-->`);
};
swap("HEAD", head);
swap("LINKS", links);
fs.writeFileSync(path.join(ROOT, "index.html"), html);

// ── sitemap / robots ──
const today = new Date().toISOString().slice(0, 10);
const urls = [`${BASE}/`, ...items.map((p) => `${BASE}/p/${p.slug}/`)];
fs.writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`
);
fs.writeFileSync(
  path.join(ROOT, "robots.txt"),
  hasPlaceholder
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`
);


// ── 티스토리(블로그) 하단용 HTML 스니펫 페이지: blog/index.html ──
// 글 하단에 붙여넣는 용도. 항상 noindex (검색 노출 불필요).
const utm = "utm_source=tistory&utm_medium=blog";
const btn = (href, label) =>
  `<p style="text-align:center;margin:24px 0 8px;">\n` +
  `  <a href="${href}" target="_blank" rel="nofollow sponsored noopener"\n` +
  `     style="display:inline-block;padding:12px 24px;background:#ff5722;color:#fff;border-radius:10px;font-weight:700;text-decoration:none;">\n` +
  `    ${label} →\n  </a>\n</p>\n` +
  `<p style="font-size:12px;color:#888;text-align:center;margin:0 0 24px;">\n` +
  `  ${esc(SITE_CONFIG.disclosure)}\n</p>`;

const cats = [];
items.forEach((p) => p.category && !cats.includes(p.category) && cats.push(p.category));

const snippets = [
  { title: "전체 (스킨 하단·기본형)", code: btn(`${BASE}/?${utm}`, "오늘의 추천템 전체 보기") },
  ...cats.map((c) => ({
    title: `카테고리: ${c}`,
    code: btn(`${BASE}/?cat=${encodeURIComponent(c)}&${utm}`, `${esc(c)} 추천템 보기`),
  })),
  ...items.map((p) => ({
    title: `상품: ${p.title}`,
    code: btn(`${BASE}/p/${p.slug}/?${utm}`, `${esc(p.title)} 자세히 보기`),
  })),
];

fs.mkdirSync(path.join(ROOT, "blog"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "blog", "index.html"),
  `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" /><title>티스토리 하단 템플릿</title>
<link rel="stylesheet" href="../styles.css" />
<style>.wrap{max-width:720px;margin:0 auto;padding:24px 16px}.s{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px}
.s h2{font-size:1rem;margin-bottom:8px}textarea{width:100%;height:150px;font:12px/1.4 monospace;border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--bg);color:var(--text)}
button{margin-top:8px;padding:8px 16px;border:0;border-radius:8px;background:var(--brand);color:#fff;font-weight:700;cursor:pointer}.pv{margin-top:12px}</style></head>
<body><div class="wrap"><h1>티스토리 하단 템플릿</h1>
<p style="color:var(--muted);margin:8px 0 20px">티스토리 편집기를 <b>HTML 모드</b>로 바꾼 뒤 붙여넣으세요. 대가성 문구가 포함되어 있습니다. 링크의 utm 값으로 티스토리 유입을 구분합니다.</p>
${snippets
  .map(
    (s, i) => `<section class="s"><h2>${esc(s.title)}</h2><textarea id="t${i}" readonly>${esc(s.code)}</textarea>
<button onclick="navigator.clipboard.writeText(document.getElementById('t${i}').value);this.textContent='복사됨 ✓'">복사</button>
<div class="pv">${s.code}</div></section>`
  )
  .join("\n")}
</div></body></html>
`
);

console.log(
  `빌드 완료: 상품 ${items.length}개, 상세 페이지 ${items.length}개` +
    (hasPlaceholder ? "\n⚠ 더미(EXAMPLE) 링크 감지 → noindex 및 robots Disallow 적용됨" : "")
);
