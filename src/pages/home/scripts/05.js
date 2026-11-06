
  (function () {
    function initTwo26MobileSystem() {
      if (typeof gsap === "undefined") return;

      const hamNavbar = document.querySelector(".ham-navbar");
      const toggleButtons = Array.from(
        document.querySelectorAll(
          ".two26-nav-toggle-btn, .two26-toggle-btn, .menu-btn, .nav-toggle, [data-menu-toggle]",
        ),
      );

      let isMenuOpen = false;
      let navTimeline = null;
      let iconTimeline = null;

      // -------------------------------------------------------------
      // 1. Setup Toggle SVG Morphing Timeline (Horseshoe <-> 45deg Cross)
      // -------------------------------------------------------------
      const svgEls = Array.from(
        document.querySelectorAll(".two26-toggle-svg, .target-svg"),
      );

      let orangePath = null;
      let crossPath = null;
      let orangeTotalLen = 0;
      let crossTotalLen = 20;
      let horseshoeLen = 0;
      let stemLen = 20.0;
      let finalOffset = 0;
      let dashObj = null;

      if (svgEls.length) {
        const primarySvg = svgEls[0];
        orangePath =
          primarySvg.querySelector(".orange-path") ||
          primarySvg.querySelectorAll("path")[0];
        crossPath =
          primarySvg.querySelector(".cross-path") ||
          primarySvg.querySelectorAll("path")[1];

        if (orangePath && crossPath) {
          orangeTotalLen = orangePath.getTotalLength();
          crossTotalLen = crossPath.getTotalLength() || 20;

          horseshoeLen = orangeTotalLen * 0.44;
          for (let len = 0; len < orangeTotalLen; len += 0.2) {
            const pt = orangePath.getPointAtLength(len);
            if (len > 30 && pt.x <= 9.05 && Math.abs(pt.y - 16.02) < 0.3) {
              horseshoeLen = len;
              break;
            }
          }

          finalOffset = -(orangeTotalLen - stemLen);

          // Initial SVG state
          svgEls.forEach((svg) => {
            const op =
              svg.querySelector(".orange-path") ||
              svg.querySelectorAll("path")[0];
            const cp =
              svg.querySelector(".cross-path") ||
              svg.querySelectorAll("path")[1];
            if (op) {
              op.style.strokeDasharray = `${horseshoeLen} ${orangeTotalLen}`;
              op.style.strokeDashoffset = "0";
            }
            if (cp) {
              cp.style.strokeDasharray = `${crossTotalLen} ${crossTotalLen}`;
              cp.style.strokeDashoffset = `${crossTotalLen}`;
              gsap.set(cp, { strokeWidth: 0 });
            }
            gsap.set(svg, { rotation: 0, transformOrigin: "center center" });
          });

          iconTimeline = gsap.timeline({ paused: true });
          dashObj = { len: horseshoeLen, offset: 0 };

          iconTimeline
            .to(
              dashObj,
              {
                len: stemLen,
                offset: finalOffset,
                duration: 0.85,
                ease: "power2.inOut",
                onUpdate: () => {
                  svgEls.forEach((svg) => {
                    const op =
                      svg.querySelector(".orange-path") ||
                      svg.querySelectorAll("path")[0];
                    if (op) {
                      op.style.strokeDasharray = `${dashObj.len} ${orangeTotalLen}`;
                      op.style.strokeDashoffset = `${dashObj.offset}`;
                    }
                  });
                },
              },
              0,
            )
            .to(
              svgEls
                .map(
                  (svg) =>
                    svg.querySelector(".cross-path") ||
                    svg.querySelectorAll("path")[1],
                )
                .filter(Boolean),
              {
                strokeWidth: 4,
                duration: 0.12,
                ease: "back.out(2)",
              },
              0.1,
            )
            .to(
              svgEls
                .map(
                  (svg) =>
                    svg.querySelector(".cross-path") ||
                    svg.querySelectorAll("path")[1],
                )
                .filter(Boolean),
              {
                strokeDashoffset: 0,
                duration: 0.6,
                ease: "power2.out",
              },
              0.2,
            )
            .to(
              svgEls,
              {
                rotation: 45,
                duration: 0.85,
                ease: "power3.inOut",
              },
              0,
            );
        }
      }

      // -------------------------------------------------------------
      // 2. Setup Fullscreen Menu Entrance & Stagger Links
      // -------------------------------------------------------------
      const linksContainer = hamNavbar
        ? hamNavbar.querySelector(".hamburger-links")
        : null;
      const linkItems = linksContainer
        ? Array.from(linksContainer.children)
        : [];

      function openMenu() {
        if (isMenuOpen) return;
        isMenuOpen = true;

        // Play Icon Morph
        if (iconTimeline) iconTimeline.play();

        if (hamNavbar) {
          document.body.style.overflow = "hidden";
          hamNavbar.classList.add("is-open");
          hamNavbar.style.display = "flex";
          hamNavbar.style.pointerEvents = "auto";

          if (navTimeline) navTimeline.kill();
          navTimeline = gsap.timeline();

          navTimeline.fromTo(
            hamNavbar,
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: "power2.out" },
            0,
          );

          if (linkItems.length) {
            linkItems.forEach((item, index) => {
              const randomTilt = gsap.utils.random(-10, 10);
              navTimeline.fromTo(
                item,
                {
                  opacity: 0,
                  x: -35,
                  y: 50,
                  scale: 0.4,
                  rotation: randomTilt,
                },
                {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                  rotation: 0,
                  duration: 0.75,
                  ease: "back.out(2.2)", // Signature TWO 26 spring bounce
                },
                0.15 + index * 0.09,
              );
            });
          }
        }
      }

      function closeMenu() {
        if (!isMenuOpen) return;

        // Reverse Icon Morph
        if (iconTimeline) iconTimeline.reverse();

        if (hamNavbar) {
          if (navTimeline) navTimeline.kill();
          navTimeline = gsap.timeline({
            onComplete: () => {
              hamNavbar.classList.remove("is-open");
              hamNavbar.style.display = "none";
              hamNavbar.style.pointerEvents = "none";
              document.body.style.overflow = "";
              isMenuOpen = false;
            },
          });

          if (linkItems.length) {
            navTimeline.to(
              linkItems,
              {
                opacity: 0,
                y: 20,
                scale: 0.8,
                duration: 0.25,
                stagger: 0.04,
                ease: "power2.in",
              },
              0,
            );
          }

          navTimeline.to(
            hamNavbar,
            { opacity: 0, duration: 0.3, ease: "power2.inOut" },
            0.1,
          );
        } else {
          isMenuOpen = false;
        }
      }

      function toggleMenu(e) {
        if (e) e.stopPropagation();
        if (isMenuOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      }

      // -------------------------------------------------------------
      // 3. Event Listeners
      // -------------------------------------------------------------
      toggleButtons.forEach((btn) => {
        if (!btn.__two26Bound) {
          btn.__two26Bound = true;
          btn.addEventListener("click", toggleMenu);
        }
      });

      // Close when clicking on any link inside the menu
      linkItems.forEach((item) => {
        const clickable =
          item.tagName.toLowerCase() === "a" ? item : item.querySelector("a");
        if (clickable) {
          clickable.addEventListener("click", () => {
            closeMenu();
          });
        }
      });

      // Global API
      window.__two26MobileMenu = {
        open: openMenu,
        close: closeMenu,
        toggle: toggleMenu,
        isOpen: () => isMenuOpen,
      };
    }

    // Defensive loading with GSAP polling
    function safeInit() {
      if (typeof gsap !== "undefined") {
        initTwo26MobileSystem();
      } else {
        let count = 0;
        const checkGsap = setInterval(() => {
          count++;
          if (typeof gsap !== "undefined") {
            clearInterval(checkGsap);
            initTwo26MobileSystem();
          } else if (count > 40) {
            clearInterval(checkGsap);
          }
        }, 80);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", safeInit);
    } else {
      safeInit();
    }

    window.addEventListener("load", safeInit);

    if (window.Webflow) {
      window.Webflow.push(function () {
        safeInit();
      });
    }
  })();
