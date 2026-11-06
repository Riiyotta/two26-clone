#!/usr/bin/env python3
"""Whole-page-wrapper quality gate (R9). Called from extraction/verify_all.py.

    python3 extraction/wrapper_gate.py

Reads measured heights from extraction/measured-values.json (sectionHeights, 1440px) and the
reviewed exceptions in extraction/wrapper-whitelist.json. Thresholds are pinned here in code.
Standard library only.
"""
import json, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

HERO_WARN_PX = 1800
HERO_ERROR_PX = 3000
SHARE_WARN = 0.50
SHARE_ERROR = 0.60
REQUIRED_VIEWPORT_WIDTH = 1440
MIN_INFLOW_SECTIONS = 3
MIN_JUSTIFICATION = 30
AGENT_PHRASE = "agent attestation, not a human sign-off"
EXCLUDED_CATEGORIES = {"SHELL", "RUNTIME"}


def check(measured, whitelist, routes, sections):
    """Pure function: returns (errors, warnings) as lists of (code, where, message)."""
    errors, warnings = [], []
    sh = measured.get("sectionHeights")
    if not isinstance(sh, dict):
        return [("GATE_NO_MEASUREMENTS", "sectionHeights", "extraction/measured-values.json has no sectionHeights")], []
    vw = (sh.get("viewport") or {}).get("width")
    if vw != REQUIRED_VIEWPORT_WIDTH:
        errors.append(("GATE_WRONG_VIEWPORT", "sectionHeights.viewport", f"measured at {vw}px, gate requires {REQUIRED_VIEWPORT_WIDTH}px"))
    measured_routes = sh.get("routes") or {}
    wl = {}
    for k, e in enumerate(whitelist):
        where = f"whitelist[{k}]"
        miss = [f for f in ("route", "section", "reviewedBy", "justification", "maxHeightPx") if f not in e]
        if miss:
            errors.append(("GATE_WHITELIST_INVALID", where, f"missing {miss}"))
            continue
        if len(str(e["justification"]).strip()) < MIN_JUSTIFICATION:
            errors.append(("GATE_WHITELIST_INVALID", where, f"justification shorter than {MIN_JUSTIFICATION} chars"))
        rb = str(e["reviewedBy"])
        if not rb.lower().startswith("human:") and AGENT_PHRASE not in rb:
            errors.append(("GATE_WHITELIST_INVALID", where, f"reviewedBy must be 'human:<name>' or say '{AGENT_PHRASE}'"))
        wl[(e["route"], e["section"])] = e
    used = set()
    for r in routes:
        if r not in measured_routes:
            errors.append(("GATE_MISSING_MEASUREMENT", r, "route has no sectionHeights entry"))
    seen_sections = set()
    for r, entry in measured_routes.items():
        page = entry.get("pageHeight")
        secs = entry.get("sections") or []
        if not isinstance(page, (int, float)) or page <= 0:
            errors.append(("GATE_MISSING_MEASUREMENT", r, "pageHeight missing"))
            continue
        flow = []
        for s in secs:
            sid = s.get("section")
            seen_sections.add(sid)
            if sid not in sections:
                errors.append(("GATE_UNKNOWN_SECTION", r, f"{sid} has no contract"))
                continue
            h = s.get("heightPx")
            if not isinstance(h, (int, float)):
                errors.append(("GATE_MISSING_MEASUREMENT", r, f"{sid} has no heightPx"))
                continue
            if s.get("inFlow") and h <= 0:
                errors.append(("GATE_ZERO_HEIGHT", r, f"{sid} measured 0px (lazy media not loaded?)"))
            cat = sections[sid]["category"]
            if s.get("inFlow") and cat not in EXCLUDED_CATEGORIES:
                flow.append((sid, cat, h))
        for sid, cat, h in flow:
            key = (r, sid)
            if cat == "HERO" and h > HERO_WARN_PX:
                if h > HERO_ERROR_PX and key not in wl:
                    errors.append(("GATE_HERO_TOO_TALL", r, f"{sid} {h}px > {HERO_ERROR_PX}px"))
                else:
                    warnings.append(("GATE_HERO_TALL", r, f"{sid} {h}px > {HERO_WARN_PX}px" + (" (whitelisted)" if key in wl else "")))
                if key in wl:
                    used.add(key)
            if len(flow) >= MIN_INFLOW_SECTIONS:
                share = h / page
                if share > SHARE_WARN:
                    if share > SHARE_ERROR and key not in wl:
                        errors.append(("GATE_WHOLE_PAGE_SECTION", r, f"{sid} holds {share:.0%} of the page (> {SHARE_ERROR:.0%})"))
                    else:
                        warnings.append(("GATE_MAJORITY_SECTION", r, f"{sid} holds {share:.0%} of the page" + (" (whitelisted)" if key in wl else "")))
                    if key in wl:
                        used.add(key)
            if key in wl and h > wl[key]["maxHeightPx"]:
                errors.append(("GATE_WHITELIST_OVER_CAP", r, f"{sid} {h}px exceeds whitelisted maxHeightPx {wl[key]['maxHeightPx']}"))
    for key in wl:
        if key not in used:
            errors.append(("GATE_WHITELIST_STALE", f"{key[0]} {key[1]}", "whitelist entry no longer matches a gate hit"))
    for sid, c in sections.items():
        if c["category"] not in EXCLUDED_CATEGORIES and sid not in seen_sections:
            errors.append(("GATE_MISSING_MEASUREMENT", sid, "in-flow section contract has no measured height on any route"))
    return errors, warnings


def run(repo=REPO):
    r = Path(repo)
    measured = json.loads((r / "extraction/measured-values.json").read_text())
    whitelist = json.loads((r / "extraction/wrapper-whitelist.json").read_text())["entries"]
    routes = [x["route"] for x in json.loads((r / "templates/routes.json").read_text())["routes"]]
    sections = {p.stem: json.loads(p.read_text()) for p in sorted((r / "sections").glob("*.json"))}
    return check(measured, whitelist, routes, sections)


if __name__ == "__main__":
    errs, warns = run()
    for c, w, m in errs:
        print(f"ERROR {c} {w}: {m}")
    for c, w, m in warns:
        print(f"warn  {c} {w}: {m}")
    print(f"wrapper gate: {len(errs)} errors, {len(warns)} warnings")
    sys.exit(1 if errs else 0)
