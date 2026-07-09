#!/usr/bin/env python3
"""
Trim saved responses into AI-digestible examples.

Reads every responses/**/<name>.json (full raw archive) and writes a slimmed
copy to examples/**/<name>.json with:
  - lists capped to KEEP items (+ a "__+N_more (total M)__" sentinel)
  - homogeneous time-series dicts (year / quarter / date keys) capped to KEEP
    keys (+ a "__truncated__" note)
  - named-field objects kept in full (every distinct field name survives)

Goal: preserve the full *shape* (all field names, one real sample value each)
while removing repetition, so an agent can read the structure without burning
context on 443-row arrays. The raw files in responses/ remain the source of truth.

Usage: python3 scripts/trim.py
"""
import json, os, re, glob

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "responses")
DST = os.path.join(HERE, "examples")
KEEP = 3

YEAR = re.compile(r"^\d{4}$")
QUARTER = re.compile(r"^Q[1-4][- ]\d{4}$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}")


def is_repetitive(d):
    """Cap a dict if it's list-like rather than a named-field object:
    - keys are all years / quarters / dates (time-series), or
    - it's large (>12 keys) and every value has the same type (registry/map,
      e.g. ticker→{...} or date→[...]). Named objects have mixed value types
      (str+num+dict+list), so they're left fully intact."""
    if len(d) <= KEEP:
        return False
    keys = list(d.keys())
    if all(YEAR.match(k) or QUARTER.match(k) or DATE.match(k) for k in keys):
        return True
    if len(d) > 12 and len({type(v).__name__ for v in d.values()}) == 1:
        return True
    return False


def trim(obj):
    if isinstance(obj, list):
        if len(obj) <= KEEP:
            return [trim(x) for x in obj]
        return [trim(x) for x in obj[:KEEP]] + [f"__+{len(obj) - KEEP}_more (total {len(obj)})__"]
    if isinstance(obj, dict):
        if is_repetitive(obj):
            items = list(obj.items())[:KEEP]
            out = {k: trim(v) for k, v in items}
            out["__truncated__"] = f"+{len(obj) - KEEP} more keys (total {len(obj)})"
            return out
        return {k: trim(v) for k, v in obj.items()}
    return obj


def main():
    files = sorted(glob.glob(os.path.join(SRC, "**", "*.json"), recursive=True))
    n, before, after = 0, 0, 0
    for fp in files:
        base = os.path.basename(fp)
        if base.startswith("_"):  # skip _manifest/_shapes/_discover/_openapi_live
            continue
        rel = os.path.relpath(fp, SRC)
        out_fp = os.path.join(DST, rel)
        os.makedirs(os.path.dirname(out_fp), exist_ok=True)
        with open(fp) as f:
            wrapped = json.load(f)
        wrapped["data"] = trim(wrapped.get("data"))
        text = json.dumps(wrapped, indent=2, ensure_ascii=False)
        with open(out_fp, "w") as f:
            f.write(text)
        before += os.path.getsize(fp)
        after += len(text.encode())
        n += 1
    print(f"Trimmed {n} files → examples/  ({before/1024:.0f} KB → {after/1024:.0f} KB, "
          f"{100*(1-after/before):.0f}% smaller)")


if __name__ == "__main__":
    main()
