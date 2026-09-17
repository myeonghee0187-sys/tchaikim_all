(function () {
  "use strict";

  var colorButtons = Array.prototype.slice.call(document.querySelectorAll(".color_swatch"));
  var sizeButtons = Array.prototype.slice.call(document.querySelectorAll(".size_button"));
  var colorName = document.getElementById("color_name");
  var addToCart = document.getElementById("add_to_cart");
  var purchaseMessage = document.getElementById("purchase_message");
  var purchaseDialog = document.getElementById("purchase_complete_dialog");
  var purchaseDialogClose = purchaseDialog && purchaseDialog.querySelector("[data-dialog-close]");

  function selectButton(buttons, selected) {
    buttons.forEach(function (button) {
      var isSelected = button === selected;
      button.classList.toggle("is_selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  colorButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectButton(colorButtons, button);
      colorName.textContent = button.getAttribute("data-color");
    });
  });

  sizeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectButton(sizeButtons, button);
      purchaseMessage.textContent = "";
      purchaseMessage.classList.remove("is_success");
    });
  });

  var sizeGuideToggle = document.getElementById("size_guide_toggle");
  var sizeGuidePanel = document.getElementById("size_guide_panel");
  var unitButtons = Array.prototype.slice.call(document.querySelectorAll(".size_unit_button"));

  function handleSizeGuideToggle() {
    var isOpen = sizeGuidePanel.classList.toggle("is_open");
    sizeGuideToggle.setAttribute("aria-expanded", String(isOpen));
  }

  if (sizeGuideToggle && sizeGuidePanel) {
    sizeGuideToggle.addEventListener("click", handleSizeGuideToggle);

    unitButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        selectButton(unitButtons, button);
        sizeGuidePanel.classList.toggle("is_unit_inch", button.getAttribute("data-unit") === "inch");
      });
    });
  }

  function closePurchaseDialog() {
    if (!purchaseDialog || !purchaseDialog.open) return;
    purchaseDialog.close();
  }

  if (addToCart && purchaseDialog) {
    addToCart.addEventListener("click", function () {
      purchaseMessage.textContent = "";
      purchaseDialog.showModal();
      document.documentElement.classList.add("has_purchase_modal");
      if (window.tchaikimmLenis) window.tchaikimmLenis.stop();
    });

    purchaseDialog.addEventListener("click", function (event) {
      if (event.target === purchaseDialog) closePurchaseDialog();
    });

    purchaseDialog.addEventListener("close", function () {
      document.documentElement.classList.remove("has_purchase_modal");
      if (window.tchaikimmLenis) window.tchaikimmLenis.start();
      addToCart.focus();
    });
  }

  if (purchaseDialogClose) {
    purchaseDialogClose.addEventListener("click", closePurchaseDialog);
  }

  Array.prototype.slice.call(document.querySelectorAll(".accordion_item > button")).forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".accordion_item");
      var isOpen = item.classList.toggle("is_open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  // 아코디언을 열고 닫아도 craft 섹션 높이가 변하지 않도록,
  // 모든 항목이 열린 상태의 높이를 미리 확보해 둡니다.
  // 폭마다 줄바꿈이 달라져 높이가 바뀌므로 고정 px 대신 그때그때 측정합니다.
  var accordion = document.querySelector(".detail_accordion");
  var accordionItems = Array.prototype.slice.call(document.querySelectorAll(".accordion_item"));

  function reserveAccordionSpace() {
    if (!accordion || !accordionItems.length) {
      return;
    }

    // On a phone, reserving every closed panel leaves a full empty screen.
    // Let the existing accordion expand naturally; Desktop retains its reserve.
    if (window.matchMedia("(max-width: 767px)").matches) {
      accordion.style.removeProperty("min-height");
      return;
    }

    var openedBefore = accordionItems.map(function (item) {
      return item.classList.contains("is_open");
    });

    accordion.classList.add("is_measuring");
    accordion.style.minHeight = "";
    accordionItems.forEach(function (item) {
      item.classList.add("is_open");
    });

    var fullHeight = accordion.getBoundingClientRect().height;

    accordionItems.forEach(function (item, index) {
      item.classList.toggle("is_open", openedBefore[index]);
    });
    accordion.style.minHeight = Math.ceil(fullHeight) + "px";
    accordion.classList.remove("is_measuring");
  }

  if (accordion) {
    reserveAccordionSpace();

    // 웹폰트가 늦게 적용되면 글자 높이가 달라지므로 다시 잽니다.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(reserveAccordionSpace);
    }

    // 폭이 바뀌면 줄바꿈이 달라져 필요한 높이도 달라집니다.
    // ResizeObserver와 window resize를 함께 씁니다. 어느 한쪽만으로 놓치는 경우가 없도록.
    var lastWidth = accordion.getBoundingClientRect().width;
    var resizeTimer = null;

    function handleLayoutChange() {
      var width = accordion.getBoundingClientRect().width;
      if (Math.round(width) === Math.round(lastWidth)) {
        return;
      }
      lastWidth = width;
      reserveAccordionSpace();
    }

    if (window.ResizeObserver) {
      new window.ResizeObserver(handleLayoutChange).observe(accordion);
    }

    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleLayoutChange, 150);
    });
  }

  var lookPins = Array.prototype.slice.call(document.querySelectorAll(".look_pin"));
  var lookCards = Array.prototype.slice.call(document.querySelectorAll("[data-look-card]"));

  // Compact art direction owns only a temporary stage; restore the original
  // desktop DOM and copy when crossing back over 1280px.
  (function initCompactLook() {
    var compactMedia = window.matchMedia("(max-width: 1279px)");
    var mobileMedia = window.matchMedia("(max-width: 767px)");
    var visual = document.querySelector(".look_visual");
    var materialCopy = document.querySelector(".craft_copy > p:not(.section_label)");
    var originalCopy = materialCopy ? materialCopy.innerHTML : "";
    var materialTitle = document.getElementById("craft_title");
    var originalTitle = materialTitle ? materialTitle.innerHTML : "";
    var stage = null;
    var placements = [];

    function syncLayout() {
      if (materialTitle) materialTitle.innerHTML = mobileMedia.matches
        ? "Craft held to a higher register" : originalTitle;
      if (materialCopy) materialCopy.innerHTML = mobileMedia.matches
        ? "From a third-generation weaving atelier in Gyeonggi-do, this 80-count silk-cotton blend balances structural weight with effortless movement. A matte depth recalls Joseon textiles, while pleated panels billow with the body."
        : originalCopy;
      if (!visual) return;
      if (compactMedia.matches && !stage) {
        stage = document.createElement("div");
        stage.className = "look_stage";
        visual.insertBefore(stage, visual.firstChild);
        [visual.querySelector(":scope > img")].concat(lookPins).filter(Boolean).forEach(function (node) {
          var marker = document.createComment("desktop look position");
          node.before(marker);
          placements.push([node, marker]);
          stage.appendChild(node);
        });
      } else if (!compactMedia.matches && stage) {
        placements.forEach(function (item) { item[1].replaceWith(item[0]); });
        placements = [];
        stage.remove();
        stage = null;
      }
    }
    compactMedia.addEventListener("change", syncLayout);
    mobileMedia.addEventListener("change", syncLayout);
    syncLayout();
  })();

  lookPins.forEach(function (pin) {
    pin.addEventListener("click", function () {
      var selectedLook = pin.getAttribute("data-look");
      var wasActive = pin.classList.contains("is_active");

      lookPins.forEach(function (item) {
        var shouldOpen = item === pin && !wasActive;
        item.classList.toggle("is_active", shouldOpen);
        item.setAttribute("aria-expanded", String(shouldOpen));
      });

      lookCards.forEach(function (card) {
        var shouldOpen = card.getAttribute("data-look-card") === selectedLook && !wasActive;
        card.classList.toggle("is_active", shouldOpen);
        card.setAttribute("aria-hidden", String(!shouldOpen));
        var cardLink = card.querySelector("a");
        if (cardLink) cardLink.tabIndex = shouldOpen ? 0 : -1;
      });
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    lookPins.forEach(function (pin) {
      pin.classList.remove("is_active");
      pin.setAttribute("aria-expanded", "false");
    });
    lookCards.forEach(function (card) {
      card.classList.remove("is_active");
      card.setAttribute("aria-hidden", "true");
      var cardLink = card.querySelector("a");
      if (cardLink) cardLink.tabIndex = -1;
    });
  });

  lookCards.forEach(function (card) {
    var cardLink = card.querySelector("a");
    if (cardLink) cardLink.tabIndex = -1;
  });

  /* 상품 첫 화면은 헤더 아래에 머물고, 스크롤 거리만큼 갤러리 사진이 이동합니다.
     마지막 사진이 보이면 sticky가 자연스럽게 풀려 다음 craft 섹션으로 이어집니다. */
  (function setupProductGalleryScroll() {
    var hero = document.querySelector(".product_hero");
    var inner = hero ? hero.querySelector(".product_hero_inner") : null;
    var gallery = hero ? hero.querySelector(".product_gallery") : null;
    var galleryColumns = gallery ? Array.prototype.slice.call(gallery.querySelectorAll(".product_gallery_column")) : [];
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var GALLERY_SCROLL_MEDIA = "(min-width: 1101px) and (prefers-reduced-motion: no-preference)";
    var GALLERY_SCROLL_SCRUB = 0.65;

    if (!hero || !inner || !gallery || !galleryColumns.length || !gsap || !ScrollTrigger) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.matchMedia().add(GALLERY_SCROLL_MEDIA, function () {
      var galleryScrollDistance = 0;
      var columnScrollDistances = [];

      hero.classList.add("is_gallery_scroll_ready");

      function measureGalleryScroll() {
        var galleryStyle = window.getComputedStyle(gallery);
        var bottomSpace = Number(galleryStyle.paddingBottom.replace("px", "")) || 0;
        var visibleBottom = inner.clientHeight - bottomSpace;

        columnScrollDistances = galleryColumns.map(function (column) {
          var lastItem = column.lastElementChild;
          var contentBottom = lastItem
            ? column.offsetTop + lastItem.offsetTop + lastItem.offsetHeight
            : 0;

          return Math.max(0, contentBottom - visibleBottom);
        });
        galleryScrollDistance = Math.max.apply(Math, columnScrollDistances);
        hero.style.setProperty("--product_gallery_scroll_distance", galleryScrollDistance + "px");
        return galleryScrollDistance;
      }

      measureGalleryScroll();
      gsap.set(galleryColumns, { y: 0 });

      var galleryTween = gsap.to(galleryColumns, {
        y: function (index) {
          measureGalleryScroll();
          return -columnScrollDistances[index];
        },
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: function () {
            var headerHeight = parseFloat(
              window.getComputedStyle(document.documentElement).getPropertyValue("--header_height")
            ) || 64;

            return "top top+=" + headerHeight;
          },
          end: function () {
            return "+=" + measureGalleryScroll();
          },
          scrub: GALLERY_SCROLL_SCRUB,
          invalidateOnRefresh: true
        }
      });

      return function cleanupGalleryScroll() {
        if (galleryTween.scrollTrigger) {
          galleryTween.scrollTrigger.kill();
        }
        galleryTween.revert();
        hero.classList.remove("is_gallery_scroll_ready");
        hero.style.removeProperty("--product_gallery_scroll_distance");
      };
    });
  })();
})();
