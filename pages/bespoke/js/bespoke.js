(function () {
  "use strict";

  /* Keep full original copy at desktop; concise excerpts belong to the small
     screen presentation, without replacing the Process or Material controller. */
  (function initCompactCopy() {
    var mobile = window.matchMedia("(max-width: 767px)");
    var compact = window.matchMedia("(max-width: 1279px)");
    var definitions = [
      [".bespoke_hero_desc", ["One piece takes shape across five meetings.", "No standard size, no standard taste. One piece takes shape across five meetings."]],
      [".philosophy_desc", ["Bespoke is the one right answer, made for one person.", "Bespoke is the one right answer, made for one person — from chosen fabric to final stitch."]],
      [".process_stage_desc", [
        ["A conversation about your taste, proportions and occasion.", "We begin with your taste, proportions and occasion, before a single line is drawn."],
        ["Silhouette, collar, sleeve and hem — a pattern for your body.", "We decide silhouette, collar, sleeve and hem together, drafting a pattern for your body alone."],
        ["Choose the cloth by touch and colour, then settle the measurements.", "Six fabrics are laid out in daylight. Once the cloth is chosen, we record your measurements against your pattern."],
        ["One pair of hands, from first stitch to last.", "Your garment is built by hand in small batches, from cutting to seams, lining and finishing."],
        ["A final fitting and last adjustments, then pressed and wrapped.", "The final fitting checks the skirt and shoulder. Last adjustments are made before your piece is pressed and wrapped."]
      ]],
      [".materials_caption_desc", [
        ["Soft silk with graceful drape and deep, even colour.", "Continuous-filament silk catches light along every fold, with the deep, even colour a formal jeogori asks for."],
        ["Breathable cotton that softens with every wearing.", "Plain-woven cotton softens with wearing, holding a crisp collar and cuff while staying cool against the skin."],
        ["Flax linen holds its structure, with room for air to move.", "Spun from flax, linen stands slightly away from the body; its everyday creases belong to the material."],
        ["Cool, translucent mosi, worn through Korean summers.", "Finely woven ramie lets light through. Mosi keeps a sculptural silhouette and softens with every wash."],
        ["A short run of cloth, chosen for one season only.", "Weight, weave and colour change with each season’s cloth, giving the same pattern a different hand and fall."],
        ["Sangju Myungjoo silk, with a quiet, uneven lustre.", "Silk woven in Sangju from domestic cocoons on narrow looms, with a quiet lustre that deepens with age."]
      ]],
      [".materials_intro", ["Six fabrics, chosen for line, light and drape.", "Six fabrics kept through the year, chosen for how they hold a line, catch the light and settle against the body."]],
      [".begin_desc", ["Materials, timeline and investment.", "Explore the materials, timeline and investment before creating your bespoke hanbok."]]
    ];
    var records = [];
    definitions.forEach(function (entry) {
      Array.from(document.querySelectorAll(entry[0])).forEach(function (node, index) {
        var copy = Array.isArray(entry[1][0]) ? entry[1][index] : entry[1];
        records.push({node:node, original:node.innerHTML, copy:copy});
      });
    });
    var reservation = document.querySelector("main > .reservation");
    var begin = document.querySelector("main > .begin");
    var marker = null;
    var atelierButton = document.querySelector(".atelier_button");
    var heroStage = document.querySelector(".bespoke_hero_stage");
    var buttonMarker = null;
    function sync() {
      records.forEach(function (record) {
        if (compact.matches) record.node.textContent = record.copy[mobile.matches ? 0 : 1];
        else record.node.innerHTML = record.original;
      });
      if (compact.matches && !marker && reservation && begin) {
        marker = document.createComment("Desktop reservation position");
        reservation.before(marker); begin.after(reservation);
      } else if (!compact.matches && marker) {
        marker.replaceWith(reservation); marker = null;
      }
      if (compact.matches && atelierButton && heroStage && !buttonMarker) {
        buttonMarker = document.createComment("Atelier button desktop position");
        atelierButton.before(buttonMarker); heroStage.append(atelierButton);
      } else if (!compact.matches && buttonMarker) {
        buttonMarker.replaceWith(atelierButton); buttonMarker = null;
      }
    }
    compact.addEventListener("change", sync); mobile.addEventListener("change", sync);
    sync();
  })();

  /* ---------------------------------------------------------
     process — 스크롤을 내리면 아래 번호 목록과 위 사진·글이 함께 바뀐다

     레퍼런스는 j-cat.co.jp의 Project Story 섹션이다. 실측한 구성:
     콘텐츠 폭 1080 안에서 사진이 723 x 506(폭의 67%), 번호(Vol. 01)와 글은
     그 옆에 작게 붙고, 슬라이드를 넘기면 사진이 바뀐다.
     즉 **사진이 주인공이고 글이 딸린다.**

     이전 아코디언 방식(felix-nieto 참고)은 사진이 행 안에 들어가 작을
     수밖에 없었다. 그 관계를 뒤집어, 사진을 무대로 올리고 목록은 인덱스로
     내렸다. 색이 차오르는 행 연출은 그대로 남겼다.

     스크롤과 클릭은 같은 진행 위치를 공유한다. 데스크톱에서 단계를 클릭하면
     해당 단계의 스크롤 구간 중앙으로 이동하고, 포커스는 콘텐츠만 미리 보여 준다.
     **hover 경로는 없다**(아래 리스너 자리의 사유 참고).

     **높이를 JS로 재지 않는다.** 사진 상자가 고정 크기이고, 글 다섯 벌은
     CSS grid 한 칸에 겹쳐 두어 가장 긴 글이 높이를 정한다. 그래서 단계를
     옮겨도 무대 높이가 변하지 않는다(이전 버전은 여기서 min-height를
     계산해야 했다).

     JS가 없으면 마크업의 is_active / is_visible 그대로 01 Consultation이 보인다.
     --------------------------------------------------------- */

  /* 스크롤로 단계를 넘기는 구간을 켜는 조건. 좁은 화면에서는 화면을 붙잡지
     않는다(빠져나갈 방법이 없어진다). atelier 스토리와 같은 기준이다. */
  var PROCESS_SCROLL_GATE =
    "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";

  function initProcessSteps() {
    var section = document.querySelector(".process");

    if (!section) {
      return;
    }

    var steps = Array.prototype.slice.call(section.querySelectorAll(".process_step"));
    var stageImages = Array.prototype.slice.call(section.querySelectorAll(".process_stage_img"));
    var stageItems = Array.prototype.slice.call(section.querySelectorAll(".process_stage_item"));

    if (!steps.length) {
      return;
    }

    var activeKey = null;
    /* 클릭이 현재 스크롤 진행 위치까지 바꿀 수 있도록 트리거를 바깥에 보관한다.
       게이트 밖(모바일 · 모션 감소 · GSAP 없음)에서는 null이라 기존처럼
       콘텐츠만 전환된다. */
    var processTrigger = null;
    var lastScrollIndex = -1;

    var initialStep = steps.filter(function (step) {
      return step.classList.contains("is_active");
    })[0] || steps[0];

    activeKey = initialStep.dataset.step;

    function setActiveKey(key) {
      if (!key || key === activeKey) {
        return;
      }

      activeKey = key;

      steps.forEach(function (step) {
        var isMatch = step.dataset.step === key;
        var head = step.querySelector(".process_step_head");

        step.classList.toggle("is_active", isMatch);

        if (head) {
          head.setAttribute("aria-pressed", isMatch ? "true" : "false");
        }
      });

      /* 사진은 이름으로 짝짓는다(`process_stage_<data-step>`).
         마크업 순서가 바뀌어도 어긋나지 않는다. */
      stageImages.forEach(function (image) {
        image.classList.toggle("is_visible", image.id === "process_stage_" + key);
      });

      stageItems.forEach(function (item) {
        item.classList.toggle("is_active", item.dataset.step === key);
      });
    }

    function stepFrom(target) {
      if (!target || !target.closest) {
        return null;
      }

      var step = target.closest(".process_step");

      return step && section.contains(step) ? step : null;
    }

    /* 각 단계의 경계가 아니라 **구간 중앙**으로 이동한다.
       5단계라면 10% · 30% · 50% · 70% · 90%다.
       마지막을 100%로 보내지 않으므로 05를 눌렀을 때 sticky가 즉시 풀리거나
       다음 섹션으로 넘어가는 일이 없다. */
    function progressForIndex(index) {
      return (index + 0.5) / steps.length;
    }

    function syncScrollToIndex(index) {
      if (
        !processTrigger ||
        !section.classList.contains("is_scroll_ready") ||
        index < 0 ||
        index >= steps.length
      ) {
        return false;
      }

      var start = Number(processTrigger.start);
      var end = Number(processTrigger.end);

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return false;
      }

      var targetY = start + (end - start) * progressForIndex(index);

      /* 먼저 같은 단계로 맞춰 둔다. 즉시 점프하는 동안 ScrollTrigger가 갱신돼도
         이전 스크롤 단계가 화면을 되돌리지 않는다. */
      lastScrollIndex = index;
      setActiveKey(steps[index].dataset.step);

      /* common.js가 만든 Lenis가 있으면 그것의 내부 좌표도 함께 맞춘다.
         중간 단계를 애니메이션으로 훑지 않도록 immediate를 쓴다. */
      var lenis = window.tchaikimmLenis;

      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(targetY, {
          immediate: true,
          force: true,
          onComplete: function () {
            if (window.ScrollTrigger) {
              window.ScrollTrigger.update();
            }
          }
        });
      } else {
        /* Lenis가 꺼진 환경에서는 브라우저 좌표를 즉시 옮긴다.
           object-form의 behavior 옵션을 쓰지 않아 CSS scroll-behavior의 영향을
           받지 않고 중간 단계를 지나가지 않는다. */
        window.scrollTo(0, targetY);
      }

      if (window.ScrollTrigger) {
        window.ScrollTrigger.update();
      }

      return true;
    }

    function handleFocus(event) {
      var step = stepFrom(event.target);

      if (step) {
        /* Tab으로 탐색할 때 페이지까지 갑자기 이동시키지는 않는다.
           Enter/Space를 누르면 아래 click 경로가 실행돼 스크롤도 동기화된다. */
        setActiveKey(step.dataset.step);
      }
    }

    function handleClick(event) {
      var step = stepFrom(event.target);

      if (!step) {
        return;
      }

      var index = steps.indexOf(step);

      if (index < 0) {
        return;
      }

      setActiveKey(step.dataset.step);
      syncScrollToIndex(index);
    }

    /* ★ 2026-08-11(사용자 요청): **마우스 hover 경로를 제거했다.**
       스크롤이 단계를 넘기게 된 뒤로, 목록 위를 지나가기만 해도 단계가 바뀌어
       스크롤이 정한 단계와 다투었다.

       ★ 2026-09-13: 클릭은 이제 콘텐츠만 바꾸지 않고 **해당 단계의 실제
       스크롤 구간 중앙까지 함께 이동**한다. 그래서 04를 클릭한 뒤 아래로
       굴리면 05로, 위로 굴리면 03으로 자연스럽게 이어진다.

       포커스는 접근성을 위해 콘텐츠만 미리 보여 준다. Tab 이동만으로 페이지가
       갑자기 움직이면 안 되기 때문이다. Enter/Space는 button의 click을 발생시켜
       데스크톱에서는 스크롤까지 정상적으로 동기화한다. */

    section.addEventListener("focusin", handleFocus);
    section.addEventListener("click", handleClick);

    /* ── 스크롤로 단계 넘기기 (2026-08-10 사용자 요청) ────────────────────
       "스크롤 내릴 때 1~5번이 나타나는데, 다 내려갈 때까지는 계속 고정."

       섹션을 화면에 붙여 두고, 그 구간을 다섯 등분해 스크롤 위치가 곧 단계가
       되게 한다. 다섯 번째까지 지나야 sticky가 풀리고 다음 섹션으로 넘어간다.

       ★★ 고정은 **CSS sticky**다. ScrollTrigger `pin`을 쓰지 않는다 —
       pin-spacer가 끼면 아래 섹션들의 문서 좌표가 전부 밀리고, 이 페이지는
       지금 pin-spacer가 0개다(히어로·atelier도 전부 sticky다).
       그래서 이 트리거는 값을 읽기만 하고 레이아웃은 건드리지 않는다.

       ★ `end: "bottom bottom"`이 곧 sticky가 풀리는 지점이다. 붙어 있는
       상자가 100svh이므로, 섹션 아랫변이 화면 아랫변에 닿는 순간과 정의상
       같다. 숫자로 적으면 css의 활주로 길이와 한 쌍이 되어 조용히 어긋난다.

       ★ 클릭도 이 트리거의 start/end 값을 이용한다. 단계 구간의 중앙으로
       실제 좌표를 옮기므로 이후 휠 입력은 클릭한 단계의 앞뒤에서 이어진다.

       ★ 게이트 밖(좁은 화면 · 모션 감소 · GSAP 없음)에서는 `is_scroll_ready`가
       붙지 않아 고정도 없고, 클릭·포커스로만 바뀐다.
       좁은 화면에서 화면을 붙잡으면 빠져나갈 방법이 없어진다. */
    if (!window.gsap || !window.ScrollTrigger) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.matchMedia().add(PROCESS_SCROLL_GATE, function () {
      section.classList.add("is_scroll_ready");

      var trigger = window.ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: function (self) {
          var index = Math.min(
            steps.length - 1,
            Math.floor(self.progress * steps.length)
          );

          if (index === lastScrollIndex) {
            return;
          }

          lastScrollIndex = index;
          setActiveKey(steps[index].dataset.step);
        }
      });

      processTrigger = trigger;

      return function () {
        section.classList.remove("is_scroll_ready");

        if (processTrigger === trigger) {
          processTrigger = null;
          lastScrollIndex = -1;
        }

        trigger.kill();
      };
    });
  }


  /* ---------------------------------------------------------
     philosophy — 등장(fade + slide up)과 배경 패럴랙스

     GSAP + ScrollTrigger를 쓴다. 이 페이지가 이미 둘 다 불러오고 있고,
     common.js가 Lenis를 GSAP 티커·ScrollTrigger에 연결해 둬서 scrub이
     부드럽게 따라온다. IntersectionObserver로는 패럴랙스(스크롤 위치에
     비례하는 연속 이동)를 만들 수 없어 위 process와 방식이 다르다.

     기본값은 "다 보이는 상태"다. JS나 GSAP이 없거나 모션 감소 설정이면
     아무것도 하지 않고 CSS 레이아웃 그대로 보인다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var PHILOSOPHY_RISE = 72; /* 글이 아래에서 올라오는 거리(px) */
  var PHILOSOPHY_BG_RISE = 2.5; /* 배경이 올라오는 거리(자기 높이의 %) */
  var PHILOSOPHY_DURATION = 1.25; /* 등장 길이(초) */
  var PHILOSOPHY_STAGGER = 0.26; /* 제목 → 본문 시차(초) */
  /* **글 상자를 기준으로 잡는다(섹션이 아니다).** 섹션은 1000px인데 글은 그
     한가운데 있어서, 섹션 윗변으로 재면 글이 아직 화면 아래 172px 밖에 있을
     때 등장이 시작돼 화면 밖에서 다 끝나 버린다(실측: 시작 시점 노출 0%).
     글 상자의 윗변이 화면 82% 지점에 오면 시작한다. */
  var PHILOSOPHY_START = "top 82%";
  /* ※ 퇴장 상수 3개(`PHILOSOPHY_EXIT_*`)와 `PHILOSOPHY_PARALLAX_SHIFT`를
     지웠습니다 — 해당 트윈 자체가 사라졌기 때문입니다(아래 사유 주석 참고).
     쓰이지 않는 상수를 남겨 두면 "여기 그 연출이 있다"고 잘못 알려 줍니다. */

  function initPhilosophyMotion() {
    var section = document.querySelector(".philosophy");

    if (!section) {
      return;
    }

    var background = section.querySelector(".philosophy_bg");
    var body = section.querySelector(".philosophy_body");
    var contents = section.querySelectorAll(".philosophy_title, .philosophy_desc");

    if (!background || !body || !contents.length || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* ★★ 등장 트윈만 게이트가 다르다 (2026-08-10).

       데스크톱에서는 히어로 전환(`initHeroTransition`)이 philosophy의 등장 순서를
       **직접 쥔다** — 배경이 먹물처럼 퍼진 다음 제목, 그다음 설명이다.
       여기 등장 트윈을 같이 돌리면 **원이 열리자마자 글이 함께 튀어나온다**
       (스크롤 940 = 전환의 38% 지점에서 발동했다. 실제로 그렇게 보였다).

       그래서 이 둘은 **히어로 전환이 꺼진 조건에서만** 켠다 —
       `HERO_GATE`의 반대인 세로 화면이다. 모션 감소일 때는 어느 쪽도 돌지 않는다.
       패럴랙스와 퇴장은 전환과 겹치지 않으므로 아래 블록에 그대로 둔다. */
    gsap.matchMedia().add(
      "(min-width: 1280px) and (prefers-reduced-motion: no-preference) and (max-aspect-ratio: 1332/1000)",
      function () {
        /* 1) 등장 — 제목이 먼저, 본문이 조금 늦게 올라온다.
              `from`이라 끝값은 CSS가 정한 값 그대로다(불투명도 1). */
        gsap.from(contents, {
          y: PHILOSOPHY_RISE,
          opacity: 0,
          duration: PHILOSOPHY_DURATION,
          stagger: PHILOSOPHY_STAGGER,
          ease: "power3.out",
          scrollTrigger: {
            trigger: body,
            start: PHILOSOPHY_START,
            once: true
          }
        });

        /* 배경도 같이 떠오르되 글보다 길고 느리게 안착한다.
           끝 불투명도는 CSS의 .philosophy_bg(0.6)를 GSAP이 알아서 읽는다.

           **이동을 y가 아니라 yPercent로 준다.** 아래 패럴랙스가 같은 요소의
           y를 계속 쓰기 때문이다. GSAP은 y와 yPercent를 각각 따로 들고 있다가
           더해서 그리므로, 두 트리거가 서로를 덮어쓰지 않는다. */
        gsap.from(background, {
          yPercent: PHILOSOPHY_BG_RISE,
          opacity: 0,
          duration: PHILOSOPHY_DURATION * 1.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: body,
            start: PHILOSOPHY_START,
            once: true
          }
        });
      }
    );

    /* 조건이 어긋나면(모션 감소 설정으로 바꾸면) matchMedia가 아래에서 준
       정리 함수를 부르고, GSAP이 자기가 넣은 인라인 스타일도 되돌린다. */
    gsap.matchMedia().add("(min-width: 1280px) and (prefers-reduced-motion: no-preference)", function () {
      section.classList.add("is_motion_ready");

      /* ※ 2) 배경 패럴랙스를 **제거했습니다** (2026-08-11, 사용자 요청 —
         "이미지가 흔들린다. 스크롤을 내리면서 절대 화면이 움직이지 않도록").

         원래는 섹션이 화면을 지나가는 내내 배경을 `y −110 → +110`으로
         흘렸습니다(`scrub: true`). 스크롤 위치에 1:1로 묶여 있어서 **스크롤하는
         동안 배경만 220px을 계속 움직였습니다** — 이것이 흔들림의 정체입니다.

         ★★ 히어로 전환 구간에서 특히 두드러졌습니다. 그 구간에서는
         `initHeroTransition`의 ①이 philosophy 섹션을 화면 top 0에 **붙여 둡니다.**
         섹션은 못 박혀 있는데 그 안의 배경만 패럴랙스로 흐르니, 먹물이 퍼지는
         동안 배경이 혼자 미끄러졌습니다. 두 연출이 같은 구간에서 서로 반대로
         움직이고 있었던 셈입니다.

         지금 배경에는 **스크롤에 묶인 트윈이 하나도 없습니다.** 아래 등장 트윈만
         남는데 그것은 `once: true`인 데다 세로 화면에서만 돕니다. 즉 데스크톱에서는
         배경에 걸리는 transform이 아예 없어 섹션과 완전히 함께 움직입니다.

         ★ 되살리지 마세요. 되살리려면 css의 `--philosophy_bg_overscan`(배경을
         키워 두는 값)도 그 이동량에 맞춰 같이 올려야 합니다 — 안 그러면 섹션
         위아래에 빈 줄이 드러납니다. */

      /* ※ 3) 퇴장 트윈을 **제거했습니다** (2026-08-10, 사용자 요청 —
         "philosophy에서 다음 섹션으로 넘어갈 때 글씨가 사라지지 않고 그대로
         남아 있어야 한다").

         원래는 섹션이 화면을 빠져나가는 동안 글 상자가 위로 흐려지며 사라져서
         atelier가 올라오는 구간과 겹치게 만들었습니다. 지금은 글이 끝까지
         제자리에 있고 섹션과 함께 그냥 스크롤돼 나갑니다.
         (되살리려면 `.philosophy_body`에 `opacity 1→0` + `y −90`을
          `bottom 88% → bottom 20%` scrub으로 걸면 됩니다.) */

      return function () {
        section.classList.remove("is_motion_ready");
      };
    });
  }

  /* ---------------------------------------------------------
     atelier — 왼쪽 사진이 스크롤에 따라 아주 조금 커진다.

     레이아웃은 건드리지 않는다. 2단(사진 + 글) 구성, 여백, 섹션 높이가
     그대로다. 커지는 것은 상자가 아니라 **상자 안의 img**이고,
     .atelier_image의 `overflow: hidden`이 넘치는 부분을 잘라낸다.
     그래서 사진이 자기 자리 밖으로 나가거나 오른쪽 글을 밀어낼 수 없고,
     transform만 쓰므로 reflow도 없다.

     philosophy와 같이 GSAP + ScrollTrigger를 쓴다. 스크롤 위치에 비례해
     연속으로 변해야 하므로 IntersectionObserver로는 만들 수 없다.
     JS나 GSAP이 없거나 모션 감소 설정이면 아무것도 하지 않는다.

     이징 성격은 verostudio.com의 Diptych 계열을 참고했다. 코드를 옮긴 것이
     아니라, 그 사이트의 이징 어휘(`--ease-out-quint`,
     `cubic-bezier(.22, 1, .36, 1)`)에 overshoot가 없다는 점만 가져왔다.
     그래서 "또잉"을 튕김(bounce)으로 만들지 않았다. 아래 두 가지가 겹쳐서
     여운을 만든다:
     · `power2.out` — 앞에서 자라고 뒤로 갈수록 느려지며 안착한다
     · `scrub` 지연 — 스크롤을 멈춰도 사진이 조금 더 따라와 멎는다

     **확대량은 처음에 1.06이었는데 화면에서 너무 약해서 1.18로 올렸다.**
     1.06은 가장자리가 33px 자라는 것이라 스크롤 중에 알아채기 어려웠다.
     1.18은 가로 100 / 세로 117px이라 분명히 보인다. 상자에 잘리므로
     아무리 키워도 레이아웃에는 영향이 없다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var ATELIER_ZOOM_TO = 1.18; /* 최대 배율. 554×648 기준 가로 100 / 세로 117px 성장 */
  var ATELIER_ZOOM_START = "top 85%"; /* 섹션 윗변이 화면 85% 지점에 오면 시작 */
  var ATELIER_ZOOM_END = "bottom 65%"; /* 섹션 아랫변이 화면 65% 지점에 오면 최대 */
  var ATELIER_ZOOM_SCRUB = 1.2; /* 스크롤을 따라오는 지연(초). 여운의 크기다 */
  var ATELIER_ZOOM_EASE = "power2.out"; /* 끝으로 갈수록 느려지는 안착. 튕기지 않는다 */
  /* ★ 1280px 이상은 아래 `initAtelierStory()`가 사진을 통째로 맡는다.
     같은 사진에 두 트리거가 scale을 쓰면 서로 덮어쓰고, 무엇보다 스토리
     무대는 `object-fit: contain`으로 **사진 전체를 보여주는** 것이 목적이라
     18% 확대(=잘림)와 목적이 정면으로 어긋난다.
     그래서 이 확대는 스토리가 없는 폭에서만 돈다. */
  var ATELIER_ZOOM_GATE = "(min-width: 768px) and (max-width: 1279px) and (prefers-reduced-motion: no-preference)";

  function initAtelierZoom() {
    var section = document.querySelector(".atelier");

    if (!section) {
      return;
    }

    /* 상자가 아니라 그 안의 사진을 키운다 */
    var image = section.querySelector(".atelier_image img");

    if (!image || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.matchMedia().add(ATELIER_ZOOM_GATE, function () {
      section.classList.add("is_zoom_ready");

      /* `fromTo`라 시작값이 명시돼 있다. 위로 되감을 때도 정확히 1로
         돌아온다. 1보다 작게 시작하면 안 된다 — img가 상자를 꽉 채우고
         있어서(object-fit: cover) 줄이면 가장자리에 빈 줄이 드러난다. */
      gsap.fromTo(
        image,
        { scale: 1 },
        {
          scale: ATELIER_ZOOM_TO,
          ease: ATELIER_ZOOM_EASE,
          scrollTrigger: {
            trigger: section,
            start: ATELIER_ZOOM_START,
            end: ATELIER_ZOOM_END,
            scrub: ATELIER_ZOOM_SCRUB,
            invalidateOnRefresh: true
          }
        }
      );

      return function () {
        section.classList.remove("is_zoom_ready");
      };
    });
  }

  /* ---------------------------------------------------------
     atelier 글 — 섹션에 들어오면 글자가 하나씩 아래에서 올라온다.

     제목 → 리드 → 본문이 한 줄기 물결처럼 이어진다. 세 요소를 따로
     재생하지 않고 글자를 한 배열로 모아 `stagger`를 한 번만 건다.

     `stagger: { amount: N }`을 쓴다(`each`가 아니다). `each`는 글자 수에
     비례해 전체 길이가 늘어나서, 본문(140자 남짓)이 제목(10자)보다 열 배
     넘게 오래 걸린다. `amount`는 글자가 몇 개든 **전체를 N초 안에** 흘려
     보내므로 문구를 고쳐도 리듬이 그대로다.

     `once: true`라 한 번만 재생된다. 본문은 읽는 글이라 scrub으로 묶으면
     스크롤 위치에 따라 반쯤 지워진 상태로 멈춰 읽기가 어렵다.
     (사진 확대만 scrub이고, 이쪽은 philosophy와 같은 방식이다.)
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var ATELIER_TEXT_RISE = 50; /* 글자가 올라오는 거리(자기 높이의 %) */
  var ATELIER_TEXT_DURATION = 0.8; /* 글자 하나가 자리잡는 시간(초) */
  var ATELIER_TEXT_SPREAD = 1.2; /* 첫 글자부터 마지막 글자까지 걸리는 시간(초) */
  /* **글 상자를 기준으로 잡는다(섹션이 아니다).** 섹션은 1000px인데 글은 그
     한가운데 있어서, 섹션 윗변으로 재면 글이 아직 화면 아래 116px 밖에 있을
     때 시작해 화면 밖에서 다 끝나 버린다(실측: 시작 시점 노출 0%).
     글 상자의 윗변이 화면 82% 지점에 오면 시작한다 — 그 순간 글의 약 3분의
     2가 이미 화면 안에 있다. */
  var ATELIER_TEXT_START = "top 82%";
  /* ★ 확대와 같은 이유로 1280px 이상에서는 돌지 않는다. 스토리 무대에서는
     글이 사진과 **순서를 맞춰** 떠올라야 하는데(사진이 가운데 안착한 뒤),
     이 물결은 자기 트리거로 따로 재생돼서 그 순서를 지킬 수 없다.
     그쪽은 `initAtelierStory()`가 블록 단위 stagger로 처리한다. */
  var ATELIER_TEXT_GATE = "(max-width: 1279px) and (prefers-reduced-motion: no-preference)";

  /* 글을 단어 상자로 감싸고, 그 안을 다시 글자 상자로 나눈다.
     `perChar`가 false면 단어 상자 자체가 움직이는 단위가 된다.

     **단어 상자가 반드시 필요하다.** 글자마다 inline-block을 주면 줄바꿈이
     글자 사이 어디에서나 일어나 단어가 중간에서 끊긴다. 단어를 한 번 더
     감싸야 줄바꿈이 단어 경계에서만 생긴다.

     `<br>`은 건드리지 않는다 — 텍스트 노드만 바꿔 끼우므로 시안의 줄바꿈이
     그대로 남는다. 공백도 텍스트 노드로 그대로 두어 단어 간격이 유지된다. */
  function splitAtelierBlock(element, perChar) {
    var units = [];
    var textNodes = [];
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(function (node) {
      if (!node.nodeValue.trim()) {
        return; /* 들여쓰기로 생긴 공백 노드는 그대로 둔다 */
      }

      var fragment = document.createDocumentFragment();

      node.nodeValue.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) {
          return;
        }

        if (/^\s+$/.test(chunk)) {
          fragment.appendChild(document.createTextNode(chunk));
          return;
        }

        var word = document.createElement("span");
        word.className = "atelier_word";

        if (perChar) {
          chunk.split("").forEach(function (character) {
            var span = document.createElement("span");
            span.className = "atelier_char";
            span.textContent = character;
            word.appendChild(span);
            units.push(span);
          });
        } else {
          word.textContent = chunk;
          units.push(word);
        }

        fragment.appendChild(word);
      });

      node.parentNode.replaceChild(fragment, node);
    });

    return units;
  }

  /* 글자 단위로 나누되, **줄 수가 늘어나면 단어 단위로 되돌린다.**

     글자를 inline-block으로 만들면 글자마다 폭이 소수점에서 올림돼 줄 전체가
     아주 조금 넓어진다. 실측하면 `.atelier_lead`가 44글자에 2.74px 늘어나는데,
     이 줄은 원래 상자(509px)보다 0.77px 좁을 뿐이라 그대로 두면 두 줄로
     넘어간다(높이 32 → 64px). 단어 단위는 같은 줄에서 0.11px밖에 늘지 않아
     안전하다.

     폭이나 폰트에 따라 아슬아슬한 줄이 달라지므로 값을 박아두지 않고
     매번 실제 높이를 재서 정한다. 그래서 어느 화면 폭에서도 시안의 줄 수가
     그대로 유지된다. */
  function splitAtelierText(element) {
    var original = element.innerHTML;
    var heightBefore = element.offsetHeight;
    var units = splitAtelierBlock(element, true);

    if (element.offsetHeight > heightBefore) {
      element.innerHTML = original;
      units = splitAtelierBlock(element, false);
    }

    return units;
  }

  function initAtelierText() {
    var section = document.querySelector(".atelier");

    if (!section) {
      return;
    }

    var body = section.querySelector(".atelier_body");
    var blocks = section.querySelectorAll(".atelier_title, .atelier_lead, .atelier_desc");

    if (!body || !blocks.length || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* 조건이 다시 맞아도 두 번 쪼개지 않도록 밖에 둔다 */
    var units = null;

    gsap.matchMedia().add(ATELIER_TEXT_GATE, function () {
      /* class가 먼저 붙어야 한다 — 나눈 뒤 높이를 재서 줄 수가 늘었는지
         판단하는데, inline-block이 걸려 있지 않으면 그 차이가 드러나지 않는다. */
      section.classList.add("is_text_ready");

      if (!units) {
        units = [];
        blocks.forEach(function (block) {
          units = units.concat(splitAtelierText(block));
        });
      }

      /* `from`이라 끝값은 CSS가 정한 값 그대로다. 트윈이 만들어지는 즉시
         시작 상태(투명 + 아래)가 적용되므로 재생 전에 글이 비쳐 보이지 않는다. */
      gsap.from(units, {
        yPercent: ATELIER_TEXT_RISE,
        opacity: 0,
        duration: ATELIER_TEXT_DURATION,
        ease: "power3.out",
        stagger: { amount: ATELIER_TEXT_SPREAD },
        scrollTrigger: {
          trigger: body,
          start: ATELIER_TEXT_START,
          once: true
        }
      });

      /* class를 떼면 span이 평범한 inline이 되어 원래 글과 똑같이 보인다.
         GSAP이 자기가 넣은 인라인 스타일은 알아서 되돌린다. */
      return function () {
        section.classList.remove("is_text_ready");
      };
    });
  }

  /* ---------------------------------------------------------
     materials — 원단을 고르면 큰 사진과 설명이 바뀐다

     레퍼런스는 eternalblue.co.nz의 `.ingredient-slider__grid`다.
     구조를 실측해 보니 이 섹션과 거의 같은 배치였다 —
     [큰 사진 | 머리글 + 썸네일 줄 + (이름 목록 | 설명)].

     그쪽 동작을 그대로 옮겼다가 2026-08-10에 두 가지를 뒤집었다.

     · **클릭(탭)으로만 바뀐다. hover는 아무것도 하지 않는다**(사용자 결정).
       레퍼런스와 이전 구현은 hover였는데, 원단 사진이 원본 카메라 파일
       (장당 1~4MB)로 바뀌면서 마우스가 스쳐 지나가기만 해도 큰 사진이
       갈아 끼워지는 게 손해가 됐다. 되돌아가지 않는 것은 그대로다.
     · **큰 사진에 페이드가 없다. 클릭한 순간 갈아 끼운다.**
       예전에는 0.4초 흐렸다가(`.is_fading { opacity: 0 }`) 바꿨는데,
       그 0.4초가 화면에서는 **빈 자리로 보였다** — "눌렀는데 한참 비어
       있다가 사진이 뜬다"의 정체가 이것이다. 지금은 흐리는 단계가 없다.
     · 설명은 전환 없이 즉시 바뀐다(레퍼런스에 transition이 없다).

     레퍼런스는 `<div>`에 `cursor: pointer`만 걸었지만 여기서는 `<button>`을
     쓴다. 키보드로도 고를 수 있어야 하고, 이 저장소 규칙이기도 하다.
     `reset.css`가 button의 색·글꼴·여백을 상속으로 되돌려 두어서 글자
     크기와 색은 이전 마크업과 똑같이 나온다.

     JS가 없으면 마크업의 `is_active`(=[1] Silk) 그대로 보인다.
     --------------------------------------------------------- */

  function initMaterialsSelector() {
    var section = document.querySelector(".materials");

    if (!section) {
      return;
    }

    var textureFrame = section.querySelector(".materials_texture");
    var textureImages = Array.prototype.slice.call(
      section.querySelectorAll(".materials_texture_img")
    );
    var swatches = Array.prototype.slice.call(section.querySelectorAll(".materials_swatch"));
    var captionItems = Array.prototype.slice.call(
      section.querySelectorAll(".materials_caption_item")
    );
    var status = section.querySelector(".materials_status");

    if (
      !textureFrame ||
      textureImages.length < 2 ||
      !swatches.length ||
      !captionItems.length
    ) {
      return;
    }

    var activeFabric = null;
    var visibleTextureIndex = textureImages[0].classList.contains("is_visible") ? 0 : 1;
    var textureToken = 0;
    var preloaded = Object.create(null);
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function fabricOf(swatch) {
      return swatch ? swatch.dataset.fabric : null;
    }

    function buttonFor(fabric) {
      return section.querySelector(
        '.materials_swatch_button[data-fabric="' + fabric + '"]'
      );
    }

    function sourceFor(fabric) {
      var button = buttonFor(fabric);
      var image = button ? button.querySelector(".materials_swatch_img img") : null;

      return image ? image.getAttribute("src") : "";
    }

    function altFor(fabric) {
      var button = buttonFor(fabric);
      var image = button ? button.querySelector(".materials_swatch_img img") : null;
      var alt = image ? image.getAttribute("alt") || "" : "";

      return alt.replace(/\s*swatch$/i, " shown close up");
    }

    function labelFor(fabric) {
      var button = buttonFor(fabric);

      return button ? button.dataset.label || fabric : fabric;
    }

    function absoluteSource(source) {
      try {
        return new URL(source, document.baseURI).href;
      } catch (error) {
        return source;
      }
    }

    function preloadTexture(source) {
      var absolute = absoluteSource(source);

      if (!source) {
        return null;
      }

      if (preloaded[absolute]) {
        return preloaded[absolute];
      }

      var image = new Image();
      image.decoding = "async";
      image.src = source;
      preloaded[absolute] = image;

      return image;
    }

    /* 큰 사진 두 장을 같은 자리에 겹쳐 두고 앞뒤 레이어를 바꾼다.
       새 이미지가 아직 준비되지 않았으면 현재 사진을 그대로 유지해 빈 프레임이
       생기지 않는다. 준비되는 순간 opacity + 미세 scale 전환만 실행한다. */
    function swapTexture(source, alt) {
      if (!source) {
        return;
      }

      var current = textureImages[visibleTextureIndex];

      if (absoluteSource(current.getAttribute("src")) === absoluteSource(source)) {
        textureFrame.setAttribute("aria-label", alt);
        return;
      }

      var token = ++textureToken;
      var preload = preloadTexture(source);

      function apply() {
        if (token !== textureToken) {
          return;
        }

        var nextIndex = visibleTextureIndex === 0 ? 1 : 0;
        var next = textureImages[nextIndex];
        var previous = textureImages[visibleTextureIndex];

        next.classList.remove("is_visible");
        next.src = source;

        /* 브라우저 캐시에 파일이 있어도 디코딩이 끝나기 전에 opacity를 올리면
           한 프레임 비어 보일 수 있다. 새 레이어의 decode가 끝날 때까지 기존
           레이어를 그대로 유지한 뒤 두 class를 같은 프레임에 바꾼다. */
        function reveal() {
          if (token !== textureToken) {
            return;
          }

          void next.offsetWidth;

          window.requestAnimationFrame(function () {
            if (token !== textureToken) {
              return;
            }

            next.classList.add("is_visible");
            previous.classList.remove("is_visible");
            visibleTextureIndex = nextIndex;
            textureFrame.setAttribute("aria-label", alt);
          });
        }

        if (typeof next.decode === "function") {
          next.decode().then(reveal).catch(reveal);
        } else if (next.complete) {
          reveal();
        } else {
          next.addEventListener("load", reveal, { once: true });
          next.addEventListener("error", reveal, { once: true });
        }
      }

      if (!preload || (preload.complete && preload.naturalWidth > 0)) {
        apply();
        return;
      }

      preload.addEventListener("load", apply, { once: true });
      /* 에셋 경로가 잘못된 경우에도 무한 대기하지 않는다. 현재 사진은 남기고
         aria-label만 선택한 원단으로 갱신해 문제를 숨기지 않는다. */
      preload.addEventListener(
        "error",
        function () {
          if (token === textureToken) {
            textureFrame.setAttribute("aria-label", alt);
          }
        },
        { once: true }
      );
    }

    function centerMobileSwatch(swatch) {
      if (!swatch || !window.matchMedia("(max-width: 767px)").matches) {
        return;
      }

      swatch.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "nearest",
        inline: "center"
      });
    }

    function setActiveFabric(fabric, shouldCenter) {
      if (!fabric || fabric === activeFabric) {
        return;
      }

      var activeIndex = -1;

      swatches.forEach(function (swatch, index) {
        var isMatch = fabricOf(swatch) === fabric;
        var button = swatch.querySelector(".materials_swatch_button");

        swatch.classList.toggle("is_active", isMatch);

        if (button) {
          button.setAttribute("aria-pressed", isMatch ? "true" : "false");
        }

        if (isMatch) {
          activeIndex = index;
        }
      });

      if (activeIndex < 0) {
        return;
      }

      activeFabric = fabric;

      captionItems.forEach(function (item) {
        var isMatch = item.dataset.fabric === fabric;

        item.classList.toggle("is_active", isMatch);
        item.setAttribute("aria-hidden", isMatch ? "false" : "true");
      });

      var label = labelFor(fabric);

      if (status) {
        status.textContent = label + " selected";
      }

      swapTexture(sourceFor(fabric), altFor(fabric));

      if (shouldCenter) {
        centerMobileSwatch(swatches[activeIndex]);
      }
    }

    /* hover나 단순 focus 이동은 선택을 바꾸지 않는다. Enter/Space는 button의
       click을 발생시키므로 키보드·터치·마우스가 모두 이 한 경로를 공유한다. */
    section.addEventListener("click", function (event) {
      var button = event.target.closest
        ? event.target.closest(".materials_swatch_button[data-fabric]")
        : null;

      if (button && section.contains(button)) {
        setActiveFabric(button.dataset.fabric, true);
      }
    });

    var initial = swatches.filter(function (swatch) {
      return swatch.classList.contains("is_active");
    })[0] || swatches[0];

    activeFabric = fabricOf(initial);

    /* 썸네일과 큰 사진은 같은 URL을 쓰므로 브라우저 캐시를 그대로 활용한다.
       idle 시점에 여섯 장의 디코딩을 시작해 첫 클릭에서 빈 프레임이 생길 확률을
       낮추되, 페이지 초기 렌더링보다 먼저 실행하지는 않는다. */
    function primeTextures() {
      swatches.forEach(function (swatch) {
        preloadTexture(sourceFor(fabricOf(swatch)));
      });
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(primeTextures, { timeout: 1800 });
    } else {
      window.setTimeout(primeTextures, 300);
    }
  }

  /* ---------------------------------------------------------
     hero — 카피 → 화면 폭을 채운 영상 → 스크롤하면 영상이 빠르게 사라지고
     그 위로 아이보리 배너(= philosophy 섹션)가 올라온다. (2026-08-10)

     ★ **이 함수가 하는 일은 영상 페이드 하나뿐이다.**
     배너가 올라오는 것은 JS가 아니라 CSS가 만든다 — 영상 무대가 sticky이고
     philosophy에 음수 margin-top이 걸려 있어서, philosophy가 **그냥 스크롤로**
     고정된 영상 위를 덮으며 올라온다. 자세한 구조는 css의
     `--bespoke_hero_run` / `--bespoke_hero_lift` 주석에 있다.

     그래서 배너 위치를 JS로 건드리면 안 된다. philosophy에 transform을 걸면
     레이아웃은 그대로인데 그림만 움직여서 **아래 atelier와 어긋난다.**

     무대 고정은 CSS sticky다(ScrollTrigger `pin` 아님). pin을 쓰면 pin-spacer가
     문서 맨 위에 끼어들어 아래 모든 섹션의 좌표가 밀린다.

     ★ 게이트가 **폭이 아니라 화면 비율**을 본다(2026-08-10).
     세로로 긴 화면에서는 css가 영상 상자를 16:9로 되돌린다 — 자막이 좌우로
     잘리지 않게 하기 위해서다(css 쪽 주석 참고). 그때 상자는 한 화면 높이가
     아니므로 sticky 무대가 성립하지 않는다(무대 아래에 빈 자리가 생긴다).
     그래서 그 구간에서는 이 연출을 통째로 끄고 카피 → 영상 → philosophy가
     평범하게 이어지게 둔다.

     ★ 경계값이 css의 `max-aspect-ratio: 1332/1000`과 **겹치지 않아야 한다.**
     둘 다 `4/3`으로 두면 정확히 1024 × 768 같은 화면에서 css는 16:9 상자를,
     js는 sticky 무대를 만들어 서로 어긋난다.

     JS나 GSAP이 없거나 모션 감소 설정이면 class가 붙지 않고, 세 덩이가 그냥
     세로로 이어진 채 평범하게 스크롤된다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자 두 벌이다. 전환 **길이**는 css의 `--bespoke_hero_run`이 정하고,
     아래 값들은 그 안에서(진행도 0~1) 두 박자가 언제 일어나는지를 정한다.

     ┌ 0.00 ───────── 영상만. 아무 변화 없음
     ├ 0.10 ───────── 배경이 가운데에서 먹물처럼 번지기 시작
     ├ 0.62 ───────── 배경이 화면을 다 덮음 → philosophy_title 등장
     ├ 0.82 ───────── philosophy_desc 등장
     └ 1.00 ───────── 끝

     ★ 영상에는 트윈이 하나도 없다(css 주석 참고). 스크롤 진행도는 philosophy에만
     연결된다. 그래서 번지는 내내 뒤 영상이 **온전히 그대로** 보이고,
     덮이지 않은 자리에도 빈 화면이 생기지 않는다. */

  /* ── 먹물 마스크 ────────────────────────────────────────────────────
     `clip-path: circle()`을 버린 이유는 css 주석에 있다(경계가 너무 또렷했다).

     중심이 조금씩 어긋난 radial-gradient 네 겹을 겹쳐 쓴다. 마스크 레이어는
     기본이 `add` 합성이라 넷의 **합집합**이 되고, 가장자리가 한 겹씩 어긋나
     원이 아니라 불규칙한 덩어리로 퍼진다.

     ★ `circle` 그라디언트의 `%`는 기본 크기가 `farthest-corner`라
     **100%가 곧 화면 모서리까지의 거리**다. 그래서 가운데 겹의 진한 부분이
     100%에 닿으면 화면이 정확히 다 덮인다.

     ★ 진한 정지점을 `r − FEATHER`로 두는 것이 핵심이다. 그냥 `r`부터 흐리게
     두면 **r = 0일 때도 가운데에 옅은 점이 이미 보인다.** 음수에서 시작하면
     처음에 완전히 투명하다. */
  var HERO_INK_FEATHER = 16; /* 번짐 폭(%). 키우면 더 뿌옇게 퍼진다 */
  /* 마스크를 다시 칠하는 최소 간격(%). `paintInk()` 주석 참고 —
     0.2%는 이 화면에서 약 2px이라 눈에 안 보이고, 다시 칠하는 횟수를 줄인다. */
  var HERO_INK_STEP = 0.2;
  var HERO_INK_LOBES = [
    { x: 50, y: 50, k: 1 },
    { x: 41, y: 57, k: 0.86 },
    { x: 60, y: 44, k: 0.9 },
    { x: 47, y: 37, k: 0.8 }
  ];
  /* 가운데 겹의 진한 부분이 100%에 닿는 값 = 100 + FEATHER. */
  var HERO_INK_END = 100 + HERO_INK_FEATHER;

  /* ★ 아래 네 구간은 **전환 전체(run)를 1로 본 비율**이다. run이 길어지면
     같은 비율이라도 그만큼 천천히 진행된다 — 속도 조절은 css의
     `--bespoke_hero_run`과 이 비율, 둘을 같이 봐야 한다.

     같은 요청("퍼지는 속도가 너무 빠르다")으로 **두 번** 늘렸다.
     두 번 모두 방법이 같다 — run을 늘리고 **글·붙잡기 구간의 비율을 그만큼
     줄여서**, 늘어난 거리가 전부 번짐에만 가도록 한다. 그래서 번짐만 느려지고
     글 등장 속도와 붙잡는 시간은 거의 그대로다.

     | | run 80svh | run 120svh | **run 150svh (지금)** |
     |---|---|---|---|
     | 준비 | — | 0.05 × 120 = 6svh | 0.04 × 150 = **6svh** (동일) |
     | **번짐** | 0.52 × 80 = **41.6svh** | 0.49 × 120 = **58.8svh** | **0.59 × 150 = 88.5svh** |
     | 제목 | 0.18 × 80 = 14.4svh | 0.12 × 120 = 14.4svh | 0.10 × 150 = **15svh** |
     | 사이 | — | 0.02 × 120 = 2.4svh | 0.02 × 150 = **3svh** |
     | 설명 | 0.18 × 80 = 14.4svh | 0.12 × 120 = 14.4svh | 0.10 × 150 = **15svh** |
     | 붙잡아 두기 | 없음 | 0.20 × 120 = 24svh | 0.15 × 150 = **22.5svh** |

     번짐이 58.8 → 88.5svh로 **약 1.5배 더 느려졌고**, 글 두 덩이는 14.4 → 15svh
     (+4%)로 사실상 그대로다.

     ★★ **run은 css에 있고 두 군데다.** `--bespoke_hero_run`은 파일 끝 1840
     줌 보정 블록에서 다시 선언된다 — 한쪽만 고치면 1920에서만 옛 속도로 남는다
     (실제로 겪은 적 있다). 이 표를 고칠 때 **두 곳을 항상 같이** 확인할 것.

     ★ 더 느리게 하려면: run을 키우고 글·붙잡기 비율을 그 비율만큼 줄인다
     (절대 svh가 유지되도록). 번짐 구간만 늘어난다.
     ★ 다른 방법: 아래 `HERO_REVEAL_EASE`를 `power1.out`으로 낮추면 **초반에
     확 퍼지는 느낌**이 줄어든다(거리는 그대로). power2.out은 시작 속도가 평균의
     3배라 "확" 퍼지는 인상의 상당 부분이 여기서 온다. */
  var HERO_REVEAL_START = 0.04;
  var HERO_REVEAL_END = 0.63;
  var HERO_REVEAL_EASE = "power2.out"; /* 처음에 확 번지고 끝에서 잦아든다 */

  /* ── 글 ─────────────────────────────────────────────────────────────
     배경이 다 퍼진 **뒤에** 제목, 그다음 설명이다(사용자 요청 순서).
     둘 다 philosophy 안에 있어 마스크에 함께 잘리므로, 이 시점엔 이미
     마스크가 화면을 덮고 있어야 글이 온전히 보인다. */
  var HERO_TITLE_START = 0.63;
  var HERO_TITLE_END = 0.73;
  var HERO_TITLE_RISE = 24; /* px */
  var HERO_TITLE_SCALE = 1.02;

  var HERO_DESC_START = 0.75;
  var HERO_DESC_END = 0.85;
  var HERO_DESC_RISE = 20; /* px */

  /* ★★ 0.85 ~ 1.0 = **붙잡아 두는 구간**이다 (2026-08-10 사용자 요청:
     "글씨들이 다 나오면 한번 픽스 되었다가 스크롤이 내려갈 수 있도록").

     여기에는 트윈이 하나도 없다. 그런데도 배너가 화면에 붙어 있는 이유는
     아래 ①의 상쇄 트윈이 **타임라인 전체(duration 1)에 걸쳐** 자연 스크롤을
     계속 지우기 때문이다. 그래서 이 구간에서는 글이 전부 뜬 그림 그대로
     화면이 멈춰 있고, 진행도 1에 닿는 순간 sticky가 풀리며 흘러간다.

     ★ 길이를 조절하려면 `HERO_DESC_END`만 내리면 된다(0.80으로 내리면 더 오래
     붙잡는다). **①의 duration은 1로 두어야 한다** — 줄이면 그만큼 상쇄가
     일찍 끝나서, 남은 구간에서 배너가 스크롤을 따라 그대로 밀려 올라간다. */

  /* 스크롤 안내는 **영상이 다가올 때 떠서 philosophy가 지나갈 때까지 그대로
     떠 있다**(사용자 요청). 그래서 히어로 타임라인이 아니라 별도 트리거를 쓴다 —
     히어로 타임라인은 philosophy가 다 퍼지는 지점에서 끝나 버린다.
     아래 둘은 그 별도 구간(영상 진입 → philosophy 퇴장) 안에서의 비율이다. */
  var HERO_HINT_IN = 0.06;
  var HERO_HINT_OUT = 0.08;

  /* ── 헤더 색 ────────────────────────────────────────────────────────
     ★★ **`mask`는 `clip-path`와 달리 히트 테스트에 영향을 주지 않는다.**
     마스크로 안 보이는 자리에서도 `elementsFromPoint`는 philosophy를 잡는다.
     philosophy는 영상 위(z-index 1)라 그대로 두면 전환 시작부터 philosophy가
     먼저 잡혀 `main[data-header-theme="black"]`이 이겨 버린다 —
     **아직 화면을 채우고 있는 어두운 영상 위에 검은 로고**가 된다.

     그래서 philosophy 자신에게 `data-header-theme`을 붙이고 타임라인이 뒤집는다.
     기준은 감이 아니라 거리다: 헤더 띠의 좌우 표본점이 화면 중심에서
     모서리까지 거리의 약 80%에 있으므로, 마스크의 진한 반지름이 그 지점을
     넘으면 검정이다(아래 `HERO_HEADER_REACH`). */
  var HERO_HEADER_REACH = 82; /* % — 100%가 화면 모서리 */

  var HERO_GATE =
    "(min-width: 1280px) and (min-aspect-ratio: 1333/1000) and (prefers-reduced-motion: no-preference)";

  function initHeroTransition() {
    var section = document.querySelector(".bespoke_hero");

    if (!section) {
      return;
    }

    var stage = section.querySelector(".bespoke_hero_stage");
    var video = section.querySelector(".bespoke_hero_video");
    /* 배너는 새 요소가 아니라 **다음 섹션 자신**이다(사용자 결정).
       인접 형제로 집는다 — css의 `+ .philosophy` 규칙과 같은 관계다. */
    var banner = section.nextElementSibling;

    if (!stage || !video || !banner || !banner.classList.contains("philosophy") ||
        !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var title = banner.querySelector(".philosophy_title");
    var desc = banner.querySelector(".philosophy_desc");
    /* ★ 영상이 아니라 **섹션**에서 찾는다. 안내 표시는 무대의 쌓임 맥락을
       벗어나야 philosophy 위로 올라올 수 있어서 섹션 직계 자식이다(html 주석 참고).
       없어도 나머지는 그대로 돌아야 하므로 위 필수 요소들과 함께 묶지 않는다. */
    var hint = document.querySelector(".common_scroll_hint");

    if (!title || !desc) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* 먹물 마스크 문자열을 만든다. `r`은 0 → HERO_INK_END.
       진한 정지점이 `r − FEATHER`라 r = 0이면 네 겹 모두 완전히 투명하다. */
    function inkMask(r) {
      var layers = [];
      var index;

      for (index = 0; index < HERO_INK_LOBES.length; index += 1) {
        var lobe = HERO_INK_LOBES[index];
        var edge = r * lobe.k;

        layers.push(
          "radial-gradient(circle at " + lobe.x + "% " + lobe.y + "%, #000 " +
          (edge - HERO_INK_FEATHER).toFixed(2) + "%, transparent " +
          edge.toFixed(2) + "%)"
        );
      }

      return layers.join(", ");
    }

    /* 안내 표시가 화면 중심에서 얼마나 떨어져 있는지 — 모서리까지 거리를 100%로
       본 값이다. 먹물의 진한 반지름이 이 값을 넘으면 표시 뒤가 philosophy로 바뀐다.
       `position: fixed`라 스크롤과 무관하고, 창 크기가 바뀔 때만 다시 잰다. */
    var hintReach = 100;

    function measureHintReach() {
      if (!hint) {
        return 100;
      }

      var box = hint.getBoundingClientRect();
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      var corner = Math.sqrt(cx * cx + cy * cy);
      var dx = Math.max(Math.abs(box.left - cx), Math.abs(box.right - cx));
      var dy = Math.max(Math.abs(box.top - cy), Math.abs(box.bottom - cy));

      return corner ? (Math.sqrt(dx * dx + dy * dy) / corner) * 100 : 100;
    }

    /* ★★ 프레임마다 **바뀐 것만** 쓴다.

       예전에는 이 함수가 호출될 때마다 style 두 번 · `setAttribute` 한 번 ·
       `classList.toggle` 한 번을 무조건 실행했다. 값이 그대로여도 마찬가지였다.

       `data-header-theme`을 매 프레임 다시 쓰는 것이 특히 비쌌다 —
       `common.js`의 헤더 판정이 스크롤마다 `elementsFromPoint`와
       `getComputedStyle`로 이 속성을 되짚기 때문에, 속성이 계속 흔들리면
       스타일 재계산이 프레임마다 딸려 온다.

       `mask-image`는 합성만으로 처리되지 않아 **바뀔 때마다 화면 한 장을 다시
       칠한다.** 그래서 반지름을 아주 살짝 계단으로 만들어(HERO_INK_STEP) 값이
       실제로 달라졌을 때만 문자열을 새로 쓴다. 계단폭 0.2%는 이 화면에서
       약 2px이라 눈에 보이지 않고, 천천히 굴릴 때 다시 칠하는 횟수가 크게 준다.
       ★ 계단폭을 키우면 번짐이 눈에 띄게 끊긴다. */
    var lastMask = null;
    var lastTheme = null;
    var lastOnLight = null;

    function paintInk(r) {
      var stepped = Math.round(r / HERO_INK_STEP) * HERO_INK_STEP;
      var solid = stepped - HERO_INK_FEATHER;

      if (stepped !== lastMask) {
        var mask = inkMask(stepped);

        banner.style.webkitMaskImage = mask;
        banner.style.maskImage = mask;
        lastMask = stepped;
      }

      /* 마스크의 진한 반지름이 헤더 띠 표본점을 넘었는가 (위 주석 참고). */
      var theme = solid >= HERO_HEADER_REACH ? "black" : "white";

      if (theme !== lastTheme) {
        banner.setAttribute("data-header-theme", theme);
        lastTheme = theme;
      }

      /* 표시 자리까지 번졌으면 글자를 어둡게 — 안 그러면 밝은 배경에서 사라진다. */
      if (hint) {
        var onLight = solid >= hintReach;

        if (onLight !== lastOnLight) {
          hint.classList.toggle("is_on_light", onLight);
          lastOnLight = onLight;
        }
      }
    }

    gsap.matchMedia().add(HERO_GATE, function () {
      /* 무대를 sticky로 바꾸고 스크롤 구간을 여는 것이 이 class다.
         트리거를 만들기 전에 붙여야 섹션 높이를 제대로 잰다. */
      section.classList.add("is_hero_ready");

      if (hint) {
        hint.setAttribute("data-scroll-hint-mode", "custom");
        hint.classList.remove("is_visible");
      }

      /* ★★ philosophy를 끌어올려 두면(아래 ② 참고) **그 상태로 다른 트리거가
         길이를 잰다.** philosophy에는 자기 트리거가 넷(등장 둘 · 패럴랙스 · 퇴장)
         있는데, 전부 864px씩 어긋나 화면 밖에서 재생돼 버렸다(실측:
         `philosophy_body`가 76→1342. 정상은 890 언저리에서 시작한다).

         ScrollTrigger는 길이를 재기 직전에 `refreshInit`을 쏜다. 그때만 잠깐
         transform을 0으로 되돌려 두면 모두가 **원래 레이아웃 위치**를 잰다.
         재기가 끝나면 scrub이 현재 스크롤 위치의 값을 다시 씌운다. */
      function clearBannerShift() {
        gsap.set(banner, { y: 0 });
        /* 안내 표시 자리도 창 크기에 따라 달라지므로 같이 다시 잰다. */
        hintReach = measureHintReach();
      }

      window.ScrollTrigger.addEventListener("refreshInit", clearBannerShift);
      hintReach = measureHintReach();

      /* 먹물 트윈이 굴리는 값. 문자열은 `paintInk()`가 만든다 — GSAP이 gradient
         문자열을 직접 보간하게 두면 네 겹의 정지점이 제각각 해석될 수 있다.
         ★ 타임라인보다 **먼저** 선언해야 한다. 타임라인은 만들어지자마자 한 번
         그려질 수 있고, 그때 아래 onUpdate가 `ink`를 읽는다. */
      var ink = { r: 0 };

      paintInk(0); /* 첫 화면(전환 시작 전) 상태 */

      /* ★ 시작은 **무대** 윗변, 끝은 **섹션** 아랫변이다.
         − 시작: 섹션 윗변으로 잡으면 카피를 읽는 동안 이미 전환이 진행된다.
           무대 윗변이 화면 top에 닿는 순간 = 영상이 화면을 꽉 채우는 순간이다.
         − 끝: `endTrigger`로 섹션 아랫변을 쓰면 **sticky가 풀리는 지점과 자동으로
           같아진다.** 예전처럼 `"+=100%"` 같은 숫자로 적으면 css의 run 값과
           한 쌍이 되어, 한쪽만 고쳤을 때 조용히 어긋난다(실제로 겪었다). */
      var timeline = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          endTrigger: section,
          end: "bottom bottom",
          /* ★★★ `scrub: true`여야 한다 — 숫자(0.3)를 쓰면 배너가 출렁인다.
             2026-08-10 "스크롤할 때 울렁거린다"의 원인이 정확히 이것이었다.

             아래 ①은 **자연 스크롤을 상쇄해서** philosophy를 화면 top 0에 붙여
             두는 트윈이다. 상쇄가 성립하려면 트윈에 적용된 진행도가 스크롤에서
             나온 진행도와 **같은 프레임에 같은 값**이어야 한다.

             숫자 scrub은 진행도를 목표값으로 그 시간 동안 따라가게 만든다.
             그래서 스크롤하는 동안 적용값이 뒤처지고, 그 차이가 그대로 어긋남이 된다:

                 어긋남(px) = run × (적용 진행도 − 스크롤 진행도)

             이 화면에서 run이 **720px**이다. 초당 1000px으로 굴리면 진행도가
             초당 1.39씩 변하므로 0.3초 상수에서 진행도 차이가 0.2 언저리가 되고,
             **100px이 넘게 밀린다.** 멈추면 0으로 되돌아온다 — 이것이 "출렁"이다.

             게다가 영상은 `position: sticky`라 **지연이 0**이다. 배너만 늦으니
             둘이 서로 미끄러지고, 번지는 중심도 화면 중심에서 벗어난다.

             `scrub: true`는 스크롤 위치에서 진행도를 곧바로 낸다. 부드러움은
             Lenis가 이미 스크롤 자체를 다듬어서 그대로 남는다 —
             **없어지는 것은 부드러움이 아니라 어긋남뿐이다.**
             ★ 숫자로 되돌리지 마세요. 그 순간 출렁임이 그대로 돌아옵니다. */
          scrub: true,
          /* ★★ 이 트리거를 **맨 나중에** 재게 한다.

             아래 ①이 philosophy에 `y`를 씌우는데, philosophy에는 자기 트리거가
             넷(등장 둘 · 패럴랙스 · 퇴장) 따로 있다. 그것들이 **끌어올려진
             상태에서 길이를 재면** 전부 run(이 화면에서 720px)만큼 어긋난다.

             `refreshInit` 훅이 재기 직전에 y를 0으로 되돌리지만, 그것만으로는
             부족하다 — 이 트리거가 자기 차례에 값을 **다시 씌운 뒤** philosophy
             트리거가 측정되면 그때는 이미 어긋나 있다. `scrub: true`로 바꾸면서
             값이 그 자리에서 곧바로 적용되기 때문에 이 순서가 실제로 드러났다
             (실측: philosophy 구간이 473~2273 → **−247~1553**으로 720 밀렸다).

             우선순위를 낮추면 philosophy 트리거들이 **먼저**(y가 0인 상태에서)
             재고, 이 트리거는 그 뒤에 잰다. 이 트리거가 재는 대상(무대·섹션)에는
             transform이 없어서 순서가 뒤로 밀려도 자기 값은 정확하다.
             main.js의 `brand_word_pin`이 같은 이유로 쓰는 방법이다. */
          refreshPriority: -1,
          /* 아래 `y` 함수값을 창 크기가 바뀔 때 다시 읽게 한다. */
          invalidateOnRefresh: true
        },

        /* ★ 마스크는 **타임라인 onUpdate**가 칠한다(먹물 트윈의 onUpdate가 아니다).
           트윈 자신의 콜백에 두면 재생 구간(0.10~0.62) 밖에서는 호출되지 않아,
           전환을 지나쳤다가 위로 되감았을 때 **마스크가 마지막 값(다 퍼진 상태)에
           그대로 굳는다**(실측: 진행도 0인데 100%였다).
           타임라인 onUpdate는 어느 지점이든 다시 그릴 때마다 호출된다. */
        onUpdate: function () {
          paintInk(ink.r);
        }
      });

      /* ── ① philosophy: 화면에 붙여 둔다 ───────────────────────────────
         ★★ 이것이 **번지는 중심 = 화면 중심**을 보장하는 장치다.

         philosophy는 음수 margin 덕분에 전환 구간에 겹쳐 있지만, 그대로 두면
         스크롤을 따라 `run`px만큼 **올라간다.** 그러면 마스크의 기준점(요소 중심)이
         매 프레임 움직여서, 화면 한가운데에서 번지는 것으로 보이지 않는다.

         `y`를 `−run → 0`으로 **선형(ease:"none")** 이동시키면 자연 스크롤을 정확히
         상쇄해 전환 내내 화면 top 0에 붙어 있다. philosophy 높이가 정확히
         100svh라 이때 **요소 상자 = 뷰포트 상자**이고, `at 50% 50%`가 곧 화면
         중심 = 영상이 사라진 그 점이 된다. 끝에서 y=0이라 잔여 오프셋이 없어
         아래 atelier와도 어긋나지 않는다.

         ★ 값이 함수인 이유: `y`는 **CSS px**이고 스크롤은 화면 px이라 zoom 구간
         (0.75)에서 둘이 다르다. `무대 높이 − 영상 높이`가 정확히 활주로 길이이고
         둘 다 계산된 CSS px이라 그대로 뺀다. 이러면 css에서 `--bespoke_hero_run`을
         바꿔도 js를 고칠 필요가 없다.
         `invalidateOnRefresh`가 창 크기 변경 때 다시 읽는다. */
      timeline.fromTo(
        banner,
        {
          y: function () {
            var view = window.getComputedStyle;

            return -(
              parseFloat(view(stage).height) - parseFloat(view(video).height)
            );
          }
        },
        { y: 0, ease: "none", duration: 1 },
        0
      );

      /* ── ② 배경: 가운데에서 먹물처럼 번진다 ─────────────────────────
         값 자체는 프록시 객체에 굴리고, 매 프레임 마스크 문자열을 다시 만든다.
         GSAP이 gradient 문자열을 보간하게 두면 네 겹의 정지점이 제각각
         해석될 수 있어서, 숫자 하나만 굴리고 문자열은 우리가 만든다. */
      timeline.to(
        ink,
        {
          r: HERO_INK_END,
          ease: HERO_REVEAL_EASE,
          duration: HERO_REVEAL_END - HERO_REVEAL_START
        },
        HERO_REVEAL_START
      );

      /* ── ③ 제목: 배경이 다 퍼진 뒤 가운데에서 뜬다 ─────────────────── */
      timeline.fromTo(
        title,
        { opacity: 0, y: HERO_TITLE_RISE, scale: HERO_TITLE_SCALE },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power2.out",
          duration: HERO_TITLE_END - HERO_TITLE_START
        },
        HERO_TITLE_START
      );

      /* ── ④ 설명: 가장 마지막에 스르륵 ──────────────────────────────── */
      timeline.fromTo(
        desc,
        { opacity: 0, y: HERO_DESC_RISE },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          duration: HERO_DESC_END - HERO_DESC_START
        },
        HERO_DESC_START
      );

      /* 타임라인 길이를 정확히 1로 고정한다. 위 구간 상수가 곧 진행도가 된다. */
      timeline.to({}, { duration: 1 }, 0);

      /* ── ⑤ 스크롤 안내 ────────────────────────────────────────────────
         ★ 위 타임라인에 태우지 않는다. 그 타임라인은 philosophy가 다 퍼지는
         지점에서 끝나는데, 안내는 **philosophy가 지나갈 때까지** 떠 있어야 한다
         (사용자 요청). 그래서 시작은 무대, 끝은 philosophy 아랫변으로 잡은
         별도 구간을 쓴다. `position: fixed`라 그 사이 내내 같은 자리에 있다. */
      if (hint) {
        /* ★★ 끝 기준을 philosophy가 아니라 **그 다음 섹션**으로 잡는다.
           philosophy는 위 ①이 `y`로 끌어올려 둔 상태라, 그것을 endTrigger로 쓰면
           **끌어올린 위치로 길이를 잰다** — 실측에서 구간이 `−252→1206`으로
           864px 짧게 나왔다(정상은 2232에서 끝난다).
           `refreshInit` 훅이 잠깐 y를 0으로 되돌리지만, 그 뒤 히어로 트리거가
           자기 값을 다시 씌운 다음에 이 트리거가 측정되는 순서라 소용이 없다.
           다음 섹션(atelier)은 transform이 없어 항상 제 위치를 잰다. */
        var afterBanner = banner.nextElementSibling;

        var hintTimeline = gsap.timeline({
          scrollTrigger: {
            /* 영상이 화면을 꽉 채우는 순간부터 보인다. 더 일찍 잡으면 크림색
               카피 위에 크림색 글자가 놓여 아무것도 안 보인다. */
            trigger: stage,
            start: "top top",
            endTrigger: afterBanner || banner,
            end: afterBanner ? "top 30%" : "bottom 30%",
            scrub: 0.3
          }
        });

        hintTimeline.fromTo(
          hint,
          { opacity: 0 },
          { opacity: 1, ease: "none", duration: HERO_HINT_IN },
          0
        );

        hintTimeline.to(
          hint,
          { opacity: 0, ease: "none", duration: HERO_HINT_OUT },
          1 - HERO_HINT_OUT
        );

        hintTimeline.to({}, { duration: 1 }, 0);
      }

      /* ★ GSAP은 자기가 넣은 인라인 스타일만 되돌린다. 마스크와 헤더 속성은
         우리가 직접 쓴 것이라 손으로 지운다 — 안 지우면 모션 감소로 바꿨을 때
         philosophy가 마스크에 잘린 채, 헤더가 굳은 채 남는다. */
      return function () {
        window.ScrollTrigger.removeEventListener("refreshInit", clearBannerShift);
        section.classList.remove("is_hero_ready");
        banner.style.webkitMaskImage = "";
        banner.style.maskImage = "";
        banner.removeAttribute("data-header-theme");

        /* ★ 위 `paintInk()`의 "바뀐 것만 쓴다" 캐시를 반드시 비운다.
           방금 실제 값을 지웠으므로 캐시를 남겨 두면, 창 크기를 되돌려 이
           구간에 다시 들어왔을 때 `paintInk(0)`이 "그대로네" 하고 건너뛴다 —
           마스크가 안 걸린 채로 philosophy가 처음부터 다 보인다. */
        lastMask = null;
        lastTheme = null;
        lastOnLight = null;

        if (hint) {
          hint.classList.remove("is_on_light");
          hint.removeAttribute("data-scroll-hint-mode");
          hint.style.opacity = "";
          window.dispatchEvent(new Event("scroll"));
        }
      };
    });
  }

  /* ---------------------------------------------------------
     atelier 스토리 무대 — 사진이 왼쪽에서 들어와 화면 가운데로 이동하고,
     안착한 뒤 왼쪽에 글이 떠오른다. (레퍼런스: tarubali.com)

     **1280px 이상 + 모션 감소 아님**에서만 켜진다. 그 밖에서는 이 함수가
     아무것도 하지 않고, 시안 그대로 사진 위 · 글 아래로 쌓인다.

     무대 고정은 CSS sticky다(ScrollTrigger pin 아님) — pin-spacer가 끼면
     아래 quote·process의 문서 좌표가 전부 밀린다.

     타임라인 길이를 정확히 1로 맞춰 두어서, 아래 구간 상수가 곧 스크롤
     진행도가 된다. scrub이라 빠르게 굴리거나 위로 되감아도 값이 꼬이지
     않는다 — 스크롤 위치에서 매번 다시 계산되기 때문이다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var ATELIER_STORY_GATE = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";
  var ATELIER_STORY_RISE = 48; /* 사진이 아래에서 올라오는 거리(px) */
  var ATELIER_STORY_FROM_SCALE = 0.94; /* 등장 시작 배율 */
  var ATELIER_STORY_TEXT_RISE = 32; /* 글이 아래에서 올라오는 거리(px) */
  var ATELIER_STORY_TEXT_SPREAD = 0.1; /* 오른쪽 글 덩이 사이의 시차(진행도) */

  /* 구간 — 전체 스크롤을 1로 봤을 때의 위치다.
     사진(가운데) → 제목(왼쪽) → 설명(오른쪽) 순으로 자리를 잡는다.
     ★ 사진은 **처음부터 화면 정중앙**에서 떠오른다. 왼쪽에서 가운데로
     옮기던 이전 버전은 사용자 결정으로 걷어냈다 — 양옆이 글 자리라
     사진이 지나가면 글 위를 덮는다. */
  var ATELIER_STORY_ENTER_END = 0.4;
  var ATELIER_STORY_HEAD_START = 0.34;
  var ATELIER_STORY_HEAD_END = 0.62;
  var ATELIER_STORY_TEXT_START = 0.52;
  var ATELIER_STORY_TEXT_END = 0.88;
  /* ★ "top top"이 아니다. 위 philosophy가 화면을 빠져나가는 동안 이 섹션이
     아래에서 올라오는데, 사진이 무대 한가운데 있어서 **화면에 실제로 보이기
     시작하는 시점**이 섹션 윗변이 화면 40%에 닿을 무렵이다. 그때부터 페이드를
     시작해야 빈 구간 없이 이어진다. "top top"으로 두면 그 앞 400px가 빈 화면이 된다.
     (2026-08-10 wordmark 제거 전에는 그 무대가 밀려 나가는 구간과 겹쳤다.) */
  var ATELIER_STORY_START = "top 40%";

  function initAtelierStory() {
    var section = document.querySelector(".atelier");

    if (!section) {
      return;
    }

    var stage = section.querySelector(".atelier_stage");
    var image = section.querySelector(".atelier_image");
    var head = section.querySelector(".atelier_head");
    var parts = section.querySelectorAll(".atelier_body > *");

    if (!stage || !image || !head || !parts.length || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.matchMedia().add(ATELIER_STORY_GATE, function () {
      /* 무대 레이아웃(sticky · 3열 그리드 · 가운데 사진)을 여는 것이 이 class다.
         트리거를 만들기 전에 붙여야 섹션 높이와 무대 폭을 제대로 잰다. */
      section.classList.add("is_story_ready");

      var timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: ATELIER_STORY_START,
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true /* 창이 바뀌면 시작값을 다시 잰다 */
        }
      });

      /* Phase 1 — 사진이 화면 정중앙에서 떠오른다.
         가로 위치는 그리드가 잡아 주므로 x를 건드리지 않는다. */
      timeline.fromTo(
        image,
        { opacity: 0, scale: ATELIER_STORY_FROM_SCALE, y: ATELIER_STORY_RISE },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: ATELIER_STORY_ENTER_END,
          ease: "power2.out"
        },
        0
      );

      /* Phase 2 — 왼쪽 제목이 떠오른다. 사진이 거의 자리를 잡을 무렵 시작해
         조금 겹친다(0.34 < 0.4). */
      timeline.fromTo(
        head,
        { opacity: 0, y: ATELIER_STORY_TEXT_RISE },
        {
          opacity: 1,
          y: 0,
          duration: ATELIER_STORY_HEAD_END - ATELIER_STORY_HEAD_START,
          ease: "power2.out"
        },
        ATELIER_STORY_HEAD_START
      );

      /* Phase 3 — 오른쪽 설명이 위에서부터 차례로 떠오른다.

         ★ `stagger`를 쓰지 않고 덩이마다 트윈을 따로 만든다.
         staggered fromTo를 scrub 타임라인에 넣으면 **첫 대상만** 시작 상태를
         유지하고 나머지는 자기 차례가 오기 전까지 원래 상태(opacity 1)로
         보인다. 실측에서 진행도 0에 meta가 이미 1이었다가 0.7에서 0으로
         **깜빡였다.** 트윈을 나누면 각자 자기 시작 상태를 지킨다. */
      var partList = Array.prototype.slice.call(parts);
      var textStep =
        ATELIER_STORY_TEXT_SPREAD / Math.max(1, partList.length - 1);
      var textDuration =
        ATELIER_STORY_TEXT_END -
        ATELIER_STORY_TEXT_START -
        ATELIER_STORY_TEXT_SPREAD;

      partList.forEach(function (part, index) {
        timeline.fromTo(
          part,
          { opacity: 0, y: ATELIER_STORY_TEXT_RISE },
          {
            opacity: 1,
            y: 0,
            duration: textDuration,
            ease: "power2.out"
          },
          ATELIER_STORY_TEXT_START + textStep * index
        );
      });

      /* Phase 4 — 완성된 구도를 눈에 남기는 여백.
         빈 트윈이지만 타임라인 길이를 1로 맞추는 역할을 한다. 이게 없으면
         타임라인이 0.88에서 끝나 위 구간 상수와 실제 진행도가 어긋난다. */
      timeline.to({}, { duration: 1 - ATELIER_STORY_TEXT_END }, ATELIER_STORY_TEXT_END);

      return function () {
        section.classList.remove("is_story_ready");
      };
    });
  }

  /* ---------------------------------------------------------
     begin 카드 + 핀 — 눌러서 상세 내용을 열어 둔다

     레퍼런스는 shop_detail의 `.look_pin`이다. 그쪽 동작을 그대로 따른다:
     · 같은 핀을 다시 누르면 닫힌다
     · 다른 핀을 누르면 앞의 것이 닫힌다(한 번에 하나)
     · Escape로 전부 닫힌다
     · 열림 상태는 class + `aria-expanded`로만 표현한다

     **CSS가 모든 시각 변화를 맡는다.** 여기서는 class만 붙였다 뗀다.
     인라인 스타일을 쓰지 않으므로 이 섹션에 GSAP이 나중에 붙어도
     같은 속성을 두고 다투지 않는다(현재 begin에는 GSAP이 없다).

     hover는 CSS `:hover`가 따로 처리하고, 이 class는 그것과 독립이다.
     그래서 hover → click → 마우스 벗어남 순서에서도 열린 상태가 남는다.
     --------------------------------------------------------- */

  function initBeginCards() {
    var pins = Array.prototype.slice.call(document.querySelectorAll(".begin_card_pin"));

    if (!pins.length) {
      return;
    }

    /* 열림일 때 `−`. 레퍼런스는 글자 그대로 `+`를 쓰므로 여기서도 글자를 바꾼다.
       읽어 주는 이름은 `aria-expanded`가 맡으므로 글자는 `aria-hidden`이다.

       ★ 닫힘일 때 글 안쪽 링크의 `tabindex`를 −1로 내린다.
       글이 `opacity: 0`으로만 숨겨져 있어서, 이걸 하지 않으면 **보이지 않는
       버튼·링크가 Tab 순서에 남는다.** shop_detail의 `.look_product`가
       `cardLink.tabIndex = shouldOpen ? 0 : -1`로 하는 것과 같은 처리다. */
    function setOpen(pin, shouldOpen) {
      var card = pin.closest(".begin_card");
      var glyph = pin.querySelector(".begin_card_pin_glyph");
      var content = card ? card.querySelector(".begin_card_content") : null;

      if (card) {
        card.classList.toggle("is_open", shouldOpen);
      }

      pin.setAttribute("aria-expanded", String(shouldOpen));

      if (glyph) {
        glyph.textContent = shouldOpen ? "−" : "+"; /* − (minus sign) */
      }

      if (content) {
        content.setAttribute("aria-hidden", String(!shouldOpen));

        var link = content.querySelector(".begin_card_link");

        if (link) {
          link.tabIndex = shouldOpen ? 0 : -1;
        }
      }
    }

    pins.forEach(function (pin) {
      pin.addEventListener("click", function () {
        var wasOpen = pin.getAttribute("aria-expanded") === "true";

        /* 하나만 열어 둔다 — 나머지는 접는다. */
        pins.forEach(function (item) {
          setOpen(item, item === pin && !wasOpen);
        });
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }

      pins.forEach(function (pin) {
        setOpen(pin, false);
      });
    });

    /* 시작은 전부 닫힘. 마크업의 `aria-expanded="false"`와 맞추고,
       숨어 있는 링크를 Tab 순서에서 빼 둔다. */
    pins.forEach(function (pin) {
      setOpen(pin, false);
    });
  }

  /* ★★ 모바일 주소창이 접히고 펴질 때 길이를 다시 재지 않는다.

     주소창이 오르내리면 `resize`가 발생하고, 기본 설정이면 ScrollTrigger가
     모든 구간을 다시 재면서 **스크롤 중에 시작·끝 지점이 갑자기 바뀐다** —
     화면이 한 번 툭 튄다. 세로 길이만 달라진 것이라 다시 잴 이유가 없다.

     css가 히어로 높이에 `svh`(작은 뷰포트 높이)를 쓰고 있어서 주소창 상태와
     무관하게 상자 크기가 고정이므로, 다시 재지 않아도 값이 맞는다.
     가로가 바뀌는 진짜 회전·창 크기 변경은 이 설정과 무관하게 그대로 다시 잰다. */
  if (window.ScrollTrigger && window.ScrollTrigger.config) {
    window.ScrollTrigger.config({ ignoreMobileResize: true });
  }

  initProcessSteps();
  initBeginCards();
  initMaterialsSelector();
  /* ★ philosophy 트리거를 **먼저** 만든다. 히어로가 philosophy에 transform을
     걸기 때문에, 순서를 뒤집으면 첫 측정이 어긋난 상태에서 이뤄진다.
     (그 뒤의 refresh는 `refreshInit` 훅이 막아 준다 — 이건 첫 측정용이다.) */
  initPhilosophyMotion();
  initHeroTransition();
  // Compact Atelier is absent; do not create its former image/text triggers.
  initAtelierStory();

  /* 글 나누기는 **웹폰트가 적용된 뒤**에 해야 한다. 시스템 폰트로 재면 줄 폭이
     달라서 "글자로 나눠도 되는가" 판단이 뒤집힌다. 폰트를 못 기다리는
     환경에서는 바로 실행한다. */
  /* ★★ 글 나누기가 끝난 **뒤에** 구간을 다시 잰다.

     웹폰트가 늦게 적용되면 히어로 카피의 높이가 달라지고, 카피 높이가 곧
     전환이 시작되는 스크롤 위치다(무대 윗변이 화면 top에 닿는 지점).
     `initAtelierText()`가 글을 글자 단위로 쪼개는 것도 같은 종류의 변화다.

     ScrollTrigger가 그 전에 잰 값을 들고 있으면 시작·끝이 어긋난 채로 남고,
     나중에 무언가가 refresh를 부르는 순간 화면이 툭 튄다.
     여기서 한 번 명시적으로 다시 재면 그 창이 닫힌다. */
  function refreshTriggers() {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      refreshTriggers();
    });
  } else {
    refreshTriggers();
  }
})();
