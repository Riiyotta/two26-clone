#!/usr/bin/env python3
"""Adversarial suite: every mutation must be rejected with the named rule; every control must pass.

    python3 schema/tests/adversarial_test.py

Three groups:
  MUTATIONS   - PageSpec mutations run through schema/semantic_validate.py (schema + semantic layers)
  GATE_CASES  - wrapper-gate mutations of the measured heights / whitelist (extraction/wrapper_gate.py)
  REPO_CASES  - contract / allowlist / registry edits in a scratch copy, run through extraction/verify_all.py
Controls: every example PageSpec (generated + reference) and the unmodified gate data.
Requires the `jsonschema` package.
"""
import copy, importlib.util, json, shutil, subprocess, sys, tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
EX = REPO / "schema/examples"


def _mod(name, rel):
    s = importlib.util.spec_from_file_location(name, REPO / rel)
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    return m


def ex(name):
    return json.loads((EX / f"{name}.pagespec.json").read_text())


def idx(spec, sid, k=0):
    hits = [i for i, n in enumerate(spec["nodes"]) if n["section"] == sid]
    return hits[k]


def nd(spec, sid, k=0):
    return spec["nodes"][idx(spec, sid, k)]


def setp(f):
    """wrap a mutator so it returns the spec"""
    def g(s):
        f(s)
        return s
    return g


def real(cls_field):
    """real source text, taken from the reference example (never retyped)"""
    rh = ex("reference.home")
    return cls_field(rh)


GH, GA, GW, GP, RH = "generated.home", "generated.about", "generated.work-index", "generated.project-detail", "reference.home"

