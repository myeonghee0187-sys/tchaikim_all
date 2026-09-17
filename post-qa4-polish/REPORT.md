# Post-QA4 · Narrow-scope Final Polish

Starting HEAD: **0bb829963e6c9bb91b2b813225f4b2938f13816e** (`최종 QA 4차`).
시작 작업 트리 clean. reset/checkout/commit/push 없음. 로컬 프로젝트와
`http://127.0.0.1:5733`에서 검증. 이전 61개 명세는 다시 실행하지 않았습니다.

## 결과

최신 acceptance **45/45 PASS** — 아래 각 항목의 PASS는 로컬 Chrome 검증 범위입니다.
실기기 Safari 검증과 브랜드 담당자의 AI 캠페인 이미지 최종 승인은 별도입니다.

| 영역 | 결과 |
|---|---|
| Shop | 9/9 PASS |
| Brand | 13/13 PASS |
| Bespoke Tablet | 7/7 PASS |
| Collection 두 페이지 | 7/7 PASS, 두 페이지 각각 확인 |
| Global | 9/9 PASS |

## 1024 / 390 주요 변경

### Shop — Catalogue만

- New 4개 / All 6개에 동일한 2-column 카드 시스템. Mobile 첫 카드 full-span 제거.
- IMAGE → NAME/PRICE → SWATCH → DESCRIPTION → TAG 순서와 높이 기준 통일.
- 전체 카드 높이는 고정하지 않음. 이름 2줄 최소 슬롯, 설명 2줄 clamp와 내부 Grid/Flex 사용.
- 이미지 4:5 통일. 기존 개별 확대를 compact에서 해제해 의상 실루엣을 더 보여줌.
- 스카프의 중첩 media wrapper 때문에 생기던 안쪽 축소를 compact CSS에서만 보정.
- 상품명 Tablet 24px / Mobile 15–16px, 가격 16/13px, 짧은 설명 15/13px.
- 태그 Tablet 36px·12px / Mobile 28px·11px, 동일한 padding/border/radius/gap.
  태그는 비인터랙티브 정보이며, 실제 색상 버튼은 Tablet 44×44 / Mobile 36×44px.
  Mobile 4개 색상 선택 영역이 360px에서 서로 겹치지 않도록 배치.
- 내부 간격 4–20px < 열 20/32px < 행 56/72px < 하위 묶음 80/96px.
  New/All/검색·필터/View More는 같은 좌측 축: 1024에서 x40, 390에서 x20.

### Brand

- 내장 이미지 생성 스킬·도구로 UNIQUE/ELEGANT/MODERN 캠페인 3장 제작.
  실제 반환 크기 1448×1086px, 웹용 JPEG 각 233–265KB. 인위적 업스케일 없음.
- `<picture>`의 <=1279 source로만 연결. Desktop에서 신규 JPEG 요청 0건 확인.
  Desktop door와 원래 Mood 이미지 그대로 유지.
- Tablet/Mobile 모두 **KEYWORD → HERO IMAGE → logical counter**.
  설명과 기존 슬라이드 번호는 flow와 focus에서 제외. 무한 순환 controller는 재작성하지 않음.
- Mood와 KYJ의 실제 시작색이 같은 `--brand_olive`이므로 밝은 중간색 띠를 제거.
  연결부를 Tablet 48px / Mobile 32px로 압축하고, KYJ 기존 olive→gray gradient에 연결.
- Tablet `Tchai Kimyoungjin`, `Tchaikim` 제목 추가. 기존 KYJ 이미지 크기·위치 관계,
  Tchaikim 5-tab controller와 Atelier marquee는 유지.
- Heritage: 중앙 제목/한 프레임/버튼. 기존 3장에 scroll-progress crossfade.
  Tablet 140svh / Mobile 130svh, **pin spacer 없이** 짧은 sticky frame 하나.
  reduced-motion은 마지막 대표 이미지 정적 표시. 모션 축소/폭 전환 시 GSAP context 정리.

### Bespoke Tablet

