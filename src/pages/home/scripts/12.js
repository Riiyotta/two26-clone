
  (function () {
    function initAboutPinned() {
      if (typeof gsap === 'undefined') return;

      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }
      if (typeof SplitText !== 'undefined') {
        gsap.registerPlugin(SplitText);
      }

      const sections = document.querySelectorAll('.section-about');
      if (!sections.length) return;

      const scrollerEl = document.querySelector('.page') || window;

      // Responsive scroll distance calculation
      const getPinDistance = () => {
        const width = window.innerWidth;
        if (width < 480) return 1150; // Mobile (< 480px): 1100-1200px
        if (width < 992) return 1550; // Tablet (< 992px): 1500-1600px
        return 2200; // Desktop: 2200px
      };

      sections.forEach((section) => {
        const aboutPara = section.querySelector('.about-para');
        const pills = section.querySelectorAll('.about-pill');

        if (!aboutPara) return;

        // 1. Hardware acceleration & anti-blur on pinned container
        gsap.set(section, {
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          force3D: true,
        });

        // 2. Split Text into individual characters
        let chars = [];
        if (typeof SplitText !== 'undefined') {
          const split = new SplitText(aboutPara, {
            type: 'chars, words',
            charsClass: 'about-char',
          });
          chars = split.chars;
        } else {
          const text = aboutPara.textContent;
          aboutPara.innerHTML = text
            .split('')
            .map((c) => `<span class="about-char" style="display:inline-block;">${c === ' ' ? '&nbsp;' : c}</span>`)
            .join('');
          chars = aboutPara.querySelectorAll('.about-char');
        }

        if (!chars.length) return;

        // 3. Set Initial State
        gsap.set(chars, {
          color: 'rgba(255, 84, 0, 0.45)',
          scale: 1,
          rotation: 0,
          display: 'inline-block',
          transformOrigin: 'center center',
          textShadow: '0px 0px 0px rgba(255,84,0,0)',
          willChange: 'transform, color',
          backfaceVisibility: 'hidden',
        });

        // Pills: Hidden & scaled down
        if (pills.length) {
          gsap.set(pills, {
            opacity: 0,
            scale: 0.6,
            y: 24,
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
          });
        }

        // 4. Create Responsive Scrubbed Pinned Timeline
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            scroller: scrollerEl,
            start: 'top top',
            end: () => `+=${getPinDistance()}`, // Dynamically scales per device screen
            pin: section,
            pinSpacing: true,
            scrub: window.innerWidth < 992 ? 0.6 : 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
            preventOverlaps: true,
          },
        });

        const totalChars = chars.length;
        const letterAnimSpan = 85;

        chars.forEach((char, i) => {
          const startTime = (i / totalChars) * letterAnimSpan;

          // Stage 1: Scale 1.12, Random ±3-4 deg tilt, Thick glowing #FF5400
          tl.to(
            char,
            {
              color: '#FF5400',
              scale: 1.12,
              rotation: () => gsap.utils.random(-4, 4),
              textShadow: '0.6px 0.6px 0 #FF5400, -0.6px -0.6px 0 #FF5400, 0.6px -0.6px 0 #FF5400, -0.6px 0.6px 0 #FF5400',
              duration: 3.5,
              ease: 'power1.out',
            },
            startTime,
          );

          // Stage 2: Settle to normal scale 1, 0 deg, clean black #000000
          tl.to(
            char,
            {
              color: '#000000',
              scale: 1,
              rotation: 0,
              textShadow: '0px 0px 0px rgba(0,0,0,0)',
              duration: 3.5,
              ease: 'power1.inOut',
            },
            startTime + 3.5,
          );
        });

        // 5. Pop-in Pills at milestones
        if (pills[0]) {
          tl.to(
            pills[0],
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 6,
              ease: 'back.out(2)',
            },
            35, // 35% scroll progress
          );
        }

        if (pills[1]) {
          tl.to(
            pills[1],
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 6,
              ease: 'back.out(2)',
            },
            72, // 72% scroll progress
          );
        }

        if (pills[2]) {
          tl.to(
            pills[2],
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 6,
              ease: 'back.out(2)',
            },
            96, // 96-100% scroll progress
          );
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAboutPinned);
    } else {
      initAboutPinned();
    }
  })();
