# TCHAI KIM — Final Tablet + Mobile Art Direction

검증일: 2026-09-17. 최신 첨부 명세의 **33개 요구사항**을 기준으로 작업했습니다.
Collection의 6개는 두 페이지에 각각 적용·검증했습니다.

## 1. Starting HEAD

`76499f23cd2c5e550e7f80a8aa7ef4ec2222c2f5` — `최종 QA 2차`.

시작 작업 트리는 깨끗했습니다. 이 HEAD의 HTML/CSS/JS를 로컬 서버 응답으로 재현해 Desktop 비교에 사용했습니다. 공개 배포본은 비교 기준으로 사용하지 않았습니다. **커밋·푸시하지 않았습니다.**

이번 범위는 Main, Brand, Bespoke, Reservation, Collection 두 페이지입니다. 이전 대화의 전체 사이트 범위가 아니라 최신 첨부 문서의 보호 조건을 따랐습니다.

## 2. Modified files

프로덕션 수정은 다음 12개 파일뿐입니다.

- `pages/main/css/main.css`
- `pages/main/js/main.js`
- `pages/brand/css/brand.css`
- `pages/brand/js/brand.js`
- `pages/bespoke/css/bespoke.css`
- `pages/bespoke/css/materials-editorial.css`
- `pages/bespoke/css/reservation.css`
- `pages/bespoke/js/bespoke.js`
- `pages/col_chaikim/css/col_chaikim.css`
- `pages/col_chaikim/js/col_chaikim.js`
- `pages/col_chaikimyoungjin/css/col_chaikimyoungjin.css`
- `pages/col_chaikimyoungjin/js/col_chaikimyoungjin.js`

기록: `docs/PROJECT_CONTEXT.md`.

QA 산출물: 이 폴더의 `PLAN.md`, `REPORT.md`, `index.html`, `qa.cjs`, `verify.cjs`, `deep.cjs`, `inputs.cjs`, `final.cjs` 및 `before/`, `after/`, `verification/`.

프로덕션 HTML, 공통 Header/Footer/Menu/Cart, Shop standalone, Shop Detail, Intro, Reservation Done은 수정하지 않았습니다. 라이브러리 설치, 새 프레임워크, html zoom, 전체 페이지 scale도 추가하지 않았습니다.

## 3. Main — 9/9 PASS

| 항목 | 결과 | 구현·검증 |
|---|---|---|
| M1 Hero | PASS | Tablet/Mobile 기존 이미지 2장, 7.5초 주기·1.5초 crossfade. 약 6초 정지 후 전환. 화면 밖·탭 비활성·키보드 포커스·터치 중 자동 전환 양보. 두 이미지 크롭을 실제 캡처로 확인. |
| M2 지정 영역 제거 | PASS | Mobile의 `.model` 안 춤추는 인물과 지정 Heritage copy를 문서 흐름에서 제거. 숨은 높이·pin spacer 없음. Tablet 유지. |
| M3 원형 확대 | PASS | 기존 detail 버튼으로 중앙 저고리의 원형 디테일 열기/닫기. Tablet 최대 300px, Mobile 최대 210px. 같은 버튼 재선택 시 원복. |
| M4 Tchai rail | PASS | 4장 편집형 가로 레일과 한 번만 나오는 Tchai 제목. 큰 이미지/작은 이미지 차등, 다음 사진 일부 노출. 양방향 터치·마우스·키보드 확인. |
| M5 Bespoke video | PASS | Tablet/Mobile에서 충분한 콘텐츠 폭 사용. 실제 영상 비율 1122:720 적용, 불필요한 레터박스·강제 crop 제거. |
| M6 Bespoke 순서 | PASS | 제목 → 영상 → 본문 → CTA. Mobile supporting image 제거, Tablet에서는 보조 이미지 유지. |
| M7 Shop promo | PASS | Mobile 제목 → 미디어 → 본문 → CTA. Tablet은 우측 90% 폭의 16:9 영상으로 Bespoke와 차별화. |
| M8 Products | PASS | Mobile `.shop_products_viewport` 높이 0, document flow 제외. Tablet 유지. |
| M9 Collection rail | PASS | 18px/s 무한 lookbook rail. 이미지 높이 차등. 터치/휠 후 4.5초 양보, 포커스 중 정지. 반복 경계 전후 같은 이미지·좌표 확인. reduced-motion 자동 이동 없음. |

