# C31 — CompetitionView named Switch: PARTIAL

Đọc đủ CompetitionView571dòng, competitionViewCalc và useCheckThuongBonus; re-read DashboardWidgets. Nội dung từng file evidence/c31-file-review-notes.json; consumer refs evidence/c31-switch-consumers.txt chỉ là references, không fullreview những file khác. ShortenName/helper chỉ snippets, không nâng status.

Root cause: chương trình và cột dùng cả div onClick cùng Switch nhưng Switch không có accessible name. Thêm optional label vào BI wrapper, forward tới sharedSwitch; CompetitionView truyền tên chương trình và nhãn cột. Giữ callback/onClick và shared stopPropagation để không bật/tắt hai lần; không biến row thành label làm thay hành vi. Các consumer dùng id vẫn tương thích; employee consumers chưa tự được đặt tên.

Source thay đổi: features/bi-dashboard/components/dashboard/CompetitionView.tsx; features/bi-dashboard/components/dashboard/DashboardWidgets.tsx; tests/e2e/helpers/materialHarness.html; thêm tests/e2e/competition-switch-labels.spec.ts. ZIP+SHA trước sửa evidence/c31-checkpoint.zip/.json; delta c31-source-changes.csv.

## Tests

- `AUDIT_PORT=5198 AUDIT_RUN=before npx playwright test --config audit/evidence/c31-playwright.config.mjs`:2FAIL named Switch missing.
- Cùng config AUDIT_RUN=chromium hoặc AUDIT_ENGINE=webkit AUDIT_RUN=webkit:2PASS mỗi engine,390/1366, native Tab/Space và clickrow/clickSwitch/column toggle once.
- Mở rộng shared-wrapper consumers: `AUDIT_PORT=5198 AUDIT_RUN=consumers-chromium npx playwright test --config audit/evidence/c31-consumers.config.mjs`, thêm AUDIT_ENGINE=webkit AUDIT_RUN=consumers-webkit:9PASS mỗi engine (Summary2+Industry5+Competition2). Đây18platform executions của9cases, không18production journeys.
- `npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c31-unit.json`:1490PASS4SKIPPED0FAIL,172filesPASS1SKIPPED,12.27s. Skip giống C28. Không nâng reviewed các file chỉ vì suitePASS.
- ESLint3changed TSfiles PASS; tsc --noEmit PASS; npm run build PASS9.10s.

Fixture thực React realtime,2program dữ liệu giả,localIDB freshprofile,portal trước mount; useCheckThuongBonus enabled=false nên không fetchpayload/map; externalproxyblocked. Không productionauth/services/physicaldevice. C31 không chụp/accept visual Competition popup. C29sheet screenshots được consumer regression rerun, không chứng minh Competition layout.

CORR-023 giữ OPEN cho CompetitionSummaryView/CompetitionTab. CORR-030 mới OPEN: legacybonus fallback thiếu return khi không có settingsstore sau close/resolve; cần nativeIDB regression trước sửa. Không sửa công thức reward/revenue; không đổi dữ liệu production/push/deploy.

Coverage1373=1154NO12PREFLIGHT_ONLY207PARTIAL; verifiedYES0. Module16NO13PARTIAL,component419NO48PARTIAL,screen165NO6PARTIAL. Hash/inventory mismatch0; evidence/c31-current-coverage.json và c31-final-reconciliation.json. Toàn dự án PARTIAL.
