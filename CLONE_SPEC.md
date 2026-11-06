Source: https://two26.studio/

# Two26 Studio: homepage (`/`) clone spec

Measured live with Playwright on 2026-11-06 at **1440x900** (desktop) and **375x812** (mobile, emulated with a fine pointer, so `matchMedia('(pointer: coarse)')` was `false`; see the Lenis notes).
Screenshots are in `/Users/riyaghosh/portfolio/two26/recon/` (see section 9).
Stack on the live page: GSAP **3.15.0** (with SplitText, ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, CustomEase and CustomBounce, all loaded from `cdn.prod.website-files.com/gsap/3.15.0/`), Lenis **1.1.20** (jsdelivr), jQuery 3.5.1 and Webflow runtime chunks.

---

## 0. Critical architecture facts (verify these first)

| Item | Value |
|---|---|
| Scroll container | **`.page.lenis`**, not `window`. CSS sets `html, body { position: fixed; overflow: hidden; height: 100% }`, so `document.scrollingElement` never scrolls. |
| `.page` | `position: relative; overflow-y: auto`. JS sets `.page.style.height = innerHeight + 'px'` on load, resize, orientationchange and visualViewport resize, and sets `--vh` = `innerHeight * 0.01` px on `<html>`. |
| Lenis | `new Lenis({ wrapper: .page, content: .page, duration: coarse ? 1.1 : 1.7, wheelMultiplier: 0.9, touchMultiplier: coarse ? 1.6 : 2.6, touchInertiaMultiplier: coarse ? 18 : 50, syncTouch: true, syncTouchLerp: coarse ? 0.09 : 0.35, touchInertiaExponent: 2, smoothWheel: true, easing: t => Math.min(1, 1.001 - 2**(-10t)) })`. The runtime read was `duration 1.7, lerp 0.1 (default, overridden by duration), wheelMultiplier 0.9, limit 12203` at desktop. |
| Lenis to GSAP wiring | `lenis.on('scroll', ScrollTrigger.update)`, `ScrollTrigger.scrollerProxy(.page, {scrollTop, getBoundingClientRect: 0,0,clientW,clientH, pinType: 'transform'})`, `ScrollTrigger.defaults({ scroller: .page })`, `gsap.ticker.add(t => lenis.raf(t*1000))`, `gsap.ticker.lagSmoothing(0)`, and `window.load` calls `updateViewportHeight()` and then `ScrollTrigger.refresh()`. |
| Pin type | `transform`. The about section is pinned via a `.pin-spacer`. |
| Loader gate | `window.onTwo26Ready(cb)` / the `two26:loaderComplete` CustomEvent / `window.__two26LoaderDone` / `body[data-two26-loader-done="true"]`. Hero entrance waits on this, with an 8000 ms fallback. |
| Loader skip | The loader is skipped (hidden immediately) if `sessionStorage.two26_navigated === 'true'` **and** the navigation type is not `reload`. That flag is set by clicks on same-origin internal links. It is also skipped under `prefers-reduced-motion: reduce`. |
| Fluid type scale | `body { font-size: var(--size-font) }` with `--size-font = clamp(min, 100vw, max) / (ideal / 16)`. Breakpoints: **>=992**: ideal 1440, clamp 992 to 1920px. **768 to 991**: ideal 834, clamp 768 to 991. **480 to 767**: ideal 550, clamp 480 to 767. **<=479**: ideal 390, clamp 320 to 479. Result: 16px at 1440 and **15.3846px at 375**. Almost every size is in em, so every measured value scales by `vw/ideal`. |
| Webflow breakpoints | 991 / 767 / 479 (max-width). |
| Custom cursor | **No global cursor.** `body` cursor is `auto` and there are no `[class*=cursor]` elements. There is one **local cursor-follower**: `.nav-arrow` inside `.testimonials-body-bg` follows the mouse (desktop and non-touch only). See 7.9. |
| CSS animations/transitions | **None** in computed styles: `transition: all 0s` everywhere and no `animation-name`. All motion is GSAP or Webflow-Lottie. |
| Console | The live site logs 17 errors `<svg> attribute height: Expected length, "auto"`. They are harmless and come from the original markup. |

---

## 1. Section order and geometry (document coords = offset inside `.page` scroll content)

Measured after the loader finished, with scrollTop 0 and ScrollTriggers refreshed.

### 1440x900 (`.page` scrollHeight **13103**, Lenis limit **12203**)

| # | Element | top | height | Notes |
|---|---|---|---|---|
| - | `header.header` | fixed | 74 | `position: fixed; z-index: 999`, transparent bg |
| 1 | `.section-hero` | 0 | **1343** | `.section-hero-wrapper` bg **#FAE3E2** `rgb(250,227,226)`, padding-top 96 |
| 2 | `.pin-spacer` > `.section-about` | 1343 | **3100** (900 + 2200 pin) | pinned from 1343 to 3543 |
| 3 | `.section-slider-showcase` | 4443 | **820** | padding 160px 0 |
| 4 | `.section-projects` | 5263 | **2066** | |
| 5 | `.section-services` | 7329 | **2377** | wrapper padding-top 160, gap 96 |
| 6 | `.section-testimonials` | 9706 | **1270** | wrapper padding-top 160, gap 40 |
| 7 | `.section-faq` | 10976 | **1227** | wrapper padding 160px 0, max-width 1440, gap 32 |
| 8 | `footer.footer` | 12203 | **900** (= 100vh) | bg **#FF5400** |

