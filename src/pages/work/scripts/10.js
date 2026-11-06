
  (function () {
    function initWorkHeroAnimation() {
      // Robust Selector: Finds work hero section or wrapper
      const heroSection =
        document.querySelector(
          ".section-work-hero, .section-work-hero-wrapper, [class*='work-hero'], [data-section='work-hero']",
        ) || document.body;

      if (!heroSection) return;

      // -------------------------------------------------------------
      // 1. Elements Selection
      // -------------------------------------------------------------
      const headings = Array.from(
        heroSection.querySelectorAll(
          ".work-hero-text h1, .work-hero-text .heading, .work-hero-text [data-work-hero-heading], .section-work-hero h1, h1",
        ),
      );
      const pills = Array.from(
        heroSection.querySelectorAll(
          ".work-hero-pill, .hero-pill, [class*='work-hero-pill'], [class*='hero-pill']",
        ),
      );
      const allSvgPaths = Array.from(
        heroSection.querySelectorAll(
          ".work-hero-path svg path, .work-hero-path path",
        ),
      );
      const catWorkImg = heroSection.querySelector(
        ".cat-work-wrapper, .cat-work-img, [class*='cat-work']",
      );
      const paras = Array.from(
        heroSection.querySelectorAll(
          ".work-hero-para, .work-hero-btm p, [class*='work-hero-para']",
        ),
      );

      // GSAP Fallback: If GSAP fails to load, make everything visible immediately
      if (typeof gsap === "undefined") {
        headings.forEach((h) => (h.style.opacity = "1"));
        pills.forEach((p) => {
          p.style.opacity = "1";
          p.style.transform = "none";
        });
        if (catWorkImg) {
          catWorkImg.style.opacity = "1";
          catWorkImg.style.transform = "none";
        }
        paras.forEach((p) => (p.style.opacity = "1"));
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
      // 2. Line-by-Line Headings Splitting (Exact projects-end Style)
      // -------------------------------------------------------------
      let allHeadingLines = [];

      headings.forEach((heading) => {
        let lines = [];
        if (typeof SplitText !== "undefined") {
          const split = new SplitText(heading, {
            type: "lines",
            linesClass: "work-hero-line",
          });
          split.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "work-hero-line-mask";
            mask.style.display = "block";
            mask.style.overflow = "hidden";
            line.parentNode.insertBefore(mask, line);
            mask.appendChild(line);
          });
          lines = split.lines;
        } else {
          const rawText = heading.textContent.trim();
          heading.innerHTML = `<span class="work-hero-line-mask"><span class="work-hero-line">${rawText}</span></span>`;
          lines = Array.from(heading.querySelectorAll(".work-hero-line"));
        }

        gsap.set(heading, { opacity: 1 });
        gsap.set(lines, {
          y: "115%",
          opacity: 0,
          display: "block",
        });

        allHeadingLines = allHeadingLines.concat(lines);
      });

      // -------------------------------------------------------------
      // 3. Pills Initial Setup
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
      // 4. SVG Paths Setup (Draw 0 & Stroke 0)
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
      // 5. Category Image Pop Setup (cat-work-img / cat-work-wrapper)
      // -------------------------------------------------------------
      if (catWorkImg) {
        gsap.set(catWorkImg, {
          opacity: 0,
          scale: 0.65,
          rotation: -6,
          transformOrigin: "center center",
          willChange: "transform, opacity",
        });
      }

      // -------------------------------------------------------------
      // 6. Split Paragraphs by Line Wrapped in Overflow-Hidden Masks
      // -------------------------------------------------------------
      let allParaLines = [];

      const setupParaLineMasks = (element) => {
        if (!element) return [];
        let lines = [];

        if (typeof SplitText !== "undefined") {
          const split = new SplitText(element, {
            type: "lines",
            linesClass: "work-hero-para-line",
          });
          split.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "work-hero-line-mask";
            mask.style.display = "block";
            mask.style.overflow = "hidden";
            line.parentNode.insertBefore(mask, line);
            mask.appendChild(line);
          });
          lines = split.lines;
        } else {
          const raw = element.innerHTML.trim();
          element.innerHTML = `<span class="work-hero-line-mask"><span class="work-hero-para-line">${raw}</span></span>`;
          lines = Array.from(element.querySelectorAll(".work-hero-para-line"));
        }

        gsap.set(element, { opacity: 1 });
        gsap.set(lines, {
          y: "115%",
          opacity: 0,
          display: "block",
        });

        return lines;
      };

      paras.forEach((p) => {
        const lines = setupParaLineMasks(p);
        allParaLines = allParaLines.concat(lines);
      });

      // -------------------------------------------------------------
      // 7. Build Master Work Hero Timeline (PAUSED - 0.75x Speed)
      // -------------------------------------------------------------
      const heroTl = gsap
        .timeline({
          paused: true,
          defaults: { ease: "power2.out" },
        })
        .timeScale(0.75); // Silky pace matching home and about heroes

      // A. Line-by-Line Heading Entrance (Exact projects-end parameters)
      if (allHeadingLines.length) {
        heroTl.to(
          allHeadingLines,
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

      const totalLinesTime = allHeadingLines.length
        ? allHeadingLines.length * 0.12 + 0.5
        : 1.2;

      // B. Animate Pills – shell pops in, inner text slides up from mask
      const pillPercents = [0.25, 0.5, 0.75, 0.9];
      pills.forEach((pill, i) => {
        const ratio =
          pillPercents[i] !== undefined ? pillPercents[i] : (i + 1) * 0.25;
        const pillStart = totalLinesTime * ratio;

        // Find inner text element (supports multiple naming conventions)
        const pillTextEl = pill.querySelector(
          ".work-hero-pill-text, .hero-pill-text, [class*='pill-text'], [class*='pill-label'], span, div",
        );

        // Wrap text in overflow-hidden mask if not already wrapped
        if (pillTextEl && !pillTextEl.closest(".work-hero-pill-text-mask")) {
          const mask = document.createElement("span");
          mask.className = "work-hero-pill-text-mask";
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

      // C. Animate Work Hero SVG Paths (drawSVG 0% -> 100% & strokeWidth 0 -> original)
      if (pathData.length) {
        pathData.forEach((item, pIdx) => {
          const startTime = totalLinesTime * 0.35 + pIdx * 0.15;

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

      // D. Animate Category Image Pop (cat-work-img / cat-work-wrapper)
      if (catWorkImg) {
        heroTl.to(
          catWorkImg,
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.85,
            ease: "back.out(2.2)",
          },
          totalLinesTime * 0.45,
        );
      }

      // E. Animate Paragraphs by Line (Bouncy entrance coming from below 100%)
      if (allParaLines.length) {
        heroTl.to(
          allParaLines,
          {
            y: "0%",
            opacity: 1,
            duration: 0.85,
            stagger: 0.1,
            ease: "back.out(1.4)",
          },
          totalLinesTime * 0.5,
        );
      }

      // -------------------------------------------------------------
      // 8. Play Hero – Always fires (loader OR no loader, hard refresh OR nav)
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
      document.addEventListener("DOMContentLoaded", initWorkHeroAnimation);
    } else {
      initWorkHeroAnimation();
    }
  })();
