#!/usr/bin/env python3
"""
Company Screener (`GET /v2/companies/`) — capability probe.

Exercises every query *capability class* the official docs describe (direct,
array, JSON-object, yearly, forecast, ratio, quarterly bracket notation, JSON-
list fields, arithmetic, field-to-field, params) with one live call each, to
record what actually works vs. what the docs claim. Saves each response to
responses/screener/<name>.json and prints a compact pass/fail table.

Key: SECTORS_API_KEY env var. Auth header raw (no Bearer), real User-Agent.

NOTE on credits: structured (where/order_by) = 1 credit; natural-language (q) = 3.
This probe runs ~26 structured calls + 2 NL calls.

Usage:
  export SECTORS_API_KEY=...
  python3 scripts/screener_probe.py
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error

BASE = "https://api.sectors.app/v2/companies/"
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "responses", "screener")
KEY = os.environ.get("SECTORS_API_KEY")
if not KEY:
    sys.stderr.write("ERROR: set SECTORS_API_KEY\n"); sys.exit(2)


def call(params):
    url = BASE + "?" + urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    req = urllib.request.Request(url, headers={
        "Authorization": KEY,
        "User-Agent": "sectors-screener-probe/1.0 (+https://sectors.app)",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_body": body[:1500]}
    except urllib.error.URLError as e:
        return -1, {"_neterr": str(e)}


# (name, capability, params) — each probes one documented capability class.
TESTS = [
    # --- direct fields ---
    ("direct_marketcap", "direct field + order_by desc",
     {"where": "market_cap > 500000000000000", "order_by": "-market_cap", "limit": "5"}),
    ("direct_like", "LIKE on company_name",
     {"where": "company_name like '%energi%'", "limit": "5"}),
    ("direct_compound", "AND + date literal",
     {"where": "sector = 'Financials' and listing_date > '2005-01-01'", "limit": "5"}),
    # --- array fields ---
    ("array_indices", "indices IN [...]",
     {"where": "indices in ['LQ45','IDX30']", "limit": "5"}),
    ("array_tags", "tags IN [...]",
     {"where": "tags in ['52-w-high']", "limit": "5"}),
    # --- JSON-object (most-recent) fields ---
    ("json_pe_roe", "pe_ttm + roe_ttm",
     {"where": "pe_ttm < 15 and roe_ttm > 0.1", "order_by": "-roe_ttm", "limit": "5"}),
    ("json_field_vs_field", "field-to-field (last_close < all_time_high)",
     {"where": "last_close_price < all_time_high_price", "limit": "5"}),
    ("json_date_field", "date JSON field compare",
     {"where": "ytd_low_date > '2025-03-01'", "limit": "5"}),
    # --- yearly JSON: arithmetic, field-to-field, ratios, banking, forecast ---
    ("yearly_arithmetic", "arithmetic RHS revenue/earnings",
     {"where": "revenue[2024] > earnings[2024] * 5", "order_by": "-revenue[2024]", "limit": "5"}),
    ("yearly_multi_year", "same field two years",
     {"where": "roe[2023] > 0.15 and roe[2022] > 0.15", "limit": "5"}),
    ("yearly_peer_avg", "pe vs pe_peer_avg (field-to-field)",
     {"where": "pe[2024] < pe_peer_avg[2024]", "limit": "5"}),
    ("yearly_ratio", "computed ratio field current_ratio",
     {"where": "current_ratio[2024] > 2 and roe[2024] > 0.1", "limit": "5"}),
    ("yearly_margin", "net_profit_margin ratio",
     {"where": "net_profit_margin[2024] > 0.3", "order_by": "-net_profit_margin[2024]", "limit": "5"}),
    ("banking_npl", "banking loan-quality field non_performing_loan",
     {"where": "non_performing_loan[2024] > 0", "limit": "5"}),
    ("banking_casa", "banking casa_ratio",
     {"where": "casa_ratio[2024] > 0.5", "limit": "5"}),
    ("forecast_eps", "forecast field forecast_eps_growth[2025]",
     {"where": "forecast_eps_growth[2025] > 0.15", "order_by": "-forecast_eps_growth[2025]", "limit": "5"}),
    ("forecast_rev_est", "forecast_revenue_estimate[2025]",
     {"where": "forecast_revenue_estimate[2025] > 100000000000000", "limit": "5"}),
    # --- quarterly bracket notation ---
    ("quarterly_revenue", "revenue_q[Q1-2024]",
     {"where": "revenue_q[Q1-2024] > 1000000000000", "limit": "5"}),
    ("quarterly_qoq", "earnings_q QoQ (Q4 vs Q3)",
     {"where": "earnings_q[Q4-2024] > earnings_q[Q3-2024]", "limit": "5"}),
    # --- JSON-list fields ---
    ("list_major_holder", "major_shareholders_name LIKE + pct",
     {"where": "major_shareholders_name like 'PT%' and major_shareholders_share_percentage > 0.1", "limit": "5"}),
    ("list_executive", "key_executives_name LIKE",
     {"where": "key_executives_name like '%Prajogo%'", "limit": "5"}),
    ("list_free_float", "free_float (from major_shareholders)",
     {"where": "free_float < 0.25", "order_by": "free_float", "limit": "5"}),
    # --- params / sorting ---
    ("order_arithmetic", "order_by arithmetic expression",
     {"where": "earnings[2024] > 0 and earnings[2023] > 0",
      "order_by": "-(earnings[2024]/earnings[2023])", "limit": "5"}),
    ("limit_max", "limit boundary (200)",
     {"where": "market_cap > 0", "limit": "200"}),
    ("offset_page", "offset pagination",
     {"where": "market_cap > 0", "order_by": "-market_cap", "limit": "5", "offset": "5"}),
    ("include_query_values", "include_query_values on structured query",
     {"where": "roe[2024] > 0.2", "order_by": "-roe[2024]", "limit": "5", "include_query_values": "true"}),
    # --- natural language (3 credits each) ---
    ("nl_basic", "q natural language (3 credits)",
     {"q": "top 5 technology companies by revenue in 2024"}),
    ("nl_latest_fy", "q 'latest' → smart FY handling (3 credits)",
     {"q": "5 banks with the highest ROE in the latest year", "include_query_values": "true"}),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for name, cap, params in TESTS:
        st, data = call(params)
        with open(os.path.join(OUT, f"{name}.json"), "w") as f:
            json.dump({"_status": st, "_params": params, "data": data}, f, indent=2, ensure_ascii=False)
        total = (data.get("pagination", {}) or {}).get("total_count") if isinstance(data, dict) else None
        showing = len(data.get("results", [])) if isinstance(data, dict) else 0
        err = data.get("error") or data.get("_body") if isinstance(data, dict) else None
        sample = ",".join(r.get("symbol", "?") for r in (data.get("results", [])[:3] if isinstance(data, dict) else []))
        rows.append((name, cap, st, total, showing, sample, err))
        flag = "OK " if st == 200 else f"!{st}"
        tail = f"total={total} showing={showing} [{sample}]" if st == 200 else f"ERR {str(err)[:70]}"
        print(f"[{flag}] {name:22} {tail}")
        time.sleep(0.25)
    ok = sum(1 for r in rows if r[2] == 200)
    print(f"\n{ok}/{len(rows)} OK. Responses -> responses/screener/")
    with open(os.path.join(OUT, "_summary.json"), "w") as f:
        json.dump([dict(zip(["name", "capability", "status", "total_count",
                             "showing", "sample", "error"], r)) for r in rows], f, indent=2)


if __name__ == "__main__":
    main()
