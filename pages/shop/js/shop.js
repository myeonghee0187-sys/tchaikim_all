/* Freedom, worn: 보이는 동안만 재생하고 모션 감소·재생 실패 시 포스터를 유지합니다. */
(function initMotifVideo() {
  var container = document.querySelector(".motif_video");
  var video = container && container.querySelector(".motif_video_media");

  if (!video) return;

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var videoDesktop = window.matchMedia("(min-width: 1280px)");
  var isInViewport = false;
  var isPageHidden = false;
  var isPlayPending = false;
  var playRequestId = 0;

  video.muted = true;
  video.pause();

  function shouldPlayVideo() {
    return videoDesktop.matches && isInViewport && !isPageHidden && !document.hidden && !motionPreference.matches;
  }

  function pauseVideo() {
    playRequestId += 1;
    isPlayPending = false;
    video.pause();
    container.classList.remove("is_playing");
  }

  function updatePlayback() {
    if (!shouldPlayVideo()) {
      pauseVideo();
      return;
    }
    if (!video.paused || isPlayPending) return;

    var requestId = ++playRequestId;
    isPlayPending = true;
    var playResult = video.play();

    if (playResult && typeof playResult.then === "function") {
      playResult.then(function () {
        if (requestId !== playRequestId) return;
        isPlayPending = false;
        if (!shouldPlayVideo()) pauseVideo();
      }).catch(function () {
        if (requestId !== playRequestId) return;
        isPlayPending = false;
        container.classList.remove("is_playing");
      });
    } else {
      isPlayPending = false;
    }
  }

  function handlePlaying() {
    if (!shouldPlayVideo()) {
      pauseVideo();
      return;
    }
    if (!video.paused) container.classList.add("is_playing");
  }

  function handlePause() {
    if (video.paused) {
      isPlayPending = false;
      container.classList.remove("is_playing");
    }
  }

  function handlePageHide() {
    isPageHidden = true;
    pauseVideo();
  }

  function handlePageShow() {
    isPageHidden = false;
    var bounds = container.getBoundingClientRect();
    isInViewport = bounds.bottom > 0 && bounds.top < window.innerHeight &&
      bounds.right > 0 && bounds.left < window.innerWidth;
    updatePlayback();
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      pauseVideo();
    } else {
      handlePageShow();
    }
  }

  function handleMotionChange() {
    updatePlayback();
  }

  /* 관찰자를 지원하지 않는 환경에서는 자동 재생 없이 포스터를 보여줍니다. */
  if (!("IntersectionObserver" in window)) return;

  video.addEventListener("playing", handlePlaying);
  videoDesktop.addEventListener("change", updatePlayback);
  video.addEventListener("pause", handlePause);
  video.addEventListener("error", pauseVideo);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);

  if (typeof motionPreference.addEventListener === "function") {
    motionPreference.addEventListener("change", handleMotionChange);
  } else {
    motionPreference.addListener(handleMotionChange);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      isInViewport = entry.isIntersecting && entry.intersectionRatio > 0;
    });
    updatePlayback();
  }, { rootMargin: "0px", threshold: [0, 0.01] });

  observer.observe(container);
})();

/* Three.js는 Hero에서만 필요합니다. 원격 모듈을 첫 줄에서 기다리면 상품 버튼과
   배너까지 늦게 초기화되므로, 데스크톱 Hero가 필요할 때만 비동기로 불러옵니다. */
var THREE = null;

/* 발표용 상품 상세 연결.
   현재 상세 템플릿이 하나이므로 ALL / NEW의 열 개 카드에서 이미지와 상품명을
   누르면 같은 상세페이지로 이동합니다. 상품별 상세가 추가되면 각 카드의 상품
   식별값에 따라 경로만 나누면 됩니다. */
(function connectProductDetailLinks() {
  var detailUrl = "../shop_detail/index.html";
  var productLinks = document.querySelectorAll(
    ".card_product_media_link, .card_product_link, .motif_product_card"
  );

  productLinks.forEach(function (link) {
    link.setAttribute("href", detailUrl);
  });
})();

/* hero — follow.art 레퍼런스처럼 사진 카드들을 원통 둘레에 실제 3D로 배치하고
   Three.js로 렌더링합니다. 회전값은 GSAP로 트윈합니다(main 페이지가 이미
   GSAP를 쓰고 있어 같은 라이브러리로 통일). 페이지 진입 즉시 자동 회전이
   시작되고, ALL/NEW는 그 순환 중 하나일 뿐 고정값이 아닙니다. 카테고리
   hover/focus 시 그 카드가 정면으로 돌아오며 자동 회전이 멈추고, 벗어나면
   멈춘 지점부터 다시 돌아갑니다. Three.js/WebGL을 쓸 수 없으면 정지 이미지
   (`.hero_gallery_fallback`)가 그대로 보입니다. */

(function initProductActions() {
  var WISHLIST_STORAGE_KEY = "tchaikim_wishlist";
  var HEADER_REVEAL_DURATION = 3000;
  var wishlistItems = readWishlistItems();
  var toastTimer = 0;
  var headerRevealTimer = 0;
  var headerRevealStartY = 0;
  var shouldHideHeaderAfterReveal = false;
  var toast = document.createElement("div");
  var toastMessage = document.createElement("span");

  toast.className = "shop_action_toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.setAttribute("aria-atomic", "true");
  toast.appendChild(toastMessage);
  document.body.appendChild(toast);

  function readWishlistItems() {
    try {
      var storedItems = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY));
      return Array.isArray(storedItems) ? storedItems.filter(function (item) {
        return typeof item === "string" && item.trim() !== "";
      }) : [];
    } catch (error) {
      return [];
    }
  }

  function saveWishlistItems() {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (error) {
      /* Wishlist selection still works for the current page session. */
    }
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.classList.remove("is_visible");
    toastMessage.textContent = message;

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        toast.classList.add("is_visible");
      });
    });

    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is_visible");
    }, 2400);
  }

  function updateWishlistButtons(productName, isSelected) {
    document.querySelectorAll(".card_product_wishlist_button").forEach(function (button) {
      if (button.dataset.productName !== productName) {
        return;
      }

      button.classList.toggle("is_selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));

      var label = button.querySelector(".a11y_hidden");
      if (label) {
        label.textContent = (isSelected ? "Remove " : "Add ") + productName +
          (isSelected ? " from wishlist" : " to wishlist");
      }
    });
  }

  function convertToButton(action, className) {
    var button = action;

    if (action.tagName !== "BUTTON") {
      button = document.createElement("button");
      button.className = action.className;
      button.innerHTML = action.innerHTML;
      button.type = "button";
      action.replaceWith(button);
    }

    button.classList.add(className);
    return button;
  }

  function temporarilyRevealCartHeader() {
    var header = document.querySelector(".header");

    if (!header) {
      return;
    }

    if (!header.classList.contains("is_cart_revealed")) {
      shouldHideHeaderAfterReveal = header.classList.contains("is_hidden");
      headerRevealStartY = window.scrollY;
    }

    window.clearTimeout(headerRevealTimer);
    header.classList.remove("is_hidden");
    header.classList.add("is_cart_revealed");

    headerRevealTimer = window.setTimeout(function () {
      var isMenuOpen = header.classList.contains("has_open_menu");
      var currencyMenu = document.querySelector("[data-currency-menu]");
      var isCurrencyOpen = currencyMenu && currencyMenu.classList.contains("is_open");
      var hasScrolledUp = window.scrollY < headerRevealStartY - 6;

      header.classList.remove("is_cart_revealed");

      if (
        shouldHideHeaderAfterReveal &&
        window.scrollY > 80 &&
        !hasScrolledUp &&
        !isMenuOpen &&
        !isCurrencyOpen
      ) {
        header.classList.add("is_hidden");
      }

      shouldHideHeaderAfterReveal = false;
    }, HEADER_REVEAL_DURATION);
  }

  function addCartItem() {
    if (window.tchaikimCart && typeof window.tchaikimCart.add === "function") {
      return window.tchaikimCart.add(1);
    }

    try {
      var storedCount = parseInt(window.sessionStorage.getItem("tchaikim_cart_count"), 10);
      var nextCount = (Number.isFinite(storedCount) && storedCount > 0 ? storedCount : 0) + 1;
      var headerCartCount = document.querySelector("[data-cart-count]");

      window.sessionStorage.setItem("tchaikim_cart_count", String(nextCount));

      if (headerCartCount) {
        headerCartCount.textContent = String(nextCount);
        headerCartCount.hidden = false;
        headerCartCount.setAttribute("aria-hidden", "false");
      }

      return nextCount;
    } catch (error) {
      /* The common header API will take over when it becomes available. */
      return 0;
    }
  }

  document.querySelectorAll(".card_product").forEach(function (card) {
    var productNameElement = card.querySelector(".card_product_name");
    var productName = productNameElement ? productNameElement.textContent.trim() : "Product";
    var heartAction = null;
    var bagAction = null;

    card.querySelectorAll(".card_product_action").forEach(function (action) {
      var icon = action.querySelector(".card_product_action_icon");
      var iconSource = icon ? icon.getAttribute("src") || "" : "";

      if (iconSource.indexOf("icon_heart") !== -1) {
        heartAction = action;
      } else if (iconSource.indexOf("icon_bag") !== -1) {
        bagAction = action;
      }
    });

    if (heartAction) {
      var wishlistButton = convertToButton(heartAction, "card_product_wishlist_button");
      var isInitiallySelected = wishlistItems.indexOf(productName) !== -1;

      wishlistButton.dataset.productName = productName;
      updateWishlistButtons(productName, isInitiallySelected);
      wishlistButton.addEventListener("click", function () {
        var itemIndex = wishlistItems.indexOf(productName);
        var isSelected = itemIndex === -1;

        if (isSelected) {
          wishlistItems.push(productName);
        } else {
          wishlistItems.splice(itemIndex, 1);
        }

        saveWishlistItems();
        updateWishlistButtons(productName, isSelected);
        showToast(isSelected ? "Saved to your wishlist." : "Removed from your wishlist.");
      });
    }

    if (bagAction) {
      var cartButton = convertToButton(bagAction, "card_product_cart_button");
      var cartLabel = cartButton.querySelector(".a11y_hidden");

      if (cartLabel) {
        cartLabel.textContent = "Add " + productName + " to shopping bag";
      }

      cartButton.addEventListener("click", function () {
        addCartItem();
        showToast("Added to your shopping bag.");
        temporarilyRevealCartHeader();
      });
    }
  });
})();

