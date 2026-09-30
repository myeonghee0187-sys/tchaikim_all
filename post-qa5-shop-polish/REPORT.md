# Post-QA5 — Shop + Shop Detail narrow-scope polish

2026-09-19 · Local project / real Chrome / local server `127.0.0.1:5733`.

Starting HEAD: `e5532468d19993394af752a49b297cf37a09d6a6` (`최종 QA 5차`).
시작 작업 트리 clean. reset/checkout/commit/push 없음. 라이브러리 설치 없음.

## Acceptance — 12/12 PASS

| ID | 결과 | 확인 내용 |
|---|---|---|
| T-S1 | PASS | 1024 View More 실제 box와 content axis의 중심 오차 0px. 기존 크기/서체 유지. |
| T-S2 | PASS | scrollbar 비표시, 양방향 순환. 실제 mouse/touch/wheel/keyboard 검사. |
| M-S1 | PASS | 390/360 실제 box 중심 오차 0px. |
| M-S2 | PASS | 390/360 양방향 경계 동일 이미지 좌표, native touch + manual drag 유지. |
| D1 | PASS | 갤러리 6장 동일 square/contain/8px padding/배경. 390에서 모두 273×273px. |
| D2 | PASS | Mobile만 `Cheollik Dress No.7` 공백 포함 자연 줄바꿈. 768+ 원문 HTML 복원. |
| D3 | PASS | Joseon 6세기·Cheollik·TCHAI KIM·Namsadangpae 의미를 두 짧은 문단에 보존. 인용/소재/산지/제작 정보 유지. |
| D4 | PASS | 지정 figcaption Mobile flow에서 제거. 관련 사진/alt/원본 유지. |
| D5 | PASS | left edition→floral / right main. 36:64, gap 12px, main margin 0. 360도 유지. |
| D6 | PASS | weave gap 16→6px, padding 24→12px/8px. caption line-height 1.5 유지. |
| D7 | PASS | craft left main / right thread→weave. 60:40, gap 12px, 360 안정. |
| D8 | PASS | 1024 실측 `0px / none / rgb(255,253,249) / radius 0px`와 Mobile 두 이미지 동일. |

**D8 주의:** 밝은 가장자리는 원본 PNG에 들어 있습니다. CSS border를 새로 발명하지
않았습니다. 이미지 소스, 제품 데이터, alt 텍스트는 변경하지 않았습니다.

## 시각 검수와 재수정

- 1024 Shop: New/All/garment/motif 본문은 그대로. View More만 중앙으로 맞추고 상품
  스트립에 수동 순환을 추가했습니다. 세 단계 이미지 크기는 유지합니다.
- 390 Shop: 크기와 페이지 길이를 늘리지 않고 같은 두 영역만 수정했습니다.
- 390 Detail: square gallery 아래 상품 정보가 빨리 보입니다. 제목은 한 문장으로
  연결되고, narrative 두 문단은 각각 2줄 수준입니다. edition/floral은 supporting
  stack, 오른쪽 인물은 primary로 구분됩니다. craft는 왼쪽 큰 소재와 오른쪽 두 정보로 구성했습니다.
- 첫 구현 screenshot 후 본문을 더 축약했습니다. 767에서 편집 이미지가 과대해지는
  것을 확인해 narrative group에 470px max-width를 추가했습니다. 오른쪽 content
  edge는 유지하고 390/360 크기는 바꾸지 않았습니다.
- 기존 Mobile에서 숨겨졌던 역사 문단은 최신 D3의 역사 맥락 보존을 위해 한 문장으로
  요약해 표시했습니다. 768+의 원문은 그대로 복원합니다.

## 보호 영역 / 기술 결과

로컬 검증 assertion 총 137/137 PASS. Geometry 비교는 subpixel 측정 오차를 위해
1px 허용 범위를 사용했고, copy/class/type/border/ScrollTrigger 값은 그대로 비교했습니다.
별도로 실제 스크린샷을 열어 전후 구성을 검수했습니다.

| 검사 | 결과 / 증거 |
|---|---|
| Desktop hard lock | Shop 1920/1280, Detail 1920/1280: HEAD 대비 모든 visible main descendant geometry/type/border/copy 및 ScrollTrigger 좌표 차이 없음. |
| Detail Tablet hard lock | 1279/1024/768에서 같은 비교 PASS. |
| 10 viewport | 360/375/390/430/767/768/1024/1279/1280/1920 × 두 페이지. |
| 실제 overflow | root/body overflow-x를 visible로 바꾼 후 전체 문서 9 scroll 지점 검사, 0px. 주요 section 경계 이탈 0. |
| Console / broken image / rejection | 0 / 0 / 0. |
| Breakpoint 왕복 | 767↔768, 1279↔1280 왕복 뒤 fresh load와 geometry/DOM 동일. |
| 반복 resize | 1920→1024→390→1024→1920을 3회. listener/timer/RAF/observer/clone 누적 0. |
| Clone | compact에서만 16개, Desktop 0. id 중복 0, aria-hidden, tabindex -1. Tab은 원본 8개만 방문. pointer link도 정상. |
| Reduced motion | autoplay 없음. 키보드/수동 탐색 정상, 콘텐츠 opacity 잔류 없음. |
| 세로 입력 | 스트립 위 vertical touch/wheel이 페이지 스크롤을 정상 수행. |
| 기존 Detail 기능 | color, size, purchase dialog 열기/닫기, accordion 3개, gallery touch/keyboard PASS. |
| 기존 Shop 기능 | category selected state/label, search input, 원본/clone product links 유지. |

