
  (function () {
    function initShowcaseMarquee() {
      if (typeof gsap === "undefined") return;

      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }

      // 1. Target Unique Slider Wrappers (prevents duplicate loop execution)
      const allWrappers = Array.from(
        document.querySelectorAll(
          ".section-slider-wrapper, .section-slider-showcase .section-slider-wrapper",
        ),
      );

      const targetWrappers = allWrappers.length
        ? Array.from(new Set(allWrappers))
        : Array.from(
            document.querySelectorAll(
              ".section-slider-showcase, [data-section='showcase']",
            ),
          );

      if (!targetWrappers.length) return;

      const scrollerEl = document.querySelector(".page") || window;

      targetWrappers.forEach((wrapper) => {
        // Prevent double initialization
        if (wrapper.dataset.marqueeInitialized === "true") return;
        wrapper.dataset.marqueeInitialized = "true";

        const track =
          wrapper.querySelector(".showcase-slider") ||
          wrapper.querySelector("[class*='showcase-slider']");
        if (!track) return;

        const initialSlides = Array.from(
          track.querySelectorAll(".showcase-slide"),
        );
        if (!initialSlides.length) return;

        wrapper.style.overflow = "hidden";
        wrapper.style.position = "relative";
        wrapper.style.width = "100%";

        track.style.display = "flex";
        track.style.flexDirection = "row";
        track.style.willChange = "transform";
        track.style.width = "max-content";

        // -------------------------------------------------------------
        // 2. Read Speed Level via Data Attribute (Checks Section, Wrapper & Ancestors)
        // Level 1 = 1.00x (Default / 1.5px), with +30% per level up to Level 5 (+120% / 3.3px)
        // -------------------------------------------------------------
        const speedSource =
          wrapper.closest("[data-marquee-speed]") ||
          wrapper.closest("[data-speed]") ||
          wrapper.closest("[data-speed-level]") ||
          wrapper.closest(".section-slider-showcase") ||
          wrapper;

        const rawSpeedAttr =
          speedSource?.getAttribute("data-marquee-speed") ||
          speedSource?.getAttribute("data-speed") ||
          speedSource?.getAttribute("data-speed-level") ||
          wrapper.getAttribute("data-marquee-speed") ||
          wrapper.getAttribute("data-speed") ||
          track.getAttribute("data-marquee-speed");

        let speedLevel = 1;
        if (rawSpeedAttr) {
          const parsed = parseFloat(rawSpeedAttr);
          if (!isNaN(parsed) && parsed > 0) {
            speedLevel = Math.max(1, Math.min(parsed, 5));
          }
        }

        // Base idle speed: Level 1 = 1.50px/frame; +30% per level
        const speedMultiplier = 1 + (speedLevel - 1) * 0.3;
        const BASE_SPEED = 1.5 * speedMultiplier;

        // -------------------------------------------------------------
        // 3. Clone Slides to Ensure Seamless Viewport Coverage (>= 3x Viewport)
        // -------------------------------------------------------------
        const numInitial = initialSlides.length;

        // Create enough sets so that one full set wrap is always outside the screen
        const setsNeeded = Math.max(
          3,
          Math.ceil(
            (window.innerWidth * 3.5) /
              (initialSlides[0].offsetWidth * numInitial || 1000),
          ),
        );

        for (let s = 1; s < setsNeeded; s++) {
          initialSlides.forEach((slide) => {
            const clone = slide.cloneNode(true);
            clone.classList.add("is-marquee-clone");
            clone.style.flexShrink = "0";
            clone.style.willChange = "transform";
            clone.style.transformOrigin = "center center";
            track.appendChild(clone);
          });
        }

        const allSlides = Array.from(track.querySelectorAll(".showcase-slide"));

        // -------------------------------------------------------------
        // 4. Precision Set-Width Measurement (Accounts for Flex Gap + Margins)
        // -------------------------------------------------------------
        let setWidth = 0;

        function measureSetWidth() {
          if (allSlides.length > numInitial) {
            const firstSlide = allSlides[0];
            const firstClone = allSlides[numInitial];
            if (firstSlide && firstClone) {
              const exactDistance =
                firstClone.offsetLeft - firstSlide.offsetLeft;
              if (exactDistance > 0) {
                setWidth = exactDistance;
                return;
              }
            }
          }

          // Fallback measurement: slide widths + computed gap + margins
          const trackStyle = window.getComputedStyle(track);
          const gap = parseFloat(trackStyle.columnGap || trackStyle.gap) || 0;
          let total = 0;
          initialSlides.forEach((slide) => {
            const style = window.getComputedStyle(slide);
            const margin =
              parseFloat(style.marginLeft || 0) +
              parseFloat(style.marginRight || 0);
            total +=
              (slide.offsetWidth || slide.getBoundingClientRect().width) +
              margin +
              gap;
          });
          if (total > 0) setWidth = total;
        }

        measureSetWidth();

        // Re-measure after image load & window load to prevent subpixel rounding drift
        const slideImages = track.querySelectorAll("img");
        slideImages.forEach((img) => {
          if (!img.complete) {
            img.addEventListener("load", measureSetWidth, { once: true });
          }
        });
        window.addEventListener("load", measureSetWidth);
        window.addEventListener("resize", measureSetWidth);

        // -------------------------------------------------------------
        // 5. Motion Physics & Directional Velocity Control
        // -------------------------------------------------------------
        let currentX = 0;
        let targetDirection = -1; // -1 = right-to-left (scroll down), +1 = left-to-right (scroll up)
        let currentDirection = -1;
        let scrollVelocityBoost = 0;

        // Listen for scroll direction and velocity
        if (typeof ScrollTrigger !== "undefined") {
          ScrollTrigger.create({
            trigger: document.body,
            scroller: scrollerEl,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
              const dir = self.direction === 1 ? -1 : 1;
              targetDirection = dir;

              const vel = Math.abs(self.getVelocity() || 0);
              scrollVelocityBoost =
                Math.min(vel / 220, 10 * speedMultiplier) * dir;
            },
          });
        }

        // -------------------------------------------------------------
        // 6. Render Loop (Glitch-Free Seamless Wrap & Proximity Scale)
        // -------------------------------------------------------------
        function tick() {
          currentDirection += (targetDirection - currentDirection) * 0.06;
          scrollVelocityBoost *= 0.92;

          const delta = BASE_SPEED * currentDirection + scrollVelocityBoost;
          currentX += delta;

          // Continuous seamless wrapping without modulo float truncation
          if (setWidth > 0) {
            while (currentX <= -setWidth) {
              currentX += setWidth;
            }
            while (currentX > 0) {
              currentX -= setWidth;
            }
          }

          // Apply track position with hardware acceleration
          gsap.set(track, { x: currentX, force3D: true });

          // Center Proximity Inverse Scale: 0.95 at center -> 1 at sides
          const wrapperRect = wrapper.getBoundingClientRect();
          const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
          const halfWidth = wrapperRect.width * 0.45 || 400;

          allSlides.forEach((slide) => {
            const slideRect = slide.getBoundingClientRect();
            const slideCenter = slideRect.left + slideRect.width / 2;

            const distFromCenter = Math.abs(slideCenter - wrapperCenter);
            const normDist = Math.min(1, distFromCenter / halfWidth);

            const targetScale = 0.95 + (1 - 0.95) * normDist;

            gsap.set(slide, {
              scale: targetScale,
              transformOrigin: "center center",
            });
          });
        }

        gsap.ticker.add(tick);
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initShowcaseMarquee);
    } else {
      initShowcaseMarquee();
    }
  })();
