# C30 — Industry tree expander semantics: PARTIAL

Root cause: icon-only tree Button chỉ chứa AppIcon trang trí, không có accessible name hoặc expanded state. Thêm aria-label theo Mở rộng/Thu gọn + displayName và aria-expanded. Giữ rowKey/toggleRow, click propagation và touch handler; không đổi filter, calculation hay API.

Hai source sửa: features/bi-dashboard/components/dashboard/IndustryView.tsx; tests/e2e/industry-switch-labels.spec.ts. Checkpoint ZIP/SHA evidence/c30-checkpoint.zip/.json; hash delta c30-source-changes.csv. Review focused trên renderCell và spec sau fullread C28; notes evidence/c30-file-review-notes.json.

Baseline `AUDIT_PORT=5198 AUDIT_RUN=before npx playwright test --config audit/evidence/c30-playwright.config.mjs`:4PASS1FAIL thiếu named expander. Final cùng config AUDIT_RUN=chromium và AUDIT_ENGINE=webkit AUDIT_RUN=webkit:5PASS mỗi engine. Bốn ca C29 giữ nguyên; thêm native Tab (WebKit Alt+Tab), Enter mở row, Space đóng row, name/state update. Không gọi DOMfocus. Dữ liệu giả localIDB/proxy ngoài blocked. Screenshot C29 paths được rerun với semantic-only C30; không có thay đổi visual.

ESLint source/spec và tsc --noEmit PASS. C29 build12.69s là lịch sử trước2aria attrs mới; không báo thành build C30. Không rerun fullunit sau semantic-only patch; latestfullunit C28=1490PASS4SKIPPED. Physical touch/drag/hitarea/screenreader và full Dashboard service journeys chưa được kiểm thử.

CORR-029 RESOLVED scoped keyboard/name/state; CORR-023 còn Switch ở CompetitionView/CompetitionSummaryView/CompetitionTab cần đọc đầy đủ và test consumer. Sort header keyboard, targetsize treebutton, fulltokens/contrast/performance vẫn pending. Không push/deploy, không đổi production.

Coverage1372=1157NO12PREFLIGHT_ONLY203PARTIAL; verifiedYES0. Module16NO13PARTIAL,component420NO47PARTIAL,screen166NO5PARTIAL. Hash/inventory mismatch0; evidence/c30-current-coverage.json, c30-final-reconciliation.json. Toàn dự án PARTIAL.