- Philosophy/Atelier wrapper를 통째로 flow에서 제외. head/image/빈 높이 제거.
- 기존 Mobile 버튼 reparent 조건을 <=1279로 확장. 영상 아래 28px, 중앙 정렬.
- Philosophy, compact Atelier의 기존 전환 인스턴스를 생성하지 않음.
- 화면비만 보던 Hero 전환 조건에도 >=1280 조건을 넣음. 가로 Tablet 1279×650,
  1024×600에서도 숨긴 Philosophy의 scroll runway가 남지 않음.
- Desktop 복귀 시 원래 `.atelier_body` 위치로 같은 버튼 하나를 복원.
  Quote/Process/Materials/Begin/Reservation 구성은 수정하지 않음.

### Collection 두 페이지

- <=1279 Showcase nav 전체 `display:none`. 42px의 nav+여백 제거.
  nav DOM과 논리 counter는 보존해 기존 swipe state와 분리된 표시만 변경.
- Tablet에서만 As Worn body overlay 전체(제목/설명/CTA/gradient) 제거.
  heading/filter/image-only draggable track. Mobile 및 Desktop overlay는 유지.
- Archive/year/deck/counter/controller는 수정하지 않음.

## 각 Acceptance

| ID | 항목 | 결과 / 근거 |
|---|---|---|
| S-A1 | Tablet 2-column | PASS · 768/1024/1279 |
| S-A2 | Mobile 2-column | PASS · 360/375/390/430/767 |
| S-A3 | New/All 같은 카드 | PASS · 동일 CSS와 10개 실측 슬롯 |
| S-A4 | 공통 image frame | PASS · 4:5, 중첩 스카프 frame 보정 |
| S-A5 | name/price/swatch/description/CTA baseline | PASS · 모든 카드 상대 Y 차이 <1px |
| S-A6 | button/tag 규격 | PASS · 동일 규격, 색상 hit area 비중첩 |
| S-A7 | 공통 horizontal axis | PASS · x40/x20 |
| S-A8 | spacing hierarchy | PASS · 내부 < 열 < 행 < 묶음 |
| S-A9 | 기능 회귀 0 | PASS · 색상, 링크, category, Escape/focus, 입력 상태 보호 |
| B-A1 | Mood asset 생성 | PASS · 3 PNG 원본 + 3 JPEG, ASSETS.md |
| B-A2 | Tablet keyword 복구 | PASS · 3개 모두 표시 |
| B-A3 | Tablet 긴 설명 없음 | PASS · display:none |
| B-A4 | Mobile keyword | PASS · 이미지 위 표시 |
| B-A5 | Mobile description 제거 | PASS · flow 제외 |
| B-A6 | one-image bidirectional infinite | PASS · 02→03→01→03→02→01, touch/mouse/trackpad/keyboard |
| B-A7 | Mood→KYJ 연결 | PASS · 동일 computed olive, 밝은 띠/빈 margin 제거 |
| B-A8 | Tablet Tchai Kimyoungjin | PASS · frame 최상단 좌측 |
| B-A9 | Tablet Tchaikim | PASS · 제목→중앙 tabs→content |
| B-A10 | Tablet Heritage same-frame fade | PASS · 01/02/03 및 중간 opacity 캡처 |
| B-A11 | Mobile Heritage same-frame fade | PASS · 130svh, pin spacer 0 |
| B-A12 | Heritage 중앙축 | PASS · title/frame/button center 오차 <1px |
| B-A13 | reduced-motion 안전 | PASS · 대표 이미지 1장 opacity 1 |
| BS-A1 | Philosophy 제거 | PASS · 숨김 영역 trigger 0 |
| BS-A2 | atelier_head 제거 | PASS · 전체 wrapper flow 제외 |
| BS-A3 | atelier_image 제거 | PASS · 전체 wrapper flow 제외 |
| BS-A4 | 영상 바로 아래 버튼 | PASS · 영상 하단+28px |
| BS-A5 | 중앙 버튼 | PASS · 중심 오차 <1px |
| BS-A6 | 빈 잔재 없음 | PASS · 가로/짧은 Tablet에서도 Hero 전환 runway 0 |
| BS-A7 | Desktop DOM 복원 | PASS · 같은 버튼 1개, atelier_body 복귀 |
| C-A1 | Tablet Showcase nav 없음 | PASS · 두 페이지 |
| C-A2 | Mobile Showcase nav 없음 | PASS · 두 페이지 |
| C-A3 | Showcase swipe | PASS · 두 페이지 양방향 |
| C-A4 | nav 여백 없음 | PASS · section 42px 감소 |
| C-A5 | Tablet asworn text 없음 | PASS · body overlay 전체 숨김 |
| C-A6 | image-only drag | PASS · 두 페이지 이동 실측 |
| C-A7 | Desktop/Mobile 회귀 없음 | PASS · Desktop geometry/trigger 동일, Mobile overlay 유지 |
| G-A1 | 1920 hard lock | PASS · 5개 페이지 HEAD geometry/ScrollTrigger 비교 |
| G-A2 | 1024 visual QA | PASS · before/after full+section 직접 열어 검토 |
| G-A3 | 390 visual QA | PASS · 첫 구현 후 카드 규격/서체/중첩 frame 재보정 |
| G-A4 | 767↔768 | PASS · 의도한 제목/overlay 분기, 중복 없음 |
| G-A5 | 1279↔1280 | PASS · 버튼 복귀·제목/clone/compact fade cleanup |
| G-A6 | Resize 왕복 | PASS · 1920→1024→390→1024→1920 각 2회 |
| G-A7 | 실제 overflow | PASS · root/body visible 강제, 전체 scroll path 실측 0px |
| G-A8 | console/broken/rejection | PASS · 5개 페이지 ×10폭 0 |
| G-A9 | lifecycle 누적 | PASS · listener/timer/RAF/observer/DOM/trigger 추가 누적 없음 |