첫 구현 후 Tablet Hero에서 얼굴 일부가 잘리는 것을 발견해 bespoke 이미지의 세로 기준을 상단으로 수정했습니다. 콜라주 레일의 가운데 정렬로 첫 카드가 접근 불가능하던 문제도 좌측 시작으로 수정했습니다.

## 4. Brand — 8/8 PASS

| 항목 | 결과 | 구현·검증 |
|---|---|---|
| B1 Mood 배경 | PASS | `#585A4D` → 실제 Kim Young Jin 시작색으로 그라디언트. 섹션 경계 빈 간격 없음. |
| B2 Mood 구성 | PASS | 박스·테두리 없는 사진/keyword/짧은 설명. Mobile 사진 위·텍스트 아래, Tablet 사진/글 비대칭 배치. |
| B3 Mood navigation | PASS | 중앙 작은 counter, 화살표 제거. 기존 swipe controller 재사용. 양방향 터치·키보드·가로 휠 확인. |
| B4 Kim Young Jin | PASS | Tablet primary 52%와 작은 supporting group. Mobile red 74vw / yellow 54vw / black 48vw / blue 58vw. 공유 정렬축과 이미지 체급 구분. |
| B5 Tchai Kim | PASS | Mobile 탭 → 영상 → 한 문장 본문, 중복 title 제거. 5개 탭 전환·레이아웃 높이 안정성 확인. Tablet 원문·2-column 관계 유지. |
| B6 Atelier 앞 여백 | PASS | track 하단 여백 Tablet 88px / Mobile 72px. 기존 대비 각각 40px / 48px 증가. |
| B7 Atelier | PASS | Mobile 설명 제거, The atelier 제목과 기존 marquee 유지. reduced-motion 정지. |
| B8 Heritage | PASS | Find your difference를 먼저 배치. Mobile 긴 설명 제거. 동일 프레임에서 3장 scroll crossfade, 전체 구간 155svh. reduced-motion 대표 이미지 정적 표시. |

Mobile의 탭 요약은 기존 문장 의미를 유지하도록 축약했으며, 폭이 커지면 원문 HTML을 복원합니다. Heritage에는 새로운 GSAP pin을 만들지 않았습니다. 짧은 CSS sticky frame과 한 개의 스크롤 갱신 루프만 사용합니다.

## 5. Bespoke — 8/8 PASS

| 항목 | 결과 | 구현·검증 |
|---|---|---|
| BS1 Copy | PASS | 원문에서 의미를 보존한 짧은 문장으로 축약. Mobile 적극 축약, Tablet은 더 많은 정보 유지. Desktop 원문 복원 확인. |
| BS2 Atelier | PASS | Mobile 이미지 → 기존 green action button. 설명·중복 제목은 흐름에서 제외, 기존 zoom 유지. |
| BS3 Quote | PASS | 중앙 composition, Tablet 34ch / Mobile 29ch 폭과 주변 여백 함께 조정. |
| BS4 Process | PASS | 5개 step의 번호·label·media·짧은 description 유지. Tablet/Mobile 전 단계 선택 정상. Desktop click→scroll와 scroll→active 모두 확인. |
| BS5 Materials | PASS | Mobile 3×2 swatches + selected caption 중심. 큰 장식 제목·texture·반복 설명 제거. 6종 선택 유지, count UI 추가 없음. |
| BS6 Caption | PASS | Mobile 1~3줄. 모든 소재의 image/name/description 동기화 및 section 높이 안정성 확인. |
| BS7 CTA | PASS | Mobile 글자 13px, 높이 48px, 약 203px 폭. 기존보다 작되 누를 영역 유지. |
| BS8 Begin/Reservation | PASS | Compact에서 Begin → 여백 → Reservation 순서. Tablet 120px / Mobile 80px. Desktop 복귀 시 원래 순서 복원. |

Tablet Materials는 기존 큰 3×2 swatch를 작은 6개 한 줄로 재편집해 이미지/설명이 중심이 되도록 했습니다. 해당 섹션 높이가 약 1605px → 993px로 줄었습니다. 소재를 바꿔도 높이가 튀지 않습니다.

## 6. Reservation — 2/2 PASS

