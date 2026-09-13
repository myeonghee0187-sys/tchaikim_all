/* brand 페이지 스크립트

   1. mood 문 열림 — 화면을 붙잡아 둔(pin) 채로 스크롤량에 그대로
      연결됩니다(scrub, MOOD_PIN_LENGTH). 페이지를 열면 처음 상태(닫힌
      문)가 고정되어 그대로 보이고, 스크롤해야 진행됩니다 — 자동 재생이
      아닙니다. 가운데 얇은 띠(30 × 484)에서 문(.mood_reveal)이
      **세로 → 가로** 순서로 커집니다. 세로가 먼저 무대 높이의 60%만큼만
      자라 "띠 모양"이 완성되고(화면을 다 채우지 않고 멈춤), 잠깐 뒤에
      가로로 펼쳐지며 남은 세로(60% → 100%)도 함께 자라 배경 사진이 다
      드러납니다(레퍼런스 영상 순서). "초록 띠"로 보이는 건 mood_inner.png
      사진 한가운데의 좁은 부분(올리브색 벽)이고, 문이 넓어질수록 사진에서
      보이는 범위가 늘어날 뿐 사진 자체는 한 번도 움직이지 않습니다.
      **사진이 다 드러난 뒤에야** 글(.mood_copy)이 오른쪽에서 왼쪽으로
      슬라이드해 들어오고, 무드 단어(.mood_right)가 아래에서 떠오릅니다 —
      그 전까지는 둘 다 투명합니다.
      조절 값은 파일 위쪽 MOOD_PIN_LENGTH·REVEAL_* 상수에 모아 두었습니다.

   2. kimyoungjin — 그룹이 화면을 지나가는 동안 스크롤량에 그대로
      연결됩니다(scrub, pin은 쓰지 않음 — 이유는 YOUNGJIN_SCRUB_START
      주석 참고). 자동 재생이 아니라 스크롤한 만큼만 진행되고 멈추면
      그 자리에 멈춰 있습니다. 셋이 동시에 뜨지 않고 **완전히 순서대로**
      진행됩니다 — 솔로 사진(red/blue, 아래에서 느리고 우아하게
      페이드인) → 곁사진(yellow/black, 오른쪽에서 슬라이드) → 그 텍스트
      (Origin/Traditional, 아래에서 떠오르며 페이드인) 순으로 하나가
      끝나야 다음이 시작합니다. 두 그룹은 화면상 위치가 서로 멀리
      떨어져 있어(그룹2가 그룹1보다 1109px 아래) 각자 자기 구간을
      지나갈 때만 재생되고 겹치지 않습니다. 이어서 wordmark(TCHAI 큰
      글자) → handmade 문구도 같은 방식(scrub, pin 없음)으로 wordmark가
      다 올라온 뒤에야 handmade가 시작하도록 순서대로 재생됩니다.
      조절 값은 파일 위쪽 YOUNGJIN_* 상수에 있습니다.

   3. tchaikim(5장면) — 장면 전환은 탭 클릭으로만 이뤄집니다(initTchaikimTabs).
      스크롤로 이 섹션을 지나갈 때는 아무것도 움직이지 않고 화면이 그대로
      TCHAIKIM_PAUSE_LENGTH만큼 잠깐 멈췄다가 아래로 이어집니다
      (initTchaikimPause, 순수 pin — 스크럽·트윈 없음). 멈추는 지점은 섹션
      맨 위가 아니라 TCHAIKIM_PAUSE_START_OFFSET만큼 더 스크롤한 뒤
      — 탭+콘텐츠가 실제로 뷰포트 안에 다 보이는 지점입니다(섹션 위쪽의
      600px 여백만 보이는 채로 멈추지 않도록). initHorizontalSection/
      initHorizontal은 트랙을 가로로 미는 코드가 남아 있지만 init()에서
      부르지 않아 실행되지 않습니다 — 스크롤에 맞춰 장면이 가로로
      넘어가는 동작은 "화면이 옮겨다닌다"는 피드백으로 원치 않는 것으로
      확인돼 껐습니다.

   4. atelier 사진 7장 — 왼쪽으로 계속 흐르는 무한 마퀴(CSS 애니메이션 +
      JS의 사진 복제/폭 측정). 속도는 ATELIER_SPEED 하나로 조절합니다.
      커서로 눌러서 좌우로 당기면 그만큼 따라 움직이고, 놓으면 그
      자리에서 자동 흐름이 이어집니다.

   5. heritage — CSS sticky로 화면을 제자리에 고정한 채 제목이 커지며
      사라지고, 왼쪽 사진 세 장이 순서대로 겹쳐 들어옵니다. 오른쪽 고정
      텍스트는 첫 사진과 함께 한 번만 나타나고, 마지막 사진 뒤에 Bespoke
      버튼이 뜹니다. 조절 값은 파일 위쪽 HERITAGE_* 상수에 모아 두었습니다.

   6. tchaikim 영상 5개는 그 섹션을 보고 있을 때만 재생합니다.

   (scroll 두루마기 영상 섹션은 메인 페이지의 인트로로 옮겼습니다 —
    pages/main/의 index.html · main.css · main.js에 있습니다.)

   HTML/CSS의 기본 상태는 전부 "다 끝난 모습"입니다. 이 스크립트는 시작 상태로
   되돌린 뒤 재생합니다. 그래서 JS나 GSAP이 없으면 완성된 화면이 그대로 보입니다.
*/

