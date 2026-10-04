# 운영 상태 · 2026-10-04 (PR #1 병합 반영)

첫 소개글 실제 게시 완료: https://www.threads.com/@salraemallae.pick/post/DeEIIMZj9T3

Meta 앱 Coupicks Publisher 생성 완료. 앱 ID 3002057086806799, Threads app ID 1584291259544800. Threads 계정 테스터 등록·토큰 연결·Secret 입력·상시 서버·상품 자동 확인은 미완료. 자동 발행 꺼짐.

기존 상품 5개는 automation/catalog.json에 제휴 링크와 함께 기록. 락앤락 바로한끼 320ml(3P) 2세트 신규 링크는 automation/product-links.csv에 기록. 도착 옵션·상세 규격은 검증 대기다. 검색 결과의 다른 상품은 검증된 추천 목록으로 취급하지 않는다. 상품 후보 30개 확보는 아직 완료되지 않았다.

한 달 원고 20개는 docs/month-one-drafts.md. 제휴 8개는 정확한 상품 정보를 채워야 하며 예약 큐에 넣지 않았다. 첫 소개글이 실제 게시되었으므로 다시 발행하지 않는다. 지난 슬롯은 소급 게시하지 않는다.

Codex 앱에 매시간 사용량 회복 후 이어가는 자동 후속 작업을 설정했다. 이 설정은 Codex 앱 내부에 있으며 이 저장소를 클론한다고 생성되지 않는다. Threads 발행 스케줄러와 별개다.

PR #1 은 2026-10-04 에 main 으로 병합되었다. 공개 사이트 변경도 반영되었다: 카드는 다시 진짜 링크(rel="nofollow sponsored noopener"), 문구는 "쿠팡에서 가격 확인"·"ⓘ 상품 정보", 락앤락 바로한끼 상품 추가(후기·별점·가격 없음). 병합으로 추가된 자동화: 발행 전 원격 대조(reconcile)로 중복 게시 방지, 상태 push 재시도, Threads 토큰 주간 자동 갱신 워크플로(SECRETS_PAT 필요). 자동 발행은 여전히 꺼짐(paused=true), 발행 큐는 비어 있고 GitHub Secrets 는 아직 0개다. 작업은 main 직접 push 대신 브랜치+PR 로 올린다. 비밀키·토큰·로그인 정보는 저장하지 않는다.
