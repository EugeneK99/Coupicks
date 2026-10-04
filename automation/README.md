# 자동 운영 연결 상태

현재 구현: 근거/링크/원고 버전 검증, 한국시간 17시 슬롯, 계정 확인, 발행 상태 기록, 중복 재시도 중단. 기본 paused=true이며 발행하지 않는다.

실행: Node 22 이상. `node --test automation/publish.test.mjs`, `node automation/publish.mjs`는 드라이런. 실제 발행은 `--live`이며 환경변수 THREADS_ACCESS_TOKEN, THREADS_USER_ID가 필요하다.

미구현/연결 필요: OAuth UI·토큰 자동 갱신, 쿠팡 API 상품 수집·링크 생성·당일 확인, 사이트 자동 배포 검증, 성과 수집. 현재 catalog의 기존 5개는 모두 검증 대기다. queue는 비어 있다. 초안을 임의로 검증 완료로 바꾸지 않는다.

GitHub Actions는 예약 워커의 초기 운영용이다. cron은 정확한 실행 시각을 보장하지 않으며 지연/누락될 수 있다. 17:00/10/20 KST 실행 요청, 30분 넘으면 보류. 정확한 시각과 장애 내구성이 필요한 상시 운영에서는 영속 DB 워커로 이전한다.

중요: 원격 발행과 Git 상태 저장은 원자적이지 않다. 상태 push가 실패하면 이전 원격 상태에서 재실행될 위험이 있으므로 이 구조를 무인 프로덕션으로 켜지 않는다. 영속 DB와 잠금/원격 대조를 연결한 후 활성화한다. 보류/확인 필요 상태는 자동으로 scheduled로 되돌리지 않는다.

사용자 인증과 호스팅을 완료한 뒤 실계정 테스트, 비밀키 저장, 최신 API 한도 검증, 하루 발행 제한/장애 복구 검증을 마쳐야 운영을 활성화할 수 있다. API 키를 저장소에 넣지 않는다.

연결 점검: `node automation/doctor.mjs`는 키 존재 여부만 표시한다. `node automation/connection.mjs`는 실제 계정명이 salraemallae.pick인지 확인한다. 토큰 자동 갱신은 비밀 저장소 어댑터 연결 전까지 미완료다.

## 중복 게시 방지 (원격 대조)

`--live` 실행은 발행 전에 계정을 확인하고 Threads의 최근 글 25개를 읽어, 대기 중인 글과 본문이 같은 글이 이미 있으면 `published`(reason=`reconciled_from_remote`)로 맞춘 뒤 발행하지 않는다. 상태 push가 실패해 로컬 기록을 잃어도 같은 글이 두 번 올라가지 않는다. `needs_remote_check` 도 원격에서 확인되면 자동으로 해소된다. 원격에 없는 `needs_remote_check`/`held` 는 사람이 확인하기 전까지 자동 재발행하지 않는다. 상태 push는 rebase 후 3회 재시도한다.
