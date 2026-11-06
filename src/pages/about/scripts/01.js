
  (function () {
    // -------------------------------------------------------------
    // Universal Hook: Allows Hero / Page scripts to sync with Loader
    // -------------------------------------------------------------
    window.onTwo26Ready = function (callback) {
      if (typeof callback !== "function") return;
      if (window.__two26LoaderDone) {
        callback();
      } else {
        document.addEventListener("two26:loaderComplete", callback, {
          once: true,
        });
      }
    };

    function notifyLoaderComplete() {
      window.__two26LoaderDone = true;
      // Expose completion via a data attribute for easier downstream checks
      document.body.setAttribute("data-two26-loader-done", "true");
      document.dispatchEvent(new CustomEvent("two26:loaderComplete"));
    }

    function initTwo26PageLoader() {
      // Hard safety check: If GSAP fails to load (CDN issue / adblocker / script order), never lock user out
      if (typeof gsap === "undefined") {
        const fallbackLoader = document.querySelector(
          ".loader, [data-loader='two26']",
        );
        if (fallbackLoader) {
          fallbackLoader.style.display = "none";
          fallbackLoader.style.pointerEvents = "none";
        }
        const fallbackElements = document.querySelectorAll(
          ".logo-animation, .loader-inner svg, .two26-logo-svg",
        );
        fallbackElements.forEach((el) => {
          el.style.visibility = "visible";
        });
        document.body.style.overflow = "";
        notifyLoaderComplete();
        return;
      }

      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }
      if (typeof DrawSVGPlugin !== "undefined") {
        gsap.registerPlugin(DrawSVGPlugin);
      }

      const hasDrawSVG = typeof DrawSVGPlugin !== "undefined";

      // -------------------------------------------------------------
      // 0. Session Navigation & Accessibility Checks
      // -------------------------------------------------------------
      const loader = document.querySelector(".loader, [data-loader='two26']");
      if (!loader) {
        notifyLoaderComplete();
        return;
      }

      // Accessibility: Skip animation immediately if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReducedMotion) {
        loader.style.display = "none";
        loader.style.pointerEvents = "none";
        notifyLoaderComplete();
        return;
      }

      // Determine if this is a hard refresh using modern Navigation Timing API
      const navEntries = performance.getEntriesByType("navigation");
      const navigationEntry = navEntries.length > 0 ? navEntries[0] : null;
      const isReload = navigationEntry && navigationEntry.type === "reload";
      // Fallback for older browsers using deprecated performance.navigation.type
      const isReloadLegacy =
        typeof performance.navigation !== "undefined" &&
        performance.navigation.type === 1;
      const wasNavigated = sessionStorage.getItem("two26_navigated") === "true";

      // Always register click handler so every page marks the NEXT navigation,
      // regardless of whether the loader played or was skipped on THIS page.
      document.addEventListener("click", (e) => {
        const link = e.target.closest("a[href]");
        if (!link) return;
        const href = link.getAttribute("href");
        if (
          href &&
          !href.startsWith("#") &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:") &&
          link.target !== "_blank" &&
          !link.hasAttribute("download") &&
          link.origin === window.location.origin
        ) {
          sessionStorage.setItem("two26_navigated", "true");
        }
      });

      // If user navigated internally from another page AND it is NOT a hard reload -> SKIP LOADER
      if (wasNavigated && !(isReload || isReloadLegacy)) {
        sessionStorage.removeItem("two26_navigated");
        loader.style.display = "none";
        loader.style.pointerEvents = "none";
        notifyLoaderComplete();
        return;
      }

      // Clear flag so next reload on this page plays the loader

      // -------------------------------------------------------------
      // 1. Elements Selection
      // -------------------------------------------------------------

      const bgStrokeContainer = loader.querySelector(
        ".svg-bg-stroke, .loader-bg-svg, .loader-bg",
      );
      const bgSvg = bgStrokeContainer
        ? bgStrokeContainer.querySelector("svg")
        : null;
      const bgPaths = bgSvg ? Array.from(bgSvg.querySelectorAll("path")) : [];

      // Path 0: Orange (#FF5400) | Path 1: Light Pink (#F9E2E1)
      const pathOrangeBg = bgPaths[0] || null;
      const pathPinkBg = bgPaths[1] || null;

      const logoContainer = loader.querySelector(
        ".loader-inner, .logo-animation",
      );
      const logoSvg = loader.querySelector(
        ".two26-logo-svg, .logo-reveal-svg, svg[data-logo='two26'], .logo-animation svg, .loader-inner svg",
      );

      // Lock scrolling during loader
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // -------------------------------------------------------------
      // 2. Initial Setup for Background Strokes
      // -------------------------------------------------------------
      // Start with stroke-width 3000px so both paths solidly cover screen
      const BG_STROKE_WIDTH_START = 3000;
      const BG_STROKE_WIDTH_END = 1000;

      if (pathOrangeBg) {
        pathOrangeBg.style.strokeLinecap = "round";
        pathOrangeBg.setAttribute("stroke-linecap", "round");
        if (hasDrawSVG) {
          gsap.set(pathOrangeBg, {
            x: 0,
            y: 0,
            drawSVG: "0% 100%",
            strokeWidth: BG_STROKE_WIDTH_START,
          });
        } else {
          const len0 = pathOrangeBg.getTotalLength
            ? pathOrangeBg.getTotalLength()
            : 3000;
          pathOrangeBg.style.strokeDasharray = len0;
          pathOrangeBg.style.strokeDashoffset = 0;
          gsap.set(pathOrangeBg, {
            x: 0,
            y: 0,
            strokeWidth: BG_STROKE_WIDTH_START,
          });
        }
      }

      if (pathPinkBg) {
        pathPinkBg.style.strokeLinecap = "round";
        pathPinkBg.setAttribute("stroke-linecap", "round");
        if (hasDrawSVG) {
          gsap.set(pathPinkBg, {
            x: 0,
            y: 0,
            drawSVG: "0% 100%",
            strokeWidth: BG_STROKE_WIDTH_START,
          });
        } else {
          const len1 = pathPinkBg.getTotalLength
            ? pathPinkBg.getTotalLength()
            : 3000;
          pathPinkBg.style.strokeDasharray = len1;
          pathPinkBg.style.strokeDashoffset = 0;
          gsap.set(pathPinkBg, {
            x: 0,
            y: 0,
            strokeWidth: BG_STROKE_WIDTH_START,
          });
        }
      }

      // -------------------------------------------------------------
      // 3. Initial Setup for Logo SVG Paths
      // -------------------------------------------------------------
      let logoTimeline = null;

      if (logoSvg) {
        const paths = Array.from(logoSvg.querySelectorAll("path"));
        if (paths.length >= 6) {
          const pathRibbon = paths[0]; // Ribbon tracer
          const letter2 = paths[1]; // 2 (bottom)
          const letter6 = paths[2]; // 6 (bottom)
          const pathW = paths[3]; // W stroke
          const letterT = paths[4]; // T
          const letterO = paths[5]; // O

          const letters = [letterT, letterO, letter2, letter6];

          // Ribbon setup
          if (pathRibbon) {
            pathRibbon.style.strokeLinecap = "round";
            pathRibbon.style.strokeLinejoin = "round";
            if (hasDrawSVG) {
              gsap.set(pathRibbon, { drawSVG: "0% 0%", strokeWidth: 0 });
            } else {
              const len = pathRibbon.getTotalLength
                ? pathRibbon.getTotalLength()
                : 2500;
              pathRibbon.style.strokeDasharray = `${len * 0.05} ${len}`;
              pathRibbon.style.strokeDashoffset = len;
              gsap.set(pathRibbon, { strokeWidth: 0 });
            }
          }

          // W stroke setup
          if (pathW) {
            pathW.style.strokeLinecap = "butt";
            pathW.style.strokeLinejoin = "miter";
            pathW.setAttribute("stroke-linecap", "butt");
            pathW.setAttribute("stroke-linejoin", "miter");
            if (hasDrawSVG) {
              gsap.set(pathW, { drawSVG: "0%", strokeWidth: 19 });
            } else {
              const lenW = pathW.getTotalLength ? pathW.getTotalLength() : 800;
              pathW.style.strokeDasharray = lenW;
              pathW.style.strokeDashoffset = lenW;
              gsap.set(pathW, { strokeWidth: 19 });
            }
          }

          // Letters setup with GSAP svgOrigin
          letters.forEach((letter) => {
            if (!letter) return;
            const randomAngle = gsap.utils.random(-25, 25);
            letter.setAttribute("stroke", "#FF5400");
            letter.setAttribute("stroke-linejoin", "round");
            const bbox = letter.getBBox();
            const cx = bbox.x + bbox.width / 2;
            const cy = bbox.y + bbox.height / 2;
            gsap.set(letter, {
              scale: 0,
              rotation: randomAngle,
              strokeWidth: 6,
              svgOrigin: `${cx} ${cy}`,
            });
          });

          // Reveal SVG / logo now that all initial zeroed states are applied (prevents FOUC)
          if (logoSvg) {
            logoSvg.style.visibility = "visible";
          }
          const logoWrappers = loader.querySelectorAll(
            ".logo-animation, .two26-logo-svg",
          );
          logoWrappers.forEach((el) => {
            el.style.visibility = "visible";
          });

          // Build the Kinetic Logo Reveal Timeline (1.25x speed / 25% faster)
          logoTimeline = gsap.timeline({ delay: 0.25 }).timeScale(1.25);

          // Step A: Ribbon stroke growth and travel to W
          if (pathRibbon) {
            if (hasDrawSVG) {
              logoTimeline
                .to(
                  pathRibbon,
                  {
                    strokeWidth: 19,
                    duration: 1,
                    ease: "power2.in",
                  },
                  0,
                )
                .to(
                  pathRibbon,
                  {
                    drawSVG: "0% 7%",
                    duration: 0.7,
                    ease: "power2.in",
                  },
                  0,
                )
                .to(
                  pathRibbon,
                  {
                    drawSVG: "40% 47%",
                    duration: 1.2,
                    ease: "none",
                  },
                  0.7,
                );
            } else {
              const len = pathRibbon.getTotalLength
                ? pathRibbon.getTotalLength()
                : 2500;
              logoTimeline
                .to(
                  pathRibbon,
                  {
                    strokeWidth: 19,
                    duration: 1,
                    ease: "power2.in",
                  },
                  0,
                )
                .to(
                  pathRibbon,
                  {
                    strokeDashoffset: len * 0.6,
                    duration: 1.9,
                    ease: "power1.inOut",
                  },
                  0,
                );
            }
          }

          // Step B: Standalone W stroke draws
          if (pathW) {
            if (hasDrawSVG) {
              logoTimeline.to(
                pathW,
                {
                  drawSVG: "100%",
                  duration: 1.1,
                  ease: "power2.out",
                },
                "-=0.4",
              );
            } else {
              logoTimeline.to(
                pathW,
                {
                  strokeDashoffset: 0,
                  duration: 1.1,
                  ease: "power2.out",
                },
                "-=0.4",
              );
            }
          }

          // Step C: Ribbon departs and strokeWidth drops
          if (pathRibbon) {
            if (hasDrawSVG) {
              logoTimeline.to(
                pathRibbon,
                {
                  drawSVG: "100% 100%",
                  duration: 1.1,
                  ease: "power2.inOut",
                },
                "-=0.5",
              );
              logoTimeline.to(
                pathRibbon,
                {
                  strokeWidth: 0,
                  duration: 0.5,
                  ease: "power2.in",
                },
                "-=0.55",
              );
            } else {
              const len = pathRibbon.getTotalLength
                ? pathRibbon.getTotalLength()
                : 2500;
              logoTimeline.to(
                pathRibbon,
                {
                  strokeDashoffset: -len * 0.05,
                  duration: 1.1,
                  ease: "power2.inOut",
                },
                "-=0.5",
              );
              logoTimeline.to(
                pathRibbon,
                {
                  strokeWidth: 0,
                  duration: 0.5,
                  ease: "power2.in",
                },
                "-=0.55",
              );
            }
          }

          // Step D: Shift entire SVG upward to center the full logo
          const allContentPaths = [pathW, letterT, letterO, letter2, letter6];
          let minY = Infinity,
            maxY = -Infinity;
          allContentPaths.forEach((p) => {
            if (!p) return;
            const b = p.getBBox();
            if (b.y < minY) minY = b.y;
            if (b.y + b.height > maxY) maxY = b.y + b.height;
          });
          const viewBoxHeight = 1004;
          const contentCenterY = (minY + maxY) / 2;
          const viewBoxCenterY = viewBoxHeight / 2;
          const offsetSVGUnits = contentCenterY - viewBoxCenterY;
          const svgRect = logoSvg.getBoundingClientRect();
          const scaleRatio =
            svgRect.height > 0 ? svgRect.height / viewBoxHeight : 1;
          const offsetPx = offsetSVGUnits * scaleRatio;

          logoTimeline.to(
            logoSvg,
            {
              y: -offsetPx,
              duration: 0.8,
              ease: "power2.inOut",
            },
            "+=0.1",
          );

          // Step E: Staggered bouncy pop-in for letters T, O, 2, 6
          logoTimeline.to(
            letters,
            {
              scale: 1,
              rotation: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "back.out(3)",
            },
            "-=0.2",
          );
          logoTimeline.to(
            letters,
            {
              strokeWidth: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "power1.in",
            },
            "<",
          );
        }
      }

      // -------------------------------------------------------------
      // 4. Loading State & Exit Animation Handler
      // -------------------------------------------------------------
      let isWindowLoaded = document.readyState === "complete";
      let isLogoDone = false;

      if (!isWindowLoaded) {
        window.addEventListener("load", () => {
          isWindowLoaded = true;
          checkAndTriggerExit();
        });
      }

      if (logoTimeline) {
        logoTimeline.eventCallback("onComplete", () => {
          isLogoDone = true;
          checkAndTriggerExit();
        });
      } else {
        // Fallback timer if no logo animation found
        setTimeout(() => {
          isLogoDone = true;
          checkAndTriggerExit();
        }, 2000);
      }

      let exitTriggered = false;

      // Hard safety timeout: if window.load or any third-party script hangs, force exit after 6s
      setTimeout(() => {
        if (!exitTriggered) {
          isWindowLoaded = true;
          isLogoDone = true;
          checkAndTriggerExit();
        }
      }, 6000);

      function checkAndTriggerExit() {
        // Only trigger exit when BOTH minimum animation duration is met AND page is loaded
        if (isLogoDone && isWindowLoaded && !exitTriggered) {
          exitTriggered = true;
          runLoaderExitSequence();
        }
      }

      // -------------------------------------------------------------
      // 5. Exit Sequence (Pink Wipe -> Orange Wipe -> Page Reveal)
      // -------------------------------------------------------------
      function runLoaderExitSequence() {
        const exitTl = gsap.timeline({
          onComplete: () => {
            // Restore scrolling
            document.body.style.overflow = originalOverflow;
            loader.style.display = "none";
            loader.style.pointerEvents = "none";

            // Refresh ScrollTrigger so all page animations sync accurately
            if (typeof ScrollTrigger !== "undefined") {
              ScrollTrigger.refresh();
            }

            // Notify all hero / page entrance animations that loader is finished
            notifyLoaderComplete();
          },
        });

        // Small hold so user enjoys the complete logo for a moment
        exitTl.to({}, { duration: 0.2 });

        // Phase 1: Light Pink Stroke (#F9E2E1, Path 1) slithers down & right out of viewport (doubled speed)
        const SWEEP_DURATION = 0.65;

        if (pathPinkBg) {
          if (hasDrawSVG) {
            exitTl.to(
              pathPinkBg,
              {
                drawSVG: "50% 100%",
                strokeWidth: BG_STROKE_WIDTH_END,
                y: 1800,
                x: 900,
                duration: SWEEP_DURATION,
                ease: "power2.inOut",
              },
              "pinkStart",
            );
          } else {
            const len1 = pathPinkBg.getTotalLength
              ? pathPinkBg.getTotalLength()
              : 3000;
            exitTl.to(
              pathPinkBg,
              {
                strokeDashoffset: -len1 * 0.5,
                strokeWidth: BG_STROKE_WIDTH_END,
                y: 1800,
                x: 900,
                duration: SWEEP_DURATION,
                ease: "power2.inOut",
              },
              "pinkStart",
            );
          }
        }

        // Logo fades seamlessly into the Orange layer as Pink sweeps past 25%
        if (logoContainer || logoSvg) {
          exitTl.to(
            logoContainer || logoSvg,
            {
              opacity: 0,
              duration: 0.15,
              ease: "power1.out",
            },
            "pinkStart+=" + SWEEP_DURATION * 0.2,
          );
        }

        // Phase 2: Orange Stroke (#FF5400, Path 0) slithers down & left out of viewport (starts at 25% of pink)
        if (pathOrangeBg) {
          if (hasDrawSVG) {
            exitTl.to(
              pathOrangeBg,
              {
                drawSVG: "50% 100%",
                strokeWidth: BG_STROKE_WIDTH_END,
                y: 1800,
                x: -900,
                duration: SWEEP_DURATION,
                ease: "power2.inOut",
              },
              "pinkStart+=" + SWEEP_DURATION * 0.25, // Exactly 25% into the pink animation
            );
          } else {
            const len0 = pathOrangeBg.getTotalLength
              ? pathOrangeBg.getTotalLength()
              : 3000;
            exitTl.to(
              pathOrangeBg,
              {
                strokeDashoffset: -len0 * 0.5,
                strokeWidth: BG_STROKE_WIDTH_END,
                y: 1800,
                x: -900,
                duration: SWEEP_DURATION,
                ease: "power2.inOut",
              },
              "pinkStart+=" + SWEEP_DURATION * 0.25,
            );
          }
        }
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initTwo26PageLoader);
    } else {
      initTwo26PageLoader();
    }
  })();
