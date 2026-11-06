# https://two26.studio (Webflow site) via the local clone at /

Source: https://two26.studio (Webflow site) via the local clone at /
Status: **measured-from-mirror**
11 routes · 4 templates · 25 unique sections

> Generated from `ia.json` by `build.mjs`. Edit the JSON, not this file.

## Shape of the site

The largest 3 templates (Project case study, Home, About) account for 10 of 11 routes (91%). The remaining 1 routes span 1 template.

| template | routes | share |
|---|---:|---:|
| Project case study | 8 | 73% |
| Home | 1 | 9% |
| About | 1 | 9% |
| Work index | 1 | 9% |

## Page chrome

**3 routes carry chrome = `full-nav`** — Home, About, Work index.

**8 routes carry chrome = `back-nav`** — Project case study.

## Sections by reuse

How widely a section is shared determines whether it belongs in a shared
component library or stays local to its page.

| section | category | templates | routes | implementation | scope |
|---|---|---:|---:|---|---|
| `shell.loader` | SHELL | 4 | 11 | `src/pages/*/components/Loader.jsx` | All 11 routes; markup identical everywhere. |
| `shell.contact-modal` | SHELL | 4 | 11 | `src/pages/*/components/Header.jsx (the .contact-page block inside the header)` | All 11 routes; lives inside the header markup. |
| `shell.mobile-menu` | SHELL | 4 | 11 | `src/pages/*/components/Header.jsx (the .ham-navbar block inside the header)` | All 11 routes, below 992px only; lives inside the header markup. |
| `shell.footer` | SHELL | 4 | 11 | `src/pages/*/components/Footer.jsx` | All 11 routes; identical apart from the active-link state. |
| `shell.navbar-back` | SHELL | 1 | 8 | `src/pages/work_*/components/Header.jsx` | All 8 project-detail routes. |
| `hero.project` | HERO | 1 | 8 | `src/pages/work_*/components/ProjectHero.jsx` | All 8 project-detail routes, one per project. |
| `work.project-brief` | WORK | 1 | 8 | `src/pages/work_*/components/ProjectContent.jsx (text block before the first media row)` | All 8 project-detail routes. |
| `work.project-gallery` | WORK | 1 | 8 | `src/pages/work_*/components/ProjectContent.jsx (media rows after the brief)` | All 8 project-detail routes; row mix and count differ per project. |
| `work.more-works` | WORK | 1 | 8 | `src/pages/work_*/components/Projects.jsx` | All 8 project-detail routes; the cards listed vary per project. |
| `shell.navbar` | SHELL | 3 | 3 | `src/pages/{home,about,work}/components/Header.jsx` | The 3 non-project routes (home, about, work); identical apart from which link carries the current-page state. |
| `work.project-grid` | WORK | 2 | 2 | `src/pages/{home,work}/components/Projects.jsx` | Home and the work index (2 routes); the work index hides the heading and adds wrapper padding. |
| `hero.home` | HERO | 1 | 1 | `src/pages/home/components/Hero.jsx` | Home only. |
| `hero.about` | HERO | 1 | 1 | `src/pages/about/components/AboutHero.jsx (the hero text, path and bottom block before .about-story-team)` | About only. |
| `hero.work` | HERO | 1 | 1 | `src/pages/work/components/WorkHero.jsx` | Work index only. |
| `story.pinned-intro` | STORY | 1 | 1 | `src/pages/home/components/About.jsx` | Home only. |
| `story.founders` | STORY | 1 | 1 | `src/pages/about/components/AboutHero.jsx (first part of .about-story-team)` | About only. |
| `story.team` | STORY | 1 | 1 | `src/pages/about/components/AboutHero.jsx (last part of .about-story-team)` | About only. |
| `story.moodboard` | STORY | 1 | 1 | `src/pages/about/components/Moodboard.jsx` | About only. |
| `story.values` | STORY | 1 | 1 | `src/pages/about/components/Values.jsx` | About only. |
| `work.showcase-marquee` | WORK | 1 | 1 | `src/pages/home/components/SliderShowcase.jsx` | Home only. |
| `work.project-stack` | WORK | 1 | 1 | `src/pages/work/components/ProjectsWork.jsx` | Work index only. |
| `services.path` | SERVICES | 1 | 1 | `src/pages/home/components/Services.jsx` | Home only. |
| `services.range` | SERVICES | 1 | 1 | `src/pages/about/components/WhatWeDo.jsx` | About only. |
| `proof.testimonials` | PROOF | 1 | 1 | `src/pages/home/components/Testimonials.jsx` | Home only. |
| `support.faq` | SUPPORT | 1 | 1 | `src/pages/home/components/Faq.jsx` | Home only. |

