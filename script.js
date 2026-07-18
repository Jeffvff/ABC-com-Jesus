const CONFIG = {
  checkoutEssencialUrl: "https://pay.wiapy.com/OeaMu7-JGnPJ",
  checkoutCompletoUrl: "https://pay.wiapy.com/j393hU7VdeF0",
  checkoutUpsellUrl: "https://pay.wiapy.com/GkRnsGs3ftlI",
  canonicalUrl: "",
  privacyUrl: "",
  termsUrl: "",
  contactUrl: "",
  precoEssencial: "9,90",
  precoCompleto: "27,90",
  precoUpsellCompleto: "17,90",
  precoOriginalEssencial: "29,90",
  precoOriginalCompleto: "59,90",
  parcelasEssencial: "2x de R$ 5,25",
  parcelasCompleto: "6x de R$ 5,55",
  offerDurationMinutes: 15,
  offerTimerMode: "session",
  platformName: "Wiapy",
  guaranteeDays: 7
};

const OFFER_STORAGE_KEY = "abc-com-jesus-offer-start";
const MOBILE_BAR_STORAGE_KEY = "abc-com-jesus-mobile-bar-closed";
const MOBILE_BREAKPOINT = 640;

const header = document.querySelector("#site-header");
const timerElements = [document.querySelector("#offer-timer"), document.querySelector("#offer-timer-secondary")].filter(Boolean);
const faqButtons = Array.from(document.querySelectorAll(".faq-item button"));
const ctaLinks = Array.from(document.querySelectorAll(".js-cta"));
const internalLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
const mobileBar = document.querySelector("#mobile-bar");
const mobileBarClose = document.querySelector("#mobile-bar-close");
const offersSection = document.querySelector("#ofertas");
const testimonialsCarousel = document.querySelector("[data-testimonials-carousel]");
const upsellModal = document.querySelector("#upsell-modal");
const upsellAccept = document.querySelector("#upsell-accept");
const upsellDecline = document.querySelector("#upsell-decline");
let activeScrollAnimation = null;
let pendingEssencialCheckoutUrl = "";

