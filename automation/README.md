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

## 토큰 자동 갱신

`threads-token-refresh.yml` 이 매주 월요일 03:00 UTC 에 `refresh-token.mjs` 로 토큰을 갱신하고(장기 토큰 약 60일, 발급 24시간 후부터 갱신 가능), 새 값을 `gh secret set THREADS_ACCESS_TOKEN` 으로 저장소 Secret 에 바로 덮어쓴다. 저장 전에 새 토큰으로 `/me`를 호출해 config의 계정명과 THREADS_USER_ID가 모두 일치하는지 확인한다. 실패하면 기존 Secret을 덮어쓰지 않는다. 토큰은 로그에 출력하지 않고 임시 파일로만 전달한다.

필요한 Secret (모두 GitHub → Settings → Secrets and variables → Actions 에 직접 입력, 채팅·코드에 붙이지 않는다):

| 이름 | 용도 |
|---|---|
| `THREADS_ACCESS_TOKEN` | Threads 장기 액세스 토큰 |
| `THREADS_USER_ID` | `@salraemallae.pick` 의 Threads 사용자 ID |
| `SECRETS_PAT` | 이 저장소 한정, 권한은 **Secrets: Read and write** 만 가진 fine-grained PAT (갱신된 토큰을 저장하기 위함. `GITHUB_TOKEN` 은 Secret 을 쓸 수 없다) |

갱신이 실패하면 워크플로가 실패로 표시되어 GitHub 알림 메일이 온다. 토큰이 만료되면 발행 워커는 `connection`/`wrong_account` 오류로 멈추며 글을 올리지 않는다.

## 연결 절차 (사람이 직접)

1. Meta 개발자 앱 생성 → Threads 사용 사례 추가 → `@salraemallae.pick` 을 테스터로 추가·수락.
2. 권한 `threads_basic`, `threads_content_publish` 로 OAuth 로그인해 단기 토큰을 받고, 장기 토큰으로 교환(`th_exchange_token`, 앱 시크릿 필요 — 터미널에서 직접 실행하고 값을 공유하지 않는다).
3. 위 Secret 3개 입력.
4. `node automation/doctor.mjs` (키 존재 확인) → `node automation/connection.mjs` (계정 확인) → 테스트 글 1건 수동 검증 → `config.json` 의 `paused` 를 `false` 로.

## 토큰 발급기가 막힐 때: OAuth 우회 (`oauth-token.mjs`)

Meta 의 User Token Generator 가 "The user has not accepted the invite to test the app"(1349245) 로 막히면, 일반 OAuth 로그인으로 장기 토큰을 받는다.

1. Meta 앱 → Use cases → Threads API → Settings 의 **Redirect Callback URLs** 에 `https://eugenek99.github.io/Coupicks/` 를 넣고 Save (이 값과 스크립트의 리다이렉트 주소가 글자 하나까지 같아야 한다).
2. `node automation/oauth-token.mjs url` 이 출력한 주소를 `@salraemallae.pick` 으로 로그인한 브라우저에서 열어 승인한다. 사이트로 돌아오면 주소창에 `?code=...` 가 붙는다.
3. 같은 Settings 화면의 **Threads app secret → Show** 값을 터미널에서만 환경변수로 지정한다(채팅·파일·커밋에 넣지 않는다):
   `read -rs THREADS_APP_SECRET && export THREADS_APP_SECRET`
4. `node automation/oauth-token.mjs exchange --dry` 로 먼저 계정 확인(Secret 저장 없음) → 이상 없으면 `--dry` 없이 실행하면 `THREADS_ACCESS_TOKEN`, `THREADS_USER_ID` 가 저장소 Secret 에 저장된다. 토큰은 화면에 출력되지 않는다.
5. 끝나면 `unset THREADS_APP_SECRET`.

`code` 는 1회용이고 유효시간이 짧다. 실패하면 2번부터 다시 한다.

## 장애 복구와 예약 유지

컨테이너 ID가 없는 생성 단계에서 5xx·네트워크 일시 오류는 같은 30분 슬롯 내 최대 2회 추가 재시도한다. 재시도 횟수는 큐에 저장하며, 한도를 넘거나 슬롯이 지나면 held로 멈춘다. 컨테이너가 만들어진 뒤 또는 게시 호출이 불명확한 경우 needs_remote_check로 멈추며 자동 재게시하지 않는다. 실제 Meta 오류 분류와 운영 중 동작은 실계정 확인 필요하다.

SECRETS_PAT는 **90일 만료로 운영**하며 실제 설정의 만료일을 확인하고 만료 전에 사용자가 새 PAT를 GitHub Secrets에서 교체한다. 90일은 모든 PAT의 고정 수명이 아니며 생성 시 설정·조직 정책에 따라 달라질 수 있다. 값을 문서에 적지 않는다. [GitHub PAT 안내](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

공개 저장소는 **60일 동안 저장소 활동이 없으면 예약 워크플로가 자동 중지될 수 있다**. 사용자가 Actions 화면에서 활성 상태를 확인하고 필요하면 다시 활성화한다. 시간 지연·누락도 가능하므로 정확한 시각은 보장하지 않는다. [GitHub 예약 이벤트 안내](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

sitemap.xml은 lastmod를 생략하여 날짜만 바뀌는 빌드 변경을 방지한다.
