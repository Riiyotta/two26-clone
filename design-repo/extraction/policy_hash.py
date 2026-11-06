#!/usr/bin/env python3
"""Content hash of the files the design policy is enforced by (R15).

    python3 extraction/policy_hash.py   # prints sha256:<hex>
verify_all.py recomputes it and fails when registry.manifest.json designPolicy.contentHash drifts.
"""
import hashlib
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENFORCED_BY = ["tokens/llm/token-policy.json", "compatibility/graph.json", "schema/pagespec.schema.json", "schema/semantic_validate.py", "policy/design-policy.json"]


def compute(repo=REPO):
    h = hashlib.sha256()
    for rel in ENFORCED_BY:
        h.update(rel.encode() + b"\0" + (Path(repo) / rel).read_bytes() + b"\0")
    return "sha256:" + h.hexdigest()


if __name__ == "__main__":
    print(compute())
