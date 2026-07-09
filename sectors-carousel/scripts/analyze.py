#!/usr/bin/env python3
"""
Read every responses/<name>.json (saved by probe.py) and emit a compact
structural summary to responses/_shapes.txt — top-level keys, nested shapes,
leaf types with one sample value. Lets us document field-by-field without
re-reading large raw payloads.
"""
import json, os, glob

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESP = os.path.join(HERE, "responses")


def summarize(obj, depth=0, max_depth=4, arr_n=1):
    pad = "  " * depth
    if isinstance(obj, dict):
        lines = []
        for k, v in obj.items():
            head = describe(v, depth)
            lines.append(f"{pad}{k}: {head}")
            if isinstance(v, (dict, list)) and depth < max_depth:
                lines.append(summarize(v, depth + 1, max_depth, arr_n))
        return "\n".join(x for x in lines if x.strip())
    if isinstance(obj, list):
        if not obj:
            return f"{pad}(empty list)"
        out = [f"{pad}[list of {len(obj)}] item[0]:"]
        first = obj[0]
        if isinstance(first, (dict, list)) and depth < max_depth:
            out.append(summarize(first, depth + 1, max_depth, arr_n))
        else:
            out.append(f"{pad}  {describe(first, depth)}")
        return "\n".join(out)
    return ""


def describe(v, depth):
    if isinstance(v, dict):
        return f"{{{len(v)} keys}}"
    if isinstance(v, list):
        if not v:
            return "[empty]"
        t = type(v[0]).__name__
        return f"[{len(v)}x {t}]"
    if isinstance(v, bool):
        return f"bool ({v})"
    if isinstance(v, (int, float)):
        return f"num (e.g. {v})"
    if isinstance(v, str):
        s = v if len(v) <= 50 else v[:50] + "…"
        return f"str (e.g. \"{s}\")"
    if v is None:
        return "null"
    return type(v).__name__


def main():
    # Recurse so the subfolders (new/, params/, screener/) are indexed too,
    # not just the top-level responses.
    files = sorted(glob.glob(os.path.join(RESP, "**", "*.json"), recursive=True))
    out, n = [], 0
    for fp in files:
        name = os.path.basename(fp)[:-5]
        if name.startswith("_"):
            continue
        # label with subfolder (e.g. "new/corporate_actions") for clarity
        rel = os.path.relpath(fp, RESP)[:-5]
        with open(fp) as f:
            wrapped = json.load(f)
        status = wrapped.get("_status")
        params = wrapped.get("_params")
        data = wrapped.get("data")
        out.append("=" * 78)
        out.append(f"# {rel}   [HTTP {status}]" + (f"   params={params}" if params else ""))
        out.append("-" * 78)
        out.append(summarize(data))
        out.append("")
        n += 1
    text = "\n".join(out)
    with open(os.path.join(RESP, "_shapes.txt"), "w") as f:
        f.write(text)
    print(f"Wrote {os.path.join(RESP, '_shapes.txt')} ({len(text)} chars, {n} responses)")


if __name__ == "__main__":
    main()
