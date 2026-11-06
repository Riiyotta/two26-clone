#!/usr/bin/env python3
"""Prove that verify_all.py's checks actually catch drift (BUILD-GUIDE 2.7, R5, R9, R14).

    python3 extraction/prove_drift.py

For each case: copy design-repo/ to a fresh OS temp dir, inject one drift, run that copy's
verify_all.py and require it to FAIL with the expected message. Finally require the real repo
to PASS. Citation cases need the source tree; the copy is pointed at it through
DESIGN_REPO_SOURCE_ROOT, and those cases are reported as skipped when no source tree exists.
"""
import json, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = Path(os.environ["DESIGN_REPO_SOURCE_ROOT"]) if os.environ.get("DESIGN_REPO_SOURCE_ROOT") else (REPO.parent if (REPO.parent / "src/pages/routes.json").exists() else None)


def jedit(rel, fn):
    def apply(d):
        f = d / rel
        data = json.loads(f.read_text())
        fn(data)
        f.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return apply


def tedit(rel, old, new):
    def apply(d):
        f = d / rel
        t = f.read_text()
        assert old in t, f"{old!r} not in {rel}"
        f.write_text(t.replace(old, new, 1))
    return apply


def both(*fs):
    def apply(d):
        for f in fs:
            f(d)
    return apply


def _first_token_cite(d, fn):
    k = next(iter(d["tokens"]))
    fn(d["tokens"][k])


def _shift(t):
    rel, ln = t["cite"].rsplit(":", 1)
    t["cite"] = f"{rel}:{int(ln) + 1}"


def _hero_tall(d):
    for s in d["sectionHeights"]["routes"]["/"]["sections"]:
        if s["section"] == "hero.home":
            s["heightPx"] = 3100


CASES = [
    # (name, mutation, expected text in output, needs source tree)
    ("phantom allowlist entry", jedit("tokens/llm/component-allowlist.json", lambda d: d["primitives"].append("button.phantom")), "phantom allowlist entry", False),
    ("orphan section contract (allowlist entry removed)", jedit("tokens/llm/component-allowlist.json", lambda d: d["sections"].pop("faq.accordion")), "contract without allowlist entry", False),
    ("out-of-range citation", jedit("tokens/00-foundation/color.json", lambda d: _first_token_cite(d, lambda t: t.update(cite=t["cite"].rsplit(":", 1)[0] + ":999999"))), "out of range", True),
    ("in-range citation at the wrong line", jedit("tokens/00-foundation/color.json", lambda d: _first_token_cite(d, _shift)), "does not contain", True),
    ("section source range points at wrong content", jedit("sections/hero.home.json", lambda d: d["source"].update(contains="this-text-is-not-there")), "does not contain", True),
    ("registry availability loosened", jedit("assets/asset-roles.json", lambda d: d["roles"]["person.team-photo-source"].update(availability="generation-safe")), "!= pinned", False),
    ("availability pin removed from verify_all", tedit("extraction/verify_all.py", '    "client.logo-source": "blocked-for-generation",\n', ""), "missing pin", False),
    ("availability pin removed from semantic_validate", tedit("schema/semantic_validate.py", '    "client.logo-source": "blocked-for-generation",\n', ""), "differs between verify_all.py and semantic_validate.py", False),
    ("retrieval pin removed", tedit("extraction/verify_all.py", '"runtime.team-popup"}', '}'), "RETRIEVAL", False),
    ("contract + allowlist flipped together", both(jedit("sections/runtime.mobile-menu.json", lambda d: (d.update(retrievalEligible=True), d.pop("retrievalReason"))),
                                                   jedit("tokens/llm/component-allowlist.json", lambda d: d["sections"]["runtime.mobile-menu"].update(retrievalEligible=True))), "RETRIEVAL", False),
    ("token catalog value drift", jedit("tokens/llm/token-catalog.json", lambda d: d["tokens"]["color.brand.primary"].update(value="#ff0000")), "token-catalog.json drifted", False),
    ("foundation token changed without catalog", jedit("tokens/00-foundation/color.json", lambda d: d["tokens"]["color.brand.accent"].update(value="#123456")), "token-catalog.json drifted", False),
    ("policy category typo", jedit("tokens/llm/token-policy.json", lambda d: d["rawValueRestrictions"].update(typography="x")), "is not a catalog category", False),
    ("manifest count drift", jedit("registry.manifest.json", lambda d: d["counts"].update(sections=d["counts"]["sections"] + 1)), "manifest counts drift", False),
    ("README count drift", tedit("README.md", "| templates | 4 |", "| templates | 5 |"), "README counts table", False),
    ("allowlistVersion drift", jedit("registry.manifest.json", lambda d: d.update(allowlistVersion="9.9.9")), "allowlistVersion", False),
    ("entry point outside the package", jedit("registry.manifest.json", lambda d: d["entryPoints"].update(spec="../CLONE_SPEC.md")), "outside the package", False),
    ("graph rule without validator", jedit("compatibility/graph.json", lambda d: d["rules"].append({"id": "NEW_RULE", "severity": "error", "rule": "x"})), "no implementation", False),
    ("schema hand-edited (stale vs contracts)", jedit("schema/pagespec.schema.json", lambda d: d["properties"]["mode"].update(enum=["reference", "generated", "draft"])), "drifted from sections", False),
    ("contract word budget changed without schema rebuild", jedit("sections/hero.home.json", lambda d: d["content"]["fields"].update(extra={"type": "text", "maxWords": 3, "required": False})), "drifted from sections", False),
    ("gate: route measurement removed", jedit("extraction/measured-values.json", lambda d: d["sectionHeights"]["routes"].pop("/about")), "GATE_MISSING_MEASUREMENT", False),
    ("gate: measured at wrong viewport", jedit("extraction/measured-values.json", lambda d: d["sectionHeights"]["viewport"].update(width=1280)), "GATE_WRONG_VIEWPORT", False),
    ("gate: hero 3100px", jedit("extraction/measured-values.json", _hero_tall), "GATE_HERO_TOO_TALL", False),
    ("gate: threshold loosened in code", tedit("extraction/wrapper_gate.py", "HERO_ERROR_PX = 3000", "HERO_ERROR_PX = 30000"), "", False),
    ("gate: whitelist entry without justification", jedit("extraction/wrapper-whitelist.json", lambda d: d["entries"].append({"route": "/", "section": "hero.home", "reviewedBy": "human:x", "maxHeightPx": 5000})), "GATE_WHITELIST_INVALID", False),
    ("policy file edited without re-hashing", jedit("tokens/llm/token-policy.json", lambda d: d["allowedSurfaceTextPairs"].append(["color.surface.brand", "color.text.brand"])), "contentHash", False),
    ("policy approval self-ratified", jedit("policy/design-policy.json", lambda d: d["approval"].update(architectureDecisionRecorded=True, decidedBy="claude")), "human", False),
    ("route mapped twice", jedit("templates/routes.json", lambda d: d["routes"].append(dict(d["routes"][0]))), "mapped more than once", False),
    ("route dropped (reconcile vs source)", jedit("templates/routes.json", lambda d: d["routes"].pop()), "routes drift vs source", True),
    ("generated example removed for a family", lambda d: (d / "schema/examples/generated.about.pagespec.json").unlink(), "no generated example", False),
    ("absolute machine path", tedit("README.md", "# two26 design-repo", "# two26 design-repo (" + "/Us" + "ers/someone/x)"), "absolute machine path", False),
]


