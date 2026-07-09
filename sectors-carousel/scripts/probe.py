#!/usr/bin/env python3
"""
Sectors API v2 — exhaustive endpoint probe.

Calls every endpoint (51 paths) with representative parameters and parameter
variations, saves each raw JSON response to responses/<name>.json, and writes a
manifest (responses/_manifest.json) capturing HTTP status, payload size, and a
shallow shape summary for each call.

Key resolution: SECTORS_API_KEY env var only (never written to disk).
Auth header: `Authorization: <raw-key>` (no Bearer). Real User-Agent required
(Cloudflare blocks default urllib UA with 403 / "error code: 1010").

Usage:
  export SECTORS_API_KEY=...
  python3 scripts/probe.py discover        # cheap calls to resolve slugs/symbols
  python3 scripts/probe.py run              # full probe (spends credits)
  python3 scripts/probe.py run --only idx   # subset: meta | idx | market
"""
import argparse, json, os, sys, time, urllib.parse, urllib.request, urllib.error

BASE = "https://api.sectors.app"
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESP_DIR = os.path.join(HERE, "responses")

KEY = os.environ.get("SECTORS_API_KEY")
if not KEY:
    sys.stderr.write("ERROR: set SECTORS_API_KEY\n")
    sys.exit(2)


def call(path, params=None):
    """GET a /v2 path. Returns (status, parsed_or_body)."""
    url = BASE + path
    params = {k: v for k, v in (params or {}).items() if v is not None}
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "Authorization": KEY,
        "User-Agent": "sectors-skill-probe/1.0 (+https://sectors.app)",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            raw = r.read().decode()
            try:
                return r.status, json.loads(raw)
            except json.JSONDecodeError:
                return r.status, {"_nonjson": raw[:2000]}
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_body": body[:2000]}
    except urllib.error.URLError as e:
        return -1, {"_neterr": str(e)}


def shape(obj, depth=0, max_depth=3):
    """Shallow structural summary: keys + leaf types, arrays as [Nx item-shape]."""
    if depth > max_depth:
        return "…"
    if isinstance(obj, dict):
        return {k: shape(v, depth + 1, max_depth) for k, v in list(obj.items())[:40]}
    if isinstance(obj, list):
        if not obj:
            return "[]"
        return [f"{len(obj)}x", shape(obj[0], depth + 1, max_depth)]
    if isinstance(obj, bool):
        return "bool"
    if isinstance(obj, (int, float)):
        return f"num({obj})" if depth >= max_depth else "num"
    if isinstance(obj, str):
        return f"str({obj[:30]})" if depth >= max_depth else "str"
    if obj is None:
        return "null"
    return type(obj).__name__


def save(name, status, data):
    os.makedirs(RESP_DIR, exist_ok=True)
    with open(os.path.join(RESP_DIR, f"{name}.json"), "w") as f:
        json.dump({"_status": status, "data": data}, f, indent=2, ensure_ascii=False)
    size = len(json.dumps(data))
    top = list(data.keys())[:30] if isinstance(data, dict) else f"list[{len(data)}]" if isinstance(data, list) else type(data).__name__
    return {"name": name, "status": status, "bytes": size, "top": top}