(function () {
  "use strict";

  /* ---- mood 문 열림 (스크롤로 mood에 들어오면 재생) -----------------------
     배경 사진(.mood_room)은 항상 object-fit: cover로 무대 전체 폭/높이를
     채우고 절대 움직이지 않습니다 — 문(.mood_reveal)의 크기만 커집니다.
     문이 다 열렸을 때의 가로 폭은 1920px로 고정하지 않고 "100%"(실제
     .mood_stage 폭, 1920px보다 넓은 화면에서는 그만큼 더 넓게)로 잡아서,
     사진이 어떤 화면 폭에서도 좌우 여백 없이 가득 찹니다. */

  /* 문의 시작 크기(닫힌 상태)와 무대 높이(다 열린 상태). CSS(.mood_stage /
     .mood_reveal)와 같은 값이어야 합니다. 가로 폭은 고정 숫자를 쓰지
     않고 실행 시점의 무대 실제 폭("100%")을 그대로 씁니다(아래 play()의
     width: "100%" 참고) — 세로 높이만 여기 상수로 고정합니다.

     ★ 아래 두 값은 1920 × 1080 시안 캔버스 기준 "기본값"입니다. 실제
     초기화 시점(initMoodReveal)에서 실제 창 높이(window.innerHeight)로
     다시 계산해 덮어씁니다 — brand.css의 .mood(★★ 2026-08-22 추가 주석
     참고)가 자기 자신에 zoom을 걸어 조상의 zoom(노트북·발표 화면 모두)을
     완전히 상쇄해 두었으므로, 그 안의 .mood_reveal에 실제 창 높이를
     그대로 써도 화면에는 1:1로 그려집니다 — 배수를 곱하면 오히려
     틀어집니다. 여기 값을 그대로(1080/484) 두면 노트북 폭에서 문이
     실제 화면 높이가 아니라 옛 시안 캔버스 비율로 열려 무대와 다른
     높이에서 끝나버립니다. */
  var REVEAL_CLOSED_WIDTH = 30;
  var REVEAL_CLOSED_HEIGHT = 484;
  var REVEAL_STAGE_HEIGHT = 1080;

  /* ★★★★ 2026-08-23 세 번째로 다시 설계 — 스크롤 위치에 비례해 진행되는
     scrub 방식을 완전히 버렸습니다. 사용자가 참고로 지목한
     https://yh.skdefine.com/ 의 #section7(jQuery, jquery.fullPage.js)을
     직접 열어 실제 동작·JS·CSS를 확인한 결과, 그 사이트는 스크롤
     "위치"가 아니라 **휠 이벤트 1회**를 스텝 하나로 씁니다 —
     - 섹션에 들어오면 자동으로 문이 열리고 텍스트가 뜹니다(사용자
       입력 없이, 정해진 시간 동안).
     - 그 상태에서 사용자가 휠을 한 번 더 내리면 그제서야 슬라이드가
       재생되고, 그동안은 스크롤을 아예 막습니다
       ($.fn.fullpage.setAllowScrolling(false)).
     - 슬라이드가 끝난 뒤에야 다음 휠이 실제로 다음 섹션으로 넘어갑니다.

     즉 "재생 길이"가 스크롤 거리(px)가 아니라 **각 단계가 고정된
     실제 초(설정한 duration 그대로) 동안 재생되고, 그 사이엔 스크롤이
     잠깁니다.** 이게 사용자가 말한 "첫 번째 스크롤에 두 번째 이너가
     보이고, 두 번째 스크롤에 세 번째 이너가 보인다"의 정체였습니다 —
     스크롤한 "양"이 아니라 스크롤 "회"였습니다.

     그래서 지금은 scrub도, "몇 % 스크롤해야 끝난다"는 계산도 없습니다.
     실제 진행은 아래 handleWheel()이 window에 직접 건 wheel 리스너가
     event.preventDefault()로 스크롤을 막은 채 타이머(REVEAL_* DURATION)로
     재생합니다.

     ★★ 이 값을 처음에 "+=100%"(뷰포트 높이만큼)로 뒀다가 실측으로
     잘못을 잡았습니다. lockScroll()이 재생 내내 Lenis를 완전히
     멈추기 때문에, 그동안 스크롤 "거리"는 단 1px도 소비되지 않습니다.
     그런데 releaseScroll() 이후에는 GSAP pin이 여전히 "+=100%"만큼
     스크롤해야 풀리므로, 슬라이드가 다 끝나 세 번째 이너가 완성된
     뒤에도 사용자가 뷰포트 높이만큼(1920×1080에서 1080px)을 그냥
     더 스크롤해야 다음 섹션(kimyoungjin)이 나왔습니다 — "아래 여백이
     너무 크게 남는다"의 정체입니다(pin-spacer 실측: height 2160px 중
     padding-bottom 1080px이 전부 이 죽은 구간이었습니다). pin이 구조상
     0 길이로는 만들어지지 않아 최소한의 값만 남겼습니다 — 이제
     releaseScroll() 직후 다음 휠 한 번이면 바로 kimyoungjin으로
     넘어갑니다. */
  var MOOD_PIN_LENGTH = "+=10";

  /* ★ 이 너비 미만에서는 pin+scrub 인트로를 켜지 않습니다. 1280(다른
     섹션과 같은 기준)에서 켜면 1280~1919 구간에서 mood_left/mood_right
     같은 1920 기준 고정폭 콘텐츠가 뷰포트보다 넓어 오른쪽 무드 단어가
     .mood의 overflow-x: clip에 잘려 나갑니다. 그래서 mood만 기준을
     1920으로 올렸습니다 — CSS도 같은 값을 써야 합니다(brand.css
     "@media (max-width: 1919.98px)"의 mood 규칙 참고). 1920 미만에서는
     문이 이미 다 열린 정적인 모습(CSS 기본값)이라 pin이 필요 없습니다. */
  /* 1920 → 1280. 노트북에서도 mood_left/right가 잘리지 않아 데스크톱
     문 열림을 1280까지 켭니다. brand.css의 max-width: 1279.98px 규칙과 짝입니다.
     ★ 5차에서 1279 이하 축약 reveal을 삭제하면서
       MOOD_COMPACT_MAX_WIDTH · MOOD_COMPACT_PIN_LENGTH 두 상수도 함께
       지웠습니다(더 이상 쓰는 곳이 없습니다). */
  var MOOD_MIN_WIDTH = 1280;

  /* ★ "띠 모양"이 완성됐을 때의 높이 — 무대 높이의 비율입니다. 레퍼런스
     영상에서 세로가 화면 높이를 다 채우지 않고 60%만큼만 자란 뒤 멈춥니다.
     1로 두면 무대 높이(1080)까지 다 자랍니다. */
  var REVEAL_BAND_HEIGHT_RATIO = 0.6;

  /* ★ 1) 띠가 위아래로 자라 위 비율만큼 "띠 모양"이 완성되기까지 걸리는
     시간(초). */
  var REVEAL_HEIGHT_DURATION = 1;

  /* ★ 2) 띠 모양이 완성된 뒤, 가로로 펼쳐지기(배경처럼 넓어지기) 시작할
     때까지 멈춰 있는 시간(초). 레퍼런스 영상의 "완성 후 조금 뒤"입니다. */
  var REVEAL_WIDTH_DELAY = 0.3;

  /* ★ 3) 가로로 펼쳐지며 남은 세로(60% → 100%)도 함께 자라 배경 사진이
     다 드러나기까지 걸리는 시간(초). */
  var REVEAL_WIDTH_DURATION = 2.5;

  /* ★★★★ 2026-08-23 — 위 MOOD_PIN_LENGTH 주석의 설계를 그대로 잇습니다.
     이제 두 "스크롤"은 정확히 두 번의 **휠 이벤트**입니다.

     자동 재생(휠 없이 섹션에 들어오자마자): 문(.mood_reveal)이 높이 →
     폭 순서로 다 열리고, 그 위에서 .mood_inner가 오른쪽 자리
     (REVEAL_PANEL_SHIFT)로 안착하며 글이 페이드인합니다 — 여기까지가
     "두 번째 이너 전체가 보이는" 상태입니다(전체 사진 + 오른쪽 벽에
     선 텍스트, 무드 단어는 화면 밖). 이 구간에는 스크롤이 잠겨 있고,
     끝나면 다음 휠을 받을 준비(armed)가 됩니다.

     사용자의 첫 휠(다음 섹션 방향): .mood_inner를 REVEAL_PANEL_SHIFT →
     0으로 한 번에 밀어 텍스트는 왼쪽 최종 자리로, 무드 단어는 화면
     밖에서 자기 자리로 **동시에** 들어옵니다(항상 768px 간격을 유지한
     채 함께 움직이므로 서로 겹칠 수 없습니다) — "세 번째 이너가
     보이는" 순간입니다. 이 슬라이드가 끝나야 스크롤 잠금이 풀리고,
     그다음 휠부터는 평범하게 다음 섹션(kimyoungjin)으로 넘어갑니다.

     ★★ 2026-08-22 추가 — 배경 사진(.mood_room)은 더 이상 완전히
     고정이 아닙니다. .mood_inner의 형제 요소라 슬라이드에 "끌려가지는"
     않지만, 슬라이드와 같은 타이밍으로 **오른쪽 끝을 축으로 확대**됩니다
     (아래 MOOD_ROOM_PAN_SCALE). 사용자 리포트: "세 번째 이너로 넘어가면
     타이틀 텍스트가 창문 쪽이 아니라 사진 오른쪽 벽지 부분에 떠야
     하는데 계속 창문 쪽에 떠서 가독성이 안 좋다."

     원인 — mood_left(텍스트 판)는 슬라이드가 끝나면 화면 **왼쪽**
     0~768px 자리에 앉습니다. 그런데 배경 사진(assets/images/mood_inner.png,
     1920 × 1084)의 창문은 정확히 그 자리(원본 픽셀 x 120~745)에
     있습니다 — 그대로 두면 문장이 항상 유리창 위에 얹혀 가독성이
     떨어집니다. 반대로 사진 오른쪽(x 745~1900)은 벽지뿐이라 텍스트를
     얹기 좋은 자리인데, "두 번째 이너"(슬라이드 전) 상태의 텍스트가
     이미 그 자리(화면 오른쪽)를 쓰고 있어 창문을 그쪽으로 밀 수도
     없습니다 — 창문 폭(약 620px)이 두 텍스트 자리 사이 빈틈(약
     540px)보다 넓어서 사진을 고정한 채로는 어느 자리로 옮겨도 최소
     한쪽 텍스트와 겹칩니다(실측으로 확인).

     그래서 사진 자체를 슬라이드와 같은 순간에 오른쪽 끝을 축으로
     확대합니다 — 오른쪽 벽지(원래도 사진 오른쪽 끝까지 계속 이어짐)는
     화면 오른쪽 끝에 그대로 고정된 채 그대로 남고, 왼쪽에 있던 창문만
     화면 밖으로 밀려납니다. "두 번째 이너"(슬라이드 전) 동안에는 배율이
     그대로 1이라 지금까지의 창문 있는 방 전체 구도가 전혀 바뀌지
     않습니다 — 사용자가 좋다고 한 그 느낌은 그대로 유지됩니다.

     ★ REVEAL_PANEL_SHIFT는 하드코딩하지 않고 play() 안에서
     wordPanel(.mood_right)의 실제 렌더 폭을 잽니다 — mood_left 768 +
     mood_right 1152 = 1920 = 무대 전체 폭이라, mood_right 폭만큼 밀면
     mood_left가 화면 오른쪽 벽에, mood_right가 화면 밖에 정확히
     맞춰집니다. CSS에서 mood_right 폭이 바뀌어도 따로 손댈 값이
     없습니다. */
  var REVEAL_TEXT_SETTLE = 50;             /* 문이 열린 뒤 텍스트가 안착하는 추가 거리(px) */
  var REVEAL_TEXT_FADE_DURATION = 0.9;     /* 텍스트가 안착하며 페이드인하는 실제 시간(초) */
  var REVEAL_SLIDE_DURATION = 1.6;         /* 사용자의 첫 휠로 재생되는 .mood_inner 슬라이드
                                               길이(초) — yh.skdefine.com #section7의
                                               TRANSITION(1.6s)과 같은 크기로 맞췄습니다. */

  /* ★★ .mood_room(배경 사진)을 슬라이드와 같은 순간에 얼마나 확대할지.
     transform-origin: right center로 오른쪽 끝을 고정한 채 확대하므로,
     이 배율만큼 왼쪽 내용(창문)이 화면 밖으로 밀려납니다.

     1.7로 잡은 근거 — assets/images/mood_inner.png(1920 × 1084)에서
     창문의 오른쪽 끝은 원본 x ≈ 745px입니다. 컨테이너 폭을 W라 하면
     오른쪽 끝 고정 확대에서 원래 화면 x=P였던 점은
       newP = W − (W − P) × scale
     로 이동합니다. 창문의 오른쪽 끝이 슬라이드 후 텍스트 자리
     (화면 x ≈ 0~684, 1920 기준)를 벗어나 화면 밖(newP ≲ 0)으로
     나가려면 scale ≥ 1.62 정도가 필요합니다(1920 기준: 745→0의 최소
     배율이 1920 ÷ (1920−745) ≈ 1.63). 1280×800·1440×900(둘 다 16:9보다
     납작해 배경이 세로 기준으로 커버되는 경우)도 같은 방식으로 계산하면
     최소 배율이 1.58 안팎이라, 세 폭 모두에 여유를 두고 1.7 하나로
     통일했습니다. 실측(Playwright)으로 세 폭 모두 창문이 실제로 화면
     밖으로 나가는 것을 확인했습니다. */
  var MOOD_ROOM_PAN_SCALE = 1.7;

  /* ---- tchaikim 가로 스크롤 --------------------------------------------- */
  var HORIZONTAL_MIN_WIDTH = 1280;
  var PANEL_WIDTH = 1920;

  /* ★ initHorizontalSection()(가로로 트랙을 미는 인터랙션)은 코드는 있지만
     init()에서 부르지 않아 실제로는 동작하지 않는 상태였습니다. 스크롤
     중 이 섹션이 잠깐 멈췄다 내려가길 원해서 한 번 연결해 봤지만, 5장면이
     스크롤에 맞춰 가로로 넘어가는 동작 자체가 의도한 것과 달라("화면이
     가로로 옮겨다닌다") 다시 끄기로 했습니다 — 탭 클릭으로만 장면을
     바꾸는 지금 동작(initTchaikimTabs)은 그대로 둡니다. "멈췄다 내려가는"
     연출은 아래 initTchaikimPause()로 따로 구현했습니다. */

  /* ★ 이 섹션에서 잠깐 멈췄다가(화면은 그대로, 아무것도 움직이지 않음)
     내려가는 여유 구간입니다. 뷰포트 높이 대비 %로, 늘리면 더 오래
     멈춰 있습니다. */
  var TCHAIKIM_PAUSE_LENGTH = "+=50%";

  /* ★ "멈추는 지점이 섹션의 컨텐츠(탭+영상/글)가 보이는 부분에서
     걸려야 한다"는 지적으로 추가했습니다. 원래 start가 "top top"
     (섹션 맨 위가 뷰포트 위에 닿자마자 멈춤)이었는데, `.tchaikim_track`
     위쪽에 600px짜리 여백(padding-top)이 있어서 멈추는 순간 화면
     위쪽 40%가량이 빈 여백이고 정작 콘텐츠(`.tchaikim_con`, 520px 높이)
     아래쪽 약 40%는 아직 뷰포트 밖이라 안 보였습니다(1920×1080 기준
     실측). 이 값(402px)만큼 더 스크롤한 뒤에 멈추도록 시작 지점을
     늦춰서, 멈추는 순간 탭+콘텐츠 전체(683px)가 뷰포트 안에 위아래
     여백이 똑같이 남도록(198px씩) 가운데 놓이게 계산했습니다. 레이아웃이
     바뀌면(탭 높이, 미디어 크기 등) 이 값도 다시 재야 합니다. */
  var TCHAIKIM_PAUSE_START_OFFSET = 402;

  /* ---- atelier 무한 마퀴 -------------------------------------------------
     ★ 속도를 바꾸고 싶으면 이 숫자만 고치면 됩니다. 사진 띠가 1초에 흐르는
     거리(px)입니다. 낮출수록 천천히 흐릅니다. */
  var ATELIER_SPEED = 40;

  /* ---- heritage 스크롤 리빌 -----------------------------------------------
     디자이너 주석 원문: "스크롤 하면 텍스트(Find Your Difference)가 앞으로
     커지면서 스크롤 한 번에 이미지 하나씩 오버레이 되고 3번째 사진 하단에
     비스포크로 이동하는 버튼이 나옴"

     구현: CSS sticky로 화면을 제자리에 고정하고, 스크롤량에 그대로 연결된
     (scrub) 타임라인 하나가 4장면을 순서대로 재생합니다 —
     initHeritageReveal() 참고. */
  var HERITAGE_MIN_WIDTH = 1280;

  /* ★ 제목이 앞으로 커지며 사라질 때의 최종 배율. 1.5면 원래 크기의
     1.5배까지 커진 뒤 사라집니다. */
  var HERITAGE_TITLE_SCALE = 1.5;
  var HERITAGE_TITLE_DURATION = 1; /* 제목이 커지며 사라지는 데 걸리는 길이(타임라인 단위) */

  /* ★ 사진이 겹쳐 들어오는 데 걸리는 길이(장당). 사진마다 이만큼씩 씁니다. */
  var HERITAGE_IMAGE_STEP = 1;

  /* ★ 사진이 자리를 잡기 전 살짝 확대돼 있는 시작 배율. 1에 가까울수록
     확대 느낌이 옅어집니다. */
  var HERITAGE_IMAGE_SCALE_FROM = 1.12;

  /* ★ 앞 장면이 채 안 끝났을 때 다음 장면이 미리 시작하는 겹침 길이.
     0이면 장면 사이가 뚝뚝 끊깁니다. "사진이 바뀔 때 자연스럽지 않다"는
     지적으로 0.2(장당 길이 1의 20%)는 겹치는 구간이 너무 짧아 거의
     컷 전환처럼 보였습니다 — 0.6(60%)으로 늘려 두 사진이 한참 동안
     서서히 섞이며 바뀌도록 했습니다. */
  var HERITAGE_OVERLAP = 0.2;

  /* ★ 마지막 사진이 다 들어온 뒤 Bespoke 버튼이 뜨기까지 쉬는 시간 / 뜨는 길이.
     DURATION을 늘리면 버튼이 다 뜰 때까지 스크롤을 더 많이 해야 해서
     "천천히 올라온다"는 느낌이 강해집니다. */
  var HERITAGE_BUTTON_DELAY = 0.2;
  var HERITAGE_BUTTON_DURATION = 1.5;

  /* ★ 흑백 → 컬러. "과거 → 현재"를 색으로 보여주는 연출입니다. 전체 사진이
     겹쳐지는 동안 이 범위(FROM → TO) 안에서 사진 수만큼 고르게 나눠 갖습니다
     (3장이면 1→0.66→0.33→0 이런 식). 즉 첫 사진이 가장 흑백에 가깝게
     시작하고, 마지막 사진이 다 들어왔을 때 완전한 컬러(0)가 됩니다.
     FROM을 1보다 낮추면 "완전 흑백"까지는 안 가고 시작합니다. */
  var HERITAGE_GRAYSCALE_FROM = 1;
  var HERITAGE_GRAYSCALE_TO = 0;


  function isReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ★★★ 이 함수가 없으면 **배포에서만** 페이지가 겹쳐 보입니다.

     ScrollTrigger는 트리거를 만드는 그 순간의 문서 좌표로 start/end를
     굳힙니다. 그런데 이 페이지의 mood pin은 배경 사진(.mood_room)이
     다 온 뒤에야 만들어집니다(아래 initMoodReveal 끝부분). pin이 생기면
     GSAP이 **문서 맨 위에 mood 섹션 높이 + MOOD_PIN_LENGTH만큼의
     pin-spacer를 끼워 넣어** 그 아래 모든 것을 그만큼 밀어냅니다.
     이때 먼저 만들어져 있던 tchaikim pin·heritage trigger는 옛 좌표를 그대로
     들고 있어서, **실제보다 그만큼 일찍 화면을 붙잡습니다** — 그 결과
     kimyoungjin 글 위에 tchaikim 탭이, 그 위에 heritage 사진이 겹쳐
     보입니다. (구체적인 px 값은 MOOD_PIN_LENGTH·mood 섹션 높이가
     바뀔 때마다 달라지므로 여기 적지 않습니다 — 원인 구조만 참고하세요.)

     로컬에서는 사진이 디스크에서 즉시 와서 `room.complete`가 이미 true라
     mood pin이 **다른 트리거보다 먼저** 만들어집니다. 그래서 이 문제가
     로컬에서는 드러나지 않고 배포에서만 나타납니다.

     ★★ `ScrollTrigger.refresh()`만 부르면 **고쳐지지 않습니다.** 실측으로
     확인했습니다 — refresh는 트리거를 "등록된 순서"대로 다시 재는데,
     늦게 만들어진 mood pin은 목록 맨 뒤라 tchaikim·heritage를 먼저 재고
     그 다음에 mood의 자리를 넣습니다. 결과가 그대로 −2635px입니다.

       refresh()만          → drift −2635 (안 고쳐짐)
       sort() + refresh()   → drift 0

     그래서 문서 순서대로 다시 정렬한 뒤에 재야 합니다. 아래 세 trigger에
     붙인 `refreshPriority`(mood 2 → tchaikim 1 → heritage 0)가 그 순서를
     정합니다. 창 크기 변경처럼 GSAP이 스스로 부르는 refresh에도 같은
     순서가 적용됩니다.

     ★ 새 pin을 나중에 만들 일이 생기면 반드시 이걸 같이 부르세요. */
  function refreshScrollTriggers() {
    if (typeof window.ScrollTrigger === "undefined") {
      return;
    }

    window.ScrollTrigger.sort();
    window.ScrollTrigger.refresh();
  }

  /* mood 문 열림. 스크립트가 body 끝에 있어 이 함수는 DOMContentLoaded를
     기다리지 않고 바로 실행됩니다 — CSS 기본값은 "다 열리고 다 보이는"
     완성된 모습이라, gsap.set()으로 닫힌 초기 상태를 최대한 빨리 되돌려야
     페이지를 열자마자 완성된 모습이 잠깐 비쳤다가 닫히는 깜빡임이 없습니다.
     이후 진행은 pin + scrub이라 사용자가 실제로 스크롤해야만 열립니다.

     이 함수는 문(.mood_reveal)의 크기, 그리고 문이 다 열린 뒤 글
     (.mood_copy)·무드 단어(.mood_right)의 등장만 움직입니다. 배경 사진
     (.mood_room)은 시작부터 끝까지 한 번도 건드리지 않습니다 — 무대
     전체 크기로 이미 놓여 있고, 문이 열리는 만큼 보이는 범위만 늘어날
     뿐입니다. */
  function initMoodReveal() {
    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined"
    ) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var section = document.querySelector(".mood");
    var reveal = document.querySelector(".mood_reveal");
    var room = document.querySelector(".mood_room");
    var moodInner = document.querySelector(".mood_inner");
    var copy = document.querySelector(".mood_copy");
    var wordPanel = document.querySelector(".mood_right");

    if (!section || !reveal || !room || !moodInner || !copy || !wordPanel) {
      return;
    }

    /* MOOD_MIN_WIDTH(1280) 미만이거나 모션 축소 설정이면 이 인터랙션을
       켜지 않습니다 — 1024/768/390 반응형은 CSS 기본값(문이 이미 다 열린
       정적인 모습)을 그대로 씁니다. gsap.matchMedia()를 쓰면 조건이
       어긋날 때(창을 좁히거나 모션 축소 설정을 켜면) GSAP이 이 컨텍스트
       안에서 만든 gsap.set()/타임라인을 전부 스스로 되돌립니다. */
    gsap.matchMedia().add(
      "(min-width: " + MOOD_MIN_WIDTH + "px) and (prefers-reduced-motion: no-preference)",
      function () {
        /* brand.css의 .mood가 이제 자기 자신에 zoom을 걸어 조상의 zoom을
           상쇄해 두었으므로(★★ 2026-08-22 추가 주석 참고), 이 안의
           .mood_reveal에는 실제 창 높이를 배수 없이 그대로 씁니다 —
           무대(.mood_stage, height:100vh)와 정확히 같은 높이로 열립니다. */
REVEAL_STAGE_HEIGHT = 700;
REVEAL_CLOSED_HEIGHT = 484;

        /* .mood_inner를 얼마나 밀어야 mood_right(무드 단어)가 화면 밖으로
           완전히 나가는지는 mood_right 자신의 실제 렌더 폭입니다.

           ★★★ 2026-08-22 추가 — getBoundingClientRect().width로 재면
           안 됩니다. 이 줄은 GSAP이 .mood를 pin-spacer로 감싸기(아래
           ScrollTrigger.create) **전에** 실행되는데, brand.css의 zoom
           상쇄(.pin-spacer:has(> .mood))는 그 spacer가 생긴 뒤에만
           걸립니다. spacer가 없는 지금은 .mood_right가 조상의 zoom
           (예: 1280px 창에서 0.667)을 상쇄받지 못한 채로 자기 zoom
           (--mood_panel_scale, 역시 0.667)까지 또 받아 0.667 × 0.667 =
           0.445배로 **이중 축소**된 값(1152 × 0.445 = 512px)이 잡힙니다
           — 실측으로 확인했습니다.

           그렇다고 이 측정 자체를 spacer가 생긴 뒤로 미루는 것도
           안전하지 않습니다 — mood는 hero 바로 다음(문서 맨 위에 가까운)
           섹션이라, ScrollTrigger.create가 만드는 pin의 시작 조건
           ("top top")이 스크롤 0에서 이미 만족되어 onEnter가 create
           **안에서 동기적으로** 곧바로 실행될 수 있습니다(실측으로
           확인). 그러면 아래로 미룬 측정·초기 gsap.set이 onEnter가 이미
           시작해 둔 문 열림 애니메이션을 도중에 덮어써 버립니다.

           그래서 getBoundingClientRect 대신 **mood_right 자신의 zoom
           값**(--mood_panel_scale, 조상 체인과 무관하게 항상 100vw ÷
           1920px로 정확합니다)을 읽어 계산합니다. 1152는 Figma 원본
           mood_right 폭(css의 width:1152px)입니다 — spacer가 있든
           없든, onEnter가 언제 실행되든 항상 같은 값이 나와 이 함수를
           어디에 둬도 안전합니다. */
        var REVEAL_PANEL_SHIFT =
          1152 * parseFloat(getComputedStyle(wordPanel).zoom || "1");

        /* 시작 상태 — 닫힌 문(30 × 484), 글(.mood_copy)은 투명,
           .mood_inner는 REVEAL_PANEL_SHIFT + REVEAL_TEXT_SETTLE만큼
           오른쪽에 있어 mood_left도 mood_right도 아직 화면 밖입니다.
           배경 사진(.mood_room)은 .mood_inner의 형제라 이 이동과
           무관하게 object-fit: cover로 항상 무대를 채우고 있어 따로
           되돌릴 상태가 없습니다. CSS 기본값(끝난 모습 = 다 열리고 다
           보이는 상태)과 반대이므로, 재생 전에 반드시 되돌려야 합니다. */
        gsap.set(reveal, {
          width: REVEAL_CLOSED_WIDTH,
          height: REVEAL_CLOSED_HEIGHT
        });
        gsap.set(copy, {
          opacity: 0
        });
        gsap.set(moodInner, {
          x: REVEAL_PANEL_SHIFT + REVEAL_TEXT_SETTLE
        });
        /* transformOrigin은 한 번만 정하면 됩니다 — scale은
           playSlide/playUnslide/onEnterBack/onLeaveBack에서만 바뀝니다. */
        gsap.set(room, {
          scale: 1,
          transformOrigin: "right center"
        });

        /* gsap.matchMedia()는 이 컨텍스트 안의 gsap.set()·타임라인·
           ScrollTrigger는 조건이 어긋나면 스스로 되돌려 주지만, 아래
           play() 안에서 window에 직접 건 wheel 리스너는 GSAP이 모르는
           것이라 자동으로 안 떨어집니다(예: 창을 1280px 아래로 좁히는
           도중이었던 경우). activeHandleWheel에 현재 리스너를 기억해
           뒀다가, 이 함수가 맨 끝에 돌려주는 정리 함수에서 직접 뗍니다. */
        var activeHandleWheel = null;

        /* room(배경 사진)이 아직 안 왔는데 pin을 만들면 빈 칸이 드러납니다
           — 아래 playAndRefresh 주석 참고. 그래서 이 안의 모든 상태·
           ScrollTrigger 생성을 play() 하나로 묶어 사진 로드 이후로
           미룰 수 있게 합니다.

           step: 0=닫힘, 1=문 열림(두 번째 이너, 텍스트만), 2=슬라이드
           완료(세 번째 이너, 카드까지). wheelArmed는 "지금 휠 한 번을
           실제로 반영해도 되는가"입니다 — 재생 중에는 항상 false라
           재생이 안 끝난 채로 또 휠을 굴려도 무시됩니다(참고 사이트의
           setAllowScrolling(false)와 같은 역할). */
        function play() {
        var step = 0;
        var wheelArmed = false;

        function lockScroll() {
          if (window.tchaikimmLenis) {
            window.tchaikimmLenis.stop();
          }
        }

        /* releaseScroll은 Lenis만 되돌리는 게 아니라 handleWheel 리스너 자체를
           뗍니다 — wheelArmed만 두면 "다시 재생 중" 신호와 "이제 진짜
           스크롤에 맡긴다" 신호를 구분할 방법이 없어서, step===2(다음
           섹션으로 넘어가도 되는 상태) 이후에는 아예 가로채지 않도록
           리스너를 제거합니다. ScrollTrigger의 onLeave/onLeaveBack에서도
           같은 함수를 불러 안전하게 정리합니다(이미 없어도 무해). */
        function releaseScroll() {
          window.removeEventListener("wheel", handleWheel);
          if (window.tchaikimmLenis) {
            window.tchaikimmLenis.start();
          }
        }

        /* 자동 재생 — 섹션에 들어오면 사용자 입력 없이 바로 시작됩니다.
           문이 높이 → 폭 순서로 열리고, 그 위에서 .mood_inner가 오른쪽
           자리로 안착하며 글이 페이드인합니다. 끝나면 onDone으로
           "이제 첫 휠을 받을 준비가 됐다"를 알립니다. */
        function playOpen(onDone) {
          lockScroll();
          var tl = gsap.timeline({
            onComplete: function () {
              step = 1;
              onDone();
            }
          });

          tl.to(reveal, {
            height: REVEAL_STAGE_HEIGHT * REVEAL_BAND_HEIGHT_RATIO,
            duration: REVEAL_HEIGHT_DURATION,
            ease: "power2.inOut"
          }, 0);

          tl.to(reveal, {
            width: "100%",
            height: REVEAL_STAGE_HEIGHT,
            duration: REVEAL_WIDTH_DURATION,
            ease: "power2.inOut"
          }, REVEAL_HEIGHT_DURATION + REVEAL_WIDTH_DELAY);

          var revealEnd = REVEAL_HEIGHT_DURATION + REVEAL_WIDTH_DELAY + REVEAL_WIDTH_DURATION;

          tl.to(moodInner, {
            x: REVEAL_PANEL_SHIFT,
            duration: REVEAL_TEXT_FADE_DURATION,
            ease: "sine.out"
          }, revealEnd);

          tl.to(copy, {
            opacity: 1,
            duration: REVEAL_TEXT_FADE_DURATION,
            ease: "sine.out"
          }, revealEnd);
        }

        /* 위로 스크롤해 문을 도로 닫을 때(reverse). playOpen의 정확히
           거울상입니다. */
        function playClose(onDone) {
          lockScroll();
          var tl = gsap.timeline({
            onComplete: function () {
              step = 0;
              onDone();
            }
          });

          tl.to(moodInner, {
            x: REVEAL_PANEL_SHIFT + REVEAL_TEXT_SETTLE,
            duration: REVEAL_TEXT_FADE_DURATION,
            ease: "sine.in"
          }, 0);

          tl.to(copy, {
            opacity: 0,
            duration: REVEAL_TEXT_FADE_DURATION,
            ease: "sine.in"
          }, 0);

          tl.to(reveal, {
            width: REVEAL_CLOSED_WIDTH,
            height: REVEAL_STAGE_HEIGHT * REVEAL_BAND_HEIGHT_RATIO,
            duration: REVEAL_WIDTH_DURATION,
            ease: "power2.inOut"
          }, REVEAL_TEXT_FADE_DURATION);

          tl.to(reveal, {
            height: REVEAL_CLOSED_HEIGHT,
            duration: REVEAL_HEIGHT_DURATION,
            ease: "power2.inOut"
          }, REVEAL_TEXT_FADE_DURATION + REVEAL_WIDTH_DELAY + REVEAL_WIDTH_DURATION);
        }

        /* 사용자의 첫 휠(아래 방향) — .mood_inner 전체를 REVEAL_PANEL_SHIFT
           → 0으로 한 번에 밀어 텍스트는 왼쪽 최종 자리로, 무드 단어는
           화면 밖에서 자기 자리로 동시에 들어옵니다. */
        function playSlide(onDone) {
          lockScroll();
          gsap.to(moodInner, {
            x: 0,
            duration: REVEAL_SLIDE_DURATION,
            ease: "power1.out",
            onComplete: function () {
              step = 2;
              onDone();
            }
          });
          /* 배경 사진도 같은 시간·같은 이징으로 확대 — 창문이 텍스트
             자리에서 화면 밖으로 밀려나는 것과 카드 패널이 들어오는
             것이 한 동작처럼 보이도록 duration·ease를 맞췄습니다. */
          gsap.to(room, {
            scale: MOOD_ROOM_PAN_SCALE,
            duration: REVEAL_SLIDE_DURATION,
            ease: "power1.out"
          });
        }

        /* 위로 스크롤해 슬라이드를 되돌릴 때(reverse). */
        function playUnslide(onDone) {
          lockScroll();
          gsap.to(moodInner, {
            x: REVEAL_PANEL_SHIFT,
            duration: REVEAL_SLIDE_DURATION,
            ease: "power1.out",
            onComplete: function () {
              step = 1;
              onDone();
            }
          });
          gsap.to(room, {
            scale: 1,
            duration: REVEAL_SLIDE_DURATION,
            ease: "power1.out"
          });
        }

        /* window에 직접 겁니다 — pin된 섹션이 화면 대부분을 차지하지만,
           커서가 어디 있든 휠을 받아야 하므로 section이 아니라 window입니다.
           passive:false로 열어야 preventDefault()가 실제로 스크롤을
           막습니다(참고 사이트의 setAllowScrolling(false)와 같은 목적). */
        function handleWheel(event) {
          if (!wheelArmed) {
            event.preventDefault();
            return;
          }

          event.preventDefault();
          wheelArmed = false;

          if (event.deltaY > 0) {
            /* 아래 방향 — 다음 섹션 쪽. step===1일 때만 슬라이드를
               재생합니다. 슬라이드가 끝나면 이 섹션이 할 일은 끝났으니
               releaseScroll()로 리스너까지 떼어 평범한 스크롤에
               넘깁니다 — 다음 휠부터는 kimyoungjin으로 자연스럽게
               이어집니다. */
            if (step === 1) {
              playSlide(releaseScroll);
            }
          } else if (event.deltaY < 0) {
            /* 위 방향 — 이전 섹션 쪽. step===2(카드까지 보임)면 먼저
               슬라이드만 되돌리고 다음 휠을 다시 받습니다. step===1
               (문만 열린 상태)이면 문을 닫고 위쪽(section6)으로
               스크롤을 넘깁니다. */
            if (step === 2) {
              playUnslide(function () {
                wheelArmed = true;
              });
            } else if (step === 1) {
              playClose(releaseScroll);
            }
          }
        }

        activeHandleWheel = handleWheel;

        window.ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: MOOD_PIN_LENGTH,
          pin: true,
          /* ★★ 2026-08-22 추가 — GSAP은 기본으로 pin된 요소에
             position:fixed를 직접 걸고, 그 순간의 화면 픽셀 크기
             (getBoundingClientRect, 이미 zoom이 적용된 값)를 그대로
             인라인 width/height로 다시 씁니다. 그런데 이 요소는 여전히
             zoom이 걸린 조상(.main·html) 안에 있어서, 방금 쓴 그
             값에 zoom이 **한 번 더** 곱해져 그려집니다 — 노트북 폭에서
             무대가 실제보다 작게(예: 1440px에서 1440→1080px) 그려져
             옆·아래로 다음 섹션이 비치던 원인이 이것입니다. "transform"
             방식은 position은 그대로 두고 scroll-following만
             translate로 처리해 width/height를 전혀 새로 쓰지 않으므로
             이 문제 자체가 생기지 않습니다. */
          pinType: "transform",
          /* ★ 페이지 맨 위의 pin이라 **가장 먼저** 재야 합니다.
             아래 pin들(tchaikim 1 · heritage 0)이 이 pin이 만든
             자리까지 반영해서 자기 위치를 잡습니다. 자세한 이유는
             refreshScrollTriggers() 주석에 있습니다. */
          refreshPriority: 2,
          onEnter: function () {
            if (step !== 0) {
              return;
            }
            window.addEventListener("wheel", handleWheel, { passive: false });
            playOpen(function () {
              wheelArmed = true;
            });
          },
          onEnterBack: function () {
            /* kimyoungjin 쪽에서 위로 되돌아온 경우 — 이미 다 열리고
               슬라이드까지 끝난 마지막 모습으로 시작합니다. 사용자가
               다시 위로 스크롤하면 handleWheel이 그때부터 되돌립니다. */
            gsap.set(reveal, { width: "100%", height: REVEAL_STAGE_HEIGHT });
            gsap.set(copy, { opacity: 1 });
            gsap.set(moodInner, { x: 0 });
            gsap.set(room, { scale: MOOD_ROOM_PAN_SCALE });
            step = 2;
            wheelArmed = true;
            window.addEventListener("wheel", handleWheel, { passive: false });
          },
          onLeave: releaseScroll,
          onLeaveBack: function () {
            releaseScroll();
            gsap.set(reveal, { width: REVEAL_CLOSED_WIDTH, height: REVEAL_CLOSED_HEIGHT });
            gsap.set(copy, { opacity: 0 });
            gsap.set(moodInner, { x: REVEAL_PANEL_SHIFT + REVEAL_TEXT_SETTLE });
            gsap.set(room, { scale: 1 });
            step = 0;
          }
        });
        }

        /* 사진이 아직 안 왔는데 문이 열리면 빈 칸이 드러납니다.

           ★★★ 사진을 기다렸다가 pin을 만들 때는 **반드시**
           refreshScrollTriggers()를 같이 불러야 합니다. 그 이유는 위
           refreshScrollTriggers 주석에 있습니다 — 안 부르면 배포에서
           아래 섹션들이 통째로 겹칩니다. */
        function playAndRefresh() {
          play();
          refreshScrollTriggers();
        }

        if (room.complete && room.naturalWidth > 0) {
          play();
        } else {
          room.addEventListener("load", playAndRefresh, { once: true });
          room.addEventListener("error", playAndRefresh, { once: true });
        }

        return function () {
          if (activeHandleWheel) {
            window.removeEventListener("wheel", activeHandleWheel);
          }
          if (window.tchaikimmLenis) {
            window.tchaikimmLenis.start();
          }
        };
      }
    );
  }

  function initHorizontalSection(gsap, sectionSelector, trackSelector) {
    var section = document.querySelector(sectionSelector);
    var track = document.querySelector(trackSelector);

    if (!section || !track) {
      return;
    }

    var panelCount = track.children.length;

    if (panelCount < 2) {
      return;
    }

    section.classList.add("is_horizontal");

    /* 마지막 패널이 화면에 다 들어올 때까지 밀어야 하는 거리. */
    var travel = PANEL_WIDTH * (panelCount - 1);

    gsap.to(track, {
      x: -travel,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=" + travel,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }

  function initHorizontal() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* matchMedia를 쓰면 조건이 어긋날 때 GSAP이 스스로 원래 상태로
       되돌립니다. is_horizontal도 같이 떼어 CSS를 원상복구합니다. */
    gsap.matchMedia().add(
      "(min-width: " + HORIZONTAL_MIN_WIDTH + "px) and (prefers-reduced-motion: no-preference)",
      function () {
        initHorizontalSection(gsap, ".tchaikim", ".tchaikim_track");

        return function () {
          var section = document.querySelector(".tchaikim");

          if (section) {
            section.classList.remove("is_horizontal");
          }
        };
      }
    );
  }

  /* tchaikim 섹션을 스크롤로 지나갈 때, 곧바로 다음 섹션으로 넘어가지
     않고 화면이 그대로 잠깐 멈췄다가 내려가도록 합니다. 아무것도
     움직이지 않는 순수 pin(스크럽·트윈 없음) — TCHAIKIM_PAUSE_LENGTH만큼
     스크롤해야 풀립니다. 탭 클릭으로 장면을 바꾸는 동작과는 무관합니다. */
  function initTchaikimPause() {
    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined"
    ) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var section = document.querySelector(".tchaikim");

    if (!section) {
      return;
    }

    /* HORIZONTAL_MIN_WIDTH(1280) 미만에서는 이 pin을 걸지 않습니다. 화면을
       붙잡아 두는 동작이 좁은 화면에서는 "스크롤이 씹힌다"는 느낌을 줍니다. */
    gsap.matchMedia().add(
      "(min-width: " + HORIZONTAL_MIN_WIDTH + "px) and (prefers-reduced-motion: no-preference)",
      function () {
        var trigger = window.ScrollTrigger.create({
          trigger: section,
          start: "top+=" + TCHAIKIM_PAUSE_START_OFFSET + " top",
          end: TCHAIKIM_PAUSE_LENGTH,
          pin: true,
          /* mood pin과 같은 이유(zoom 이중 축소 방지)입니다 — 위
             MOOD_PIN_LENGTH 자리의 "★★ 2026-08-22 추가" 주석 참고. */
          pinType: "transform",
          /* ★ mood(2) 다음, heritage(0) 앞. 문서에 놓인 순서 그대로입니다. */
          refreshPriority: 1
        });

        return function () {
          trigger.kill();
        };
      }
    );
  }

  /* heritage 섹션 — 제목이 커지며 사라지고, 사진 세 장이 차례로 겹쳐
     들어온 뒤 Bespoke 버튼이 뜹니다. 위 HERITAGE_* 상수 설명을 먼저 보세요.

     타이밍은 "고정 초"가 아니라 "타임라인 단위"입니다. scrub:1이라
     타임라인 진행이 스크롤 위치에 그대로 묶여 있습니다. 전체 길이는 CSS의
     .heritage.is_pinned 420vh에서 고정 화면 100vh를 뺀 320vh이며, ScrollTrigger는
     섹션의 실제 끝(bottom bottom)을 따라가므로 화면 높이가 바뀌어도 맞습니다.

     사진 오버레이는 왼쪽 사진 칼럼(.heritage_photos, CSS에서 400×714로
     고정된 자리) 안에서 세 장을 전부 같은 자리(position:absolute + inset:0)에
     포개 두고 opacity만 바꾸는 방식입니다. 나중 사진일수록 HTML에서 뒤에
     오므로 저절로 위에 그려져서, 앞 사진을 따로 숨기지 않아도 "겹쳐
     들어오는" 것처럼 보입니다. 오른쪽 텍스트(.heritage_info)는 사진과
     달리 겹치지 않는 고정 칼럼이라, 첫 사진이 뜨는 시점에 딱 한 번만
     나타나 그대로 있습니다. */
  /* ★ 2026-09-13 (5차) — 1279px 이하 heritage 사진 교체
     (initHeritagePhotoSwap)을 **삭제했습니다.**

     3차에서 250vh 트랙 + sticky 프레임으로 사진 세 장을 한 자리에서
     교체하게 만들었는데, 실제로 보니 사진 한 장을 넘기려고 화면
     2.5개 분량을 스크롤해야 했습니다. 바로 앞 mood의 pin과 이어지면서
     "스크롤이 계속 붙잡힌다"는 피로가 생겼습니다.
     5차 정책(§6 — 긴 sticky/pin 불필요)에 따라 걷어내고, 사진을
     세로로 쌓되 크기에 위계를 준 **정적 편집 레이아웃**으로 바꿨습니다.
     `.heritage.is_photo_swap_ready` CSS는 이제 아무도 붙이지 않으므로
     자동으로 비활성입니다(규칙 자체는 되살릴 때를 위해 남겨 둡니다).
     ★ 데스크톱(≥1280)의 initHeritageReveal(pin reveal)은 그대로입니다. */

  function initHeritageReveal() {
    var section = document.querySelector(".heritage");
    var frame = document.querySelector(".heritage_frame");
    var titleStage = document.querySelector(".heritage_stage_title");
    var info = document.querySelector(".heritage_info");
    var imageStages = Array.prototype.slice.call(
      document.querySelectorAll(".heritage_photos .heritage_stage")
    );

    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined" ||
      !section || !frame || !titleStage || imageStages.length < 1
    ) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* matchMedia를 쓰면 조건이 어긋날 때(창을 좁히거나 모션 축소 설정을
       켜면) GSAP이 스스로 원래 상태로 되돌립니다. is_pinned도 같이 떼어
       CSS를 정지 레이아웃으로 원상복구합니다. */
    gsap.matchMedia().add(
      "(min-width: " + HERITAGE_MIN_WIDTH + "px) and (prefers-reduced-motion: no-preference)",
      function () {
        section.classList.add("is_pinned");

        var title = titleStage.querySelector(".heritage_headline");
        var button = document.querySelector(".heritage_button");

        /* 시작 상태 — 제목만 보이고 사진 세 장·오른쪽 텍스트·버튼은 투명합니다. */
        gsap.set(imageStages, { opacity: 0 });

        if (info) {
          gsap.set(info, { opacity: 0, y: 24 });
        }

        if (button) {
          gsap.set(button, { opacity: 0, y: 40 });
        }

        var timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
            /* 위 두 pin이 만든 자리를 모두 반영한 뒤 heritage의 실제
               시작·끝을 재도록 페이지에서 가장 나중에 refresh합니다. */
            refreshPriority: 0
          }
        });

        /* 1. 제목 — 앞으로 커지며(scale) 흐려져 사라짐 */
        if (title) {
          timeline.to(title, {
            scale: HERITAGE_TITLE_SCALE,
            opacity: 0,
            ease: "power1.in",
            duration: HERITAGE_TITLE_DURATION
          }, 0);
        }

        /* 2~4. 사진 세 장이 순서대로 겹쳐 들어옵니다. previousEnd를 계속
           갱신하면서 다음 장면 시작점을 "직전 장면 끝 − 겹침"으로 잡으므로,
           사진을 늘리거나 줄여도(HTML의 .heritage_stage 개수 변경) 이 함수는
           손댈 필요 없이 자동으로 이어집니다.

           사진마다 흑백→컬러 구간을 (HERITAGE_GRAYSCALE_FROM ~ TO) 안에서
           균등하게 나눠 갖습니다. imageStages.length로 나누므로 사진 수가
           바뀌어도 항상 첫 장 = 가장 흑백, 마지막 장 끝 = 완전 컬러(TO)로
           맞춰집니다. */
        var previousEnd = HERITAGE_TITLE_DURATION;
        var grayscaleRange = HERITAGE_GRAYSCALE_TO - HERITAGE_GRAYSCALE_FROM;

        imageStages.forEach(function (stage, index) {
          var img = stage.querySelector("img");
          var startAt = Math.max(0, previousEnd - HERITAGE_OVERLAP);
          var endAt = startAt + HERITAGE_IMAGE_STEP;
          var grayscaleFrom = HERITAGE_GRAYSCALE_FROM + grayscaleRange * (index / imageStages.length);
          var grayscaleTo = HERITAGE_GRAYSCALE_FROM + grayscaleRange * ((index + 1) / imageStages.length);

          /* sine.inOut — power1.inOut보다 가감속이 더 매끄러워 사진이
             갑자기 나타나거나 뚝 멈추는 느낌 없이 서서히 섞입니다. */
          timeline.fromTo(
            stage,
            { opacity: 0 },
            { opacity: 1, duration: HERITAGE_IMAGE_STEP, ease: "sine.inOut" },
            startAt
          );

          if (img) {
            timeline.fromTo(
              img,
              { scale: HERITAGE_IMAGE_SCALE_FROM, filter: "grayscale(" + grayscaleFrom + ")" },
              { scale: 1, filter: "grayscale(" + grayscaleTo + ")", duration: HERITAGE_IMAGE_STEP, ease: "sine.inOut" },
              startAt
            );
          }

          /* 오른쪽 텍스트는 사진처럼 매번 나타나지 않고, 첫 사진(past)이
             뜨는 시점에 딱 한 번만 같이 페이드인합니다. */
          if (index === 0 && info) {
            timeline.to(info, {
              opacity: 1,
              y: 0,
              duration: HERITAGE_IMAGE_STEP,
              ease: "power1.inOut"
            }, startAt);
          }

          previousEnd = endAt;
        });

        /* 5. 마지막 사진이 다 들어온 뒤 Bespoke 버튼이 아래에서 올라옴 */
        if (button) {
          var buttonStart = previousEnd + HERITAGE_BUTTON_DELAY;

          timeline.to(button, {
            opacity: 1,
            y: 0,
            duration: HERITAGE_BUTTON_DURATION,
            ease: "power2.out"
          }, buttonStart);
        }

        return function () {
          section.classList.remove("is_pinned");
        };
      }
    );
  }


  /* ---- kimyoungjin 등장 --------------------------------------------------
     디자이너 요청 순서:
       1) 솔로 사진(red/blue) — 최종 자리보다 살짝 아래에서 시작해 위로
          떠오르며 페이드인. 느리고 우아하게(빠르지 않게).
       2) 곁사진(yellow/black) — 오른쪽에서 슬라이드해 최종 자리로.
          그 텍스트(Origin/Traditional)는 곁사진보다 살짝 늦게(시간차,
          YOUNGJIN_TEXT_DELAY) 아래에서 떠오르며 페이드인 — "이미지가
          먼저, 텍스트가 조금 늦게".
       3) 두 번째 그룹(black·Traditional·blue)도 같은 방식이되, 요청대로
          blue와 그 텍스트는 오른쪽 슬라이드가 아니라 위로 떠오르는
          동작입니다.

     각 그룹은 화면에 들어오는 스크롤 시점이 서로 달라(첫 그룹이 위,
     둘째 그룹이 1109px 아래) 자연스럽게 따로 재생됩니다 — 한꺼번에
     다 나타나지 않습니다. 최종 위치는 CSS 값 그대로라(gsap.set()으로
     시작 상태만 만들고 끝값은 지정하지 않음) 지금 배치와 달라지지
     않습니다. */
  var YOUNGJIN_SOLO_RISE = 70;         /* ① 솔로 사진이 아래에서 시작하는 거리(px) */
  var YOUNGJIN_SOLO_DURATION = 1.6;    /* ① 솔로 사진 등장 길이(스크럽 타임라인 내 상대 비중 — 초 단위 값이지만
                                           scrub이라 실제 재생 속도가 아니라 전체 구간에서 차지하는 비율로 씁니다) */
  var YOUNGJIN_SIDE_SLIDE = 90;        /* ② 곁사진이 오른쪽에서 들어오는 거리(px) */
  var YOUNGJIN_SIDE_DURATION = 1.1;    /* ② 곁사진 등장 길이(상대 비중) */
  var YOUNGJIN_TEXT_RISE = 30;         /* ③ 텍스트가 아래에서 시작하는 거리(px) */
  var YOUNGJIN_TEXT_DURATION = 0.9;    /* ③ 텍스트 등장 길이(상대 비중) */
  var YOUNGJIN_STEP_GAP = 0.15;        /* 한 요소가 다 올라온 뒤 다음 요소가 시작하기까지 쉬는 타임라인 간격(상대 비중) —
                                           "동시에 올라오지 않고 순서대로"라 겹치지 않게 이 값만큼 쉬고 넘어갑니다 */

  /* ★ 처음엔 그룹이 화면에 들어오면 정해진 초(YOUNGJIN_*_DURATION 합)에 걸쳐
     자동으로 다 재생됐는데, "red 나오고 몇 초 뒤에 yellow가 나오는 게 아니라
     스크롤해야 나오도록" 해달라는 요청으로 스크롤 위치에 진행률을 그대로
     묶는 scrub으로 바꿨습니다. 스크롤을 멈추면 애니메이션도 그 자리에
     멈춥니다.

     mood/heritage처럼 pin(화면 고정)까지는 쓰지 않습니다 — 시도해 보니
     .youngjin_group_first는 .kimyoungjin_frame(높이가 auto가 아니라
     2560px로 고정된 부모) 안의 일반 흐름(flex) 자식이라, pin이 만드는
     여유 공간(spacer)이 고정 높이 부모 밖으로 그냥 넘쳐버리고 문서
     스크롤 길이에는 반영되지 않았습니다. 그 결과 절대좌표로 배치된
     둘째 그룹(.youngjin_group_second, top:1109px)의 시작 지점이 첫
     그룹의 pin 구간과 실측으로 299px 겹쳐 두 pin이 동시에 걸리는
     문제가 있었습니다. pin 없이 그 그룹이 뷰포트를 지나가는 자연스러운
     구간에만 scrub을 걸면 이 문제가 생기지 않아 이 방식을 그대로
     썼습니다. */
  var YOUNGJIN_SCRUB_START = "top 90%"; /* 그룹 윗변이 뷰포트 이 지점에 오면 스크럽 시작 */
  var YOUNGJIN_SCRUB_END = "top 10%";   /* 그룹 윗변이 뷰포트 이 지점에 오면 스크럽 완료(솔로→곁사진→텍스트 다 끝남) */

  var YOUNGJIN_WORDMARK_RISE = 90;      /* wordmark(TCHAI 큰 글자)가 아래에서 시작하는 거리(px) */
  var YOUNGJIN_WORDMARK_DURATION = 2;   /* wordmark 등장 길이(상대 비중) */
  var YOUNGJIN_HANDMADE_RISE = 90;      /* handmade 블록이 아래에서 시작하는 거리(px) */
  var YOUNGJIN_HANDMADE_DURATION = 2;   /* handmade 등장 길이(상대 비중) */

  function initYoungjinMotion() {
    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined" ||
      isReducedMotion()
    ) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* 그룹 하나(솔로 사진 + 곁사진 + 텍스트)를 시작 상태로 되돌린 뒤, 그 그룹이
       뷰포트를 지나가는 구간(YOUNGJIN_SCRUB_START~END) 동안 스크롤량에 맞춰
       (scrub) 솔로 사진 → 곁사진 → 텍스트 순서로 진행되는 타임라인을 만듭니다. */
    function playGroup(groupSelector, soloSelector, sideSelector) {
      var group = document.querySelector(groupSelector);
      var solo = group ? group.querySelector(soloSelector) : null;
      var side = group ? group.querySelector(sideSelector) : null;
      var text = group ? group.querySelector(".youngjin_txt") : null;

      if (!group || !solo || !side || !text) {
        return;
      }

      gsap.set(solo, { y: YOUNGJIN_SOLO_RISE, opacity: 0 });
      gsap.set(side, { x: YOUNGJIN_SIDE_SLIDE, opacity: 0 });
      gsap.set(text, { y: YOUNGJIN_TEXT_RISE, opacity: 0 });

      var timeline = gsap.timeline({
        scrollTrigger: {
          trigger: group,
          start: YOUNGJIN_SCRUB_START,
          end: YOUNGJIN_SCRUB_END,
          scrub: 1
        }
      });

      /* 셋이 동시에 올라오지 않고 완전히 순서대로 진행됩니다 — 솔로 사진이
         다 올라온 뒤(+YOUNGJIN_STEP_GAP만큼 쉬고) 곁사진이 시작하고, 곁사진이
         다 끝난 뒤에야 텍스트가 시작합니다. 위치를 숫자로 안 주고 "+=간격"만
         쓰면 GSAP이 자동으로 "바로 앞 트윈이 끝난 지점"부터 이어 붙입니다. */
      timeline.to(solo, {
        y: 0,
        opacity: 1,
        duration: YOUNGJIN_SOLO_DURATION,
        ease: "power2.out",
        force3D: true
      });

      timeline.to(side, {
        x: 0,
        opacity: 1,
        duration: YOUNGJIN_SIDE_DURATION,
        ease: "power2.out",
        force3D: true
      }, "+=" + YOUNGJIN_STEP_GAP);

      timeline.to(text, {
        y: 0,
        opacity: 1,
        duration: YOUNGJIN_TEXT_DURATION,
        ease: "power2.out",
        force3D: true
      }, "+=" + YOUNGJIN_STEP_GAP);
    }

    playGroup(".youngjin_group_first", ".youngjin_photo_red", ".youngjin_photo_yellow");
    playGroup(".youngjin_group_second", ".youngjin_photo_blue", ".youngjin_photo_black");

    /* 두 그룹 다음으로 wordmark(TCHAI 큰 글자) → handmade가 이어서
       나오도록, 그룹과 같은 방식(pin 없이 scrub만)으로 순서대로
       재생합니다 — wordmark가 다 올라온 뒤에야 handmade가 시작합니다. */
    var wordmark = document.querySelector(".youngjin_wordmark");
    var handmade = document.querySelector(".youngjin_handmade");

    if (wordmark && handmade) {
      gsap.set(wordmark, { y: YOUNGJIN_WORDMARK_RISE, opacity: 0 });
      gsap.set(handmade, { y: YOUNGJIN_HANDMADE_RISE, opacity: 0 });

      var wordmarkTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: wordmark,
          start: YOUNGJIN_SCRUB_START,
          endTrigger: handmade,
          end: YOUNGJIN_SCRUB_END,
          scrub: 1
        }
      });

      wordmarkTimeline.to(wordmark, {
        y: 0,
        opacity: 1,
        duration: YOUNGJIN_WORDMARK_DURATION,
        ease: "power3.out",
        force3D: true
      });

      wordmarkTimeline.to(handmade, {
        y: 0,
        opacity: 1,
        duration: YOUNGJIN_HANDMADE_DURATION,
        ease: "power3.out",
        force3D: true
      }, "+=" + YOUNGJIN_STEP_GAP);
    }
  }

  /* atelier 섹션의 사진 7장을 왼쪽으로 계속 흘려보내는 무한 마퀴입니다.

     실제로 흐르게 하는 건 CSS(@keyframes atelier_marquee, css/brand.css)입니다.
     여기서는 시작 전에 딱 한 번:
       1) 사진을 이어붙일 만큼 통째로 복제하고 (aria-hidden="true" — 스크린리더가
          같은 사진을 여러 번 읽지 않도록)
       2) 원본 한 벌의 폭(period)을 재서 --atelier_period로 CSS에 넘기고
       3) period ÷ ATELIER_SPEED로 애니메이션 길이(--atelier_duration)를 정합니다.
     그다음 CSS가 0 → -period로 무한 반복하고, 마지막에 원본 자리로 돌아온
     순간이 곧 복제본이 원본과 겹치는 순간이라 이음매가 보이지 않습니다.

     사진은 전부 고정 px 크기(css의 .atelier_photo_1~7)라 이미지 로딩을
     기다리지 않고 바로 폭을 잴 수 있습니다.

     ★ 속도는 이 함수가 아니라 위쪽 ATELIER_SPEED에서 바꾸세요.
     ★ 사진을 늘리거나 줄이면(HTML의 .atelier_photo 개수 변경) 이 함수는
       손댈 필요 없이 자동으로 새 폭에 맞춰집니다.
     ★ prefers-reduced-motion에서는 아예 실행하지 않습니다 — CSS 기본값인
       "가운데 정렬 + 좌우 크롭" 정지 화면(시안 그대로)이 보입니다.
     ★ 마우스/터치로 눌러서 좌우로 당기면(pointerdown/move/up) 그만큼
       띠가 따라 움직이고, 손을 떼면 그 자리에서 자동 흐름이 다시
       이어집니다 — 자세한 구현은 아래 드래그 블록 주석 참고. */
  function initAtelierMarquee() {
    var row = document.querySelector(".atelier_row");

    if (!row || isReducedMotion()) {
      return;
    }

    var originals = Array.prototype.slice.call(row.children);

    if (originals.length < 2) {
      return;
    }

    function appendOneSet() {
      originals.forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        row.appendChild(clone);
      });
    }

    /* period를 재려면 최소 한 벌은 더 있어야 "원본 시작 ~ 복제본 시작"
       사이 거리를 잴 수 있습니다. */
    appendOneSet();
    row.classList.add("is_marquee");

    var firstOriginal = originals[0];
    var firstClone = row.children[originals.length];
    var period = firstClone.getBoundingClientRect().left - firstOriginal.getBoundingClientRect().left;

    if (!(period > 0)) {
      /* 폭을 하나도 못 쟀으면(레이아웃이 아직 안 잡힌 특수한 경우) 마퀴를
         켜지 않습니다 — 끊기는 애니메이션보다 정지 화면이 낫습니다. */
      row.classList.remove("is_marquee");
      return;
    }

    row.style.setProperty("--atelier_period", period + "px");
    row.style.setProperty("--atelier_duration", (period / ATELIER_SPEED) + "s");

    /* 넓은 화면(예: 2560px)에서 이음매가 화면 밖으로 나가도록, 화면 폭 +
       한 벌을 채울 때까지 계속 복제해 둡니다. */
    while (row.scrollWidth < window.innerWidth + period) {
      appendOneSet();
    }

    /* ★ "커서로 당겨도 돌아가도록" 요청으로 드래그를 추가했습니다.
       CSS 애니메이션(atelier_marquee)은 그대로 두고, 드래그하는 동안만
       잠깐 꺼서(is_dragging → animation:none) transform을 손으로 쓰고,
       손을 떼면 방금 멈춘 자리에서 이어지도록 음수 animation-delay를
       계산해서 애니메이션을 다시 켭니다 — GSAP 없이도 동작하는
       CSS 트릭입니다(이 함수는 원래 GSAP에 의존하지 않습니다).

       transform 값은 항상 (-period, 0] 범위로 감아 둡니다 — 사진을
       한 벌만큼씩 이어붙여 뒀으니 이 범위 안에서는 어느 지점이든
       이음매 없이 자연스럽게 보입니다. 그래서 아무리 세게/오래
       당겨도(왼쪽이든 오른쪽이든) 끊기지 않습니다. */
    var duration = period / ATELIER_SPEED;
    var isDragging = false;
    var pointerStartX = 0;
    var xAtDragStart = 0;

    function wrapX(x) {
      var wrapped = x % period;
      if (wrapped > 0) {
        wrapped -= period;
      }
      return wrapped;
    }

    function readCurrentX() {
      var matrix = getComputedStyle(row).transform;

      if (!matrix || matrix === "none") {
        return 0;
      }

      /* matrix3d(...)의 13번째 값 또는 matrix(...)의 5번째 값이 x입니다.
         "3d"는 있을 수도 없을 수도 있는 그룹이라 (3d)?로 묶어야 합니다 —
         matrix3d? 로 쓰면 "3"과 optional "d"가 따로 떨어져 실제로는
         matrix(...) 형태와 절대 매치되지 않는 버그가 있었습니다. */
      var values = matrix.match(/matrix(3d)?\(([^)]+)\)/);

      if (!values) {
        return 0;
      }

      var parts = values[2].split(",").map(parseFloat);
      return values[1] ? parts[12] : parts[4];
    }

    /* ★ "뚝뚝 끊긴다"는 지적으로 rAF 배칭을 추가했습니다. pointermove는
       입력 장치에 따라 화면 주사율보다 훨씬 자주(때로는 초당 수백 번)
       발생하는데, 이벤트가 올 때마다 매번 곧바로 transform을 새로
       썼더니 브라우저가 필요 이상으로 스타일을 다시 계산하면서 오히려
       뚝뚝 끊겨 보였습니다. 이제 pointermove는 "다음에 그려야 할 값"만
       적어 두고, 실제로 화면에 반영하는 건 requestAnimationFrame이
       한 프레임에 한 번만 하도록 묶었습니다 — 포인터가 아무리 자주
       움직여도 그리기는 화면 주사율만큼만 일어납니다. */
    var pendingX = null;
    var rafId = null;

    function flushPendingX() {
      rafId = null;

      if (pendingX !== null) {
        row.style.transform = "translate3d(" + pendingX + "px, 0, 0)";
      }
    }

    function scheduleX(x) {
      pendingX = x;

      if (rafId === null) {
        rafId = requestAnimationFrame(flushPendingX);
      }
    }

    function handlePointerDown(event) {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }

      isDragging = true;
      xAtDragStart = wrapX(readCurrentX());
      pointerStartX = event.clientX;
      row.classList.add("is_dragging");
      row.style.transform = "translate3d(" + xAtDragStart + "px, 0, 0)";

      if (row.setPointerCapture) {
        row.setPointerCapture(event.pointerId);
      }
    }

    function handlePointerMove(event) {
      if (!isDragging) {
        return;
      }

      var delta = event.clientX - pointerStartX;
      scheduleX(wrapX(xAtDragStart + delta));
    }

    function handlePointerUp() {
      if (!isDragging) {
        return;
      }

      isDragging = false;

      /* 아직 화면에 반영되지 않은(다음 프레임을 기다리던) 값이 있으면
         지금 즉시 확정합니다 — 그래야 아래에서 읽는 위치가 손을 뗀
         순간의 실제 마지막 위치와 정확히 일치합니다. */
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        flushPendingX();
      }

      /* ★ is_dragging를 떼면 CSS 애니메이션(animation: none)이 곧바로
         다시 살아나 transform을 가져가 버립니다 — 그러면 readCurrentX()가
         방금 끌어다 둔 위치가 아니라 애니메이션 자신의 값을 읽게 됩니다.
         그래서 class를 떼기 전에 먼저 현재 위치를 읽어야 합니다. */
      var currentX = wrapX(readCurrentX());
      var elapsedSeconds = (-currentX / period) * duration;

      pendingX = null;
      row.classList.remove("is_dragging");
      row.style.transform = "";
      row.style.animationDelay = "-" + elapsedSeconds + "s";
    }

    row.addEventListener("pointerdown", handlePointerDown);
    row.addEventListener("pointermove", handlePointerMove);
    row.addEventListener("pointerup", handlePointerUp);
    row.addEventListener("pointercancel", handlePointerUp);
  }

  function initTchaikimTabs() {
    var tablist = document.querySelector(".tchaikim_tabs");

    if (!tablist) {
      return;
    }

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll(".tchaikim_tab"));
    var panels = Array.prototype.slice.call(document.querySelectorAll(".tchaikim_panel"));

    function selectTab(nextTab) {
      var panelId = nextTab.getAttribute("aria-controls");

      tabs.forEach(function (tab) {
        var isSelected = tab === nextTab;
        tab.classList.toggle("is_active", isSelected);
        tab.setAttribute("aria-selected", String(isSelected));
        tab.setAttribute("tabindex", isSelected ? "0" : "-1");
      });

      panels.forEach(function (panel) {
        var isSelected = panel.id === panelId;
        panel.classList.toggle("is_active", isSelected);
        panel.hidden = !isSelected;
      });

      tablist.dispatchEvent(new window.CustomEvent("tchaikimchange"));
    }

    function handleTabClick(event) {
      var tab = event.target.closest(".tchaikim_tab");

      if (tab) {
        selectTab(tab);
      }
    }

    function handleTabKeydown(event) {
      var currentIndex = tabs.indexOf(event.target);

      if (currentIndex < 0 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
        return;
      }

      event.preventDefault();
      var direction = event.key === "ArrowRight" ? 1 : -1;
      var nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
      nextTab.focus();
      selectTab(nextTab);
    }

    tablist.addEventListener("click", handleTabClick);
    tablist.addEventListener("keydown", handleTabKeydown);
  }

  function initVideos() {
    var section = document.querySelector(".tchaikim");

    if (!section || isReducedMotion()) {
      return;
    }

    var videos = Array.prototype.slice.call(section.querySelectorAll(".tchaikim_video"));

    if (!videos.length) {
      return;
    }

    function setPlaying(shouldPlay) {
      videos.forEach(function (video) {
        var panel = video.closest(".tchaikim_panel");
        var shouldPlayVideo = shouldPlay && panel && !panel.hidden;

        if (shouldPlayVideo) {
          var played = video.play();

          if (played && typeof played.catch === "function") {
            played.catch(function () {
              /* 브라우저가 자동재생을 막은 경우입니다. 첫 프레임이 멈춘 채로
                 남고 레이아웃은 그대로입니다. */
            });
          }
        } else {
          video.pause();
        }
      });
    }

    if (typeof window.IntersectionObserver === "undefined") {
      setPlaying(true);
      return;
    }

    var observer = new window.IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          setPlaying(entry.isIntersecting);
        });
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(section);

    var tablist = section.querySelector(".tchaikim_tabs");

    if (tablist) {
      tablist.addEventListener("tchaikimchange", function () {
        var bounds = section.getBoundingClientRect();
        setPlaying(bounds.bottom > 0 && bounds.top < window.innerHeight);
      });
    }
  }

  /* ★ 2026-09-13 (5차) — 1279px 이하 mood 축약 reveal(initMoodCompactReveal)을
     **삭제했습니다.**

     3차에서 데스크톱 문 열림을 좁은 화면으로 번역해 슬릿 reveal + 화면
     높이 70% pin을 넣었는데, 실제 화면에서 확인하니
       · 첫 섹션에서 사용자를 붙잡아 스크롤 피로를 만들고
       · 그 아래 Heritage sticky와 연속돼 pin이 이어지고
       · 정작 글은 9~11px로 읽히지 않았습니다.
     5차 정책(1279 이하는 독립 디자인, motion보다 가독성 우선)에 따라
     인터랙션을 걷어내고 **정적인 편집 레이아웃**으로 바꿨습니다.
     시작 상태를 만들던 `.is_compact_reveal` CSS도 함께 지웠습니다.
     ★ 데스크톱(≥1280)의 initMoodReveal은 그대로입니다. */

  /* mood는 첫 화면이라 한 프레임이라도 늦으면 문이 열리기 전에 완성된
     모습이 먼저 비칠 수 있습니다. 나머지는 DOM이 다 준비된 뒤에
     붙여도 됩니다. */
  initMoodReveal();

  function init() {
    initTchaikimPause();
    initYoungjinMotion();
    initAtelierMarquee();
    initHeritageReveal();
    initTchaikimTabs();
    initVideos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* 그물 — 위 mood pin 말고도 좌표를 늦게 바꾸는 것이 둘 더 있습니다.

     ① 웹폰트(Montserrat / Trirong)가 늦게 적용되면 글 높이가 달라지고,
        그 높이가 곧 각 섹션이 시작하는 스크롤 위치입니다.
     ② 첫 화면 밖 사진들이 늦게 도착합니다.

     둘 다 **로컬에서는 거의 즉시**라 드러나지 않고 배포에서만 어긋납니다.
     refresh는 여러 번 불러도 안전합니다(같은 값이면 그대로 둡니다). */
  if (document.readyState === "complete") {
    refreshScrollTriggers();
  } else {
    window.addEventListener("load", refreshScrollTriggers, { once: true });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refreshScrollTriggers);
  }
})();
