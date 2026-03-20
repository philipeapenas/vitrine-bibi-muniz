/**
 * ═══════════════════════════════════════════════════════
 *  VITRINE DE LINKS — Motor JavaScript v2.0
 *  Carrossel, Progress Bars, User-Agent Detection,
 *  Ripple Effects, Particle Burst
 * ═══════════════════════════════════════════════════════
 */

(function () {
  "use strict";

  // ─── User-Agent Detection ─────────────────────────
  const ua = navigator.userAgent || "";
  const urlParams = new URLSearchParams(window.location.search);
  const fromPresell = urlParams.get("from") === "presell";

  function isInstagramBrowser() {
    return /Instagram/i.test(ua);
  }

  function isTikTokBrowser() {
    return /TikTok|ByteDance|musical_ly|BytedanceWebview/i.test(ua);
  }

  // Redirect to presell pages if inside app browsers
  // Skip if user already came from a presell page (prevents loop)
  if (!fromPresell) {
    if (isInstagramBrowser()) {
      window.location.replace("presell-instagram.html");
      return;
    }
    if (isTikTokBrowser()) {
      window.location.replace("presell-tiktok.html");
      return;
    }
  }

  // ─── Wait for DOM ─────────────────────────────────
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    renderProfile();
    renderSocials();
    renderLinks();
    initSlideshow();
  }

  // ─── Render Profile ───────────────────────────────
  function renderProfile() {
    const nameEl = document.getElementById("profile-name");
    const bioEl = document.getElementById("profile-bio");

    if (nameEl) {
      nameEl.textContent = CONFIG.profileName;
      nameEl.classList.add("fade-in-up");
    }
    if (bioEl) {
      bioEl.textContent = CONFIG.bio;
      bioEl.classList.add("fade-in-up");
    }
  }

  // ─── Render Social Icons ──────────────────────────
  function renderSocials() {
    const container = document.getElementById("social-icons");
    if (!container) return;

    const icons = {
      instagram: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
      tiktok: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.2a8.16 8.16 0 005.58 2.2v-3.44a4.85 4.85 0 01-3.77-1.5V6.69h3.77z"/></svg>`,
    };

    const socials = CONFIG.socials || {};

    Object.keys(socials).forEach((platform) => {
      const url = socials[platform];
      if (!url || !icons[platform]) return;

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "social-icon";
      link.setAttribute("aria-label", platform);
      link.innerHTML = icons[platform];
      container.appendChild(link);
    });

    container.classList.add("fade-in-up");
  }

  // ─── Ripple Effect ────────────────────────────────
  function createRipple(event, element) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.5;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";

    element.appendChild(ripple);

    ripple.addEventListener("animationend", () => {
      ripple.remove();
    });
  }

  // ─── Particle Burst Effect ────────────────────────
  function createParticleBurst(event, element) {
    const rect = element.getBoundingClientRect();
    const originX = event.clientX - rect.left;
    const originY = event.clientY - rect.top;
    const colors = ["#cdc1e5", "#ffb0c9", "#ffffff", "#9c7eff"];

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("span");
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: ${colors[i % colors.length]};
        left: ${originX}px;
        top: ${originY}px;
        pointer-events: none;
        z-index: 10;
        opacity: 1;
      `;

      element.appendChild(particle);

      const angle = (Math.PI * 2 * i) / 8;
      const distance = 30 + Math.random() * 40;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      particle.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 },
        ],
        {
          duration: 500 + Math.random() * 200,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
          fill: "forwards",
        }
      ).onfinish = () => particle.remove();
    }
  }

  // ─── Render Link Cards ────────────────────────────
  function renderLinks() {
    const container = document.getElementById("links-section");
    if (!container) return;

    const linkIconSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    CONFIG.links.forEach((linkData, index) => {
      const card = document.createElement("a");
      card.href = linkData.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.className = "link-card fade-in-up";

      card.innerHTML = `
        ${linkData.image ? `<img class="link-card__image" src="${linkData.image}" alt="${linkData.title}" loading="lazy">` : ""}
        <div class="link-card__gradient"></div>
        <div class="link-card__content">
          <div class="link-card__icon">
            ${linkIconSVG}
          </div>
          <span class="link-card__title">${linkData.title}</span>
        </div>
      `;

      // Ripple + Particle on click
      card.addEventListener("click", function (e) {
        createRipple(e, this);
        createParticleBurst(e, this);
      });

      container.appendChild(card);
    });
  }

  function initSlideshow() {
    const slideshowEl = document.getElementById("slideshow");
    const bgBlurEl = document.getElementById("bg-blur-layer");
    const progressEl = document.getElementById("progress-bars");
    const photos = CONFIG.backgroundPhotos || [];
    const duration = CONFIG.slideDuration || 4000;

    if (!slideshowEl || photos.length === 0) return;

    // Set CSS variable for progress bar animation
    document.documentElement.style.setProperty("--slide-duration", duration + "ms");

    // Create image elements
    const images = [];
    const blurImages = [];
    photos.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.className = "slideshow__image";
      img.alt = "";
      img.draggable = false;
      if (i === 0) img.classList.add("active");
      slideshowEl.appendChild(img);
      images.push(img);

      if (bgBlurEl) {
        const blurImg = document.createElement("img");
        blurImg.src = src;
        blurImg.className = "bg-blur-layer__image";
        blurImg.alt = "";
        blurImg.draggable = false;
        if (i === 0) blurImg.classList.add("active");
        bgBlurEl.appendChild(blurImg);
        blurImages.push(blurImg);
      }
    });

    // Create progress bars
    const bars = [];
    photos.forEach((_, i) => {
      const bar = document.createElement("div");
      bar.className = "progress-bar";
      const fill = document.createElement("div");
      fill.className = "progress-bar__fill";
      bar.appendChild(fill);
      progressEl.appendChild(bar);
      bars.push(bar);
    });

    if (photos.length <= 1) {
      // Single photo — just show it, no slideshow
      if (bars[0]) bars[0].classList.add("completed");
      return;
    }

    let currentIndex = 0;

    function activateSlide(index) {
      // Update images
      images.forEach((img, i) => {
        img.classList.toggle("active", i === index);
      });
      blurImages.forEach((img, i) => {
        img.classList.toggle("active", i === index);
      });

      // Update progress bars
      bars.forEach((bar, i) => {
        bar.classList.remove("active", "completed");
        if (i < index) {
          bar.classList.add("completed");
        } else if (i === index) {
          bar.classList.add("active");
          // Force reflow to restart animation
          const fill = bar.querySelector(".progress-bar__fill");
          fill.style.animation = "none";
          fill.offsetHeight; // trigger reflow
          fill.style.animation = "";
        }
      });
    }

    // Start with first slide
    activateSlide(0);

    // Auto-advance
    setInterval(() => {
      currentIndex = (currentIndex + 1) % photos.length;
      activateSlide(currentIndex);
    }, duration);
  }
})();
