
  (function () {
    // Detect if we are on a Work CMS project page (/work/[slug])
    var path = window.location.pathname.toLowerCase().replace(/\/+$/, "");
    var isWorkCmsPage =
      path.startsWith("/work/") ||
      (path.indexOf("/work/") !== -1 && path !== "/work");

    if (isWorkCmsPage) {
      // 1. Remove the fixed/overflow-hidden styles from body and html
      var styleTag = document.getElementById("lenis-page-styles");
      if (styleTag) {
        styleTag.remove();
      }

      // 2. Set html, body, and .page to clean natural flow
      document.documentElement.style.cssText =
        "position: static !important; overflow-y: auto !important; overflow-x: hidden !important; height: auto !important; width: 100% !important; margin: 0 !important;";
      document.body.style.cssText =
        "position: static !important; overflow-y: auto !important; overflow-x: hidden !important; height: auto !important; width: 100% !important; margin: 0 !important;";

      function releaseWrapper() {
        var wrapper = document.querySelector(".page");
        if (wrapper) {
          wrapper.style.cssText =
            "position: relative !important; overflow: visible !important; height: auto !important; min-height: 100vh !important; width: 100% !important; box-sizing: border-box !important;";
        }
      }
      releaseWrapper();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", releaseWrapper);
      }

      // 3. Initialize Lenis on BODY / WINDOW (no .page wrapper constraint)
      function initWorkLenis() {
        if (typeof Lenis === "undefined") return;
        if (window.lenis) return;

        var isTouch = matchMedia("(pointer: coarse)").matches;

        var lenis = new Lenis({
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          infinite: false,
          duration: isTouch ? 1.0 : 1.5,
          wheelMultiplier: 0.85,
          touchMultiplier: 1.2,
          syncTouch: false, // Prevents pull-back & touch fighting
          easing: function (t) {
            return Math.min(1, 1.001 - Math.pow(2, -10 * t));
          },
        });

        window.lenis = lenis;

        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        window.addEventListener("load", function () {
          lenis.resize();
        });
        document.querySelectorAll("img").forEach(function (img) {
          if (!img.complete) {
            img.addEventListener("load", function () {
              lenis.resize();
            });
          }
        });
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initWorkLenis);
      } else {
        initWorkLenis();
      }

      return;
    }

    // =======================================================
    // OTHER PAGES (Home, About, Work listing, etc.)
    // Uses .page wrapper as before with full GSAP integration
    // =======================================================
    function initLenis() {
      if (typeof Lenis === "undefined") return;
      if (window.lenis) return;

      var wrapper = document.querySelector(".page");
      if (!wrapper) {
        console.warn(
          "[Lenis] .page wrapper not found — smooth scroll not initialized.",
        );
        return;
      }

      var content =
        wrapper.children && wrapper.children.length > 1
          ? wrapper
          : wrapper.firstElementChild || wrapper;

      var isTouch = matchMedia("(pointer: coarse)").matches;

      function updateViewportHeight() {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", vh + "px");
        if (wrapper) {
          wrapper.style.height = window.innerHeight + "px";
        }
        if (window.lenis) {
          window.lenis.resize();
        }
        if (typeof ScrollTrigger !== "undefined") {
          ScrollTrigger.refresh();
        }
      }

      updateViewportHeight();
      window.addEventListener("resize", updateViewportHeight);
      window.addEventListener("orientationchange", function () {
        setTimeout(updateViewportHeight, 200);
      });
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateViewportHeight);
      }

      var lenis = new Lenis({
        wrapper: wrapper,
        content: content,
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        infinite: false,
        duration: isTouch ? 1.1 : 1.7,
        wheelMultiplier: 0.9,
        touchMultiplier: isTouch ? 1.6 : 2.6,
        touchInertiaMultiplier: isTouch ? 18 : 50,
        syncTouch: true,
        syncTouchLerp: isTouch ? 0.09 : 0.35,
        touchInertiaExponent: 2,
        easing: function (t) {
          return Math.min(1, 1.001 - Math.pow(2, -10 * t));
        },
      });

      window.lenis = lenis;

      var imgs = wrapper.querySelectorAll("img");
      imgs.forEach(function (img) {
        if (!img.complete) {
          img.addEventListener("load", function () {
            if (window.lenis) window.lenis.resize();
          });
        }
      });

      if (typeof gsap !== "undefined") {
        if (typeof ScrollTrigger !== "undefined") {
          gsap.registerPlugin(ScrollTrigger);

          lenis.on("scroll", ScrollTrigger.update);

          ScrollTrigger.scrollerProxy(wrapper, {
            scrollTop: function (value) {
              if (arguments.length) {
                lenis.scrollTo(value, { immediate: true });
              }
              return lenis.scroll;
            },
            getBoundingClientRect: function () {
              return {
                top: 0,
                left: 0,
                width: wrapper.clientWidth || window.innerWidth,
                height: wrapper.clientHeight || window.innerHeight,
              };
            },
            pinType: "transform",
          });

          ScrollTrigger.defaults({ scroller: wrapper });
          ScrollTrigger.addEventListener("refresh", function () {
            lenis.resize();
          });

          ScrollTrigger.refresh();
          window.addEventListener("load", function () {
            updateViewportHeight();
            ScrollTrigger.refresh();
          });
        }

        gsap.ticker.add(function (time) {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      } else {
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initLenis);
    } else {
      initLenis();
    }
  })();
