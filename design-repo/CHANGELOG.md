# Changelog

## 1.0.0 (initial build)

- Built from scratch against the current clone (Vite + React rendering the original Webflow
  markup) and its recon (CLONE_SPEC.md, recon/ screenshots).
- Tokens from the stylesheet's real declarations, each with a line citation. Motion tokens and
  27 motion patterns come from the original inline scripts.
- 28 section contracts (5 runtime, retrieval-ineligible), 4 template families, 11 routes.
- `mode` reference|generated with generated-mode leakage rules grepped from the real source.
- Asset roles with three-way availability, pinned in code. Generation-safe substitutes.
- Wrapper gate with heights measured at 1440 (lazy media loaded). The about hero wrapper and
  the case-study body are decomposed by real DOM boundaries.
- `tokens/llm` catalog + policy, derived and drift-checked.
- 4 generated examples (one per family, fictional "Fernhollow Studio") and 2 reference
  examples (home, heygluco).
- Found during the build: the brief's /work/heygluco height (11834) was the unloaded state. With
  media loaded, both original and clone measure 20549. The /work ProjectsWork stack is
  display:none everywhere. Vitabun/bioeel do not occur in the source. CLONE_SPEC's 375 total
  (11910) is stale (11681). Home page heights on the live original differed in one run
  (13342 vs 13103); this is unresolved.