| 항목 | 결과 | 구현·검증 |
|---|---|---|
| R1 Silhouette | PASS | 1024에서 동일한 무게의 3-column. 390에서 82% 폭 horizontal snap rail, 다음 카드 peek. 선택 상태·실제 click/flow 정상. |
| R2 Container | PASS | `.reservation_form .common_container`에만 넓은 폭 적용. Mobile 20px / 1024 32px gutter. 공통 selector 파일과 다른 페이지 영향 없음. |

예약 JS와 Done 파일은 바꾸지 않았습니다. 실제 검증 흐름은 16항에 기록했습니다.

## 7. Collection — 각 페이지 6/6 PASS

| 항목 | TCHAI KIM | YOUNG JIN | 구현·검증 |
|---|---|---|---|
| C1 Showcase | PASS | PASS | 중앙 counter, arrows 제거. 서로 다른 기존 이미지 비율/offset 유지. 5장 모두 터치·키보드·가로 휠 탐색. |
| C2 Archive 순서 | PASS | PASS | Title → Year → Deck → Reserve Now. Compact 링크는 실제 Reservation 경로. Desktop 문구·링크 복원. |
| C3 Counter | PASS | PASS | 54px 얇은 원 안에 순번 중앙 정렬. 연도별 4/5장 총수와 active image 동기화. |
| C4 Arrows | PASS | PASS | Compact 화살표/pseudo arrow 제거. 이미지와 작은 counter 중심. |
| C5 Swipe deck | PASS | PASS | 겹친 image stack 유지. 양방향 터치·마우스 drag·가로 휠·방향키 지원. 세로 페이지 스크롤 허용. |
| C6 As Worn | PASS | PASS | Mobile 긴 설명 제거, 제목·이미지·CTA 중심. Tablet copy 유지. |

마지막 Showcase 이미지가 앞쪽 정렬 위치에 도달하지 못해 counter가 04에 머무는 문제를 발견했습니다. 실제 viewport/마지막 사진 폭으로 끝 여유 공간을 계산해 05까지 도달하도록 수정했습니다. Desktop에서는 이 보정과 속성을 해제합니다.

Archive CTA의 확장 hit area가 year selector를 가리던 문제도 링크의 위치 기준을 복원해 해결했습니다. 기존 이미지 pile과 두 페이지 고유 Showcase 비율은 평평한 동일 카드로 바꾸지 않았습니다.

## 8. 1024 Tablet 주요 변경

- Main: crossfade hero, 넓은 Tchai rail, 큰 원본 비율 영상, 보조 이미지·모델·상품 탐색은 유지.
- Brand: 사진/텍스트 관계와 primary/supporting 체급 구분. Mobile보다 풍부한 본문 유지.
- Bespoke: Process composition 유지, Materials는 작은 swatch 한 줄과 선택 결과의 2-column.
- Reservation: 읽을 수 있는 3열 silhouette와 넓은 form.
- Collection: 고유 offset rail, 짧아진 Archive flow, 손가락 외 마우스·트랙패드·키보드 지원.

1024는 Mobile을 확대하지 않았습니다. 같은 gutter/본문 계열을 유지하되 Main은 storytelling, Brand는 editorial, Bespoke는 craftsmanship, Reservation은 입력 기능, Collection은 이미지 감상에 무게를 두었습니다.

## 9. 390 Mobile 주요 변경

지정된 긴 설명·중복 section을 흐름에서 제거하고, 이미지 체급과 짧은 문장·작은 UI로 재편집했습니다. 모든 구간을 carousel로 만들지 않고 crossfade / magnifier / 선택 UI / 영상 / quote / 짧은 Heritage sequence를 목적별로 나눴습니다.

문서 높이 실측(px, 영상·마키 타이밍과 무관한 정착 후 layout):

| 페이지 | 1024 전 → 후 | 390 전 → 후 |
|---|---:|---:|
| Main | 10423 → 8303 | 10325 → 5852 |
| Brand | 5896 → 5750 | 5949 → 5447 |
| Bespoke | 8067 → 7476 | 7665 → 6180 |
| Reservation | 5974 → 5992 | 6267 → 6097 |
| TCHAI KIM Collection | 6067 → 5512 | 4960 → 4477 |
| YOUNG JIN Collection | 6100 → 5608 | 4968 → 4520 |

길이 감소 자체를 목표로 삼지 않았습니다. Reservation Tablet의 18px 증가는 카드 본문의 읽기 공간에 따른 변화입니다.

## 10. 1920 Desktop regression — PASS

