
  (function () {
    function initTwo26HeroAnimation() {
      const heroSection = document.querySelector(
        ".section-hero, section.hero, [data-section='hero']",
      );
      if (!heroSection) return;

      // -------------------------------------------------------------
      // 1. Elements Selection
      // -------------------------------------------------------------
      const headings = Array.from(
        heroSection.querySelectorAll(
          ".hero-text h1, .hero-text .heading, h1, [data-hero-heading]",
        ),
      );
      const pills = Array.from(heroSection.querySelectorAll(".hero-pill"));
      const allSvgPaths = Array.from(
        heroSection.querySelectorAll(
          ".hero-path-svg-left svg path, .hero-path-svg-right svg path, .hero-path-svg-left path, .hero-path-svg-right path",
        ),
      );

      // GSAP Fallback: If GSAP fails to load, make everything visible immediately
      if (typeof gsap === "undefined") {
        headings.forEach((h) => (h.style.opacity = "1"));
        pills.forEach((p) => {
          p.style.opacity = "1";
          p.style.transform = "none";
        });
        return;
      }

      if (typeof SplitText !== "undefined") {
        gsap.registerPlugin(SplitText);
      }
      if (typeof DrawSVGPlugin !== "undefined") {
        gsap.registerPlugin(DrawSVGPlugin);
      }
      const hasDrawSVG = typeof DrawSVGPlugin !== "undefined";

      // -------------------------------------------------------------
      // 2. Line-by-Line Heading Splitting (Exact projects-end Style)
      // -------------------------------------------------------------
      let linesList = [];

      headings.forEach((heading) => {
        let lines = [];
        if (typeof SplitText !== "undefined") {
          const split = new SplitText(heading, {
            type: "lines",
            linesClass: "hero-line",
          });
          split.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "hero-line-mask";
            mask.style.display = "block";
            mask.style.overflow = "hidden";
            line.parentNode.insertBefore(mask, line);
            mask.appendChild(line);
          });
          lines = split.lines;
        } else {
          const rawText = heading.textContent.trim();
          heading.innerHTML = `<span class="hero-line-mask"><span class="hero-line">${rawText}</span></span>`;
          lines = Array.from(heading.querySelectorAll(".hero-line"));
        }

        gsap.set(heading, { opacity: 1 });
        gsap.set(lines, {
          y: "115%",
          opacity: 0,
          display: "block",
        });

        linesList = linesList.concat(lines);
      });

      // -------------------------------------------------------------
      // 3. Initial Setup for Pills (Preserves Designer's Custom Rotation)
      // -------------------------------------------------------------
      if (pills.length) {
        gsap.set(pills, {
          opacity: 0,
          scale: 0.4,
          y: 20,
          transformOrigin: "center center",
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
        });
      }

      // -------------------------------------------------------------
      // 4. Initial Setup for Hero SVG Paths (Draw 0 & Stroke 0)
      // -------------------------------------------------------------
      const pathData = [];
      if (allSvgPaths.length) {
        allSvgPaths.forEach((path) => {
          path.style.strokeLinecap = "round";
          path.style.strokeLinejoin = "round";

          const originalStrokeWidth =
            parseFloat(
              path.getAttribute("stroke-width") ||
                window.getComputedStyle(path).strokeWidth,
            ) || 12;

          pathData.push({ path, originalStrokeWidth });

          if (hasDrawSVG) {
            gsap.set(path, {
              drawSVG: "0%",
              strokeWidth: 0,
            });
          } else {
            const len = path.getTotalLength ? path.getTotalLength() : 1500;
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;
            gsap.set(path, { strokeWidth: 0 });
          }
        });
      }

      // -------------------------------------------------------------
      // 5. Build Master Hero Timeline (PAUSED - 0.75x Speed)
      // -------------------------------------------------------------
      const heroTl = gsap
        .timeline({
          paused: true,
          defaults: { ease: "power2.out" },
        })
        .timeScale(0.75);

      // A. Line-by-Line Heading Entrance (Exact projects-end parameters)
      if (linesList.length) {
        heroTl.to(
          linesList,
          {
            y: "0%",
            opacity: 1,
            duration: 0.85,
            stagger: 0.12,
            ease: "back.out(1.4)",
          },
          0,
        );
      }

      const totalLinesTime = linesList.length
        ? linesList.length * 0.12 + 0.5
        : 1.2;

      // B. Animate Pills – shell pops in, inner text slides up from mask
      pills.forEach((pill, i) => {
        const pillStart =
          0.2 + (i / Math.max(1, pills.length)) * totalLinesTime * 0.7;

        // Find inner text element (supports multiple naming conventions)
        const pillTextEl = pill.querySelector(
          ".hero-pill-text, [class*='pill-text'], [class*='pill-label'], span, div",
        );

        // Wrap text in overflow-hidden mask if not already wrapped
        if (pillTextEl && !pillTextEl.closest(".hero-pill-text-mask")) {
          const mask = document.createElement("span");
          mask.className = "hero-pill-text-mask";
          mask.style.overflow = "hidden";
          mask.style.display = "block";
          pillTextEl.parentNode.insertBefore(mask, pillTextEl);
          mask.appendChild(pillTextEl);

          // Set initial text state: start 105% below mask
          gsap.set(pillTextEl, { y: "105%", opacity: 0 });
        }

        // Phase 1: Pill shell appears (scale + y)
        heroTl.to(
          pill,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.55,
            ease: "back.out(2.5)",
          },
          pillStart,
        );

        // Phase 2: Inner text slides up from behind mask
        if (pillTextEl) {
          heroTl.to(
            pillTextEl,
            {
              y: "0%",
              opacity: 1,
              duration: 0.5,
              ease: "back.out(1.6)",
            },
            pillStart + 0.15,
          );
        }
      });

      // C. Animate Hero SVG Paths (drawSVG 0% -> 100% & strokeWidth 0 -> original)
      if (pathData.length) {
        pathData.forEach((item, pIdx) => {
          const startTime = totalLinesTime * 0.4 + pIdx * 0.15;

          if (hasDrawSVG) {
            heroTl
              .to(
                item.path,
                {
                  drawSVG: "100%",
                  duration: 0.9,
                  ease: "power2.out",
                },
                startTime,
              )
              .to(
                item.path,
                {
                  strokeWidth: item.originalStrokeWidth,
                  duration: 0.9,
                  ease: "power2.out",
                },
                startTime,
              );
          } else {
            heroTl
              .to(
                item.path,
                {
                  strokeDashoffset: 0,
                  duration: 0.9,
                  ease: "power2.out",
                },
                startTime,
              )
              .to(
                item.path,
                {
                  strokeWidth: item.originalStrokeWidth,
                  duration: 0.9,
                  ease: "power2.out",
                },
                startTime,
              );
          }
        });
      }

      // -------------------------------------------------------------
      // 6. Play Hero – Always fires (loader OR no loader, hard refresh OR nav)
      // -------------------------------------------------------------
      let heroPlayed = false;
      function playHero() {
        if (heroPlayed) return;
        heroPlayed = true;
        heroTl.play();
      }

      // If loader already completed before this script ran (e.g. internal navigation
      // where loader skips itself and fires notifyLoaderComplete instantly)
      if (window.__two26LoaderDone) {
        playHero();
      } else {
        // Wait for loader to fire (hard refresh path) or skip-fire (any nav path)
        document.addEventListener("two26:loaderComplete", playHero, {
          once: true,
        });
        // Double-check: loader may have fired between the flag check and listener registration
        if (window.__two26LoaderDone) playHero();
        // Safety: only fires if the event genuinely never arrives (broken state)
        setTimeout(playHero, 8000);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initTwo26HeroAnimation);
    } else {
      initTwo26HeroAnimation();
    }
  })();
