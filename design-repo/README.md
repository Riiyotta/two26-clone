# two26 design-repo

AI-ready design repository extracted from the two26.studio clone: tokens, primitives,
components, section contracts, templates, a Draft-07 PageSpec schema, a semantic validator,
an adversarial suite and drift proofs. Status: **design-review-pending**, productionApproved
**false**. No IR file is generated (R13).

## Read this first: real company

two26.studio is a real, live boutique design studio in Bucharest. Its wordmark, illustrations,
founders and team, testimonial authors, client names and logos, client project imagery and
videos, and its copy all belong to real people and companies. A PageSpec has a required
`mode`:

- `reference`: faithful reconstruction of the source. Real content is allowed as evidence.
- `generated`: a new page for someone else. `schema/semantic_validate.py` rejects every source
  identity and content item listed in `assets/source-identity.json` (rules `GENERATED_MODE_BRAND`,
  `_CLIENT`, `_PERSON`, `_RATING`, `_CTA`, `_COPY`, `_URL`, `_EMAIL`, `_ASSET`). Only
  `generation-safe` asset roles are allowed, and links must use reserved `.example` / `.invalid`
  domains.

The display fonts ship as files named `MDNichromeTest-*` (trial/test cuts). Their licence is
unverified: do not use them in a generated production page without a confirmed licence. Keep
this repository private.

## Counts (recomputed by `extraction/counts.py`, checked by `verify_all.py`)

<!-- counts:start -->
| item | count |
|---|---|
| tokens | 95 |
| foundationTokens | 80 |
| semanticTokens | 15 |
| primitives | 13 |
| components | 10 |
| sections | 28 |
| retrievalIneligibleSections | 5 |
| templates | 4 |
| routes | 11 |
| examples | 6 |
| generatedExamples | 4 |
| referenceExamples | 2 |
| assetRoles | 28 |
| motionPatterns | 27 |
| graphRules | 9 |
| adversarialCases | 91 |
| adversarialControls | 8 |
<!-- counts:end -->

## Template families and routes

| template | purpose | routes |
|---|---|---|
| home | Studio landing page: hero, manifesto, showcase, featured work, services, testimonials, FAQ. | / |
| about | Studio story page: hero, origin story blocks, team, moodboard, office rules, capabilities. | /about |
| work-index | Portfolio index: hero plus a grid of every project card. | /work |
| project-detail | Case study: cover hero, two narrative blocks (context, solution), optional discipline tags, a long run of media rows, more-projects grid. | /work/bagel-bar, /work/heygluco, /work/lpi, /work/merci, /work/munchies-and-cream, /work/mvp, /work/tanti-maria, /work/yum-yum |

Every route the clone serves (`src/pages/routes.json`, 11 routes) maps to exactly one template.

## How the long wrappers were decomposed (R6)

- **About hero wrapper** (`section.section-about-hero`, 4118px at 1440) holds three things:
  the page-opening hero (text, path, illustration and paragraph: `hero.about`, 814px), two
  illustrated story blocks (`story.split-illustrated`, 592px and 552px, one per
  `.about-story-section`) and the team band (`team.member-cards`, 1280px), plus the team popup
  dialog (`runtime.team-popup`). Each is a contract with its own source line range.
- **Case-study body** (`section.section-project-content`, 9.6k to 17.7k px when its media has
  loaded) is one CMS list. It is decomposed by its real list items: `project.narrative`
  (Context, Solution), `project.meta-tags` (discipline tags, 5 of 8 projects),
  `project.media-single`, `project.media-pair` and `project.video-embed`. The heygluco reference
  example reproduces the real 21-item order, and the build checked it against the measured DOM.
- **Home projects section** is split into the card grid (`work.featured-grid`) and the
  "see all projects" conversion band (`cta.projects-end`, CTA-classed).
- **Home pinned statement** (`statement.pinned-manifesto`) measures 3100px. That is 900px of
  content plus a 2200px pin spacer (scroll stage), recorded as such.

Runtime UI is `retrievalEligible: false` with a reason: preloader, contact modal, mobile menu,
testimonials cursor follower and team popup. These ids are pinned in code in both
`semantic_validate.py` and `verify_all.py`.

## Citations

Citations are `path:line[-line]` plus a `contains` string that must appear on those lines.
Paths are relative to the clone project root. `pages:` is shorthand for `src/pages/`. Motion
evidence cites the original inline scripts (`pages:<page>/scripts/NN.js`). With the source tree
next to this folder, `verify_all.py` re-reads every range. Standalone, those checks are skipped
with a warning.

## Run

```bash
python3 -m pip install jsonschema           # the only dependency
python3 extraction/verify_all.py            # all structural / pin / citation / gate checks
python3 schema/semantic_validate.py schema/examples/*.json
python3 schema/tests/adversarial_test.py    # mutations rejected, controls pass
python3 extraction/prove_drift.py           # each verify_all check fails on injected drift
python3 extraction/wrapper_gate.py          # R9 gate on its own
python3 extraction/build_schema.py          # regenerate the PageSpec schema after editing sections/
# optional re-measure (needs node + playwright, clone dev server running):
BASE_URL=http://127.0.0.1:5226 node extraction/measure_sections.mjs > heights.json
```

## What is measured vs not

- Section heights: measured in this build at 1440x900 (all 11 routes, clone) and 375x812
  (4 routes), with lazy media forced to load. The same method was run on the live original for
  /, /about, /work/heygluco and /work/lpi: /about and both case studies match to the pixel.
  The home page differed in this run (original 13342 vs clone 13103: hero and projects-end).
  This is unresolved, see `extraction/measured-values.json` (originalComparison1440).
- Pixel parity: no harness ships here. The parity numbers in `measured-values.json`
  (parityEvidence) come from an earlier session and were not re-run in this build. Pixel
  parity for /about, /work and the case studies was never measured.
- Reduced motion: the source honours `prefers-reduced-motion` only in the loader. Every
  other `reducedMotionFallback` is a requirement for generated pages, not a source behaviour.
