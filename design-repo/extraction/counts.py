#!/usr/bin/env python3
"""Recompute every summary number the manifest and README state (R14 / MASTER-GUIDE 3.16).

    python3 extraction/counts.py            # print counts as JSON
    python3 extraction/counts.py --table    # print the README counts table
verify_all.py compares registry.manifest.json "counts" and the README table to this.
"""
import importlib.util, json, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]


def compute(repo=REPO):
    r = Path(repo)
    j = lambda rel: json.loads((r / rel).read_text())
    sections = [json.loads(p.read_text()) for p in sorted((r / "sections").glob("*.json"))]
    cat = j("tokens/llm/token-catalog.json")["tokens"]
    examples = sorted((r / "schema/examples").glob("*.pagespec.json"))
    spec = importlib.util.spec_from_file_location("adv_cases", r / "schema/tests/adversarial_test.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return {
        "tokens": len(cat),
        "foundationTokens": sum(1 for v in cat.values() if v["layer"] == "foundation"),
        "semanticTokens": sum(1 for v in cat.values() if v["layer"] == "semantic"),
        "primitives": len(list((r / "primitives").glob("*.json"))),
        "components": len(list((r / "components").glob("*.json"))),
        "sections": len(sections),
        "retrievalIneligibleSections": sum(1 for s in sections if s["retrievalEligible"] is False),
        "templates": len(j("templates/templates.json")["templates"]),
        "routes": len(j("templates/routes.json")["routes"]),
        "examples": len(examples),
        "generatedExamples": sum(1 for p in examples if json.loads(p.read_text())["mode"] == "generated"),
        "referenceExamples": sum(1 for p in examples if json.loads(p.read_text())["mode"] == "reference"),
        "assetRoles": len(j("assets/asset-roles.json")["roles"]),
        "motionPatterns": len(j("tokens/00-foundation/motion-patterns.json")["patterns"]),
        "graphRules": len(j("compatibility/graph.json")["rules"]),
        "adversarialCases": len(mod.MUTATIONS) + len(mod.GATE_CASES) + len(mod.REPO_CASES),
        "adversarialControls": len(examples) + len(mod.GATE_CONTROLS),
    }


def table(c):
    rows = ["<!-- counts:start -->", "| item | count |", "|---|---|"] + [f"| {k} | {v} |" for k, v in c.items()] + ["<!-- counts:end -->"]
    return "\n".join(rows)


if __name__ == "__main__":
    c = compute()
    print(table(c) if "--table" in sys.argv else json.dumps(c, indent=2))
