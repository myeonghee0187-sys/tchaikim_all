# TCHAI KIM — Responsive Art Direction V2 / 61 requirements

## 기준과 범위

- Starting HEAD: `fbed57a53f2d9205e4c790b15b1258cc97e89485` — `최종 QA 3차`.
- 시작 working tree: clean. 이 HEAD를 Desktop·기능·rollback 기준으로 사용했습니다.
- 로컬 프로젝트와 `http://127.0.0.1:5733`에서 검증했습니다. 공개 사이트를 수정본으로 간주하지 않았습니다.
- **commit/push하지 않았습니다.** 새 라이브러리, framework, html zoom, page scale을 추가하지 않았습니다.
- HTML 원본·공통 Header/Menu/Cart/Footer·Intro·Done 파일은 변경하지 않았습니다. Done은 데이터 전달 검증만 했습니다.
- 프로덕션 변경은 페이지 CSS/JS 16개입니다. 필요한 compact DOM은 해당 breakpoint에서만 만들거나 이동하고 Desktop 복귀 시 원래 위치로 돌립니다.

**명세의 selector 매핑 예외:** T-C4/T-C5에 적힌 `motif_video_media`, `motif_reference_image`, `motif_reference_copy`는 두 Collection에 없고 **Shop에만 있습니다**. 존재하지 않는 Collection 콘텐츠를 만들지 않았고, 실제 Shop의 Tablet 섹션에 두 요구를 적용했습니다. 아래 30/30에는 이 명시적 매핑을 포함합니다.

## 수락 결과

**Tablet 30/30 · Mobile 31/31 — 총 61/61 PASS**

PASS는 아래 실제 DOM 매핑, 로컬 Chrome 검증 및 시각 검토 범위입니다. 실제 iPhone/iPad Safari의 최종 승인을 대신하지는 않습니다.

### Tablet — 30개

| ID | 결과 | 구현 / 검증 |
|---|---|---|
| T-M1 | PASS | detail subtitle의 Tablet flow 제거 |
| T-M2 | PASS | promo 보조 이미지 제거, 빈 grid 셀 제거 |
| T-M3 | PASS | pink CTA를 lead와 같은 행 우측, 44px 이상 |
| T-M4 | PASS | 일반 CTA도 같은 정렬축, 768/1024/1279 실측 |
| T-M5 | PASS | collection description 제거, rail 중심 배치 |
| T-M6 | PASS | Shop/Bespoke 영상 프레임 실제 폭·높이 동일, crop 별도 |
| T-B1 | PASS | Mood caption flow 제거 |
| T-B2 | PASS | Mood 100% section-width hero frame |
| T-B3 | PASS | 정지 시 이미지 한 장, 다음 slide peek 없음 |
| T-B4 | PASS | 양방향 무한 순환, touch/mouse/wheel/key, clone 경계 같은 이미지·좌표 |
| T-B5 | PASS | Tchaikim tabs 중앙, 다섯 탭 switching 유지 |
| T-B6 | PASS | Heritage info 제목·본문 제거 |
| T-B7 | PASS | headline → figure → button, 중앙 한 축 |
| T-B8 | PASS | computed olive를 양 끝색으로 사용, Mood/KYJ 경계 gap 0 |
| T-B9 | PASS | Handmade와 TCHAI 중심축 일치 |
| T-B10 | PASS | wordmark의 실제 글자 폭을 활용, 화면 밖 왜곡/넘침 없음 |
| T-BS1 | PASS | Atelier body에서 기존 버튼만 표시 |
| T-BS2 | PASS | Atelier image margin 0, parent gap 사용 |
| T-BS3 | PASS | 좁은 max-width 해제, 좌측 약 두 줄 인용문 |
| T-BS4 | PASS | cite 좌측 한 줄, Tablet 끝까지 넘침 없음 |
| T-BS5 | PASS | 실제 우선순위에 맞춰 `.main .process` top padding 140px |
| T-BS6 | PASS | materials intro flow 제거 |
| T-BS7 | PASS | selected를 intro 위치로, 6개 swatch 하단 3×2, 6종 state/caption 유지 |
| T-S1 | PASS | 이미지+관련 설명의 가로 editorial story, touch/mouse/trackpad |
| T-C1 | PASS | 양쪽 Collection 마지막 사진 오른쪽 빈 runway 제거, 마지막 05 도달 |
| T-C2 | PASS | title/year/deck/counter/CTA의 중앙축과 간격 정리 |
| T-C3 | PASS | 가로 depth/peek + 가로 gesture, year/counter 동기화 |
| T-C4 | PASS* | 실제 selector가 있는 Shop의 motif 영상 wrapper까지 제거 |
| T-C5 | PASS* | 실제 Shop motif의 image-left / short-copy-right |
| T-SD1 | PASS | 룩 사진 stage와 좌측 정보 여백, 핀·caption 관계를 Tablet에 맞게 재구성 |

