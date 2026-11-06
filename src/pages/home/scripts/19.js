
  (function () {
    function initFaqAccordion() {
      if (typeof gsap === "undefined") return;

      const items = Array.from(
        document.querySelectorAll(".faq-item, .faq-block"),
      );
      if (!items.length) return;

      // Filter to unique parent container if both .faq-item and .faq-block exist
      const faqItems = items.filter((item) => {
        return (
          item.classList.contains("faq-item") || !item.closest(".faq-item")
        );
      });

      let activeItem = null;

      const getOpenWidth = () => (window.innerWidth >= 992 ? "50%" : "75%");

      // 1. Initial State Setup
      faqItems.forEach((item, index) => {
        const qBlock = item.querySelector(".question-block");
        const aBlock = item.querySelector(".faq-block-btm, .faq-answer-block");
        const logo = item.querySelector(".faq-logo");
        const answerText = item.querySelector(".faq-answer");

        if (qBlock) {
          qBlock.style.cursor = "pointer";
          qBlock.style.willChange = "width, border-width";
        }
        if (aBlock) {
          aBlock.style.transformOrigin = "right bottom";
          aBlock.style.willChange = "transform, height, opacity";
        }
        if (logo) {
          logo.style.transformOrigin = "center center";
          logo.style.willChange = "transform";
        }
        if (answerText) {
          answerText.style.willChange = "transform, opacity";
        }

        if (index === 0) {
          // First FAQ item opens by default (50% desktop, 75% on < 992px)
          activeItem = item;
          item.classList.add("is-open");
          if (qBlock) {
            gsap.set(qBlock, {
              borderWidth: "1px",
              width: getOpenWidth(),
            });
          }
          if (aBlock) {
            gsap.set(aBlock, {
              height: "auto",
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              overflow: "visible",
              scale: 1,
              opacity: 1,
              transformOrigin: "right bottom",
            });
          }
          if (logo) gsap.set(logo, { scale: 1 });
          if (answerText) gsap.set(answerText, { opacity: 1, y: 0 });
        } else {
          // All other items closed (100% width on all displays, height 0, scale 0)
          item.classList.remove("is-open");
          if (qBlock) {
            gsap.set(qBlock, { borderWidth: "0px", width: "100%" });
          }
          if (aBlock) {
            gsap.set(aBlock, {
              height: 0,
              display: "none",
              overflow: "hidden",
              scale: 0,
              opacity: 0,
              transformOrigin: "right bottom",
            });
          }
          if (logo) gsap.set(logo, { scale: 0 });
          if (answerText) gsap.set(answerText, { opacity: 0, y: 20 });
        }
      });

      // 2. Open Item Timeline
      function openItem(item) {
        const qBlock = item.querySelector(".question-block");
        const aBlock = item.querySelector(".faq-block-btm, .faq-answer-block");
        const logo = item.querySelector(".faq-logo");
        const answerText = item.querySelector(".faq-answer");

        item.classList.add("is-open");

        const openTl = gsap.timeline({
          defaults: { ease: "power2.out" },
        });

        // Step A: Question block width to 50% (desktop) / 75% (<992px), border 0px to 1px
        if (qBlock) {
          openTl.to(
            qBlock,
            {
              width: getOpenWidth(),
              borderWidth: "1px",
              duration: 0.45,
            },
            0,
          );
        }

        // Step B: Answer block expands height from 0 to auto and scales up 0 -> 1 with flex-end alignment
        if (aBlock) {
          gsap.set(aBlock, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            overflow: "hidden",
            opacity: 1,
          });
          openTl.fromTo(
            aBlock,
            { height: 0, scale: 0 },
            {
              height: "auto",
              scale: 1,
              duration: 0.5,
              ease: "back.out(1.6)",
              onComplete: () => {
                gsap.set(aBlock, { overflow: "visible" });
              },
            },
            0.05,
          );
        }

        // Step C: Logo scales up
        if (logo) {
          openTl.to(
            logo,
            {
              scale: 1,
              duration: 0.45,
              ease: "back.out(2)",
            },
            0.15,
          );
        }

        // Step D: Answer text animates in from bottom with opacity after block scales
        if (answerText) {
          openTl.to(
            answerText,
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: "power2.out",
            },
            0.35,
          );
        }
      }

      // 3. Close Item Timeline
      function closeItem(item) {
        const qBlock = item.querySelector(".question-block");
        const aBlock = item.querySelector(".faq-block-btm, .faq-answer-block");
        const logo = item.querySelector(".faq-logo");
        const answerText = item.querySelector(".faq-answer");

        item.classList.remove("is-open");

        const closeTl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
        });

        // Step A: Answer text disappears first
        if (answerText) {
          closeTl.to(
            answerText,
            {
              opacity: 0,
              y: 15,
              duration: 0.22,
              ease: "power2.in",
            },
            0,
          );
        }

        // Step B: Logo & Answer block scale down to 0 into bottom-right & collapse height
        if (logo) {
          closeTl.to(
            logo,
            {
              scale: 0,
              duration: 0.25,
              ease: "power2.in",
            },
            0.12,
          );
        }

        if (aBlock) {
          gsap.set(aBlock, { overflow: "hidden" });
          closeTl.to(
            aBlock,
            {
              scale: 0,
              height: 0,
              opacity: 0,
              duration: 0.4,
              ease: "power2.inOut",
              onComplete: () => {
                gsap.set(aBlock, { display: "none" });
              },
            },
            0.15,
          );
        }

        // Step C: Question block expands back to 100% width on all displays, border back to 0px
        if (qBlock) {
          closeTl.to(
            qBlock,
            {
              width: "100%",
              borderWidth: "0px",
              duration: 0.45,
              ease: "power2.out",
            },
            0.18,
          );
        }
      }

      // 4. Resize listener to update active open width across breakpoints
      window.addEventListener("resize", () => {
        if (activeItem) {
          const qBlock = activeItem.querySelector(".question-block");
          if (qBlock) {
            gsap.set(qBlock, { width: getOpenWidth() });
          }
        }
      });

      // 4. Bind Click Triggers (One FAQ always remains open)
      faqItems.forEach((item) => {
        const trigger = item.querySelector(".question-block") || item;

        trigger.addEventListener("click", () => {
          // If already open, do nothing (one FAQ must always remain open)
          if (item === activeItem) return;

          // Close currently active item
          if (activeItem) {
            closeItem(activeItem);
          }

          // Open clicked item
          openItem(item);
          activeItem = item;
        });
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initFaqAccordion);
    } else {
      initFaqAccordion();
    }
  })();