### 검증 해석상 주의

- Shop 검색 및 Filter/View More 결과 처리 handler는 **시작 HEAD에도 없는 UI**입니다.
  이번 작업에서 새 기능을 만들지 않았습니다. category 선택/닫힘/포커스,
  검색 입력 보존과 상품 링크·swatch 동작이 baseline과 같은지 확인한 PASS입니다.
- Shop의 once-only 등장 trigger는 실행 뒤 정상 제거됩니다. 2→1을 누락으로
  보지 않고, 동일 geometry와 trigger 증가 없음으로 회귀를 판정했습니다.
- 기존 Collection marquee는 첫 resize에서 필요한 반복 세트를 확보합니다.
  TCHAI KIM 8→12→12→12, Young Jin 9→9→9→9. HEAD와 수정본이 동일하며
  왕복마다 늘어나는 clone/listener 누적은 없습니다.
- 자원 계측은 1.2초 창에서 지속 자원과 일회성 예약 frame을 구분했습니다.
  기존 RAF 2개가 유지되고, 순간적인 3번째 frame은 다시 사라집니다.
- 실기기 iOS/iPadOS Safari는 미검증입니다. Chrome/CDP의 touch·keyboard·mouse·wheel 검증입니다.

## 문서 높이 (px)

| Page | 1920 Before→After | 1024 Before→After | 390 Before→After |
|---|---:|---:|---:|
| Shop | 18960→18960 | 9085→9569 | 8576→7159 |
| Brand | 12956→12956 | 5242→5985 | 4187→4406 |
| Bespoke | 14396→14396 | 7372→5615 | 4965→4965 |
| TCHAI KIM Collection | 8113→8113 | 5448→5406 | 4356→4314 |
| Young Jin Collection | 8113→8113 | 5544→5502 | 4363→4321 |

Shop Tablet의 증가는 New/All 사진을 같은 4:5 frame으로 맞추고 New 의상의
실루엣을 더 보여준 결과입니다. Brand는 복구한 제목·사진 frame·짧은 fade 구간의
의도된 증가입니다. Mobile Shop은 약 16.5%, Tablet Bespoke는 약 23.8% 단축됐습니다.

## 수정 파일 전체 목록

Production code (8):

- `pages/shop/css/shop.css`
- `pages/brand/index.html`
- `pages/brand/css/brand.css`
- `pages/brand/js/brand.js`
- `pages/bespoke/css/bespoke.css`
- `pages/bespoke/js/bespoke.js`
- `pages/col_chaikim/css/col_chaikim.css`
- `pages/col_chaikimyoungjin/css/col_chaikimyoungjin.css`

Assets (6):

