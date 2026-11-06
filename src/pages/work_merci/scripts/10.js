
  (function () {
    function initTwo26FooterAnimation() {
      // 1. Defensive verification for GSAP & ScrollTrigger
      if (typeof gsap === "undefined") return;

      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }
      if (typeof SplitText !== "undefined") {
        gsap.registerPlugin(SplitText);
      }

      const path = window.location.pathname.toLowerCase().replace(/\/+$/, "");
      const isWorkCmsPage =
        path.startsWith("/work/") ||
        (path.indexOf("/work/") !== -1 && path !== "/work");
      const scrollerEl = isWorkCmsPage
        ? window
        : document.querySelector(".page") || window;

      // 2. Elements Selection matching Webflow Navigator
      const footer = document.querySelector(
        "footer, .footer, .footer-wrapper, [data-section='footer']",
      );
      if (!footer) return;

      const footerBtm = footer.querySelector(".footer-btm");
      const footerHeadings = Array.from(
        footer.querySelectorAll(
          ".footer-heading, h2.footer-heading, .footer-top-left h2, .footer-top-left .heading",
        ),
      );

      // -------------------------------------------------------------
      // 3. Footer Heading: SplitText by Line with Overflow Clip & Bounce
      // -------------------------------------------------------------
      let allHeadingLines = [];

      footerHeadings.forEach((heading) => {
        let lines = [];

        if (typeof SplitText !== "undefined") {
          const split = new SplitText(heading, {
            type: "lines",
            linesClass: "footer-heading-line",
          });
          split.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "footer-heading-line-mask";
            line.parentNode.insertBefore(mask, line);
            mask.appendChild(line);
          });
          lines = split.lines;
        } else {
          const raw = heading.innerHTML.trim();
          heading.innerHTML = `<span class="footer-heading-line-mask"><span class="footer-heading-line">${raw}</span></span>`;
          lines = Array.from(heading.querySelectorAll(".footer-heading-line"));
        }

        gsap.set(lines, {
          y: "115%",
          opacity: 0,
        });

        allHeadingLines = allHeadingLines.concat(lines);
      });

      if (allHeadingLines.length) {
        gsap.to(allHeadingLines, {
          y: "0%",
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.6)",
          scrollTrigger: {
            trigger: footer,
            scroller: scrollerEl,
            start: "top 80%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });
      }

      // -------------------------------------------------------------
      // 4. Wolff Olins Signature Elastic Footer SVG Stretch & Settle
      // - Starts compressed (scaleY: 0.15) anchored to bottom
      // - Scrubs up to scaleY: 1.35 as footer scrolls into view with velocity reactivity
      // - When reaching page bottom, releases into a juicy elastic spring bounce (scaleY: 1)
      // -------------------------------------------------------------
      const footerLogo = footer.querySelector(".footer-btm") || footerBtm;

      if (footerLogo) {
        gsap.set(footerLogo, {
          scaleY: 0.15,
          transformOrigin: "bottom center",
          display: "block",
          willChange: "transform",
        });

        let hasBounced = false;

        ScrollTrigger.create({
          trigger: footer,
          scroller: scrollerEl,
          start: "top bottom", // Starts when footer top enters bottom of viewport
          end: "bottom bottom", // Ends when page is scrolled all the way to bottom
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const vel = Math.abs(self.getVelocity() || 0);
            const velStretch = Math.min(vel / 1500, 0.25); // Velocity-reactive stretch boost

            if (self.progress >= 0.9) {
              // Reached bottom region: release into juicy elastic spring bounce (scaleY: 1)
              if (!hasBounced) {
                hasBounced = true;
                gsap.killTweensOf(footerLogo);
                gsap.to(footerLogo, {
                  scaleY: 1,
                  duration: 1.4,
                  ease: "elastic.out(1.2, 0.35)", // Juicy Wolff Olins spring settle
                  overwrite: "auto",
                });
              }
            } else {
              // Scrolling above bottom threshold: reset bounce state so it can re-trigger
              hasBounced = false;

              // Retract when scrolling UP and stretch when scrolling DOWN
              const baseTarget =
                self.direction === 1
                  ? 0.15 + self.progress * 1.15 + velStretch
                  : 0.15 + self.progress * 0.95;

              const targetScaleY = Math.max(0.15, Math.min(baseTarget, 1.4));

              gsap.to(footerLogo, {
                scaleY: targetScaleY,
                duration: 0.1,
                ease: "power1.out",
                overwrite: "auto",
              });
            }
          },
          onLeave: () => {
            // Reached absolute end of scroll
            if (!hasBounced) {
              hasBounced = true;
              gsap.killTweensOf(footerLogo);
              gsap.to(footerLogo, {
                scaleY: 1,
                duration: 1.4,
                ease: "elastic.out(1.2, 0.35)",
                overwrite: "auto",
              });
            }
          },
          onLeaveBack: () => {
            // Reset when scrolling completely above the footer
            hasBounced = false;
            gsap.killTweensOf(footerLogo);
            gsap.to(footerLogo, {
              scaleY: 0.15,
              duration: 0.25,
              ease: "power2.out",
              overwrite: "auto",
            });
          },
        });
      }

      // -------------------------------------------------------------
      // 5. Kinetic Character Hover Animation on Footer Links & Email (Excludes .footer-link-header)
      // -------------------------------------------------------------
      const footerLinks = Array.from(
        footer.querySelectorAll(
          ".footer-link, a.footer-link, [class*='footer-link'], a[href^='mailto:'], .social-link a, .social-link",
        ),
      ).filter(
        (link) =>
          !link.classList.contains("footer-link-header") &&
          !link.closest(".footer-link-header"),
      );

      footerLinks.forEach((link) => {
        // Prevent double splitting
        if (link.querySelector(".footer-link-char")) return;

        // Split text nodes while preserving any nested elements (e.g. .footer-arrow-svg)
        Array.from(link.childNodes).forEach((node) => {
          if (
            node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim().length > 0
          ) {
            const span = document.createElement("span");
            span.className = "footer-link-text-wrap";
            span.style.display = "inline-block";

            const raw = node.textContent;
            span.innerHTML = raw
              .split("")
              .map((c) => {
                if (c === " ") return "&nbsp;";
                return `<span class="footer-link-char">${c}</span>`;
              })
              .join("");

            node.parentNode.replaceChild(span, node);
          }
        });

        const chars = Array.from(link.querySelectorAll(".footer-link-char"));
        if (!chars.length) return;

        // Initial character state
        gsap.set(chars, {
          display: "inline-block",
          transformOrigin: "center center",
          scale: 1,
          rotation: 0,
          textShadow: "0px 0px 0px rgba(0,0,0,0)",
        });

        // Hover In: Staggered kinetic pop with random tilt, scale & bold shadow (slower, silky pace)
        link.addEventListener("mouseenter", () => {
          chars.forEach((char, idx) => {
            const randomTilt = gsap.utils.random(-7, 7);
            const charDelay = idx * 0.035;

            // Phase 1: Letter pop + random tilt + bold outline shadow
            gsap.to(char, {
              scale: 1.14,
              rotation: randomTilt,
              textShadow:
                "0.4px 0.4px 0 currentColor, -0.4px -0.4px 0 currentColor, 0.4px -0.4px 0 currentColor, -0.4px 0.4px 0 currentColor",
              duration: 0.38,
              delay: charDelay,
              ease: "back.out(1.8)",
              overwrite: "auto",
              onComplete: () => {
                // Phase 2: Gentle settle back to clean resting state
                gsap.to(char, {
                  scale: 1,
                  rotation: 0,
                  textShadow: "0px 0px 0px rgba(0,0,0,0)",
                  duration: 0.5,
                  ease: "power2.out",
                  overwrite: "auto",
                });
              },
            });
          });
        });

        // Hover Out: Smooth clean return
        link.addEventListener("mouseleave", () => {
          gsap.to(chars, {
            scale: 1,
            rotation: 0,
            textShadow: "0px 0px 0px rgba(0,0,0,0)",
            duration: 0.35,
            stagger: 0.018,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initTwo26FooterAnimation);
    } else {
      initTwo26FooterAnimation();
    }
  })();