### Mobile — 31개

| ID | 결과 | 구현 / 검증 |
|---|---|---|
| M-B1 | PASS | Mood title → image → description |
| M-B2 | PASS | 한 화면 이미지 한 장, 정지 시 peek 없음 |
| M-B3 | PASS | 1→2→3→1 / 1→3→2→1 및 logical counter |
| M-B4 | PASS | card를 벗어난 section-width image, asset별 crop |
| M-B5 | PASS | title → carousel → Origin/Traditional/Handmade, 6.5초 autoplay, fade label, 조작 후 pause/resume |
| M-B6 | PASS | tabs 위 좌측 Tchaikim 제목 |
| M-B7 | PASS | 다섯 tab 한 줄, 360px에서도 가로 스크롤/잘림 없음 |
| M-B8 | PASS | Heritage margin-top 48px, 긴 runway 없음 |
| M-B9 | PASS | 중앙 title/image/button, 불필요 body 제거 |
| M-B10 | PASS | Mood → KYJ 연속 gradient |
| M-BS1 | PASS | philosophy 제거, 해당 Mobile GSAP 생성 차단 |
| M-BS2 | PASS | Atelier 이미지/원래 section flow 제거 |
| M-BS3 | PASS | 같은 Atelier 버튼을 hero 영상 아래 중앙으로 이동 |
| M-R1 | PASS | 세 silhouette 모두 한 화면, 이전 rail 폐기, 360px overflow 0 |
| M-R2 | PASS | 원래 select와 연결된 popup, x/width 및 화면 내 y 정렬, key/focus/selection |
| M-C1 | PASS | 두 Collection 마지막 사진의 불필요 우측 여백 제거 |
| M-C2 | PASS | 좌우 depth/peek, 가로 swipe, 세로 page scroll 허용 |
| M-C3 | PASS | 두 Archive 제목 한 줄, 360px 실측 |
| M-C4 | PASS | 일곱 year 한 줄, active와 touch area 유지 |
| M-S1 | PASS | banner 제목 28px, 강제 br 완화 |
| M-S2 | PASS | 네 garment chapter를 compact horizontal story로, 설명 요약 |
| M-S3 | PASS | 제목·상품 이미지·본문 체급을 Mobile 기준으로 조정 |
| M-S4 | PASS | 섹션 여백 및 제품 row gap 증가, 긴 story runway는 축소 |
| M-S5 | PASS | Namsadangpae의 freedom in motion을 1–3줄 핵심 문장으로 |
| M-S6 | PASS | motif 영상 wrapper 숨김, 빈 column/height 제거 |
| M-SD1 | PASS | gallery contain으로 인물 원본 범위를 보존 |
| M-SD2 | PASS | gallery scrollbar만 숨김, keyboard/touch scroll 유지 |
| M-SD3 | PASS | 지정 Court registers paragraph만 flow 제거 |
| M-SD4 | PASS | page-scoped metadata 2열, 작은 media, 닫힌 accordion 예약 높이 제거 |
| M-SD5 | PASS | Gyeonggi-do / third-generation atelier / 80-count silk-cotton / weight+movement / matte depth / pleated movement 모두 보존 |
| M-SD6 | PASS | 옷감과 실루엣 중심 crop, 핀 아래 겹쳐지는 정보판, 별도 caption |