**6 shared sections** appear in more than one template and belong in a component library.

**19 single-use sections** appear in exactly one template. Building these
as "reusable" components up front would be speculative — keep them page-local
until a second caller actually appears.

## Templates

### Home — `template.home`

1 route · `/` · chrome: **full-nav**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.loader` | shared ×4 |
| 2 | SHELL | `shell.navbar` | shared ×3 |
| 3 | SHELL | `shell.contact-modal` | shared ×4 |
| 4 | SHELL | `shell.mobile-menu` | shared ×4 |
| 5 | HERO | `hero.home` | page-local |
| 6 | STORY | `story.pinned-intro` | page-local |
| 7 | WORK | `work.showcase-marquee` | page-local |
| 8 | WORK | `work.project-grid` | shared ×2 |
| 9 | SERVICES | `services.path` | page-local |
| 10 | PROOF | `proof.testimonials` | page-local |
| 11 | SUPPORT | `support.faq` | page-local |
| 12 | SHELL | `shell.footer` | shared ×4 |

### About — `template.about`

1 route · `/about` · chrome: **full-nav**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.loader` | shared ×4 |
| 2 | SHELL | `shell.navbar` | shared ×3 |
| 3 | SHELL | `shell.contact-modal` | shared ×4 |
| 4 | SHELL | `shell.mobile-menu` | shared ×4 |
| 5 | HERO | `hero.about` | page-local |
| 6 | STORY | `story.founders` | page-local |
| 7 | STORY | `story.team` | page-local |
| 8 | STORY | `story.moodboard` | page-local |
| 9 | STORY | `story.values` | page-local |
| 10 | SERVICES | `services.range` | page-local |
| 11 | SHELL | `shell.footer` | shared ×4 |

### Work index — `template.work-index`

1 route · `/work` · chrome: **full-nav**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.loader` | shared ×4 |
| 2 | SHELL | `shell.navbar` | shared ×3 |
| 3 | SHELL | `shell.contact-modal` | shared ×4 |
| 4 | SHELL | `shell.mobile-menu` | shared ×4 |
| 5 | HERO | `hero.work` | page-local |
| 6 | WORK | `work.project-stack` | page-local |
| 7 | WORK | `work.project-grid` | shared ×2 |
| 8 | SHELL | `shell.footer` | shared ×4 |

### Project case study — `template.project-detail`

8 routes · `/work/{slug}` · chrome: **back-nav**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.loader` | shared ×4 |
| 2 | SHELL | `shell.navbar-back` | page-local |
| 3 | SHELL | `shell.contact-modal` | shared ×4 |
| 4 | SHELL | `shell.mobile-menu` | shared ×4 |
| 5 | HERO | `hero.project` | page-local |
| 6 | WORK | `work.project-brief` | page-local |
| 7 | WORK | `work.project-gallery` | page-local |
| 8 | WORK | `work.more-works` | page-local |
| 9 | SHELL | `shell.footer` | shared ×4 |

## Section reference

### SHELL

_Chrome and runtime UI present on every route: preloader, navigation, contact modal, mobile menu, footer._

