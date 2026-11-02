# C24 — Font stylesheet retry: PARTIAL

CORR-026 resolved within stylesheet request scope. `googleFonts.ts` previously marked families loaded before network success, retained failed links, and emitted duplicate family params for duplicate caller names. Separate global pending/success Sets now deduplicate inflight and successful loads; error removes failed link/pending entries, allowing next call to retry. Success records stylesheet completion. Existing font list/defaults, void API and lazy loading preserved. No live Google calls.

Changed source: `components/shared/ui/googleFonts.ts`, `tests/e2e/helpers/materialHarness.html`; added `tests/e2e/google-font-retry.spec.ts`. Prechange checkpointZIP+SHA at evidence/c24-checkpoint.*. Read scope per file: evidence/c24-file-review-notes.json. Consumer FontSelector/FontPickerSheet and StickerPrinter wiring reviewed, not fulljourney acceptance. index.tsx reviewed only startup import/call.

`AUDIT_PORT=5198 AUDIT_RUN=<run> [AUDIT_ENGINE=webkit] npx playwright test --config audit/evidence/c24-playwright.config.mjs`: before1FAIL, finalChromium1PASS +WebKit1PASS. Actualloader called from ReactButton; request abort/fulfill mocks only networkboundary. Gate verifies pendingdedup, native link.sheet readiness verifies CSS success before repeat. Localfont creates no extra request. No synthetic onload events. One logicalscenario across2engines, not2userjourneys.

TargetedESLint,tsc noEmit,productionbuild10.66s,scopeddiffcheckPASS. FullunitC22 remains prior evidence; not rerun this narrow loader fix. No new design visual claim, physicaliPhone/actualfontglyphdownload/never-finishing request/fullfontselectorjourney pending. No business/auth/productiondata/deploy/push changes.

Latest coverage/hash: evidence/c24-current-coverage.json and c24-final-reconciliation.json; delta c24-source-changes.csv. V6 remains PARTIAL,verifiedYES0.