### 375x812 (`.page` scrollHeight **11910**)

| # | Element | top | height |
|---|---|---|---|
| 1 | `.section-hero` | 0 | **724** |
| 2 | pin-spacer > `.section-about` | 724 | **1962** (812 + 1150 pin) |
| 3 | `.section-slider-showcase` | 2686 | **400** (padding 76.92px 0) |
| 4 | `.section-projects` | 3086 | **4271** |
| 5 | `.section-services` | 7357 | **1625** |
| 6 | `.section-testimonials` | 8982 | **1006** |
| 7 | `.section-faq` | 9987 | **1111** |
| 8 | `footer.footer` | 11098 | **812** |

### Containers and spacing

| Selector | 1440 | 375 |
|---|---|---|
| `.navbar-wrap` | 1440x74, padding `20px 18px 18px`, flex space-between | 375x75, padding `19.23 17.31 17.31` |
| `.navbar-links` | 276x36, flex gap 8 | display:none (hamburger instead) |
| `.navbar-logo` (svg) | 127x28 at x657 y24 (centred) | 127x38 at x17 y19 (left) |
| `.cta-btn` (header) | 110x36 at x1312 y20 | hidden in header; shown in ham menu |
| `.ham-btn` / `.two26-nav-toggle-btn` | hidden | 38x38 at x319 y19 |
| `.section-hero-wrapper` | flex, padding-top 96 | padding-top 92.31 |
| `.hero-text` / `h1.heading` | 998x205 at x221 y96 | 342x166 at x17 y92 (max-w 984.6) |
| Hero video | 1440x640 at y333, `object-fit: cover` | 488x400 at x-56 y274 |
| `.hero-marquee` (SVG) | 1440x370 at y973 | 375x96 at y628 |
| `.hero-path-svg-left` | 200x523 at x0 y208 | |
| `.hero-path-svg-right` | 300x413 at x1140 y129 | |
| `.section-about-wrapper` | max-width 1440, flex | max-width 375, h 812 |
| `.section-slider-wrapper` | flex, full width | 375x246 |
| Showcase slide | 500x500 img (scale 0.95 to 1 by distance from centre) | 246x246, radius 7.69, track gap 2.31 |
| `.section-projects-wrapper` | flex column, gap 40 | |
| `.section-heading-wrapper` | 300 wide | |
| `.projects-vertical-wrapper` | padding `0 8px` | padding `0 7.69px` |
| `.projects-list` (grid) | **3 cols 453.33px, gap 32px**, width 1424 | **1 col 359.6px, gap 46.15px** |
| `.project-card-clip-mask` | 453x688 | 360x538 (cards at tops 3203/3788/4372/4957/5541/6126) |
| `.project-card-img-wrapper` | radius 16 | |
| `.projects-end` | 1440x448 | |
| `.projects-end-inner-wrapper` | 633x288, max-w 880, flex gap 48 | 167x538, max-w 246.15, gap 46.15 |
| `.testimonial-list-wrapper` | 1400 wide | |
| `.testimonial-card` | 832x456 (front card), padding 40, gap 60, radius 16, border 1px #FF5400, bg #FDF8F5 | 288x383, padding 16.92, gap 33.85 |
| `.faq-list-wrapper` | 812 wide at x608 (right column) | 360 wide at x8 |
| `.question-block` | bg #F2E3DA, border 1px #FF5400 (when open), radius `80px 80px 80px 0`, padding `20px 0 20px 32px`; width 50% open / 100% closed | width 75% open |
| `.answer-block` | bg #F8EEE8, border 1px rgba(0,0,0,.2), radius `32px 32px 0`, padding `24px 64px 24px 32px`, 552 wide | |
| `.faq-logo` | 58x58, bg #FF5400, radius 100 | |
| `.footer-wrapper` | padding 20, flex | padding-top 19.23, gap 30.77 |
| `.footer-texture` | 1440x900 svg bg image | |
| Pills (`.hero-pill`) | padding `8px 24px`, radius 100, bg #000. one: 177x57 @x369 y167 rot -7deg; two: 183x45 @x637 y124 rot +3deg; three: 178x51 @x923 y272 rot -5deg | padding `5.77 17.31`; one 115x45 @x39 y177; two 118x38 @x104 y129; three 115x41 @x204 y234 |
| `.about-pill` | padding `10.4px 24px`, radius 100, bg #FF5400, text #F9E2E1 16px | |
| `.navbar-link-btn` | 36h, padding `0 18 0 20`, radius 100, bg #FDF8F5 (Work 70w, About us 92w) | in menu: 57h, radius 100 |
| `.cta-btn` / `.project-btn` | padding `3px 3px 3px 20px`, radius 100, bg #000, inline-flex; contains orange circular arrow | |

---

## 2. Typography (computed)

Font families (from `:root`):
- `--font-primary: Mdnichrometest, Arial, sans-serif`, weight 700 (`MDNichromeTest-Bold.woff`)
- `--font-primary-dark: "Mdnichrometest Dark", Arial, sans-serif`, weight 400 (`MDNichromeTest-Dark.woff`)
- `--font-secondary: Neuemontreal, Arial, sans-serif`, weights 400 and 500 (`.otf`)
- Fallback body: `Arial, sans-serif` 16px/20px, color `#333333`