**`shell.loader`** — Full-screen preloader: an orange stroke draws the TWO 26 logo, then pink and orange strokes sweep off-screen to reveal the page (~5s). Skipped on internal navigation via a sessionStorage flag.

· All 11 routes; markup identical everywhere. · appears on 11 routes · implemented by `src/pages/*/components/Loader.jsx`

**`shell.navbar`** — Fixed top bar: Work and About us pill links (stroke-draw hover), centred TWO 26 wordmark, studio hours text, and a magnetic black Let's Talk button that opens the contact modal; collapses to a hamburger below 992px.

· The 3 non-project routes (home, about, work); identical apart from which link carries the current-page state. · appears on 3 routes · implemented by `src/pages/{home,about,work}/components/Header.jsx`

**`shell.navbar-back`** — Project-page variant of the top bar: a back button with arrow replaces the Work/About us links; wordmark and Let's Talk button as in shell.navbar.

· All 8 project-detail routes. · appears on 8 routes · implemented by `src/pages/work_*/components/Header.jsx`

**`shell.contact-modal`** — Full-viewport 'want to start a new project?' overlay opened by Let's Talk: inquiry and job-application email links, LinkedIn and Instagram pills, close button; animated in with stroke draw and split-text reveal (~2.1s).

· All 11 routes; lives inside the header markup. · appears on 11 routes · implemented by `src/pages/*/components/Header.jsx (the .contact-page block inside the header)`

**`shell.mobile-menu`** — Hamburger overlay below 992px: large Work, About us and Let's Talk items over a full-screen panel.

· All 11 routes, below 992px only; lives inside the header markup. · appears on 11 routes · implemented by `src/pages/*/components/Header.jsx (the .ham-navbar block inside the header)`

**`shell.footer`** — Closing footer: 'Okay, that's enough website' heading with Let's Talk, contact email, main-menu and social links (Instagram, Behance, LinkedIn), 'Handmade by humans' line, location and copyright, over a textured background with a scroll-triggered reveal from underneath the page.

· All 11 routes; identical apart from the active-link state. · appears on 11 routes · implemented by `src/pages/*/components/Footer.jsx`

### HERO

_The page-opening composition of a route._

**`hero.home`** — 'LOOKING SUSPICIOUSLY GOOD' headline in orange with three tilted black pills, a looping illustration video (two characters carrying TWO and 26 signs, cats), orange curved paths left and right, and a curved scrolling text marquee below.

· Home only. · appears on 1 routes · implemented by `src/pages/home/components/Hero.jsx`

**`hero.about`** — 'Small studio, big brand energy' two-line headline with pills, founders' illustrated portrait, a short founding statement, and a large orange looping path drawn on scroll.

· About only. · appears on 1 routes · implemented by `src/pages/about/components/AboutHero.jsx (the hero text, path and bottom block before .about-story-team)`

**`hero.work`** — 'A few projects to brag about' headline with tilted pills introducing the portfolio index.

· Work index only. · appears on 1 routes · implemented by `src/pages/work/components/WorkHero.jsx`

**`hero.project`** — Case-study opener: full-bleed project cover image with the project name as a large heading.

· All 8 project-detail routes, one per project. · appears on 8 routes · implemented by `src/pages/work_*/components/ProjectHero.jsx`

### STORY

_Studio narrative: who they are, how they work, values, team._

**`story.pinned-intro`** — 'A bit about us' pinned scroll stage: the viewport pins for an extra ~2200px while a large statement about keeping the team tight reveals word by word, with three trait labels (Professional overthinkers, Nerding out on design, Allergic to generic).

· Home only. · appears on 1 routes · implemented by `src/pages/home/components/About.jsx`

**`story.founders`** — Founding story: 'Two '90s kids, one shared itch to make better brands' and 'Less size, more scope' text blocks with illustrations.

· About only. · appears on 1 routes · implemented by `src/pages/about/components/AboutHero.jsx (first part of .about-story-team)`

