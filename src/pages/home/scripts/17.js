
  (function () {
    function initServicesPathAnimation() {
      if (typeof gsap === "undefined") return;

      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }
      if (typeof DrawSVGPlugin !== "undefined") {
        gsap.registerPlugin(DrawSVGPlugin);
      }

      const section =
        document.querySelector(".section-services-body") ||
        document.querySelector(".services-layers")?.closest("section") ||
        document.querySelector(".services-layers")?.parentElement;

      if (!section) return;

      const layers = Array.from(
        section.querySelectorAll(
          ".services-layers .service-layer, .service-layer",
        ),
      );

      // Target Desktop & Mobile SVG Dark Paths
      const desktopDarkPath = section.querySelector(
        ".services-path-svg-dark path, .services-path-svg-dark svg path, .service-path-svg-dark path, .service-path-svg-dark svg path, .services-path-svg path, .services-path-svg svg path",
      );
      const mobileDarkPath = section.querySelector(
        ".service-path-mobile-dark path, .service-path-mobile-dark svg path, .services-path-mobile-dark path, .services-path-mobile-dark svg path, .service-path-mobile path, .service-path-mobile svg path, .services-path-mobile path, .services-path-mobile svg path",
      );

      const allDarkPaths = [desktopDarkPath, mobileDarkPath].filter(Boolean);
      const scrollerEl = document.querySelector(".page") || window;

      // 1. Setup Dark SVG Path Initial State (Desktop & Mobile)
      const hasDrawSVG = typeof DrawSVGPlugin !== "undefined";
      allDarkPaths.forEach((path) => {
        path.style.strokeLinecap = "round";
        path.style.strokeLinejoin = "round";
        if (hasDrawSVG) {
          gsap.set(path, { drawSVG: "0%" });
        } else {
          const len = path.getTotalLength ? path.getTotalLength() : 2500;
          path.style.strokeDasharray = len;
          path.style.strokeDashoffset = len;
        }
      });

      // 2. Setup Service Blocks Initial State & Measure Natural em Sizing
      layers.forEach((layer) => {
        const block = layer.querySelector(".service-block") || layer;
        const centerSvg = block.querySelector(".service-svg");
        const paraWrapper = block.querySelector(".service-block-para-wrapper");

        if (centerSvg) {
          // Read natural computed width (derived from em sizing in Webflow)
          const naturalWidth =
            centerSvg.getBoundingClientRect().width ||
            parseFloat(getComputedStyle(centerSvg).width) ||
            parseFloat(getComputedStyle(centerSvg).fontSize) * 2.5 ||
            40;

          centerSvg.dataset.targetWidth = naturalWidth;
          centerSvg.style.transformOrigin = "center center";
          centerSvg.style.willChange = "transform, width, opacity";
          centerSvg.style.flexShrink = "0";

          // Strictly constrain inner img/svg to stay inside container bounds
          const innerMedia = centerSvg.querySelectorAll(
            "img, svg, .service-img",
          );
          innerMedia.forEach((media) => {
            media.style.width = "100%";
            media.style.height = "100%";
            media.style.maxWidth = "100%";
            media.style.maxHeight = "100%";
            media.style.objectFit = "contain";
            media.style.display = "block";
          });

          gsap.set(centerSvg, {
            width: 0,
            scale: 0,
            opacity: 0,
            overflow: "hidden",
            margin: "0px",
          });
        }

        if (paraWrapper) {
          paraWrapper.style.transformOrigin = "center center";
          paraWrapper.style.willChange = "transform, opacity";
          gsap.set(paraWrapper, {
            scale: 0,
            rotation: 0,
            opacity: 0,
          });
        }
      });

      // 3. Create Master Scrubbed Timeline
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          scroller: scrollerEl,
          start: "top 70%",
          end: "bottom 70%",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      // A. Dark Path draws 0% to 100% across the full scrub duration (animates both desktop and mobile paths)
      allDarkPaths.forEach((path) => {
        if (hasDrawSVG) {
          masterTl.to(
            path,
            {
              drawSVG: "100%",
              ease: "none",
              duration: 1,
            },
            0,
          );
        } else {
          masterTl.to(
            path,
            {
              strokeDashoffset: 0,
              ease: "none",
              duration: 1,
            },
            0,
          );
        }
      });

      // B. Proximity Expansions for each of the 7 Service Layers (Slower & High Bounce)
      const totalLayers = layers.length;
      layers.forEach((layer, index) => {
        const block = layer.querySelector(".service-block") || layer;
        const centerSvg = block.querySelector(".service-svg");
        const paraWrapper = block.querySelector(".service-block-para-wrapper");

        // Map layer index evenly along the 0 -> 1 timeline progress
        const point = totalLayers > 1 ? index / (totalLayers - 1) : 0;
        const stepDuration = 0.14; // Slower, more deliberate expansion
        const startTime = Math.max(0, point - 0.04);

        // Center SVG container expands with prominent bounce
        if (centerSvg) {
          masterTl.to(
            centerSvg,
            {
              width: () => parseFloat(centerSvg.dataset.targetWidth) || "auto",
              scale: 1,
              opacity: 1,
              duration: stepDuration,
              ease: "back.out(3.5)",
            },
            startTime,
          );
        }

        // Paragraph wrapper pops with scale 1, -5deg rotation, and prominent bounce
        if (paraWrapper) {
          masterTl.to(
            paraWrapper,
            {
              scale: 1,
              rotation: -5,
              opacity: 1,
              duration: stepDuration,
              ease: "back.out(3.5)",
            },
            startTime + 0.02,
          );
        }
      });

      // Refresh on image/font load
      window.addEventListener("load", () => {
        ScrollTrigger.refresh();
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initServicesPathAnimation);
    } else {
      initServicesPathAnimation();
    }
  })();
