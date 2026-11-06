
  (function () {
    function initMoodboardMarquees() {
      if (typeof gsap === "undefined") return;

      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }

      // 1. Scroller resolution (.page Lenis custom wrapper or window)
      const scrollerEl = document.querySelector(".page") || window;

      // 2. Query moodboard sliders
      const sliderWrappers = Array.from(
        document.querySelectorAll(".moodboard-slider-wrapper"),
      );
      if (!sliderWrappers.length) return;

      const BASE_SPEED = 1.35; // Base idle speed in px/frame
      let currentScrollMultiplier = 1; // Smoothly interpolated multiplier (1 = normal, -1 = reversed)
      let targetScrollMultiplier = 1;
      let velocityBoost = 0;

      // -------------------------------------------------------------
      // 3. Bulletproof Scroll Inversion (Lenis + Native .page + ScrollTrigger)
      // -------------------------------------------------------------
      let lastScrollY =
        scrollerEl === window ? window.scrollY : scrollerEl.scrollTop || 0;

      function updateScrollDirection(delta, vel = 0) {
        if (delta > 0.5) {
          targetScrollMultiplier = 1; // Scrolling Down -> Default directions (Slider 1: Left, Slider 2: Right)
        } else if (delta < -0.5) {
          targetScrollMultiplier = -1; // Scrolling Up -> Invert directions (Slider 1: Right, Slider 2: Left)
        }
        if (vel > 0) {
          velocityBoost = Math.min(vel / 220, 8);
        }
      }

      // Direct Lenis integration
      if (window.lenis) {
        window.lenis.on("scroll", (e) => {
          if (e.direction) {
            targetScrollMultiplier = e.direction === -1 ? -1 : 1;
          }
          if (typeof e.velocity === "number") {
            velocityBoost = Math.min(Math.abs(e.velocity) / 200, 8);
          }
        });
      }

      // Scroll container listener fallback
      const handleScroll = () => {
        const currentY =
          scrollerEl === window ? window.scrollY : scrollerEl.scrollTop || 0;
        const diff = currentY - lastScrollY;
        updateScrollDirection(diff, Math.abs(diff) * 15);
        lastScrollY = currentY;
      };

      scrollerEl.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });

      // GSAP ScrollTrigger scroller tracking
      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.create({
          scroller: scrollerEl,
          start: 0,
          end: "max",
          onUpdate: (self) => {
            targetScrollMultiplier = self.direction === -1 ? -1 : 1;
            const vel = Math.abs(self.getVelocity() || 0);
            velocityBoost = Math.min(vel / 220, 8);
          },
        });
      }

      // -------------------------------------------------------------
      // 4. Initialize Each Slider with Exact Sub-Pixel Set Geometry
      // -------------------------------------------------------------
      const slidersData = [];

      sliderWrappers.forEach((wrapper, index) => {
        const track = wrapper.querySelector(".moodboard-slider");
        if (!track) return;

        // Query only genuine author slides (excluding clones)
        const initialSlides = Array.from(
          track.querySelectorAll(".moodboard-slide:not(.is-marquee-clone)"),
        );
        if (!initialSlides.length) return;

        // Base direction:
        // Top slider (index 0) moves LEFT (-1)
        // Bottom slider (index 1) moves RIGHT (+1)
        const baseDirection = index % 2 === 0 ? -1 : 1;

        // Remove any previous clones on re-init
        track.querySelectorAll(".is-marquee-clone").forEach((c) => c.remove());

        // Clone at least one complete set first to measure exact true cycle distance
        initialSlides.forEach((slide) => {
          const clone = slide.cloneNode(true);
          clone.classList.add("is-marquee-clone");
          track.appendChild(clone);
        });

        // Exact Physical Cycle Distance:
        // Measuring distance between 1st original slide and 1st clone accounts for
        // ALL flex gaps, margins, paddings, and sub-pixel widths with 100% precision!
        function measureSetWidth() {
          const firstClone = track.querySelector(".is-marquee-clone");
          if (firstClone && initialSlides[0]) {
            const origLeft = initialSlides[0].getBoundingClientRect().left;
            const cloneLeft = firstClone.getBoundingClientRect().left;
            const exactDist = Math.abs(cloneLeft - origLeft);
            if (exactDist > 0) return exactDist;
          }

          // Fallback calculation including flex-gap
          const style = window.getComputedStyle(track);
          const gap = parseFloat(style.gap || style.columnGap || 0) || 0;
          let sum = 0;
          initialSlides.forEach((s) => {
            sum += (s.offsetWidth || s.getBoundingClientRect().width) + gap;
          });
          return sum;
        }

        let setWidth = measureSetWidth();

        // Duplicate additional sets until track is at least 3.5x the screen width
        const minTrackWidth = window.innerWidth * 3.5 + (setWidth || 1000);
        let currentTrackWidth = setWidth * 2;

        while (currentTrackWidth < minTrackWidth && setWidth > 0) {
          initialSlides.forEach((slide) => {
            const clone = slide.cloneNode(true);
            clone.classList.add("is-marquee-clone");
            track.appendChild(clone);
          });
          currentTrackWidth += setWidth;
        }

        const sliderState = {
          wrapper: wrapper,
          track: track,
          initialSlides: initialSlides,
          baseDirection: baseDirection,
          setWidth: setWidth,
          x: 0,
          hoverFactor: 1, // 1 = full speed, 0 = smoothly paused
          measureSetWidth: measureSetWidth,
        };

        // Smooth GSAP Hover Deceleration / Acceleration (Desktop Pointer only)
        const isTouch =
          matchMedia("(pointer: coarse)").matches || window.innerWidth < 992;

        if (!isTouch) {
          wrapper.addEventListener("mouseenter", () => {
            gsap.to(sliderState, {
              hoverFactor: 0,
              duration: 0.7,
              ease: "power2.out",
              overwrite: "auto",
            });
          });

          wrapper.addEventListener("mouseleave", () => {
            gsap.to(sliderState, {
              hoverFactor: 1,
              duration: 0.7,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
        }

        slidersData.push(sliderState);
      });

      // -------------------------------------------------------------
      // 5. Seamless Continuous Animation Loop (100% Glitch-Free)
      // -------------------------------------------------------------
      function tick() {
        // Smoothly interpolate scroll direction change
        currentScrollMultiplier +=
          (targetScrollMultiplier - currentScrollMultiplier) * 0.06;

        // Damp velocity boost smoothly
        velocityBoost *= 0.92;

        slidersData.forEach((item) => {
          if (item.setWidth <= 0) return;

          // Effective Direction: Base (-1 or +1) * Scroll Inversion (-1 or +1)
          const effectiveDir = item.baseDirection * currentScrollMultiplier;
          const currentSpeed =
            (BASE_SPEED + velocityBoost) * effectiveDir * item.hoverFactor;

          item.x += currentSpeed;

          // Continuous shift wrapping handles both left and right directions seamlessly
          while (item.x <= -item.setWidth) {
            item.x += item.setWidth;
          }
          while (item.x >= 0) {
            item.x -= item.setWidth;
          }

          gsap.set(item.track, {
            x: item.x,
            force3D: true,
          });
        });
      }

      gsap.ticker.add(tick);

      // -------------------------------------------------------------
      // 6. Recalculate dimensions on window resize & font load
      // -------------------------------------------------------------
      function handleResize() {
        slidersData.forEach((item) => {
          const newWidth = item.measureSetWidth();
          if (newWidth > 0) item.setWidth = newWidth;
        });
      }

      window.addEventListener("resize", handleResize);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(handleResize);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initMoodboardMarquees);
    } else {
      initMoodboardMarquees();
    }
  })();