# (name, example, mutator, expected rule)
MUTATIONS = [
    # ---- R2 / R5 generated-mode leakage
    ("brand in hero headline", GH, setp(lambda s: nd(s, "hero.home")["content"].update(headline="TWO26 IS BACK")), "GENERATED_MODE_BRAND"),
    ("brand variant 'Two 26 Studio'", GH, setp(lambda s: nd(s, "statement.pinned-manifesto")["content"].update(statement="Meet Two 26 Studio, a small team.")), "GENERATED_MODE_BRAND"),
    ("brand variant 'two-26' in legal", GH, setp(lambda s: nd(s, "shell.footer")["content"].update(legal="© 2026 two-26")), "GENERATED_MODE_BRAND"),
    ("brand in meta title", GH, setp(lambda s: s["meta"].update(title="Two26 Studio | Branding")), "GENERATED_MODE_BRAND"),
    ("brand as site name", GH, setp(lambda s: s["site"].update(brandName="Two26")), "GENERATED_MODE_BRAND"),
    ("source domain link", GH, setp(lambda s: nd(s, "shell.header")["content"]["navLinks"][0].update(href="https://two26.studio/work")), "GENERATED_MODE_URL"),
    ("source base URL", GH, setp(lambda s: s["site"].update(baseUrl="https://two26.studio")), "GENERATED_MODE_URL"),
    ("source email", GH, setp(lambda s: nd(s, "shell.footer")["content"].update(email="bogdan@two26.studio")), "GENERATED_MODE_EMAIL"),
    ("non-placeholder email", GH, setp(lambda s: nd(s, "shell.footer")["content"].update(email="hello@gmail.com")), "GENERATED_MODE_EMAIL"),
    ("source social profile", GH, setp(lambda s: nd(s, "shell.footer")["content"]["socialLinks"][0].update(href="https://www.instagram.com/two26_studio/")), "GENERATED_MODE_URL"),
    ("founder social profile", GA, setp(lambda s: nd(s, "shell.footer")["content"]["socialLinks"][0].update(href="https://www.linkedin.com/in/andreea-liche-55832518a/")), "GENERATED_MODE_URL"),
    ("store link (App Store)", GH, setp(lambda s: nd(s, "shell.footer")["content"]["socialLinks"].append({"label": "App", "href": "https://apps.apple.com/app/id1"})), "GENERATED_MODE_URL"),
    ("real-looking non-placeholder domain", GH, setp(lambda s: nd(s, "cta.projects-end")["content"].update(ctaHref="https://fernhollow.com/projects")), "GENERATED_MODE_URL"),
    ("source video host", GP, setp(lambda s: nd(s, "project.video-embed")["assets"][0].update(src="https://player.vimeo.com/video/1229445748")), "GENERATED_MODE_URL"),
    ("real testimonial author", GH, setp(lambda s: nd(s, "social-proof.testimonial-stack")["content"]["testimonials"][0].update(name="Luiza Zamfirescu")), "GENERATED_MODE_PERSON"),
    ("real review quote", GH, setp(lambda s: nd(s, "social-proof.testimonial-stack")["content"]["testimonials"][0].update(quote=real(lambda r: nd(r, "social-proof.testimonial-stack")["content"]["testimonials"][3]["quote"]))), "GENERATED_MODE_RATING"),
    ("real review attribution", GH, setp(lambda s: nd(s, "social-proof.testimonial-stack")["content"]["testimonials"][1].update(role="COO, Dare Digital")), "GENERATED_MODE_RATING"),
    ("real team member", GA, setp(lambda s: nd(s, "team.member-cards")["content"]["members"][0].update(name="Bogdan Apalaghiei")), "GENERATED_MODE_PERSON"),
    ("studio cats", GH, setp(lambda s: nd(s, "faq.accordion")["content"]["items"][0].update(answer="Ask Oreo, our office cat.")), "GENERATED_MODE_PERSON"),
    ("real client on card", GW, setp(lambda s: nd(s, "work.featured-grid")["content"]["cards"][0].update(name="HeyGluco")), "GENERATED_MODE_CLIENT"),
    ("real client in case-study title", GP, setp(lambda s: nd(s, "hero.project")["content"].update(title="Tanti Maria")), "GENERATED_MODE_CLIENT"),
    ("source hero copy", GH, setp(lambda s: nd(s, "hero.home")["content"].update(headline=real(lambda r: nd(r, "hero.home")["content"]["headline"]))), "GENERATED_MODE_COPY"),
    ("source FAQ answer", GH, setp(lambda s: nd(s, "faq.accordion")["content"]["items"][0].update(answer=real(lambda r: nd(r, "faq.accordion")["content"]["items"][6]["answer"]))), "GENERATED_MODE_COPY"),
    ("source footer line", GH, setp(lambda s: nd(s, "shell.footer")["content"].update(heading=real(lambda r: nd(r, "shell.footer")["content"]["heading"]))), "GENERATED_MODE_COPY"),
    ("source CTA 'Let's Talk'", GH, setp(lambda s: nd(s, "shell.header")["content"].update(ctaLabel="Let's Talk")), "GENERATED_MODE_CTA"),
    ("source CTA 'See all projects'", GH, setp(lambda s: nd(s, "cta.projects-end")["content"].update(ctaLabel="See all projects")), "GENERATED_MODE_CTA"),
    ("source wordmark asset role", GH, setp(lambda s: nd(s, "shell.header")["assets"][0].update(assetRole="brand.wordmark-source")), "GENERATED_MODE_ASSET"),
    ("real team photo role", GA, setp(lambda s: nd(s, "team.member-cards")["assets"][0].update(assetRole="person.team-photo-source")), "GENERATED_MODE_ASSET"),
    ("real client logo role", GH, setp(lambda s: nd(s, "work.featured-grid")["assets"][1].update(assetRole="client.logo-source")), "GENERATED_MODE_ASSET"),
    ("source Lottie icon role", GH, setp(lambda s: nd(s, "features.services-path")["assets"][0].update(assetRole="icon.service-animation-source")), "GENERATED_MODE_ASSET"),
    ("source media file under a safe role", GH, setp(lambda s: nd(s, "hero.home")["assets"][0].update(src="/assets/media/6aaad679fdb9d914f7f52055_Hero_mp4.mp4")), "GENERATED_MODE_ASSET"),
    ("source asset id on a placeholder host", GP, setp(lambda s: nd(s, "project.media-single")["assets"][0].update(src="https://cdn.fernhollow.example/6ab384f284b10fab359deea5_landscape2.jpg")), "GENERATED_MODE_ASSET"),
    # ---- R8 retrieval eligibility at node level
    ("runtime modal flipped eligible", GH, setp(lambda s: nd(s, "runtime.contact-modal").update(retrievalEligible=True)), "RETRIEVAL_PIN"),
    ("preloader flipped eligible", GH, setp(lambda s: nd(s, "runtime.preloader").update(retrievalEligible=True)), "RETRIEVAL_PIN"),
    ("content section marked ineligible", GH, setp(lambda s: nd(s, "faq.accordion").update(retrievalEligible=False)), "RETRIEVAL_PIN"),
    # ---- R10 token policy
    ("unknown token", GH, setp(lambda s: nd(s, "hero.home")["tokens"].update(surface="color.surface.neon")), "TOKEN_UNKNOWN"),
    ("raw hex in token slot", GH, setp(lambda s: nd(s, "hero.home")["tokens"].update(text="#ff5400")), "TOKEN_RAW_COLOR"),
    ("raw rgb in copy", GH, setp(lambda s: nd(s, "hero.home")["content"].update(headline="rgb(255,84,0) BRANDS")), "TOKEN_RAW_COLOR"),
    ("raw spacing", GH, setp(lambda s: nd(s, "faq.accordion")["tokens"].update(gap="24px")), "TOKEN_RAW_SPACING"),
    ("unsupported font", GH, setp(lambda s: nd(s, "hero.home")["tokens"].update(displayFont="font.family.comic-sans")), "TOKEN_FONT_UNSUPPORTED"),
    ("font slot given a colour", GH, setp(lambda s: nd(s, "hero.home")["tokens"].update(displayFont="color.brand.primary")), "TOKEN_FONT_UNSUPPORTED"),
    ("spacing token in colour slot", GH, setp(lambda s: nd(s, "hero.home")["tokens"].update(surface="space.gap.sm")), "TOKEN_SLOT"),
    ("invalid surface/text combination", GH, setp(lambda s: nd(s, "shell.footer")["tokens"].update(text="color.text.brand")), "TOKEN_THEME_COMBO"),
    ("unknown theme", GH, setp(lambda s: s.update(theme="dark")), "TOKEN_THEME_UNKNOWN"),
    # ---- structure / schema
    ("template/node mismatch", GH, setp(lambda s: s.update(template="about")), "TEMPLATE_SEQUENCE"),
    ("required section removed", GH, setp(lambda s: s["nodes"].pop(idx(s, "faq.accordion"))), "TEMPLATE_SEQUENCE"),
    ("duplicate hero", GH, setp(lambda s: s["nodes"].insert(idx(s, "hero.home") + 1, copy.deepcopy(nd(s, "hero.home")))), "ONE_HERO"),
    ("footer not last", GH, setp(lambda s: s["nodes"].insert(idx(s, "faq.accordion"), s["nodes"].pop(idx(s, "shell.footer")))), "FOOTER_LAST"),
    ("header after hero", GH, setp(lambda s: s["nodes"].insert(idx(s, "hero.home") + 1, s["nodes"].pop(idx(s, "shell.header")))), "HEADER_FIRST_SHELL"),
    ("hero not first content", GH, setp(lambda s: s["nodes"].insert(idx(s, "hero.home"), s["nodes"].pop(idx(s, "statement.pinned-manifesto")))), "HERO_FIRST_IN_FLOW"),
    ("adjacent same category", GP, setp(lambda s: s["nodes"].insert(idx(s, "project.meta-tags"), copy.deepcopy(nd(s, "project.meta-tags")))), "NO_ADJACENT_SAME_CATEGORY"),
    ("runtime without its host", GH, setp(lambda s: s["nodes"].pop(idx(s, "social-proof.testimonial-stack"))), "RUNTIME_ATTACH"),
    ("narrative after media", GP, setp(lambda s: s["nodes"].insert(idx(s, "project.media-single") + 1, s["nodes"].pop(idx(s, "project.narrative", 1)))), "TEMPLATE_SEQUENCE"),
    ("three narratives", GP, setp(lambda s: s["nodes"].insert(idx(s, "project.narrative", 1), copy.deepcopy(nd(s, "project.narrative")))), "TEMPLATE_SEQUENCE"),
    ("unknown section", GH, setp(lambda s: nd(s, "hero.home").update(section="hero.invented")), "SCHEMA"),
    ("variant not allowed by template", GH, setp(lambda s: nd(s, "work.featured-grid").update(variant="all")), "TEMPLATE_VARIANT"),
    ("variant not in contract", GA, setp(lambda s: nd(s, "story.split-illustrated").update(variant="image-center")), "SECTION_VARIANT"),
    ("maxWords overflow", GH, setp(lambda s: nd(s, "statement.pinned-manifesto")["content"].update(statement=" ".join(["word"] * 60))), "MAX_WORDS"),
    ("maxItems overflow", GH, setp(lambda s: nd(s, "faq.accordion")["content"].update(items=nd(s, "faq.accordion")["content"]["items"] * 5)), "MAX_ITEMS"),
    ("missing required content field", GH, setp(lambda s: nd(s, "hero.home")["content"].pop("headline")), "CONTENT_REQUIRED"),
    ("unknown content field", GH, setp(lambda s: nd(s, "hero.home")["content"].update(subtitle="extra")), "SCHEMA"),
    ("missing reducedMotionFallback", GH, setp(lambda s: nd(s, "hero.home")["motion"].pop("reducedMotionFallback")), "SCHEMA"),
    ("wrong reducedMotionFallback", GH, setp(lambda s: nd(s, "hero.home")["motion"].update(reducedMotionFallback="skip")), "MOTION_FALLBACK"),
    ("motion pattern not allowed", GH, setp(lambda s: nd(s, "hero.home")["motion"].update(pattern="velocity-marquee", trigger="continuous", reducedMotionFallback="paused-first-frame")), "MOTION_PATTERN"),
    ("wrong motion trigger", GH, setp(lambda s: nd(s, "hero.home")["motion"].update(trigger="hover")), "MOTION_TRIGGER"),
    ("invented motion field", GH, setp(lambda s: nd(s, "hero.home")["motion"].update(inventedAnimation="spin")), "SCHEMA"),
    ("invalid mode", GH, setp(lambda s: s.update(mode="draft")), "SCHEMA"),
    ("missing mode", GH, setp(lambda s: s.pop("mode")), "SCHEMA"),
    ("reference route mismatch", RH, setp(lambda s: s.update(route="/about")), "ROUTE_TEMPLATE"),
    ("unknown asset role", GH, setp(lambda s: nd(s, "hero.home")["assets"][0].update(assetRole="brand.invented")), "SCHEMA"),
    ("role not allowed in slot", GH, setp(lambda s: nd(s, "hero.home")["assets"][0].update(assetRole="generated.person-avatar")), "ASSET_ROLE_SLOT"),
    ("required asset slot missing", GH, setp(lambda s: nd(s, "hero.home").pop("assets")), "ASSET_REQUIRED_SLOT"),
    ("one-per-page section twice", GA, setp(lambda s: s["nodes"].insert(idx(s, "capabilities.pill-cloud"), copy.deepcopy(nd(s, "capabilities.pill-cloud")))), "SECTION_MAX_PER_PAGE"),
]