def run_verify(d, src):
    env = dict(os.environ)
    env.pop("DESIGN_REPO_SOURCE_ROOT", None)
    if src:
        env["DESIGN_REPO_SOURCE_ROOT"] = str(src)
    return subprocess.run([sys.executable, str(d / "extraction/verify_all.py")], capture_output=True, text=True, env=env)


def main():
    bad = 0
    for name, mut, needle, needs_src in CASES:
        if needs_src and not SRC:
            print(f"  skip {name} (needs the source tree)")
            continue
        tmp = Path(tempfile.mkdtemp(prefix="dr-drift-"))
        try:
            d = tmp / "design-repo"
            shutil.copytree(REPO, d, ignore=shutil.ignore_patterns("__pycache__"))
            mut(d)
            out = run_verify(d, SRC)
            if name.startswith("gate: threshold loosened"):
                # loosening a pinned threshold must be caught by the gate's own adversarial case
                out = subprocess.run([sys.executable, str(d / "schema/tests/adversarial_test.py")], capture_output=True, text=True)
                needle = "GATE_HERO_TOO_TALL"
            ok = out.returncode != 0 and needle.lower() in out.stdout.lower()
            bad += not ok
            print(f"  {'caught' if ok else 'MISSED'}  {name}" + ("" if ok else f"\n{out.stdout[-1200:]}"))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    out = run_verify(REPO, SRC)
    real_ok = out.returncode == 0
    print(f"  {'pass' if real_ok else 'FAIL'}    real repo verify_all (rc={out.returncode})")
    print(f"\nprove_drift: {len(CASES)} cases, {bad} missed; real repo {'passes' if real_ok else 'FAILS'}")
    return 0 if (bad == 0 and real_ok) else 1


if __name__ == "__main__":
    sys.exit(main())
