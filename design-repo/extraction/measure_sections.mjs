// Optional re-measure tool for sectionHeights (R9). Not needed to run verify_all.py.
// Usage:
//   BASE_URL=http://127.0.0.1:5226 VIEWPORT=1440x900 node extraction/measure_sections.mjs > out.json
// Requires the `playwright` package resolvable by Node (e.g. NODE_PATH pointing at a global
// install) and a Chromium build installed by Playwright. Optional: PW_CHROMIUM_PATH = browser
// executable path. No absolute paths are stored in this repo.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5226';
const [VW, VH] = (process.env.VIEWPORT || '1440x900').split('x').map(Number);
const ROUTES = (process.env.ROUTES || '/,/about,/work,/work/bagel-bar,/work/heygluco,/work/lpi,/work/merci,/work/munchies-and-cream,/work/mvp,/work/tanti-maria,/work/yum-yum').split(',');

function measure() {
  const page = document.querySelector('.page');
  const st = (page ? page.scrollTop : 0) + window.scrollY;
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top + st), height: Math.round(r.height) }; };
  const span = (a, b) => (a && b ? { top: a.top, height: b.top - a.top } : null);
  const end = (a) => (a ? a.top + a.height : null);
  const q = (s) => document.querySelector(s);
  const out = { scrollHeight: page ? page.scrollHeight : document.documentElement.scrollHeight, units: {} };
  const U = out.units;
  const pinOf = (el) => (el && el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el);
  const header = q('header.header');
  if (header) U['shell.header'] = { ...box(header), position: getComputedStyle(header).position };
  const footer = q('footer.footer'); if (footer) U['shell.footer'] = box(footer);
  if (q('.section-hero')) {
    U['hero.home'] = box(q('.section-hero'));
    const about = q('.section-about'); U['statement.pinned-manifesto'] = { ...box(pinOf(about)), unpinnedHeight: Math.round(about.getBoundingClientRect().height) };
    U['media.showcase-marquee'] = box(q('.section-slider-showcase'));
    const pr = box(q('.section-projects')), pe = box(q('.projects-end'));
    U['work.featured-grid'] = span(pr, pe);
    U['cta.projects-end'] = { top: pe.top, height: end(pr) - pe.top };
    U['features.services-path'] = box(q('.section-services'));
    U['social-proof.testimonial-stack'] = box(q('.section-testimonials'));
    U['faq.accordion'] = box(q('.section-faq'));
  }
  if (q('.section-about-hero')) {
    const sec = box(q('.section-about-hero')), st2 = box(q('.about-story-team'));
    U['_wrapper.section-about-hero'] = sec;
    U['hero.about'] = span(sec, st2);
    const stories = [...document.querySelectorAll('.about-story-section')].map(box);
    U['story.split-illustrated'] = stories;
    U['team.member-cards'] = { top: end(stories[stories.length - 1]), height: end(sec) - end(stories[stories.length - 1]) };
    U['gallery.moodboard-marquee'] = box(q('.section-moodboard'));
    U['values.stacked-cards'] = box(q('.section-values'));
    U['capabilities.pill-cloud'] = box(q('.section-what-we-do'));
  }
  if (q('.section-work-hero')) {
    U['hero.work-index'] = box(q('.section-work-hero'));
    U['work.index-stack'] = box(q('.section-projects-work'));
    U['work.featured-grid'] = box(q('.section-projects'));
  }
  if (q('.section-project-hero')) {
    U['hero.project'] = box(q('.section-project-hero'));
    U['_wrapper.section-project-content'] = box(q('.section-project-content'));
    const items = [...document.querySelectorAll('.section-project-content .collection-list > .collection-item-2')];
    U['project-content.items'] = items.map((el) => {
      let kind = 'unknown';
      if (el.querySelector('.project-content')) kind = 'project.narrative';
      else if (el.querySelector('.project-video')) kind = 'project.video-embed';
      else if (el.querySelector('.project-single-img')) kind = 'project.media-single';
      else if (el.querySelector('.collection-list-2')) kind = 'project.media-pair';
      if (kind === 'unknown') kind = 'unknown:' + (el.firstElementChild ? el.firstElementChild.className : '') + ':' + el.textContent.trim().slice(0, 60);
      return { kind, ...box(el), images: el.querySelectorAll('img').length, heading: (el.querySelector('.prj-content-heading') || {}).textContent || null };
    });
    U['work.more-projects'] = box(q('.section-projects'));
  }
  return out;
}

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: VW, height: VH } });
const result = { measuredAt: new Date().toISOString(), baseUrl: BASE, viewport: { width: VW, height: VH }, routes: {} };
for (const r of ROUTES) {
  const p = await ctx.newPage();
  await p.goto(BASE + r, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__two26LoaderDone === true || document.body.dataset.two26LoaderDone === 'true', null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1500);
  // Lazy media (images, Vimeo embeds sized from oEmbed) only take height once loaded:
  // force eager loading and walk the scroll container to the bottom and back before measuring.
  await p.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    const sc = document.querySelector('.page');
    const set = (y) => { if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(y, { immediate: true, force: true }); if (sc) sc.scrollTop = y; window.scrollTo(0, y); };
    const max = () => Math.max(sc ? sc.scrollHeight : 0, document.documentElement.scrollHeight);
    for (let y = 0; y < max(); y += 600) { set(y); await new Promise((r) => setTimeout(r, 120)); }
    await new Promise((r) => setTimeout(r, 2500));
    set(0);
    await new Promise((r) => setTimeout(r, 800));
  });
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.evaluate(() => { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
  await p.waitForTimeout(500);
  result.routes[r] = await p.evaluate(measure);
  await p.close();
}
await browser.close();
console.log(JSON.stringify(result, null, 1));