(function initBannerReveal() {
  var banner = document.querySelector(".banner");
  var bannerItems = banner ? Array.prototype.slice.call(banner.querySelectorAll(
    ".banner_eyebrow, .banner_title, .banner_divider, .banner_crosslink_label, .banner_crosslink_link"
  )) : [];
  var shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (
    !banner ||
    !bannerItems.length ||
    shouldReduceMotion ||
    typeof window.gsap === "undefined" ||
    typeof window.ScrollTrigger === "undefined"
  ) {
    return;
  }

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  banner.classList.add("is_revealing");

  gsap.from(bannerItems, {
    autoAlpha: 0,
    y: 32,
    duration: 0.82,
    stagger: 0.13,
    ease: "power3.out",
    clearProps: "opacity,visibility,transform",
    onComplete: function () {
      banner.classList.remove("is_revealing");
    },
    scrollTrigger: {
      trigger: banner,
      start: "top 76%",
      once: true
    }
  });
})();

(function initProductSwatches() {
  var swatchGroups = document.querySelectorAll(".card_product_swatches");

  swatchGroups.forEach(function (group) {
    var card = group.closest(".card_product");
    var productNameElement = card ? card.querySelector(".card_product_name") : null;
    var productName = productNameElement ? productNameElement.textContent.trim() : "Product";
    var swatches = Array.prototype.map.call(
      group.querySelectorAll(".card_product_swatch"),
      function (swatch, index) {
        var button = swatch;

        if (swatch.tagName !== "BUTTON") {
          button = document.createElement("button");
          button.className = swatch.className;
          button.style.cssText = swatch.style.cssText;
          button.type = "button";
          swatch.replaceWith(button);
        }

        button.setAttribute("aria-label", productName + " color option " + (index + 1));
        return button;
      }
    );

    if (!swatches.length) {
      return;
    }

    function selectSwatch(selectedSwatch) {
      swatches.forEach(function (swatch) {
        var isSelected = swatch === selectedSwatch;
        swatch.classList.toggle("is_selected", isSelected);
        swatch.setAttribute("aria-pressed", String(isSelected));
      });
    }

    selectSwatch(swatches[0]);
    group.classList.add("is_initialized");

    swatches.forEach(function (swatch) {
      swatch.addEventListener("click", function () {
        selectSwatch(swatch);
      });
    });
  });
})();

var heroGallery = document.getElementById("hero_gallery");
var canvas = document.getElementById("hero_gallery_canvas");
var navLinks = Array.prototype.slice.call(document.querySelectorAll(".hero_nav_link"));

/* ★ 원본 PNG(장당 8~12MB, 3200~3700px 폭)가 아니라 가로 1400px JPEG를 씁니다.
   앞 카드는 화면에 약 545 × 793px로 그려지므로, 레티나(2배)와 호버 확대(1.12배)를
   합쳐도 필요한 건 가로 1221px입니다. 원본은 3배 과했고 4장 합계가 41.3MB라
   Shop에 들어올 때 히어로가 뜨기까지 그만큼을 기다려야 했습니다.
   원본 PNG는 같은 폴더에 그대로 있습니다 — 카드를 더 키우면 다시 내보내면 됩니다. */
var IMAGE_URLS = [
  "assets/images/gallery_img_all_web.webp",
  "assets/images/gallery_img_dress_web.webp",
  "assets/images/gallery_img_top_web.webp",
  "assets/images/gallery_img_knit_web.webp",
  "assets/images/gallery_img_bottom_web.webp",
  "assets/images/gallery_img_outer_web.webp",
  "assets/images/gallery_img_living_web.webp",
  "assets/images/gallery_img_acc_web.webp"
];

var CARD_COUNT = IMAGE_URLS.length;
var CARD_WIDTH = 600;
var CARD_HEIGHT = 872;
var RING_RADIUS = 900;
var CARD_CURVE_SEGMENTS = 32;
var CARD_HOVER_SCALE = 1.12;
var FULL_TURN_DURATION_S = 40;
var FOCUS_TWEEN_DURATION_S = 0.8;

