# C36 — SearchableSelect keyboard và shared controls — PARTIAL

## Nguyên nhân và thay đổi

Trigger chưa liên kết label; lựa chọn/giá trị tùy chỉnh là li có onClick nên không nhận thao tác bàn phím native. Chuyển các hành động sang shared Button, search sang shared Input; bổ sung label/expanded/controls/selected state, Escape đóng picker trước Modal và trả focus về trigger. Popup dùng rounded-popup; giữ nền opaque cho form, không áp Glass tùy tiện. Giữ lọc, clear, custom trim và callback hiện hữu; không sửa nghiệp vụ Gtdh.

File ứng dụng sửa: `components/shared/ui/SearchableSelect.tsx`. Fixture sửa: `tests/e2e/helpers/materialHarness.html`. Spec mới: `tests/e2e/searchable-select-keyboard.spec.ts`. SHA trước/sau: `c36-source-changes.csv`; checkpoint ZIP+SHA: `evidence/c36-checkpoint.zip`, `evidence/c36-checkpoint.json`.

Full source review thêm ConfirmDialog, GtdhTargetModal và đọc lại Input; evidence theo file tại `evidence/c36-file-review-notes.json`. Consumer references: `evidence/c36-consumers.txt`. WarehouseSettingsModal mới đọc import/declaration, không nhận full review. ConfirmDialog loading/onClose contract chưa runtime xác minh, không tự thay đổi.

## Kiểm thử

- Baseline: 4 FAIL (accessible name và custom action không có button role); giữ `evidence/c36-before.json/.txt`.
- `AUDIT_PORT=5198 AUDIT_RUN=chromium npx playwright test --config audit/evidence/c36-playwright.config.mjs`: 5 PASS.
- Cùng lệnh với `AUDIT_ENGINE=webkit AUDIT_RUN=webkit`: 5 PASS.
- `npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c36-unit.json`: 1.490 PASS, 4 SKIPPED; 172 test files PASS, 1 SKIPPED. Các skip giữ nguyên, không tính PASS.
- `npx eslint components/shared/ui/SearchableSelect.tsx tests/e2e/searchable-select-keyboard.spec.ts`, `npx tsc --noEmit`, `npm run build`: PASS; build9.20s. Logs c36-eslint/typecheck/build.txt.
- Scoped `git -c core.whitespace=cr-at-eol diff --check`: PASS.
- Đã xem ảnh Chromium390 và WebKit1366: trigger/popup nằm trong viewport, search focus rõ, lựa chọn đọc được. Các ảnh còn lại lưu `evidence/c36-select-*.png`.

Fixture mount React thật, thao tác bàn phím native (WebKit Alt+Tab); dữ liệu tổng hợp local, proxy bị chặn, không gọi context save. Không coi đây là production hoặc iPhone Safari thật. Gtdh target save, screen reader, zoom/keyboard viewport, clipping trong layout khác, contrast/performance và thiết bị thật còn thiếu.

## Đối soát

1.377 INCLUDED =1.143 NO +12 PREFLIGHT_ONLY +222 PARTIAL; verified YES0. Component406NO61PARTIAL;module16NO13PARTIAL;screen165NO6PARTIAL. Tất cả hash INCLUDED và fields inventory/ledger khớp: `evidence/c36-final-reconciliation.json`. CORR-033 resolved trong phạm vi kiểm thử. Các phase toàn dự án vẫn PARTIAL. Không push/deploy, không sửa production.
