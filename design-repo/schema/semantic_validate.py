#!/usr/bin/env python3
"""Semantic validator for two26 design-repo PageSpecs.

    python3 schema/semantic_validate.py schema/examples/*.json

Layer 1: Draft-07 JSON Schema (schema/pagespec.schema.json) - needs the `jsonschema` package.
Layer 2: everything the schema cannot express: template cross-reference, route mapping,
retrieval pins, content word/item budgets, asset roles + pinned availability, motion
pattern/trigger/fallback, token policy, rhythm rules (compatibility/graph.json) and the
generated-mode leakage rules (GENERATED_MODE_*).
Exit 0 = no errors (warnings allowed), 1 = errors, 2 = missing dependency.
"""
import json, re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# ---- pinned in code (R3, R8): editing the registry / contracts alone cannot loosen these.
PINNED_AVAILABILITY = {
    "brand.wordmark-source": "blocked-for-generation",
    "brand.illustration-source": "blocked-for-generation",
    "media.hero-reel-source": "reference-only",
    "media.showcase-shot-source": "reference-only",
    "client.logo-source": "blocked-for-generation",
    "client.project-imagery-source": "reference-only",
    "client.project-video-source": "reference-only",
    "person.team-photo-source": "blocked-for-generation",
    "person.testimonial-avatar-source": "blocked-for-generation",
    "media.moodboard-photo-source": "reference-only",
    "icon.service-animation-source": "reference-only",
    "decor.stroke-path-source": "reference-only",
    "decor.texture-source": "reference-only",
    "generated.brand-mark": "generation-safe",
    "generated.illustration": "generation-safe",
    "generated.motion-loop": "generation-safe",
    "generated.product-visual": "generation-safe",
    "generated.client-mark": "generation-safe",
    "generated.video-embed": "generation-safe",
    "generated.person-portrait": "generation-safe",
    "generated.person-avatar": "generation-safe",
    "generated.lifestyle-photo": "generation-safe",
    "generated.icon-animation": "generation-safe",
    "generated.stroke-path": "generation-safe",
    "generated.texture": "generation-safe",
    "placeholder.url": "generation-safe",
    "placeholder.rating": "generation-safe",
    "original.copy": "generation-safe",
}
RETRIEVAL_INELIGIBLE = {"runtime.preloader", "runtime.contact-modal", "runtime.mobile-menu", "runtime.cursor-follower", "runtime.team-popup"}
# rule ids that implement compatibility/graph.json (verify_all.py checks both directions)
RHYTHM_RULES = {"ONE_HERO", "HERO_FIRST_IN_FLOW", "HEADER_FIRST_SHELL", "FOOTER_LAST", "NO_ADJACENT_SAME_CATEGORY",
                "RUNTIME_ATTACH", "MAX_ONE_PIN_STAGE", "MOTION_SCRUB_BUDGET", "CTA_BEFORE_FOOTER_ONLY_ONCE"}
PLACEHOLDER_TLDS = (".example", ".invalid")
RAW_COLOR = re.compile(r"#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(")
RAW_LENGTH = re.compile(r"^-?\d+(\.\d+)?(px|rem|em|%|vh|vw)$")
URL_RE = re.compile(r"(?i)\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?=[/:?#\s]|$)")
EMAIL_RE = re.compile(r"[^@\s/]+@([^@\s/?]+)")


def load_repo(repo=REPO):
    r = Path(repo)
    j = lambda rel: json.loads((r / rel).read_text())
    return {
        "schema": j("schema/pagespec.schema.json"),
        "templates": j("templates/templates.json")["templates"],
        "routes": {x["route"]: x["template"] for x in j("templates/routes.json")["routes"]},
        "sections": {p.stem: json.loads(p.read_text()) for p in sorted((r / "sections").glob("*.json"))},
        "roles": j("assets/asset-roles.json")["roles"],
        "identity": j("assets/source-identity.json"),
        "catalog": j("tokens/llm/token-catalog.json")["tokens"],
        "policy": j("tokens/llm/token-policy.json"),
        "graph": j("compatibility/graph.json"),
        "patterns": j("tokens/00-foundation/motion-patterns.json")["patterns"],
    }


