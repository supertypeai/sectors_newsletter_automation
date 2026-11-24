-- slug: entity-symbol-coverage
-- approved: 2026-09-01
-- returns: every conglomerate and every person carrying at least one ticker, with
--   entity_type ('conglomerate'|'person'), entity_name, slug, and the symbols array
--   (suffixed .JK / .SI). Used to audit whether a given group-to-ticker mapping is
--   fully represented in the ownership tables.
SELECT 'conglomerate' AS entity_type, name AS entity_name, slug, symbols
FROM conglomerates
UNION ALL
SELECT 'person' AS entity_type, investor_name AS entity_name, slug, symbols
FROM people
WHERE symbols IS NOT NULL AND array_length(symbols, 1) > 0
ORDER BY entity_type, entity_name
