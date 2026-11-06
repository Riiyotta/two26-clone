
  (function () {
    function initValuesStack() {
      // 1. Defensive verification
      if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      // 2. Scroller resolution (.page Lenis custom wrapper or window)
      const scrollerEl = document.querySelector(".page") || window;

      // 3. Query section and card elements
      const section = document.querySelector(
        ".section-values, [data-section='values']",
      );
      if (!section) return;

      const wrapper =
        section.querySelector(".section-values-wrapper") || section;
      const cards = Array.from(section.querySelectorAll(".value-card"));
      const totalCards = cards.length;
      if (totalCards === 0) return;

      // Dynamic em Calculation via Physical DOM Measurement Probe
      const getEm = (emCount) => {
        const probe = document.createElement("div");
        probe.style.cssText = `height:${emCount}em;width:0;position:absolute;visibility:hidden;pointer-events:none;`;
        wrapper.appendChild(probe);
        const px = probe.offsetHeight;
        wrapper.removeChild(probe);
        return px > 5 ? px : emCount * 16;
      };

      // Base top for Card 1 is always 5em (both desktop & mobile)
      const getBaseTop = () => getEm(5);

      // Card stacking offset: Desktop/Tablet = 5em | Mobile (< 768px) = 3em
      const getStepOffset = () => {
        const isMobile = window.innerWidth < 768;
        return isMobile ? getEm(3) : getEm(5);
      };

      // 4. Apply Responsive CSS sticky positioning to each card
      // Desktop: Card 1: 5em, Card 2: 10em, Card 3: 15em, Card 4: 20em
      // Mobile:  Card 1: 5em, Card 2: 8em,  Card 3: 11em, Card 4: 14em
      function applyStickyPositions() {
        const baseTop = getBaseTop();
        const stepOffset = getStepOffset();

        cards.forEach((card, index) => {
          const stickyTop = baseTop + index * stepOffset;
          card.style.position = "sticky";
          card.style.top = stickyTop + "px";
          card.style.zIndex = 10 + index * 10;
        });
      }

      applyStickyPositions();

      // 5. Add spacer after last card so Card 4 stays sticky until the section exits
      function addSpacer() {
        const old = wrapper.querySelector(".values-sticky-spacer");
        if (old) old.remove();

        const baseTop = getBaseTop();
        const stepOffset = getStepOffset();
        const lastPinTop = baseTop + (totalCards - 1) * stepOffset;
        const lastCardHeight = cards[totalCards - 1].offsetHeight;
        const spacerHeight = Math.max(
          0,
          window.innerHeight - lastPinTop - lastCardHeight,
        );

        const spacer = document.createElement("div");
        spacer.className = "values-sticky-spacer";
        spacer.style.cssText = `height:${spacerHeight}px;width:100%;pointer-events:none;flex-shrink:0;`;
        wrapper.appendChild(spacer);
      }

      addSpacer();

      // 6. Ensure overflow:visible on all ancestors up to .page for CSS sticky
      let ancestor = wrapper.parentElement;
      while (
        ancestor &&
        ancestor !== scrollerEl &&
        ancestor !== document.body
      ) {
        const style = window.getComputedStyle(ancestor);
        if (style.overflow === "hidden" || style.overflowY === "hidden") {
          ancestor.style.overflow = "visible";
        }
        ancestor = ancestor.parentElement;
      }

      // 7. Synchronized Progress Bars
      cards.forEach((card, index) => {
        const progress = card.querySelector(".value-progress");
        if (!progress) return;

        const getPinTop = () => {
          const baseTop = getBaseTop();
          const stepOffset = getStepOffset();
          return baseTop + index * stepOffset;
        };

        gsap.set(progress, {
          scaleX: 0,
          transformOrigin: "left center",
        });

        // Card 1: progress fills as card scrolls from center to its 5em pin
        // Cards 2-4: progress fills as card scrolls from bottom of viewport to pin
        ScrollTrigger.create({
          trigger: card,
          scroller: scrollerEl,
          start: index === 0 ? "top center" : "top bottom",
          end: () => `top ${getPinTop()}px`,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(progress, { scaleX: self.progress });
          },
        });
      });

      // -------------------------------------------------------------
      // 8. Kinetic Text Reveals (Heading: by letter | Para: by line)
      // -------------------------------------------------------------
      // Helper: Split heading into characters wrapped in overflow-hidden masks
      const setupCharMasks = (element) => {
        if (!element) return [];
        let chars = [];

        if (typeof SplitText !== "undefined") {
          const split = new SplitText(element, {
            type: "chars, words",
            charsClass: "value-heading-char",
          });
          split.chars.forEach((char) => {
            const mask = document.createElement("span");
            mask.className = "value-char-mask";
            char.parentNode.insertBefore(mask, char);
            mask.appendChild(char);
          });
          chars = split.chars;
        } else {
          // Native fallback
          const text = element.textContent.trim();
          element.innerHTML = text
            .split("")
            .map((c) =>
              c === " "
                ? " "
                : `<span class="value-char-mask"><span class="value-heading-char">${c}</span></span>`,
            )
            .join("");
          chars = Array.from(element.querySelectorAll(".value-heading-char"));
        }

        gsap.set(chars, { y: "115%", opacity: 0 });
        return chars;
      };

      // Helper: Split paragraph into lines wrapped in overflow-hidden masks
      const setupLineMasks = (element) => {
        if (!element) return [];
        let lines = [];

        if (typeof SplitText !== "undefined") {
          const split = new SplitText(element, {
            type: "lines",
            linesClass: "value-para-line",
          });
          split.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "value-line-mask";
            line.parentNode.insertBefore(mask, line);
            mask.appendChild(line);
          });
          lines = split.lines;
        } else {
          const raw = element.innerHTML.trim();
          element.innerHTML = `<span class="value-line-mask"><span class="value-para-line">${raw}</span></span>`;
          lines = Array.from(element.querySelectorAll(".value-para-line"));
        }

        gsap.set(lines, { y: "115%", opacity: 0 });
        return lines;
      };

      // Initialize Text Animations for Each Card
      function initCardTextAnimations() {
        cards.forEach((card, index) => {
          const heading = card.querySelector(".value-heading, h2");
          const para = card.querySelector(".value-para, p");

          const headingChars = setupCharMasks(heading);
          const paraLines = setupLineMasks(para);

          // Trigger 10-15% later into the viewport so card is well visible
          const cardTextTl = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              scroller: scrollerEl,
              start: index === 0 ? "top 72%" : "top 75%",
              toggleActions: "play none none none",
            },
          });

          // Heading characters reveal with bouncy easing coming from below
          if (headingChars.length) {
            cardTextTl.to(
              headingChars,
              {
                y: "0%",
                opacity: 1,
                duration: 0.7,
                stagger: 0.025,
                ease: "back.out(1.7)",
              },
              0,
            );
          }

          // Paragraph lines reveal with bouncy easing coming from below
          if (paraLines.length) {
            cardTextTl.to(
              paraLines,
              {
                y: "0%",
                opacity: 1,
                duration: 0.65,
                stagger: 0.08,
                ease: "back.out(1.4)",
              },
              0.12,
            );
          }
        });
      }

      // Execute after web fonts are completely rendered for pixel-accurate line wrapping
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(initCardTextAnimations);
      } else {
        initCardTextAnimations();
      }

      // 9. Dynamic Refresh on Window Resize & Font Load
      function handleRefresh() {
        applyStickyPositions();
        addSpacer();
        ScrollTrigger.refresh();
      }

      window.addEventListener("resize", handleRefresh);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(handleRefresh);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initValuesStack);
    } else {
      initValuesStack();
    }
  })();