## 1024 주요 변경과 시각 판단

- **Main:** 큰 제목과 영상은 유지하고, lead와 CTA를 한 행으로 묶었습니다. 보조 이미지·중복 설명을 빼면서 두 promo 영상의 체급을 통일했습니다.
- **Brand:** 작은 peek 카드 대신 하나의 큰 Mood 이미지. KYJ의 기존 크기 차이는 유지하되 Handmade/wordmark 축을 맞췄습니다. Heritage는 짧은 중앙 image-led ending입니다.
- **Bespoke:** Atelier 이미지 아래 예약 버튼, 두 줄 인용문과 한 줄 서명, Process 앞 여유. Materials는 이미지/선택 설명을 위에, 비교 가능한 6종 swatch를 아래에 배치했습니다.
- **Shop:** 길게 세로로 이어지던 garment 이야기 네 개를 가로 chapter로 묶었습니다. motif는 왼쪽 참고 이미지와 오른쪽 요약으로 연결됩니다. 과거 520px max-width가 만들던 우측 빈 공간도 제거했습니다.
- **Collection 둘:** end-space를 줄일 뿐 아니라 마지막 photo의 end snap을 사용했습니다. 마지막 경계에서는 여러 사진이 함께 보이므로 keyboard의 논리 선택과 실제 scroll limit를 분리하여 01–05를 모두 방문할 수 있습니다. Archive는 가로 깊이와 중앙 counter로 방향을 명확히 했습니다.
- **Shop Detail:** 원본 사진의 여백을 활용하되 정보는 옷을 덮지 않는 왼쪽 영역에, caption은 사진 아래에 놓았습니다.

## 390 주요 변경과 시각 판단

- **Brand:** 큰 Mood 한 장과 짧은 문장, KYJ의 세 개 의미/사진/label 동기화, 다섯 탭 한 줄, Heritage의 짧은 마무리. 오래 붙는 Heritage crossfade를 제거했습니다.
- **Bespoke:** philosophy와 Atelier 사진을 제거하고, 기존 예약 버튼을 영상 바로 아래 중앙에 배치했습니다. Process 5단계·소재 6종은 그대로 동작합니다.
- **Reservation:** 3개의 선택지가 동시에 보이며, 선택 색·체크를 유지합니다. Occasion popup은 trigger와 같은 폭으로 열리고 아래 공간이 부족하면 위로 열립니다.
- **Shop:** 100% 대형 사진의 반복 대신 크기가 다른 garment chapter. 이미지를 조금 줄이고 이름/짧은 설명/CTA 사이 여유를 확보했습니다.
- **Shop Detail:** hero 인물을 더 자르지 않도록 contain. 긴 역사 문단은 지정한 한 문단만 제거했고, 소재 문단은 고유 정보가 남는 2문장으로 요약했습니다. metadata를 두 열로 묶고, 닫힌 accordion의 불필요한 예약 높이를 없앴습니다.

## 문서 높이 — 같은 viewport/실제 콘텐츠

| Page | 1024 Before → After | 390 Before → After |
|---|---:|---:|
| Main | 8303 → 8166 | 5852 → 5852 |
| Brand | 5750 → 5242 | 5447 → 4187 |
| Bespoke | 7476 → 7372 | 6180 → 4965 |
| Reservation | 5992 → 5992 | 6097 → 5881 |
| TCHAI KIM Collection | 5512 → 5448 | 4477 → 4356 |
| YOUNG JIN Collection | 5608 → 5544 | 4520 → 4363 |
| Shop | 15228 → 9085 | 14222 → 8576 |
| Shop Detail | 6520 → 6497 | 7669 → 5626 |

숫자를 줄이는 것 자체를 목표로 삼지 않았습니다. 영상 frame, 문단 줄바꿈, section의 의도적인 pause는 유지했습니다.

