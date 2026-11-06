
  (function () {
    function initProjectCardHover() {
      if (typeof gsap === "undefined") return;

      if (typeof DrawSVGPlugin !== "undefined") {
        gsap.registerPlugin(DrawSVGPlugin);
      }
      if (typeof SplitText !== "undefined") {
        gsap.registerPlugin(SplitText);
      }

      const cards = document.querySelectorAll(".project-card");
      if (!cards.length) return;

      // Mask SVG path coordinates provided
      const MASK_PATH_D =
        "M25.007 729.507C25.007 729.507 136.507 1065.7 290.007 969.007C506.711 832.495 -164.765 175.16 89.5069 44.5066C315.057 -71.3883 462.507 559.507 615.507 515.007C768.507 470.507 615.507 25.0068 615.507 25.0068";
      const TARGET_STROKE_WIDTH = 1200;

      cards.forEach((card, index) => {
        const imgWrapper = card.querySelector(".project-card-img-wrapper");
        if (!imgWrapper) return;

        imgWrapper.style.position = "relative";
        imgWrapper.style.overflow = "hidden";

        const baseImg = imgWrapper.querySelector(".project-img");
        const hoverImg = imgWrapper.querySelector(".project-img-hover");
        const svgContainer = imgWrapper.querySelector(".project-img-svg");

        if (baseImg) {
          baseImg.style.display = "block";
          baseImg.style.width = "100%";
          baseImg.style.height = "100%";
          baseImg.style.objectFit = "cover";
          baseImg.style.objectPosition = "center";
        }

        // 1. Setup Foreground Brush SVG (.project-img-svg)
        let foregroundStrokePath = null;
        if (svgContainer) {
          svgContainer.style.position = "absolute";
          svgContainer.style.top = "0";
          svgContainer.style.left = "0";
          svgContainer.style.width = "100%";
          svgContainer.style.height = "100%";
          svgContainer.style.pointerEvents = "none";
          svgContainer.style.zIndex = "2";

          const innerSvg = svgContainer.querySelector("svg");
          if (innerSvg) {
            innerSvg.style.width = "100%";
            innerSvg.style.height = "100%";
            innerSvg.style.display = "block";
            innerSvg.style.overflow = "visible";
            if (!innerSvg.getAttribute("viewBox")) {
              innerSvg.setAttribute("viewBox", "0 0 709 1012");
            }
            innerSvg.setAttribute("preserveAspectRatio", "xMidYMid slice");
          }

          foregroundStrokePath = svgContainer.querySelector("path");
          if (foregroundStrokePath) {
            foregroundStrokePath.style.strokeLinecap = "round";
            foregroundStrokePath.style.strokeLinejoin = "round";
            foregroundStrokePath.style.willChange =
              "stroke-dashoffset, stroke-width";
          }
        }

        // 2. Setup Dynamic SVG Mask Layer for Hover Image (.project-img-hover)
        let maskStrokePath = null;
        if (hoverImg) {
          // Read image source from Webflow Image element
          const imgSrc =
            hoverImg.currentSrc ||
            hoverImg.getAttribute("src") ||
            hoverImg.getAttribute("data-src") ||
            "";

          // Hide original HTML <img> so it only displays inside our hardware-accelerated SVG mask
          hoverImg.style.display = "none";

          const maskId = `project-mask-${index}`;

          // Create SVG element with Mask & Clipped Image
          const maskSvg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
          );
          maskSvg.setAttribute("class", "project-card-mask-overlay");
          maskSvg.setAttribute("viewBox", "0 0 709 1012");
          maskSvg.setAttribute("preserveAspectRatio", "xMidYMid slice");
          maskSvg.style.position = "absolute";
          maskSvg.style.top = "0";
          maskSvg.style.left = "0";
          maskSvg.style.width = "100%";
          maskSvg.style.height = "100%";
          maskSvg.style.pointerEvents = "none";
          maskSvg.style.zIndex = "3";
          maskSvg.style.overflow = "visible";

          maskSvg.innerHTML = `
            <defs>
              <mask id="${maskId}" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1109" height="1412">
                <path class="mask-brush-path" d="${MASK_PATH_D}" stroke="#FFFFFF" stroke-width="0" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              </mask>
            </defs>
            <image href="${imgSrc}" xlink:href="${imgSrc}" x="0" y="0" width="709" height="1012" preserveAspectRatio="xMidYMid slice" mask="url(#${maskId})" />
          `;

          imgWrapper.appendChild(maskSvg);

          // If hover image was still loading when initialized, update SVG image on load
          const svgImg = maskSvg.querySelector("image");
          if (!hoverImg.complete) {
            hoverImg.addEventListener("load", () => {
              const freshSrc =
                hoverImg.currentSrc ||
                hoverImg.getAttribute("src") ||
                hoverImg.src;
              if (freshSrc && svgImg) {
                svgImg.setAttribute("href", freshSrc);
                svgImg.setAttributeNS(
                  "http://www.w3.org/1999/xlink",
                  "xlink:href",
                  freshSrc,
                );
              }
            });
          }

          maskStrokePath = maskSvg.querySelector(".mask-brush-path");
          if (maskStrokePath) {
            maskStrokePath.style.willChange = "stroke-dashoffset, stroke-width";
          }
        }

        // 3. Setup Arrow (.projects-arrow)
        const arrow = card.querySelector(".projects-arrow");
        const arrowTarget = arrow ? arrow.querySelector("svg") || arrow : null;
        if (arrowTarget) {
          gsap.set(arrowTarget, {
            transformOrigin: "center center",
            rotation: 0,
            scale: 1,
            willChange: "transform",
          });
        }

        // 4. Create Sequenced Timeline: Foreground SVG First -> Mask Reveal Second (Top to Bottom)
        const hasDrawSVG = typeof DrawSVGPlugin !== "undefined";

        // Initial setup for Top-to-Bottom draw (100% 100% is at the top of the path: y:25)
        if (hasDrawSVG) {
          if (foregroundStrokePath) {
            gsap.set(foregroundStrokePath, {
              drawSVG: "100% 100%",
              strokeWidth: 0,
            });
          }
          if (maskStrokePath) {
            gsap.set(maskStrokePath, {
              drawSVG: "100% 100%",
              strokeWidth: 0,
            });
          }
        } else {
          [foregroundStrokePath, maskStrokePath]
            .filter(Boolean)
            .forEach((path) => {
              const length = path.getTotalLength ? path.getTotalLength() : 2500;
              path.style.strokeDasharray = length;
              path.style.strokeDashoffset = -length;
              path.style.strokeWidth = "0px";
            });
        }

        const hoverTl = gsap.timeline({
          paused: true,
          defaults: { ease: "power1.inOut" },
        });

        // Step 1: Foreground SVG stroke draws in first from top to bottom (stroke from 0 to 600)
        if (foregroundStrokePath) {
          if (hasDrawSVG) {
            hoverTl.to(
              foregroundStrokePath,
              {
                drawSVG: "0% 100%",
                strokeWidth: TARGET_STROKE_WIDTH,
                duration: 0.95,
              },
              0,
            );
          } else {
            hoverTl.to(
              foregroundStrokePath,
              {
                strokeDashoffset: 0,
                strokeWidth: TARGET_STROKE_WIDTH,
                duration: 0.95,
              },
              0,
            );
          }
        }

        // Step 2: Mask stroke draws from top to bottom, expanding to reveal hover image
        if (maskStrokePath) {
          if (hasDrawSVG) {
            hoverTl.to(
              maskStrokePath,
              {
                drawSVG: "0% 100%",
                strokeWidth: TARGET_STROKE_WIDTH,
                duration: 1.05,
              },
              0.35, // Sequenced start with fluid overlap
            );
          } else {
            hoverTl.to(
              maskStrokePath,
              {
                strokeDashoffset: 0,
                strokeWidth: TARGET_STROKE_WIDTH,
                duration: 1.05,
              },
              0.35,
            );
          }
        }

        // Step 3: Arrow Rotate to Top -45deg and Spring Back to 0deg with Prominent Elastic Bounce
        if (arrowTarget) {
          hoverTl
            .to(
              arrowTarget,
              {
                rotation: -45,
                duration: 0.28,
                ease: "power2.out",
              },
              0,
            )
            .to(
              arrowTarget,
              {
                rotation: 0,
                duration: 0.65,
                ease: "elastic.out(1.15, 0.35)",
              },
              0.28,
            );
        }

        // 5. Bind Hover Listeners
        card.addEventListener("mouseenter", () => {
          hoverTl.timeScale(1).play();
        });

        card.addEventListener("mouseleave", () => {
          hoverTl.timeScale(1.3).reverse();
        });
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initProjectCardHover);
    } else {
      initProjectCardHover();
    }
  })();
