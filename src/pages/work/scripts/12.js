
  (function () {
    function initTwo26ProjectsSection() {
      // 1. Defensive verification for GSAP & ScrollTrigger
      if (typeof gsap === "undefined") {
        document
          .querySelectorAll(
            ".project-card, .projects-end-para, .projects-pill-first, .projects-pill-second, .projects-pill-third, .projects-pill-fourth, .project-btn",
          )
          .forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "none";
            el.style.clipPath = "none";
          });
        return;
      }

      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }
      if (typeof SplitText !== "undefined") {
        gsap.registerPlugin(SplitText);
      }

      const section = document.querySelector(
        ".section-projects, section.projects, [data-section='projects']",
      );
      if (!section) return;

      const scrollerEl = document.querySelector(".page") || window;

      // -------------------------------------------------------------
      // 2. Project Cards Clip-Mask Reveal Animation (6 Cards)
      // - Starts from 15% width & 15% height (inset 42.5% all sides) + 36px radius
      // - Card starts scaled higher at 1.4 with 3D perspective tilt
      // - Reveals to 100% width & height (inset 0%) + 0px radius + scale 1 + 0deg tilt
      // - Duration: 1.25s (power3.out)
      // - Only animates when entering from top (plays downwards, stays on reverse up)
      // -------------------------------------------------------------
      const projectCards = Array.from(
        section.querySelectorAll(
          ".projects-list .project-card, .projects-vertical-wrapper .project-card, .project-item .project-card, .project-card",
        ),
      );

      projectCards.forEach((card, index) => {
        // Wrap card in clip mask container
        let maskWrapper = card.parentElement;
        if (!maskWrapper.classList.contains("project-card-clip-mask")) {
          maskWrapper = document.createElement("div");
          maskWrapper.className = "project-card-clip-mask";
          card.parentNode.insertBefore(maskWrapper, card);
          maskWrapper.appendChild(card);
        }

        // Initial State:
        // 15% width & 15% height mask (inset 42.5% each side) with 36px border radius
        gsap.set(maskWrapper, {
          clipPath: "inset(42.5% 42.5% 42.5% 42.5%)",
          webkitClipPath: "inset(42.5% 42.5% 42.5% 42.5%)",
          borderRadius: "36px",
          overflow: "hidden",
          willChange: "clip-path, border-radius",
        });

        // Inner card starts scaled at 1.45 with strong 3D perspective tilt
        const horizontalTilt = index % 2 === 0 ? -16 : 16;
        const zTilt = index % 2 === 0 ? -4 : 4;
        gsap.set(card, {
          scale: 1.45,
          rotationX: 25,
          rotationY: horizontalTilt,
          rotation: zTilt,
          transformPerspective: 800,
          transformOrigin: "center center",
          willChange: "transform",
        });

        // ScrollTrigger: only animates when entering from top (downwards scroll)
        // Stays fully revealed when coming back up from below
        const cardTl = gsap.timeline({
          scrollTrigger: {
            trigger: maskWrapper,
            scroller: scrollerEl,
            start: "top 85%",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
          },
        });

        cardTl.to(
          maskWrapper,
          {
            clipPath: "inset(0% 0% 0% 0%)",
            webkitClipPath: "inset(0% 0% 0% 0%)",
            borderRadius: "0px",
            duration: 1.25,
            ease: "power3.out",
          },
          0,
        );

        cardTl.to(
          card,
          {
            scale: 1,
            rotationX: 0,
            rotationY: 0,
            rotation: 0,
            duration: 1.25,
            ease: "power3.out",
          },
          0,
        );
      });

      // -------------------------------------------------------------
      // 3. Projects End Section Animation (.projects-end only)
      // Heading with LINE-BY-LINE slide up reveal + Milestone Pills
      // -------------------------------------------------------------
      const projectsEnd = section.querySelector(
        ".projects-end, .projects-end-inner-wrapper",
      );
      if (projectsEnd) {
        const endPara = projectsEnd.querySelector(
          ".projects-end-para, p, h2, h3, .heading",
        );
        const pills = Array.from(
          projectsEnd.querySelectorAll(
            ".projects-pill-first, .projects-pill-second, .projects-pill-third, .projects-pill-fourth, [class*='projects-pill']",
          ),
        );
        const projectBtn = projectsEnd.querySelector(
          ".project-btn, .cta-btn, a[class*='btn']",
        );

        if (endPara) {
          // A. Split Heading Line-by-Line
          let linesList = [];
          if (typeof SplitText !== "undefined") {
            const split = new SplitText(endPara, {
              type: "lines",
              linesClass: "project-line",
            });
            split.lines.forEach((line) => {
              const mask = document.createElement("span");
              mask.className = "project-line-mask";
              line.parentNode.insertBefore(mask, line);
              mask.appendChild(line);
            });
            linesList = split.lines;
          } else {
            const rawText = endPara.textContent.trim();
            endPara.innerHTML = `<span class="project-line-mask"><span class="project-line">${rawText}</span></span>`;
            linesList = Array.from(endPara.querySelectorAll(".project-line"));
          }

          // Initial state
          gsap.set(endPara, { opacity: 1 });
          gsap.set(linesList, {
            y: "115%",
            opacity: 0,
          });

          // B. Prepare Pills (Initial State)
          pills.forEach((pill) => {
            gsap.set(pill, {
              opacity: 0,
              scale: 0.4,
              y: 20,
              transformOrigin: "center center",
            });
            const pillInner = pill.querySelector("span, [class*='text'], div");
            if (pillInner) {
              gsap.set(pillInner, {
                opacity: 0,
                y: 15,
                display: "inline-block",
              });
            }
          });

          // C. Prepare Button (Initial State)
          if (projectBtn) {
            gsap.set(projectBtn, {
              opacity: 0,
              scale: 0.4,
              y: 20,
              transformOrigin: "center center",
            });
            const btnText = projectBtn.querySelector(
              ".cta-text, [class*='text'], span",
            );
            if (btnText) {
              gsap.set(btnText, {
                opacity: 0,
                y: 15,
                display: "inline-block",
              });
            }
          }

          // D. Build Master ScrollTrigger Timeline
          const masterTl = gsap.timeline({
            paused: true,
            scrollTrigger: {
              trigger: projectsEnd,
              scroller: scrollerEl,
              start: "top 80%",
              toggleActions: "play none none none",
              invalidateOnRefresh: true,
              onEnter: () => masterTl.play(),
            },
          });

          masterTl.timeScale(0.75); // 75% speed matching hero section

          // Animate Heading Line-by-Line
          masterTl.to(
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

          const totalLinesTime = linesList.length * 0.12 + 0.5;

          // Animate Pills (milestone appearance)
          pills.forEach((pill, i) => {
            const pillStart =
              0.2 + (i / Math.max(1, pills.length)) * totalLinesTime * 0.7;
            const pillInner = pill.querySelector("span, [class*='text'], div");

            masterTl.to(
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

            if (pillInner) {
              masterTl.to(
                pillInner,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  ease: "back.out(1.6)",
                },
                pillStart + 0.15,
              );
            }
          });

          // Animate Button
          if (projectBtn) {
            const btnStart = totalLinesTime + 0.15;
            const btnText = projectBtn.querySelector(
              ".cta-text, [class*='text'], span",
            );

            masterTl.to(
              projectBtn,
              {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.55,
                ease: "back.out(2.5)",
              },
              btnStart,
            );

            if (btnText) {
              masterTl.to(
                btnText,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  ease: "back.out(1.6)",
                },
                btnStart + 0.15,
              );
            }
          }
        }
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initTwo26ProjectsSection);
    } else {
      initTwo26ProjectsSection();
    }
  })();