function trackMetaEvent(eventName, params = {}) {
  if (typeof window.fbq !== "function") {
    return;
  }

  window.fbq("trackCustom", eventName, params);
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function getOfferStart() {
  if (CONFIG.offerTimerMode !== "session") {
    return Date.now();
  }

  const stored = window.sessionStorage.getItem(OFFER_STORAGE_KEY);
  if (stored) {
    return Number(stored);
  }

  const now = Date.now();
  window.sessionStorage.setItem(OFFER_STORAGE_KEY, String(now));
  return now;
}

function updateTimer() {
  const durationMs = CONFIG.offerDurationMinutes * 60 * 1000;
  const start = getOfferStart();
  const end = start + durationMs;
  const remaining = Math.max(end - Date.now(), 0);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const text = `${padNumber(minutes)}:${padNumber(seconds)}`;

  timerElements.forEach((element) => {
    element.textContent = text;
  });
}

function buildCheckoutUrl(baseUrl) {
  if (!baseUrl) {
    return "";
  }

  const url = new URL(baseUrl, window.location.href);
  const currentParams = new URLSearchParams(window.location.search);

  currentParams.forEach((value, key) => {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function getCheckoutUrl(plan) {
  if (plan === "essencial") {
    return buildCheckoutUrl(CONFIG.checkoutEssencialUrl);
  }

  if (plan === "completo") {
    return buildCheckoutUrl(CONFIG.checkoutCompletoUrl);
  }

  return "";
}

function getUpsellCheckoutUrl() {
  return buildCheckoutUrl(CONFIG.checkoutUpsellUrl || CONFIG.checkoutCompletoUrl);
}

function navigateToCheckout(url) {
  if (!url) {
    return;
  }

  window.location.href = url;
}

function getScrollOffset() {
  const headerHeight = header?.offsetHeight ?? 0;
  return headerHeight + 18;
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function smoothScrollToElement(element) {
  if (!element) {
    return;
  }

  const startY = window.scrollY;
  const targetTop = Math.max(element.getBoundingClientRect().top + window.scrollY - getScrollOffset(), 0);
  const distance = targetTop - startY;

  if (Math.abs(distance) < 8) {
    window.scrollTo(0, targetTop);
    return;
  }

  if (activeScrollAnimation) {
    window.cancelAnimationFrame(activeScrollAnimation);
    activeScrollAnimation = null;
  }

  const duration = Math.min(1200, Math.max(650, Math.abs(distance) * 0.55));
  const startTime = performance.now();

  const animateScroll = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);
    window.scrollTo(0, startY + distance * easedProgress);

    if (progress < 1) {
      activeScrollAnimation = window.requestAnimationFrame(animateScroll);
      return;
    }

    activeScrollAnimation = null;
  };

  activeScrollAnimation = window.requestAnimationFrame(animateScroll);
}

function handleCtaClick(event) {
  const link = event.currentTarget;
  const plan = link.dataset.plan || "geral";
  const checkoutUrl = getCheckoutUrl(plan);

  if (plan === "essencial" && upsellModal) {
    event.preventDefault();
    pendingEssencialCheckoutUrl = checkoutUrl;
    trackMetaEvent("CliqueProduto1", {
      produto: "ABC com Jesus",
      preco: CONFIG.precoEssencial
    });
    openUpsellModal();
    return;
  }

  if (!checkoutUrl) {
    event.preventDefault();
    smoothScrollToElement(offersSection);
    return;
  }

  if (plan === "completo") {
    trackMetaEvent("CliqueProduto2", {
      produto: "ABC com Jesus Completo",
      preco: CONFIG.precoCompleto
    });
  } else if (plan === "geral") {
    trackMetaEvent("CliqueBotaoGeral", {
      destino: "ofertas"
    });
  }

  link.setAttribute("href", checkoutUrl);
}

function openUpsellModal() {
  if (!upsellModal) {
    return;
  }

  const upsellUrl = getUpsellCheckoutUrl();
  if (upsellAccept && upsellUrl) {
    upsellAccept.setAttribute("href", upsellUrl);
  }

  upsellModal.hidden = false;
  upsellModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeUpsellModal() {
  if (!upsellModal) {
    return;
  }

  upsellModal.hidden = true;
  upsellModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function setupCtas() {
  ctaLinks.forEach((link) => {
    const plan = link.dataset.plan || "geral";
    const checkoutUrl = getCheckoutUrl(plan);

    if (plan === "essencial" && upsellModal) {
      link.setAttribute("href", "#ofertas");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.addEventListener("click", handleCtaClick);
      return;
    }

    if (checkoutUrl) {
      link.setAttribute("href", checkoutUrl);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }

    link.addEventListener("click", handleCtaClick);
  });
}

function setupInternalLinks() {
  internalLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") {
      return;
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    link.addEventListener("click", (event) => {
      const isCheckoutLink = link.classList.contains("js-cta");
      if (isCheckoutLink && getCheckoutUrl(link.dataset.plan || "geral")) {
        return;
      }

      event.preventDefault();
      smoothScrollToElement(target);
      if (target.id) {
        window.history.replaceState(null, "", href);
      }
    });
  });
}

function setupUpsellModal() {
  if (!upsellModal) {
    return;
  }

  upsellModal.querySelectorAll("[data-upsell-close]").forEach((element) => {
    element.addEventListener("click", closeUpsellModal);
  });

  upsellDecline?.addEventListener("click", () => {
    trackMetaEvent("RecusouOfertaUpsell", {
      produto: "ABC com Jesus",
      oferta_recusada: CONFIG.precoUpsellCompleto
    });
    closeUpsellModal();

    if (pendingEssencialCheckoutUrl) {
      navigateToCheckout(pendingEssencialCheckoutUrl);
      return;
    }

    smoothScrollToElement(offersSection);
  });

  upsellAccept?.addEventListener("click", (event) => {
    event.preventDefault();
    trackMetaEvent("CliqueProdutoDesconto", {
      produto: "ABC com Jesus Completo",
      preco_promocional: CONFIG.precoUpsellCompleto,
      preco_original: CONFIG.precoOriginalCompleto
    });
    const upsellUrl = getUpsellCheckoutUrl();
    closeUpsellModal();
    navigateToCheckout(upsellUrl);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && upsellModal && !upsellModal.hidden) {
      closeUpsellModal();
    }
  });
}

function setupFaq() {
  faqButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      const region = document.getElementById(button.getAttribute("aria-controls"));

      button.setAttribute("aria-expanded", String(!isExpanded));
      if (region) {
        region.hidden = isExpanded;
      }
    });
  });
}

