# C29 — Industry mobile filter dùng shared Modal sheet: PARTIAL

Root cause CORR-028: popup absolute right0 rộng92vw neo vào trigger nằm trước nút cột/export, vượt mép trái; ancestor overflow-hidden cắt nội dung. Đã đối chiếu Dropdown/MultiSelectDropdown/Overlay: không có API drop-in giữ nguyên hai nhóm, hai search và reset riêng. Dùng Modal/useIsSheetWidth hiện có trên màn<640; desktop giữ popup. Nội dung filter được dùng chung, không nhân đôi nghiệp vụ. Bỏ xử lý outside mousedown của ancestor đối với sheet portal; Modal xử lý backdrop/Escape/focus/scroll. Trigger có expanded/haspopup. Không thay shared implementation.

Source thay đổi: features/bi-dashboard/components/dashboard/IndustryView.tsx và tests/e2e/industry-switch-labels.spec.ts. Checkpoint ZIP/SHA evidence/c29-checkpoint.zip/.json; delta c29-source-changes.csv; notes từng file evidence/c29-file-review-notes.json. Giữ source dense table/business/auth/API, không push/deploy.

`AUDIT_PORT=5198 AUDIT_RUN=before npx playwright test --config audit/evidence/c29-playwright.config.mjs`:2PASS label cases +2FAIL geometry clipping390x844/568. Final cùng config AUDIT_RUN=chromium và AUDIT_ENGINE=webkit AUDIT_RUN=webkit:4PASS mỗi engine. Giữ hai tests cũ; hai tests mới thêm native Tab/Enter (WebKit Alt+Tab), sheet bounds, search cuối danh sách, đổi subgroup, Escape/return focus, reopen state, closebutton. Isolated actualReact consumer + localIDB + synthetic input; externalproxy blocked. Không phải real services/iPhone.

ESLint source/spec PASS; tsc --noEmit PASS; npm run build PASS12.69s. Không chạy lại fullunit không liên quan sau C28; C28 fullunit1490PASS4SKIPPED là bằng chứng lịch sử, không coi là re-run C29.

Đã inspect ảnh Chromium568 và WebKit844: sheet không cắt trái, header/closebutton ở trong viewport; body dài cuộn, test thao tác được nhóm cuối. Ảnh Chromium đầu chụp trước hai rAF usePresence nên chỉ thấy nền; giữ c29-sheet-chromium-568-opening-frame.png như evidence timing, bổ sung đợi computed transform identity rồi rerun cả hai engine. Không dùng ảnh openingframe làm visualPASS.

CORR-028 RESOLVED scoped mobile. Physical keyboard/iPhone safearea/zoom, desktop ancestor variants, orientation while open, full-dashboard/export/service journeys còn pending. C29 không đóng CORR-023, full Glass hay toàn bộ UI acceptance.

Coverage1372:1157NO12PREFLIGHT_ONLY203PARTIAL, verifiedYES0. Hash/inventory mismatch0; không quét generated/dependencies. Xem c29-current-coverage.json và c29-final-reconciliation.json.
