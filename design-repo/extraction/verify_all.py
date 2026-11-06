#!/usr/bin/env python3
"""verify_all: every structural, parity, pin, citation and gate check for this design-repo.

    python3 extraction/verify_all.py

Requires Python 3.8+ and the `jsonschema` package (Draft-07). Citation checks resolve paths
against the source project (the folder containing design-repo/, or $DESIGN_REPO_SOURCE_ROOT);
when no source tree is present they are skipped with a warning, so the repo verifies standalone.
extraction/prove_drift.py proves each check fails on injected drift.
Exit 0 = all checks pass.
"""
import importlib.util, json, os, re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# ---- pinned in code, independent of the registry (R3 / R8). Must equal schema/semantic_validate.py.
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
RUNTIME_NAME_RX = re.compile(r"(modal|loader|preloader|menu|cursor|popup|overlay|dialog|drawer|toast|cookie|consent|banner|ticker)", re.I)
_S = "/"
ABS_PATH_RX = re.compile(_S + "Users" + _S + r"[A-Za-z0-9._-]+/|(^|[^A-Za-z0-9_.-])" + _S + "home" + _S + r"[A-Za-z0-9._-]+/|" + _S + r"private/(tmp|var)/|C:\\\\" + "Users")
CITE_ALIAS = {"pages:": "src/pages/"}


def resolve(rel):
    for k, v in CITE_ALIAS.items():
        if rel.startswith(k):
            return v + rel[len(k):]
    return rel
JUNK = {".DS_Store", "Thumbs.db", "desktop.ini"}


def mod(name, rel):
    spec = importlib.util.spec_from_file_location(name, REPO / rel)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def j(rel):
    return json.loads((REPO / rel).read_text())


class V:
    def __init__(self):
        self.fails, self.warns, self.n = [], [], 0

    def check(self, name, problems):
        self.n += 1
        for p in problems:
            self.fails.append(f"{name}: {p}")
        print(("PASS " if not problems else "FAIL ") + name + ("" if not problems else f" ({len(problems)})"))
        for p in problems[:12]:
            print("     -", p)

    def warn(self, msg):
        self.warns.append(msg)


def source_root():
    env = os.environ.get("DESIGN_REPO_SOURCE_ROOT")
    if env:
        return Path(env)
    cand = REPO.parent
    return cand if (cand / "src/pages/routes.json").exists() else None


def all_json():
    for p in sorted(REPO.rglob("*.json")):
        yield p, json.loads(p.read_text())


def walk(obj):
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from walk(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v)