Loaded FontFaces: `Mdnichrometest 700`, `Mdnichrometest Dark 400`, `Neuemontreal 400`, `Neuemontreal 500`.

| Role | Selector | Family | 1440: size / lh / weight / ls | 375: size / lh | Color | Transform |
|---|---|---|---|---|---|---|
| Hero headline | `.section-hero h1.heading` | Mdnichrometest | **128px / 102.4px / 700** / normal | 69.23 / 55.38 | **#FF5400** | uppercase |
| Hero lines (SplitText) | 1440: "LOOKING " / "SUSPICIOUSLY GOOD" (2 lines). 375: "LOOKING " / "SUSPICIOUSLY " / "GOOD" (3 lines) | | | | | |
| Hero pill text | `.hero-pill-text` | Neuemontreal | 16 / 20 / 500 | 9.81 / 20 | **#F9E2E1** | |
| Nav link | `.navlink-text` | Neuemontreal | 14 / 20 / 500 | 13.46 (menu: 22.21) | #000 | |
| CTA text | `.cta-text` | Neuemontreal | 12 / 20 / 400 | 11.54 (menu: 14.28) | #FDF8F5 | |
| Section eyebrow | `.about-text`, `.section-about-text` | Neuemontreal | 18 / 18 / 500 | 11.54 / 11.54 | #000 | uppercase |
| About paragraph | `p.about-para` | Mdnichrometest Dark | **80 / 84 / 400 / -1px** | 38.46 / 40.38 | #000 (animated from rgba(255,84,0,.45)) | |
| Section heading (H2) | `h2.section-heading` | Mdnichrometest Dark | **100 / 85 / 400** | 46.15 / 39.23 | #000 | uppercase |
| Hero marquee text | SVG `text` | Mdnichrometest Dark | 80 / 800 / ls 3.2px (SVG units) | same | #F8EEE8 | |
| Project name | `.project-name-text` | Mdnichrometest Dark | 24 / 19.2 / 500 | 30.77 / 24.62 | #000 | uppercase |
| Project category | `.project-detail-text` | Neuemontreal | 14 / 14 / 500 | 13.08 / 13.08 | #FF5400 | uppercase |
| Projects-end paragraph | `p.projects-end-para` | Mdnichrometest Dark | **80 / 68 / 400 / -1px** | 53.85 / 45.77 | #FF5400 | uppercase |
| Service label | `.service-text` | Mdnichrometest Dark | 68 / 54.4 / 400 | 38.45 / 30.76 | #FF5400 | uppercase |
| Testimonial quote | `.testimonial-heading` | Mdnichrometest Dark | 54 / 45.9 / 400 | 29.62 / 25.17 | #FF5400 | |
| Testimonial body | `p.testimonial-card-para` | Neuemontreal | 24 / 28.8 / 400 | 12.69 / 15.23 | #FF5400 | |
| FAQ question | `.faq-ques` | Neuemontreal | 18 / 14.4 / 500 | 15.38 / 18.46 | #333 | |
| FAQ answer | `p.faq-answer` | Neuemontreal | 18 / 23.76 / 400 | 13.08 / 15.69 | #333 | |
| Footer heading | `h2.footer-heading` ("Okay, that's enough website") | Mdnichrometest Dark | 60 / 63 / 400 | 38.46 / 40.38 | #FDF8F5 | |
| Footer link | `a.footer-link` | Neuemontreal | 18 / 25.2 / 500 | 17.31 / 24.23 | #FDF8F5 | |
| Footer legal | `.footer-rights-text` | Neuemontreal | 12 / 20 / 500 | 11.54 | #FDF8F5 | |
| Contact heading | `h2.contact-heading` (modal) | Mdnichrometest | 128 / 102.4 / 700 | | #F8EEE8 | uppercase |
| Contact sub | `p.contact-para` ("or just say hello!") | Mdnichrometest | 54 / 54 / 700 | | #F8EEE8 (shown at lower opacity in the screenshot) | |
| Contact email label | `.email-heading` | Neuemontreal | 16 / 16 / 400 | | #FDF8F5 | uppercase |
| Close button text | `.back-btn-txt` | Neuemontreal | 14 / 14 / 500 | | #000 | |

Not measured programmatically: the header "Monday–Friday / 10:00 – 17:00" text block, which sits to the left of the CTA at 1440. It is visible in the screenshots.

---

## 3. Color tokens (exact computed values)