function createCurvedCardGeometry(cardHeight) {
  var geometry = new THREE.BufferGeometry();
  var positions = [];
  var uvs = [];
  var indices = [];
  var arcAngle = CARD_WIDTH / RING_RADIUS;

  for (var row = 0; row <= 1; row += 1) {
    var y = row === 0 ? cardHeight / 2 : -cardHeight / 2;

    for (var column = 0; column <= CARD_CURVE_SEGMENTS; column += 1) {
      var u = column / CARD_CURVE_SEGMENTS;
      var angle = (u - 0.5) * arcAngle;

      positions.push(
        Math.sin(angle) * RING_RADIUS,
        y,
        Math.cos(angle) * RING_RADIUS - RING_RADIUS
      );
      uvs.push(u, 1 - row);
    }
  }

  for (var segment = 0; segment < CARD_CURVE_SEGMENTS; segment += 1) {
    var topLeft = segment;
    var topRight = segment + 1;
    var bottomLeft = CARD_CURVE_SEGMENTS + 1 + segment;
    var bottomRight = bottomLeft + 1;

    indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/* 원본 비율은 유지하면서 모든 사진이 동일한 카드 면을 꽉 채우게 합니다.
   CSS의 object-fit: cover와 같은 방식이라 남는 부분만 중앙 기준으로 잘립니다. */
function coverTextureWithoutStretching(texture, imageWidth, imageHeight) {
  var imageAspect = imageWidth / imageHeight;
  var cardAspect = CARD_WIDTH / CARD_HEIGHT;

  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  if (imageAspect > cardAspect) {
    texture.repeat.x = cardAspect / imageAspect;
    texture.offset.x = (1 - texture.repeat.x) / 2;
  } else {
    texture.repeat.y = imageAspect / cardAspect;
    texture.offset.y = (1 - texture.repeat.y) / 2;
  }
}

function initHeroGallery() {
  if (!heroGallery || !canvas || typeof window.gsap === "undefined") {
    return;
  }

  var gsap = window.gsap;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var width = heroGallery.clientWidth;
  var height = heroGallery.clientHeight;

  if (width === 0 || height === 0) {
    return;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (error) {
    return;
  }

  /* 고해상도 화면에서도 과도한 WebGL 픽셀 생성을 막습니다.
     1.5면 카드 선명도는 유지하면서 DPR 2 대비 렌더 면적을 약 44% 줄입니다. */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(width, height, false);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, width / height, 10, 5000);
  /* 가장 앞쪽 카드(RING_RADIUS만큼 카메라에 가까움)가 호버로 확대되고
     원통 전체가 기울어져도 상하가 잘리지 않도록 충분한 프레이밍을 확보합니다. */
  camera.position.set(0, 0, 2600);
  camera.lookAt(0, 0, 0);

  var ring = new THREE.Group();
  ring.position.x = 80;
  ring.rotation.z = THREE.MathUtils.degToRad(12);
  ring.rotation.x = THREE.MathUtils.degToRad(-4);
  scene.add(ring);

  var loader = new THREE.TextureLoader();
  var cards = [];

  IMAGE_URLS.forEach(function (url, index) {
    var geometry = createCurvedCardGeometry(CARD_HEIGHT);
    var material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide
    });
    var backMaterial = new THREE.MeshBasicMaterial({
      color: 0x191817,
      side: THREE.BackSide
    });
    var card = new THREE.Group();
    var mesh = new THREE.Mesh(geometry, material);
    var backMesh = new THREE.Mesh(geometry, backMaterial);

    card.add(mesh);
    card.add(backMesh);

    var angle = (index / CARD_COUNT) * Math.PI * 2;
    card.position.set(Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS);
    card.rotation.y = angle;
    card.userData.galleryIndex = index;
    mesh.userData.galleryIndex = index;
    mesh.userData.hoverTarget = card;

    ring.add(card);
    cards.push(mesh);

    loader.load(
      url,
      function handleTextureLoaded(texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        coverTextureWithoutStretching(texture, texture.image.width, texture.image.height);
        material.map = texture;
        material.needsUpdate = true;
        gsap.to(material, { opacity: 1, duration: 0.6 });
      },
      undefined,
      function handleTextureError() {
        /* 이미지 하나가 실패해도 나머지 카드는 그대로 보여줍니다. */
      }
    );
  });

  var isRenderActive = true;

  function render() {
    if (!isRenderActive || !heroGallery.classList.contains("is_ready")) {
      return;
    }

    renderer.render(scene, camera);
  }

  var rotation = { deg: 0 };
  var autoTween = null;
  var pauseReasons = new Set();
  var hoveredCard = null;

  function applyRotation() {
    ring.rotation.y = (rotation.deg * Math.PI) / 180;
  }

  function startAutoRotate() {
    if (prefersReducedMotion || autoTween !== null || pauseReasons.size > 0) {
      return;
    }
    autoTween = gsap.to(rotation, {
      deg: rotation.deg + 360,
      duration: FULL_TURN_DURATION_S,
      ease: "none",
      repeat: -1,
      onUpdate: applyRotation
    });
  }

  function stopAutoRotate() {
    if (autoTween !== null) {
      autoTween.kill();
      autoTween = null;
    }
  }

  var isHeroIntersecting = true;

  function syncHeroRenderActivity() {
    isRenderActive = isHeroIntersecting && !document.hidden;

    if (isRenderActive) {
      pauseReasons.delete("offscreen");
      startAutoRotate();
    } else {
      pauseReasons.add("offscreen");
      stopAutoRotate();
    }
  }

  function focusCard(index) {
    pauseReasons.add("navigation");
    stopAutoRotate();

    var cardAngleDeg = (index / CARD_COUNT) * 360;
    var targetMod = ((-cardAngleDeg % 360) + 360) % 360;
    var currentMod = ((rotation.deg % 360) + 360) % 360;
    var shortestDelta = ((targetMod - currentMod + 540) % 360) - 180;

    gsap.to(rotation, {
      deg: rotation.deg + shortestDelta,
      duration: FOCUS_TWEEN_DURATION_S,
      ease: "power2.out",
      onUpdate: applyRotation
    });
  }

  function handleNavFocusIn(event) {
    var index = Number(event.currentTarget.getAttribute("data-gallery-index"));
    heroGallery.parentElement.querySelector(".hero_nav").classList.add("has_active");
    navLinks.forEach(function (link) {
      link.classList.toggle("is_active", link === event.currentTarget);
    });
    focusCard(index);
  }

  function handleNavFocusOut() {
    heroGallery.parentElement.querySelector(".hero_nav").classList.remove("has_active");
    navLinks.forEach(function (link) {
      link.classList.remove("is_active");
    });
    pauseReasons.delete("navigation");
    startAutoRotate();
  }

  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();

  function setHoveredCard(nextCard) {
    if (hoveredCard === nextCard) {
      return;
    }

    if (hoveredCard) {
      gsap.to(hoveredCard.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.45,
        ease: "power2.out",
        overwrite: true
      });
    }

    hoveredCard = nextCard;

    if (hoveredCard) {
      pauseReasons.add("card");
      stopAutoRotate();
      canvas.style.cursor = "pointer";
      gsap.to(hoveredCard.scale, {
        x: CARD_HOVER_SCALE,
        y: CARD_HOVER_SCALE,
        z: CARD_HOVER_SCALE,
        duration: 0.45,
        ease: "power2.out",
        overwrite: true
      });
    } else {
      pauseReasons.delete("card");
      canvas.style.cursor = "default";
      startAutoRotate();
    }
  }

  function handleCanvasPointerMove(event) {
    var bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    var intersections = raycaster.intersectObjects(cards, false);
    setHoveredCard(
      intersections.length ? intersections[0].object.userData.hoverTarget : null
    );
  }

  canvas.addEventListener("pointermove", handleCanvasPointerMove);
  canvas.addEventListener("pointerleave", function () {
    setHoveredCard(null);
  });

  navLinks.forEach(function (link) {
    link.addEventListener("mouseenter", handleNavFocusIn);
    link.addEventListener("focus", handleNavFocusIn);
    link.addEventListener("mouseleave", handleNavFocusOut);
    link.addEventListener("blur", handleNavFocusOut);
  });

  function handleWindowResize() {
    var newWidth = heroGallery.clientWidth;
    var newHeight = heroGallery.clientHeight;

    if (newWidth === 0 || newHeight === 0) {
      return;
    }

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight, false);
  }

  window.addEventListener("resize", handleWindowResize);

  /* Hero가 화면 밖으로 내려간 뒤에도 WebGL을 계속 그리면 이후 섹션의 Lenis가
     버벅입니다. 화면에 보일 때만 회전과 렌더를 실행합니다. */
  if (typeof window.IntersectionObserver !== "undefined") {
    var heroVisibilityObserver = new window.IntersectionObserver(function (entries) {
      isHeroIntersecting = entries[0] ? entries[0].isIntersecting : true;
      syncHeroRenderActivity();
    }, { rootMargin: "120px 0px" });

    heroVisibilityObserver.observe(heroGallery);
  }

  document.addEventListener("visibilitychange", syncHeroRenderActivity);

  gsap.ticker.add(render);
  heroGallery.classList.add("is_ready");
  startAutoRotate();

  /* 아래 syncHeroGallery()가 폭에 따라 껐다 켜기 위해 씁니다.
     정지("viewport")는 pauseReasons에 넣습니다 — startAutoRotate()가
     그 집합이 비어 있을 때만 돌기 때문에, 마우스 호버 같은 다른 정지
     이유와 서로 덮어쓰지 않습니다. */
  return {
    show: function () {
      pauseReasons.delete("viewport");
      heroGallery.classList.add("is_ready");
      handleWindowResize();
      startAutoRotate();
    },
    hide: function () {
      pauseReasons.add("viewport");
      stopAutoRotate();
      heroGallery.classList.remove("is_ready");
    }
  };
}

/* 폭 조건을 로드 시점에 한 번만 보면 두 방향 모두 어긋납니다.
   1920에서 연 창을 좁히면 모바일 레이아웃 위에서 WebGL이 계속 돌고,
   반대로 좁게 열었다 넓히면 영영 안 켜집니다.
   그래서 미디어쿼리 변화를 계속 듣고,
   - 조건을 처음 만족하는 순간에만 초기화합니다(그전까지 Three.js를 아예
     만들지 않아 모바일에서 WebGL 부담이 없습니다 — 지연 초기화).
   - 조건을 벗어나면 is_ready를 떼서 .hero_gallery_fallback 정지 이미지로
     돌리고 자동 회전을 멈춥니다. 캔버스는 그대로 두고 다시 넓어지면
     show()로 살립니다.

   innerWidth가 아니라 matchMedia를 쓰는 이유: 스크롤바가 있는 창에서
   innerWidth와 CSS 미디어쿼리가 보는 폭이 다릅니다. 경계에서 JS와 CSS
   판정이 어긋나면 캔버스는 도는데 레이아웃은 모바일이 됩니다. */
var heroGalleryQuery = window.matchMedia("(min-width: 768px)");
var heroGalleryApi = null;
var threeLoadPromise = null;