## QA와 증거

- Desktop **8페이지 × 1920/1440/1280 = 24/24**: 시작 HEAD와 section/type/image geometry, 문서 높이, ScrollTrigger 시작·끝/pin 비교 PASS. 자동 marquee는 재생 시점 차이를 제외하고 내부 상대 좌표를 비교했습니다.
- 기술 QA: **8페이지 × 13폭 = 104 조합**. 1920/1440/1280/1279/1024/820/768/767/430/402/390/375/360.
- `html`과 `body`의 overflow 제한을 임시로 풀어 측정. 문서 overflow 0. 390/1024에서는 변경 section마다 스크롤한 위치에서도 별도 확인했습니다.
- console error / unhandled rejection / broken image: 0. 실제 설치 Chrome과 H.264 사용.
- resize: 각 페이지 **1920→1024→390→1024→1920 두 번**. 문서 높이/ST/pin/clone/동적 wrapper 복원 PASS.
- 추가로 페이지 중간에 스크롤한 채 **1280↔1279 / 768↔767**을 포함해 두 번 왕복했습니다. 8페이지 × 2회 **16/16 PASS**: overflow, pin/trigger 복원, 동적 DOM 잔재, 오류를 확인했습니다. Shop 배너의 `once:true` 연출이 끝나 트리거가 2→1로 줄어드는 것은 시작 HEAD에서도 동일하므로, 연출 종료 후 상태를 비교했습니다. Desktop pin과 compact flow 사이의 의도적인 문서 길이 차이를 scrollY 고정과 혼동하지 않았습니다.
- 신규 listener/timeout/interval/RAF/RO/IO/MO를 계측한 왕복 검사에서 활성 수 누적 없음. `resources.json`에 시작·1회·2회 수치를 남겼습니다.
- Mood의 양방향 경계·touch/mouse/trackpad/key, KYJ autoplay pause/resume, reduced-motion autoplay off, 다섯 Tchaikim 탭, Process 5단계, Materials 6종, 양쪽 Collection year/deck/key, Shop story, 상품 pin/Escape 검사 PASS.
- Reservation: **360/390/430/768/1024 × Atelier/Phone**. 세 선택지, 주말 disabled, date/time 유지, agreement/submit, Done 데이터/모드 전달 PASS. 로컬 데모 흐름이며 외부 예약 전송은 하지 않았습니다.
- Shop Detail: 색/사이즈/단위전환/구매 modal/닫기 후 focus/아코디언 검사 PASS.
- JS syntax 및 `git diff --check` 통과. package.json의 lint/build 명령이 없는 정적 프로젝트라 존재하지 않는 빌드 검증을 주장하지 않습니다.

### 검사 파일

- `verification/layout-acceptance.json`: 명세별 실제 geometry/flow/type 측정.
- `verification/61-checklist.json`: 위 측정·동작 결과를 61개 ID에 연결한 최종 수락표.
- `verification/functions.json`: 92개 동작 검사.
- `verification/reservation.json`: 68개 예약 검사.
- `verification/desktop.json`: 24개 Desktop 비교.
- `verification/geometry.json`: 폭/resize/reduced-motion/오류 검사.
- `verification/resources.json`: listener/timer/RAF/observer 계측.
- `verification/mid-resize.json`: 중간 스크롤 위치에서 경계 폭 두 번 왕복.
- `verification/edges.json`: 01–05 논리 선택, rail 위 세로 스크롤, 기존 검색 비교.
- `verification/deep.json`: 상품 UI·section scroll·Desktop 중간 장면.

### 기존 기능 한계 — 이번 변경으로 숨기지 않은 것