Shop 검색 결과/filter 결과 로직은 **HEAD부터 구현되지 않은 UI**입니다. 입력/선택
상태를 검증했으며 이 범위 밖의 기능을 새로 만들거나 완성됐다고 평가하지 않았습니다.

Desktop/Tablet과 Mobile 사이의 기존 구성 차이 및 pin runway는 그대로입니다.
`1279→1280`의 기존 Desktop scroll section 길이 변화 자체를 제거하지 않았습니다.
검증은 **새로운 잔재/중복/비정상 점프가 없는지**와 fresh-load 동등성 기준입니다.

## Motif loop 방식과 검증

기존 controller 내부에 <=1279 분기만 추가했습니다. 원본 8개 앞뒤에 한 cycle씩
복제하고 native overflow를 유지합니다. 같은 시각 위치로 scrollLeft를 cycle 너비만큼
정규화합니다. Desktop hover 선택 규칙은 그대로이며 compact에서는 입력 도중 카드
폭이 바뀌지 않게 고정합니다. 새 autoplay/timer/RAF loop 없음.

- 실제 cycle: Tablet 1788px / Mobile 1446px.
- 1024/390/360 각각 양방향 seam 직전/직후 보이는 이미지 src/x/y/width/height **완전 동일**.
- 해당 경계를 실제 mouse drag, CDP touch gesture로 양방향 통과.
- 수평 trackpad wheel, Arrow key, 세로 wheel/touch, 원본 Tab 순서 검증.
- breakpoint exit 시 AbortController abort, observer disconnect, clone 제거,
  tabindex/class/scrollLeft 복원. 재진입 single init.

## 문서 높이

| Page | 1920 Before→After | 1024 Before→After | 390 Before→After |
|---|---|---|---|
| Shop | 18960→18960 | 9569→9569 | 7159→7159 |
| Shop Detail | 7401→7401 | 6497→6497 | 5626→5003 |

390 Detail은 623px(약 11.1%) 감소했습니다. 내용/이미지 삭제가 아닌 요청한
square frame·두 열 media·짧은 copy로 줄였습니다.

## 수정 파일

Production은 아래 **4개**뿐입니다.

- `pages/shop/css/shop.css` — 버튼 중앙, compact scrollbar/loop 상태.
- `pages/shop/js/shop.js` — 기존 motif controller의 responsive 수동 circular branch.
- `pages/shop_detail/css/shop_detail.css` — Mobile gallery/narrative/craft 지정 영역.
- `pages/shop_detail/js/shop_detail.js` — 기존 responsive copy 복원 controller에 title/narrative 매핑 추가.

기록: `docs/PROJECT_CONTEXT.md`.
검증 자료: `post-qa5-shop-polish/`의 `qa.cjs`, `verify.cjs`, `lifecycle.cjs`,
`final.cjs`, `inputs.cjs`, `index.html`, `REPORT.md`, `before/`, `after/`, `verification/`.
HTML/common/다른 페이지/제품 자산 변경 없음.

## Before / After와 실행한 검사

- [비교 뷰어](index.html) — 두 페이지 × 1920/1024/390 전체 화면과 관련 section crops.
- 원본 PNG: `before/{shop,shop-detail}/`, `after/{shop,shop-detail}/`.
- 세부 frame/360/767/loop 경계: `verification/*.png`.
- 검사 JSON: `widths.json`, `regression.json`, `loop.json`, `functions.json`,
  `lifecycle.json`, `final.json`, `inputs.json`.

```sh
node --check pages/shop/js/shop.js
node --check pages/shop_detail/js/shop_detail.js
node post-qa5-shop-polish/qa.cjs before
node post-qa5-shop-polish/qa.cjs after
node post-qa5-shop-polish/verify.cjs widths
node post-qa5-shop-polish/verify.cjs regression
node post-qa5-shop-polish/verify.cjs loop
node post-qa5-shop-polish/verify.cjs functions
node post-qa5-shop-polish/lifecycle.cjs
node post-qa5-shop-polish/final.cjs
node post-qa5-shop-polish/inputs.cjs
git diff --check
```

package.json/build/lint 설정이 없는 정적 프로젝트이므로 존재하지 않는 build/lint 명령을
실행했다고 기록하지 않았습니다. 로컬에 이미 설치된 Playwright + Chrome을 사용했습니다.
자동 WebGL/GSAP 영역은 full-page 캡처만으로 상태를 재현하지 못하므로 Desktop
section crop과 실제 DOM/ScrollTrigger 실측을 같이 비교했습니다.

## 사람이 마지막으로 확인할 미세 디테일

- 실제 iPhone/iPad Safari의 관성 스와이프 감각. 이번 실행 환경은 실제 Chrome 및 CDP
  touch이며 실기기 Safari/Firefox 실행은 하지 않았습니다. scrollbar CSS는 양 엔진 방식 모두 명시했습니다.
- 원본 사진에 이미 포함된 crop/밝은 가장자리. `contain`으로 추가 crop은 막았지만 원본
  사진 밖의 인물/옷 부분을 생성하거나 보충하지 않았습니다.
- 390의 짧은 역사/소재 문구와 인용문의 최종 브랜드 문체 승인.