시작 HEAD와 현재 로컬 파일을 각각 브라우저에 로드해 비교했습니다. **6페이지 × 1920/1440/1280 = 18개 조합 PASS.**

- main 직계 영역·section·제목의 좌표/크기/폰트, 전체 문서 높이 비교.
- ScrollTrigger 개수·start/end·pin 여부 비교.
- 움직이는 As Worn은 animation phase의 이동량을 제외한 상대 좌표로 비교.
- Brand opening이 끝난 후 비교. 영상 frame이나 자동 marquee의 캡처 순간까지 동일하다고 주장하지 않습니다.
- Desktop Process의 click↔scroll 동기화 10개 상태 PASS.

1920 문서 높이 전후 동일: Main 31382, Brand 12956, Bespoke 14396, Reservation 7626, Collection 각 8113px.

## 11. 767 ↔ 768 — PASS

6페이지 모두 실제 resize로 확인했습니다. Mobile-only 콘텐츠 숨김/원문 복구, 카드 열 수, image rail, copy placement 전환에서 이중 layout·빈 wrapper·가로 넘침이 발견되지 않았습니다. 설계된 콘텐츠 유무 차이에 따라 문서 길이는 달라집니다.

## 12. 1279 ↔ 1280 — PASS

Compact controller 정리 후 기존 Desktop으로 복귀합니다. Hero 상태·Tchai 제목·무한 rail clone·임시 aria/inline style·요약 copy·Archive 링크·Bespoke section 순서가 복구되는지 검사했습니다. Desktop의 기존 pin/ScrollTrigger 재생성 결과도 시작 상태와 일치했습니다.

## 13. Resize round-trip — PASS

모든 페이지에서 `1920 → 1024 → 390 → 1024 → 1920`을 반복 실행하고, 활성 tab/lens/deck 상태에서도 재검증했습니다.

- 새로 소유한 이벤트 listener는 Desktop 복귀 시 정리.
- Hero 자동 전환 timer 최대 1개, Desktop 0개.
- Collection lookbook 복제 이미지 Compact 24개, Desktop 0개.
- Tchai 동적 제목 Compact 1개, Desktop 0개.
- 새 auto rail RAF 루프 최대 1개, Desktop 0개.
- 요약 copy·section 순서·임시 style 복원, trigger/pin 누적 없음.

Hero 포커스 해제 직후 breakpoint가 바뀌는 경우 예약된 갱신이 timer를 다시 만들지 못하도록 해제 상태 가드도 넣었습니다.

## 14. Overflow — PASS

6페이지 각각 **1920 / 1440 / 1280 / 1279 / 1024 / 820 / 768 / 767 / 430 / 402 / 390 / 375 / 360**에서 검사했습니다.

`html/body overflow-x: visible`로 일시 변경한 뒤 주요 section까지 실제 스크롤하면서 document/client width, body scrollWidth, section bounding rect를 측정했습니다. **실제 가로 넘침 0px**, broken image 0. 레일 내부의 의도된 가로 scroll은 body overflow와 구분했습니다. body overflow 정책으로 새 문제를 가리지 않았습니다.

## 15. Console — PASS

위 78개 page×width 조합과 기능/resize 시나리오에서 console error 0, uncaught page error 0, unhandled promise rejection 0이었습니다. 변경 JS 문법 및 diff whitespace 검사도 통과했습니다.

기존 프로젝트에 package.json 기반 build/lint 명령은 없습니다. 설치하지 않았으며 실행하지 않은 build/lint를 통과했다고 표시하지 않습니다.

## 16. Functional flow — PASS

- Main: 두 Hero 이미지 반복/포커스 정지·재개, 원형 확대 toggle, 양방향 rail, 자동/수동 충돌 및 반복 경계 확인.
- Brand: Mood 양방향 swipe, 5개 tab와 일정한 section 높이, Atelier 유지, Heritage 3개 사진 상태 캡처.
- Bespoke: 5단계 Process와 6개 Materials 전부 선택. 이미지/본문/active 상태 일치, section 높이 안정. Desktop Process 10개 방향별 검사.
- Reservation: **390/768/1024 × Visit Atelier/Phone Call**. silhouette/fabric → mode 왕복 → 주말 선택 무시 → 평일/date/time → mode 왕복 후 상태 보존 → 필수 입력/동의 → Submit → Done 데이터 및 화면 분기 확인. 테스트 데이터는 로컬 브라우저 sessionStorage에만 사용했습니다. 외부 실제 예약을 전송하지 않았습니다.
- 두 Collection: Showcase 5장, Archive 2019/2020/2021 각 연도의 모든 이미지·순번·전체 개수·끝에서 처음으로 복귀, 양방향 touch/mouse/keyboard/wheel. 세로 터치가 페이지 스크롤을 막지 않는지도 확인.
- reduced-motion: 새 Hero/rail 자동 motion 정지, Heritage 대표 사진 정적 배치, Compact pin 0. 해당 상태에서도 콘텐츠 접근 가능.