function setupHeader() {
  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupAnimations() {
  const candidates = document.querySelectorAll(".section, .hero-trust, .offer-highlight");
  candidates.forEach((element) => {
    element.classList.add("animate-in");
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    candidates.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  candidates.forEach((element) => observer.observe(element));
}

function setupTestimonialsCarousel() {
  if (!testimonialsCarousel) {
    return;
  }

  const viewport = testimonialsCarousel.querySelector(".testimonials-carousel__viewport");
  const track = testimonialsCarousel.querySelector("[data-testimonial-track]");
  const slides = Array.from(testimonialsCarousel.querySelectorAll("[data-testimonial-slide]"));
  const dots = Array.from(testimonialsCarousel.querySelectorAll("[data-testimonial-dot]"));

  if (!viewport || !track || slides.length === 0) {
    return;
  }

  let activeIndex = 0;
  let autoplayId = null;

  const getViewportWidth = () => viewport.clientWidth || 1;

  const syncSlideSizes = () => {
    const viewportWidth = getViewportWidth();

    slides.forEach((slide) => {
      slide.style.minWidth = `${viewportWidth}px`;
      slide.style.width = `${viewportWidth}px`;
    });

    track.style.width = `${viewportWidth * slides.length}px`;
  };

  const applyTranslate = (offsetPx = 0, withTransition = true) => {
    track.style.transition = withTransition ? "transform 0.45s ease" : "none";
    const baseOffset = -activeIndex * getViewportWidth();
    track.style.transform = `translate3d(${baseOffset + offsetPx}px, 0, 0)`;
  };

  const renderSlide = () => {
    syncSlideSizes();
    applyTranslate();

    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === activeIndex);
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const goToSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    renderSlide();
  };

  const stopAutoplay = () => {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    autoplayId = window.setInterval(() => {
      goToSlide(activeIndex + 1);
    }, 5000);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToSlide(index);
      startAutoplay();
    });
  });

  window.addEventListener("resize", renderSlide);

  renderSlide();
  startAutoplay();
}

function setupConfigDrivenContent() {
  const mappings = [
    ["[data-price-essencial]", CONFIG.precoEssencial],
    ["[data-price-completo]", CONFIG.precoCompleto],
    ["[data-price-original-essencial]", `R$ ${CONFIG.precoOriginalEssencial}`],
    ["[data-price-original-completo]", `R$ ${CONFIG.precoOriginalCompleto}`],
    ["[data-installments-essencial]", CONFIG.parcelasEssencial],
    ["[data-installments-completo]", CONFIG.parcelasCompleto]
  ];

  mappings.forEach(([selector, value]) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  });

  const canonicalHref = CONFIG.canonicalUrl.trim();
  if (canonicalHref) {
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = canonicalHref;
    document.head.appendChild(canonical);
  }

  document.querySelectorAll("[data-config-link]").forEach((link) => {
    const configKey = link.getAttribute("data-config-link");
    const value = CONFIG[configKey]?.trim();

    if (value) {
      link.href = value;
      link.hidden = false;
    }
  });

  const jsonLd = document.querySelector("#product-jsonld");
  if (jsonLd) {
    const data = JSON.parse(jsonLd.textContent);
    data.offers.price = CONFIG.precoEssencial.replace(",", ".");
    if (canonicalHref) {
      data.url = canonicalHref;
      data.offers.url = canonicalHref;
    }
    jsonLd.textContent = JSON.stringify(data, null, 2);
  }
}

function shouldUseMobileBar() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function setupMobileBar() {
  if (!mobileBar || !offersSection || !mobileBarClose) {
    return;
  }

  const wasClosed = window.sessionStorage.getItem(MOBILE_BAR_STORAGE_KEY) === "true";
  if (wasClosed) {
    mobileBar.classList.add("is-hidden");
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!shouldUseMobileBar()) {
        mobileBar.classList.remove("is-visible");
        return;
      }

      mobileBar.classList.toggle("is-visible", !entry.isIntersecting);
    });
  }, { threshold: 0.2 });

  observer.observe(offersSection);

  mobileBarClose.addEventListener("click", () => {
    mobileBar.classList.add("is-hidden");
    window.sessionStorage.setItem(MOBILE_BAR_STORAGE_KEY, "true");
  });

  window.addEventListener("resize", () => {
    if (!shouldUseMobileBar()) {
      mobileBar.classList.remove("is-visible");
    }
  });
}

function init() {
  setupConfigDrivenContent();
  setupUpsellModal();
  setupCtas();
  setupInternalLinks();
  setupFaq();
  setupHeader();
  setupAnimations();
  setupTestimonialsCarousel();
  setupMobileBar();
  updateTimer();
  window.setInterval(updateTimer, 1000);
}

// Inserir Meta Pixel aqui após receber o ID.
// Inserir Analytics aqui após receber a configuração.

document.addEventListener("DOMContentLoaded", init);

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
