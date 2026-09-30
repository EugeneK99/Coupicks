// ============================================================
//  상품 데이터 파일  ── 여기만 수정하면 됩니다!
// ============================================================
//
//  상품을 추가하려면 아래 배열에 { } 블록을 하나 더 복사해서 붙여넣고
//  내용만 바꾸면 됩니다. 다른 파일(index.html, styles.css)은
//  건드릴 필요가 없습니다.
//
//  각 항목 설명:
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
//  ⚠️ 아래는 전부 "예시(더미) 데이터"입니다.
//     실제 쿠팡파트너스 링크를 딴 뒤 link 값만 바꿔치기 하세요.
// ============================================================

const PRODUCTS = [
  {
    slug: "bluetooth-speaker",
    title: "블루투스 스피커",
    link: "https://link.coupang.com/a/hrDCk4WEMu",
    image: "",
    desc: "집에서 노래를 크게 틀고 싶을 때 쓰는 블루투스 스피커",
    badge: "",
    category: "음악",
    review:
      "블로그의 팝송 해석 글(ROSÉ & Bruno Mars - APT.)과 함께 소개한 스피커예요. 노래를 볼륨 높여 함께 즐기고 싶을 때 이어폰보다 스피커가 잘 맞습니다.",
  },
  {
    slug: "daily-headphone",
    title: "데일리 헤드폰",
    link: "https://link.coupang.com/a/hrDIjVXVim",
    image: "",
    desc: "강한 비트의 곡을 제대로 듣기 좋은 데일리 헤드폰",
    badge: "",
    category: "음악",
    review:
      "블로그의 팝송 해석 글(ADÉLA - Homewrecked)과 함께 소개한 헤드폰이에요. 비트와 저음이 살아 있는 곡은 헤드폰으로 들으면 몰입감이 좋습니다.",
  },
  {
    slug: "nc-earphone",
    title: "노이즈캔슬링 이어폰",
    link: "https://link.coupang.com/a/hrDtRdrFqC",
    image: "",
    desc: "잔잔하고 섬세한 곡을 조용하게 듣기 좋은 노이즈캔슬링 이어폰",
    badge: "",
    category: "음악",
    review:
      "블로그의 팝송 해석 글(Laufey - From The Start)과 함께 소개한 이어폰이에요. 보사노바처럼 섬세한 곡은 주변 소음을 줄여 주는 이어폰이 어울립니다.",
  },
  {
    slug: "moistrue-tuna",
    title: "모이스트루 참치 (고양이 습식 파우치)",
    link: "https://link.coupang.com/a/hrlvkvg2cm",
    image: "",
    desc: "입맛 떨어진 고양이에게 먹여 본 참치 습식 파우치",
    badge: "",
    category: "고양이",
    review:
      "간부전 회복기에 밥을 거부하던 저희 고양이가 먹어준 습식 파우치예요. 수분 보충에 도움이 되는 습식이지만, 질환이 있는 고양이는 사료를 바꾸기 전에 꼭 수의사와 상담해 주세요.",
  },
  {
    slug: "moistrue-tuna-chicken",
    title: "모이스트루 참치&닭고기 (고양이 습식 파우치)",
    link: "https://link.coupang.com/a/hrlrhnyeC4",
    image: "",
    desc: "참치와 닭고기가 함께 들어간 습식 파우치",
    badge: "",
    category: "고양이",
    review:
      "참치 맛과 함께 번갈아 급여해 본 습식 파우치예요. 질환이 있는 고양이는 사료를 바꾸기 전에 꼭 수의사와 상담해 주세요.",
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
    "이 사이트는 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
};
