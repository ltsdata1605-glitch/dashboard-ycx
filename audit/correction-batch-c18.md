# C18 — dead-code entrypoints và audit isolation — PARTIAL

## Changes và evidence

Production source không thay đổi. Thêm `tests/e2e/audit-network-isolation.spec.ts` (inventory mới), audit-only configs `evidence/c18-vite.config.mjs` và `c18-playwright.config.mjs`. Không sửa vite.config.ts của sản phẩm. Audit server không có proxy forwarding, middleware trả403 cho `/api-line-proxy*`, HMR/watch tắt, cacheDir theo audit port ở temp. Proxy browser chặn external vẫn giữ từ baseline. Chạy server tuần tự; cấu hình này không áp dụng tự động cho persistent-profile helper.

`AUDIT_PORT=5198 AUDIT_RUN=isolated AUDIT_ISOLATED_SERVER=1 npx playwright test --config audit/evidence/c18-playwright.config.mjs`:11PASS Chromium (proxy guard1,competition4,per-store employees1,landscape2,sidebar3). Guard gọi `/api-line-proxy/__audit_noop__` và nhận exact403 marker; không dùng messaging action. Source cố định suốt run. `npx eslint tests/e2e/audit-network-isolation.spec.ts`, `npx tsc --noEmit`:PASS. Không claim physical Safari/production hoặc toàn bộ môi trường đã ổn định. CORR-019 còn31persistent-profile callers BLOCKED; CORR-020 nguồn reload ban đầu chưa chứng minh, run mới chỉ evidence cải thiện.

## Dead-code audit

Phân loại17candidate UNKNOWN theo từng file ở `evidence/c18-candidate-review.json`; source17entry đã đọc (riêng public/check-thuong.html chỉ review entry/reference, không3458lines). Đối chiếu references ở `evidence/c18-entry-references.txt`, skill links, historical reports. Công cụ không được import bởi app không mặc nhiên là code chết: có CLI/manual/reference entrypoints.

29candidates hiện có:20INTENTIONALLY_RETAINED,8POSSIBLE_DEAD,1LEGACY_ACTIVE. UNKNOWN0 chỉ áp dụng danh sách29candidate hiện tại; không đồng nghĩa toàn bộ code đã xét dead-code. Ba barrel feature vẫn POSSIBLE_DEAD; chưa đủ consumer/regression proof để xóa. Legacy Check Thưởng HTML vẫn có direct URL/test consumers dù app đã dùng React. LIFF có contract standalone và SDK/backend, deployment mapping ngoài hệ thống chưa xác minh.

Không chạy diagnostic scraper gọi retailer, scratch mở profile người dùng, inventory generator ghi đè ledger hay historical repro với assertion lỗi cũ. Không xóa file. Exports/assets/CSS/dependencies toàn kho vẫn pending.

## Surface reconciliation và finding

Inventory React AST bỏ sót standalone HTML surfaces. Bổ sung LIFFCouponCopy và LegacyCheckThuongHTML vào screen inventory + design matrix theo entrypoints đã đọc; không quét lại repository. Hai surface PARTIAL, chưa desktop/mobile/visual acceptance. Component count không đổi. LIFF inline dark branded styling là hiện trạng cần mapping, không bật dark mode toàn app.

CORR-021 OPEN: LIFF ghi sent flag trước response và fallthrough success khi request lỗi/timeout. Backend contract đã xem riêng branch mark-used (không full webhook review): success/updatedCount/alreadyUsed/revoked. C19 cần tái hiện và sửa feedback với mock SDK/backend, không gửi tin thật hoặc đổi API/nghiệp vụ. Review E2E hiện có3case happy/slow/alreadyUsed chưa cover failure.

Các module chỉ chuyển PARTIAL khi có scoped file review, không full module review. Chi tiết coverage/reconciliation: evidence/c18-current-coverage.json và c18-final-reconciliation.json. V6 vẫn PARTIAL; không push/deploy hoặc thay production data.
