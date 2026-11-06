# two26 clone — information architecture

The site's information architecture (IA) is kept as data. **`ia.json` is the only file to hand-edit.**
`IA.md` and `matrix.csv` are generated from it — never edit them directly.

```bash
node validate.mjs   # checks route totals, section references, categories
node build.mjs      # regenerates IA.md and matrix.csv
```

Edit `ia.json` after routes or sections change, then re-run both.

## What the data shows

- **One template is most of the site.** The project case study covers 8 of 11 routes (73%) and is built from just 5 content blocks: hero, brief, gallery, more works, back-nav header. The other 3 routes (home, about, work index) each use their own template.
- **Only 6 of 25 sections are shared across templates.** Loader, contact modal, mobile menu and footer are on all 11 routes, the full navbar is on 3, and the project grid is on 2 (home and work index). The other 19 are single-use, so they can stay page-local.
- **The site has two page "chromes".** Home, about and work use a header with Work/About links (`full-nav`). Project pages swap those links for a back button (`back-nav`).
- **Home is the densest page:** 12 sections, including the only testimonials, FAQ and services-path blocks.

## Notes

- Sources:
  - `src/pages/<page>/sections/*.html`, the original markup copied verbatim per section.
  - `src/pages/routes.json`.
- Shared headers and footers were compared with script markers stripped. They differ only in which link is highlighted as the current page.
- Some DOM wrappers hold several distinct blocks, so they're split into separate sections here (the `implementedBy` field says which part of which component renders each one):
  - The about opener splits into `hero.about`, `story.founders` and `story.team`.
  - Each project body splits into `work.project-brief` and `work.project-gallery`.
- `validate.mjs` prints one informational note: "992" in `shell.mobile-menu`'s scope. That's a breakpoint in pixels, not a route count, so it's expected.
