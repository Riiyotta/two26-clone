
  (function () {
    function initProjectsWorkStack() {
      // 1. Defensive verification for GSAP & ScrollTrigger
      if (typeof gsap === "undefined") return;

      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }
      if (typeof DrawSVGPlugin !== "undefined") {
        gsap.registerPlugin(DrawSVGPlugin);
      }

      const hasDrawSVG = typeof DrawSVGPlugin !== "undefined";
      const scrollerEl = document.querySelector(".page") || window;

      // 2. Elements Selection matching Webflow Navigator
      const section = document.querySelector(
        ".section-projects-work, [data-section='projects-work']",
      );
      if (!section) return;

      const workList = section.querySelector(".prjs-work-list") || section;
      const workItems = Array.from(section.querySelectorAll(".prjs-work-item"));
      if (!workItems.length) return;

      // Ensure proper stacking order (higher index on top)
      workItems.forEach((item, index) => {
        item.style.zIndex = (index + 1).toString();
      });

      // -------------------------------------------------------------
      // 3. Target Stroke Width for Paint Wipe (1000px)
      // -------------------------------------------------------------
      const getTargetStrokeWidth = () => {
        return 1000;
      };

      // -------------------------------------------------------------
      // 4. ScrollTrigger Stacking & Previous Project's SVG Stroke Animation
      // -------------------------------------------------------------
      // Initialize all SVG stroke paths
      workItems.forEach((item) => {
        const transitionCover = item.querySelector(
          ".prj-transiton-cover, .prj-transition-cover",
        );
        const svgPath = transitionCover
          ? transitionCover.querySelector(
              ".prj-stroke svg path, svg path, path",
            )
          : null;

        if (svgPath) {
          svgPath.style.strokeLinecap = "round";
          svgPath.style.strokeLinejoin = "round";

          // Initialize SVG Stroke (Draw 0 & StrokeWidth 0)
          if (hasDrawSVG) {
            gsap.set(svgPath, {
              drawSVG: "0%",
              strokeWidth: 0,
            });
          } else {
            const pathLength = svgPath.getTotalLength
              ? svgPath.getTotalLength()
              : 3500;
            svgPath.style.strokeDasharray = pathLength;
            svgPath.style.strokeDashoffset = pathLength;
            gsap.set(svgPath, { strokeWidth: 0 });
          }
        }
      });

      // Animate the PREVIOUS project's scale, rotation, and transition cover SVG as NEXT project scrolls up over it
      for (let i = 0; i < workItems.length - 1; i++) {
        const prevItem = workItems[i];
        const nextItem = workItems[i + 1];

        const prevCard =
          prevItem.querySelector(".project-work-wrapper") || prevItem;
        const prevTransitionCover = prevItem.querySelector(
          ".prj-transiton-cover, .prj-transition-cover",
        );
        const prevSvgPath = prevTransitionCover
          ? prevTransitionCover.querySelector(
              ".prj-stroke svg path, svg path, path",
            )
          : null;

        // Alternate subtle random tilt angle per card (-4 to -2 or +2 to +4 deg)
        const randomTilt = (i % 2 === 0 ? -1 : 1) * gsap.utils.random(2.5, 4.5);

        const stackTl = gsap.timeline({
          scrollTrigger: {
            trigger: nextItem,
            scroller: scrollerEl,
            start: "top bottom",
            end: "top top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        // 1. Scale down previous project by .25 (1.0 -> 0.75) + random rotation for depth
        stackTl.to(
          prevCard,
          {
            scale: 0.75,
            rotation: randomTilt,
            transformOrigin: "center center",
            ease: "power1.inOut",
          },
          0,
        );

        // 2. Animate SVG transition cover paint wipe on previous project
        if (prevSvgPath) {
          if (hasDrawSVG) {
            stackTl
              .to(
                prevSvgPath,
                {
                  drawSVG: "100%",
                  ease: "none",
                },
                0,
              )
              .to(
                prevSvgPath,
                {
                  strokeWidth: () => getTargetStrokeWidth(),
                  ease: "power2.inOut",
                },
                0,
              );
          } else {
            stackTl
              .to(
                prevSvgPath,
                {
                  strokeDashoffset: 0,
                  ease: "none",
                },
                0,
              )
              .to(
                prevSvgPath,
                {
                  strokeWidth: () => getTargetStrokeWidth(),
                  ease: "power2.inOut",
                },
                0,
              );
          }
        }
      }

      // -------------------------------------------------------------
      // 5. Cursor-Follower Logic (Desktop 992px+ with Fine Pointer Only)
      // -------------------------------------------------------------
      const isDesktopPointer =
        window.innerWidth >= 992 &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      if (!isDesktopPointer) {
        // Ensure all project-info elements and child pills remain in static natural layout
        workItems.forEach((item) => {
          const info = item.querySelector(".project-info");
          if (info) {
            gsap.set(info, { clearProps: "all" });
            const pills = info.querySelectorAll(
              ".project-pill-small, .pill-wrap, [class*='pill'], span, div",
            );
            if (pills.length) {
              gsap.set(pills, { clearProps: "all" });
            }
          }
        });
        return;
      }

      // Track mouse position
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let currentX = mouseX;
      let currentY = mouseY;
      let isInsideList = false;
      let activeItemIndex = -1;

      // Structure info items and their child pills with individual trailing physics
      const projectInfoData = workItems.map((item, itemIdx) => {
        const info = item.querySelector(".project-info");
        const pills = info
          ? Array.from(
              info.querySelectorAll(
                ".project-pill-small, .pill-wrap, [class*='pill'], span, div",
              ),
            )
          : [];

        // Filter to direct children or unique top-level pills
        const directPills =
          pills.filter(
            (p) =>
              p.parentElement === info ||
              p.classList.contains("project-pill-small") ||
              p.classList.contains("pill-wrap"),
          ).length > 0
            ? pills.filter(
                (p) =>
                  p.parentElement === info ||
                  p.classList.contains("project-pill-small") ||
                  p.classList.contains("pill-wrap"),
              )
            : pills;

        if (info) {
          gsap.set(info, { scale: 0, transformOrigin: "center center" });
          if (directPills.length) {
            gsap.set(directPills, {
              scale: 0,
              x: 0,
              y: 0,
              transformOrigin: "center center",
            });
          }
        }

        // Initialize per-pill trailing coordinates
        const pillTrails = directPills.map(() => ({
          x: mouseX,
          y: mouseY,
        }));

        return {
          item,
          info,
          pills: directPills,
          pillTrails,
          isHovered: false,
        };
      });

      // Determine active item based on scroll & cursor position
      const updateActiveItem = () => {
        const windowHeight = window.innerHeight;

        for (let i = 0; i < workItems.length; i++) {
          const rect = workItems[i].getBoundingClientRect();
          if (
            rect.top <= windowHeight * 0.5 &&
            rect.bottom >= windowHeight * 0.5
          ) {
            if (activeItemIndex !== i && isInsideList) {
              hideProjectInfo(activeItemIndex);
              activeItemIndex = i;
              showProjectInfo(activeItemIndex);
            }
            break;
          }
        }
      };

      window.addEventListener("scroll", updateActiveItem, { passive: true });

      // Mouse Move Listener
      const onMouseMove = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      };

      window.addEventListener("mousemove", onMouseMove, { passive: true });

      // Animate project info items IN (Scale 0 -> 1 with bouncy stagger)
      const showProjectInfo = (index) => {
        projectInfoData.forEach((data, idx) => {
          if (!data.info) return;

          if (idx === index && isInsideList) {
            data.isHovered = true;

            // Reset trails to current mouse position to prevent jump
            data.pillTrails.forEach((trail) => {
              trail.x = mouseX;
              trail.y = mouseY;
            });

            gsap.to(data.info, {
              scale: 1,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });

            if (data.pills.length) {
              gsap.to(data.pills, {
                scale: 1,
                duration: 0.45,
                stagger: 0.05,
                ease: "back.out(2)",
                overwrite: "auto",
              });
            }
          } else {
            hideProjectInfo(idx);
          }
        });
      };

      // Animate project info items OUT (Scale down to 0 on exit)
      const hideProjectInfo = (index) => {
        const data = projectInfoData[index];
        if (!data || !data.info) return;

        data.isHovered = false;

        if (data.pills.length) {
          gsap.to(data.pills, {
            scale: 0,
            duration: 0.25,
            stagger: 0.03,
            ease: "back.in(1.7)",
            overwrite: "auto",
          });
        }

        gsap.to(data.info, {
          scale: 0,
          duration: 0.25,
          delay: 0.08,
          ease: "power2.in",
          overwrite: "auto",
        });
      };

      const hideAllProjectInfo = () => {
        projectInfoData.forEach((_, idx) => hideProjectInfo(idx));
      };

      // Mouse enter/leave handlers on each individual work item
      projectInfoData.forEach((data, index) => {
        data.item.addEventListener("mouseenter", () => {
          isInsideList = true;
          activeItemIndex = index;
          showProjectInfo(activeItemIndex);
        });

        data.item.addEventListener("mouseleave", () => {
          hideProjectInfo(index);
        });
      });

      // Work list container bounds check
      workList.addEventListener("mouseleave", () => {
        isInsideList = false;
        activeItemIndex = -1;
        hideAllProjectInfo();
      });

      // Render Loop for Smooth Cursor Lerp + Trailing Physics per Pill
      let rafId;
      const render = () => {
        // Main cursor lerp (0.16 smoothing factor)
        currentX += (mouseX - currentX) * 0.16;
        currentY += (mouseY - currentY) * 0.16;

        projectInfoData.forEach((data, idx) => {
          if (!data.info) return;

          const infoScale = gsap.getProperty(data.info, "scale");

          if (data.isHovered || infoScale > 0.005) {
            // Main info container tracks smooth center
            data.info.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

            // Calculate trailing lag per child pill
            data.pills.forEach((pill, pIdx) => {
              const trail = data.pillTrails[pIdx];
              if (!trail) return;

              // Staggered speed factor: pill 0 is fastest, subsequent pills lag behind
              const speed = Math.max(0.07, 0.18 - pIdx * 0.035);

              trail.x += (mouseX - trail.x) * speed;
              trail.y += (mouseY - trail.y) * speed;

              const lagX = (trail.x - currentX) * 0.75;
              const lagY = (trail.y - currentY) * 0.75;

              // Apply trailing offset while GSAP controls scale
              gsap.set(pill, {
                x: lagX,
                y: lagY,
              });
            });
          }
        });

        rafId = requestAnimationFrame(render);
      };

      rafId = requestAnimationFrame(render);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initProjectsWorkStack);
    } else {
      initProjectsWorkStack();
    }
  })();