- `pages/brand/assets/images/mood-unique-qa4.png`
- `pages/brand/assets/images/mood-unique-qa4.jpg`
- `pages/brand/assets/images/mood-elegant-qa4.png`
- `pages/brand/assets/images/mood-elegant-qa4.jpg`
- `pages/brand/assets/images/mood-modern-qa4.png`
- `pages/brand/assets/images/mood-modern-qa4.jpg`

기록/QA: `docs/PROJECT_CONTEXT.md`, `post-qa4-polish/PLAN.md`, `ASSETS.md`,
`REPORT.md`, `index.html`, `qa.cjs`, `verify.cjs`, `resources.cjs`, `details.cjs`,
`assets-check.cjs`, `bespoke-check.cjs`, `before/`, `after/`, `verification/`.
QA 캡처·JSON 개별 파일은 [FILES.txt](FILES.txt)에 기록했습니다.

Main / Intro / Shop Detail / Reservation / Done / common 파일은 변경하지 않았습니다.
브랜드 KYJ Tablet 이미지 composition, 탭 controller, Atelier marquee, Collection Archive,
Bespoke Quote/Process/Materials/Begin/Reservation 코드는 변경하지 않았습니다.

## Screenshot / 결과 저장 위치

루트: `/Users/songmyeonghee/Documents/tchaikim_all/post-qa4-polish/`

- [Before/After 비교 뷰어](index.html)
- `before/<page>/1920-full.png`, `1024-full.png`, `390-full.png`
- `after/<page>/1920-full.png`, `1024-full.png`, `390-full.png`
- 같은 폴더의 `*-<section>.png`, `*-top.png`
- `verification/brand-{390,1024}-heritage-{0,0.25,0.5,0.7,1}.png`
- `verification/*-shop-*-all.png`, `*-filter.png`, `*-showcase.png`
- `verification/{desktop,geometry,geometry-final,functions,resources,details,assets,bespoke-final,marquee}.json`

캡처는 실제 페이지의 lazy 이미지를 미리 decode한 뒤 생성했습니다.
Chrome full-page paint는 native snap rail의 scrollLeft를 다르게 그리는 문제가 있어,
Brand full-page의 Mood 부분만 직전 실제 viewport 캡처로 합성했습니다.
원본 viewport `*-top.png`를 함께 보존했고, 디자인/CSS를 바꿔 찍은 mockup은 아닙니다.
긴 Desktop pin 및 Heritage sticky의 동시 전체 모습은 full-page 정지 이미지로
평가할 수 없어 별도 section/state 캡처와 geometry/scroll 검사를 함께 사용했습니다.

## 첫 구현 이후 재수정

1. 기존 상품 modifier의 CSS 우선순위 때문에 New/All 사진 비율이 달랐던 것을 수정.
2. 360px의 가장 긴 상품명이 3줄이 되지 않도록 15–16px fluid type 조정.
3. Mobile 태그 9px 시안을 11px로 키워 읽기성 재확인.
4. 스카프 중첩 media wrapper의 padding/flex 축소 해제.
5. Tablet 제목 cleanup보다 GSAP Desktop 측정이 먼저 실행돼 생기던 28px 높이 잔재 수정.
6. 가로 Tablet에서 Philosophy가 숨겨진 후에도 남던 aspect-ratio 기반 Hero 전환 제거.
7. 신규 Mood JPEG를 Desktop에서 불필요하게 요청하지 않도록 picture source 제한.

## 마지막 사람이 확인할 세부 사항

- 생성 이미지의 의상·모델·텍스처가 실제 브랜드 캠페인 표현에 적합한지 승인.
  실제 판매 상품 사진으로 오인하지 않도록 캠페인 컨셉 이미지로 취급해야 합니다.
- 1279px 고밀도 화면(DPR2)까지 네이티브 해상도를 원하면 향후 2560px급 원본 권장.
  지금 파일은 생성기가 실제 반환한 1448px이며, 가짜 고해상도 확대는 하지 않았습니다.
- iPhone/iPad Safari에서 손가락 관성 및 Heritage fade 속도의 최종 감각 확인.
- 짧은 상품 설명의 말줄임, Mobile 36px 가로 swatch hit area의 실사용감.

설치/새 framework 없음. 기존 프로젝트에 lint/build 명령이 없어 임의 명령을
통과했다고 기록하지 않았습니다. JavaScript syntax 검사와 `git diff --check`는 통과했습니다.
