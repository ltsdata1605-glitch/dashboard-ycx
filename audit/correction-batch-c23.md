# C23 — Public assets and startup: PARTIAL

47public PNG/SVG/font assets have individual SHA256, size, PNG dimensions, URL/basename references in `asset-audit.csv` and `evidence/c23-asset-references.json`. Reference/metadata review only; binary visual acceptance is NOT inferred.3images explicitly inspected (listed in asset matrix). Existing inventory retained, no generated/dependency rescan.9source/config entries have precise read scope in `c23-file-review-notes.json`; stickerPreviewStyles output truncated, correctly PARTIAL.

Asset classifications:38INTENTIONALLY_RETAINED,5UNKNOWN,3DUPLICATED,1POSSIBLE_DEAD. Three report-bi screenshots have identicalSHA256 despite different filenames; Roboto variablefont has only historical inventory reference. Keep all files; externalURL/retention/removal regression unresolved. Existing32deadcode candidates +9asset candidates =41:20retained12possible1legacy5unknown3duplicated. Assets retained38 are tracked separately, not counted as dead candidates.

CORR-025 P1 OPEN:8audit screenshots in public copied byte-identically into localdist. Inspected images contain personnel/report data. This establishes deployable-artifact exposure risk, not actual production hosting/access. No deletion, move, remote check or deploy performed. Resolve publication/retention contract before removal; preserve evidence.

CORR-026 OPEN: googleFonts marks Set before networkload, no failure cleanup; transient failure blocks laterretry. Full source read; next batch boundary regression/fix.

Command `AUDIT_PORT=5198 AUDIT_RUN=splash npx playwright test --config audit/evidence/c23-playwright.config.mjs`:3ChromiumPASS. Initial393x852DPR3 image comparison0.209% below existing0.3% threshold.2cases use staticentry/mockstandalone geometry;1case uses actual login rendered +splashremoved+demo button click. Not physicaliPhone or full demo journey. Existing test hardcodesChromium; no WebKit claim. No syntheticDOM used to claim Reactstate.

No source changes; C22fullunit/C21build retained as prior evidence, not rerun. Hash/inventory mismatch0; latest counts `evidence/c23-current-coverage.json`. OverallV6/Glass PARTIAL,verifiedYES0.
