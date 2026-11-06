
  (function () {
    function initCTAButtons() {
      if (typeof gsap === "undefined") return;

      const buttons = document.querySelectorAll(".cta-btn");

      buttons.forEach((btn) => {
        const text = btn.querySelector(".cta-text");
        const arrow = btn.querySelector(".cta-btn-arrow, .svg-arrow-cta");
        const fillHover = btn.querySelector(".cta-btn-fill-hover");

        let arrowLoop = null;

        // 1. Mouse Enter: Scale 10x Fill + Looping Arrow Rotation Bounce
        btn.addEventListener("mouseenter", () => {
          if (fillHover) {
            gsap.to(fillHover, {
              scale: 10,
              duration: 0.55,
              ease: "power2.out",
              overwrite: "auto",
            });
          }

          if (arrow) {
            gsap.set(arrow, { transformOrigin: "center center" });
            if (arrowLoop) arrowLoop.kill();

            arrowLoop = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
            arrowLoop
              .to(arrow, {
                rotation: -25,
                duration: 0.22,
                ease: "power2.out",
              })
              .to(arrow, {
                rotation: 0,
                duration: 0.4,
                ease: "back.out(2.5)",
              });
          }
        });

        // 2. Magnetic Movement (Jitter-Free: Uses true static origin)
        btn.addEventListener("mousemove", (e) => {
          const rect = btn.getBoundingClientRect();
          const currentX = gsap.getProperty(btn, "x") || 0;
          const currentY = gsap.getProperty(btn, "y") || 0;

          // True center of button before any transform offset
          const originCenterX = rect.left - currentX + rect.width / 2;
          const originCenterY = rect.top - currentY + rect.height / 2;

          const deltaX = e.clientX - originCenterX;
          const deltaY = e.clientY - originCenterY;

          // Button magnetic translation
          gsap.to(btn, {
            x: deltaX * 0.35,
            y: deltaY * 0.35,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });

          // Inner elements parallax
          const innerElements = [text, arrow].filter(Boolean);
          if (innerElements.length) {
            gsap.to(innerElements, {
              x: deltaX * 0.15,
              y: deltaY * 0.15,
              duration: 0.3,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        });

        // 3. Mouse Leave: Snap back with spring elasticity & reset
        btn.addEventListener("mouseleave", () => {
          if (arrowLoop) {
            arrowLoop.kill();
            arrowLoop = null;
          }
          if (arrow) {
            gsap.to(arrow, {
              rotation: 0,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          }

          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "elastic.out(1.1, 0.4)",
            overwrite: "auto",
          });

          const innerElements = [text, arrow].filter(Boolean);
          if (innerElements.length) {
            gsap.to(innerElements, {
              x: 0,
              y: 0,
              duration: 0.8,
              ease: "elastic.out(1.1, 0.4)",
              overwrite: "auto",
            });
          }

          if (fillHover) {
            gsap.to(fillHover, {
              scale: 1,
              duration: 0.45,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        });
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initCTAButtons);
    } else {
      initCTAButtons();
    }
  })();