function loadThreeLibrary() {
  if (THREE) {
    return Promise.resolve(THREE);
  }

  if (!threeLoadPromise) {
    threeLoadPromise = import("three")
      .then(function (threeModule) {
        THREE = threeModule;
        return THREE;
      })
      .catch(function () {
        /* 네트워크가 느리거나 차단되면 정지 fallback 이미지를 그대로 사용합니다. */
        return null;
      });
  }

  return threeLoadPromise;
}

function syncHeroGallery() {
  if (!heroGalleryQuery.matches) {
    if (heroGalleryApi) {
      heroGalleryApi.hide();
    }
    return;
  }

  if (heroGalleryApi) {
    heroGalleryApi.show();
    return;
  }

  /* 초기화가 실패하면(WebGL 불가, 폭 0 등) null이 돌아옵니다. 그대로 두면
     다음 변화 때 다시 시도합니다 — 처음에 폭이 0이었던 경우를 구제합니다. */
  loadThreeLibrary().then(function (threeModule) {
    if (!threeModule || !heroGalleryQuery.matches || heroGalleryApi) {
      return;
    }

    /* 초기화가 실패하면 fallback 이미지를 유지합니다. */
    heroGalleryApi = initHeroGallery() || null;
  });
}

syncHeroGallery();
heroGalleryQuery.addEventListener("change", syncHeroGallery);

/* 모바일 히어로 스와이프 (768px 미만 — WebGL 원통을 만들지 않는 구간).
   그 폭에서는 사진이 한 장만 보이고 조작이 전혀 없었습니다. 여기서 카테고리
   8장을 담은 가로 트랙을 만들어, 옆으로 밀면 그 사진에 해당하는 카테고리가
   밝게 켜집니다(나머지는 .hero_nav.has_active 규칙이 0.22로 낮춥니다).

   ★ 제스처를 직접 계산하지 않습니다. 가로 스와이프는 브라우저 기본 스크롤과
     scroll-snap이 처리하고, 이 코드는 scrollLeft를 읽어 몇 번째인지만 봅니다.
     그래서 관성·고무줄이 기기 기본 동작 그대로 남습니다.
   ★ 데스크톱과 게이트가 겹치지 않습니다(768 미만 / 768 이상). 창 크기가 바뀌면
     destroy로 트랙과 class를 전부 되돌립니다. */
var heroSwipeQuery = window.matchMedia("(max-width: 767px)");
var heroSwipeApi = null;

var GALLERY_CATEGORY_LABELS = [
  "ALL / NEW", "DRESS", "TOP", "KNIT", "BOTTOM", "OUTER", "LIVING", "ACC"
];