| Token | Value | Where |
|---|---|---|
| `--brand-primary` | **#FF5400** `rgb(255,84,0)` | headline, accents, footer bg, about pills, FAQ logo, testimonial text |
| `--brand-secondary` | **#F8EEE8** `rgb(248,238,232)` | **body background**, answer-block bg, marquee text |
| `--brand-white` | **#FDF8F5** `rgb(253,248,245)` | nav pills bg, testimonial card bg, footer text, CTA text |
| `--brand-accent` | **#F9E2E1** `rgb(249,226,225)` | pill text, loader pink stroke, ham-menu bg `rgba(249,226,225,0.95)` |
| `--brand-black` / `--brand-purple` | #000 | headings, pills bg, CTA bg |
| Hero wrapper bg | **#FAE3E2** `rgb(250,227,226)` | `.section-hero-wrapper` (hard-coded, not a token) |
| Question block bg | **#F2E3DA** `rgb(242,227,218)` | `.question-block` |
| Body text | #333333 | default |
| Loader | `.loader` fixed, z 99999, base bg `rgba(249,226,225,0)`; SVG paths stroke **#FF5400** and **#F9E2E1**, initial stroke-width 3000 | |
| Contact page | `.contact-page` fixed, z **9999999**, bg `rgba(255,84,0,0)`; the orange comes from 1600px-wide stroked SVG paths | |
| Project detail bg | `rgba(190,32,38,0)` (transparent) | |

---

## 4. Assets (network inventory, desktop full scroll)

All of these loaded with status 200 or 206. Lazy items only load after scrolling (`loading="lazy"` on all `<img>`).

**Fonts** (`cdn.prod.website-files.com/6aaad679fdb9d914f7f52049/`)
- `6aaad679fdb9d914f7f52051_MDNichromeTest-Bold.woff`
- `6aaad679fdb9d914f7f52052_MDNichromeTest-Dark.woff`
- `6aaad679fdb9d914f7f52053_NeueMontreal-Regular.otf`
- `6aaad679fdb9d914f7f52054_NeueMontreal-Medium.otf`

**Video** (autoplay, loop, muted)
- `.../6aaad679fdb9d914f7f52049/6aaad679fdb9d914f7f52055_Hero_mp4.mp4`: 1280x720, hero
- `.../6a7d9d7d7c99784ba2cac874%2F6a7db9b17a581584f4171aad_Hero_poster.0000000.jpg`: hero poster (note the **different site id** in the path)
- `.../6aaad679fdb9d914f7f52049%2F6ab26381b5a759b6db4cec12_Shot%201_mp4.mp4` + `_Shot%201_poster.0000000.jpg`: 720x720, showcase slide
- `.../6aaad679fdb9d914f7f52049%2F6ab263f29cc7204d5832b66d_Shot%203_mp4.mp4` + `_Shot%203_poster.0000000.jpg`: 720x720, showcase slide
- (The webm sources exist in the markup but Chromium picked the mp4.)

**Lottie JSON** (Webflow IX2 lottie, `data-renderer="svg"`, `data-loop=1`, `data-autoplay=1`, `data-loading="lazy"`; services section)
- `6aaad679fdb9d914f7f52071_Brand%20strategy.json` (duration 2s)
- `6aaad679fdb9d914f7f52076_Brand%20Identity.json` (3s)
- `6aaad679fdb9d914f7f52079_Web%20design.json` (2.4167s)
- `6aaad679fdb9d914f7f5207a_Illustration.json` (4s)
- `6aaad679fdb9d914f7f52078_Motion%20Design.json` (1.9167s)
- `6aaad679fdb9d914f7f52077_Packaging.json` (2.5833s)
- `6aaad679fdb9d914f7f5207b_Art%20Direction.json` (2.5417s)
- (Durations listed in DOM order. Lottie elements measure 0x0 at 375, so they are hidden on mobile.)

**Images** (`.../6aaad679fdb9d914f7f52049/`)
- Showcase: `6ab263498b14a38a7a109afc_Shot%202.jpg` (1200²), `6ab2633da8fa39ec5216880b_Shot%204.jpg` (1170²), `6ab2633d3e5b6a35a15d74d7_Shot%205.jpg` (1100²), `6ab2634dc8995221637e120c_Shot%206.png` (1439²), each rendered at 500x500
- `6aaad679fdb9d914f7f52067_footer-texture.svg` (1440x900 rendered)
- `6aacf0809a19493af8364ae5_fav1.jpg` (favicon/webclip)

**CMS images** (`.../6aaad679fdb9d914f7f5203c/`)
- Project logos: `6ab266d33e964df940c04833_HeyGluco.png`, `6ab2675e0b996d1415be46a3_The%20Bagel%20Bar.png`, `6ab266e293685f22fedc573a_Tanti%20Maria.png`, `6ab26718a85417b42d23712f_Munchies%20%26%20Cream.png`, `6ab26733f2ee3f3da2d70eeb_MVP.png`, `6ab266f1e1ea593718edc309_YumYum.png`
- Project thumbs (1300x1666): `..._Bagel_1.jpeg`, `..._Tanti_1.jpeg`, `..._Munchies_1.jpeg`, `..._MVP_Thumbnail1.jpeg`, `..._YumYum_1.jpeg`, `6ab393770c697e34bcc4e4fb_Vertical6.jpg` (HeyGluco main)
- Project hover images: `6ab392697fe7cc9c077d1bb5_HeyGluco_2_hover.jpg`, `..._Bagel_2_hover.jpeg`, `..._Tanti_2_hover.jpeg`, `..._Munchies_2_hover.jpeg`, `..._MVP_Thumbnail2_hover.jpeg`, `..._YumYum_2_hover.jpeg`
- Testimonial avatars (120 to 136px rendered): `6ab3d1f99d28cf11d2e8f501_luiza.jpg`, `6ab3d538dbdbc6a5f1d1d3f4_Rux.jpg`, `6ab3d5ec9cfd634776e95758_Vlad.jpg`, `6ab3d72a667c6ab560a03d5b_Ionut.jpg`, `6ab3d7f19cfd634776eaf212_Monica.jpg`

