
  (function () {
    function initMagneticHeading() {
      if (typeof gsap === "undefined") return;

      // Find all unique heading wrappers
      const headingWrappers = Array.from(
        document.querySelectorAll(".section-heading-wrapper"),
      );

      if (!headingWrappers.length) {
        const headers = document.querySelectorAll(".section-projects-header");
        headers.forEach((h) => {
          const hw = h.querySelector(".section-heading-wrapper") || h;
          headingWrappers.push(hw);
        });
      }

      if (!headingWrappers.length) return;

      headingWrappers.forEach((headingWrapper) => {
        const headings = headingWrapper.querySelectorAll(".section-heading");
        if (headings.length < 2) return;

        const primaryHeading = headings[0];
        const orangeHeading =
          headingWrapper.querySelector(
            ".section-heading.orange, .section-heading.is-orange, .section-heading[class*='orange']",
          ) || headings[1];

        if (!orangeHeading || orangeHeading === primaryHeading) return;

        // 1. Ensure absolute layering so orange heading sits directly behind black heading
        headingWrapper.style.position = "relative";

        primaryHeading.style.position = "relative";
        primaryHeading.style.zIndex = "2";
        primaryHeading.style.pointerEvents = "none";

        orangeHeading.style.position = "absolute";
        orangeHeading.style.top = "0";
        orangeHeading.style.left = "0";
        orangeHeading.style.width = "100%";
        orangeHeading.style.height = "100%";
        orangeHeading.style.zIndex = "1";
        orangeHeading.style.pointerEvents = "none";
        orangeHeading.style.margin = "0";
        orangeHeading.style.willChange = "transform";

        // 2. Continuous Directional Tracking (1-4px offset)
        const hoverZone =
          headingWrapper.closest(".section-projects-header") ||
          headingWrapper.parentElement ||
          headingWrapper;

        const MAX_OFFSET = 4;

        const handlePointerMove = (e) => {
          const rect = headingWrapper.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const dx = e.clientX - centerX;
          const dy = e.clientY - centerY;

          const distance = Math.hypot(dx, dy);
          const maxRadius = Math.max(rect.width, rect.height) / 2 || 100;

          // Normalized intensity based on distance from center (1px to 4px)
          const intensity = Math.min(1, Math.max(0.25, distance / maxRadius));
          const angle = Math.atan2(dy, dx);

          const targetX = Math.cos(angle) * (intensity * MAX_OFFSET);
          const targetY = Math.sin(angle) * (intensity * MAX_OFFSET);

          gsap.to(orangeHeading, {
            x: targetX,
            y: targetY,
            duration: 0.2,
            ease: "power1.out",
            overwrite: "auto",
          });
        };

        const handlePointerLeave = () => {
          gsap.to(orangeHeading, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "elastic.out(1.1, 0.4)",
            overwrite: "auto",
          });
        };

        hoverZone.addEventListener("pointermove", handlePointerMove, {
          passive: true,
        });
        hoverZone.addEventListener("pointerleave", handlePointerLeave);
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initMagneticHeading);
    } else {
      initMagneticHeading();
    }
  })();