def main():
    try:
        import jsonschema
    except ImportError:
        print("ERROR: verify_all.py requires the `jsonschema` package (pip install jsonschema).")
        return 2
    v = V()
    sv = mod("semantic_validate", "schema/semantic_validate.py")
    bs = mod("build_schema", "extraction/build_schema.py")
    gate = mod("wrapper_gate", "extraction/wrapper_gate.py")
    counts = mod("counts", "extraction/counts.py")
    R = sv.load_repo(REPO)
    sections = R["sections"]
    manifest = j("registry.manifest.json")
    allow = j("tokens/llm/component-allowlist.json")
    roles = R["roles"]

    # 1 schemas
    p = []
    for rel in ("schema/pagespec.schema.json", "schema/section-contract.schema.json"):
        try:
            jsonschema.Draft7Validator.check_schema(j(rel))
        except Exception as e:
            p.append(f"{rel}: {e}")
    v.check("schema files are valid Draft-07", p)
    v.check("pagespec schema is fresh vs contracts (build_schema.py)", [] if bs.dumps(bs.build(REPO)) == (REPO / "schema/pagespec.schema.json").read_text() else ["schema/pagespec.schema.json drifted from sections/*.json; run extraction/build_schema.py"])

    # 2 contracts
    cs = jsonschema.Draft7Validator(j("schema/section-contract.schema.json"))
    p = []
    for sid, c in sections.items():
        p += [f"{sid}: {e.message[:120]}" for e in cs.iter_errors(c)]
        if c.get("id") != sid:
            p.append(f"{sid}: file name != id")
        if c.get("semantic", {}).get("id") != sid:
            p.append(f"{sid}: semantic.id must equal contract id")
        if c.get("source", {}).get("id") == sid:
            p.append(f"{sid}: source.id must not equal semantic id (R7)")
        if c.get("semantic", {}).get("category") != c.get("category"):
            p.append(f"{sid}: semantic.category != category")
    v.check("section contracts: closed schema + source/semantic split (R7)", p)

    # 3 examples
    p, fams = [], {}
    for ex in sorted((REPO / "schema/examples").glob("*.pagespec.json")):
        spec = json.loads(ex.read_text())
        res = sv.validate(spec, R)
        p += [f"{ex.name}: {r} {pa} {m}" for r, pa, m in res.errors]
        fams.setdefault(spec.get("mode"), set()).add(spec.get("template"))
    missing = set(R["templates"]) - fams.get("generated", set())
    if missing:
        p.append(f"no generated example for template families {sorted(missing)} (R4)")
    if not fams.get("reference"):
        p.append("no reference example")
    v.check("examples: Draft-07 + semantic, 0 errors; generated example per template family", p)

    # 4 allowlist parity
    p = []
    files = {k: {f.stem for f in (REPO / k).glob("*.json")} for k in ("primitives", "components", "sections")}
    for k in ("primitives", "components"):
        al = set(allow[k])
        p += [f"{k}: phantom allowlist entry {x}" for x in sorted(al - files[k])]
        p += [f"{k}: contract without allowlist entry {x}" for x in sorted(files[k] - al)]
    al = set(allow["sections"])
    p += [f"sections: phantom allowlist entry {x}" for x in sorted(al - files["sections"])]
    p += [f"sections: contract without allowlist entry {x}" for x in sorted(files["sections"] - al)]
    for sid in sorted(al & files["sections"]):
        a, c = allow["sections"][sid], sections[sid]
        if a["variants"] != c["variants"]:
            p.append(f"ALLOWLIST {sid}: variants differ from contract")
        if a["retrievalEligible"] is not c["retrievalEligible"]:
            p.append(f"ALLOWLIST {sid}: retrievalEligible differs from contract")
        if a["assetRoles"] != sorted({r for s in c["assetSlots"].values() for r in s["roles"]}):
            p.append(f"ALLOWLIST {sid}: assetRoles differ from contract slots")
        if a["motionPatterns"] != c["motion"]["allowedPatterns"]:
            p.append(f"ALLOWLIST {sid}: motionPatterns differ from contract")
    node_props = sorted(R["schema"]["definitions"]["node"]["properties"])
    if sorted(allow["nodeSettableProps"]) != node_props:
        p.append(f"nodeSettableProps {sorted(allow['nodeSettableProps'])} != schema node properties {node_props}")
    v.check("allowlist parity (files <-> allowlist <-> schema)", p)

    # 5 versions + counts
    p = []
    if manifest.get("allowlistVersion") != allow.get("version"):
        p.append(f"manifest allowlistVersion {manifest.get('allowlistVersion')} != allowlist version {allow.get('version')}")
    if manifest.get("pageSpecVersion") != bs.PAGESPEC_VERSION:
        p.append(f"manifest pageSpecVersion {manifest.get('pageSpecVersion')} != schema const {bs.PAGESPEC_VERSION}")
    if manifest.get("status") != "design-review-pending" or manifest.get("productionApproved") is not False:
        p.append("status must be design-review-pending and productionApproved false")
    c = counts.compute(REPO)
    if manifest.get("counts") != c:
        diff = {k: (manifest.get("counts", {}).get(k), c[k]) for k in c if manifest.get("counts", {}).get(k) != c[k]}
        p.append(f"manifest counts drift (manifest, actual): {diff}")
    readme = (REPO / "README.md").read_text()
    m = re.search(r"<!-- counts:start -->.*?<!-- counts:end -->", readme, re.S)
    if not m or m.group(0) != counts.table(c):
        p.append("README counts table differs from extraction/counts.py output")
    v.check("versions, status and recomputed counts (manifest + README)", p)

    # 5b design-policy binding (R15)
    p = []
    ph = mod("policy_hash", "extraction/policy_hash.py")
    dp = manifest.get("designPolicy") or {}
    pol_file = j("policy/design-policy.json") if (REPO / "policy/design-policy.json").exists() else {}
    if dp.get("contentHash") != ph.compute(REPO):
        p.append(f"designPolicy.contentHash {dp.get('contentHash')} != recomputed {ph.compute(REPO)} (policy files changed)")
    for k in ("policyId", "policyVersion", "commonIrVersion"):
        if dp.get(k) != pol_file.get(k):
            p.append(f"designPolicy.{k} differs between manifest and policy/design-policy.json")
    if manifest.get("category") != pol_file.get("classification", {}).get("category"):
        p.append("manifest category differs from policy classification")
    appr = pol_file.get("approval", {})
    if appr.get("architectureDecisionRecorded") is not False and not str(appr.get("decidedBy", "")).lower().startswith("human:"):
        p.append("policy approval recorded without a human decidedBy")
    v.check("design-policy binding + content hash (R15)", p)

    # 6 entry points
    p = []
    ep = manifest.get("entryPoints", {})
    for k, rel in ep.items():
        if rel.startswith("..") or rel.startswith("/"):
            p.append(f"{k}: {rel} points outside the package")
        elif not (REPO / rel).exists():
            p.append(f"{k}: {rel} does not exist")
    for need in ("tokens/llm/token-catalog.json", "tokens/llm/token-policy.json", "tokens/llm/component-allowlist.json", "tokens/00-foundation/motion-patterns.json"):
        if need not in ep.values():
            p.append(f"{need} not registered in entryPoints")
    v.check("entryPoints exist and stay inside design-repo", p)

    # 7 asset availability pins
    p = []
    if set(PINNED_AVAILABILITY) != set(roles):
        p.append(f"PINNED_AVAILABILITY roles != registry roles: missing pin {sorted(set(roles) - set(PINNED_AVAILABILITY))}, extra pin {sorted(set(PINNED_AVAILABILITY) - set(roles))}")
    if PINNED_AVAILABILITY != sv.PINNED_AVAILABILITY:
        p.append("PINNED_AVAILABILITY differs between verify_all.py and semantic_validate.py")
    for r, d in roles.items():
        if r in PINNED_AVAILABILITY and d.get("availability") != PINNED_AVAILABILITY[r]:
            p.append(f"{r}: registry availability {d.get('availability')!r} != pinned {PINNED_AVAILABILITY[r]!r}")
        if d.get("availability") != "generation-safe":
            subs = d.get("generationSafeSubstitutes") or []
            if not subs:
                p.append(f"{r}: no generationSafeSubstitutes")
            p += [f"{r}: substitute {s} is not generation-safe" for s in subs if PINNED_AVAILABILITY.get(s) != "generation-safe"]
            if d.get("generationPolicy") == "may-generate-new":
                p.append(f"{r}: non-generation-safe role cannot be may-generate-new")
    for sid, c in sections.items():
        want = sorted({r for s in c["assetSlots"].values() for r in s["roles"] if PINNED_AVAILABILITY.get(r) == "generation-safe"})
        if c["generatedAssetRoles"] != want:
            p.append(f"{sid}: generatedAssetRoles {c['generatedAssetRoles']} != generation-safe slot roles {want}")
        for s, d in c["assetSlots"].items():
            unk = [r for r in d["roles"] if r not in roles]
            if unk:
                p.append(f"{sid}.{s}: unknown roles {unk}")
            if d["roles"] and not any(PINNED_AVAILABILITY.get(r) == "generation-safe" for r in d["roles"]):
                p.append(f"{sid}.{s}: slot has no generation-safe role")
    v.check("asset availability pinned in code (PINNED_AVAILABILITY) + substitutes (R3)", p)

    # 8 retrieval pins
    p = []
    false_set = {s for s, c in sections.items() if c["retrievalEligible"] is False}
    if false_set != RETRIEVAL_INELIGIBLE:
        p.append(f"RETRIEVAL: contracts with retrievalEligible=false {sorted(false_set)} != pin {sorted(RETRIEVAL_INELIGIBLE)}")
    if RETRIEVAL_INELIGIBLE != sv.RETRIEVAL_INELIGIBLE:
        p.append("RETRIEVAL_INELIGIBLE differs between verify_all.py and semantic_validate.py")
    for sid, c in sections.items():
        if RUNTIME_NAME_RX.search(sid + " " + c["title"]) and sid not in RETRIEVAL_INELIGIBLE:
            p.append(f"RETRIEVAL: {sid} looks like runtime UI but is not pinned ineligible")
        if c["retrievalEligible"] is False and len(c.get("retrievalReason", "")) < 30:
            p.append(f"RETRIEVAL: {sid} needs a retrievalReason >= 30 chars")
    al_false = {s for s, a in allow["sections"].items() if a.get("retrievalEligible") is False}
    if al_false != RETRIEVAL_INELIGIBLE:
        p.append(f"ALLOWLIST retrieval set {sorted(al_false)} != pin")
    v.check("retrievalEligible pinned in code (R8)", p)

    # 9 tokens
    p = []
    found = {}
    for f in ["color", "typography", "radius", "spacing", "breakpoint", "elevation", "motion"]:
        found.update(j(f"tokens/00-foundation/{f}.json")["tokens"])
    sem = j("tokens/10-semantic/color.json")["tokens"]

    def res_(ref, seen=()):
        if ref in sem:
            return res_(sem[ref]["ref"], seen + (ref,))
        return found[ref]["value"]
    try:
        rebuilt = {k: {"value": t["value"], "category": t["type"], "layer": "foundation", "cite": t["cite"]} for k, t in found.items()}
        rebuilt.update({k: {"value": res_(k), "category": "color", "layer": "semantic", "ref": t["ref"]} for k, t in sem.items()})
    except KeyError as e:
        rebuilt = {}
        p.append(f"semantic token references unknown foundation token {e}")
    cat = j("tokens/llm/token-catalog.json")
    if cat["tokens"] != rebuilt:
        bad = sorted(k for k in set(rebuilt) | set(cat["tokens"]) if rebuilt.get(k) != cat["tokens"].get(k))
        p.append(f"token-catalog.json drifted from tokens/00-foundation + 10-semantic: {bad[:8]}")
    if cat.get("count") != len(cat["tokens"]):
        p.append("token-catalog count field != number of tokens")
    theme = j("tokens/themes/light.json")["resolved"]
    if rebuilt and theme != {k: res_(k) for k in sem}:
        p.append("themes/light.json resolved values drifted")
    pol = j("tokens/llm/token-policy.json")
    cats = {t["category"] for t in cat["tokens"].values()}
    for k in pol["rawValueRestrictions"]:
        if k not in cats:
            p.append(f"policy rawValueRestrictions key {k!r} is not a catalog category {sorted(cats)}")
    for slot, d in pol["slots"].items():
        if not any(t.startswith(d["prefix"]) and v_["category"] == d["category"] for t, v_ in cat["tokens"].items()):
            p.append(f"policy slot {slot} resolves to no catalog token")
    for s, t in pol["allowedSurfaceTextPairs"]:
        if s not in cat["tokens"] or t not in cat["tokens"]:
            p.append(f"policy pair {s}+{t} uses unknown tokens")
    for k, t in found.items():
        if "cite" not in t or "contains" not in t:
            p.append(f"foundation token {k} lacks cite/contains evidence")
    v.check("token catalog + policy derived from real token files (R10)", p)

    # 10 motion
    p = []
    mp = j("tokens/00-foundation/motion-patterns.json")
    for k, d in mp["patterns"].items():
        if d["trigger"] not in mp["triggers"] or d["reducedMotionFallback"] not in mp["fallbacks"]:
            p.append(f"pattern {k}: trigger/fallback outside closed sets")
        if k != "none" and "cite" not in d:
            p.append(f"pattern {k}: no source citation")
    for sid, c in sections.items():
        for pat in c["motion"]["allowedPatterns"]:
            if pat not in mp["patterns"]:
                p.append(f"{sid}: unknown motion pattern {pat}")
        if c["motion"]["default"] not in c["motion"]["allowedPatterns"]:
            p.append(f"{sid}: default motion not in allowedPatterns")
    v.check("motion patterns closed and cited", p)

    # 11 graph <-> validator
    p = []
    gids = {r["id"] for r in R["graph"]["rules"]}
    p += [f"graph rule {x} has no implementation in semantic_validate.py RHYTHM_RULES" for x in sorted(gids - sv.RHYTHM_RULES)]
    p += [f"validator rhythm rule {x} is not described in compatibility/graph.json" for x in sorted(sv.RHYTHM_RULES - gids)]
    src_text = (REPO / "schema/semantic_validate.py").read_text()
    p += [f"rule {x} id never emitted in semantic_validate.py" for x in sorted(gids) if src_text.count(f'"{x}"') < 2]
    for r in R["graph"]["rules"]:
        for e in r.get("exceptions", []):
            p += [f"{r['id']} exception names unknown section {s}" for s in e["pair"] if s not in sections]
    v.check("compatibility graph agrees with validator", p)

    # 12 templates / routes
    p = []
    used = set()
    for t, d in R["templates"].items():
        for n in d["nodes"]:
            for s in n.get("anyOf") or [n["section"]]:
                used.add(s)
                if s not in sections:
                    p.append(f"template {t}: unknown section {s}")
                for var in n.get("variants", []):
                    if s in sections and var not in sections[s]["variants"]:
                        p.append(f"template {t}: variant {var} not in {s}")
    p += [f"section {s} is used by no template" for s in sorted(set(sections) - used)]
    rlist = [x["route"] for x in j("templates/routes.json")["routes"]]
    if len(rlist) != len(set(rlist)):
        p.append("a route is mapped more than once")
    for x in j("templates/routes.json")["routes"]:
        if x["template"] not in R["templates"]:
            p.append(f"route {x['route']} -> unknown template {x['template']}")
    p += [f"template {t} has no route" for t in R["templates"] if t not in {x["template"] for x in j("templates/routes.json")["routes"]}]
    root = source_root()
    if root:
        real = set(json.loads((root / "src/pages/routes.json").read_text()).values())
        if real != set(rlist):
            p.append(f"routes drift vs source src/pages/routes.json: missing {sorted(real - set(rlist))}, extra {sorted(set(rlist) - real)}")
    else:
        v.warn("no source tree: route reconciliation against src/pages/routes.json skipped")
    v.check("templates and 1:1 route mapping (R11)", p)

    # 13 citations
    p, ncite = [], 0
    if root:
        cache = {}

        def lines_of(rel):
            if rel not in cache:
                f = root / resolve(rel)
                cache[rel] = f.read_text(errors="ignore").split("\n") if f.exists() else None
            return cache[rel]

        def check_range(where, rel, a, b, contains):
            L = lines_of(rel)
            if L is None:
                p.append(f"{where}: {rel} does not exist")
                return
            if not (1 <= a <= b <= len(L)):
                p.append(f"{where}: {rel}:{a}-{b} out of range (file has {len(L)} lines)")
                return
            if contains is not None and not any(contains in l for l in L[a - 1:b]):
                p.append(f"{where}: {rel}:{a}-{b} does not contain {contains[:50]!r}")
        for path, data in all_json():
            relp = str(path.relative_to(REPO))
            for d in walk(data):
                c = d.get("cite")
                if isinstance(c, str) and re.match(r"^(pages:)?[^\s:]+:\d+(-\d+)?$", c):
                    ncite += 1
                    rel, rng = c.rsplit(":", 1)
                    a, _, b = rng.partition("-")
                    check_range(relp, rel, int(a), int(b or a), d.get("contains"))
                if isinstance(d.get("lines"), str) and "file" in d and "contains" in d and "manifest" in d:
                    ncite += 1
                    a, _, b = d["lines"].partition("-")
                    check_range(relp + " source", d["file"], int(a), int(b or a), d["contains"])
                    man = root / resolve(d["manifest"])
                    if not man.exists():
                        p.append(f"{relp}: manifest {d['manifest']} missing")
                    else:
                        ms = [s for s in json.loads(man.read_text())["sections"] if s["name"] == d["manifestSection"]]
                        tag = d.get("decomposedFrom", d["tag"])
                        if not ms or f'{ms[0]["tag"]}.{ms[0]["attrs"]["class"].split()[0]}' != tag:
                            p.append(f"{relp}: manifest section {d['manifestSection']} with tag {tag} not found in {d['manifest']}")
                fl = d.get("files")
                if isinstance(fl, list) and d.get("sourceClass"):
                    for rel in fl:
                        if not (root / resolve(rel)).exists():
                            p.append(f"{relp}: evidence file {rel} missing")
        for s in j("extraction/measured-values.json")["citations"]["spec"]:
            rel, rng = s.rsplit(":", 1)
            a, _, b = rng.partition("-")
            check_range("measured-values spec", rel, int(a), int(b or a), None)
            ncite += 1
        idt = R["identity"]
        blob = "".join(f.read_text(errors="ignore") for f in (root / "src/pages").rglob("*") if f.is_file()).lower()
        for name in idt["people"]:
            if name.lower() not in blob:
                p.append(f"source-identity person {name!r} not found in source (invented?)")
        for name, rx in idt["clients"].items():
            if not re.search(rx, blob):
                p.append(f"source-identity client {name!r} pattern not found in source")
        if not re.search(idt["sourceBrand"]["patterns"][0], blob):
            p.append("brand pattern not found in source")
    else:
        v.warn("no source tree next to design-repo: citation range/content checks skipped (set DESIGN_REPO_SOURCE_ROOT to enable)")
    v.check(f"citations resolve to real ranges with the quoted content ({ncite} checked)", p)

    # 14 wrapper gate
    errs, warns = gate.run(REPO)
    for c_, w, m_ in warns:
        v.warn(f"wrapper gate {c_} {w}: {m_}")
    v.check("wrapper-height gate (R9)", [f"{c_} {w}: {m_}" for c_, w, m_ in errs])

    # 15 hygiene
    p = []
    for f in REPO.rglob("*"):
        if f.is_file():
            if f.name in JUNK or "__MACOSX" in f.parts or "__pycache__" in f.parts:
                p.append(f"junk file {f.relative_to(REPO)}")
            elif f.suffix in (".json", ".md", ".py", ".mjs") and ABS_PATH_RX.search(f.read_text(errors="ignore")):
                p.append(f"absolute machine path in {f.relative_to(REPO)}")
    for need in ("extraction/measure_sections.mjs", "extraction/prove_drift.py", "schema/tests/adversarial_test.py"):
        if not (REPO / need).exists():
            p.append(f"{need} referenced but missing")
    v.check("hygiene: no junk, no absolute paths, referenced tools exist", p)

    for w in v.warns:
        print("warn", w)
    print(f"\nverify_all: {v.n} checks, {len(v.fails)} failures, {len(v.warns)} warnings")
    return 1 if v.fails else 0


if __name__ == "__main__":
    sys.exit(main())
