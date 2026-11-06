
  (function () {
    function initNavbarBtns() {
      if (typeof gsap === 'undefined') return;

      if (typeof DrawSVGPlugin !== 'undefined') {
        gsap.registerPlugin(DrawSVGPlugin);
      }

      const buttons = document.querySelectorAll('.navbar-link-btn');

      buttons.forEach((btn) => {
        const svgs = btn.querySelectorAll('svg');
        svgs.forEach((svg) => {
          svg.style.overflow = 'visible';
          svg.style.width = '100%';
          svg.style.height = '100%';
        });

        const paths = btn.querySelectorAll('.stroke-fill path, .stroke-fill-code path, svg path');
        if (!paths.length) return;

        const strokeFill = btn.querySelector('.stroke-fill');
        if (strokeFill) strokeFill.style.pointerEvents = 'none';

        paths.forEach((path) => {
          path.style.strokeLinecap = 'round';
          path.style.strokeLinejoin = 'round';

          const targetStrokeWidth = parseFloat(path.getAttribute('stroke-width')) || 36;

          gsap.set(path, {
            drawSVG: '0%',
            strokeWidth: 0,
          });

          const tl = gsap.timeline({
            paused: true,
            defaults: { ease: 'power1.inOut' },
          });

          tl.to(path, {
            drawSVG: '100%',
            strokeWidth: targetStrokeWidth,
            duration: 0.5,
          });

          btn.addEventListener('mouseenter', () => tl.timeScale(1).play());
          btn.addEventListener('mouseleave', () => tl.timeScale(1.4).reverse());
        });
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initNavbarBtns);
    } else {
      initNavbarBtns();
    }
  })();
