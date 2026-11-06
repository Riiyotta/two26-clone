
  (function () {
    function initHeroMarquee() {
      if (typeof gsap === "undefined") return;

      if (typeof DrawSVGPlugin !== "undefined") {
        gsap.registerPlugin(DrawSVGPlugin);
      }
      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }

      const bgPath = document.querySelector(".hero-marquee-bg");
      const maskPath = document.querySelector(".hero-marquee-mask-path");
      const textPath = document.querySelector(".hero-marquee-tp");
      const textGroup = document.querySelector(".hero-marquee-text-group");
      const unit = document.querySelector(".marquee-unit");
      const container =
        document.querySelector(".hero-marquee") ||
        (bgPath ? bgPath.closest("svg") : null);

      if (!bgPath || !maskPath || !textPath) return;

      // 1. Initial State: Start at 100% 100% (hidden on right end)
      gsap.set([bgPath, maskPath], { drawSVG: "100% 100%" });

      // 2. Start Seamless Infinite Marquee Loop
      const startInfiniteMarquee = () => {
        const unitLength = unit ? unit.getComputedTextLength() : 1600;
        const speedDuration = unitLength / 75; // Smooth slow reading pace

        gsap.to(textPath, {
          attr: { startOffset: -unitLength },
          duration: speedDuration,
          ease: "none",
          repeat: -1,
        });
      };

      startInfiniteMarquee();

      const scrollerEl = document.querySelector(".page") || window;

      // 3. ScrollTrigger: Draw Ribbon + Reveal Text simultaneously from Right to Left
      // On reveal complete: remove mask to release Safari CPU rasterizer for silky 60fps scrolling
      gsap.to([bgPath, maskPath], {
        drawSVG: "0% 100%",
        delay: window.innerWidth < 991 ? 0.3 : 0,
        duration: 1.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          scroller: scrollerEl,
          start: "top 85%",
          once: true,
        },
        onComplete: () => {
          if (textGroup) {
            textGroup.removeAttribute("mask");
          }
        },
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initHeroMarquee);
    } else {
      initHeroMarquee();
    }
  })();