# ---- R9 wrapper gate cases: (name, mutate(measured, whitelist), expected code, level)
def _hero(m, h):
    m["sectionHeights"]["routes"]["/"]["sections"][1]["heightPx"] = h


def _set(m, route, sid, h):
    for s in m["sectionHeights"]["routes"][route]["sections"]:
        if s["section"] == sid:
            s["heightPx"] = h


GOOD_AGENT = "design-repo build agent (agent attestation, not a human sign-off)"
GATE_CASES = [
    ("HERO 1900px warns", lambda m, w: _hero(m, 1900), "GATE_HERO_TALL", "warn"),
    ("HERO 3100px fails", lambda m, w: _hero(m, 3100), "GATE_HERO_TOO_TALL", "error"),
    ("section holding 65% of the page fails", lambda m, w: _set(m, "/", "features.services-path", int(0.65 * m["sectionHeights"]["routes"]["/"]["pageHeight"])), "GATE_WHOLE_PAGE_SECTION", "error"),
    ("section holding 55% of the page warns", lambda m, w: _set(m, "/", "features.services-path", int(0.55 * m["sectionHeights"]["routes"]["/"]["pageHeight"])), "GATE_MAJORITY_SECTION", "warn"),
    ("undecomposed case-study body fails", lambda m, w: m["sectionHeights"]["routes"]["/work/heygluco"].update(sections=[
        {"section": "hero.project", "category": "HERO", "heightPx": 900, "inFlow": True},
        {"section": "project.narrative", "category": "CONTENT", "heightPx": 17691, "inFlow": True},
        {"section": "work.featured-grid", "category": "PORTFOLIO", "heightPx": 1058, "inFlow": True}]), "GATE_WHOLE_PAGE_SECTION", "error"),
    ("whitelist without justification fails", lambda m, w: (_hero(m, 3100), w.append({"route": "/", "section": "hero.home", "reviewedBy": GOOD_AGENT, "justification": "short", "maxHeightPx": 3200})), "GATE_WHITELIST_INVALID", "error"),
    ("agent reviewer not labelled fails", lambda m, w: (_hero(m, 3100), w.append({"route": "/", "section": "hero.home", "reviewedBy": "claude", "justification": "x" * 40, "maxHeightPx": 3200})), "GATE_WHITELIST_INVALID", "error"),
    ("stale whitelist entry fails", lambda m, w: w.append({"route": "/", "section": "faq.accordion", "reviewedBy": GOOD_AGENT, "justification": "x" * 40, "maxHeightPx": 3000}), "GATE_WHITELIST_STALE", "error"),
    ("whitelisted hero over its cap fails", lambda m, w: (_hero(m, 3300), w.append({"route": "/", "section": "hero.home", "reviewedBy": GOOD_AGENT, "justification": "x" * 40, "maxHeightPx": 3200})), "GATE_WHITELIST_OVER_CAP", "error"),
    ("missing route measurement fails", lambda m, w: m["sectionHeights"]["routes"].pop("/work"), "GATE_MISSING_MEASUREMENT", "error"),
    ("missing section height fails", lambda m, w: m["sectionHeights"]["routes"]["/"]["sections"][2].pop("heightPx"), "GATE_MISSING_MEASUREMENT", "error"),
    ("unmeasured contract fails", lambda m, w: m["sectionHeights"]["routes"]["/about"].update(sections=[s for s in m["sectionHeights"]["routes"]["/about"]["sections"] if s["section"] != "values.stacked-cards"]), "GATE_MISSING_MEASUREMENT", "error"),
    ("wrong viewport fails", lambda m, w: m["sectionHeights"]["viewport"].update(width=1280), "GATE_WRONG_VIEWPORT", "error"),
    ("zero-height in-flow section fails", lambda m, w: _set(m, "/", "faq.accordion", 0), "GATE_ZERO_HEIGHT", "error"),
]
GATE_CONTROLS = [
    ("real measurements", lambda m, w: None),
    ("properly whitelisted 3100px hero (still warns)", lambda m, w: (_hero(m, 3100), w.append({"route": "/", "section": "hero.home", "reviewedBy": GOOD_AGENT, "justification": "Synthetic control: a reviewed tall hero with a cap above it.", "maxHeightPx": 3200}))),
]


