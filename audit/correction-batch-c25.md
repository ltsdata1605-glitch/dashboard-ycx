# C25 — Shared Tabs states/targets: PARTIAL

Fullread Tabs4variants/SegmentTrack, center-strip helper, icon renderer and3case math test; consumer snippets traced in c25-tabs-consumers/context.txt (not fullconsumerfile review). New actualReact fixture/spec. Checkpoint c25-checkpoint.zip+manifest before edits.

Fix: underline/pills had onlydata-active, so selectedstate not announced; add aria-pressed preserving buttonrole, matching existingsegment/chips. sm/md desktopbreakpoint32/40px also applied to coarse landscape, so add pointer-coarse min44. Mouse desktopclasses unchanged; chips/segment kept. Source changed Tabs.tsx/materialHarness.html; new shared-tabs-states.spec.ts. No business/auth/formula changes.

Commands: `AUDIT_PORT=5198 AUDIT_RUN=<run> [AUDIT_ENGINE=webkit] npx playwright test --config audit/evidence/c25-playwright.config.mjs`.
Before6FAIL/2PASS preserved. After8ChromiumPASS +8WebKitPASS:4variantkeyboard/pressed/disabled cases +4coarse844x390size/variant cases. WebKit keyboard Option+Tab, not defaultTab or physicalSafari proof.3unitcenter-strip testsPASS, targetedESLint/tsc/build10.81s/scopeddiffcheckPASS. No new visualacceptance or allconsumerjourney proof. C22fullunit remains prior evidence.

CORR-027 resolvedscoped. Remaining: consumer visuals/contrast/focusclipping/RTL/dynamicwidths/physicaldevice. Matrix/coverage/testledger updated, latest c25-current-coverage and c25-final-reconciliation. OverallV6 PARTIAL,verifiedYES0.