**Scripts and CSS**: `two-26-...webflow.shared.f22dd83b1.css`, `webflow.schunk.6b343d7253fa0d10.js`, `webflow.schunk.7321a5097fb66f41.js`, `webflow.0f9afed3.c9eff032aa002dcc.js`, jQuery 3.5.1 (cloudfront), `lenis@1.1.20/dist/lenis.min.js`, and the GSAP 3.15.0 files `gsap`, `ScrollTrigger`, `SplitText`, `DrawSVGPlugin`, `MotionPathPlugin`, `CustomEase`, `CustomBounce`.

**Diff against `public/assets`**: everything loaded is present locally **except** `6aacf0809a19493af8364ae5_fav1.jpg`. The local copy is `6aacf080692aed4a28203a8d_fav1.jpg`, which has a different asset id and may be the webclip rather than the favicon. `contact.svg`, `preview.png`, the `-p-500/800/1080` srcset variants and the `.webm` files are local but were not requested by Chromium during the session.

---

## 5. Loader (`.loader`, script #2)

- Runs at DOMContentLoaded. Sets `body.style.overflow = hidden`.
- **Background**: 2 SVG paths in `.svg-bg-stroke svg`. Path[0] is orange #FF5400 and path[1] is pink #F9E2E1. Both start with `drawSVG 0% 100%`, `strokeWidth 3000` and a round cap, so they cover the screen.
- **Logo timeline**: `gsap.timeline({delay: 0.25}).timeScale(1.25)`, with paths `[ribbon, 2, 6, W, T, O]`. Times below are timeline-local (divide by 1.25 for real time).
  - 0: ribbon strokeWidth 0 to 19, 1.0s, power2.in. Same start: drawSVG `0% 0%` to `0% 7%`, 0.7s, power2.in.
  - 0.7: ribbon drawSVG to `40% 47%`, 1.2s, ease none.
  - 1.5: W drawSVG 0% to 100%, 1.1s, power2.out (strokeWidth 19, butt cap).
  - 2.1: ribbon drawSVG to `100% 100%`, 1.1s, power2.inOut. At 2.65: ribbon strokeWidth to 0, 0.5s, power2.in.
  - 3.3: logo svg `y: -offsetPx` (vertical re-centre), 0.8s, power2.inOut.
  - 3.9: letters T, O, 2, 6 go from `scale 0, rotation random(-25,25)` to `scale 1, rot 0`, 0.6s, stagger 0.1, `back.out(3)`. At the same time their strokeWidth goes 6 to 0, 0.6s, stagger 0.1, power1.in.
  - **Timeline length 4.8 units, which is 3.84s real, plus the 0.25s delay = 4.09s.**
- **Exit** starts only when the logo timeline is complete **and** `window.load` has fired. A hard fallback fires at 6000 ms.
  - 0 to 0.2: wait.
  - 0.2: pink path drawSVG `50% 100%`, strokeWidth 1000, `x: 900, y: 1800`, 0.65s, power2.inOut.
  - 0.33: logo container opacity to 0, 0.15s.
  - 0.3625: orange path does the same with `x: -900`, 0.65s.
  - About 1.01s total. onComplete: restore overflow, `loader display: none`, `ScrollTrigger.refresh()`, dispatch `two26:loaderComplete`.
- **Measured** (cold navigation): DCL 627ms, load 1727ms, **loaderComplete at 5598ms** at 1440. At 375: DCL 724, load 1534, **loaderComplete 5641ms**. So **the page becomes interactive about 5.0s after DOMContentLoaded**.

## 6. Hero entrance (script #11)