def norm(s):
    s = s.replace("’", "'").replace("‘", "'").replace("&", " and ")
    return " ".join(re.sub(r"[^a-z0-9' ]+", " ", s.lower()).split())


def shingles(s, n=5):
    w = norm(s).split()
    return {" ".join(w[i:i + n]) for i in range(len(w) - n + 1)}


def walk_strings(obj, path="$"):
    if isinstance(obj, str):
        yield path, obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            yield from walk_strings(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk_strings(v, f"{path}[{i}]")


class Result:
    def __init__(self):
        self.errors, self.warnings = [], []

    def err(self, rule, path, msg):
        self.errors.append((rule, path, msg))

    def warn(self, rule, path, msg):
        self.warnings.append((rule, path, msg))

    @property
    def rules(self):
        return {e[0] for e in self.errors}


def schema_layer(spec, R, res):
    try:
        import jsonschema
    except ImportError:
        print("ERROR: the `jsonschema` package is required (pip install jsonschema).", file=sys.stderr)
        sys.exit(2)
    v = jsonschema.Draft7Validator(R["schema"])
    for e in sorted(v.iter_errors(spec), key=lambda e: list(e.path)):
        res.err("SCHEMA", "$" + "".join(f"[{p}]" if isinstance(p, int) else f".{p}" for p in e.path), e.message[:200])


def count_words(s):
    return len(s.split())


def check_content(fields, content, path, res):
    if not isinstance(content, dict):
        return
    for k, f in fields.items():
        if k not in content:
            if f.get("required", True):
                res.err("CONTENT_REQUIRED", path, f"missing required field '{k}'")
            continue
        v, p = content[k], f"{path}.{k}"
        t = f["type"]
        if t == "text" and isinstance(v, str) and count_words(v) > f["maxWords"]:
            res.err("MAX_WORDS", p, f"{count_words(v)} words > maxWords {f['maxWords']}")
        if t == "text-list" and isinstance(v, list):
            if len(v) > f["maxItems"]:
                res.err("MAX_ITEMS", p, f"{len(v)} items > {f['maxItems']}")
            for i, s in enumerate(v):
                if isinstance(s, str) and count_words(s) > f["maxWords"]:
                    res.err("MAX_WORDS", f"{p}[{i}]", f"{count_words(s)} words > maxWords {f['maxWords']}")
        if t == "items" and isinstance(v, list):
            if len(v) > f["maxItems"]:
                res.err("MAX_ITEMS", p, f"{len(v)} items > {f['maxItems']}")
            if len(v) < f.get("minItems", 0):
                res.err("MIN_ITEMS", p, f"{len(v)} items < {f['minItems']}")
            for i, it in enumerate(v):
                check_content(f["fields"], it, f"{p}[{i}]", res)
    for k in content:
        if k not in fields:
            res.err("CONTENT_UNKNOWN_FIELD", f"{path}.{k}", "field not in section contract")


def match_template(spec, R, res):
    t = R["templates"].get(spec.get("template"))
    if not t:
        res.err("TEMPLATE_UNKNOWN", "$.template", f"unknown template {spec.get('template')!r}")
        return
    nodes = spec.get("nodes", [])
    i = 0
    for tn in t["nodes"]:
        allowed = tn.get("anyOf") or [tn["section"]]
        mx = tn.get("max", 10 ** 6) if tn.get("repeatable") else 1
        n = 0
        while i < len(nodes) and isinstance(nodes[i], dict) and nodes[i].get("section") in allowed and n < mx:
            if tn.get("variants") and nodes[i].get("variant") not in tn["variants"]:
                res.err("TEMPLATE_VARIANT", f"$.nodes[{i}].variant", f"template '{spec['template']}' requires variant in {tn['variants']}")
            i += 1
            n += 1
        need = tn.get("min", 1) if tn.get("required") else 0
        if n < need:
            res.err("TEMPLATE_SEQUENCE", f"$.nodes[{i}]", f"template '{spec['template']}' expects {allowed} (min {need}) here, found {n}")
    if i < len(nodes):
        res.err("TEMPLATE_SEQUENCE", f"$.nodes[{i}]", f"node {nodes[i].get('section') if isinstance(nodes[i], dict) else nodes[i]!r} is not allowed at this position by template '{spec['template']}'")


def check_tokens(node, p, R, res, pairs):
    toks = node.get("tokens") or {}
    pol = R["policy"]["slots"]
    for slot, val in toks.items():
        if slot not in pol or not isinstance(val, str):
            continue
        sp = f"{p}.tokens.{slot}"
        if RAW_COLOR.search(val):
            res.err("TOKEN_RAW_COLOR", sp, f"raw colour {val!r}; use a color.* token")
            continue
        if RAW_LENGTH.match(val.strip()):
            res.err("TOKEN_RAW_SPACING", sp, f"raw length {val!r}; use a space.* token")
            continue
        cat = R["catalog"].get(val)
        if slot in ("displayFont", "bodyFont"):
            if not cat or cat["category"] != "fontFamily" or not val.startswith(pol[slot]["prefix"]):
                res.err("TOKEN_FONT_UNSUPPORTED", sp, f"{val!r} is not an approved font.family token for {slot}")
            continue
        if not cat:
            res.err("TOKEN_UNKNOWN", sp, f"{val!r} not in tokens/llm/token-catalog.json")
            continue
        if cat["category"] != pol[slot]["category"] or not val.startswith(pol[slot]["prefix"]):
            res.err("TOKEN_SLOT", sp, f"{val!r} ({cat['category']}) not allowed in slot {slot}")
    if "surface" in toks and "text" in toks and (toks["surface"], toks["text"]) not in pairs:
        if toks["surface"] in R["catalog"] and toks["text"] in R["catalog"]:
            res.err("TOKEN_THEME_COMBO", f"{p}.tokens", f"surface/text pair {toks['surface']} + {toks['text']} is not an approved light-theme pair")


def check_generated(spec, R, res):
    idt = R["identity"]
    brand = [re.compile(x, re.I) for x in idt["sourceBrand"]["patterns"]]
    clients = {k: re.compile(v, re.I) for k, v in idt["clients"].items()}
    people = [(n, re.compile(r"\b" + re.escape(n) + r"\b", re.I)) for n in idt["people"]]
    ctas = [norm(c) for c in idt["ctaStrings"]]
    corpus = idt["copyCorpus"]
    corpus_norm = {norm(c) for c in corpus}
    corpus_sh = set()
    for c in corpus:
        corpus_sh |= shingles(c)
    handles = [h.lower() for h in idt["socialHandles"]]
    blocked_hosts = idt["blockedHostsInGenerated"]
    id_rx = re.compile(idt["sourceAssetIdPattern"])
    for path, s in walk_strings({k: spec.get(k) for k in ("site", "meta", "nodes")}):
        if path.endswith(".section") or path.endswith(".variant") or path.endswith(".assetRole") or path.endswith(".slot") \
                or ".motion." in path or ".tokens." in path:
            continue
        low = s.lower()
        for rx in brand:
            if rx.search(s):
                res.err("GENERATED_MODE_BRAND", path, f"source brand name/variant in {s[:60]!r}")
                break
        for name, rx in clients.items():
            if rx.search(s):
                res.err("GENERATED_MODE_CLIENT", path, f"real client '{name}' in {s[:60]!r}")
        for name, rx in people:
            if rx.search(s):
                res.err("GENERATED_MODE_PERSON", path, f"real person '{name}' in {s[:60]!r}")
        ns = norm(s)
        for c in ctas:
            if c and (ns == c or re.search(r"(^| )" + re.escape(c) + r"( |$)", ns)):
                res.err("GENERATED_MODE_CTA", path, f"source CTA string {c!r}")
        if ns in corpus_norm or (shingles(s) & corpus_sh):
            res.err("GENERATED_MODE_COPY", path, f"source copy reused in {s[:60]!r}")
        for m in EMAIL_RE.finditer(s):
            host = m.group(1).lower().rstrip(".")
            if not host.endswith(PLACEHOLDER_TLDS):
                res.err("GENERATED_MODE_EMAIL", path, f"email on non-placeholder domain {host!r}")
        for m in URL_RE.finditer(s):
            host = m.group(1).lower()
            if "@" in s[max(0, m.start() - 1):m.start()]:
                continue
            if not host.endswith(PLACEHOLDER_TLDS):
                res.err("GENERATED_MODE_URL", path, f"URL/host {host!r} is not on a reserved .example/.invalid domain")
        if any(h in low for h in blocked_hosts) or any(re.search(r"(^|[/@ ])" + re.escape(h) + r"(/|$| )", low) for h in handles):
            res.err("GENERATED_MODE_URL", path, f"source host or social handle in {s[:60]!r}")
        if path.endswith(".src") and (id_rx.search(s) or any(s.startswith(pre) for pre in idt["sourceAssetPathPrefixes"])):
            res.err("GENERATED_MODE_ASSET", path, f"source asset file referenced: {s[:80]!r}")
    # real review / rating leakage: testimonial attributions and quotes
    for i, n in enumerate(spec.get("nodes", [])):
        if not isinstance(n, dict) or n.get("section") != "social-proof.testimonial-stack":
            continue
        for k, t in enumerate((n.get("content") or {}).get("testimonials", []) or []):
            if not isinstance(t, dict):
                continue
            blob = " ".join(str(t.get(x, "")) for x in ("headline", "quote", "name", "role"))
            if any(rx.search(blob) for _, rx in people) or any(rx.search(blob) for rx in clients.values()) \
                    or (shingles(blob) & corpus_sh):
                res.err("GENERATED_MODE_RATING", f"$.nodes[{i}].content.testimonials[{k}]", "real review/testimonial (author, attribution or quote) reused")
    from urllib.parse import urlparse
    host = (urlparse(str(spec.get("site", {}).get("baseUrl", ""))).hostname or "").lower()
    if not host.endswith(PLACEHOLDER_TLDS):
        res.err("GENERATED_MODE_URL", "$.site.baseUrl", "generated pages must use a reserved .example/.invalid base URL")


def validate(spec, R=None, schema=True):
    R = R or load_repo()
    res = Result()
    if schema:
        schema_layer(spec, R, res)
    if not isinstance(spec, dict):
        return res
    mode = spec.get("mode")
    tpl = spec.get("template")
    # route mapping
    if mode == "reference":
        if R["routes"].get(spec.get("route")) != tpl:
            res.err("ROUTE_TEMPLATE", "$.route", f"reference route {spec.get('route')!r} maps to {R['routes'].get(spec.get('route'))!r}, not {tpl!r}")
    if spec.get("theme") not in R["policy"]["themes"]:
        res.err("TOKEN_THEME_UNKNOWN", "$.theme", f"theme {spec.get('theme')!r} not in policy themes")
    match_template(spec, R, res)
    nodes = [n for n in spec.get("nodes", []) if isinstance(n, dict)]
    pairs = {tuple(p) for p in R["policy"]["allowedSurfaceTextPairs"]}
    counts = {}
    for i, n in enumerate(spec.get("nodes", [])):
        p = f"$.nodes[{i}]"
        if not isinstance(n, dict):
            continue
        sid = n.get("section")
        c = R["sections"].get(sid)
        if not c:
            res.err("SECTION_UNKNOWN", p, f"unknown section {sid!r}")
            continue
        counts[sid] = counts.get(sid, 0) + 1
        if n.get("variant") not in c["variants"]:
            res.err("SECTION_VARIANT", f"{p}.variant", f"{n.get('variant')!r} not in {c['variants']}")
        # retrieval pin (R8)
        pinned = sid not in RETRIEVAL_INELIGIBLE
        if n.get("retrievalEligible") is not pinned or c.get("retrievalEligible") is not pinned:
            res.err("RETRIEVAL_PIN", f"{p}.retrievalEligible", f"{sid} is pinned retrievalEligible={pinned} (node={n.get('retrievalEligible')}, contract={c.get('retrievalEligible')})")
        check_content(c["content"]["fields"], n.get("content", {}), f"{p}.content", res)
        # assets (R3)
        slots = c["assetSlots"]
        seen = {}
        for k, a in enumerate(n.get("assets", []) or []):
            if not isinstance(a, dict):
                continue
            ap = f"{p}.assets[{k}]"
            role, slot = a.get("assetRole"), a.get("slot")
            if role not in R["roles"]:
                res.err("ASSET_ROLE_UNKNOWN", ap, f"unknown assetRole {role!r}")
                continue
            if R["roles"][role]["availability"] != PINNED_AVAILABILITY.get(role):
                res.err("ASSET_ROLE_PIN", ap, f"registry availability for {role} differs from the code pin")
            if slot not in slots:
                res.err("ASSET_SLOT_UNKNOWN", ap, f"slot {slot!r} not in {sorted(slots)}")
                continue
            if role not in slots[slot]["roles"]:
                res.err("ASSET_ROLE_SLOT", ap, f"role {role} not allowed in slot {slot}")
            seen[slot] = seen.get(slot, 0) + 1
            if mode == "generated" and PINNED_AVAILABILITY.get(role) != "generation-safe":
                res.err("GENERATED_MODE_ASSET", ap, f"{role} is {PINNED_AVAILABILITY.get(role)}; use one of {R['roles'][role].get('generationSafeSubstitutes')}")
        for s, d in slots.items():
            if d["required"] and not seen.get(s):
                res.err("ASSET_REQUIRED_SLOT", f"{p}.assets", f"required asset slot {s!r} missing")
            if not d["multiple"] and seen.get(s, 0) > 1:
                res.err("ASSET_SLOT_MULTIPLE", f"{p}.assets", f"slot {s!r} takes one asset")
            if d.get("maxItems") and seen.get(s, 0) > d["maxItems"]:
                res.err("ASSET_SLOT_MULTIPLE", f"{p}.assets", f"slot {s!r} takes at most {d['maxItems']}")
        # motion
        m = n.get("motion") or {}
        pat = m.get("pattern")
        if pat not in c["motion"]["allowedPatterns"]:
            res.err("MOTION_PATTERN", f"{p}.motion.pattern", f"{pat!r} not allowed for {sid} ({c['motion']['allowedPatterns']})")
        elif pat in R["patterns"]:
            if m.get("trigger") != R["patterns"][pat]["trigger"]:
                res.err("MOTION_TRIGGER", f"{p}.motion.trigger", f"{pat} is triggered by {R['patterns'][pat]['trigger']!r}")
            if m.get("reducedMotionFallback") != R["patterns"][pat]["reducedMotionFallback"]:
                res.err("MOTION_FALLBACK", f"{p}.motion.reducedMotionFallback", f"{pat} requires {R['patterns'][pat]['reducedMotionFallback']!r}")
        check_tokens(n, p, R, res, pairs)
    # raw colours anywhere (token policy)
    for path, s in walk_strings(spec):
        if ".tokens." in path:
            continue
        if RAW_COLOR.search(s):
            res.err("TOKEN_RAW_COLOR", path, f"raw colour value in {s[:40]!r}")
    # per-page constraints
    for sid, k in counts.items():
        c = R["sections"][sid]["constraints"]
        mx = 1 if c.get("onePerPage") else c.get("maxPerPage")
        if mx and k > mx:
            res.err("SECTION_MAX_PER_PAGE", "$.nodes", f"{sid} appears {k} times (max {mx})")
    rhythm(nodes, R, res)
    if mode == "generated":
        check_generated(spec, R, res)
    return res


def rhythm(nodes, R, res):
    sec = R["sections"]
    sev = {r["id"]: r["severity"] for r in R["graph"]["rules"]}

    def emit(rule, path, msg):
        (res.err if sev.get(rule, "error") == "error" else res.warn)(rule, path, msg)
    known = [(i, n["section"], sec[n["section"]]) for i, n in enumerate(nodes) if n.get("section") in sec]
    flow = [(i, s, c) for i, s, c in known if c["category"] not in R["graph"]["nonFlowCategories"]]
    heroes = [i for i, s, c in flow if c["category"] == "HERO"]
    if len(heroes) != 1:
        emit("ONE_HERO", "$.nodes", f"{len(heroes)} HERO nodes (exactly 1 required)")
    content = [(i, s, c) for i, s, c in flow if c["category"] != "SHELL"]
    if content and content[0][2]["category"] != "HERO":
        emit("HERO_FIRST_IN_FLOW", f"$.nodes[{content[0][0]}]", f"first content node is {content[0][1]}, not a HERO")
    shells = [(i, s) for i, s, c in flow if c["category"] == "SHELL"]
    if not shells or shells[0][1] != "shell.header" or (content and shells[0][0] > content[0][0]):
        emit("HEADER_FIRST_SHELL", "$.nodes", "shell.header must be the first shell node, before any content")
    if not nodes or nodes[-1].get("section") != "shell.footer":
        emit("FOOTER_LAST", "$.nodes", "shell.footer must be the last node")
    exc = R["graph"]["rules"][[r["id"] for r in R["graph"]["rules"]].index("NO_ADJACENT_SAME_CATEGORY")]["exceptions"]
    for (i1, s1, c1), (i2, s2, c2) in zip(flow, flow[1:]):
        if c1["category"] == c2["category"] and c1["category"] != "SHELL":
            ok = any(s1 in e["pair"] and s2 in e["pair"] and (s1 != s2 or e["pair"].count(s1) >= 1) for e in exc)
            if not ok:
                emit("NO_ADJACENT_SAME_CATEGORY", f"$.nodes[{i2}]", f"{s1} and {s2} are adjacent and both {c1['category']}")
    present = {s for _, s, _ in known}
    for i, s, c in known:
        host = c["constraints"].get("attachTo")
        if host and host not in present:
            emit("RUNTIME_ATTACH", f"$.nodes[{i}]", f"{s} needs {host} on the page")
    pats = [(i, n.get("motion", {}).get("pattern")) for i, n in enumerate(nodes)]
    if sum(1 for _, p in pats if p == "pinned-char-wave") > 1:
        emit("MAX_ONE_PIN_STAGE", "$.nodes", "more than one pinned scroll stage")
    scrub = {p for i, p in pats if p in R["patterns"] and R["patterns"][p]["trigger"] in ("scroll-scrub", "pin-scrub")}
    if len(scrub) > 3:
        emit("MOTION_SCRUB_BUDGET", "$.nodes", f"{len(scrub)} distinct scroll-scrubbed patterns (> 3): {sorted(scrub)}")
    if sum(1 for _, s, c in flow if c["category"] == "CTA") > 1:
        emit("CTA_BEFORE_FOOTER_ONLY_ONCE", "$.nodes", "more than one CTA band")


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    R = load_repo()
    bad = 0
    for f in argv:
        spec = json.loads(Path(f).read_text())
        res = validate(spec, R)
        for r, p, m in res.errors:
            print(f"ERROR {f} {r} {p}: {m}")
        for r, p, m in res.warnings:
            print(f"warn  {f} {r} {p}: {m}")
        print(f"{Path(f).name}: {len(res.errors)} errors, {len(res.warnings)} warnings")
        bad += bool(res.errors)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
