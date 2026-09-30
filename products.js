// ============================================================
//  상품 데이터 파일  ── 여기만 수정하면 됩니다!
// ============================================================
//
//  상품을 추가하려면 아래 배열에 { } 블록을 하나 더 복사해서 붙여넣고
//  내용만 바꾸면 됩니다. 다른 파일(index.html, styles.css)은
//  건드릴 필요가 없습니다.
//
//  각 항목 설명:
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
//   - sortPrice: 정렬용 숫자 가격 (선택, 예: 129000). 넣으면 가격순 정렬 정확해짐
//
//  ⚠️ 아래는 전부 "예시(더미) 데이터"입니다.
//     실제 쿠팡파트너스 링크를 딴 뒤 link 값만 바꿔치기 하세요.
// ============================================================

const PRODUCTS = [
  {
    title: "예시 무선 청소기 (샘플)",
    link: "https://link.coupang.com/a/EXAMPLE1",
    image: "https://placehold.co/400x400?text=Product+1",
    price: "129,000원",
    sortPrice: 129000,
    desc: "가볍고 흡입력 좋은 가성비 무선청소기",
    badge: "베스트",
    category: "가전",
    rating: 4.7,
    reviews: 1280,
  },
  {
    title: "예시 블루투스 이어폰 (샘플)",
    link: "https://link.coupang.com/a/EXAMPLE2",
    image: "https://placehold.co/400x400?text=Product+2",
    price: "39,900원",
    sortPrice: 39900,
    desc: "노이즈 캔슬링 지원, 장시간 재생",
    badge: "특가",
    category: "가전",
    rating: 4.5,
    reviews: 860,
  },
  {
    title: "예시 텀블러 500ml (샘플)",
    link: "https://link.coupang.com/a/EXAMPLE3",
    image: "https://placehold.co/400x400?text=Product+3",
    price: "18,500원",
    sortPrice: 18500,
    desc: "보온보냉 12시간, 스테인리스",
    badge: "",
    category: "주방",
    rating: 4.8,
    reviews: 2130,
  },
  {
    title: "예시 기계식 키보드 (샘플)",
    link: "https://link.coupang.com/a/EXAMPLE4",
    image: "https://placehold.co/400x400?text=Product+4",
    price: "59,000원",
    sortPrice: 59000,
    desc: "적축, RGB 백라이트",
    badge: "",
    category: "디지털",
    rating: 4.6,
    reviews: 540,
  },
];

// ── 사이트 설정 (제목/소개문구 바꾸고 싶을 때 여기 수정) ──
const SITE_CONFIG = {
  siteName: "오늘의 추천템",
  tagline: "직접 써보고 고른 가성비 아이템 모음",
  // 대가성 고지 문구 (쿠팡파트너스 약관 + 공정위 지침상 필수)
  disclosure:
    "이 사이트는 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
};