# ---- discovery: resolve valid slugs/symbols before the param-rich run ----
def discover():
    out = {}
    st, segs = call("/v2/companies/list_companies_with_segments/")
    out["segment_companies"] = (segs[:10] if isinstance(segs, list) else segs)
    st, subs = call("/v2/subsectors/")
    out["subsectors"] = subs
    st, tags = call("/v2/tags/")
    out["tags"] = (tags[:30] if isinstance(tags, list) else tags)
    print(json.dumps(out, indent=2, ensure_ascii=False)[:6000])
    with open(os.path.join(RESP_DIR, "_discover.json"), "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)


# ---- the IDX endpoint matrix ----
# Resolved from discovery / known-good values:
IDX_BANK = "BBCA"      # big cap, rich news+filings, banking financial fields
IDX_TELCO = "TLKM"     # infra/telecom, segments
IDX_SMALL = "JSPT"     # small cap hotel (segments yes, news/filings no)
IDX_IPO = "BREN"       # recent IPO (listing-performance data)
# windows (<=90d). API "today" lags ~1d; use a safe recent closed window.
D_START, D_END = "2026-03-14", "2026-06-11"


def matrix():
    return {
      "meta": [
        ("subsectors", "/v2/subsectors/", None),
        ("industries", "/v2/industries/", None),
        ("subindustries", "/v2/subindustries/", None),
        ("tags", "/v2/tags/", None),
        ("companies_with_segments", "/v2/companies/list_companies_with_segments/", None),
      ],
      "idx": [
        ("report_full", f"/v2/company/report/{IDX_BANK}/", None),
        ("report_overview", f"/v2/company/report/{IDX_BANK}/", {"sections": "overview"}),
        ("report_valuation", f"/v2/company/report/{IDX_BANK}/", {"sections": "valuation"}),
        ("report_future", f"/v2/company/report/{IDX_BANK}/", {"sections": "future"}),
        ("report_financials", f"/v2/company/report/{IDX_BANK}/", {"sections": "financials"}),
        ("report_dividend", f"/v2/company/report/{IDX_BANK}/", {"sections": "dividend"}),
        ("report_management", f"/v2/company/report/{IDX_BANK}/", {"sections": "management"}),
        ("report_ownership", f"/v2/company/report/{IDX_BANK}/", {"sections": "ownership"}),
        ("report_peers", f"/v2/company/report/{IDX_BANK}/", {"sections": "peers"}),
        ("report_telco_full", f"/v2/company/report/{IDX_TELCO}/", None),
        ("report_small_full", f"/v2/company/report/{IDX_SMALL}/", None),
        ("quarterly_dates", f"/v2/company/get_quarterly_financial_dates/{IDX_BANK}/", None),
        ("quarterly", f"/v2/financials/quarterly/{IDX_BANK}/", None),
        ("quarterly_small", f"/v2/financials/quarterly/{IDX_SMALL}/", None),
        ("segments_telco", f"/v2/company/get-segments/{IDX_TELCO}/", None),
        ("segments_small", f"/v2/company/get-segments/{IDX_SMALL}/", None),
        ("daily", f"/v2/daily/{IDX_BANK}/", {"start": D_START, "end": D_END}),
        ("listing_perf_recent", f"/v2/listing-performance/{IDX_IPO}/", None),
        ("listing_perf_small", f"/v2/listing-performance/{IDX_SMALL}/", None),
      ],
      "market": [
        ("companies_screen_where", "/v2/companies/", {"where": "sub_sector = 'banks' and market_cap > 100000000000000", "order_by": "-market_cap", "limit": "10"}),
        ("companies_screen_yearly", "/v2/companies/", {"where": "revenue[2024] > earnings[2024] * 5", "order_by": "-market_cap", "limit": "10"}),
        ("companies_screen_q", "/v2/companies/", {"q": "top 5 dividend paying banks", "limit": "5"}),
        ("companies_screen_indices", "/v2/companies/", {"where": "indices in ['LQ45']", "limit": "10"}),
        ("top_changes_movers", "/v2/companies/top-changes/", {"classifications": "top_gainers,top_losers", "periods": "7d"}),
        ("free_float_banks", "/v2/free-float/", {"sub_sector": "banks"}),
        ("free_float_all", "/v2/free-float/", None),
        ("most_traded", "/v2/most-traded/", {"start": D_START, "end": D_END}),
        ("idx_total", "/v2/idx-total/", {"start": D_START, "end": D_END}),
        ("index_daily_lq45", "/v2/index-daily/lq45/", {"start": D_START, "end": D_END}),
        ("subsector_report", "/v2/subsector/report/banks/", None),
        ("news", "/v2/news/", {"symbols": IDX_BANK, "limit": "10"}),
        ("news_subsector", "/v2/news/", {"sub_sector": "banks", "limit": "5"}),
        ("filings", "/v2/filings/", {"symbol": IDX_BANK}),
      ],
    }


def run(only=None):
    groups = matrix()
    manifest = []
    for group, calls in groups.items():
        if only and group != only:
            continue
        for name, path, params in calls:
            status, data = call(path, params)
            rec = save(name, status, data)
            rec["group"] = group
            rec["path"] = path
            rec["params"] = params
            manifest.append(rec)
            flag = "OK " if status == 200 else f"!{status}"
            print(f"  [{flag}] {group:8} {name:28} {rec['bytes']:>8}b  {path}")
            time.sleep(0.25)
    with open(os.path.join(RESP_DIR, "_manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    ok = sum(1 for m in manifest if m["status"] == 200)
    print(f"\n{ok}/{len(manifest)} OK. Manifest -> responses/_manifest.json")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("discover")
    rp = sub.add_parser("run")
    rp.add_argument("--only")
    a = p.parse_args()
    if a.cmd == "discover":
        discover()
    elif a.cmd == "run":
        run(a.only)
