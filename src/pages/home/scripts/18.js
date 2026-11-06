
  (function () {
    function initTestimonialsStack() {
      if (typeof gsap === "undefined") return;

      const bodyBg = document.querySelector(".testimonials-body-bg");
      if (!bodyBg) return;

      // Query CMS collection items
      const cardElements = bodyBg.querySelectorAll(".testimonial-item").length
        ? Array.from(bodyBg.querySelectorAll(".testimonial-item"))
        : Array.from(bodyBg.querySelectorAll(".testimonial-card"));

      const totalCards = cardElements.length;
      if (totalCards === 0) return;

      // Clean up any inner card nested transforms so GSAP is the single source of truth
      cardElements.forEach((card) => {
        const innerCard = card.querySelector(
          ".testimonial-card, [class*='testimonial-card']",
        );
        if (innerCard && innerCard !== card) {
          innerCard.style.transform = "none";
          innerCard.style.position = "relative";
          innerCard.style.top = "auto";
          innerCard.style.left = "auto";
          innerCard.style.margin = "0 auto";
        }
      });

      const sidebar = bodyBg.querySelector(".side-bar");
      const navArrow = bodyBg.querySelector(".nav-arrow");

      let currentIndex = 0;
      let isAnimating = false;

      // -----------------------------------------------------------------
      // 1. Organic Aggressive Rotations for Natural Stacked Deck
      // -----------------------------------------------------------------
      const anglePalette = [-7.5, 6.8, -5.5, 8.2, -8.5, 6.2, -7.0, 7.8];
      const cardRotations = cardElements.map((_, i) => {
        return anglePalette[i % anglePalette.length];
      });

      // Initial card positions & z-index layer stack
      function applyCardStackPositions() {
        cardElements.forEach((card, i) => {
          const order = (i - currentIndex + totalCards) % totalCards;
          const zIndex = totalCards - order;

          card.style.zIndex = zIndex;
          card.style.willChange = "transform";
          card.style.backfaceVisibility = "hidden";

          // Natural center lock via CSS Grid + pure rotation
          gsap.set(card, {
            xPercent: 0,
            yPercent: 0,
            x: 0,
            y: 0,
            rotation: i === currentIndex ? 0 : cardRotations[i],
            opacity: 1,
            scale: 1,
            force3D: true,
            transformOrigin: "center center",
          });
        });
      }

      applyCardStackPositions();

      // -----------------------------------------------------------------
      // 2. Dynamic Sidebar Horizontal Ticks (.side-bar)
      // -----------------------------------------------------------------
      let sidebarTicks = [];
      if (sidebar) {
        sidebar.innerHTML = "";
        sidebar.style.display = "flex";
        sidebar.style.alignItems = "center";
        sidebar.style.justifyContent = "center";
        sidebar.style.gap = "1em";
        sidebar.style.pointerEvents = "none";

        for (let i = 0; i < totalCards; i++) {
          const tick = document.createElement("div");
          tick.className = "sidebar-tick";
          tick.style.height = "2px";
          tick.style.borderRadius = "2px";
          tick.style.backgroundColor = "#FFFFFF";
          tick.style.transformOrigin = "right center";
          sidebar.appendChild(tick);
          sidebarTicks.push(tick);
        }

        updateSidebar(currentIndex, false);
      }

      function updateSidebar(activeIdx, animate = true) {
        if (!sidebarTicks.length) return;

        sidebarTicks.forEach((tick, idx) => {
          const isActive = idx === activeIdx;
          const targetWidth = isActive ? 34 : 14;
          const targetOpacity = isActive ? 1 : 0.35;

          if (animate) {
            gsap.to(tick, {
              width: targetWidth,
              opacity: targetOpacity,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          } else {
            gsap.set(tick, {
              width: targetWidth,
              opacity: targetOpacity,
            });
          }
        });
      }

      const isTouch =
        matchMedia("(pointer: coarse)").matches || window.innerWidth < 992;

      // -----------------------------------------------------------------
      // 3. Floating Custom Navigation Arrow (.nav-arrow)
      // -----------------------------------------------------------------
      if (navArrow) {
        if (isTouch) {
          // Hide custom cursor nav-arrow on mobile/tablets
          navArrow.style.display = "none";
        } else {
          // Reset any Webflow layout offsets
          navArrow.style.position = "absolute";
          navArrow.style.top = "0px";
          navArrow.style.left = "0px";
          navArrow.style.right = "auto";
          navArrow.style.bottom = "auto";
          navArrow.style.margin = "0px";
          navArrow.style.pointerEvents = "none";
          navArrow.style.zIndex = "999";

          // Initial hidden state
          gsap.set(navArrow, {
            scale: 0,
            opacity: 0,
            rotation: 0,
            xPercent: -50,
            yPercent: -50,
            transformOrigin: "center center",
            force3D: true,
          });

          const setArrowX = gsap.quickTo(navArrow, "x", {
            duration: 0.15,
            ease: "power2.out",
          });
          const setArrowY = gsap.quickTo(navArrow, "y", {
            duration: 0.15,
            ease: "power2.out",
          });

          let currentArrowDir = 0; // 0 = UP, 180 = DOWN

          bodyBg.addEventListener("mouseenter", (e) => {
            const rect = bodyBg.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Snap immediately to cursor coordinates before scaling up
            gsap.set(navArrow, { x: mouseX, y: mouseY });

            const isTopHalf = mouseY < rect.height / 2;
            currentArrowDir = isTopHalf ? 0 : 180;
            gsap.set(navArrow, { rotation: currentArrowDir });

            gsap.to(navArrow, {
              scale: 1,
              opacity: 1,
              duration: 0.3,
              ease: "back.out(2)",
              overwrite: "auto",
            });
          });

          bodyBg.addEventListener("mousemove", (e) => {
            const rect = bodyBg.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            setArrowX(mouseX);
            setArrowY(mouseY);

            // Top half -> Point UP (0deg), Bottom half -> Point DOWN (180deg)
            const isTopHalf = mouseY < rect.height / 2;
            const targetRotation = isTopHalf ? 0 : 180;

            if (currentArrowDir !== targetRotation) {
              currentArrowDir = targetRotation;
              gsap.to(navArrow, {
                rotation: targetRotation,
                duration: 0.25,
                ease: "power2.out",
                overwrite: "auto",
              });
            }
          });

          bodyBg.addEventListener("mouseleave", () => {
            gsap.to(navArrow, {
              scale: 0,
              opacity: 0,
              duration: 0.2,
              ease: "power2.in",
              overwrite: "auto",
            });
          });
        }
      }

      // -----------------------------------------------------------------
      // 4. Physical Deck Shuffle: Next (Top -> Bottom) & Prev (Bottom -> Top)
      // -----------------------------------------------------------------
      function reorderZIndices() {
        cardElements.forEach((card, i) => {
          const order = (i - currentIndex + totalCards) % totalCards;
          card.style.zIndex = totalCards - order;

          // Background cards reliably maintain their aggressive tilt
          if (i !== currentIndex) {
            gsap.to(card, {
              rotation: cardRotations[i],
              xPercent: 0,
              yPercent: 0,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        });
      }

      function goToNextCard() {
        if (isAnimating || totalCards <= 1) return;
        isAnimating = true;

        const outgoingIndex = currentIndex;
        const outgoingCard = cardElements[outgoingIndex];
        const nextIndex = (currentIndex + 1) % totalCards;
        const incomingCard = cardElements[nextIndex];

        // 1. Straighten incoming card as it becomes the active front card
        gsap.to(incomingCard, {
          rotation: 0,
          xPercent: 0,
          yPercent: 0,
          duration: 0.35,
          ease: "power2.out",
        });

        // 2. Outgoing card flies UP out of the deck with dynamic tilt
        const tiltOffset = outgoingIndex % 2 === 0 ? 9 : -9;
        gsap.to(outgoingCard, {
          yPercent: -140,
          rotation: cardRotations[outgoingIndex] + tiltOffset,
          duration: 0.38,
          ease: "power2.inOut",
          onComplete: () => {
            // Once at peak: adjust z-index to bottom of pile
            currentIndex = nextIndex;
            reorderZIndices();
            outgoingCard.style.zIndex = 1;

            // Slide DOWN back into the bottom of the deck
            gsap.to(outgoingCard, {
              yPercent: 0,
              rotation: cardRotations[outgoingIndex],
              duration: 0.38,
              ease: "power2.out",
              onComplete: () => {
                reorderZIndices();
                isAnimating = false;
              },
            });
          },
        });

        // 3. Update dynamic sidebar ticks
        updateSidebar(nextIndex, true);
      }

      function goToPrevCard() {
        if (isAnimating || totalCards <= 1) return;
        isAnimating = true;

        const prevIndex = (currentIndex - 1 + totalCards) % totalCards;
        const incomingCard = cardElements[prevIndex];
        const currentCard = cardElements[currentIndex];

        // Current active card settles back to its background rotation
        gsap.to(currentCard, {
          rotation: cardRotations[currentIndex],
          xPercent: 0,
          yPercent: 0,
          duration: 0.35,
          ease: "power2.out",
        });

        // 1. Bottom card flies DOWN from behind the deck
        const tiltOffset = prevIndex % 2 === 0 ? 8 : -8;
        gsap.to(incomingCard, {
          yPercent: 120,
          rotation: cardRotations[prevIndex] + tiltOffset,
          duration: 0.38,
          ease: "power2.inOut",
          onComplete: () => {
            // At bottom: promote to top z-index and set as active
            currentIndex = prevIndex;
            reorderZIndices();
            incomingCard.style.zIndex = totalCards + 10;

            // Slide UP onto the top of the deck
            gsap.to(incomingCard, {
              yPercent: 0,
              rotation: 0,
              duration: 0.38,
              ease: "power2.out",
              onComplete: () => {
                reorderZIndices();
                isAnimating = false;
              },
            });
          },
        });

        // 3. Update dynamic sidebar ticks
        updateSidebar(prevIndex, true);
      }

      // -----------------------------------------------------------------
      // 5. Touch Swiping & Gesture Interaction
      // -----------------------------------------------------------------
      let touchStartY = 0;
      let touchStartX = 0;
      let isSwipeAction = false;

      bodyBg.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches.length === 1) {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            isSwipeAction = false;
          }
        },
        { passive: true },
      );

      bodyBg.addEventListener(
        "touchend",
        (e) => {
          if (e.changedTouches.length === 1) {
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const deltaY = touchEndY - touchStartY;
            const deltaX = touchEndX - touchStartX;

            // Trigger swipe if vertical displacement is greater than horizontal and > 30px
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 30) {
              isSwipeAction = true;
              if (deltaY < 0) {
                // Swipe UP -> Next Card
                goToNextCard();
              } else {
                // Swipe DOWN -> Prev Card
                goToPrevCard();
              }
            }
          }
        },
        { passive: true },
      );

      // -----------------------------------------------------------------
      // 6. Click Handler on .testimonials-body-bg (Desktop & Tap)
      // -----------------------------------------------------------------
      bodyBg.addEventListener("click", (e) => {
        // Prevent trigger if clicking on link/button inside card, or if just swiped
        if (e.target.closest("a, button") || isSwipeAction) return;

        const rect = bodyBg.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const isTopHalf = clickY < rect.height / 2;

        if (isTopHalf) {
          goToNextCard();
        } else {
          goToPrevCard();
        }
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initTestimonialsStack);
    } else {
      initTestimonialsStack();
    }
  })();
