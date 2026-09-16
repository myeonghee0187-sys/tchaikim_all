(function () {
  "use strict";

  /* =========================================================
     showcase 스크롤 인터랙션 조절값
     ========================================================= */

  /* 시안 캔버스 폭. 상단 카드가 "가운데로 모이는" 목표 지점을 잡을 때 씁니다. */
  var CANVAS_WIDTH = 1920;

  /* 타임라인 1단위가 몇 px의 스크롤에 해당하는지. pin 구간 전체 길이를
     "타임라인 총 길이 × 이 값"으로 냅니다. 올리면 전 구간이 함께 느려집니다.

     예전에는 pin 길이를 화면 높이의 배수(`"+=140%"`)로 직접 적었습니다.
     그러면 pin 길이와 타임라인 길이가 따로 놀아서, 구간을 하나 더하면
     전체 속도가 같이 바뀌었습니다. 지금은 타임라인이 길이를 정합니다. */
  var SHOWCASE_PX_PER_UNIT = 380;

  /* 갤러리 카드 한 장이 떠오르는 타임라인 길이. */
  var GALLERY_REVEAL = 0.62;

  /* 프레임이 안쪽에서 올라가는 속도(px / 타임라인 1단위).
     SHOWCASE_PX_PER_UNIT으로 나눈 값이 곧 "평소 스크롤 대비 배속"입니다
     (520 / 380 = 1.37배). 이 값은 pin 구간 내내 일정합니다.

     ★ 구간마다 다르게 두면 안 됩니다. 예전에는 "이동 → 정지 → 이동"으로 나누고
     이동만 880(2.32배)으로 몰아쳤는데, 속도가 0과 2.32 사이를 계단처럼 오가서
     스크롤이 뚝뚝 끊겨 보였습니다(pin 2454px 중 1360px이 완전 정지였습니다).
     끊김은 속도의 크기가 아니라 속도가 갑자기 바뀌는 데서 옵니다. */
  var GALLERY_TRAVEL_SPEED = 520;

  /* 카드가 제자리에 서는 지점 사이의 최소 간격(px).
     시안 좌표상 d의 중심이 c보다 59px 위라, 이 값이 없으면 두 장이 같은 지점에서
     동시에 떠 버립니다. 한 장씩 차례로 보이게 하는 값입니다. */
  var GALLERY_MIN_GAP = 150;

  /* 좌우 카드가 날아 들어오기 시작하는 지점. pin 구간 밖이라 이 구간의 스크롤
     속도는 평소와 같은 1배입니다. 끝은 항상 "top top"(= pin 시작 지점)이라
     카드가 다 앉는 순간 곧바로 pin으로 넘어갑니다.
     늦추고 싶으면 "top bottom-=200"처럼 줄이면 됩니다. */
  var INTRO_ENTER_START = "top bottom";

  /* 마지막 카드까지 끝나고 pin이 풀리기 전까지 머무는 길이.
     이 구간만 속도가 0이라 길게 잡으면 끝에서 한 번 걸리는 느낌이 납니다. */
  var SHOWCASE_TAIL_HOLD = 0.15;

  /* 스크롤 진행도에 맞춰 프레임 안에서 차례로 등장하는 갤러리 카드입니다.
     배열 순서가 곧 등장 순서입니다. */
  var SHOWCASE_GALLERY = [
    ".showcase_photo_c",
    ".showcase_photo_d",
    ".showcase_photo_e",
    ".showcase_photo_f",
    ".showcase_photo_g"
  ];

  /* 상단 카드가 화면 바깥 어디에서 출발할지(px). 카드 폭보다 커야 완전히 가려집니다. */
  var ENTER_OFFSET = 560;

  /* 들어올 때 3D 회전각과 원근 거리. 값이 작을수록 원근이 강해집니다. */
  var ENTER_TURN = 42;
  var PERSPECTIVE = 900;

  /* 시안 기울기. 들어올 때는 이 값의 ENTER_TILT_RATIO배에서 시작해 이 값으로 앉고,
     그 뒤로는 바뀌지 않습니다(퇴장 연출을 없앴습니다). */
  var TILT_A = -15.55;
  var TILT_B = 13.07;
  var ENTER_TILT_RATIO = 2.2;

  /* 단어 연출. STAGGER가 클수록 "한 단어씩" 끊어져 올라오는 느낌이 또렷해집니다.

     ★ 올릴 때는 문장이 화면 밖으로 나가기 전에 다 뜨는지 확인해야 합니다.
     문장은 프레임 y 712에 있고 pin이 시작되면 프레임이 1.37배로 올라가므로,
     단어가 늦게 뜰수록 문장 블록이 화면 위쪽으로 밀립니다.
     0.16이었을 때 자매 페이지(단어 7개)에서 마지막 단어가 뜨는 순간
     문장 top이 11px까지 올라갔습니다 — 화면이 조금만 낮아도 잘립니다.
     0.12면 단어가 5개일 때 top 254, 7개일 때 130으로 여유가 있습니다. */
  var WORD_SLIDE = 64;
  var WORD_DURATION = 0.4;
  var WORD_STAGGER = 0.12;

  /* CARD_B_DELAY는 등장 타임라인(pin 밖) 기준, WORDS_START는 pin 타임라인 기준입니다.

     pin이 시작되는 순간 좌우 카드는 이미 제자리에 앉아 있습니다. 그래서 문장이
     pin의 맨 앞에서 바로 시작합니다. 여기서 지체하면 그만큼
     "화면이 멈춘 채 기다리는" 구간이 됩니다. */
  var CARD_B_DELAY = 0.08;
  var WORDS_START = 0;

  /* 하단 갤러리 카드가 떠오르는 기본 거리(px). 카드마다 STEP만큼 더해 패럴랙스를 만듭니다. */
  var RISE_BASE = 110;
  var RISE_STEP = 26;

  /* =========================================================
     archive 조절값
     ========================================================= */

  /* 화면 밖에서 날아 들어오는 기본 거리(px). 카드마다 아래 배치표의 travel 배수를 곱해
     서로 다른 거리에서 출발합니다. 방향은 카드가 프레임 중앙의 어느 쪽에 있는지로 정합니다.
     showcase 상단 두 장이 x ∓560에서 들어오는 것과 같은 크기입니다. */
  var ARCHIVE_ENTER_DISTANCE = 520;

  /* 뒤에서 앞으로 쌓이는 느낌을 주려고 작고 비뚤어진 상태에서 시작합니다.
     SPIN은 출발 방향의 좌우 성분에 곱해져 카드마다 기울기가 달라집니다. */
  var ARCHIVE_ENTER_SCALE = 0.78;
  var ARCHIVE_ENTER_SPIN = 14;

  /* 한 장이 날아드는 길이와 장 사이 간격. scrub이므로 초가 아니라 스크롤 진행도입니다.
     STAGGER를 DURATION의 3분의 2쯤으로 두면 앞 장이 거의 도착한 뒤 다음 장이 출발해
     "한 장씩" 쌓이는 것이 또렷하게 보입니다. 예전 값(0.95 / 0.18)은 겹침이 커서
     다섯 장이 거의 동시에 들어왔습니다. */
  var ARCHIVE_DURATION = 0.75;
  var ARCHIVE_STAGGER = 0.42;

  /* 마지막 장이 도착한 뒤 pin이 풀리기 전까지 붙잡아 두는 길이.
     이 구간이 없으면 마지막 장을 보자마자 화면이 흘러갑니다. */
  var ARCHIVE_HOLD = 0.45;

  /* 타임라인 1단위가 몇 px의 스크롤에 해당하는지. pin 구간 길이를 이 값으로 냅니다. */
  var ARCHIVE_PX_PER_UNIT = 400;

  /* 연도를 바꿀 때 이전 세트가 사라지는 시간. 이 사이에 새 사진이 내려받기를 시작합니다. */
  var ARCHIVE_SWAP_FADE = 0.25;

  /* ★ ARCHIVE_REPLAY_* 는 2026-08-11에 지웠습니다. 연도를 바꾸면 이제 같은
     타임라인을 `timeline.play(0)`으로 다시 돌리므로 첫 등장과 속도가
     저절로 같습니다. */

  /* pin이 시작되는 지점. 프레임(920px)이 화면 한가운데에 놓인 순간 고정됩니다.
     화면(1080px)보다 작으므로 위아래에 여백이 남아 어느 카드도 잘리지 않습니다. */
  var ARCHIVE_START = "center center";

  var ARCHIVE_DEFAULT_YEAR = "2021";

  /* =========================================================
     as worn 조절값
     ========================================================= */

  /* 띠가 왼쪽으로 흐르는 속도(px/초). 올리면 빨라집니다. */
  var ASWORN_SPEED = 42;

  /* 태그를 눌렀을 때 그 카드가 가운데로 오기까지의 시간(초). */
  var ASWORN_FOCUS_DURATION = 1.1;

  /* 가운데에 도착한 뒤 멈춰 있는 시간(초). 이 시간이 지나면 다시 흐릅니다. */
  var ASWORN_HOLD = 2.4;

  /* 1920 프레임 안에서 카드가 놓이는 자리. 연도마다 완전히 다른 배치를 씁니다.
     격자나 대각선 같은 규칙을 두지 않고 손으로 흩어 놓은 값입니다.

     - left / top / width: px. 높이는 사진 원본 비율을 따르므로 적지 않습니다.
     - tilt: deg. layer: z-index로, 1~5를 순서 없이 섞어 겹침이 예측되지 않게 합니다.
     - travel: 출발 거리 배수. ARCHIVE_ENTER_DISTANCE에 곱합니다.

     지킬 것 세 가지입니다.
     1. 왼쪽 sticky 글 영역이 x 120~470을 쓰므로 left는 500 이상이어야 합니다.
     2. 오른쪽 끝은 1780 이하, 아래 끝은 프레임 높이(920) 이하여야 합니다.
        벗어나면 .archive의 overflow: clip에 잘립니다.
     3. 다섯 장이 데스크톱 한 화면에 다 보여야 합니다. 프레임 높이가 브라우저 화면
        높이(1920 × 1080에서 900~950px)에 맞춰 잡혀 있으므로 아래 끝을 830 근처로 둡니다.
        폭을 키우면 높이도 원본 비율만큼 따라 커진다는 점에 주의하세요
        (세로 사진은 높이 = 폭 × 1.5, 가로 사진은 폭 × 0.67).

     2021 배치는 CSS의 .archive_photo_1 ~ _5 기본값과 같은 값입니다(JS 없이 열었을 때의 화면). */
  var ARCHIVE_LAYOUTS = {
    "2021": [
      { left: 530, top: 90, width: 330, tilt: -4.5, layer: 2, travel: 1.15 },
      { left: 800, top: 40, width: 240, tilt: 6.2, layer: 5, travel: 0.8 },
      { left: 1000, top: 150, width: 480, tilt: -2.1, layer: 1, travel: 1.45 },
      { left: 800, top: 400, width: 300, tilt: 3.4, layer: 4, travel: 0.95 },
      { left: 1380, top: 400, width: 260, tilt: -7.8, layer: 3, travel: 1.3 }
    ],
    "2020": [
      { left: 1300, top: 60, width: 250, tilt: 5.6, layer: 3, travel: 0.9 },
      { left: 560, top: 130, width: 340, tilt: -3.1, layer: 1, travel: 1.4 },
      { left: 1150, top: 330, width: 200, tilt: 8.4, layer: 5, travel: 1.05 },
      { left: 830, top: 240, width: 390, tilt: -1.8, layer: 2, travel: 1.5 },
      { left: 620, top: 420, width: 270, tilt: 4.2, layer: 4, travel: 0.85 }
    ],
    "2019": [
      { left: 700, top: 50, width: 190, tilt: -6.8, layer: 4, travel: 1.35 },
      { left: 1100, top: 100, width: 300, tilt: 2.4, layer: 2, travel: 1 },
      { left: 540, top: 230, width: 370, tilt: -1.2, layer: 3, travel: 0.85 },
      { left: 860, top: 430, width: 260, tilt: 7.1, layer: 5, travel: 1.5 },
      { left: 1330, top: 330, width: 330, tilt: -4.6, layer: 1, travel: 1.1 }
    ]
  };

  /* 연도별 사진 세트. 배열 순서가 곧 자리(.archive_photo_1 ~ _5) 순서이자
     날아 들어오는 순서이며, 위 ARCHIVE_LAYOUTS의 배열 순서와 짝을 이룹니다.
     width / height는 원본 픽셀 크기입니다. 로딩 전 자리 확보와
     날아오는 방향을 계산할 때의 카드 중심 추정에 씁니다.
     2013 / 2015 / 2017 / 2018은 연결할 사진이 없어 여기에 없습니다. */
  var ARCHIVE_PHOTOS = {
    "2019": [
      {
        src: "asset/archive_2019_1.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a mustard jeogori over a sheer black skirt beside a lantern-lit mirror panel"
      },
      {
        src: "asset/archive_2019_2.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a red jeogori with a grey patterned skirt and a purple silk wrap"
      },
      {
        src: "asset/archive_2019_3.png",
        width: 3262,
        height: 4898,
        alt: "2019 collection — a seated look in a tartan jeogori and a bright pink skirt"
      },
      {
        src: "asset/archive_2019_4.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a camel jeogori over a cobalt skirt with a gold woven hem band"
      },
      {
        src: "asset/archive_2019_5.png",
        width: 3262,
        height: 4898,
        alt: "2019 collection — a black jacket and pink floral skirt in front of a red plum blossom screen"
      }
    ],
    "2020": [
      {
        src: "asset/archive_2020_1.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a red and ivory jeogori with a chartreuse skirt, holding bamboo branches"
      },
      {
        src: "asset/archive_2020_2.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a model waving a rainbow silk banner beside a white swan sculpture"
      },
      {
        src: "asset/archive_2020_3.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a sheer ivory coat over a pink skirt with a white feathered headpiece"
      },
      {
        src: "asset/archive_2020_4.png",
        width: 3704,
        height: 5559,
        alt: "2020 collection — a close view of a yellow silk jacket over an embroidered pale yellow skirt"
      },
      {
        src: "asset/archive_2020_5.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a white embroidered jeogori with a coral skirt and a woven straw hat"
      }
    ],
    /* 2021은 파일 번호 순서가 아닙니다. archive_2021_1이 15장 중 유일한 가로형이라
       폭이 넉넉한 3번 자리(540px)에 두었습니다. 좁은 자리에 넣으면 혼자만 작아 보입니다.
       가로 사진은 같은 폭이어도 높이가 절반이라 너비를 크게 잡아야 균형이 맞습니다. */
    "2021": [
      {
        src: "asset/archive_2021_2.png",
        width: 3266,
        height: 4898,
        alt: "2021 collection — a black floral gown in front of a triptych of red mountain landscapes"
      },
      {
        src: "asset/archive_2021_3.png",
        width: 3347,
        height: 4730,
        alt: "2021 collection — a pink jeogori and chartreuse skirt seated at a carved palace lattice door"
      },
      {
        src: "asset/archive_2021_1.png",
        width: 4898,
        height: 3259,
        alt: "2021 collection — two hanbok looks displayed in a hall beside the Korean flag"
      },
      {
        src: "asset/archive_2021_4.png",
        width: 3347,
        height: 4730,
        alt: "2021 collection — a white robed look with a wide brimmed hat walking toward a palace hall"
      },
      {
        src: "asset/archive_2021_5.png",
        width: 3347,
        height: 4730,
        alt: "2021 collection — a pink hanbok on the stone steps of a palace pavilion"
      }
    ]
  };

  /* =========================================================
     공통 — 데스크톱 게이트와 창 크기 변화
     ========================================================= */

  /* 두 인터랙션 모두 이 조건에서만 켜집니다. 어긋나면 gsap.matchMedia()가
     설정한 값을 알아서 되돌려 CSS 레이아웃 그대로 보입니다.
     CSS의 반응형 블록 경계(1279 / 1280)와 정확히 맞물립니다. */
  var DESKTOP_MOTION = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";

  /* 1279px 이하에서 쓰는 인터랙션 조건입니다.
     이 폭에서는 showcase 프레임이 흐름 배치라 pin·scrub이 성립하지 않습니다
     (붙잡아 둘 1920 캔버스가 없습니다). 그래서 인터랙션을 없애는 대신
     같은 요소에 훨씬 가벼운 "떠오르며 나타나기"를 겁니다. */
  var MOBILE_MOTION = "(max-width: 1279px) and (prefers-reduced-motion: no-preference)";

  /* 모바일 등장 연출. 데스크톱(RISE_BASE 110)보다 짧게 잡습니다 —
     화면이 작아 이동 거리가 크면 스크롤 중에 떨려 보입니다. */
  var MOBILE_RISE = 42;
  var MOBILE_REVEAL_DURATION = 0.75;
  var MOBILE_REVEAL_STAGGER = 0.09;

  /* =========================================================
     archive 카드 덱 조절값 (1279px 이하)
     ========================================================= */

  /* 뒤로 한 장 갈 때마다 위로 올라가는 거리(px)와 줄어드는 비율,
     그리고 흐려지는 정도입니다.

     ★ 예전 값(46 / 0.075 / 0.24)은 뒤 카드가 거의 보이지 않았습니다
     (사용자 지적: "카드가 쌓이면 안 보여"). 세 가지를 함께 고쳤습니다.
     1. 위로 더 많이 올려 위쪽이 더 드러나게(46 → 56)
     2. 덜 흐려지게(0.24 → 0.15) — 세 장 뒤도 0.55는 남습니다
     3. 카드 자체를 짧게(css의 --archive_card_h) — 같은 56px이라도
        카드가 짧으면 드러나는 비율이 커집니다 */
  var DECK_STEP_Y = 48;
  /* 0.06이면 1024에서 뒤 카드가 좌우로 11 / 21px씩 들어가 위로 삐져나온
     부분이 가느다란 띠 두 줄로 보였습니다 — "겹친 종이"가 아니라 흐린
     이중선으로 읽혔습니다. 0.038이면 들어가는 폭이 7 / 14px이라 뒤 장이
     앞 장과 거의 같은 폭으로 보여 더미로 읽힙니다.
     ★ 이 값은 1279 이하 전용입니다 — --archive_deck_scale을 쓰는 CSS가
     전부 그 구간 안에 있습니다(데스크톱은 시안 좌표 그대로입니다). */
  var DECK_STEP_SCALE = 0.038;
  /* ★ 0입니다. 레퍼런스의 뒤 카드는 흐려지지 않고 그대로 보입니다 —
     반투명하면 앞뒤 사진이 서로 비쳐 지저분해집니다(실제로 그렇게 보였습니다).
     깊이는 크기 차이와 그림자로만 만듭니다. */
  var DECK_STEP_FADE = 0;

  /* 뒤에 몇 장까지 보일지. 이보다 뒤는 맨 뒤 카드와 같은 자리에 숨습니다.
     레퍼런스도 앞 카드 + 뒤 두 장까지만 보입니다. */
  var DECK_VISIBLE_DEPTH = 2;

  /* 이만큼(px) 위로 밀면 다음 장으로 넘어갑니다. */
  var DECK_SWIPE_THRESHOLD = 56;

  /* 요소 윗변이 화면의 이 지점에 닿으면 시작합니다.
     88%는 "화면에 막 들어온 직후"라, 다 뜬 모습을 충분히 읽을 수 있습니다. */
  var MOBILE_REVEAL_START = "top 88%";

  /* 모바일의 주소창 높이 변화 등에만 적용하는 재계산 여유입니다.
     데스크톱의 폭과 높이는 1px 변화도 새 scale과 pin 계산에 반영합니다. */
  var REBUILD_TOLERANCE = 40;
  var REBUILD_DELAY = 200;

  /* 카드가 멈추는 위치와 이동 거리는 창 높이에서 나옵니다. 그런데 그 값은
     타임라인의 길이까지 정하기 때문에 함수형 값이나 invalidateOnRefresh로는
     따라잡을 수 없습니다(길이는 함수로 줄 수 없습니다).
     그래서 창이 실제로 달라졌을 때 matchMedia를 통째로 새로 만듭니다. */
  /* 두 pin을 한 context에 등록해 이전 spacer를 모두 걷은 뒤 문서 순서로
     다시 만듭니다. 개별 resize 타이머는 다른 섹션의 옛 spacer를 재게 됩니다. */
  var responsiveBuilders = [];
  var responsiveGsap = null;

  function getCollectionCanvasScale() {
    if (window.innerWidth < 1280) {
      return 1;
    }

    return (document.documentElement.clientWidth || window.innerWidth) / CANVAS_WIDTH;
  }

  function syncCollectionCanvasScale() {
    document.documentElement.style.setProperty(
      "--collection_canvas_scale",
      String(getCollectionCanvasScale())
    );
  }

  function createRebuilder(gsap, build) {
    responsiveGsap = gsap;
    responsiveBuilders.push(build);
  }

  function initResponsiveAnimations() {
    var context = null;
    var boundary = window.matchMedia("(min-width: 1280px)");
    var isDesktop = boundary.matches;
    var height = window.innerHeight;
    var width = window.innerWidth;
    var canvasWidth = document.documentElement.clientWidth;
    var timer = null;
    var refreshFrame = null;
    var pendingPinState = null;
    var resizePinState = null;
    var hasResizeSnapshot = false;

    function activePinState() {
      if (!window.ScrollTrigger) {
        return null;
      }

      var triggers = window.ScrollTrigger.getAll();

      for (var index = 0; index < triggers.length; index += 1) {
        var trigger = triggers[index];
        var section = trigger.trigger;

        if (trigger.pin && trigger.isActive && section &&
          (section.classList.contains("showcase") || section.classList.contains("archive"))) {
          return { section: section, progress: trigger.progress };
        }
      }

      return null;
    }

    function refresh(pinState) {
      if (refreshFrame !== null) {
        window.cancelAnimationFrame(refreshFrame);
      }

      pendingPinState = pinState;
      refreshFrame = window.requestAnimationFrame(function () {
        refreshFrame = null;

        if (!window.ScrollTrigger) {
          pendingPinState = null;
          return;
        }

        /* scale과 두 spacer가 모두 확정된 다음 viewport 좌표로 다시 잽니다. */
        window.ScrollTrigger.refresh();

        var lenis = window.tchaikimmLenis;

        if (lenis && typeof lenis.resize === "function") {
          lenis.resize();
        }

        /* pin 중 데스크톱 폭만 바꾼 경우 같은 장면을 유지합니다.
           모바일 경계를 넘을 때는 새 흐름 배치에 스크롤을 강제로 맞추지 않습니다. */
        if (pendingPinState && boundary.matches) {
          var triggers = window.ScrollTrigger.getAll();

          for (var index = 0; index < triggers.length; index += 1) {
            var trigger = triggers[index];

            if (trigger.pin && trigger.trigger === pendingPinState.section) {
              var target = trigger.start +
                (trigger.end - trigger.start) * pendingPinState.progress;

              if (lenis && !lenis.isStopped && typeof lenis.scrollTo === "function") {
                lenis.scrollTo(target, { immediate: true });
              } else {
                window.scrollTo(0, target);
              }

              window.ScrollTrigger.update();
              break;
            }
          }
        }

        pendingPinState = null;
      });
    }

    function apply() {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }

      if (refreshFrame !== null) {
        window.cancelAnimationFrame(refreshFrame);
        refreshFrame = null;
      }

      var nextIsDesktop = boundary.matches;
      var pinState = isDesktop && nextIsDesktop
        ? (hasResizeSnapshot ? resizePinState : pendingPinState || activePinState())
        : null;

      resizePinState = null;
      hasResizeSnapshot = false;

      if (context) {
        context.revert();
        context = null;
      }

      syncCollectionCanvasScale();
      height = window.innerHeight;
      width = window.innerWidth;
      canvasWidth = document.documentElement.clientWidth;
      isDesktop = nextIsDesktop;

      if (responsiveGsap && responsiveBuilders.length) {
        context = responsiveGsap.matchMedia();
        context.add(DESKTOP_MOTION, function () {
          var cleanups = responsiveBuilders.map(function (build) {
            return build();
          });

          return function () {
            cleanups.reverse().forEach(function (cleanup) {
              if (typeof cleanup === "function") {
                cleanup();
              }
            });
          };
        });
      }

      refresh(pinState);
    }

    function handleResize() {
      if (boundary.matches !== isDesktop) {
        apply();
        return;
      }

      /* ScrollTrigger의 자동 refresh가 200ms 재빌드보다 먼저 실행될 수 있습니다.
         resize 묶음의 첫 이벤트에서 기존 장면을 저장하고 마지막 재빌드까지 유지합니다. */
      if (isDesktop && !hasResizeSnapshot &&
        (window.innerWidth !== width || window.innerHeight !== height ||
          document.documentElement.clientWidth !== canvasWidth)) {
        resizePinState = pendingPinState || activePinState();
        hasResizeSnapshot = true;
      }

      if (timer !== null) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(function () {
        timer = null;

        var widthChange = Math.abs(window.innerWidth - width);
        var heightChange = Math.abs(window.innerHeight - height);
        var hasCanvasChange = document.documentElement.clientWidth !== canvasWidth;

        /* desktop scale은 1px 폭 변화에도 달라집니다. 40px 여유는 주소창 등
           모바일의 작은 높이 변화에만 적용합니다. */
        if (isDesktop
          ? widthChange === 0 && heightChange === 0 && !hasCanvasChange
          : widthChange < REBUILD_TOLERANCE && heightChange < REBUILD_TOLERANCE) {
          resizePinState = null;
          hasResizeSnapshot = false;
          return;
        }

        apply();
      }, REBUILD_DELAY);
    }

    function handleBoundary() {
      if (boundary.matches !== isDesktop) {
        apply();
      }
    }

    if (boundary.addEventListener) {
      boundary.addEventListener("change", handleBoundary);
    } else if (boundary.addListener) {
      boundary.addListener(handleBoundary);
    }

    apply();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
  }

  /* hero 영상은 시안에 재생 컨트롤이 없습니다.
     모션 감소 설정에서는 자동 재생 대신 첫 화면에서 멈춰 있게 합니다. */
  function initHeroVideo() {
    var video = document.getElementById("collection_hero_video");

    if (!video) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.removeAttribute("autoplay");
      video.autoplay = false;
      video.pause();
    }
  }

  /* "You Won't / Find This in / Ordinary Fashion" 세 줄을 단어 단위 span으로 나눕니다.
     stagger는 요소 단위로만 걸리기 때문입니다.

     단어 span을 .showcase_quote_line에 바로 넣으면 안 됩니다.
     그 줄은 flex 컨테이너라서 flex item 사이의 공백 전용 텍스트 노드가 규격상 무시되고
     "YouWon't"처럼 단어가 붙어 버립니다. 그래서 inline 래퍼 한 겹을 두고
     그 안에서 일반 inline 흐름으로 단어와 공백을 배치합니다. */
  function splitQuoteWords() {
    var lines = Array.prototype.slice.call(
      document.querySelectorAll(".showcase_quote_line")
    );
    var words = [];

    lines.forEach(function (line) {
      var text = line.textContent.trim();

      if (!text) {
        return;
      }

      var wrap = document.createElement("span");
      wrap.className = "showcase_quote_text";

      text.split(/\s+/).forEach(function (word, index) {
        if (index > 0) {
          wrap.appendChild(document.createTextNode(" "));
        }

        var span = document.createElement("span");
        span.className = "showcase_quote_word";
        span.textContent = word;
        wrap.appendChild(span);
        words.push(span);
      });

      line.textContent = "";
      line.appendChild(wrap);
    });

    return words;
  }

  /* filter는 함수 종류와 순서가 처음부터 끝까지 같아야 보간됩니다.
     그래서 blur와 brightness를 항상 이 순서로 함께 씁니다. */
  function filterOf(blur, brightness) {
    return "blur(" + blur + "px) brightness(" + brightness + ")";
  }

  /* --- 1박자: 좌우 카드 등장 ---

     ★ 이 박자만 pin 구간 밖, 섹션이 화면으로 올라오는 평범한 스크롤 구간에서
     재생됩니다. pin 안에 두면 화면이 멈춘 상태에서 카드가 들어와
     "스크롤이 뚝 멈추고 카드가 나타나는" 느낌이 납니다(사용자 지적).

     여기서는 섹션 윗변이 화면 아래에서 화면 위까지 올라오는 동안(화면 한 장 분량)
     두 장이 좌우 바깥에서 시안 자리로 날아 들어옵니다. 그 구간의 스크롤 속도는
     평소와 똑같은 1배이고, 카드가 다 앉는 순간이 곧 pin이 시작되는 지점입니다.

     프레임은 이 구간 내내 offset 0이라 카드가 시안 좌표(247 / 315) 그대로 앉습니다. */
  function buildIntroEntrance(gsap, showcase, cards) {
    var cardA = cards[0];
    var cardB = cards[1];
    var imageA = cardA.querySelector("img");
    var imageB = cardB.querySelector("img");

    /* 원근은 각 img 자신에게 겁니다. 부모에 CSS perspective를 두면
       showcase_frame의 다른 사진들까지 3D 맥락에 들어갑니다. */
    gsap.set([imageA, imageB], { transformPerspective: PERSPECTIVE });

    var timeline = gsap.timeline();

    timeline
      .fromTo(
        cardA,
        {
          x: -ENTER_OFFSET,
          y: 70,
          scale: 0.72,
          opacity: 0,
          filter: filterOf(12, 1.3)
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          filter: filterOf(0, 1),
          ease: "power3.out",
          duration: 1
        },
        0
      )
      .fromTo(
        imageA,
        { rotationY: ENTER_TURN, rotation: TILT_A * ENTER_TILT_RATIO },
        { rotationY: 0, rotation: TILT_A, ease: "power3.out", duration: 1 },
        0
      )
      /* B는 살짝 늦게 들어와 두 장이 엇갈리는 리듬을 만듭니다. */
      .fromTo(
        cardB,
        {
          x: ENTER_OFFSET,
          y: 70,
          scale: 0.72,
          opacity: 0,
          filter: filterOf(12, 1.3)
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          filter: filterOf(0, 1),
          ease: "power3.out",
          duration: 1
        },
        CARD_B_DELAY
      )
      .fromTo(
        imageB,
        { rotationY: -ENTER_TURN, rotation: TILT_B * ENTER_TILT_RATIO },
        { rotationY: 0, rotation: TILT_B, ease: "power3.out", duration: 1 },
        CARD_B_DELAY
      );

    window.ScrollTrigger.create({
      animation: timeline,
      trigger: showcase,
      start: INTRO_ENTER_START,
      /* pin이 시작되는 바로 그 지점에서 끝납니다. 두 구간이 빈틈 없이 이어집니다. */
      end: "top top",
      scrub: 1,
      invalidateOnRefresh: true
    });
  }

  /* --- 2박자: 문장 ---
     pin 안에서 프레임이 흐르는 동안 함께 재생됩니다.

     `to`가 아니라 `fromTo`입니다. 등장이 다른 트리거에 있어서, `to`로 두면
     시작값을 언제 기록하느냐에 따라(빠르게 스크롤하거나 refresh가 겹치면)
     등장 도중의 값이 시작값으로 굳을 수 있습니다. */
  function addIntroBody(gsap, timeline, cards, words) {
    timeline
      /* --- 2박자: 단어가 하나씩 --- */
      .fromTo(
        words,
        { y: WORD_SLIDE, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power3.out",
          duration: WORD_DURATION,
          stagger: WORD_STAGGER
        },
        WORDS_START
      );

    /* --- 3박자였던 "중앙으로 모이며 물러남"은 없앴습니다 ---

       사용자 결정: "없어지지 않고 글자가 나타나는 그 멈춘 지점에서 끝까지 멈춰줘."
       "이 자리에 고정되어 있어야 하고 스크롤을 내리면 같이 화면에서 사라져야 해."

       그래서 등장이 끝난 뒤로는 **두 장에 아무 트윈도 걸지 않습니다.**
       x 0 · y 0 · scale 1 · opacity 1 · 기울기 TILT_A / TILT_B 그대로 남고,
       .showcase_frame 안에 있으므로 프레임이 흐르는 대로 아치 · 문장 · 갤러리와
       **함께** 올라가 함께 화면 밖으로 나갑니다.

       ★★ 화면 좌표에 붙들어 두는 트윈을 넣으면 안 됩니다(한 번 넣었다가 뺐습니다).
       프레임만 올라가고 카드는 서 있으면 **아치에서 떨어져 나와 허공에 뜹니다**
       — 시안의 "아치 위에 얹힌" 구도가 깨집니다. 1920에서 붙드는 동안 아치가
       624px이나 올라갑니다. "고정"은 화면이 아니라 이 구도 기준입니다. */
  }

  /* 카드가 "다 뜬 순간" 프레임이 놓여 있어야 할 위치입니다(프레임 상단 기준 px).
     프레임은 멈추지 않고 계속 올라가므로, 이 값은 멈추는 자리가 아니라
     등장이 끝나는 시점을 정하는 기준입니다.

     기본값은 카드 중심이 화면 중심에 오는 지점이고, 거기에 두 가지를 겁니다.
     1. 앞 카드보다 최소 GALLERY_MIN_GAP만큼 뒤 — 한 장씩 차례로 뜨게 합니다.
     2. 그 지점에서 카드의 위끝과 아래끝이 모두 화면 안 — [아래끝 − 화면높이, 위끝]
        범위를 벗어나면 다 뜬 순간에 잘립니다. 이 범위가 위쪽 잘림을 막는 안전장치입니다. */
  function galleryRestOffsets(cards, viewHeight, travel) {
    var previous = 0;

    return cards.map(function (card) {
      var top = card.offsetTop;
      var bottom = top + card.offsetHeight;
      var rest = top + card.offsetHeight / 2 - viewHeight / 2;

      rest = Math.max(rest, previous + GALLERY_MIN_GAP);
      /* 화면 안에 들어오는 범위로 자릅니다. 카드가 화면보다 크면 위끝을 우선합니다
         (아래가 조금 넘치는 것보다 위가 잘리는 쪽이 눈에 띕니다). */
      rest = Math.min(rest, top);
      rest = Math.max(rest, Math.min(bottom - viewHeight, top));
      rest = Math.min(Math.max(rest, 0), travel);

      /* 위 자르기가 순서를 뒤집을 수 있어 마지막에 다시 단조 증가로 맞춥니다. */
      rest = Math.max(rest, previous);
      previous = rest;
      return rest;
    });
  }

  /* showcase 전체를 하나의 pin 구간으로 만듭니다.

     섹션은 3335px인데 화면은 1080px입니다. 그래서 예전처럼 섹션을 그대로 pin하면
     위 1080px만 보이고 갤러리 다섯 장(프레임 좌표 y 1250~2808)은 pin이 끝날 때까지
     한 번도 화면에 들어오지 못했습니다. pin이 풀린 뒤에야 등장이 시작되니
     카드가 뜨는 동안 페이지가 계속 흘러 상단이 잘렸습니다.

     여기서는 섹션을 화면 한 장 크기(`is_pinned`)로 줄여 창처럼 쓰고,
     그 안에서 배경과 프레임을 스크롤 진행도에 맞춰 밀어 올립니다.
     이동과 등장을 번갈아 두어, 카드가 뜨는 동안에는 프레임이 1px도 움직이지 않습니다.

     시안 좌표·크기·간격은 하나도 바뀌지 않습니다. 프레임 안의 배치는 그대로이고
     "언제 얼마나 올라가는가"만 스크롤이 정합니다. */
  function buildShowcaseTimeline(gsap, showcase, cards, words) {
    var frame = showcase.querySelector(".showcase_frame");
    var backdrop = showcase.querySelector(".showcase_bg");

    if (!frame) {
      return;
    }

    var gallery = SHOWCASE_GALLERY
      .map(function (selector) {
        return showcase.querySelector(selector);
      })
      .filter(Boolean);

    /* 배경(아치 + 그라디언트)과 프레임은 같은 만큼 움직여야 합니다.
       프레임만 밀면 사진이 그라디언트 위를 미끄러져 시안의 색 배치가 어긋납니다. */
    var stage = [backdrop, frame].filter(Boolean);

    /* class가 섹션을 화면 한 장 크기로 줄입니다. 실제 창 높이는 그 뒤에 재야 맞습니다. */
    showcase.classList.add("is_pinned");

    /* frame과 카드의 offset 값은 1920 시안 좌표입니다. viewport 높이만
       같은 좌표계로 바꿔 이동량과 순차 등장 시점을 계산합니다. */
    var canvasScale = getCollectionCanvasScale();
    var viewHeight = showcase.offsetHeight / canvasScale;
    var travel = Math.max(0, frame.offsetHeight - viewHeight);
    var rests = galleryRestOffsets(gallery, viewHeight, travel);

    /* 좌우 카드 등장은 pin 밖(섹션이 올라오는 평범한 스크롤 구간)에서 끝납니다. */
    buildIntroEntrance(gsap, showcase, cards);

    var timeline = gsap.timeline();

    addIntroBody(gsap, timeline, cards, words);

    /* ★ 프레임은 pin의 첫 픽셀부터 흐릅니다. 예전에는 인트로가 다 끝날 때까지
       기다렸는데(600px), 그 구간 내내 속도가 0이라 "스크롤이 멈췄다"고 느껴졌습니다. */
    var travelStart = 0;
    var travelLength = travel / GALLERY_TRAVEL_SPEED;

    /* ★ 프레임은 트윈 하나로 처음부터 끝까지 일정한 속도로 올라갑니다.
       구간을 나눠 "이동 → 정지 → 이동"으로 만들면 스크롤 대비 속도가
       0과 2.32배 사이를 계단처럼 오가서 뚝뚝 끊겨 보입니다(실제로 그랬습니다).
       ease도 반드시 "none"입니다. 다른 이징을 주면 구간 안에서 속도가 변합니다. */
    if (travel > 1) {
      timeline.fromTo(
        stage,
        { y: 0 },
        { y: -travel, ease: "none", duration: travelLength },
        travelStart
      );
    }

    /* 등장은 그 흐름 위에 얹힙니다. 프레임을 멈추지 않으므로 카드는 올라오는
       도중에 떠오르고, 다 뜨는 순간 rest 위치에 정확히 놓입니다.
       그 순간 카드가 화면 안에 있다는 것은 galleryRestOffsets가 보장합니다. */
    gallery.forEach(function (card, index) {
      var image = card.querySelector("img");

      if (!image) {
        return;
      }

      /* ★ 캡션도 함께 띄웁니다. img만 트윈하면 사진이 오기 전에 설명 글씨만
         허공에 떠 있습니다(아치브 그림자와 같은 종류의 실수입니다). */
      var parts = [image, card.querySelector(".showcase_caption")].filter(Boolean);

      var restAt = travelStart + rests[index] / GALLERY_TRAVEL_SPEED;

      timeline.fromTo(
        parts,
        { y: RISE_BASE + index * RISE_STEP, opacity: 0 },
        { y: 0, opacity: 1, ease: "power3.out", duration: GALLERY_REVEAL },
        Math.max(restAt - GALLERY_REVEAL, 0)
      );
    });

    var cursor = travelStart + travelLength;

    /* 빈 트윈이 곧 "머무는 구간"입니다. scrub은 타임라인 길이를 스크롤 길이에
       비례해 나누므로, 길이를 더한 만큼 화면이 멈춰 있습니다. */
    timeline.to({}, { duration: SHOWCASE_TAIL_HOLD }, cursor);

    window.ScrollTrigger.create({
      animation: timeline,
      trigger: showcase,
      start: "top top",
      end: "+=" + Math.round(timeline.duration() * SHOWCASE_PX_PER_UNIT * canvasScale),
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true
    });

    /* 조건이 어긋나(창을 좁히거나 모션 감소로 바꾸면) matchMedia가 되돌릴 때
       class와 인라인 transform을 함께 지웁니다. 그러면 3335px 원래 레이아웃입니다. */
    return function () {
      showcase.classList.remove("is_pinned");
      gsap.set(stage, { clearProps: "transform" });
    };
  }

  /* =========================================================
     showcase 캐러셀 — <> 버튼으로 사진 넘기기
     ========================================================= */

  /* GSAP을 쓰지 않습니다. 상태가 "몇 번째 장인가" 하나뿐이고 전환은 CSS
     transition으로 충분합니다. 스크롤과도 무관해 ScrollTrigger가 필요 없습니다.
     그래서 모션 감소 설정이나 GSAP 로드 실패와 관계없이 항상 넘길 수 있습니다. */
  function initShowcaseCarousel() {
    var carousel = document.querySelector(".showcase_carousel");

    if (!carousel) {
      return;
    }

    var viewport = carousel.querySelector(".showcase_carousel_viewport");
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".showcase_slide"));
    var previous = carousel.querySelector(".showcase_carousel_prev");
    var next = carousel.querySelector(".showcase_carousel_next");
    var counter = carousel.querySelector(".showcase_counter_current");
    var counterTotal = carousel.querySelector(".showcase_counter_total");
    var status = carousel.querySelector(".showcase_status");

    if (!viewport || slides.length < 2 || !previous || !next) {
      return;
    }

    /* ★ 1279px 이하 전용입니다. 1280px 이상은 시안 좌표 그대로 다섯 장이
       흩어져 배치되고 스크롤로 하나씩 떠오릅니다 — 그 폭에서 is_current가
       남아 있으면 안 됩니다. */
    var narrow = window.matchMedia("(max-width: 1279px)");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var current = 0;
    var frame = null;

    if (counterTotal) {
      counterTotal.textContent = " / " + String(slides.length).padStart(2, "0");
    }

    /* 레일은 슬라이드 폭이 제각각입니다(편집 리듬). 그래서 자리를 계산하지
       않고 실제 offsetLeft 차를 씁니다 — CSS에서 폭·간격을 바꿔도 따라옵니다. */
    function offsetFor(index) {
      return slides[index].offsetLeft - slides[0].offsetLeft;
    }

    function render() {
      slides.forEach(function (slide, index) {
        slide.classList.toggle("is_current", index === current);
      });
      previous.disabled = current === 0;
      next.disabled = current === slides.length - 1;
      previous.setAttribute("aria-disabled", String(previous.disabled));
      next.setAttribute("aria-disabled", String(next.disabled));
      if (counter) {
        counter.textContent = String(current + 1).padStart(2, "0");
      }
      if (status) {
        var caption = slides[current].querySelector("figcaption");
        status.textContent = (current + 1) + " / " + slides.length
          + (caption ? ": " + caption.textContent.trim() : "");
      }
    }

    function readIndex() {
      var nearest = 0;
      var nearestDistance = Infinity;
      slides.forEach(function (slide, index) {
        var distance = Math.abs(offsetFor(index) - viewport.scrollLeft);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = index;
        }
      });
      return nearest;
    }

    /* 끝에서 감지 않습니다 — 레일에는 실제 끝이 있고, 감으면 스크롤 위치와
       상태가 어긋납니다. 대신 양 끝에서 화살표를 비활성으로 둡니다. */
    function goTo(index) {
      current = Math.max(0, Math.min(slides.length - 1, index));
      render();
      viewport.scrollTo({
        left: offsetFor(current),
        behavior: reduced.matches ? "auto" : "smooth"
      });
    }

    function handleScroll() {
      if (frame !== null) {
        return;
      }
      frame = window.requestAnimationFrame(function () {
        frame = null;
        var index = readIndex();
        if (index !== current) {
          current = index;
          render();
        }
      });
    }

    function measureEndSpace() {
      if (!narrow.matches) return;
      var space = Math.max(0, viewport.clientWidth - slides[slides.length - 1].offsetWidth);
      viewport.style.setProperty("--showcase_end_space", space + "px");
    }
    var endObserver = new ResizeObserver(measureEndSpace);

    function syncMode() {
      if (narrow.matches) {
        viewport.tabIndex = 0;
        viewport.setAttribute("aria-label", "Collection images. Use left and right arrow keys.");
        endObserver.observe(viewport);
        endObserver.observe(slides[slides.length - 1]);
        measureEndSpace();
        render();
        return;
      }
      endObserver.disconnect();
      viewport.style.removeProperty("--showcase_end_space");
      viewport.removeAttribute("tabindex");
      viewport.removeAttribute("aria-label");
      slides.forEach(function (slide) {
        slide.classList.remove("is_current");
        slide.removeAttribute("aria-hidden");
      });
    }

    previous.addEventListener("click", function () { goTo(current - 1); });
    next.addEventListener("click", function () { goTo(current + 1); });

    /* 화살표 버튼에 초점이 있을 때 좌우 키로도 넘깁니다(keydown이 여기까지
       올라옵니다). viewport에 tabindex를 주지 않는 이유 — 그 요소는
       데스크톱에서도 살아 있어서 탭 순서가 함께 바뀝니다. */
    carousel.addEventListener("keydown", function (event) {
      var index;
      if (event.key === "ArrowLeft") index = current - 1;
      else if (event.key === "ArrowRight") index = current + 1;
      else if (event.key === "Home") index = 0;
      else if (event.key === "End") index = slides.length - 1;
      else return;
      event.preventDefault();
      goTo(index);
    });

    viewport.addEventListener("scroll", handleScroll, { passive: true });

    if (narrow.addEventListener) {
      narrow.addEventListener("change", syncMode);
    } else if (narrow.addListener) {
      narrow.addListener(syncMode);
    }

    syncMode();
  }

  function initShowcaseScroll() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      return;
    }

    var showcase = document.querySelector(".showcase");
    var cardA = document.querySelector(".showcase_photo_a");
    var cardB = document.querySelector(".showcase_photo_b");

    if (!showcase || !cardA || !cardB) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var words = splitQuoteWords();

    /* 이번 구현은 데스크톱 기준입니다. 1280px 미만과 모션 감소 설정에서는
       인터랙션 없이 CSS 레이아웃 그대로 보입니다. */
    createRebuilder(gsap, function () {
      return buildShowcaseTimeline(gsap, showcase, [cardA, cardB], words);
    });
  }

  /* =========================================================
     archive — 연도 전환과 사진 쌓기
     ========================================================= */

  /* 한 자리에 사진 한 장을 끼웁니다. 표시 폭은 배치표가 정하고,
     높이는 img가 원본 비율대로 결정합니다(width / height 속성). */
  function applyPhoto(figure, photo) {
    var image = figure.querySelector("img");

    if (!image) {
      return;
    }

    image.width = photo.width;
    image.height = photo.height;
    image.alt = photo.alt;
    image.src = photo.src;
  }

  /* 배치는 CSS 커스텀 속성으로만 넘깁니다. 실제로 어떤 속성에 쓰이는지는
     col_chaikim.css의 .archive_photo 한 곳에 있습니다. */
  function applyLayout(figure, layout) {
    figure.style.setProperty("--archive_photo_left", layout.left + "px");
    figure.style.setProperty("--archive_photo_top", layout.top + "px");
    figure.style.setProperty("--archive_photo_width", layout.width + "px");
    figure.style.setProperty("--archive_photo_tilt", layout.tilt + "deg");
    figure.style.setProperty("--archive_photo_layer", layout.layer);
  }

  /* 연도마다 사진 수가 다릅니다(2019·2020은 5장, 2021은 4장).
     남는 자리는 감춥니다. 그러지 않으면 이전 연도의 사진이 그 자리에 그대로 남습니다. */
  /* =========================================================
     사진 무리를 글 오른쪽 영역 가운데에 맞춥니다

     시안 좌표를 그대로 쓰면 무리가 왼쪽으로 쏠립니다 — 2021 기준으로 글 오른쪽 끝
     470에서 첫 사진 530까지 **60px**뿐인데 오른쪽은 **280px**이 빕니다.
     연도마다 무리의 폭과 위치가 달라 한 값으로 밀어 둘 수도 없습니다
     (예: 어떤 해는 오른쪽 끝이 1730까지 갑니다 — 그대로 밀면 화면 밖으로 나갑니다).

     그래서 **연도마다 무리의 bounding box를 재서** 사용 가능한 영역 가운데에 놓습니다.
     사진들의 상대 배치(시안의 흩어진 구도)는 그대로이고 무리 전체만 이동합니다.
     ========================================================= */

  /* 왼쪽 글 기둥의 오른쪽 끝(프레임 기준 px).
     css의 .archive_sticky padding-left(120) + .archive_txt_area width(350)입니다.
     ★ 둘 중 하나를 바꾸면 이 값도 같이 바꿔야 합니다. */
  var ARCHIVE_TEXT_RIGHT = 470;

  /* 글과 사진 사이, 그리고 오른쪽 끝에 두는 여백. 양쪽에 같은 값을 씁니다. */
  var ARCHIVE_PHOTO_GUTTER = 150;

  function centerArchiveLayouts(layouts) {
    var minLeft = Infinity;
    var maxRight = -Infinity;

    layouts.forEach(function (layout) {
      minLeft = Math.min(minLeft, layout.left);
      maxRight = Math.max(maxRight, layout.left + layout.width);
    });

    if (!isFinite(minLeft)) {
      return layouts;
    }

    var areaLeft = ARCHIVE_TEXT_RIGHT + ARCHIVE_PHOTO_GUTTER;
    var areaRight = CANVAS_WIDTH - ARCHIVE_PHOTO_GUTTER;
    /* 무리가 영역보다 넓으면 결과가 음수가 되어 양쪽으로 고르게 넘칩니다 — 그래도 균등합니다. */
    var offset = areaLeft + (areaRight - areaLeft - (maxRight - minLeft)) / 2 - minLeft;

    return layouts.map(function (layout) {
      var moved = {};
      Object.keys(layout).forEach(function (key) {
        moved[key] = layout[key];
      });
      moved.left = Math.round(layout.left + offset);
      return moved;
    });
  }

  function applyYearPhotos(figures, year) {
    var photos = ARCHIVE_PHOTOS[year];
    var layouts = ARCHIVE_LAYOUTS[year];

    figures.forEach(function (figure, index) {
      var isEmpty = !photos[index];

      figure.classList.toggle("is_empty", isEmpty);

      if (isEmpty) {
        return;
      }

      applyPhoto(figure, photos[index]);

      if (layouts[index]) {
        applyLayout(figure, layouts[index]);
      }
    });
  }

  /* 활성 연도 표시. 들여쓰기와 글자 크기는 CSS transition이 처리합니다. */
  function markActiveYear(buttons, year) {
    buttons.forEach(function (button) {
      var item = button.closest(".archive_year_item");
      var isActive = button.getAttribute("data-year") === year;

      if (item) {
        item.classList.toggle("is_active", isActive);
      }

      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  /* 카드가 프레임 중앙의 어느 쪽에 있는지로 출발 방향을 정합니다.
     좌표를 바꾸면 날아오는 방향도 알아서 따라옵니다.
     길이를 1로 맞춘 뒤 거리를 따로 곱해야, 중앙에 가까운 카드도 충분히 멀리서 출발합니다. */
  function enterDirection(layout, frameHeight, imageRatio) {
    var centerX = layout.left + layout.width / 2;
    var centerY = layout.top + (layout.width * imageRatio) / 2;
    var dx = centerX - CANVAS_WIDTH / 2;
    var dy = centerY - frameHeight / 2;
    var length = Math.sqrt(dx * dx + dy * dy);

    /* 정확히 중앙인 카드는 방향이 없습니다. 그때만 아래에서 올라오게 둡니다. */
    if (length < 1) {
      return { x: 0, y: 1 };
    }

    return { x: dx / length, y: dy / length };
  }

  /* 쌓이기 전 상태. 카드마다 방향도 거리도 다릅니다.
     함수형 값이라 매번 그때의 currentLayout을 읽습니다 —
     연도가 바뀌면 timeline.invalidate()가 이 함수들을 다시 부릅니다. */
  function archiveEnterVars(getLayouts, getPhotos, getFrameHeight) {
    function vectorAt(index) {
      var photo = getPhotos()[index];
      var layout = getLayouts()[index];

      /* 그 해에 사진이 없는 자리입니다(2021은 네 장). figure가 감춰져 있어
         화면에는 영향이 없지만, 트윈 대상에는 남아 있으므로 값을 0으로 돌려줍니다. */
      if (!photo || !layout) {
        return { x: 0, y: 0, spin: 0 };
      }

      /* 카드 중심을 알려면 높이가 필요합니다. img의 naturalHeight는 lazy 로딩이라
         첫 계산 시점에 0일 수 있으므로 데이터의 원본 크기로 비율을 냅니다. */
      var unit = enterDirection(layout, getFrameHeight(), photo.height / photo.width);

      return {
        x: unit.x * ARCHIVE_ENTER_DISTANCE * layout.travel,
        y: unit.y * ARCHIVE_ENTER_DISTANCE * layout.travel,
        spin: unit.x * ARCHIVE_ENTER_SPIN
      };
    }

    return {
      x: function (index) {
        return vectorAt(index).x;
      },
      y: function (index) {
        return vectorAt(index).y;
      },
      rotation: function (index) {
        return vectorAt(index).spin;
      },
      scale: ARCHIVE_ENTER_SCALE,
      opacity: 0
    };
  }

  /* showcase 하단 갤러리와 같이 figure는 가만히 두고 안쪽 img만 움직입니다.

     프레임(920px)이 화면(1080px)보다 작아 통째로 pin할 수 있습니다.
     예전에는 pin 없이 `toggleActions: "play"`로 재생했습니다. 그러면 다섯 장이
     1.65초에 걸쳐 날아드는 동안 페이지가 계속 스크롤돼 프레임이 위로 빠져나갔습니다
     (스크롤 15500에서 프레임 top −119px, 첫 장 top −87px로 잘림).
     이제 화면을 고정하고 스크롤 진행도가 곧 등장 진행도입니다 — 역스크롤도 역재생됩니다. */
  function buildArchiveTimeline(gsap, archive, images, enterVars, onImagesReady, canPlay) {
    /* stagger를 건 fromTo는 각 대상의 차례가 와야 from 값을 적용합니다.
       그래서 미리 넣어 두지 않으면 두 번째 사진부터는 트리거 전까지 제자리에 보이다가
       자기 차례에 갑자기 화면 밖으로 튀었다 다시 들어옵니다. */
    gsap.set(images, enterVars);

    /* ★★ `paused: true` — 2026-08-11 사용자 요청으로 **스크롤 연동(scrub)을
       걷어냈습니다.** "스크롤 말고 한번에 차례대로 나오게."

         예전: scrub. 스크롤 진행도가 곧 등장 진행도라, 사진을 다 보려면
               그만큼 스크롤해야 했고 되감으면 다시 사라졌습니다.
         지금: 섹션에 닿으면 타임라인이 **자기 속도로** 한 번 재생됩니다.
               다섯 장이 ARCHIVE_STAGGER 간격으로 차례로 놓입니다.

       ★ `paused`가 없으면 타임라인이 만들어지는 즉시 재생돼, 사용자가 이
       섹션에 닿기도 전에 등장이 끝나 있습니다. */
    var timeline = gsap.timeline({ paused: true });

    timeline
      .fromTo(
        images,
        enterVars,
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          ease: "power3.out",
          duration: ARCHIVE_DURATION,
          stagger: ARCHIVE_STAGGER
        }
      )
      /* hover는 모든 사진이 놓인 뒤 켭니다. 아래 hold까지 기다릴 필요는 없습니다. */
      .call(onImagesReady)
      /* 빈 트윈이 곧 "머무는 구간"입니다. 마지막 장이 도착한 뒤에도 잠시 고정돼
         다섯 장이 다 놓인 화면을 읽을 수 있습니다. */
      .to({}, { duration: ARCHIVE_HOLD });

    /* ★★ pin은 그대로 둡니다(사용자 요청 "사진이 다 뜰 때까지는 고정").
       화면이 붙잡혀 있는 거리를 **타임라인 길이에서 그대로 뽑기** 때문에,
       등장이 끝나기 전에 다음 섹션으로 넘어가지 않습니다 —
       ARCHIVE_DURATION·ARCHIVE_STAGGER·ARCHIVE_HOLD를 바꾸면 고정 거리도
       저절로 따라옵니다.

       ★ `scrub`이 없으므로 `animation:`으로 붙이지 않습니다. 붙이면
       ScrollTrigger가 스크롤 위치로 타임라인을 되돌려 자기 속도로 재생하지
       못합니다. 재생은 아래 onEnter가 시작합니다. */
    window.ScrollTrigger.create({
      trigger: archive,
      start: ARCHIVE_START,
      end: "+=" + Math.round(timeline.duration() * ARCHIVE_PX_PER_UNIT * getCollectionCanvasScale()),
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      /* play()는 "현재 위치에서 이어서"입니다. 그래서 처음 닿았을 때만
         0 → 1로 돌고, 이미 다 놓인 뒤에 다시 들어오면 아무 일도 없습니다
         (되감아 올라가도 사진이 다시 날아가지 않습니다). */
      onEnter: function () {
        if (canPlay()) {
          timeline.play();
        }
      },
      onEnterBack: function () {
        if (canPlay()) {
          timeline.play();
        }
      }
    });

    return timeline;
  }

  /* figure의 전용 변수만 움직여 연도별 기울기와 img 등장 transform을 보존합니다. */
  function createArchiveHover(gsap, archive, figures) {
    var media = window.matchMedia(
      "(min-width: 1280px) and (hover: hover) and (pointer: fine)"
    );
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var states = figures.map(function (figure) {
      return { figure: figure, tween: null, isActive: false };
    });
    var activeState = null;
    var isBlocked = false;
    var isListening = false;
    var foregroundLayer = 20;
    var pointer = null;
    var syncFrame = null;

    archive.classList.add("is_hover_ready");

    function clearState(state) {
      if (state.tween) {
        state.tween.kill();
        state.tween = null;
      }

      state.isActive = false;
      /* 기본 layer는 현재 연도의 --archive_photo_layer에서 다시 읽습니다. */
      state.figure.style.removeProperty("z-index");
      state.figure.style.removeProperty("--archive_hover_y");
      state.figure.style.removeProperty("--archive_hover_scale");
      state.figure.style.removeProperty("will-change");
    }

    function reset() {
      if (syncFrame !== null) {
        window.cancelAnimationFrame(syncFrame);
        syncFrame = null;
      }

      activeState = null;
      foregroundLayer = 20;
      states.forEach(clearState);
    }

    function leave(state) {
      if (!state || !state.isActive) {
        return;
      }

      state.isActive = false;

      if (activeState === state) {
        activeState = null;
      }

      if (state.tween) {
        state.tween.kill();
        state.tween = null;
      }

      if (reducedMotion.matches || !media.matches || isBlocked) {
        clearState(state);
        return;
      }

      state.tween = gsap.to(state.figure, {
        "--archive_hover_y": "0px",
        "--archive_hover_scale": 1,
        duration: 0.48,
        ease: "power3.out",
        onComplete: function () {
          state.tween = null;

          if (!state.isActive) {
            clearState(state);
          }
        }
      });
    }

    function enter(state) {
      if (!media.matches || isBlocked || state.figure.classList.contains("is_empty") ||
        (activeState === state && state.isActive)) {
        return;
      }

      leave(activeState);

      if (state.tween) {
        state.tween.kill();
        state.tween = null;
      }

      activeState = state;
      state.isActive = true;
      /* 복귀 중인 카드와 같은 z-index를 쓰면 DOM 순서가 새 hover를 가립니다. */
      foregroundLayer += 1;
      state.figure.style.zIndex = String(foregroundLayer);

      if (reducedMotion.matches) {
        return;
      }

      state.figure.style.willChange = "transform";

      if (!state.figure.style.getPropertyValue("--archive_hover_scale")) {
        state.figure.style.setProperty("--archive_hover_scale", "1");
        state.figure.style.setProperty("--archive_hover_y", "0px");
      }

      state.tween = gsap.to(state.figure, {
        "--archive_hover_y": "-10px",
        "--archive_hover_scale": 1.055,
        duration: 0.42,
        ease: "power3.out",
        onComplete: function () {
          state.tween = null;
        }
      });
    }

    function rememberPointer(event) {
      if (event.pointerType === "touch") {
        return false;
      }

      pointer = { x: event.clientX, y: event.clientY };
      return true;
    }

    function syncPointer() {
      syncFrame = null;

      if (!media.matches || isBlocked || !pointer) {
        return;
      }

      var target = document.elementFromPoint(pointer.x, pointer.y);
      var figure = target && target.closest(".archive_photo");
      var state = states.filter(function (item) {
        return item.figure === figure;
      })[0];

      if (state && !state.figure.classList.contains("is_empty")) {
        enter(state);
      } else {
        leave(activeState);
      }
    }

    function scheduleSync() {
      if (syncFrame !== null) {
        window.cancelAnimationFrame(syncFrame);
      }

      syncFrame = window.requestAnimationFrame(syncPointer);
    }

    function handlePointerMove(event) {
      rememberPointer(event);
    }

    function handleWindowLeave(event) {
      if (!event.relatedTarget) {
        pointer = null;
        leave(activeState);
      }
    }

    function handleBlur() {
      pointer = null;
      reset();
    }

    states.forEach(function (state) {
      state.handleEnter = function (event) {
        if (rememberPointer(event)) {
          enter(state);
        }
      };
      state.handleLeave = function (event) {
        if (event.pointerType !== "touch") {
          leave(state);
        }
      };
    });

    function handleMediaChange() {
      reset();

      if (media.matches !== isListening) {
        isListening = media.matches;
        var method = isListening ? "addEventListener" : "removeEventListener";

        states.forEach(function (state) {
          state.figure[method]("pointerenter", state.handleEnter);
          state.figure[method]("pointerleave", state.handleLeave);
        });
        document[method]("pointermove", handlePointerMove, true);
        document[method]("pointerout", handleWindowLeave);
        window[method]("blur", handleBlur);
      }

      if (isListening) {
        scheduleSync();
      } else {
        pointer = null;
      }
    }

    [media, reducedMotion].forEach(function (query) {
      if (query.addEventListener) {
        query.addEventListener("change", handleMediaChange);
      } else {
        query.addListener(handleMediaChange);
      }
    });
    handleMediaChange();

    return {
      setBlocked: function (blocked) {
        isBlocked = blocked;
        reset();

        if (!blocked && media.matches) {
          /* 전환 중 움직이지 않은 포인터도 새 사진이 놓인 즉시 반응합니다. */
          scheduleSync();
        }
      }
    };
  }

  function initArchive() {
    var archive = document.querySelector(".archive");

    if (!archive) {
      return;
    }

    var figures = Array.prototype.slice.call(archive.querySelectorAll(".archive_photo"));
    var buttons = Array.prototype.slice.call(archive.querySelectorAll(".archive_year_button"));

    if (figures.length === 0 || buttons.length === 0) {
      return;
    }

    var frame = archive.querySelector(".archive_frame");
    var images = figures.map(function (figure) {
      return figure.querySelector("img");
    });
    var currentYear = ARCHIVE_DEFAULT_YEAR;

    /* ★ 좌표를 여기서 한 번만 다시 씁니다. enterDirection 같은 다른 계산도 같은
       ARCHIVE_LAYOUTS를 읽으므로, 원본을 고쳐 두어야 모두 같은 자리를 봅니다. */
    Object.keys(ARCHIVE_LAYOUTS).forEach(function (year) {
      ARCHIVE_LAYOUTS[year] = centerArchiveLayouts(ARCHIVE_LAYOUTS[year]);
    });

    /* ★★ 첫 화면을 ARCHIVE_DEFAULT_YEAR에 **완전히** 맞춥니다(2026-08-11).

       예전에는 배치(좌표)만 다시 썼습니다. "사진 파일은 HTML에 이미 있다"는
       전제였는데, 그건 HTML에 적힌 사진과 기본 연도가 같을 때만 참입니다.
       기본 연도를 바꾸는 순간 **HTML의 옛 연도 사진이 새 연도 좌표에 놓여**
       사진과 왼쪽 연도 표시가 어긋납니다.

       applyYearPhotos는 사진·좌표·빈 칸(is_empty)을 한 번에 맞추므로
       이제 기본 연도를 바꿔도 HTML을 손댈 필요가 없습니다. */
    applyYearPhotos(figures, currentYear);

    /* 1280px 미만과 모션 감소 설정에서는 타임라인을 만들지 않습니다.
       그때는 이 값이 계속 null이고, 사진은 CSS 레이아웃 그대로 보입니다. */
    var timeline = null;

    /* 연도 전환 때 이전 세트를 지우는 트윈. 연달아 누를 때 앞의 것을 끄려고 들고 있습니다. */
    var fadeTween = null;
    var hoverController = null;

    var enterVars = archiveEnterVars(
      function () {
        return ARCHIVE_LAYOUTS[currentYear];
      },
      function () {
        return ARCHIVE_PHOTOS[currentYear];
      },
      function () {
        return frame ? frame.offsetHeight : 0;
      }
    );

    /* 카드 덱(1279px 이하)이 첫 장으로 돌아가도록 알립니다. */
    function notifyYearChange() {
      archive.dispatchEvent(new CustomEvent("archive_year_change"));
    }

    function handleYearClick(event) {
      var button = event.currentTarget;
      var year = button.getAttribute("data-year");

      if (!year || year === currentYear || !ARCHIVE_PHOTOS[year]) {
        return;
      }

      currentYear = year;
      markActiveYear(buttons, year);

      if (hoverController) {
        hoverController.setBlocked(true);
      }

      if (!timeline) {
        applyYearPhotos(figures, year);
        notifyYearChange();

        if (hoverController) {
          hoverController.setBlocked(false);
        }

        return;
      }

      /* 진행 중인 등장과 fade가 같은 img.opacity를 동시에 쓰지 않게 합니다. */
      timeline.pause();

      /* 이전 세트를 먼저 지웁니다. 사라지는 동안 새 사진이 내려받기를 시작하고,
         타임라인은 opacity 0에서 출발하므로 이어서 다시 날아 들어옵니다.

         여기에 overwrite를 쓰면 안 됩니다. GSAP의 overwrite는 같은 대상의 다른 트윈을
         죽이는데, 그 "다른 트윈"에 타임라인 안의 등장 트윈까지 포함됩니다.
         한 번 죽으면 restart()를 해도 타임라인만 진행할 뿐 사진은 opacity 0에 멈춥니다
         (실제로 이 증상이 났습니다 — progress는 1인데 화면은 빈 채였습니다).
         연달아 누를 때의 중복은 앞의 트윈을 직접 kill해서 막습니다. */
      if (fadeTween) {
        fadeTween.kill();
      }

      fadeTween = window.gsap.to(images, {
        opacity: 0,
        duration: ARCHIVE_SWAP_FADE,
        ease: "power2.in",
        onComplete: function () {
          fadeTween = null;
          applyYearPhotos(figures, year);
          notifyYearChange();
          /* invalidate()가 없으면 from 값이 첫 연도 배치 그대로 굳어 있습니다.
             기록해 둔 시작값을 버려야 위 함수형 값이 새 배치로 다시 계산됩니다. */
          timeline.invalidate();

          /* ★ 스크롤에 묶이지 않은 평범한 타임라인이라 그냥 처음부터 다시
             돌리면 됩니다. (scrub이던 시절에는 값이 스크롤 위치에 묶여 있어
             restart()가 듣지 않아, 같은 값을 한 번 재생하는 트윈을 따로
             만들어야 했습니다 — 이제 필요 없습니다.) */
          timeline.play(0);
        }
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", handleYearClick);
    });

    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    createRebuilder(gsap, function () {
      hoverController.setBlocked(true);
      timeline = buildArchiveTimeline(gsap, archive, images, enterVars, function () {
        if (!fadeTween) {
          hoverController.setBlocked(false);
        }
      }, function () {
        /* 연도 fade 중 pin에 다시 진입해도 이전 등장 타임라인은 재생하지 않습니다. */
        return !fadeTween;
      });

      return function () {
        timeline = null;
        hoverController.setBlocked(false);

        /* 연도 전환 fade와 다시보기는 이 context 밖에서 만들어져 자동 복구 대상이
           아닙니다. 전환 도중 조건이 어긋나도 사진이 숨은 채 남지 않도록 직접 끕니다. */
        if (fadeTween) {
          fadeTween.kill();
          fadeTween = null;
          /* 클릭 직후 resize/모션 설정이 바뀌어도 선택 연도와 사진을 맞춥니다. */
          applyYearPhotos(figures, currentYear);
          notifyYearChange();
        }

        gsap.set(images, { clearProps: "all" });
      };
    });

    hoverController = createArchiveHover(gsap, archive, figures);
  }

  /* =========================================================
     archive 카드 덱 — 위로 밀어 넘기기 (1279px 이하)
     ========================================================= */

  /* GSAP을 쓰지 않습니다. 상태가 "몇 번째 장인가" 하나뿐이고 자리 이동은
     CSS 커스텀 속성 + transition으로 충분합니다. 스크롤과도 무관해
     모션 감소 설정이나 GSAP 로드 실패와 관계없이 항상 넘길 수 있습니다.

     데스크톱에서는 다섯 장이 시안 좌표에 흩어져 있어 덱이 아닙니다.
     그래서 커스텀 속성을 쓰되, 그 속성을 읽는 CSS 규칙이 반응형 블록 안에만
     있습니다 — 데스크톱에서는 아무 영향이 없습니다. */
  function initArchiveDeck() {
    var archive = document.querySelector(".archive");
    var deck = archive && archive.querySelector(".archive_deck");

    if (!deck) {
      return;
    }

    var indexLabel = deck.querySelector(".archive_deck_index");
    var totalLabel = deck.querySelector(".archive_deck_total");
    var current = 0;

    /* 그 해에 사진이 네 장뿐인 경우가 있어(col_chaikim 2021) 매번 다시 셉니다. */
    function activeCards() {
      return Array.prototype.slice
        .call(deck.querySelectorAll(".archive_photo"))
        .filter(function (card) {
          return !card.classList.contains("is_empty");
        });
    }

    function layout() {
      var cards = activeCards();

      if (cards.length === 0) {
        return;
      }

      current = Math.min(current, cards.length - 1);

      cards.forEach(function (card, index) {
        /* 현재 장을 0으로 두고 뒤로 갈수록 depth가 커집니다. 끝까지 가면
           앞쪽으로 감아 "다음 장"이 항상 뒤에서 나옵니다. */
        var depth = (index - current + cards.length) % cards.length;
        var capped = Math.min(depth, DECK_VISIBLE_DEPTH);

        card.style.setProperty("--archive_deck_y", -DECK_STEP_Y * capped + "px");
        card.style.setProperty("--archive_deck_scale", 1 - DECK_STEP_SCALE * capped);
        card.style.setProperty("--archive_deck_opacity",
          Math.max(1 - DECK_STEP_FADE * capped, 0));
        /* 앞 장이 위에 오도록 z를 뒤집습니다. */
        card.style.setProperty("--archive_deck_z", cards.length - depth);

        card.classList.toggle("is_active", depth === 0);
        /* 뒤 장은 읽기 도구에서 뺍니다 — 같은 자리에 겹쳐 있어 순서가 없습니다. */
        if (depth === 0) {
          card.removeAttribute("aria-hidden");
        } else {
          card.setAttribute("aria-hidden", "true");
        }
      });

      if (indexLabel) {
        indexLabel.textContent = String(current + 1);
      }

      if (totalLabel) {
        totalLabel.textContent = "/ " + cards.length;
      }
    }

    function move(step) {
      var cards = activeCards();

      if (cards.length === 0) {
        return;
      }

      current = ((current + step) % cards.length + cards.length) % cards.length;
      layout();
    }

    /* Horizontal gestures leave vertical page scrolling available. The desktop
       pile retains its own hover/scroll behavior and receives no new listeners. */
    var media = window.matchMedia("(max-width: 1279px)");
    var cleanup = null;
    function mountDeck() {
      var abort = new AbortController();
      var signal = abort.signal;
      var startX = null;
      var startY = 0;
      var wheelDistance = 0;
      var lastWheel = 0;
      var link = archive.querySelector(".archive_more");
      var label = link.querySelector(".banner_crosslink_text");
      var originalLabel = label.textContent;
      var originalHref = link.getAttribute("href");
      label.textContent = "Reserve Now";
      link.setAttribute("href", "../bespoke/reservation.html");
      deck.tabIndex = 0;
      deck.setAttribute("role", "group");
      deck.setAttribute("aria-label", "Archive images. Use left and right arrow keys.");
      var counter = deck.querySelector(".archive_deck_counter");
      counter.setAttribute("aria-live", "polite");
      counter.setAttribute("aria-atomic", "true");
      counter.removeAttribute("aria-hidden");
      deck.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        startX = event.clientX; startY = event.clientY;
        deck.setPointerCapture(event.pointerId);
      }, {signal:signal});
      deck.addEventListener("pointerup", function (event) {
        if (startX === null) return;
        var dx = event.clientX - startX;
        var dy = event.clientY - startY;
        startX = null;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= DECK_SWIPE_THRESHOLD) move(dx < 0 ? 1 : -1);
      }, {signal:signal});
      deck.addEventListener("pointercancel", function () { startX = null; }, {signal:signal});
      deck.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
      }, {signal:signal});
      deck.addEventListener("wheel", function (event) {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        event.preventDefault();
        var now = performance.now();
        if (now - lastWheel < 350) return;
        wheelDistance += event.deltaX;
        if (Math.abs(wheelDistance) > 80) {
          move(wheelDistance > 0 ? 1 : -1);
          wheelDistance = 0; lastWheel = now;
        }
      }, {passive:false,signal:signal});
      return function () {
        abort.abort();
        deck.removeAttribute("tabindex"); deck.removeAttribute("role"); deck.removeAttribute("aria-label");
        counter.setAttribute("aria-live", "polite"); counter.removeAttribute("aria-atomic");
        counter.removeAttribute("aria-hidden");
        label.textContent = originalLabel; link.setAttribute("href", originalHref);
      };
    }
    function syncDeck() { if (cleanup) cleanup(); cleanup = media.matches ? mountDeck() : null; }
    media.addEventListener("change", syncDeck);
    syncDeck();

    /* 연도를 바꾸면 사진 세트가 통째로 갈리므로 첫 장으로 돌아갑니다.
       initArchive가 사진을 다 갈아 끼운 뒤 이 이벤트를 보냅니다. */
    archive.addEventListener("archive_year_change", function () {
      current = 0;
      layout();
    });

    layout();
  }

  /* =========================================================
     as worn — 스스로 흐르는 띠 + 태그로 카드 가운데 두기
     ========================================================= */

  /* 시안의 카드 세 장 폭 합계가 화면보다 넓습니다. 스크롤바 대신 카드가 스스로 흐르게 하고,
     사용자가 원하는 카드는 태그로 불러오게 합니다.

     한 벌(카드 3장 + 뒤따르는 간격 하나)의 폭을 period로 두고, 이동량을 period로 나눈
     나머지만큼 밀어 놓으면 같은 화면이 무한히 반복됩니다. 그래서 화면을 채우고도
     한 벌이 더 남을 만큼 복제해 둡니다. */
  function initAsworn() {
    var track = document.querySelector(".asworn_track");
    var list = track && track.querySelector(".asworn_list");

    if (!list) {
      return;
    }

    var originals = Array.prototype.slice.call(list.children);
    var tags = Array.prototype.slice.call(
      document.querySelectorAll(".asworn_tag[data-asworn-target]")
    );

    if (originals.length === 0) {
      return;
    }

    var gsap = typeof window.gsap === "undefined" ? null : window.gsap;
    var isAutoEnabled = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var offset = 0;
    var period = 0;
    var isHovered = false;
    var isFocusing = false;
    var isDragging = false;
    /* 끌기 시작한 지점과 그때의 offset. 이동량은 이 둘로만 냅니다 —
       pointermove마다 누적하면 이벤트가 몇 개 밀릴 때 값이 흘러갑니다. */
    var dragStartX = 0;
    var dragStartOffset = 0;
    /* 몇 px 넘게 끌었으면 그때의 click은 취소합니다(끌고 놓았는데 링크가 열리는 것 방지). */
    var dragDistance = 0;
    var focusTween = null;
    var holdTimer = 0;

    /* 복제본은 화면을 채우기 위한 것이므로 보조기술과 탭 순서에서 뺍니다.
       빼지 않으면 같은 "More collection" 링크가 여러 번 잡힙니다. */
    function appendSet() {
      originals.forEach(function (item) {
        var clone = item.cloneNode(true);

        clone.setAttribute("aria-hidden", "true");
        Array.prototype.forEach.call(
          clone.querySelectorAll("a, button"),
          function (node) {
            node.setAttribute("tabindex", "-1");
          }
        );

        list.appendChild(clone);
      });
    }

    /* 화면 폭이 넓어지면 빈자리가 생기므로 그때마다 다시 부릅니다. */
    function fillTrack() {
      var guard = 0;

      while (list.scrollWidth < track.clientWidth + period + 1 && guard < 6) {
        appendSet();
        guard += 1;
      }
    }

    function render() {
      var wrapped = ((offset % period) + period) % period;
      list.style.transform = "translate3d(" + -wrapped + "px, 0, 0)";
    }

    function markActiveTag(activeTag) {
      tags.forEach(function (tag) {
        var isActive = tag === activeTag;

        tag.classList.toggle("is_active", isActive);

        if (isActive) {
          tag.setAttribute("aria-current", "true");
        } else {
          tag.removeAttribute("aria-current");
        }
      });
    }

    function releaseFocus() {
      isFocusing = false;
      markActiveTag(null);
    }

    /* 띠가 순환하므로 같은 카드가 앞뒤 양쪽에 있습니다. 이동 거리를 period로 감아
       ±period/2 안으로 줄이면 가까운 쪽으로 돌아 되감기는 느낌이 없습니다. */
    function distanceTo(item) {
      var goal = item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2;
      var delta = (((goal - offset) % period) + period) % period;

      return delta > period / 2 ? delta - period : delta;
    }

    function handleTagClick(event) {
      var tag = event.currentTarget;
      var index = Number(tag.getAttribute("data-asworn-target"));
      var item = originals[index];

      if (!item) {
        return;
      }

      window.clearTimeout(holdTimer);

      if (focusTween) {
        focusTween.kill();
        focusTween = null;
      }

      isFocusing = true;
      markActiveTag(tag);

      var delta = distanceTo(item);

      /* GSAP이 없거나 모션 감소 설정이면 그 자리로 바로 옮깁니다. */
      if (!gsap || !isAutoEnabled) {
        offset += delta;
        render();
        return;
      }

      var state = { value: offset };

      focusTween = gsap.to(state, {
        value: offset + delta,
        duration: ASWORN_FOCUS_DURATION,
        ease: "power3.out",
        onUpdate: function () {
          offset = state.value;
          render();
        },
        onComplete: function () {
          focusTween = null;
          holdTimer = window.setTimeout(releaseFocus, ASWORN_HOLD * 1000);
        }
      });
    }

    /* 다른 탭에 갔다 오면 프레임 간격이 몇 초씩 벌어집니다.
       그대로 곱하면 띠가 한 번에 몇백 px 튀므로 한 프레임 이동량을 잘라 둡니다. */
    function advance(deltaSeconds) {
      if (isHovered || isFocusing || isDragging) {
        return;
      }

      offset += ASWORN_SPEED * Math.min(deltaSeconds, 0.1);
      render();
    }

    function handleEnter() {
      isHovered = true;
    }

    function handleLeave() {
      isHovered = false;
    }

    /* 한 벌의 폭은 첫 복제본의 왼쪽 좌표와 같습니다(.asworn_list가 position: relative).
       계산 대신 실제 배치를 읽어 두면 카드 폭이나 간격이 바뀌어도 따라옵니다. */
    appendSet();
    period = originals.length < list.children.length
      ? list.children[originals.length].offsetLeft
      : list.scrollWidth;

    if (period <= 0) {
      return;
    }

    fillTrack();
    render();

    tags.forEach(function (tag) {
      tag.addEventListener("click", handleTagClick);
    });

    /* --- 마우스로 잡고 가로로 끌기 ---
       띠의 위치는 offset 하나가 정하므로, 끈 거리를 offset에 그대로 더하면 됩니다.
       render()가 period로 감싸므로 끝까지 끌어도 이어서 순환합니다. */

    /* 이 거리(px)를 넘겨 끌었을 때만 "끌었다"고 봅니다. 손이 살짝 흔들린 정도로
       링크가 안 열리면 안 되고, 반대로 너무 크면 끌었는데 링크가 열립니다. */
    var DRAG_CLICK_THRESHOLD = 6;

    function handleDragStart(event) {
      /* ★ 마우스 왼쪽 버튼만 받습니다.
         터치·펜까지 받으면 포인터를 붙잡는 동안 **세로 페이지 스크롤을 뺏습니다**
         (띠 위에서 위아래로 쓸어도 띠만 옆으로 흐릅니다).
         터치는 브라우저 기본 동작에 맡깁니다. */
      if (event.pointerType !== "mouse" || event.button !== 0) {
        return;
      }

      isDragging = true;
      dragStartX = event.clientX;
      dragStartOffset = offset;
      dragDistance = 0;

      /* 태그 클릭으로 돌던 트윈이 있으면 끕니다 — 두 주인이 offset을 다투면 튑니다. */
      if (focusTween) {
        focusTween.kill();
        focusTween = null;
      }

      window.clearTimeout(holdTimer);
      releaseFocus();

      track.classList.add("is_dragging");
      /* 포인터를 track에 묶어 두면 커서가 밖으로 나가도 move/up이 계속 옵니다. */
      if (track.setPointerCapture) {
        track.setPointerCapture(event.pointerId);
      }
    }

    function handleDragMove(event) {
      if (!isDragging) {
        return;
      }

      var moved = event.clientX - dragStartX;

      dragDistance = Math.max(dragDistance, Math.abs(moved));
      /* 오른쪽으로 끌면 띠가 오른쪽으로 가야 하므로 offset은 반대 부호입니다. */
      offset = dragStartOffset - moved;
      render();
    }

    function handleDragEnd(event) {
      if (!isDragging) {
        return;
      }

      isDragging = false;
      track.classList.remove("is_dragging");

      if (track.releasePointerCapture && track.hasPointerCapture && track.hasPointerCapture(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
      }
    }

    /* ★ capture 단계입니다. 카드 안 링크에 click이 닿기 전에 잡아야 막을 수 있습니다. */
    function handleDragClick(event) {
      if (dragDistance <= DRAG_CLICK_THRESHOLD) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      dragDistance = 0;
    }

    track.classList.add("is_draggable");
    track.addEventListener("pointerdown", handleDragStart);
    track.addEventListener("pointermove", handleDragMove);
    track.addEventListener("pointerup", handleDragEnd);
    track.addEventListener("pointercancel", handleDragEnd);
    track.addEventListener("click", handleDragClick, true);
    /* 사진을 브라우저 기본 이미지 끌기로 가져가는 것을 막습니다. */
    track.addEventListener("dragstart", function (event) {
      event.preventDefault();
    });

    track.addEventListener("mouseenter", handleEnter);
    track.addEventListener("mouseleave", handleLeave);
    /* 키보드로 카드 안 링크에 들어왔을 때도 멈춰 있어야 누를 수 있습니다. */
    track.addEventListener("focusin", handleEnter);
    track.addEventListener("focusout", handleLeave);

    window.addEventListener("resize", function () {
      fillTrack();
      render();
    });

    if (!isAutoEnabled) {
      return;
    }

    /* 흐름은 시간 기준입니다. 프레임이 밀려도 속도가 달라지지 않습니다. */
    if (gsap) {
      gsap.ticker.add(function (time, deltaMs) {
        advance(deltaMs / 1000);
      });
      return;
    }

    var previous = 0;

    window.requestAnimationFrame(function step(now) {
      if (previous) {
        advance((now - previous) / 1000);
      }

      previous = now;
      window.requestAnimationFrame(step);
    });
  }

  initHeroVideo();
  /* 1279px 이하 등장 연출.

     데스크톱과 다른 점 세 가지입니다.
     1. pin도 scrub도 쓰지 않습니다. 좁은 화면에서 스크롤을 붙잡으면
        페이지가 길어 보이고 터치 스크롤과 싸웁니다.
     2. `once: true`라 한 번만 재생합니다. 되돌아올 때 다시 재생하면
        짧은 화면에서 같은 사진이 반복해 깜빡입니다.
     3. figure가 아니라 안쪽 img를 움직입니다. figure에는 CSS가 기울기를
        (archive는 `rotate(var(--archive_photo_tilt) * 0.45)`) 물려 두었는데,
        GSAP이 figure에 인라인 transform을 쓰면 그 기울기가 사라집니다.

     문장 세 줄만 묶어서 stagger로 흘리고, 사진은 각자 자기 트리거를 답니다
     (사진끼리 세로로 멀리 떨어져 있어 한 묶음으로 묶으면 화면 밖에서 다 끝납니다). */
  function buildMobileReveal(gsap) {
    /* ★ 캐러셀 슬라이드는 뺍니다. 슬라이드의 보임/숨김은 캐러셀이 figure의
       opacity와 visibility로 직접 다루는데, 여기서 안쪽 img의 opacity까지
       건드리면 두 주인이 생깁니다. 아직 등장 트윈이 돌지 않은 슬라이드로
       넘기면 사진이 빈 채로 보일 수 있습니다.
       캐러셀은 아래에서 요소 하나로 통째로 띄웁니다. */
    var photos = Array.prototype.slice
      .call(document.querySelectorAll(".showcase_photo:not(.showcase_slide)"))
      .map(function (figure) {
        return figure.querySelector("img");
      })
      .filter(Boolean);

    /* ★ archive는 다섯 장이 겹친 덱이라 한 장씩 떠오르는 연출이 성립하지 않습니다
       (같은 자리에 있어 순서가 보이지 않습니다). 덱 전체를 한 번에 띄우고,
       장을 넘기는 것은 initArchiveDeck의 밀기 조작이 맡습니다. */
    var deck = document.querySelector(".archive_deck");

    if (deck) {
      /* ★ y를 움직이지 않고 opacity만 씁니다.
         GSAP이 y를 쓰면 덱에 인라인 transform이 남는데, transform이 걸린 요소는
         그 안의 절대배치 자식에게 기준 상자가 됩니다. 그러면 카드가 프레임이 아니라
         덱을 기준으로 앉아 화면 크기마다 자리가 틀어집니다.
         이 탭에서는 트윈이 돌지 않아 못 봤지만 실제 기기에서 드러났습니다. */
      gsap.fromTo(
        deck,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "power2.out",
          duration: MOBILE_REVEAL_DURATION,
          scrollTrigger: {
            trigger: deck,
            start: MOBILE_REVEAL_START,
            once: true
          }
        }
      );
    }

    var carousel = document.querySelector(".showcase_carousel");

    if (carousel) {
      gsap.fromTo(
        carousel,
        { y: MOBILE_RISE, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          duration: MOBILE_REVEAL_DURATION,
          scrollTrigger: {
            trigger: carousel,
            start: MOBILE_REVEAL_START,
            once: true
          }
        }
      );
    }

    photos.forEach(function (image) {
      gsap.fromTo(
        image,
        { y: MOBILE_RISE, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          duration: MOBILE_REVEAL_DURATION,
          scrollTrigger: {
            /* 트리거는 움직이지 않는 figure입니다. img를 트리거로 쓰면
               자기 이동분 때문에 시작 지점이 흔들립니다. */
            trigger: image.parentElement,
            start: MOBILE_REVEAL_START,
            once: true
          }
        }
      );
    });

    var lines = Array.prototype.slice.call(document.querySelectorAll(".showcase_quote_line"));

    if (lines.length > 0) {
      gsap.fromTo(
        lines,
        { y: MOBILE_RISE, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          duration: MOBILE_REVEAL_DURATION,
          stagger: MOBILE_REVEAL_STAGGER,
          scrollTrigger: {
            trigger: lines[0].parentElement,
            start: MOBILE_REVEAL_START,
            once: true
          }
        }
      );
    }
  }

  function initMobileReveal() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* 여기는 createRebuilder를 쓰지 않습니다. 값이 창 높이에 기대지 않아
       (타임라인 길이를 화면 크기로 계산하지 않습니다) matchMedia만으로 충분하고,
       resize 리스너를 하나 더 만들 이유가 없습니다.
       폭이 1280을 넘나들면 matchMedia가 알아서 만들고 되돌립니다. */
    gsap.matchMedia().add(MOBILE_MOTION, function () {
      buildMobileReveal(gsap);
    });
  }

  /* =========================================================
     브랜드 전환 탭 — 히어로 하단 overlay

     두 브랜드는 각각 완성된 자매 페이지입니다. 그래서 이 탭은 콘텐츠를
     갈아끼우는 것이 아니라 **페이지를 이동**합니다. 이동만 하면 화면이 뚝 끊기므로
     떠나기 직전에 히어로를 옅게 만들고, 도착한 페이지가 히어로를 띄워
     두 브랜드 영상이 이어지는 것처럼 보이게 합니다.

     ★ 이 블록은 GSAP을 쓰지 않습니다. 위쪽 인터랙션들과 달리 CDN이 막힌
     환경에서도 브랜드 전환은 반드시 동작해야 하기 때문입니다.
     ========================================================= */

  /* 떠날 때 히어로가 옅어지는 시간(ms). css의
     `.collection_hero_video { transition: opacity 0.42s }`와 한 쌍입니다.
     ★ 한쪽만 고치면 안 됩니다 — 여기가 짧으면 페이드가 끝나기 전에 페이지가 바뀌고,
     길면 다 사라진 빈 화면을 그만큼 보고 있게 됩니다. */
  var BRAND_LEAVE_MS = 420;

  /* "브랜드를 바꿔서 왔다"는 표시. 도착한 페이지가 이걸 보고 히어로를 띄웁니다.
     주소로 들어오거나 새로고침한 경우에는 없으므로 그냥 보통 화면이 됩니다. */
  var BRAND_SWITCH_KEY = "collection_brand_switch";

  function initBrandTabs() {
    var tabs = document.querySelector(".brand_tabs");
    var hero = document.querySelector(".collection_hero");

    if (!tabs || !hero) {
      return;
    }

    var indicator = tabs.querySelector(".brand_tab_indicator");
    var list = tabs.querySelector(".brand_tab_list");
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function activeLink() {
      return tabs.querySelector(".brand_tab_item.is_active .brand_tab_link");
    }

    /* 밑줄을 그 탭 자리로 옮깁니다. 좌표를 css에 적어 두지 않고 매번 재는 이유는
       글자 폭이 폰트 로딩·화면 폭·자간에 따라 달라지기 때문입니다. */
    function moveIndicator(link) {
      if (!indicator || !link) {
        return;
      }

      var tabsRect = tabs.getBoundingClientRect();
      var linkRect = link.getBoundingClientRect();

      indicator.style.width = linkRect.width + "px";
      indicator.style.transform = "translateX(" + (linkRect.left - tabsRect.left) + "px)";
    }

    function handleResize() {
      moveIndicator(activeLink());
    }

    function goToBrand(link) {
      try {
        window.sessionStorage.setItem(BRAND_SWITCH_KEY, "1");
      } catch (error) {
        /* 시크릿 모드 등에서 막히면 페이드인만 생략됩니다. 이동은 그대로입니다. */
      }

      if (prefersReducedMotion) {
        window.location.href = link.href;
        return;
      }

      /* 밑줄이 먼저 움직이기 시작하고, 그 위로 히어로가 옅어집니다.
         탭 자신은 옅어지지 않습니다 — 그래야 밑줄이 옮겨 가는 게 보입니다. */
      moveIndicator(link);
      hero.classList.add("is_brand_leaving");

      window.setTimeout(function () {
        window.location.href = link.href;
      }, BRAND_LEAVE_MS);
    }

    function handleTabClick(event) {
      var link = event.target.closest ? event.target.closest(".brand_tab_link") : null;

      if (!link) {
        return;
      }

      var item = link.closest(".brand_tab_item");

      /* 지금 보고 있는 브랜드입니다. 같은 페이지를 다시 부르지 않습니다. */
      if (item && item.classList.contains("is_active")) {
        event.preventDefault();
        return;
      }

      /* 새 탭으로 열기(⌘/Ctrl·가운데 버튼 등)는 브라우저에 그대로 맡깁니다. */
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      event.preventDefault();
      goToBrand(link);
    }

    /* 도착 연출. 떠날 때 옅어진 히어로를 이어받아 떠오릅니다. */
    function playEnter() {
      var isSwitched = false;

      try {
        isSwitched = window.sessionStorage.getItem(BRAND_SWITCH_KEY) === "1";
        window.sessionStorage.removeItem(BRAND_SWITCH_KEY);
      } catch (error) {
        return;
      }

      if (!isSwitched || prefersReducedMotion) {
        return;
      }

      hero.classList.add("is_brand_entering");

      function reveal() {
        hero.classList.remove("is_brand_entering");
      }

      /* 두 프레임 뒤에 뗍니다. 같은 프레임에 붙였다 떼면 브라우저가 변경을
         하나로 묶어 버려 opacity 0 → 1이 재생되지 않습니다. */
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(reveal);
      });

      /* ★ 안전망입니다. 이 class는 히어로를 opacity 0으로 만들어 두는 것이라
         떼는 데 실패하면 영상과 제목이 영영 보이지 않습니다.
         백그라운드 탭에서 문서가 열리면 rAF가 멈춰 있어 위 콜백이 오지 않습니다.
         setTimeout은 그 상태에서도 도착하므로 둘 중 먼저 오는 쪽이 걷어냅니다. */
      window.setTimeout(reveal, 120);
    }

    tabs.addEventListener("click", handleTabClick);

    if (indicator) {
      /* 자리를 먼저 잡고 나서 class를 붙입니다. 순서를 바꾸면 밑줄이
         화면 왼쪽 끝(폭 0)에서 미끄러져 들어오는 게 보입니다. */
      moveIndicator(activeLink());
      tabs.classList.add("is_slide_ready");

      /* ★ 한 번만 재면 안 됩니다 — 실제로 겪었습니다.
         스크립트가 도는 시점에는 웹폰트(Montserrat)가 아직 적용되지 않아
         글자 폭이 다르고, 그 값으로 잰 밑줄이 글자와 어긋난 채 남았습니다
         (1280에서 폭 142px / 위치 -8px, 실제로는 180px / 606px이어야 합니다).

         그래서 "탭 줄의 크기가 바뀌면 다시 잰다"로 바꿉니다. ResizeObserver는
         폰트 교체·창 크기 변경·자간 변경을 전부 같은 신호 하나로 잡아 주므로
         원인마다 리스너를 따로 달 필요가 없습니다. */
      if (list && typeof window.ResizeObserver === "function") {
        new window.ResizeObserver(handleResize).observe(list);
      }

      /* ResizeObserver가 없는 환경용 그물입니다. load는 폰트·CSS가 다 적용된 뒤라
         이 시점의 값이면 대체로 맞습니다. */
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(handleResize).catch(function () {});
      }

      window.addEventListener("load", handleResize);
      window.addEventListener("resize", handleResize);
    }

    playEnter();

    /* 뒤로 가기로 bfcache에서 되살아난 문서는 스크립트가 다시 실행되지 않아
       떠날 때 붙인 class가 그대로 남습니다 — 히어로가 사라진 채로 보입니다. */
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        hero.classList.remove("is_brand_leaving");
        hero.classList.remove("is_brand_entering");
      }
    });
  }

  /* =========================================================
     히어로 상자를 영상 원본 비율에 맞춥니다

     상자 비율과 영상 비율이 어긋나면 `object-fit`이 잘라내거나 띠를 만듭니다.
     시안의 1920 × 1182 상자가 영상(1920 × 1080)과 달라서 위아래가 잘리고 있었습니다.

     ★ 비율을 CSS에 적어 두지 않고 **실제 파일에서 읽습니다.** 그래서 영상을
     다른 것으로 바꿔도(세로 영상이라도) 손댈 곳이 없습니다.
     ========================================================= */

  function initHeroFit() {
    var hero = document.querySelector(".collection_hero");
    var video = document.querySelector(".collection_hero_video");

    if (!hero || !video) {
      return;
    }

    function applyHeroRatio() {
      var width = video.videoWidth;
      var height = video.videoHeight;

      /* 메타데이터가 아직 없으면 두 값이 0입니다. 이때는 손대지 않고
         css 기본값(16/9)을 그대로 씁니다 — 0으로 나눠 상자를 무너뜨리지 않습니다. */
      if (!width || !height) {
        return;
      }

      hero.style.setProperty("--collection_hero_ratio", (width / height).toFixed(4));
    }

    applyHeroRatio();

    /* loadedmetadata는 영상 파일이 바뀔 때마다(src 교체 · 다른 페이지) 다시 옵니다.
       그래서 나중에 영상을 갈아 끼워도 비율이 자동으로 따라갑니다. */
    video.addEventListener("loadedmetadata", applyHeroRatio);
    video.addEventListener("loadeddata", applyHeroRatio);
  }

  /* =========================================================
     히어로 글자 색을 영상 밝기에 맞춥니다

     제목과 브랜드 탭이 영상 위에 얹혀 있어서, 그 자리에 밝은 장면이 지나가면
     크림색 글씨가, 어두운 장면이 지나가면 검은 글씨가 묻힙니다.
     영상 프레임을 실제로 읽어 그 자리의 밝기로 색을 고릅니다.

     ★ 배경색을 읽는 방식(common.js의 헤더 판정)을 여기서는 쓸 수 없습니다.
     그 방식은 `background-color`를 읽는데 히어로의 배경은 영상이라
     읽을 색 자체가 없습니다. 그래서 캔버스로 프레임을 직접 뜹니다.
     ========================================================= */

  /* 다시 재는 간격(ms). 짧게 잡을수록 장면 변화를 빨리 따라가지만
     그만큼 자주 프레임을 뜹니다. 16 × 16px만 읽으므로 비용은 작습니다. */
  var HERO_CONTRAST_INTERVAL = 400;

  /* 읽어 들일 크기(px). 평균 밝기만 쓰므로 클 이유가 없습니다. */
  var HERO_SAMPLE_SIZE = 16;

  /* ★★ 2026-08-11: **평균 밝기로 고르던 것을 "최악 대비"로 바꿨습니다.**

     예전에는 글자 자리의 평균 밝기를 임계값(0.218)과 비교했습니다. 두 색의
     대비가 같아지는 지점이라 계산 자체는 맞지만, **평균이 그 자리를 대표하지
     못하는 것이 문제였습니다.**

     새 히어로 영상의 제목 자리를 실측하면 **한 순간에 밝기가 0.01 ~ 0.80까지
     걸쳐 있습니다**(런웨이 조명 + 어두운 관객석). 평균은 0.25쯤이라 검은 글씨를
     고르는데, 그 글자가 실제로는 밝은 부분과 어두운 부분에 동시에 얹힙니다 —
     평균 대비는 4.3:1로 멀쩡해 보여도 **최악 대비가 1.09**라 글자의 일부가
     배경에 묻힙니다. "안 보이는 순간"의 정체가 이것입니다.

     그래서 지금은 두 후보색 각각에 대해 **글자 자리 안에서 가장 불리한 곳의
     대비**를 구하고, 그 값이 큰 쪽을 고릅니다. 평균이 아니라 최악을 기준으로
     삼는 것이라 "실제로 텍스트가 놓인 영역의 가독성"에 곧바로 맞물립니다.

     ★ 아래 두 값은 그 "가장 불리한 곳"을 어디로 볼지 정합니다. 0과 1(진짜
     최소·최대)로 두면 픽셀 한 점 때문에 판정이 튀므로 양 끝을 조금 잘라냅니다. */
  var HERO_CONTRAST_LOW_PERCENTILE = 0.1;
  var HERO_CONTRAST_HIGH_PERCENTILE = 0.9;

  /* ★★ 깜빡임 방지. **지금 색보다 이 배수만큼 더 나아야** 바꿉니다.
     (예전에는 밝기 임계값에 ±0.06 여유를 뒀는데, 판정 기준이 밝기가 아니라
     대비 점수로 바뀌었으므로 여유도 점수 기준이 되어야 합니다.)

     ★ 이 값은 실측으로 정했습니다. 영상 전 구간을 0.4초 간격 56지점으로 훑어
     두 색의 점수를 모아 두고 배수만 바꿔 가며 돌린 결과입니다:

     | 배수 | 제목 전환 수 | 한 색 최소 유지 | 평균 최악 대비 |
     |---|---|---|---|
     | 1.12 | 6회 | — | 2.27 |
     | 1.25 | 4회 | — | 2.25 |
     | **1.35** | **2회** | **5.2초** | **2.20** |
     | 1.7 | 0회 | 22.4초 | 2.13 |

     1.12로 두면 **0.25초 만에 검정 → 크림 → 검정으로 뒤집히는 구간이 실제로
     있었습니다**(3.5~5.5초). 그 구간은 두 색의 점수가 나란히 1.0~1.4라
     **어느 쪽도 읽히지 않는 장면**이어서, 승자가 잡음으로 뒤바뀝니다.
     1.35면 그 churn이 사라지고 **대비 손실은 0.07뿐**입니다.

     더 올리면(1.7) 아예 안 바뀌어 장면 변화를 못 따라갑니다. */
  var HERO_CONTRAST_SWITCH_MARGIN = 1.35;

  /* ★★ **한 번 정한 색을 최소 이만큼(ms) 유지합니다.**(2026-08-11, 사용자 요청 —
     "너무 자주 바뀐다")

     위 `SWITCH_MARGIN`은 "얼마나 더 나아야 바꾸나"만 봅니다. 그래서 장면이 실제로
     빠르게 오가면 조건을 매번 만족해 **0.4초 간격으로 계속 바뀔 수 있습니다.**
     읽는 사람 입장에서는 글자 색이 안절부절못하는 것으로 보입니다.

     이 값은 **빈도 자체에 상한**을 겁니다 — 아무리 조건이 맞아도 이 시간 안에는
     두 번 바뀌지 않습니다. 둘의 역할이 다릅니다:
     · `SWITCH_MARGIN` = 바꿀 만한 **이유**가 되는가
     · `MIN_HOLD`      = 바꿔도 되는 **때**인가

     ★ 이 값만 올리면 "덜 자주"가 곧바로 됩니다. 3000이면 22초짜리 이 영상에서
     최대 7번까지만 바뀔 수 있습니다(실측은 그보다 훨씬 적습니다).
     ★ 첫 판정은 이 제한을 받지 않습니다 — 로드 직후 색이 한 박자 늦게 잡히면
     그게 더 눈에 띕니다. */
  var HERO_CONTRAST_MIN_HOLD = 3000;

  function heroRelativeLuminance(r, g, b) {
    var channels = [r, g, b].map(function (value) {
      var ratio = value / 255;
      return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  /* 두 후보 글자색의 상대 휘도.
     ★ css와 한 쌍입니다 — `--collection_hero_title`(#262626)과
     `--color_bg`(#fffdf9)입니다. css에서 색을 바꾸면 여기도 바꿔야 판정이 맞습니다. */
  var HERO_TEXT_DARK_LUMINANCE = heroRelativeLuminance(38, 38, 38);
  var HERO_TEXT_LIGHT_LUMINANCE = heroRelativeLuminance(255, 253, 249);

  function heroContrastRatio(a, b) {
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  function initHeroContrast() {
    var hero = document.querySelector(".collection_hero");
    var video = document.querySelector(".collection_hero_video");

    if (!hero || !video) {
      return;
    }

    /* ★★ **색을 입히는 요소와 밝기를 재는 요소가 다를 수 있습니다.**

       탭이 그랬습니다. 색은 `.brand_tabs`(nav)가 물려주는데, 그 nav는
       `left: 0; right: 0`이라 **상자가 화면 전체 폭(1600px)입니다.** 정작 글자는
       가운데 좁은 영역뿐인데 밝기를 화면 끝까지 평균 내고 있었습니다 —
       글자와 상관없는 자리가 판정을 좌우한 것입니다.

       그래서 재는 것은 **실제 글자가 있는 링크(`.brand_tab_link`) 두 개**로
       바꾸고, class는 예전 그대로 nav에 붙입니다(css를 고치지 않아도 됩니다).

       ★★ 중간 단계로 `.brand_tab_list`(ul)를 썼다가 되돌렸습니다 — **ul은
       block이라 상자가 여전히 화면의 92%입니다**(가운데 정렬은 그 안에서
       일어납니다). 실측 1600 화면에서:

       | 재는 대상 | 폭 | 화면 대비 |
       |---|---|---|
       | `.brand_tabs`(nav) | 1600 | 100% |
       | `.brand_tab_list`(ul) | 1472 | 92% |
       | **`.brand_tab_link` 두 개** | **382** | **24%** |

       ★ 두 링크를 **각각 재서 합칩니다.** 하나의 큰 상자로 묶으면 두 링크
       사이의 빈 간격(51px)까지 판정에 섞입니다 — 글자가 없는 자리입니다.

       ★ 색은 하나뿐이라 두 링크 모두에게 맞아야 합니다. 그래서 두 링크의
       밝기를 한 묶음으로 합쳐서 봅니다(한쪽만 보면 다른 쪽이 묻힙니다). */
    var tabLinks = Array.prototype.slice.call(
      document.querySelectorAll(".brand_tab_link")
    );

    var targets = [
      { apply: document.querySelector(".collection_hero_title") },
      {
        apply: document.querySelector(".brand_tabs"),
        measure: tabLinks
      }
    ].filter(function (entry) {
      return Boolean(entry.apply);
    }).map(function (entry) {
      /* 잴 요소가 없으면 색을 입히는 요소를 그대로 씁니다(예전과 같은 동작). */
      if (!entry.measure || entry.measure.length === 0) {
        entry.measure = [entry.apply];
      }

      return entry;
    });

    if (targets.length === 0) {
      return;
    }

    var canvas = document.createElement("canvas");
    canvas.width = HERO_SAMPLE_SIZE;
    canvas.height = HERO_SAMPLE_SIZE;

    /* willReadFrequently는 매번 읽어 갈 것을 브라우저에 미리 알리는 힌트입니다.
       없으면 GPU에 올려 두고 읽을 때마다 되가져와 느려집니다. */
    var context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return;
    }

    /* 캔버스 읽기가 막히면(교차 출처 영상 · file://) 다시 시도하지 않습니다.
       매번 예외를 던지게 두면 400ms마다 조용히 비용만 나갑니다. */
    var isBlocked = false;

    /* 요소 하나가 덮는 자리의 밝기들을 `into` 배열에 담습니다.
       ★ 여러 요소를 각각 부르고 한 배열에 모으면(탭 링크 두 개) 요소 사이의
       빈 자리가 섞이지 않습니다. */
    function collectLuminances(element, into) {
      var sourceWidth = video.videoWidth;
      var sourceHeight = video.videoHeight;

      /* HAVE_CURRENT_DATA 미만이면 아직 그릴 프레임이 없습니다. */
      if (!sourceWidth || !sourceHeight || video.readyState < 2) {
        return false;
      }

      var videoRect = video.getBoundingClientRect();
      var rect = element.getBoundingClientRect();

      if (!videoRect.width || !videoRect.height || !rect.width || !rect.height) {
        return false;
      }

      /* ★ object-fit의 매핑을 되짚어야 합니다. 요소의 화면 좌표를 그대로 영상
         좌표로 쓰면 잘리거나 남는 몫만큼 어긋난 자리를 읽습니다
         (예전 cover 시절, 세로로 긴 화면에서 좌우가 크게 잘려 아예 다른 장면이 읽혔습니다).

         ★ 배율 방향이 반대입니다 — cover는 max, contain은 min입니다.
         css를 바꿨을 때 여기만 그대로 남아 조용히 틀리는 일이 없도록
         숫자를 박지 않고 실제 적용된 object-fit을 읽습니다. */
      var objectFit = window.getComputedStyle(video).objectFit;
      var scale = objectFit === "cover"
        ? Math.max(videoRect.width / sourceWidth, videoRect.height / sourceHeight)
        : Math.min(videoRect.width / sourceWidth, videoRect.height / sourceHeight);
      var offsetX = (videoRect.width - sourceWidth * scale) / 2;
      var offsetY = (videoRect.height - sourceHeight * scale) / 2;

      var left = (rect.left - videoRect.left - offsetX) / scale;
      var top = (rect.top - videoRect.top - offsetY) / scale;
      var right = left + rect.width / scale;
      var bottom = top + rect.height / scale;

      /* 영상 밖으로 나간 몫을 잘라냅니다. drawImage에 영상 밖 좌표를 넘기면
         그 부분이 투명(0,0,0,0)으로 읽혀 실제보다 어둡게 나옵니다. */
      var x0 = Math.max(0, Math.min(sourceWidth, left));
      var y0 = Math.max(0, Math.min(sourceHeight, top));
      var x1 = Math.max(0, Math.min(sourceWidth, right));
      var y1 = Math.max(0, Math.min(sourceHeight, bottom));

      if (x1 - x0 < 1 || y1 - y0 < 1) {
        return false;
      }

      var pixels;

      try {
        context.drawImage(video, x0, y0, x1 - x0, y1 - y0, 0, 0, HERO_SAMPLE_SIZE, HERO_SAMPLE_SIZE);
        pixels = context.getImageData(0, 0, HERO_SAMPLE_SIZE, HERO_SAMPLE_SIZE).data;
      } catch (error) {
        isBlocked = true;
        return false;
      }

      /* ★ 평균 하나로 줄이지 않고 **분포를 그대로 모읍니다.** 평균은 밝은 곳과
         어두운 곳이 섞인 자리를 대표하지 못합니다(위 상수 주석 참고). */
      for (var index = 0; index < pixels.length; index += 4) {
        into.push(
          heroRelativeLuminance(pixels[index], pixels[index + 1], pixels[index + 2])
        );
      }

      return true;
    }

    /* 요소 여러 개를 한 묶음으로 재서 정렬된 밝기 배열을 돌려줍니다. */
    function sampleLuminances(elements) {
      var luminances = [];

      for (var index = 0; index < elements.length; index += 1) {
        collectLuminances(elements[index], luminances);
      }

      if (luminances.length === 0) {
        return null;
      }

      luminances.sort(function (a, b) {
        return a - b;
      });

      return luminances;
    }

    /* 글자 자리에서 이 색이 **가장 불리한 곳에서 내는 대비**.
       어두운 쪽 끝과 밝은 쪽 끝 둘 다에 대고 재서 나쁜 쪽을 씁니다 —
       한쪽만 보면 반대쪽 극단에서 묻히는 것을 놓칩니다. */
    function heroWorstContrast(textLuminance, luminances) {
      var lowIndex = Math.floor(HERO_CONTRAST_LOW_PERCENTILE * (luminances.length - 1));
      var highIndex = Math.floor(HERO_CONTRAST_HIGH_PERCENTILE * (luminances.length - 1));

      return Math.min(
        heroContrastRatio(textLuminance, luminances[lowIndex]),
        heroContrastRatio(textLuminance, luminances[highIndex])
      );
    }

    function syncHeroContrast() {
      if (isBlocked || document.hidden) {
        return;
      }

      /* 히어로가 화면 밖으로 지나갔으면 잴 이유가 없습니다. */
      var heroRect = hero.getBoundingClientRect();

      if (heroRect.bottom <= 0 || heroRect.top >= window.innerHeight) {
        return;
      }

      targets.forEach(function (entry) {
        var luminances = sampleLuminances(entry.measure);

        if (luminances === null) {
          return;
        }

        /* 지금 검은 글씨인지. class가 아직 없으면 CSS 기본값이 검은 글씨이므로
           그쪽으로 봅니다 — 그래야 첫 판정이 기본 화면과 어긋나지 않습니다. */
        var wasOnLight = !entry.apply.classList.contains("is_on_dark");

        var darkScore = heroWorstContrast(HERO_TEXT_DARK_LUMINANCE, luminances);
        var lightScore = heroWorstContrast(HERO_TEXT_LIGHT_LUMINANCE, luminances);

        /* 지금 쓰고 있는 색을 기준으로, 반대쪽이 **눈에 띄게 나을 때만** 바꿉니다.
           점수가 비슷한 장면에서 0.4초마다 뒤집히는 것을 막습니다. */
        var currentScore = wasOnLight ? darkScore : lightScore;
        var rivalScore = wasOnLight ? lightScore : darkScore;

        /* ★ 여기가 두 번째 잠금장치입니다 — 바꿀 이유가 충분해도 **아직 이를
           때면** 그대로 둡니다. 첫 판정(lastSwitchAt이 없음)은 통과시킵니다. */
        var now = Date.now();
        var isHeld = entry.lastSwitchAt !== undefined &&
          now - entry.lastSwitchAt < HERO_CONTRAST_MIN_HOLD;

        var shouldSwitch = !isHeld &&
          rivalScore > currentScore * HERO_CONTRAST_SWITCH_MARGIN;
        var isOnLight = shouldSwitch ? !wasOnLight : wasOnLight;

        if (shouldSwitch || entry.lastSwitchAt === undefined) {
          entry.lastSwitchAt = now;
        }

        entry.apply.classList.toggle("is_on_light", isOnLight);
        entry.apply.classList.toggle("is_on_dark", !isOnLight);
      });
    }

    syncHeroContrast();

    /* 첫 프레임이 준비되는 시점과 크기가 바뀌는 시점은 간격을 기다리지 않고
       바로 맞춥니다. 그래야 로드 직후 한 박자 늦게 색이 바뀌지 않습니다. */
    video.addEventListener("loadeddata", syncHeroContrast);
    video.addEventListener("seeked", syncHeroContrast);
    window.addEventListener("resize", syncHeroContrast);
    document.addEventListener("visibilitychange", syncHeroContrast);

    window.setInterval(syncHeroContrast, HERO_CONTRAST_INTERVAL);
  }

  syncCollectionCanvasScale();
  initShowcaseScroll();
  initShowcaseCarousel();
  initArchive();
  initArchiveDeck();
  initAsworn();
  initMobileReveal();
  initBrandTabs();
  /* ★ 밝기 판정보다 먼저 불러야 합니다. 상자 비율이 정해진 뒤라야
     initHeroContrast()가 영상의 올바른 자리를 읽습니다. */
  initHeroFit();
  initHeroContrast();
  initResponsiveAnimations();
})();
