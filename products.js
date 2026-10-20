// ============================================================
//  상품 데이터 파일  ── 여기만 수정하면 됩니다!
// ============================================================
//
//  상품을 추가하려면 아래 배열에 { } 블록을 하나 더 복사해서 붙여넣고
//  내용만 바꾸면 됩니다. 다른 파일(index.html, styles.css)은
//  건드릴 필요가 없습니다.
//
//  각 항목 설명:
//   - widget   : 쿠팡파트너스 다이나믹 배너 주소 (선택, 예: "coupa.ng/cpOiiO").
//                이미지·가격이 쿠팡에서 자동 갱신됨. widgetHeight 로 높이(px) 조절
//   - slug     : 상품 상세 페이지 주소용 영문 id (권장, 예: "cordless-vacuum")
//   - title    : 상품 이름 (필수)
//   - link     : 쿠팡파트너스에서 생성한 "내 제휴 링크" (필수)
//                예: https://link.coupang.com/a/XXXXXX
//   - image    : 상품 이미지 주소 (선택, 없으면 회색 박스로 표시)
//   - price    : 가격 텍스트 (선택, 예: "29,900원")
//   - desc     : 한 줄 설명 (선택)
//   - badge    : 카드 위 라벨 (선택, 예: "베스트", "특가")
//   - category : 분류 (선택). 넣으면 상단에 필터 탭이 자동 생성됨
//                예: "가전", "패션", "주방"
//   - rating   : 별점 (선택, 0~5 숫자. 예: 4.5)
//   - reviews  : 후기 수 (선택, 숫자. 예: 1280)
//   - review   : 추천 이유/상세 설명 (선택). 상세 페이지 본문이 되어 SEO에 도움됨
//   - sortPrice: 정렬용 숫자 가격 (선택, 예: 129000). 넣으면 가격순 정렬 정확해짐
//
//  아래 데이터에는 기존 제휴 링크가 포함되어 있습니다.
//     신규 링크는 계정에서 생성하고 도착 상품·옵션을 확인하세요.
// ============================================================