function initHeroSwipe() {
  var nav = document.querySelector(".hero_nav");

  if (!heroGallery || !nav || !navLinks.length) {
    return null;
  }

  var track = document.createElement("div");
  var activeIndex = -1;

  /* 한 장의 폭은 스크롤 도중에 바뀌지 않습니다. 미리 재 두면 scroll마다
     clientWidth를 읽지 않아도 되고(레이아웃 재계산 없음), 그래서 굳이
     rAF로 묶지 않아도 됩니다. 창 크기가 바뀔 때만 다시 잽니다. */
  var slideWidth = 0;

  track.className = "hero_gallery_track";
  track.setAttribute("aria-label", "Swipe through Tchai Kim categories");

  IMAGE_URLS.forEach(function (url, index) {
    var slide = document.createElement("div");
    var image = document.createElement("img");

    slide.className = "hero_gallery_slide";
    image.className = "hero_gallery_slide_img";
    image.src = url;
    image.alt = "A model wearing a Tchai Kim " + GALLERY_CATEGORY_LABELS[index] + " look";
    image.decoding = "async";

    /* 첫 장은 바로 보이므로 즉시, 나머지는 밀어야 보이므로 미룹니다. */
    if (index > 0) {
      image.loading = "lazy";
    }

    slide.appendChild(image);
    track.appendChild(slide);
  });

  heroGallery.appendChild(track);
  heroGallery.classList.add("is_swipe_ready");

  function applyActive(index) {
    nav.classList.add("has_active");

    navLinks.forEach(function (link) {
      var isMatch = Number(link.getAttribute("data-gallery-index")) === index;

      link.classList.toggle("is_active", isMatch);

      /* 색·굵기만으로 상태를 전하지 않도록 읽기 도구에도 알립니다. */
      if (isMatch) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function readIndex() {
    if (!slideWidth) {
      return 0;
    }

    return Math.max(0, Math.min(IMAGE_URLS.length - 1, Math.round(track.scrollLeft / slideWidth)));
  }

  /* 스크롤은 한 번 밀 때 수십 번 발생하지만, 실제로 class를 고치는 것은
     사진이 바뀌는 순간뿐입니다(아래 조기 반환). */
  function syncActive() {
    var index = readIndex();

    if (index === activeIndex) {
      return;
    }

    activeIndex = index;
    applyActive(index);
  }

  function handleResize() {
    slideWidth = track.clientWidth;
    syncActive();
  }

  function handleNavClick(event) {
    var button = event.target.closest(".hero_nav_link");

    if (!button) {
      return;
    }

    var index = Number(button.getAttribute("data-gallery-index"));
    var shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollTo({
      left: index * slideWidth,
      behavior: shouldReduceMotion ? "auto" : "smooth"
    });

    /* 부드러운 스크롤은 여러 프레임에 걸쳐 도착합니다. 눌린 즉시 그 카테고리가
       켜져야 반응이 늦어 보이지 않습니다(도착 후 scroll이 같은 값을 다시 내도
       조기 반환으로 아무 일도 하지 않습니다). */
    activeIndex = index;
    applyActive(index);
  }

  /* 넓은 화면에서 좁은 화면으로 줄인 경우, WebGL 쪽 blur 핸들러가 살아 있어
     포커스가 빠질 때 is_active를 전부 지웁니다. 그 뒤에 되돌립니다. */
  function handleNavFocusOut() {
    window.setTimeout(function () {
      if (activeIndex >= 0) {
        applyActive(activeIndex);
      }
    }, 0);
  }

  track.addEventListener("scroll", syncActive, { passive: true });
  nav.addEventListener("click", handleNavClick);
  nav.addEventListener("focusout", handleNavFocusOut);
  window.addEventListener("resize", handleResize);

  slideWidth = track.clientWidth;
  activeIndex = 0;
  applyActive(0);

  return {
    destroy: function destroyHeroSwipe() {
      track.removeEventListener("scroll", syncActive);
      nav.removeEventListener("click", handleNavClick);
      nav.removeEventListener("focusout", handleNavFocusOut);
      window.removeEventListener("resize", handleResize);
      track.remove();

      heroGallery.classList.remove("is_swipe_ready");
      nav.classList.remove("has_active");

      navLinks.forEach(function (link) {
        link.classList.remove("is_active");
        link.removeAttribute("aria-current");
      });
    }
  };
}

function syncHeroSwipe() {
  if (heroSwipeQuery.matches) {
    if (!heroSwipeApi) {
      heroSwipeApi = initHeroSwipe();
    }

    return;
  }

  if (heroSwipeApi) {
    heroSwipeApi.destroy();
    heroSwipeApi = null;
  }
}

syncHeroSwipe();
heroSwipeQuery.addEventListener("change", syncHeroSwipe);

/* garment_story — 원형 내비 4개(Baeja/Cheollik/Geodeul/Sapok baji)를 휠 또는
   프레임의 세로 마우스 드래그로 이동시킵니다. 스크롤 위치는 네 개의 정수 스텝에
   맞추고, 화면의 진행도(progress)는 GSAP scrub으로 따라오게 해 부드럽게 스냅합니다.
   섹션이 화면 상단에 고정된 동안만 휠을 가로채며, 첫/마지막 가먼트 바깥 방향은
   그대로 흘려보내 앞·뒤 페이지 섹션으로 자연스럽게 이어지게 합니다. */
(function () {
  "use strict";

  var section = document.getElementById("garment_story_section");
  var scrollWrap = document.querySelector(".garment_story_scroll");
  var frame = section ? section.querySelector(".garment_story_frame") : null;
  var orbitList = document.getElementById("garment_orbit_list");
  var marker = document.querySelector(".garment_orbit_marker");
  var infoWrap = document.getElementById("garment_info");
  var mediaWrap = document.getElementById("garment_media");

  if (
    !section ||
    !scrollWrap ||
    !frame ||
    !orbitList ||
    !infoWrap ||
    !mediaWrap ||
    typeof window.gsap === "undefined" ||
    typeof window.ScrollTrigger === "undefined"
  ) {
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  var ORDER = ["baeja", "cheollik", "geodeul", "sapok_baji"];
  var STEP_COUNT = ORDER.length;
  var CENTER_X = 400;
  var CENTER_Y = 400;
  /* 점(마커)이 원 중심에서 떨어진 거리 — 원 그래픽(garment_circle.svg)
     자체의 반지름(400)과 맞춰뒀습니다. */
  var MARKER_RADIUS = 400;
  /* 점과 글자 사이 간격 — 라벨을 "안쪽 끝" 기준으로 배치하므로 글자
     길이와 상관없이 네 항목 모두 이 값 하나로 통일됩니다. 늘리면 모든
     라벨이 원 바깥쪽으로 똑같이 밀려납니다.
     (CSS .garment_orbit_item의 left 기본값 418px = 400 + 18과 같은 값입니다.) */
  var LABEL_GAP = 18;
  /* 라벨의 안쪽 끝이 놓이는 거리. */
  var LABEL_RADIUS = MARKER_RADIUS + LABEL_GAP;
  /* 가먼트 하나당 원 둘레를 도는 각도 — 늘리면 라벨들 사이 간격이
     넓어집니다(원래 Figma 시안은 30도였습니다). */
  var STEP_ANGLE_DEG = 52;
  /* 설명과 이미지가 맞닿아 보이지 않도록 한 화면 높이보다 더 떨어뜨립니다. */
  var CONTENT_SPACING_MULTIPLIER = 2;
  /* 숫자가 작을수록 적은 스크롤로 네 콘텐츠를 빠르게 통과합니다. */
  /* 네 콘텐츠가 연속으로 이어지되 고정 구간이 과도하게 길어지지 않는 거리입니다. */
  var SCROLL_DISTANCE_PERCENT = 550;
  /* ★ 섹션이 화면에 고정된 직후 **아무것도 진행하지 않고 첫 가먼트를 그대로
     보여주는 구간**입니다(전체 스크롤 길이 대비 비율).

     예전에는 0이라 섹션이 화면을 채우는 순간 곧바로 회전이 시작돼, 첫 화면
     (Cheollik)의 사진과 설명을 읽기도 전에 다음으로 넘어갔습니다.
     이 값만큼은 멈춰 있으므로 내용을 먼저 보고 넘어갑니다.

     ★ 이 값을 올릴 때는 SCROLL_DISTANCE_PERCENT도 같이 올려야 회전 속도가
       그대로입니다 — 대기 구간이 전체에서 떼어 가는 몫이기 때문입니다.
       (450 → 550으로 올린 것이 0.18을 벌충한 값입니다: 450 ÷ (1 − 0.18) ≈ 549)

     끝에서도 마지막 가먼트를 읽을 시간을 주고 싶으면 아래 timeline의 duration을
     `1 - LEAD_HOLD_RATIO - TAIL` 로 바꾸면 됩니다. */
  /* 진입 직후 첫 상품을 잠깐 읽을 여유만 두고 바로 연속 전환을 시작합니다. */
  var LEAD_HOLD_RATIO = 0.18;
  /* Wheel 한 번을 한 가먼트 이동으로 해석합니다. 트랙패드는 한 번의 손동작에서도
     wheel 이벤트를 여러 번 보내므로, 이동 애니메이션과 관성 입력이 모두 끝날 때까지
     잠금을 유지해야 두세 칸씩 건너뛰지 않습니다. */
  var WHEEL_MIN_DELTA = 4;
  /* ★ Garment Story 한 칸 이동 속도 조절 위치
     숫자를 키우면 더 천천히, 줄이면 더 빠르게 이동합니다. 실제 스크롤 좌표를
     이 시간 동안 움직이므로 이전처럼 먼저 튄 뒤 내용만 따라오지 않습니다. */
  /* 기존 1.15초보다 아주 조금 가볍게 조정했습니다.
     구조는 그대로 한 휠 = 한 단어이며, 이 값만 줄이면 한 칸 도착이 빨라집니다. */
  var SNAP_DURATION = 1.05;
  /* 스크롤 위치를 따라가는 화면 요소의 미세한 잔상을 조절합니다.
     너무 크게 올리면 입력보다 늦게 멈추므로 짧게 유지합니다. */
  /* 강제 단계 스냅 대신 Lenis의 실제 이동을 부드럽게 따라가는 값입니다. */
  var SNAP_SCRUB = 0.15;
  /* 트랙패드 관성 입력을 한 제스처로 묶는 시간입니다.
     220ms에서 190ms로만 줄여 다음 조작을 조금 빨리 받을 수 있게 했습니다. */
  var SNAP_IDLE_DELAY = 190;
  /* 마우스를 이 거리만큼 세로로 끌면 가먼트 한 칸을 이동합니다.
     작을수록 민감하고 클수록 더 길게 끌어야 합니다. */
  var DRAG_DISTANCE_PER_STEP = 320;
  var DRAG_START_THRESHOLD = 6;
  /* 숫자가 클수록 가먼트 한 칸 넘어가는 데 휠을 더 많이 굴려야 해서,
     한 항목에 머무르는 시간(=사용자가 쉬는 시간)이 늘어납니다.
     시안에 없는 값이라 추정치이며, 더 여유를 주고 싶으면 이 숫자를
     올리세요(예: 1400, 1800...). */
  var orbitItems = Array.prototype.slice.call(orbitList.querySelectorAll(".garment_orbit_item"));
  var panels = Array.prototype.slice.call(infoWrap.querySelectorAll(".garment_panel"));
  var mediaImages = Array.prototype.slice.call(mediaWrap.querySelectorAll(".garment_media_img"));

  var state = { progress: 0 };
  var garmentTrigger = null;
  var isSnapLocked = false;
  var isSnapAnimationDone = false;
  var snapIdleTimer = 0;
  var snapAnimationTimer = 0;
  var activePointerId = null;
  var dragStartY = 0;
  var dragStartProgress = 0;
  var dragProgress = 0;
  var isDragging = false;
  var shouldSuppressClick = false;

  function applyProgress() {
    var roundedIndex = Math.max(0, Math.min(STEP_COUNT - 1, Math.round(state.progress)));
    var activeGarment = ORDER[roundedIndex];

    orbitItems.forEach(function (item) {
      var itemIndex = ORDER.indexOf(item.getAttribute("data-garment"));
      var offset = itemIndex - state.progress;
      var angleDeg = offset * STEP_ANGLE_DEG;
      var angleRad = (angleDeg * Math.PI) / 180;
      var x = CENTER_X + LABEL_RADIUS * Math.cos(angleRad);
      var y = CENTER_Y + LABEL_RADIUS * Math.sin(angleRad);

      item.style.left = x.toFixed(2) + "px";
      item.style.top = y.toFixed(2) + "px";
      /* transform-origin이 left center라 세로만 가운데로 당기면 됩니다
         (가로로 -50% 당기면 다시 글자 길이만큼 간격이 틀어집니다). */
      item.style.transform = "translate(0, -50%) rotate(" + angleDeg.toFixed(2) + "deg)";
      item.classList.toggle("is_pos_active", itemIndex === roundedIndex);

      /* 마커(점)는 항상 "현재 활성으로 지정된 항목"이 실제로 그려지고 있는
         자리를 그대로 따라갑니다 — 전환 중에는 그 항목과 함께 부드럽게
         움직이다가, 활성 항목이 바뀌는 순간 다음 항목의 자리로 휙 넘어갑니다. */
      if (itemIndex === roundedIndex && marker) {
        var markerX = CENTER_X + MARKER_RADIUS * Math.cos(angleRad);
        var markerY = CENTER_Y + MARKER_RADIUS * Math.sin(angleRad);
        marker.style.left = markerX.toFixed(2) + "px";
        marker.style.top = markerY.toFixed(2) + "px";
      }
    });

    panels.forEach(function (panel) {
      var panelIndex = ORDER.indexOf(panel.getAttribute("data-garment"));
      var panelOffset = panelIndex - state.progress;
      var panelY = panelOffset * infoWrap.clientHeight * CONTENT_SPACING_MULTIPLIER;
      var panelIsNear = Math.abs(panelOffset) < 1.05;

      panel.style.transform = "translate3d(0, " + panelY.toFixed(2) + "px, 0)";
      panel.style.opacity = panelIsNear ? "1" : "0";
      panel.classList.toggle("is_active", panel.getAttribute("data-garment") === activeGarment);
    });

    mediaImages.forEach(function (img) {
      var imageIndex = ORDER.indexOf(img.getAttribute("data-garment"));
      var imageOffset = imageIndex - state.progress;
      var imageY = imageOffset * mediaWrap.clientHeight * CONTENT_SPACING_MULTIPLIER;
      var imageIsNear = Math.abs(imageOffset) < 1.05;

      img.style.transform = "translate3d(0, " + imageY.toFixed(2) + "px, 0)";
      img.style.opacity = imageIsNear ? "1" : "0";
      img.classList.toggle("is_active", img.getAttribute("data-garment") === activeGarment);
    });
  }

  function isSectionEngaged() {
    return garmentTrigger && garmentTrigger.isActive;
  }

  function scheduleSnapUnlock() {
    window.clearTimeout(snapIdleTimer);
    snapIdleTimer = window.setTimeout(function () {
      if (isSnapAnimationDone) {
        isSnapLocked = false;
      }
    }, SNAP_IDLE_DELAY);
  }

  function getStepScrollY(index) {
    var triggerDistance = garmentTrigger.end - garmentTrigger.start;
    var stepRatio = index / (STEP_COUNT - 1);
    var timelineRatio = LEAD_HOLD_RATIO + stepRatio * (1 - LEAD_HOLD_RATIO);

    /* 첫 스텝과 마지막 스텝은 pin 경계에서 1px 안쪽에 둡니다. 정확히 경계에 놓으면
       브라우저 반올림에 따라 섹션이 한 프레임 먼저 풀릴 수 있습니다. */
    if (index === 0) {
      return garmentTrigger.start + 1;
    }

    if (index === STEP_COUNT - 1) {
      return garmentTrigger.end - 1;
    }

    return garmentTrigger.start + triggerDistance * timelineRatio;
  }

  function getDragScrollY(progress) {
    var triggerDistance = garmentTrigger.end - garmentTrigger.start;
    var timelineRatio = LEAD_HOLD_RATIO +
      progress / (STEP_COUNT - 1) * (1 - LEAD_HOLD_RATIO);

    return garmentTrigger.start + triggerDistance * timelineRatio;
  }

  function snapEasing(progress) {
    /* 양 끝에서 속도가 0에 가까워지는 easeInOutCubic입니다.
       휠 입력 직후 급발진하거나 도착점에서 딱 멈추는 느낌을 줄입니다. */
    if (progress < 0.5) {
      return 4 * progress * progress * progress;
    }

    return 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function setSnapScrollY(targetY, isImmediate) {
    var shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var shouldMoveImmediately = isImmediate || shouldReduceMotion;

    if (window.tchaikimmLenis) {
      window.tchaikimmLenis.scrollTo(targetY, {
        immediate: shouldMoveImmediately,
        duration: SNAP_DURATION,
        easing: snapEasing,
        lock: !shouldMoveImmediately,
        force: true
      });
      return;
    }

    window.scrollTo({
      top: targetY,
      behavior: shouldMoveImmediately ? "auto" : "smooth"
    });
  }

  function scrollToStep(index) {
    var targetY = getStepScrollY(index);

    function handleComplete() {
      /* 원래 wheel 이벤트의 관성값이 남아 있어도 마지막에 정확한 스텝 좌표로
         한 번 더 보정합니다. 이 보정 덕분에 라벨·글·사진 중심이 어긋나지 않습니다. */
      setSnapScrollY(targetY, true);
      state.progress = index;
      applyProgress();
      isSnapAnimationDone = true;
      scheduleSnapUnlock();
    }

    window.clearTimeout(snapAnimationTimer);
    snapAnimationTimer = window.setTimeout(handleComplete, (SNAP_DURATION + 0.1) * 1000);
    setSnapScrollY(targetY, false);
  }

  function stopLenisForDrag() {
    if (!window.tchaikimmLenis) {
      return;
    }

    window.tchaikimmLenis.stop();
    window.tchaikimmLenis.scrollTo(window.scrollY, {
      immediate: true,
      force: true
    });
  }

  function startLenisAfterDrag() {
    if (window.tchaikimmLenis) {
      window.tchaikimmLenis.start();
    }
  }

  function setDragProgress(progress) {
    dragProgress = Math.max(0, Math.min(STEP_COUNT - 1, progress));
    var targetY = getDragScrollY(dragProgress);

    if (window.tchaikimmLenis) {
      window.tchaikimmLenis.scrollTo(targetY, {
        immediate: true,
        force: true
      });
    } else {
      window.scrollTo(0, targetY);
    }

    /* immediate 스크롤과 같은 프레임에 원·글·사진도 손을 따라오게 합니다. */
    state.progress = dragProgress;
    applyProgress();
    ScrollTrigger.update();
  }

  function handlePointerDown(event) {
    if (
      event.button !== 0 ||
      activePointerId !== null ||
      !isSectionEngaged() ||
      event.target.closest("a, button, input, textarea, select, [role='button']")
    ) {
      return;
    }

    window.clearTimeout(snapIdleTimer);
    window.clearTimeout(snapAnimationTimer);
    activePointerId = event.pointerId;
    dragStartY = event.clientY;
    dragStartProgress = state.progress;
    dragProgress = state.progress;
    isDragging = false;
    shouldSuppressClick = false;
    isSnapLocked = false;
    isSnapAnimationDone = false;
    stopLenisForDrag();
    frame.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    var dragDistance = dragStartY - event.clientY;

    if (!isDragging && Math.abs(dragDistance) < DRAG_START_THRESHOLD) {
      return;
    }

    if (!isDragging) {
      isDragging = true;
      shouldSuppressClick = true;
      section.classList.add("is_dragging");
    }

    event.preventDefault();
    setDragProgress(dragStartProgress + dragDistance / DRAG_DISTANCE_PER_STEP);
  }

  function finishPointerInteraction(event) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    if (frame.hasPointerCapture(event.pointerId)) {
      frame.releasePointerCapture(event.pointerId);
    }

    activePointerId = null;
    section.classList.remove("is_dragging");
    startLenisAfterDrag();

    if (isDragging) {
      isSnapLocked = true;
      isSnapAnimationDone = false;
      scrollToStep(Math.round(dragProgress));
    }

    isDragging = false;
  }

  function handleFrameClick(event) {
    if (!shouldSuppressClick) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    shouldSuppressClick = false;
  }

  function handleNativeDragStart(event) {
    event.preventDefault();
  }

  function handleWheel(event) {
    if (!isSectionEngaged() || Math.abs(event.deltaY) < WHEEL_MIN_DELTA) {
      return;
    }

    var direction = event.deltaY > 0 ? 1 : -1;
    var currentIndex = Math.max(0, Math.min(STEP_COUNT - 1, Math.round(state.progress)));
    var atStartGoingUp = currentIndex === 0 && direction < 0;
    var atEndGoingDown = currentIndex === STEP_COUNT - 1 && direction > 0;

    if (atStartGoingUp || atEndGoingDown) {
      /* 첫/마지막 가먼트를 넘어가려는 스크롤은 가로채지 않고 그대로
         페이지 스크롤로 흘려보냅니다. */
      return;
    }

    event.preventDefault();
    scheduleSnapUnlock();

    if (isSnapLocked) {
      return;
    }

    isSnapLocked = true;
    isSnapAnimationDone = false;
    scrollToStep(currentIndex + direction);
  }

  /* 1280 미만에서는 pin을 걸지 않습니다(css/shop.css의 max-width: 1279px
     블록과 짝). 섹션이 일반 흐름으로 남고 CSS가 사진+글 4쌍을 세로로 쌓습니다.

     ★ 단순 early return이면 안 됩니다. 폭을 로드 시점에 한 번만 보게 되어,
     1920에서 연 창을 좁히면 CSS는 세로 스택으로 바뀌는데 pin은 살아 있어
     섹션이 화면 높이(1080px)에 갇힙니다. 실제로 1100px에서 안쪽 내용
     5265px 중 1080px만 보이고 나머지가 잘렸습니다(사진·글 3·4번은
     멈춘 인터랙션 상태 그대로 opacity 0).

     gsap.matchMedia()는 창 크기가 바뀔 때마다 다시 평가하고, 조건에서
     벗어나면 이 컨텍스트에서 만든 ScrollTrigger(pin 포함)와 트윈을
     자동으로 되돌립니다. */
  gsap.matchMedia().add("(min-width: 1280px)", function () {
    applyProgress();

    var garmentTimeline = gsap.timeline({
      scrollTrigger: {
        /* 위·아래 여백은 scrollWrap에 있고 실제 고정 시작점은 section입니다.
           래퍼를 trigger로 쓰면 위쪽 여백이 화면 상단에 닿을 때 너무 일찍 고정됩니다. */
        trigger: section,
        start: "top top",
        end: "+=" + SCROLL_DISTANCE_PERCENT + "%",
        pin: section,
        pinSpacing: true,
        anticipatePin: 1,
        /* 실제 스크롤 이동은 SNAP_DURATION으로 제어하고, 여기는 Wheel·글·사진이
           그 위치를 살짝 부드럽게 따라오는 정도만 남깁니다. */
        scrub: SNAP_SCRUB,
        invalidateOnRefresh: true
      }
    });

    /* ★ 시작 위치(세 번째 인자)가 LEAD_HOLD_RATIO입니다. 타임라인 앞쪽 그만큼은
       트윈이 없어 state.progress가 0에 머물고, 그동안 화면은 첫 가먼트를 그대로
       보여줍니다. duration은 남은 구간이라 (1 − 대기)입니다 — 둘을 더해 1이 되어야
       스크롤 끝에서 마지막 가먼트에 정확히 도착합니다. */
    garmentTimeline
      .to(state, {
        progress: STEP_COUNT - 1,
        duration: 1 - LEAD_HOLD_RATIO,
        ease: "none",
        onUpdate: applyProgress
      }, LEAD_HOLD_RATIO);

    garmentTrigger = garmentTimeline.scrollTrigger;
    /* 한 번의 휠/트랙패드 제스처가 한 가먼트만 이동하도록 먼저 받습니다. */
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    section.classList.add("is_drag_ready");
    frame.addEventListener("pointerdown", handlePointerDown);
    frame.addEventListener("pointermove", handlePointerMove);
    frame.addEventListener("pointerup", finishPointerInteraction);
    frame.addEventListener("pointercancel", finishPointerInteraction);
    frame.addEventListener("click", handleFrameClick, true);
    frame.addEventListener("dragstart", handleNativeDragStart);

    /* GSAP은 자기가 만든 트윈·트리거만 되돌립니다. applyProgress()는
       element.style에 직접 쓰기 때문에 그 인라인 값은 남습니다 — 특히
       opacity가 0으로 굳으면 세로 스택에서 사진과 글이 안 보입니다.
       여기서 손으로 지워야 CSS 값(opacity: 1)이 다시 이깁니다. */
    return function cleanupGarmentStory() {
      window.removeEventListener("wheel", handleWheel, true);
      frame.removeEventListener("pointerdown", handlePointerDown);
      frame.removeEventListener("pointermove", handlePointerMove);
      frame.removeEventListener("pointerup", finishPointerInteraction);
      frame.removeEventListener("pointercancel", finishPointerInteraction);
      frame.removeEventListener("click", handleFrameClick, true);
      frame.removeEventListener("dragstart", handleNativeDragStart);
      window.clearTimeout(snapIdleTimer);
      window.clearTimeout(snapAnimationTimer);
      if (activePointerId !== null && frame.hasPointerCapture(activePointerId)) {
        frame.releasePointerCapture(activePointerId);
      }
      startLenisAfterDrag();
      section.classList.remove("is_drag_ready", "is_dragging");
      activePointerId = null;
      isDragging = false;
      shouldSuppressClick = false;
      garmentTrigger = null;
      isSnapLocked = false;
      isSnapAnimationDone = false;
      state.progress = 0;

      orbitItems.forEach(function (item) {
        item.style.left = "";
        item.style.top = "";
        item.style.transform = "";
        item.classList.remove("is_pos_active");
      });

      if (marker) {
        marker.style.left = "";
        marker.style.top = "";
      }

      panels.concat(mediaImages).forEach(function (element) {
        element.style.transform = "";
        element.style.opacity = "";
        element.classList.remove("is_active");
      });
    };
  });
})();

/* shop — 카테고리 선택 목록. 버튼을 누르면 일곱 개 항목이 위에서부터 하나씩
   이어서 나타납니다. 실제 지연 계산은 css/shop.css의 --shop_select_delay /
   --shop_select_stagger가 하고, 여기서는 몇 번째 항목인지만 넘겨줍니다.

   지금은 목록에서 고르면 버튼 글자만 바뀌고 아래 상품은 그대로입니다.
   상품마다 어느 카테고리인지가 아직 마크업에 없어서, 거를 기준이 없습니다. */
(function initShopSelect() {
  "use strict";

  var wrap = document.getElementById("shop_select_wrap");
  var button = document.getElementById("shop_select_button");
  var list = document.getElementById("shop_select_list");

  if (!wrap || !button || !list) {
    return;
  }

  var label = button.querySelector(".shop_select_label");
  var items = Array.prototype.slice.call(list.querySelectorAll(".shop_select_item"));

  items.forEach(function (item, index) {
    item.style.setProperty("--shop_select_index", String(index));
  });

  function openList() {
    list.classList.add("is_open");
    button.setAttribute("aria-expanded", "true");
  }

  /* focusButton은 Escape나 항목 선택처럼 사용자가 직접 닫은 경우에만 참입니다.
     바깥을 클릭해서 닫힐 때까지 버튼으로 포커스를 끌어오면, 사용자가 누른
     곳이 아니라 엉뚱한 데로 포커스가 튑니다. */
  function closeList(focusButton) {
    list.classList.remove("is_open");
    button.setAttribute("aria-expanded", "false");

    if (focusButton) {
      button.focus();
    }
  }

  function isOpen() {
    return list.classList.contains("is_open");
  }

  button.addEventListener("click", function () {
    if (isOpen()) {
      closeList(false);
    } else {
      openList();
    }
  });

  items.forEach(function (item) {
    var option = item.querySelector(".shop_select_option");

    if (!option) {
      return;
    }

    option.addEventListener("click", function () {
      items.forEach(function (other) {
        other.classList.remove("is_selected");
        other.setAttribute("aria-selected", "false");
      });

      item.classList.add("is_selected");
      item.setAttribute("aria-selected", "true");

      if (label) {
        label.textContent = option.textContent.trim();
      }

      closeList(true);
    });
  });

  /* 목록 바깥을 누르면 닫힙니다. 버튼도 wrap 안에 있으므로 위 토글 처리와
     겹치지 않습니다. */
  document.addEventListener("click", function (event) {
    if (isOpen() && !wrap.contains(event.target)) {
      closeList(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen()) {
      closeList(true);
    }
  });
})();

/* motif_detail — 관련 상품 스트립. 카드 크기는 선택된 카드(가장 큼), 그 양옆
   (중간), 나머지(가장 작음) 3단계이고 크기 규칙은 전부 CSS에 있습니다. 여기서는
   is_selected 클래스를 옮기는 일만 합니다. hover나 키보드 focus가 들어오면 그
   카드로 옮기고, 빠져나가도 되돌리지 않아 마지막으로 본 상품에 머무릅니다
   (Figma 주석: hover 해제 시 현재 선택된 상품 중심으로 복귀). */
(function initMotifProductStrip() {
  "use strict";

  var strip = document.getElementById("motif_product_strip");

  if (!strip) {
    return;
  }

  var cards = Array.prototype.slice.call(strip.querySelectorAll(".motif_product_card"));
  var compactMedia = window.matchMedia("(max-width: 1279px)");
  var cleanupLoop = null;

  function selectCard(card) {
    // Compact manual scrolling keeps the three image sizes stable while moving.
    if (compactMedia.matches) return;
    if (card.classList.contains("is_selected")) {
      return;
    }

    cards.forEach(function (item) {
      item.classList.toggle("is_selected", item === card);
    });
  }

  cards.forEach(function (card) {
    function handleSelect() {
      selectCard(card);
    }

    card.addEventListener("mouseenter", handleSelect);
    /* 키보드로 탭 이동할 때도 따라오게 합니다. 없으면 focus 링만 옮겨다니고
       크기는 그대로라 지금 어디에 있는지 알아보기 어렵습니다. */
    card.addEventListener("focus", handleSelect);
  });

  function initCompactLoop() {
    var controller = new AbortController();
    var clones = [];
    var cycleWidth = 0;
    var stripWidth = 0;
    var pointerId = null;
    var lastX = 0;
    var dragDistance = 0;
    var didDrag = false;
    var previousTabIndex = strip.getAttribute("tabindex");
    strip.classList.add("is_circular");
    strip.tabIndex = 0;

    // One complete copy on either side. Original links alone remain in the
    // accessibility/tab order; copies retain their real href for pointer users.
    function makeCopy(card, index) {
      var copy = card.cloneNode(true);
      copy.removeAttribute("id");
      copy.setAttribute("data-motif-copy", String(index));
      copy.setAttribute("aria-hidden", "true");
      copy.tabIndex = -1;
      copy.querySelectorAll("[id]").forEach(function (node) { node.removeAttribute("id"); });
      copy.querySelectorAll("a,button,input,select,textarea,[tabindex]").forEach(function (node) { node.tabIndex = -1; });
      clones.push(copy);
      return copy;
    }
    var before = document.createDocumentFragment();
    var after = document.createDocumentFragment();
    cards.forEach(function (card, index) { before.appendChild(makeCopy(card, index)); after.appendChild(makeCopy(card, index)); });
    strip.prepend(before);
    strip.append(after);

    function normalizePosition() {
      if (!cycleWidth) return;
      var x = strip.scrollLeft;
      if (x < cycleWidth || x >= cycleWidth * 2) {
        strip.scrollLeft = cycleWidth + ((x - cycleWidth) % cycleWidth + cycleWidth) % cycleWidth;
      }
    }
    function measure() {
      var width = strip.clientWidth;
      if (width === stripWidth && cycleWidth) return;
      var progress = cycleWidth ? (strip.scrollLeft - cycleWidth) / cycleWidth : 0;
      stripWidth = width;
      cycleWidth = cards[0].getBoundingClientRect().left - strip.firstElementChild.getBoundingClientRect().left;
      strip.scrollLeft = cycleWidth * (1 + progress);
      normalizePosition();
    }
    function move(distance) { strip.scrollLeft += distance; normalizePosition(); }
    function handlePointerDown(event) {
      didDrag = false;
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      event.preventDefault();
      pointerId = event.pointerId;
      lastX = event.clientX;
      dragDistance = 0;
    }
    function handlePointerMove(event) {
      if (pointerId !== event.pointerId) return;
      var delta = lastX - event.clientX;
      lastX = event.clientX;
      dragDistance += Math.abs(delta);
      if (dragDistance > 6) {
        didDrag = true;
        strip.setPointerCapture(pointerId);
        strip.classList.add("is_dragging");
        move(delta);
      }
    }
    function handlePointerEnd() {
      if (pointerId !== null && strip.hasPointerCapture(pointerId)) strip.releasePointerCapture(pointerId);
      pointerId = null;
      strip.classList.remove("is_dragging");
    }
    function handleClick(event) {
      if (didDrag) { event.preventDefault(); event.stopPropagation(); }
    }
    function handleWheel(event) {
      var delta = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      if (!delta || (!event.shiftKey && Math.abs(delta) <= Math.abs(event.deltaY))) return;
      event.preventDefault();
      move(delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1));
    }
    function handleKey(event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      move((event.key === "ArrowRight" ? 1 : -1) * (cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(strip).gap)));
    }
    function handleFocus(event) {
      var copy = event.target.closest("[data-motif-copy]");
      if (copy) cards[Number(copy.getAttribute("data-motif-copy"))].focus({ preventScroll: true });
    }
    function listen(target, type, callback, options) {
      target.addEventListener(type, callback, Object.assign({ signal: controller.signal }, options));
    }
    listen(strip, "scroll", normalizePosition, { passive: true });
    listen(strip, "wheel", handleWheel, { passive: false });
    listen(strip, "pointerdown", handlePointerDown);
    listen(strip, "pointermove", handlePointerMove);
    listen(window, "pointerup", handlePointerEnd);
    listen(window, "pointercancel", handlePointerEnd);
    listen(strip, "lostpointercapture", handlePointerEnd);
    listen(strip, "click", handleClick, { capture: true });
    listen(strip, "keydown", handleKey);
    listen(strip, "focusin", handleFocus);
    var observer = new ResizeObserver(measure);
    observer.observe(strip);
    measure();
    return function () {
      handlePointerEnd();
      controller.abort();
      observer.disconnect();
      clones.forEach(function (copy) { copy.remove(); });
      strip.classList.remove("is_circular", "is_dragging");
      if (previousTabIndex === null) strip.removeAttribute("tabindex");
      else strip.setAttribute("tabindex", previousTabIndex);
      strip.scrollLeft = 0;
    };
  }
  function syncLoop() {
    if (compactMedia.matches && !cleanupLoop) cleanupLoop = initCompactLoop();
    else if (!compactMedia.matches && cleanupLoop) { cleanupLoop(); cleanupLoop = null; }
  }
  compactMedia.addEventListener("change", syncLoop);
  syncLoop();
})();

/* Compact garment stories keep each image with its own copy. Original nodes and
   positions are restored before the desktop scroll scene is refreshed. */
(function initCompactShopStories() {
  var media=matchMedia("(max-width: 1279px)"), mobile=matchMedia("(max-width: 767px)");
  var content=document.querySelector(".garment_content"), cleanup=null;
  if (!content) return;
  var panels=Array.from(content.querySelectorAll(".garment_panel"));
  var images=Array.from(content.querySelectorAll(".garment_media_img"));
  var descriptions=panels.map(function(p){return p.querySelector(".garment_desc");});
  var originals=descriptions.map(function(p){return p.innerHTML;});
  var shortCopy=[
    "A reversible quilted baeja, with velvet side ties to adjust the fit.",
    "The Joseon robe’s waist seam and pleats, reshaped for everyday wear.",
    "The traditional raised front line, built into a skirt that holds its fold.",
    "Slanted panels and a tapered leg, with an easy, open waist."
  ];
  var tabletCopy=[
    "A sleeveless vest worn over the jeogori. Tchai Kim quilts it in nylon, reversible, with velvet side ties to adjust the fit.",
    "Joseon officials wore this robe with its fitted bodice and finely pleated skirt. Tchai Kim keeps the seam and pleats, reshaping it for daily life.",
    "A long skirt lifted at the waist for walking and working. Tchai Kim restores the raised front line in a fold that holds without retying.",
    "Made for sitting cross-legged, with a wide seat and narrow ankle. Tchai Kim keeps the slanted panels and opens the waist for ease."
  ];
  var motif=document.querySelector(".motif_reference_desc");
  var motifOriginal=motif.innerHTML;
  function syncCopy(){
    descriptions.forEach(function(e,i){if(media.matches)e.textContent=(mobile.matches?shortCopy:tabletCopy)[i];else e.innerHTML=originals[i];});
    if(media.matches)motif.textContent=mobile.matches?"Namsadangpae’s freedom in motion, reimagined in contemporary silhouettes.":"Inspired by the travelling Namsadangpae, TCHAIKIM carries their graceful, practical garments into contemporary silhouettes made for freedom in motion.";
    else motif.innerHTML=motifOriginal;
  }
  function mount(){
    var abort=new AbortController(),records=[],units=[];
    panels.forEach(function(panel,i){
      var unit=document.createElement("article");unit.className="garment_story_unit";
      [images[i],panel].forEach(function(node){var marker=document.createComment("Garment desktop position");node.before(marker);records.push({node:node,marker:marker});unit.append(node);});
      content.append(unit);units.push(unit);
    });
    content.tabIndex=0;content.setAttribute("aria-label","Garment stories. Swipe or use arrow keys.");
    var pointer=null,wasDragged=false;
    content.addEventListener("pointerdown",function(e){if(e.pointerType!=="mouse"||e.button!==0)return;pointer={x:e.clientX,left:content.scrollLeft};wasDragged=false;content.classList.add("is_dragging");content.setPointerCapture(e.pointerId);},{signal:abort.signal});
    content.addEventListener("pointermove",function(e){if(!pointer)return;wasDragged=wasDragged||Math.abs(pointer.x-e.clientX)>6;content.scrollLeft=pointer.left+pointer.x-e.clientX;},{signal:abort.signal});
    function release(){pointer=null;content.classList.remove("is_dragging");}
    content.addEventListener("pointerup",release,{signal:abort.signal});content.addEventListener("pointercancel",release,{signal:abort.signal});
    content.addEventListener("dragstart",function(e){e.preventDefault();},{signal:abort.signal});
    content.addEventListener("click",function(e){if(wasDragged){e.preventDefault();wasDragged=false;}},{capture:true,signal:abort.signal});
    content.addEventListener("keydown",function(e){if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;e.preventDefault();content.scrollBy({left:(e.key==="ArrowRight"?1:-1)*content.clientWidth*.85,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});},{signal:abort.signal});
    return function(){abort.abort();records.forEach(function(r){r.marker.replaceWith(r.node);});units.forEach(function(n){n.remove();});content.removeAttribute("tabindex");content.removeAttribute("aria-label");content.classList.remove("is_dragging");content.scrollLeft=0;};
  }
  function sync(){if(cleanup){cleanup();cleanup=null;}syncCopy();if(media.matches)cleanup=mount();if(window.ScrollTrigger)requestAnimationFrame(function(){ScrollTrigger.refresh();});}
  media.addEventListener("change",sync);mobile.addEventListener("change",syncCopy);sync();
})();
