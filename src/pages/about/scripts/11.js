
  (function () {
    function initAboutStoryTeam() {
      // 1. Defensive Plugin and GSAP Verification
      if (typeof gsap === "undefined") {
        document
          .querySelectorAll(
            ".about-story-line, .about-story-svg-wrap, .about-story-svg-wrapper, .about-story-text, .about-story-heading, .about-story-para",
          )
          .forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "none";
          });
        return;
      }

      if (typeof ScrollTrigger === "undefined") {
        document
          .querySelectorAll(
            ".about-story-line, .about-story-svg-wrap, .about-story-svg-wrapper, .about-story-text, .about-story-heading, .about-story-para",
          )
          .forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "none";
          });
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      if (typeof DrawSVGPlugin !== "undefined") {
        gsap.registerPlugin(DrawSVGPlugin);
      }
      if (typeof SplitText !== "undefined") {
        gsap.registerPlugin(SplitText);
      }

      const hasDrawSVG = typeof DrawSVGPlugin !== "undefined";

      // 2. Scroller resolution (supports both Lenis .page wrapper and window)
      const scrollerEl = document.querySelector(".page") || window;

      // 3. Elements Selection matching Webflow Navigator
      const container =
        document.querySelector(
          ".about-story-team, .about-story-team-wrapper, .about-story, [data-section='about-story-team']",
        ) || document.body;

      const storySections = Array.from(
        document.querySelectorAll(".about-story-section, [data-story-section]"),
      );

      const scrollPaths = Array.from(
        document.querySelectorAll(
          ".about-story-scroll-path path, .about-story-svg path, .about-story-scroll-path svg path",
        ),
      );

      // Ensure all SVGs and paths have explicit overflow: visible and contain: none for Safari
      document
        .querySelectorAll(
          ".about-story-scroll-path svg, .about-story-svg svg, svg.about-story-svg, .about-story-scroll-path path, .about-story-svg path",
        )
        .forEach((el) => {
          el.setAttribute("overflow", "visible");
          el.style.overflow = "visible";
          el.style.contain = "none";
        });

      // 4. Responsive Base Stroke Width (Desktop: 100px | Tablet: 75px | Mobile: 50px)
      const getBaseStrokeWidth = () => {
        const w = window.innerWidth;
        if (w < 768) return 50;
        if (w < 992) return 75;
        return 100;
      };

      // -------------------------------------------------------------
      // 5. Independent SVG Stroke Draw & Stroke Width Tweens
      // -------------------------------------------------------------
      if (scrollPaths.length && container) {
        const isMobile = window.innerWidth < 768;

        scrollPaths.forEach((path) => {
          path.style.strokeLinecap = "round";
          path.style.strokeLinejoin = "round";

          const baseWidth = getBaseStrokeWidth();

          // Initial state: Circle always visible at origin (drawSVG 0% 0.1% with round cap)
          if (hasDrawSVG) {
            gsap.set(path, {
              drawSVG: "0% 0.1%",
              strokeWidth: baseWidth,
            });
          } else {
            const pathLength = path.getTotalLength
              ? path.getTotalLength()
              : 3000;
            path.style.strokeDasharray = `${baseWidth * 0.1} ${pathLength}`;
            path.style.strokeDashoffset = 0;
            gsap.set(path, { strokeWidth: baseWidth });
          }

          // =========================================================
          // TWEEN 1: PATH DRAW PROGRESS (Independent Timeline)
          // =========================================================
          const drawTl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              scroller: scrollerEl,
              start: "top 80%",
              end: "bottom bottom",
              scrub: 0.8,
            },
          });

          // Responsive Keyframes:
          // On mobile, about sections are compact, so the draw reaches 100% much earlier (at ~0.15s)
          // right as the team section begins.
          const drawKeyframes = isMobile
            ? [
                { drawSVG: "0% 55%", duration: 0.05, ease: "power1.out" }, // Rapid plunge past Section 1
                { drawSVG: "0% 90%", duration: 0.07, ease: "power1.inOut" }, // Quick 360° twist
                { drawSVG: "0% 100%", duration: 0.03, ease: "power1.out" }, // Reaches 100% as team section arrives
              ]
            : [
                { drawSVG: "0% 25%", duration: 0.08, ease: "power1.out" }, // Desktop stage 1 (preserved)
                { drawSVG: "0% 88%", duration: 0.12, ease: "power2.in" }, // Desktop twist (preserved)
                { drawSVG: "0% 100%", duration: 0.05, ease: "power1.out" }, // Desktop end (preserved)
              ];

          if (hasDrawSVG) {
            drawTl.to(
              path,
              {
                keyframes: drawKeyframes,
              },
              0,
            );
            drawTl.to(
              {},
              { duration: isMobile ? 0.17 : 0.07 },
              isMobile ? 0.15 : 0.25,
            );
          } else {
            const pathLength = path.getTotalLength
              ? path.getTotalLength()
              : 3000;

            const fallbackKeyframes = isMobile
              ? [
                  {
                    strokeDasharray: `${pathLength * 0.55} ${pathLength}`,
                    duration: 0.05,
                    ease: "power1.out",
                  },
                  {
                    strokeDasharray: `${pathLength * 0.9} ${pathLength}`,
                    duration: 0.07,
                    ease: "power1.inOut",
                  },
                  {
                    strokeDasharray: `${pathLength} ${pathLength}`,
                    duration: 0.03,
                    ease: "power1.out",
                  },
                ]
              : [
                  {
                    strokeDasharray: `${pathLength * 0.25} ${pathLength}`,
                    duration: 0.08,
                    ease: "power1.out",
                  },
                  {
                    strokeDasharray: `${pathLength * 0.88} ${pathLength}`,
                    duration: 0.12,
                    ease: "power2.in",
                  },
                  {
                    strokeDasharray: `${pathLength} ${pathLength}`,
                    duration: 0.05,
                    ease: "power1.out",
                  },
                ];

            drawTl.to(
              path,
              {
                keyframes: fallbackKeyframes,
              },
              0,
            );
            drawTl.to(
              {},
              { duration: isMobile ? 0.17 : 0.07 },
              isMobile ? 0.15 : 0.25,
            );
          }

          // =========================================================
          // TWEEN 2: STROKE WIDTH EXPANSION & FLOOD (Independent Timeline)
          // =========================================================
          const floodTl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              scroller: scrollerEl,
              start: "top 80%",
              end: "bottom bottom",
              scrub: 0.8,
            },
          });

          const floodStart = isMobile ? 0.1 : 0.2;
          const floodDuration = isMobile ? 0.03 : 0.05;
          const bgDuration = isMobile ? 0.06 : 0.1;

          // Phase B: Stroke width expands fast to 2500px to flood into team section
          floodTl.to(
            path,
            {
              strokeWidth: 2500,
              duration: floodDuration,
              ease: "power2.inOut",
            },
            floodStart,
          );

          // Phase C: Simultaneously transition only the .about-story-team-wrapper to #FF5400
          // Uses rgba(255, 84, 0, 0) -> rgba(255, 84, 0, 1) to eliminate any dirty/blackish intermediate color shift
          const storyTeamWrapper =
            document.querySelector(".about-story-team-wrapper") ||
            document.querySelector(
              ".about-story-team, [data-section='about-story-team']",
            ) ||
            container;

          if (storyTeamWrapper) {
            floodTl.fromTo(
              storyTeamWrapper,
              {
                backgroundColor: "rgba(255, 84, 0, 0)",
              },
              {
                backgroundColor: "rgba(255, 84, 0, 1)",
                duration: bgDuration,
                ease: "power2.inOut",
              },
              floodStart,
            );
          }

          // Lock floodTl total duration to 0.32 so scrub interpolation matches drawTl 1:1 on both mobile and desktop
          floodTl.to(
            {},
            { duration: 0.32 - (floodStart + bgDuration) },
            floodStart + bgDuration,
          );
        });
      }

      // -------------------------------------------------------------
      // 6. Story Sections Content Entrances (Line-Masked Text + Bouncy SVGs)
      // -------------------------------------------------------------
      storySections.forEach((section, idx) => {
        const svgWrap = section.querySelector(
          ".about-story-svg-wrap, .about-story-svg-wrapper",
        );
        const tagText = section.querySelector(".about-story-text");
        const heading = section.querySelector(
          ".about-story-heading, h2, [data-story-heading]",
        );
        const para = section.querySelector(
          ".about-story-para, p, [data-story-para]",
        );

        // Helper: Split an element into lines wrapped in an overflow-hidden mask
        // Executed strictly after fonts are rendered to prevent awkward word splits/orphans
        const setupLineMasks = (element) => {
          if (!element) return [];

          let lines = [];
          if (typeof SplitText !== "undefined") {
            const split = new SplitText(element, {
              type: "lines",
              linesClass: "about-story-line",
            });
            split.lines.forEach((line) => {
              const mask = document.createElement("span");
              mask.className = "about-story-line-mask";
              line.parentNode.insertBefore(mask, line);
              mask.appendChild(line);
            });
            lines = split.lines;
          } else {
            // Native fallback: split by lines or wrap text in mask
            const raw = element.innerHTML.trim();
            if (raw.includes("<br>") || raw.includes("<br/>")) {
              const parts = raw.split(/<br\s*[\/]?>/gi);
              element.innerHTML = parts
                .map(
                  (p) =>
                    `<span class="about-story-line-mask"><span class="about-story-line">${p.trim()}</span></span>`,
                )
                .join("");
            } else {
              element.innerHTML = `<span class="about-story-line-mask"><span class="about-story-line">${raw}</span></span>`;
            }
            lines = Array.from(element.querySelectorAll(".about-story-line"));
          }

          // Initial state: hidden below the overflow-hidden mask
          gsap.set(lines, {
            y: "115%",
            opacity: 0,
          });

          return lines;
        };

        const headingLines = setupLineMasks(heading);
        const paraLines = setupLineMasks(para);

        // Setup Initial States for Tag & SVG Illustration
        const randomTilt = idx % 2 === 0 ? -6 : 6;
        if (svgWrap) {
          gsap.set(svgWrap, {
            opacity: 0,
            scale: 0.65,
            rotation: randomTilt,
            transformOrigin: "center center",
          });
        }

        if (tagText) {
          gsap.set(tagText, {
            opacity: 0,
            y: 16,
          });
        }

        // Build Section Entrance Timeline
        const sectionTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            scroller: scrollerEl,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });

        // 1. Tag Text fade in
        if (tagText) {
          sectionTl.to(
            tagText,
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              ease: "power2.out",
            },
            0,
          );
        }

        // 2. Heading line-masked reveal with subtle bounce
        if (headingLines.length) {
          sectionTl.to(
            headingLines,
            {
              y: "0%",
              opacity: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: "back.out(1.7)",
            },
            0.05,
          );
        }

        // 3. Paragraph line-masked reveal with smooth ease
        if (paraLines.length) {
          sectionTl.to(
            paraLines,
            {
              y: "0%",
              opacity: 1,
              duration: 0.65,
              stagger: 0.06,
              ease: "power2.out",
            },
            0.15,
          );
        }

        // 4. Illustration SVG Wrap pop with bouncy scale and rotation un-tilt
        if (svgWrap) {
          sectionTl.to(
            svgWrap,
            {
              opacity: 1,
              scale: 1,
              rotation: 0,
              duration: 0.85,
              ease: "back.out(2.2)",
            },
            0.1,
          );
        }
      });

      // -------------------------------------------------------------
      // 7. Refresh ScrollTrigger across Load Events
      // -------------------------------------------------------------
      if (window.onTwo26Ready) {
        window.onTwo26Ready(() => {
          ScrollTrigger.refresh();
        });
      }

      window.addEventListener("load", () => {
        ScrollTrigger.refresh();
      });

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 400);
    }

    // Ensure initialization and SplitText line calculations run strictly after web fonts are loaded
    function startInit() {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(initAboutStoryTeam);
      } else {
        initAboutStoryTeam();
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startInit);
    } else {
      startInit();
    }
  })();
