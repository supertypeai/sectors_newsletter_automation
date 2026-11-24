-- name:         idx-filings-for-symbol
-- computes:     every insider / major-holder transaction filing for one IDX symbol,
--               oldest first, with holder, direction, shares, price, value and the
--               before/after holding and percentage as filed
-- universe:     a single IDX symbol, {{symbol}}, rows in idx_filings
-- window:       full history held in idx_filings, no date filter
-- exclusions:   none; duplicate filings (same holder, date, shares) are returned as
--               filed so the caller can see and collapse them openly
-- survivorship: not applicable, single symbol, filings as filed
-- statistic:    raw filings, no aggregation
-- approved:     2026-09-25, Evelyn
-- used by:      TRUK block-trade chain (Pukul Rata Kanan, Sep 2026)
-- note:         symbols carry the .JK suffix, e.g. 'TRUK.JK'
select f.id,
       f.timestamp::text as filed_at,
       f.holder_name,
       f.holder_type,
       f.transaction_type,
       f.amount_transaction,
       f.price,
       f.transaction_value,
       f.holding_before,
       f.holding_after,
       f.share_percentage_before,
       f.share_percentage_after,
       f.share_percentage_transaction,
       f.price_transaction,
       f.idx_investor_slug,
       f.idx_conglomerates_group_slug,
       f.source,
       f.source_is_manual
from idx_filings f
where f.symbol = '{{symbol}}'
order by f.timestamp asc, f.id asc