### 재현 가능한 검증 자료

| 파일 (`verification/`) | 통과 검사 |
|---|---:|
| `deep-desktop.json` | 18/18 |
| `deep-layout.json` | 32/32 |
| `deep-overflow.json` | 84/84 (78 폭 검사 + 6 runtime 검사) |
| `deep-reduced.json` | 6/6 |
| `results-functions.json` | 90/90 |
| `results-geometry.json` | 108/108 |
| `results-reservation.json` | 36/36 |
| `inputs-input.json` | 40/40 |
| `inputs-lifecycle.json` | 60/60 |
| `inputs-processDesktop.json` | 10/10 |
| `final-checks.json` | 88/88 |

이는 자동 검사 수이며 디자인 판단을 대신하는 점수가 아닙니다. 별도로 전후 full-page 및 주요 section 이미지를 실제 열어보고 크롭, 밀도, 위계와 간격을 검토·수정했습니다.

## 17. Screenshot paths

루트: `/Users/songmyeonghee/Documents/tchaikim_all/mobile-final-art-direction/`

- [전후 비교 화면](index.html) — 페이지와 390/1024/1920을 선택. 사진을 누르면 원본 크기.
- `before/{main,brand,bespoke,reservation,collection,collection-youngjin}/`
- `after/{main,brand,bespoke,reservation,collection,collection-youngjin}/`
- 각 폴더: `1920-full.png`, `1024-full.png`, `390-full.png`, 주요 section의 viewport crop, 측정 JSON.
- `verification/main-{390,1024}-hero-second.png`: 두 번째 Hero crop.
- `verification/main-{390,1024}-magnifier.png`: 실제 버튼 선택 후 확대 상태.
- `verification/brand-{390,1024}-heritage-{0,0.45,0.85}.png`: 동일 프레임 3사진 전환.
- `verification/reservation-{390,768,1024}-{atelier,phone}.png`, `done-…`: 실제 flow.
- `verification/*-desktop-head.png`, `*-desktop-current.png`: Desktop 비교.

로컬 서버가 켜진 동안 비교 화면: `http://127.0.0.1:5733/mobile-final-art-direction/index.html`.

## 18. 사람이 마지막으로 확인할 미세 디테일

1. **실제 iPhone/iPad Safari는 미검증**입니다. 설치된 Chrome을 이용한 브라우저 검증과 CDP touch 입력까지 수행했습니다. iOS 주소창 높이 변화, 탄성 스크롤, 실제 손가락 감도는 실기기에서 최종 확인이 필요합니다.
2. Mood 원본 이미지 일부는 약 200~260px 크기입니다. 새 가짜 이미지로 교체하지 않고 과도한 확대를 제한했으므로 Retina 기기에서 선명도 한계가 남을 수 있습니다.
3. Hero의 6초 정지/1.5초 전환, lookbook의 18px/s, Heritage 155svh 길이는 현재 화면 검토상 절제된 속도입니다. 최종 브랜드 선호에 따른 미세 속도 조정은 가능합니다.
4. 실제 Chrome에서 H.264 영상이 보이는 상태로 검수했습니다. 영상/마키는 시간에 따라 frame이 달라집니다. full-page 캡처만으로 전환 감각 전체를 평가할 수 없으므로 로컬 페이지에서 짧게 직접 스크롤해 확인하는 것이 좋습니다.
5. Brand full-page 캡처의 Heritage 아래 여유 공간은 155svh sequence의 의도된 범위입니다. 실제 스크롤 중에는 사진 프레임이 유지됩니다. 상태별 캡처도 함께 확인하세요.

**요구사항 33/33 PASS. Desktop / Tablet / Mobile / 기능 / 기술 검증 PASS.**
이 결과는 위에 명시한 로컬 Chrome 검증 범위에 해당하며, 실기기 승인이나 모든 브라우저 호환성을 의미하지 않습니다.
