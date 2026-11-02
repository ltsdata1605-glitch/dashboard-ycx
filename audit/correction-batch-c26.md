# C26 — Internal audit assets removed from public build: PARTIAL

User explicitly confirmed these8PNGs are internal audit material and authorized moving them under audit while retaining a copy. Moved `public/exports-audit/*.png` to `audit/evidence/internal-exports/` with original filenames. Preserved a second copy in `evidence/c26-public-exports-checkpoint.zip` using original paths; SHA manifest `c26-asset-moves.json` maps every file.

`npm run build`:PASS9.69s. Explicit artifact check:8originalpaths absent,8distpaths absent,8internalSHA match,8archiveSHA match; ZIP CRC valid. Evidence `c26-build-exclusion.json`. No application code/data calculations/auth changes; no remote data changes, push or deploy. Existing deployed copies, if any, remain unknown/unchanged; local fix does not claim removal from production.

CORR-025 resolved for repository/local build. Historical report contents not reclassified as correct or verified. Three identical screenshots retain DUPLICATED classification; five UNKNOWN purpose entries now INTENTIONALLY_RETAINED based on user-confirmed internal purpose. Dead candidate41=25retained12possible1legacy3duplicated. No DEFINITE_DEAD claim/deletion of evidence.

Inventory/ledger paths migrated in-place; scope count retained instead of artificially shrinking review scope. These8internal PNGs remain INCLUDED as explicit lineage exception to ordinary audit-evidence exclusion. public module files-8, audit+8. No other inventory rescanned. Counts/hash `c26-current-coverage.json`/`c26-final-reconciliation.json`; verifiedYES0. OverallV6 remains PARTIAL.

C26 post-change full unit rerun:1490PASS4SKIPPED0FAIL (172filesPASS1SKIPPED),8.63s. Same pre-existing3disabledLINE cases+1opt-in benchmark; no hidden failures. Evidence c26-unit.json/.txt; individual assertions appended test-execution-ledger.csv.