const PRODUCTS = [
  {
    slug: "bluetooth-speaker",
    widget: "coupa.ng/cpOiiO",
    title: "브리츠 BZ-TX11 블루투스 스피커 (화이트)",
    link: "https://link.coupang.com/a/hrDCk4WEMu",
    image: "https://thumbnail14.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2025/04/01/14/5/0e90bf38-0afc-4877-bcf5-1260296d333a.jpg",
    desc: "집에서 노래를 크게 틀고 싶을 때 쓰는 블루투스 스피커",
    badge: "",
    category: "음악",
    review:
      "블로그의 팝송 해석 글(ROSÉ & Bruno Mars - APT.)과 함께 소개한 스피커예요. 노래를 볼륨 높여 함께 즐기고 싶을 때 이어폰보다 스피커가 잘 맞습니다.",
  },
  {
    slug: "daily-headphone",
    widget: "coupa.ng/cpOimb",
    title: "소니 WH-CH520 블루투스 헤드폰 (화이트)",
    link: "https://link.coupang.com/a/hrDIjVXVim",
    image: "https://thumbnail8.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/475e/b77f2920c43f3be341a60fd8d4505160aa223071785df37d91b18a9ae480.jpg",
    desc: "강한 비트의 곡을 제대로 듣기 좋은 데일리 헤드폰",
    badge: "",
    category: "음악",
    review:
      "블로그의 팝송 해석 글(ADÉLA - Homewrecked)과 함께 소개한 헤드폰이에요. 비트와 저음이 살아 있는 곡은 헤드폰으로 들으면 몰입감이 좋습니다.",
  },
  {
    slug: "nc-earphone",
    widget: "coupa.ng/cpOieh",
    title: "QCY HT19 MeloB 노이즈캔슬링 블루투스 이어폰 (블랙)",
    link: "https://link.coupang.com/a/hrDtRdrFqC",
    image: "https://t1a.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2026/07/27/16/1/0bc5a069-1c04-4f34-9c68-41ff26f4f150.jpg",
    desc: "잔잔하고 섬세한 곡을 조용하게 듣기 좋은 노이즈캔슬링 이어폰",
    badge: "",
    category: "음악",
    review:
      "블로그의 팝송 해석 글(Laufey - From The Start)과 함께 소개한 이어폰이에요. 보사노바처럼 섬세한 곡은 주변 소음을 줄여 주는 이어폰이 어울립니다.",
  },
  {
    slug: "moistrue-tuna",
    title: "동원 뉴트리플랜 모이스트루 참치 (고양이 습식 파우치 80g)",
    link: "https://link.coupang.com/a/hrlvkvg2cm",
    image: "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/358795671196688-c5f1f9bd-b9f7-41f6-8112-92b45d41fcf1.png",
    desc: "밥을 거부하던 시기에 먹어준 참치맛 습식 파우치 (직접 구매해 급여)",
    badge: "",
    category: "고양이",
    review:
      "간부전 회복기에 밥을 거의 안 먹던 저희 고양이가 먹어준 습식 파우치예요. 참치맛과 참치&닭고기맛을 합쳐 총 4박스를 먹였고, 뒤처리가 간편한 점이 좋았어요. 80g 한 팩을 한 번에 다 못 먹는 경우엔 남은 양을 밀폐용기에 소분해 냉장 보관했어요.\n직접 구매해서 먹여본 개인 경험이며 질병 치료 효과를 의미하지 않습니다. 질환이 있는 고양이는 사료를 바꾸기 전에 꼭 수의사와 상담해 주세요.",
  },
  {
    slug: "moistrue-tuna-chicken",
    title: "동원 뉴트리플랜 모이스트루 참치&닭고기 (고양이 습식 파우치 80g)",
    link: "https://link.coupang.com/a/hrlrhnyeC4",
    image: "",
    desc: "참치&닭고기맛 습식 파우치 (직접 구매해 급여)",
    badge: "",
    category: "고양이",
    review:
      "참치맛과 함께 먹여 본 참치&닭고기맛 습식 파우치예요. 두 가지 맛 모두 잘 먹어줬습니다.\n직접 구매해서 먹여본 개인 경험이며 질병 치료 효과를 의미하지 않습니다. 질환이 있는 고양이는 사료를 바꾸기 전에 꼭 수의사와 상담해 주세요.",
  },
  {
    slug: "locknlock-baro-hankki",
    widget: "coupa.ng/cqh4mO",
    title: "락앤락 바로한끼 밥용기 세트 라이트 (2세트 320ml 3P)",
    link: "https://link.coupang.com/a/hznLcaYsGi",
    image: "https://t5a.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/144695377917502-c844decc-5a39-4a96-867f-435744890317.png",
    desc: "냉동 밥 소분용으로 많이 찾는 락앤락 밥용기 세트",
    badge: "",
    category: "주방",
  },
  {
    "slug": "nivea-dry-comfort-roll-on",
    "title": "니베아 데오드란트 롤온 드라이 컴포트 (50ml, 1개)",
    "link": "https://link.coupang.com/a/huDNMWvmyO",
    "image": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/9879/b6b482a5df5e1c8267ae10c5cd5716369a6460bd109630bd539afbfdfecb.png",
    "desc": "롤온 타입 데오드란트",
    "badge": "",
    "category": "뷰티",
    "review": "겨드랑이 보톡스 후기에서 참고용으로 소개한 롤온 제품입니다. 직접 사용 후기는 아니며 제품 사용법과 성분은 쿠팡 상품 페이지에서 확인해 주세요."
  },
  {
    "slug": "dove-original-deodorant-spray",
    "title": "도브 오리지널 스프레이 데오드란트 (150ml, 1개)",
    "link": "https://link.coupang.com/a/huDPGaAVnU",
    "image": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2025/10/02/9/7/917424b0-3954-4662-a714-37cab82c0ccc.png",
    "desc": "스프레이 타입 데오드란트",
    "badge": "",
    "category": "뷰티",
    "review": "겨드랑이 보톡스 후기에서 참고용으로 소개한 스프레이 제품입니다. 직접 사용 후기는 아니며 제품 사용법과 성분은 쿠팡 상품 페이지에서 확인해 주세요."
  },
  {
    "slug": "blancow-bha-body-wash",
    "title": "블랑카우 BHA 여드름 기능성 바디워시 (500ml, 1개)",
    "link": "https://link.coupang.com/a/hrDKMCmtZ6",
    "image": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/902765579439971-1dacdf25-4729-4691-9ef2-1b3e26bff16c.jpg",
    "desc": "블로그 등·가슴 피부 관리 글에서 소개한 바디워시",
    "badge": "",
    "category": "뷰티",
    "review": "알라딘필링 후기 시리즈에 연결한 상품입니다. 직접 사용한 바디워시와 동일하다고 확인된 제품은 아닙니다. 시술 후 사용 여부와 시점은 시술 병원의 안내를 따르세요."
  },
  {
    "slug": "heclafil-spicule-peeling",
    "title": "알라딘 스피큘 헤클라필 각질제거제 (4.5g, 1개)",
    "link": "https://link.coupang.com/a/hsBW55N0sC",
    "image": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/c3c6/d2f74301f408645b0b2ab5dbad96278955e6da500a2695810c6fd63bec20.jpg",
    "desc": "셀프 각질 관리용 스피큘 필링제",
    "badge": "",
    "category": "뷰티",
    "review": "알라딘필링 후기 시리즈에서 참고용으로 소개한 제품입니다. 병원 시술과 동일한 효과를 보장하거나 직접 사용해 본 후기를 의미하지 않습니다. 시술 후 회복 중인 피부에 추가 필링을 하지 말고, 제품 사용법과 병원 안내를 확인하세요."
  },
  {
    "slug": "gelcure-herbal-peeling-strong-set",
    "title": "젤쿠어 해초 약초필링 강필 세트 (1회분, 1개)",
    "link": "https://link.coupang.com/a/hsBZkI2zYq",
    "image": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/ff77/0da6445d93cfdd5cfba54582f9b336d173fed60bd442b8f26c39b3ca58d2.jpg",
    "desc": "셀프 해초·약초 필링 1회용 세트",
    "badge": "",
    "category": "뷰티",
    "review": "알라딘필링 후기 시리즈에서 참고용으로 소개한 셀프 필링 세트입니다. 병원 시술과 동일한 효과를 보장하거나 직접 사용해 본 후기를 의미하지 않습니다. 시술 후 회복 중인 피부에 추가 필링을 하지 말고, 제품 사용법과 병원 안내를 확인하세요."
  },
];

// ── 사이트 설정 (제목/소개문구 바꾸고 싶을 때 여기 수정) ──
const SITE_CONFIG = {
  siteName: "오늘의 추천템",
  tagline: "가성비 기준으로 골라 모은 아이템 모음",
  // 배포 주소 (sitemap/OG에 사용, 끝에 / 없이)
  siteUrl: "https://eugenek99.github.io/Coupicks",
  // 가격은 수시로 바뀌므로 기본은 숨김(약관/오표기 방지). true 로 바꾸면 표시
  showPrice: false,
  // 대가성 고지 문구 (쿠팡파트너스 약관 + 공정위 지침상 필수)
  disclosure:
    "이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
};