**`story.team`** — 'The team / This is pretty much everyone' block: team cards with portrait photo, name and role (creative partners and designers).

· About only. · appears on 1 routes · implemented by `src/pages/about/components/AboutHero.jsx (last part of .about-story-team)`

**`story.moodboard`** — 'Off the clock / Behind the work' studio moodboard: a collage of 10 studio-life images.

· About only. · appears on 1 routes · implemented by `src/pages/about/components/Moodboard.jsx`

**`story.values`** — Four value cards (The brief is not set in stone; Good ideas need space; Pretty is not a strategy; If it can be simple, simplify), each a heading plus a short explanation.

· About only. · appears on 1 routes · implemented by `src/pages/about/components/Values.jsx`

### WORK

_Portfolio content: project showcases, grids, case-study body._

**`work.showcase-marquee`** — Edge-to-edge horizontal strip of project images and videos scrolling continuously, speeding up with scroll velocity.

· Home only. · appears on 1 routes · implemented by `src/pages/home/components/SliderShowcase.jsx`

**`work.project-grid`** — Grid of selected project cards that reveal with a clip-path on scroll; hovering a card paints in a second image through a brush-stroke SVG mask. Carries a 'Selected Works' heading, hidden on the work index.

· Home and the work index (2 routes); the work index hides the heading and adds wrapper padding. · appears on 2 routes · implemented by `src/pages/{home,work}/components/Projects.jsx`

**`work.project-stack`** — Full-width project panels (HeyGluco, Yum Yum, Tanti Maria, ...) that scroll up over one another: the previous panel scales to 0.75 with a slight random tilt and is covered by an SVG paint-wipe (scrub 0.6); a cursor follower shows project info on desktop.

· Work index only. · appears on 1 routes · implemented by `src/pages/work/components/ProjectsWork.jsx`

**`work.project-brief`** — Case-study text: 'The Context' and 'The Solution' headings with the project's written brief and approach.

· All 8 project-detail routes. · appears on 8 routes · implemented by `src/pages/work_*/components/ProjectContent.jsx (text block before the first media row)`

**`work.project-gallery`** — Case-study media: full-width landscape images, paired portrait images and Vimeo background videos in rows; the longest block on each project page.

· All 8 project-detail routes; row mix and count differ per project. · appears on 8 routes · implemented by `src/pages/work_*/components/ProjectContent.jsx (media rows after the brief)`

**`work.more-works`** — 'More Works' cross-links to other case studies, using the same brush-mask hover reveal as the project grid.

· All 8 project-detail routes; the cards listed vary per project. · appears on 8 routes · implemented by `src/pages/work_*/components/Projects.jsx`

### SERVICES

_What the studio offers._

**`services.path`** — 'This is our thing' services list laid along an orange path that draws on scroll (scrub), with a looping Lottie icon and a one-line description per service (Brand strategy, Brand identity, Packaging, Motion design, Web design, Illustration, Art direction).

· Home only. · appears on 1 routes · implemented by `src/pages/home/components/Services.jsx`

**`services.range`** — 'Capabilities / We've got range' cloud of ~25 capability tags (brand collateral, signage, pitch decks, packaging design, 2D animation, logo design, ...) ending in a Let's Talk button.

· About only. · appears on 1 routes · implemented by `src/pages/about/components/WhatWeDo.jsx`

### PROOF

_Client testimonials._

**`proof.testimonials`** — 'Apparently, they like us' stacked client testimonial cards with a cursor-following arrow that flips direction to page through them.

· Home only. · appears on 1 routes · implemented by `src/pages/home/components/Testimonials.jsx`

### SUPPORT

_Answers to common questions._

**`support.faq`** — 'Frequently asked questions / Things you might ask' accordion (e.g. what kind of projects do you take on, how much does a branding project cost); first item open on load, one item open at a time.

· Home only. · appears on 1 routes · implemented by `src/pages/home/components/Faq.jsx`