Starts on `two26:loaderComplete`. Timeline: `paused, defaults power2.out, timeScale(0.75)`.
- Heading: SplitText `type: lines, linesClass: hero-line`. Each line is wrapped in `span.hero-line-mask` (block, overflow hidden). Initial state `y: 115%, opacity 0`.
- At 0: lines to `y 0%, opacity 1`, 0.85s, stagger 0.12, `back.out(1.4)`.
- `totalLinesTime = nLines*0.12 + 0.5`.
- Pills (3): initial `opacity 0, scale 0.4, y 20`. Pill i starts at `0.2 + (i/3)*totalLinesTime*0.7`, then animates to `opacity 1, scale 1, y 0`, 0.55s, `back.out(2.5)`. The inner text sits in `span.hero-pill-text-mask` and goes from `y 105%` to `0`, 0.5s, `back.out(1.6)`, starting at +0.15.
- Side SVG paths (2: `.hero-path-svg-left/right path`): drawSVG 0% to 100% plus strokeWidth 0 to original, 0.9s, power2.out. Path i starts at `totalLinesTime*0.4 + i*0.15`.
- **Computed real durations**: 1440 (2 lines) 1.346 units / 0.75 = **1.80s**. 375 (3 lines) about 1.394 / 0.75 = **1.86s**.
- Hero marquee (script #12): SVG `textPath` `startOffset` goes 0 to `-unitLength`, linear, repeat -1, `duration = unitLength/75`. `unitLength` measured **1756.0**, so the loop is **23.41s**. The bg and mask paths draw from `100% 100%` to `0% 100%` over 1.3s power2.out, delay 0.3 when vw<991, ScrollTrigger `top 85%`, once. Measured start 208px at 1440 and -63 at 375 (so it is already active on load).

## 7. Scroll-triggered motion

ScrollTrigger list (measured start/end in `.page` scroll px):

| Trigger | 1440 start / end | 375 start / end | Config |
|---|---|---|---|
| `.hero-marquee` | 208 / 1343 | -63 / 724 | top 85%, once |
| `.section-about` (pin) | **1343 / 3543** | **724 / 1874** | top top, `+=2200` (desktop), `+=1550` (<992), `+=1150` (<480); **scrub 0.8** (desktop) / **0.6** (<992); anticipatePin 1, fastScrollEnd, preventOverlaps |
| body (showcase velocity) | 0 / max | | onUpdate only |
| `.project-card-clip-mask` x6 | row1 4708, row2 5428 | 2513, 3097, 3682, 4267, 4851, 5436 | top 85%, `play none none reverse` |
| `.projects-end` | 6161 | 6015 | top 80%, play once |
| `.section-services-body` | **7125 / 9076** | 6974 / 8413 | top 70% to bottom 70%, **scrub 1.2** |
| `.footer` (heading) | 11483 | 10449 | top 80%, play once |
| `.footer` (logo stretch) | 11303 / 12203 | 10286 / 11098 | top bottom to bottom bottom, onUpdate |

### 7.1 About (pinned; script #13)
- SplitText `chars, words`, `charsClass: about-char`. Initial `color rgba(255,84,0,.45)`.
- Timeline length is 102 units. Char i starts at `(i/N)*85`:
  - First tween to `color #FF5400, scale 1.12, rotation random(-4,4), textShadow 0.6px orange outline (4 directions)`, 3.5 units, power1.out.
  - Second tween to `color #000, scale 1, rot 0, no shadow`, 3.5 units, power1.inOut.
- Pills (`.about-pill`, initial `opacity 0, scale 0.6, y 24`) go to `opacity 1, scale 1, y 0`, 6 units, `back.out(2)`. Pill 0 at 35, pill 1 at 72, pill 2 at 96.

### 7.2 Showcase marquee (script #14)
- `data-marquee-speed="3"` on `.section-slider-showcase`. Speed multiplier is `1 + (3-1)*0.3 = 1.6`, so **BASE_SPEED = 2.4 px per gsap tick**, which is frame-rate dependent.
- Slides are cloned until there are at least 3 sets (`ceil(vw*3.5 / setWidth)`).
- Direction follows scroll direction: -1 when scrolling down, +1 when scrolling up, lerped 0.06 per tick.
- Velocity boost: `min(|v|/220, 16) * dir`, decays 0.92 per tick.
- Each tick, every slide is set to `scale = 0.95 + 0.05*normDist`, where `normDist = min(1, |slideCenter - wrapperCenter| / (0.45*wrapperW))`. Slides are smaller near the centre.
- 6 source slides: 4 images and 2 videos.

### 7.3 Projects (script #15)
- Each card is wrapped in `.project-card-clip-mask`. Initial mask state: `clipPath inset(42.5%)`, `borderRadius 36px`. Initial card state: `scale 1.45, rotationX 25, rotationY ±16, rotation ±4` (even index uses negative values), `transformPerspective 800`.
- Reveal: mask goes to `inset(0%)`, radius 0. Card goes to `scale 1, rot 0`. **1.25s, power3.out**. It reverses when scrolling back above the start.
- Projects-end (`.projects-end`): timeline `timeScale(0.75)`, length 1.66, so about **2.21s real**. The paragraph is split into SplitText lines (`project-line`) with masks; lines `y 115%` to `0`, 0.85s, stagger 0.12, `back.out(1.4)`. Pills (`.projects-pill-*`): shell 0.55s `back.out(2.5)`, then text 0.5s `back.out(1.6)` (same pattern as the hero). The CTA follows the same pill pattern.

### 7.4 Project card hover (script #16), the image swap
- Structure: `.project-card-img-wrapper` (radius 16) contains `img.project-img` (main), `.project-img-svg` (foreground brush stroke svg) and `svg.project-card-mask-overlay`. The overlay holds `<mask>` > `path.mask-brush-path` plus an `<image>` that is the **hover image**. `img.project-img-hover` is `display: none` and only serves as the source.
- Initial: both paths `drawSVG 100% 100%, strokeWidth 0`.
- mouseenter `play()`:
  - At 0: foreground stroke drawSVG `0% 100%`, strokeWidth **1200**, 0.95s.
  - At 0.35: mask stroke does the same, 1.05s, so the hover image is painted in by the brush.
  - Ease is power1.inOut throughout.
  - Arrow `.projects-arrow`: rotation -45 over 0.28s power2.out, then 0 over 0.65s `elastic.out(1.15,0.35)`.
- mouseleave: `timeScale(1.3).reverse()`. Total forward time is **1.4s**.

### 7.5 Services path (script #18)
- One scrubbed master timeline (scrub 1.2, top 70% to bottom 70%).
- The dark path (desktop and mobile variants) draws 0% to 100%, ease none.
- For each of the 7 layers at `point = i/6`, starting at `max(0, point - 0.04)`:
  - `.service-svg` goes to `width data-target-width, scale 1, opacity 1`, 0.14 units, `back.out(3.5)`.
  - `.service-block-para-wrapper` goes to `scale 1, rotation -5, opacity 1` at +0.02.
- Lottie icons autoplay and loop via Webflow (lazy).

### 7.6 FAQ accordion (script #20)
- 10 items. The **first is open on load** (`is-open`).
- Open: `.question-block` goes to `width 50%` (>=992) / `75%` (<992) with `borderWidth 1px`. The answer block goes from `height 0, scale 0` to `height auto, scale 1`. The `.faq-logo` scales 0 to 1, and the answer text goes from `opacity 0, y 20` to `1, 0`.
  - Durations: 0.45 (q width), 0.5 `back.out(1.6)` (answer), 0.45 `back.out(2)` (logo), 0.4 power2.out (text).
- Close: text fades out 0.22 power2.in, logo goes to scale 0 over 0.25 power2.in, the answer goes to `scale 0, height 0` over 0.4 power2.inOut and then `display: none`, and q width goes to 100% with border 0 over 0.45 power2.out.

### 7.7 Testimonials (script #19)
- 5 stacked `.testimonial-card` elements. Back cards get small random rotations and z-index is reordered (front = N). Measured card tops and heights: 10298/456, 10218/617, 10259/534, 10286/480, 10258/537.
- Next card: the front card goes to `yPercent -140` over 0.38s power2.inOut, then returns. Other cards reorder over 0.35s power2.out.

### 7.8 Footer (script #21)
- Heading: SplitText lines in `span.footer-heading-line-mask`. Lines go from `y` to 0 over 0.8s, stagger 0.1, `back.out(1.6)`, at top 80%.
- Big footer logo: starts at `scaleY 0.15`, origin bottom.
  - While scrolling: scaleY follows `0.15 + progress*1.15 + min(vel/1500, 0.25)` when scrolling down, or `0.15 + progress*0.95` when scrolling up, clamped to 0.15 to 1.4, with 0.1s power1.out tweens.
  - At progress >= 0.9 or onLeave: settles to `scaleY 1` over 1.4s `elastic.out(1.2,0.35)`.
  - onLeaveBack: back to 0.15 over 0.25s.
- Footer and email links: per-char hover. Each char gets 0.38s `back.out(1.8)` with a per-char delay and color 0.5s; on leave, 0.35s with stagger 0.018.

### 7.9 Hover and micro-interactions
- **Nav pills** (`.navbar-link-btn`): a DrawSVG stroke fill (`.stroke-fill-code` path, orange) over 0.5s power1.inOut. Enter plays at timeScale 1; leave reverses at **timeScale 1.4**.
- **CTA buttons** (`.cta-btn`, `.project-btn`): **magnetic**.
  - Enter: 0.55s power2.out, plus an arrow loop timeline (`repeat -1, repeatDelay 0.2`: 0.22s power2.out out, 0.4s `back.out(2.5)` in).
  - Mousemove: btn and inner follow the pointer over 0.3s power2.out.
  - Leave: 0.35s power2.out, then elastic return over 0.8s `elastic.out(1.1,0.4)` (x2), then 0.45s.
- **Magnetic headings** (script #1): pointermove offset max **4px**, 0.2s power1.out. Leave: 0.6s `elastic.out(1.1,0.4)`.
- **Testimonials cursor follower**: `.nav-arrow` is absolutely positioned in `.testimonials-body-bg`. It uses `gsap.quickTo` x/y with 0.15s power2.out and `xPercent/yPercent -50`. Enter: scale 0 to 1 over 0.3s `back.out(2)`. It rotates 0deg (top half) or 180deg (bottom half) over 0.25s. Leave: scale 0 over 0.2s power2.in. **Disabled when `(pointer: coarse)` or vw < 992** (hidden).

### 7.10 Contact modal (script #10; triggered by `.cta-btn`)
- `.contact-page` (fixed, z 9999999) gets `display: flex`, class `is-active`, and pointer-events auto.
- Open timeline:
  - Transition paths: `strokeDashoffset` from len to 0 and strokeWidth from 0 to **1600px**, 0.9s power2.inOut, stagger 0.1 per path.
  - From **0.45s**: contact logo goes from scale 0 to 1 over 0.65s `back.out(2.2)`. The close btn pill goes `scale .4 to 1`, 0.7s `back.out(2.5)`, and its text 0.6s `back.out(1.6)`.
  - Heading chars (`contact-heading-char`, SplitText chars, initial `opacity 0, scale .5`): 0.85s, stagger 0.1, `back.out(1.4)`.
  - Para lines from `y 115%`: 0.7s, stagger 0.06, `back.out(1.5)`. Email heading words from `y 105%`: 0.7s, stagger 0.08, `back.out(1.5)`.
  - Email links 0.7s `back.out(2.5)`. Social pills 0.6s `back.out(1.6)`. Image `.contact-img` (rotation random ±3deg, origin bottom) goes from `scale .8` over 0.75s `back.out(1.8)`.
- Close: 0.3s, 0.3s and 0.3s power2.in fades, then 0.45s power2.in, then display none.
- Layout at 1440 (screenshot `desktop-contact-modal-open.png`):
  - Heading lines "WANT TO / START / A NEW / PROJECT?" with left x of 182, 270, 149, 196 and line y of 211, 314, 416, 519.
  - Right column at x806 holds "INQUIRIES & COMMISSIONS / bogdan@two26.studio" and "JOB APPLICATIONS / diana@two26.studio".
  - Instagram and LinkedIn outline pills sit bottom-left and bottom-right. The illustrated hand holding a "LET'S TALK" card sits bottom-centre-right.
- **Lenis is not stopped while the modal is open** (`lenis.isStopped === false` measured).

### 7.11 Mobile menu (script #6, <992)
- Toggle `.two26-nav-toggle-btn` (38x38). The icon is SVG with `.orange-path` (horseshoe dash) and `.cross-path`.
- Open: `.ham-navbar` (`rgba(249,226,225,0.95)`, full screen 375x812, padding `92.31 19.23 0 0`) gets display block, then opacity over 0.4s power2.out.
- Links are right-aligned and stacked: Work 111x57 @ (244,92), About us 146x57 @ (210,162), Let's Talk 131x43 @ (225,232). They spring in over 0.75s `back.out(2.2)`.
- Icon morph: 0.85s power2.inOut / power3.inOut, 0.12s `back.out(2)` and 0.6s power2.out.
- Close: links 0.25s stagger 0.04 power2.in, then the panel opacity goes to 0 over 0.3s power2.inOut.

---

## 8. Things that can bite the clone

1. **Window `load` timing**: the loader exit waits for `window.load`, with a 6s fallback. Lenis also calls `updateViewportHeight()` and `ScrollTrigger.refresh()` on `load`. In Vite+React, init must run after the ported markup is in the DOM. Firing `load` before the React render means these hooks never re-run.
2. Scripts use `document.readyState === 'loading' ? DOMContentLoaded : run now`. If they run before React mounts the markup, every `querySelector` returns null and each init silently returns.
3. The mobile system script (#6) inits on both `DOMContentLoaded` and `load` (`safeInit`).
4. `initLenis` bails if `window.lenis` already exists. With React StrictMode double-mount you get one Lenis, but ScrollTriggers are created twice.
5. SplitText mutates the DOM: hero, about, projects-end, footer, contact heading, para and email. React must not re-render those nodes.
6. The marquee speed is per gsap tick, so it is about 2x faster on 120Hz displays. This is the original's behaviour.
7. Lazy images: Lenis calls `lenis.resize()` on each image load. Pin and trigger positions shift if images load late. `ScrollTrigger.refresh()` runs on the loader exit and on `load`.
8. The hero poster comes from a **different Webflow site id** (`6a7d9d7d7c99784ba2cac874`).
9. The `prefers-reduced-motion` path skips the loader entirely.
10. A Work-CMS variant of the Lenis init exists (`/work/[slug]` uses body/window Lenis with duration 1.5 / 1.0). It does not apply to the homepage.

---

## 9. Screenshots (`/Users/riyaghosh/portfolio/two26/recon/`)

| File | Viewport / scrollTop |
|---|---|
| `desktop-after-loader-0.png` | 1440x900 @ 0, after loaderComplete and the hero entrance |
| `desktop-scroll-0900.png` | @ 900 (hero video and marquee) |
| `desktop-scroll-2400-about-pinned.png` | @ 2400 (about pinned, char colour wave mid-progress) |
| `desktop-scroll-4443-showcase.png` | @ 4443 |
| `desktop-scroll-5300-projects.png` | @ 5300 (row 1 revealed, row 2 still in initial 3D state) |
| `desktop-project-card-hover.png` | @ 5300, hovering card 1, 1.6s after enter |
| `desktop-scroll-6700-projects-end.png` | @ 6700 |
| `desktop-scroll-8200-services.png` | @ 8200 |
| `desktop-scroll-9900-testimonials.png` | @ 9900 |
| `desktop-scroll-11000-faq.png` | @ 11000 |
| `desktop-scroll-12203-footer.png` | @ 12203 (bottom) |
| `desktop-contact-modal-open.png` | contact modal fully open |
| `desktop-1440-fullpage.png` | 1440x13103 composite (see caveat) |
| `mobile-after-loader-0.png` | 375x812 @ 0 |
| `mobile-scroll-1300-about-pinned.png` | @ 1300 |
| `mobile-scroll-3203-projects.png` | @ 3203 |
| `mobile-scroll-7600-services.png` | @ 7600 |
| `mobile-scroll-11098-footer.png` | @ 11098 |
| `mobile-ham-menu-open.png` | hamburger menu open |
| `mobile-375-fullpage.png` | 375x11910 composite (see caveat) |

**Full-page caveat**: the site scrolls inside `.page` with `html/body position: fixed`, so a native full-page capture is impossible. The composites were made by forcing every ScrollTrigger animation to `progress(1)`, disabling the triggers, destroying Lenis and un-fixing html, body and `.page`. Pin spacing and scrubbed or reversible states, notably the project cards, which reverted to their clipped initial state, **do not match the real scrolled appearance**. Use the per-scroll viewport shots as the visual ground truth and the composites only for overall section order.
