
  (function () {
    const SVG_TEMPLATE = `
      <svg width="100%" height="100%" viewBox="0 0 314 104" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M275.442 89.5C275.442 89.5 315.942 46.9995 298.942 28C263.713 -11.373 199.942 117 178.442 89.5C159.869 65.7436 223.442 40.9995 209.942 19C185.09 -21.5005 106.942 115 83.9422 89.5C64.5454 67.9953 122.442 36.4999 106.942 19C80.2505 -11.1362 41.4424 89.5 14.4422 64.5C-2.00465 49.2716 32.4422 10 32.4422 10" stroke="#FF5400" stroke-width="200" stroke-linecap="round"/>
      </svg>
    `;

    function initWhatWeDoPills() {
      if (typeof gsap === "undefined") return;

      const hasDrawSVG = typeof DrawSVGPlugin !== "undefined";
      if (hasDrawSVG) {
        gsap.registerPlugin(DrawSVGPlugin);
      }

      // Query all CMS pills
      const pills = document.querySelectorAll(
        ".do-cms--pill, .do-cms-pill, [class*='do-cms--pill']",
      );
      if (!pills.length) return;

      const COLOR_ORANGE = "#ff5400";
      const COLOR_WHITE = "#fdf8f5";

      pills.forEach((pill) => {
        const text = pill.querySelector(".do-pill-text");
        let fill = pill.querySelector(".do-pill-fill");

        // 1. Auto-create .do-pill-fill container if not present
        if (!fill) {
          fill = document.createElement("div");
          fill.className = "do-pill-fill";
          pill.appendChild(fill);
        }

        // 2. Auto-inject SVG if not already inside .do-pill-fill
        if (!fill.querySelector("svg")) {
          fill.innerHTML = SVG_TEMPLATE.trim();
        }

        const path = fill.querySelector("path");
        if (!path) return;

        // Ensure path styling
        path.style.strokeLinecap = "round";
        path.style.strokeLinejoin = "round";

        const targetStrokeWidth =
          parseFloat(path.getAttribute("stroke-width")) || 200;

        let pathLength = 1000;
        if (!hasDrawSVG) {
          pathLength = path.getTotalLength ? path.getTotalLength() : 1000;
          path.style.strokeDasharray = `${pathLength} ${pathLength}`;
          path.style.strokeDashoffset = `${pathLength}`;
          gsap.set(path, { strokeWidth: 0 });
        } else {
          gsap.set(path, {
            drawSVG: "0%",
            strokeWidth: 0,
          });
        }

        // Set initial text color
        if (text) {
          gsap.set(text, { color: COLOR_ORANGE });
        }

        // Build Hover Timeline
        const hoverTl = gsap.timeline({
          paused: true,
          defaults: { ease: "power2.inOut" },
        });

        // 1. Draw SVG path + Expand stroke width to 200px (Smooth, slower draw pace)
        if (hasDrawSVG) {
          hoverTl.to(
            path,
            {
              drawSVG: "100%",
              strokeWidth: targetStrokeWidth,
              duration: 0.95,
              ease: "power2.inOut",
            },
            0,
          );
        } else {
          hoverTl.to(
            path,
            {
              strokeDashoffset: 0,
              strokeWidth: targetStrokeWidth,
              duration: 0.95,
              ease: "power2.inOut",
            },
            0,
          );
        }

        // 2. Transition text color from orange (#ff5400) to white (#fdf8f5)
        if (text) {
          hoverTl.to(
            text,
            {
              color: COLOR_WHITE,
              duration: 0.6,
              ease: "power1.out",
            },
            0.15,
          );
        }

        // Attach Mouse Events (Smooth relaxed pace on enter and leave)
        pill.addEventListener("mouseenter", () => {
          hoverTl.timeScale(1).play();
        });

        pill.addEventListener("mouseleave", () => {
          hoverTl.timeScale(1.1).reverse();
        });
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initWhatWeDoPills);
    } else {
      initWhatWeDoPills();
    }
  })();
