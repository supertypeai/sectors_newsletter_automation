-- name:         idx-latest-filings
-- computes:     the most recent {{n}} insider / major-holder filings across all IDX symbols, newest first
-- universe:     idx_filings, names from idx_company_profile
-- window:       none, ordered by filing timestamp
-- exclusions:   none; duplicates and multi-leg trades are returned as filed
-- survivorship: not applicable
-- note:         symbols carry the .JK suffix; transaction_type is buy or sell
-- approved:     2026-10-14, user confirmed at the execute_sql prompt
-- used by:      news page mockup, Key filings block
select f.timestamp::text as filed_at, f.symbol, c.company_name, f.holder_name, f.holder_type, f.transaction_type,
       f.amount_transaction, f.price, f.transaction_value, f.share_percentage_before, f.share_percentage_after
from idx_filings f left join idx_company_profile c on c.symbol = f.symbol
order by f.timestamp desc, f.id desc
limit {{n}};