# ---- repo-level cases (scratch copy + verify_all): (name, file, mutate(json), expected substring)
def _flip_contract(d):
    d["retrievalEligible"] = True
    d.pop("retrievalReason", None)


REPO_CASES = [
    ("contract-level flip: modal eligible", "sections/runtime.contact-modal.json", _flip_contract, "RETRIEVAL"),
    ("allowlist-level flip: modal eligible", "tokens/llm/component-allowlist.json", lambda d: d["sections"]["runtime.contact-modal"].update(retrievalEligible=True), "ALLOWLIST"),
    ("content contract marked ineligible", "sections/faq.accordion.json", lambda d: d.update(retrievalEligible=False, retrievalReason="x" * 40), "RETRIEVAL"),
    ("registry loosens wordmark to generation-safe", "assets/asset-roles.json", lambda d: d["roles"]["brand.wordmark-source"].update(availability="generation-safe"), "pinned"),
]


def run():
    sv = _mod("semantic_validate", "schema/semantic_validate.py")
    gate = _mod("wrapper_gate", "extraction/wrapper_gate.py")
    R = sv.load_repo(REPO)
    fails = 0
    print("== controls (must pass)")
    for p in sorted(EX.glob("*.pagespec.json")):
        res = sv.validate(json.loads(p.read_text()), R)
        ok = not res.errors
        fails += not ok
        print(f"  {'ok ' if ok else 'BAD'} control {p.name} ({len(res.errors)} errors, {len(res.warnings)} warnings)")
        for e in res.errors[:5]:
            print("      ", e)
    print("== PageSpec mutations (must be rejected with the named rule)")
    for name, base, mut, rule in MUTATIONS:
        spec = mut(copy.deepcopy(ex(base)))
        res = sv.validate(spec, R)
        ok = rule in res.rules
        fails += not ok
        print(f"  {'ok ' if ok else 'BAD'} [{rule}] {name}" + ("" if ok else f"  -> got {sorted(res.rules)}"))
    print("== wrapper-gate cases")
    m0 = json.loads((REPO / "extraction/measured-values.json").read_text())
    w0 = json.loads((REPO / "extraction/wrapper-whitelist.json").read_text())["entries"]
    routes = list(R["routes"])
    for name, mut in GATE_CONTROLS:
        m, w = copy.deepcopy(m0), copy.deepcopy(w0)
        mut(m, w)
        errs, warns = gate.check(m, w, routes, R["sections"])
        ok = not errs
        fails += not ok
        print(f"  {'ok ' if ok else 'BAD'} control {name} ({len(errs)} errors, {len(warns)} warnings)" + ("" if ok else f" {errs[:3]}"))
    for name, mut, code, level in GATE_CASES:
        m, w = copy.deepcopy(m0), copy.deepcopy(w0)
        mut(m, w)
        errs, warns = gate.check(m, w, routes, R["sections"])
        got = {c for c, _, _ in (errs if level == "error" else warns)}
        ok = code in got and (level == "error" or not errs)
        fails += not ok
        print(f"  {'ok ' if ok else 'BAD'} [{level} {code}] {name}" + ("" if ok else f" -> errors {[c for c, _, _ in errs]} warns {[c for c, _, _ in warns]}"))
    print("== repo-level cases (scratch copy + verify_all must fail)")
    tmp = Path(tempfile.mkdtemp(prefix="dr-adv-"))
    try:
        for name, rel, mut, needle in REPO_CASES:
            d = tmp / "design-repo"
            if d.exists():
                shutil.rmtree(d)
            shutil.copytree(REPO, d, ignore=shutil.ignore_patterns("__pycache__"))
            f = d / rel
            data = json.loads(f.read_text())
            mut(data)
            f.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
            out = subprocess.run([sys.executable, str(d / "extraction/verify_all.py")], capture_output=True, text=True)
            ok = out.returncode == 1 and needle.lower() in out.stdout.lower()
            fails += not ok
            print(f"  {'ok ' if ok else 'BAD'} [{needle}] {name}" + ("" if ok else f" rc={out.returncode}\n{out.stdout[-800:]}"))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    total = len(MUTATIONS) + len(GATE_CASES) + len(REPO_CASES)
    controls = len(list(EX.glob("*.pagespec.json"))) + len(GATE_CONTROLS)
    print(f"\nadversarial: {total} mutations, {controls} controls, {fails} unexpected results")
    return 1 if fails else 0


if __name__ == "__main__":
    try:
        import jsonschema  # noqa: F401
    except ImportError:
        print("ERROR: requires the `jsonschema` package (pip install jsonschema).")
        sys.exit(2)
    sys.exit(run())