Shop 검색창은 **시작 HEAD부터 검색 handler가 없는 UI**입니다. 불일치 검색어를 입력해도 6개 카드가 유지되는 것을 Before/After로 확인했습니다. 초기 추가 검사에서 발견한 이 실패는 responsive 회귀가 아니며, 이번 61개 범위에 없는 새 검색 기능을 임의로 만들지 않았습니다. `deep.json`의 검색 관련 FAIL과 `edges.json`의 baseline 비교를 함께 보십시오. 지정한 보호 동작의 PASS와 사이트의 모든 기능이 완성됐다는 주장은 구분합니다.

## 스크린샷

- 비교 뷰어: [index.html](index.html)
- Before: `responsive-v2-61/before/<page>/<width>-full.png`
- After: `responsive-v2-61/after/<page>/<width>-full.png`
- 섹션: 같은 폴더의 `<width>-<selector>.png`
- 입력 상태 및 Desktop pin 중간 장면: `responsive-v2-61/verification/`

1920/1024/390 전체 페이지와 변경 section을 캡처했습니다. Desktop pin의 빈 runway를 완성 장면으로 평가하지 않고, `desktop-*-before/after-*.png`의 실제 중간 장면도 열어 비교했습니다.

비교 뷰어의 236개 Before/After 이미지 경로도 확인했습니다. 해당 viewport에서 제거된 섹션은 선택 목록에서 제외합니다.

Chromium의 전체 문서 촬영은 native scroll-snap 위치를 촬영 중 이동시키는 경우가 있어, **Brand 전체 이미지 상단만 같은 화면 폭의 실제 viewport screenshot으로 합성**했습니다. 나머지 전체 문서와 section 화면은 브라우저 캡처 그대로입니다. 이는 촬영 보정이며 사이트 CSS를 숨기거나 새 그림으로 대체한 것이 아닙니다.

## 수정 파일

1. `pages/main/css/main.css`
2. `pages/brand/css/brand.css`
3. `pages/brand/js/brand.js`
4. `pages/bespoke/css/bespoke.css`
5. `pages/bespoke/css/materials-editorial.css`
6. `pages/bespoke/js/bespoke.js`
7. `pages/bespoke/css/reservation.css`
8. `pages/bespoke/js/reservation.js`
9. `pages/shop/css/shop.css`
10. `pages/shop/js/shop.js`
11. `pages/shop_detail/css/shop_detail.css`
12. `pages/shop_detail/js/shop_detail.js`
13. `pages/col_chaikim/css/col_chaikim.css`
14. `pages/col_chaikim/js/col_chaikim.js`
15. `pages/col_chaikimyoungjin/css/col_chaikimyoungjin.css`
16. `pages/col_chaikimyoungjin/js/col_chaikimyoungjin.js`

문서: `docs/PROJECT_CONTEXT.md`.
신규 증거 폴더: `responsive-v2-61/` — PLAN/REPORT/비교 뷰어/검증 스크립트/JSON/PNG. 이 폴더는 사이트 초기 로딩에 포함되지 않습니다.

## 사람이 마지막으로 확인할 부분

- 실제 iPhone/iPad Safari의 주소창 높이 변화, 관성 스와이프 감도와 native focus. 이번에는 로컬 Chrome의 touch 입력 모사로 검증했습니다.
- Mood의 기존 원본 이미지가 약 200–260px라 hero로 확대하면 선명도가 낮습니다. 레이아웃 요구를 따라 원본 이미지를 넓혔지만, 새로운 고해상도 원본은 만들거나 교체하지 않았습니다.
- Shop Detail의 `look.png`는 원본 자체가 얼굴 없는 의상 클로즈업입니다. 없는 얼굴을 복구했다고 주장하지 않습니다. Product gallery의 인물은 contain으로 원본 범위를 보존했습니다.
- 자막이 포함된 실제 영상의 장면별 crop과 브랜드가 선호하는 autoplay 속도는 실기기에서 한 번 더 감성적으로 승인하면 좋습니다.

Desktop 유지, Tablet 시각 검토, Mobile 시각 검토, 명세 내 기능 검증, 기술 회귀 검증을 분리해 완료했습니다. 기존 검색 UI의 미구현과 실기기 미검증은 위와 같이 남겨 두었습니다.
