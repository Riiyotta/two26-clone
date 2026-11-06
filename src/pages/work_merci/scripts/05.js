
  (function () {
    function initTwo26ContactModal() {
      // 1. Defensive verification for GSAP & DrawSVG / SplitText
      if (typeof gsap === "undefined") return;

      if (typeof DrawSVGPlugin !== "undefined") {
        gsap.registerPlugin(DrawSVGPlugin);
      }
      if (typeof SplitText !== "undefined") {
        gsap.registerPlugin(SplitText);
      }

      const contactPage = document.querySelector(
        ".contact-page, [data-contact-page]",
      );
      if (!contactPage) return;

      const closeBtn = document.querySelector(
        ".close-btn, .close-btn-wrapper a, [data-contact-close]",
      );
      const openTriggers = Array.from(
        document.querySelectorAll(
          "[data-contact-trigger], .cta-btn, .nav-btn, a[href='#contact'], a[href*='contact']",
        ),
      ).filter(
        (btn) =>
          !btn.closest(".contact-page") &&
          !btn.classList.contains("close-btn") &&
          !btn.hasAttribute("data-contact-close"),
      );

      // Elements inside contact-page
      const contactNavbar = contactPage.querySelector(".contact-navbar");
      const contactContent = contactPage.querySelector(".contact-content");
      const contactHeadings = Array.from(
        contactPage.querySelectorAll(".contact-heading, .contact-left h2"),
      );
      const contactParas = Array.from(
        contactPage.querySelectorAll(".contact-para, .contact-left p"),
      );
      const emailHeadings = Array.from(
        contactPage.querySelectorAll(
          ".email-heading, .contact-right .email-heading",
        ),
      );
      const emailLinks = Array.from(
        contactPage.querySelectorAll(".email-link, a[href^='mailto:']"),
      );
      const contactSocials = Array.from(
        contactPage.querySelectorAll(".contact-social"),
      );
      const contactImg = contactPage.querySelector(
        ".contact-img, .contact-img-wrap img, .contact-img-wrap",
      );
      const transitionPaths = Array.from(
        contactPage.querySelectorAll(
          ".contact-transition svg path, .svg-tcontact svg path, .contact-transition path, .svg-tcontact path",
        ),
      );

      let isOpen = false;
      let openTl = null;

      // -----------------------------------------------------------------
      // 2. Prepare SplitText Masks & Initial States
      // -----------------------------------------------------------------

      // A. Contact Left Headings (Reduced-playfulness kinetic pop)
      let headingChars = [];
      contactHeadings.forEach((heading) => {
        if (typeof SplitText !== "undefined") {
          const split = new SplitText(heading, {
            type: "chars,words",
            charsClass: "contact-heading-char",
          });
          headingChars = headingChars.concat(split.chars);
        } else {
          const words = heading.textContent.trim().split(" ");
          heading.innerHTML = words
            .map(
              (w) =>
                `<span style="display:inline-block;">` +
                w
                  .split("")
                  .map((c) => `<span class="contact-heading-char">${c}</span>`)
                  .join("") +
                `</span>`,
            )
            .join(" ");
          headingChars = headingChars.concat(
            Array.from(heading.querySelectorAll(".contact-heading-char")),
          );
        }
      });

      // B. Contact Left Paragraph Lines
      let paraLines = [];
      contactParas.forEach((para) => {
        if (typeof SplitText !== "undefined") {
          const split = new SplitText(para, {
            type: "lines",
            linesClass: "contact-para-line",
          });
          split.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "contact-para-line-mask";
            line.parentNode.insertBefore(mask, line);
            mask.appendChild(line);
          });
          paraLines = paraLines.concat(split.lines);
        } else {
          const raw = para.innerHTML.trim();
          para.innerHTML = `<span class="contact-para-line-mask"><span class="contact-para-line">${raw}</span></span>`;
          paraLines = paraLines.concat(
            Array.from(para.querySelectorAll(".contact-para-line")),
          );
        }
      });

      // C. Contact Right Email Headings (Single-line word slide up with overflow hidden)
      let emailHeadingWords = [];
      emailHeadings.forEach((eh) => {
        if (typeof SplitText !== "undefined") {
          const split = new SplitText(eh, {
            type: "words",
            wordsClass: "contact-word",
          });
          split.words.forEach((word) => {
            const mask = document.createElement("span");
            mask.className = "contact-word-mask";
            mask.style.display = "inline-block";
            word.parentNode.insertBefore(mask, word);
            mask.appendChild(word);
          });
          emailHeadingWords = emailHeadingWords.concat(split.words);
        } else {
          const raw = eh.textContent.trim().split(" ");
          eh.innerHTML = raw
            .map(
              (w) =>
                `<span class="contact-word-mask" style="display:inline-block; margin-right:0.25em;"><span class="contact-word">${w}</span></span>`,
            )
            .join("");
          emailHeadingWords = emailHeadingWords.concat(
            Array.from(eh.querySelectorAll(".contact-word")),
          );
        }
      });

      // D. Contact Right Email Links (Letter-by-Letter Split + Kinetic Hover, NO overflow hidden)
      emailLinks.forEach((el) => {
        // Split text nodes into characters for kinetic hover
        Array.from(el.childNodes).forEach((node) => {
          if (
            node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim().length > 0
          ) {
            const span = document.createElement("span");
            span.className = "contact-email-text-wrap";
            span.style.display = "inline-block";

            const raw = node.textContent;
            span.innerHTML = raw
              .split("")
              .map((c) => {
                if (c === " ") return "&nbsp;";
                return `<span class="contact-email-char">${c}</span>`;
              })
              .join("");

            node.parentNode.replaceChild(span, node);
          }
        });

        const chars = Array.from(el.querySelectorAll(".contact-email-char"));
        if (!chars.length) return;

        // Hover In: Kinetic letter pop with random tilt, scale & bold shadow
        el.addEventListener("mouseenter", () => {
          chars.forEach((char, idx) => {
            const randomTilt = gsap.utils.random(-7, 7);
            const charDelay = idx * 0.035;

            // Phase 1: Letter pop
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
                // Phase 2: Gentle settle
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

        // Hover Out: Smooth return
        el.addEventListener("mouseleave", () => {
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

      // Navbar Logo & Close Button
      const contactLogo = contactNavbar
        ? contactNavbar.querySelector(
            ".navbar-logo-contact, .logo-svg, a[class*='logo'], .navbar-logo-cont",
          )
        : null;

      const closeBtnText = closeBtn
        ? closeBtn.querySelector(
            ".back-btn-txt, [class*='txt'], [class*='text'], span",
          )
        : null;

      // -----------------------------------------------------------------
      // 3. Reset All Elements to Fresh Initial State
      // -----------------------------------------------------------------
      function resetModalElements() {
        if (openTl) openTl.kill();

        // Ensure parent wrappers are fully visible and clean
        if (contactContent) {
          gsap.set(contactContent, { opacity: 1, y: 0 });
        }
        if (contactNavbar) {
          gsap.set(contactNavbar, { opacity: 1, y: 0 });
        }
        if (contactLogo) {
          gsap.set(contactLogo, {
            scale: 0,
            opacity: 0,
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: 0,
            transformOrigin: "center center",
          });
        }
        if (closeBtn) {
          gsap.set(closeBtn, {
            opacity: 0,
            scale: 0.4,
            y: 20,
            transformOrigin: "center center",
          });
          if (closeBtnText) {
            gsap.set(closeBtnText, {
              opacity: 0,
              y: 15,
              display: "inline-block",
            });
          }
        }

        if (transitionPaths.length) {
          transitionPaths.forEach((path) => {
            const totalLen = path.getTotalLength ? path.getTotalLength() : 3000;
            gsap.set(path, {
              strokeDasharray: totalLen,
              strokeDashoffset: totalLen,
              strokeWidth: "0px",
            });
          });
        }

        if (headingChars.length) {
          gsap.set(headingChars, {
            opacity: 0,
            scale: 0.5,
            rotation: 0,
            textShadow: "0px 0px 0px rgba(0,0,0,0)",
          });
        }

        if (paraLines.length) {
          gsap.set(paraLines, { y: "115%", opacity: 0 });
        }

        if (emailHeadingWords.length) {
          gsap.set(emailHeadingWords, { y: "105%", opacity: 0 });
        }

        if (emailLinks.length) {
          gsap.set(emailLinks, { opacity: 0, y: 15 });
        }

        const emailChars = contactPage.querySelectorAll(".contact-email-char");
        if (emailChars.length) {
          gsap.set(emailChars, {
            scale: 1,
            rotation: 0,
            textShadow: "0px 0px 0px rgba(0,0,0,0)",
          });
        }

        if (contactSocials.length) {
          gsap.set(contactSocials, {
            opacity: 0,
            scale: 0.4,
            y: 20,
            transformOrigin: "center center",
          });
          contactSocials.forEach((pill) => {
            const pillText = pill.querySelector(
              ".contact-social-link, [class*='link'], [class*='text'], span",
            );
            if (pillText) {
              gsap.set(pillText, {
                opacity: 0,
                y: 15,
                display: "inline-block",
              });
            }
          });
        }

        if (contactImg) {
          gsap.set(contactImg, {
            opacity: 0,
            scale: 0.8,
            x: 0,
            y: 0,
            yPercent: 0,
            xPercent: 0,
            rotation: gsap.utils.random(-3, 3),
            transformOrigin: "bottom center",
          });
        }
      }

      resetModalElements();

      // -----------------------------------------------------------------
      // 4. Open Timeline Execution (Slow, Silky Pace + 1600px strokeWidth)
      // -----------------------------------------------------------------
      function openContactModal() {
        if (isOpen) return;
        isOpen = true;

        // Display modal overlay
        contactPage.classList.add("is-active");
        contactPage.style.display = "flex";
        contactPage.style.visibility = "visible";
        contactPage.style.pointerEvents = "auto";

        resetModalElements();

        openTl = gsap.timeline();

        // Step 1: Transition SVG Draw & Stroke Expansion (0 to 1600px)
        if (transitionPaths.length) {
          transitionPaths.forEach((path, i) => {
            const totalLen = path.getTotalLength ? path.getTotalLength() : 3000;
            openTl.fromTo(
              path,
              { strokeDashoffset: totalLen, strokeWidth: "0px" },
              {
                strokeDashoffset: 0,
                strokeWidth: "1600px",
                duration: 0.9,
                ease: "power2.inOut",
              },
              i * 0.1,
            );
          });
        }

        const contentStart = transitionPaths.length ? 0.45 : 0;

        // Step 2: Navbar Logo (Bounce Scale 0 -> 1) & Close Button (Pill Pop + Text Slide)
        if (contactLogo) {
          openTl.to(
            contactLogo,
            {
              scale: 1,
              opacity: 1,
              x: 0,
              y: 0,
              duration: 0.65,
              ease: "back.out(2.2)",
            },
            contentStart,
          );
        }

        if (closeBtn) {
          openTl.to(
            closeBtn,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.7,
              ease: "back.out(2.5)",
            },
            contentStart + 0.1,
          );

          if (closeBtnText) {
            openTl.to(
              closeBtnText,
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "back.out(1.6)",
              },
              contentStart + 0.22,
            );
          }
        }

        // Step 3: Contact Left Heading (Kinetic Letter Pop)
        if (headingChars.length) {
          headingChars.forEach((char, idx) => {
            const randomTilt = gsap.utils.random(-6, 6);
            const charStart = contentStart + 0.15 + idx * 0.022;

            // Pop
            openTl.to(
              char,
              {
                opacity: 1,
                scale: 1.1,
                rotation: randomTilt,
                textShadow:
                  "0.4px 0.4px 0 currentColor, -0.4px -0.4px 0 currentColor, 0.4px -0.4px 0 currentColor, -0.4px 0.4px 0 currentColor",
                duration: 0.45,
                ease: "back.out(2)",
              },
              charStart,
            );

            // Settle
            openTl.to(
              char,
              {
                scale: 1,
                rotation: 0,
                textShadow: "0px 0px 0px rgba(0,0,0,0)",
                duration: 0.6,
                ease: "power2.out",
              },
              charStart + 0.45,
            );
          });
        }

        // Step 4: Contact Left Paragraph Lines
        if (paraLines.length) {
          openTl.to(
            paraLines,
            {
              y: "0%",
              opacity: 1,
              duration: 0.85,
              stagger: 0.1,
              ease: "back.out(1.4)",
            },
            contentStart + 0.3,
          );
        }

        // Step 5: Contact Right Email Headings (Word Slide Up with overflow hidden) & Email Links (Slide Up NO overflow hidden)
        if (emailHeadingWords.length) {
          openTl.to(
            emailHeadingWords,
            {
              y: "0%",
              opacity: 1,
              duration: 0.7,
              stagger: 0.06,
              ease: "back.out(1.5)",
            },
            contentStart + 0.25,
          );
        }

        if (emailLinks.length) {
          openTl.to(
            emailLinks,
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: "back.out(1.5)",
            },
            contentStart + 0.35,
          );
        }

        // Step 6: Contact Social Pills (Shell pop + inner text slide without overflow hidden)
        if (contactSocials.length) {
          contactSocials.forEach((pill, i) => {
            const pillStart = contentStart + 0.45 + i * 0.12;
            const pillText = pill.querySelector(
              ".contact-social-link, [class*='link'], [class*='text'], span",
            );

            openTl.to(
              pill,
              {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.7,
                ease: "back.out(2.5)",
              },
              pillStart,
            );

            if (pillText) {
              openTl.to(
                pillText,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.6,
                  ease: "back.out(1.6)",
                },
                pillStart + 0.15,
              );
            }
          });
        }

        // Step 7: Contact Image Pop (Locked to bottom: 0)
        if (contactImg) {
          openTl.to(
            contactImg,
            {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              rotation: 0,
              duration: 0.75,
              ease: "back.out(1.8)",
            },
            contentStart + 0.4,
          );
        }
      }

      // -----------------------------------------------------------------
      // 5. Close Timeline Execution
      // -----------------------------------------------------------------
      function closeContactModal() {
        if (!isOpen) return;

        if (openTl) openTl.kill();

        const closeTl = gsap.timeline({
          onComplete: () => {
            contactPage.classList.remove("is-active");
            contactPage.style.display = "none";
            contactPage.style.visibility = "hidden";
            contactPage.style.pointerEvents = "none";
            isOpen = false;
            resetModalElements();
          },
        });

        // Clean fade out of text, pills & navbar items
        closeTl.to(
          [closeBtn, contactContent, contactSocials].filter(Boolean),
          {
            opacity: 0,
            y: -15,
            duration: 0.3,
            ease: "power2.in",
          },
          0,
        );

        // Fade logo out in place without any y translation
        if (contactLogo) {
          closeTl.to(
            contactLogo,
            {
              opacity: 0,
              scale: 0.85,
              duration: 0.3,
              ease: "power2.in",
            },
            0,
          );
        }

        // Fade image without changing its y bottom-position
        if (contactImg) {
          closeTl.to(
            contactImg,
            {
              opacity: 0,
              scale: 0.85,
              duration: 0.3,
              ease: "power2.in",
            },
            0,
          );
        }

        // Reverse SVG transition wipe
        if (transitionPaths.length) {
          transitionPaths.forEach((path) => {
            const totalLen = path.getTotalLength ? path.getTotalLength() : 3000;
            closeTl.to(
              path,
              {
                strokeDashoffset: totalLen,
                strokeWidth: "0px",
                duration: 0.45,
                ease: "power2.in",
              },
              0.1,
            );
          });
        }
      }

      // -----------------------------------------------------------------
      // 6. Event Listeners (Direct Listeners + Document Delegation + ESC key)
      // -----------------------------------------------------------------
      openTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (e) => {
          e.preventDefault();
          openContactModal();
        });
      });

      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          closeContactModal();
        });
      }

      // Document-level click delegation (catches any .cta-btn clicked anywhere)
      document.addEventListener("click", (e) => {
        const ctaTarget = e.target.closest(".cta-btn, [data-contact-trigger]");
        if (ctaTarget && !ctaTarget.closest(".contact-page")) {
          e.preventDefault();
          openContactModal();
          return;
        }

        const closeTarget = e.target.closest(
          ".close-btn, [data-contact-close]",
        );
        if (closeTarget) {
          e.preventDefault();
          closeContactModal();
          return;
        }
      });

      // Escape key closes modal
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
          closeContactModal();
        }
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initTwo26ContactModal);
    } else {
      initTwo26ContactModal();
    }
  })();
