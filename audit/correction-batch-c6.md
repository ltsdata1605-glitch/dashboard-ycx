# Batch C6 — merge và offline replay của lịch sử thuế

Toàn dự án PARTIAL. Hash đầu batch1.359 file khớp C5 (`evidence/c6-initial-delta.json`). ZIP checkpoint và manifest đã xác minh tại `evidence/c6-checkpoint.zip`/`c6-checkpoint-manifest.json`. Không thay dữ liệu production, Firebase permissions/auth, công thức, API hoặc quy tắc tên/tháng. Không push/deploy.

## Nguyên nhân và thay đổi

CORR-010: `getAllRecords` lưu lần lượt từng bản cloud trước khi dedup. `save` mới có hành vi overwrite theo tên/tháng và giữ ID local. Vì vậy các candidate khác createdAt có thể cùng ID; cleanup dựa trên candidate bị loại xóa luôn bản mới đã được lưu. Cloud cũ cũng có thể ghi đè local mới trước khi chọn winner. Mock append-only cũ không tái hiện được lỗi này.

C6 chọn winner theo thứ tự createdAt mới nhất trước khi ghi, giữ cách ưu tiên cloud khi cùng createdAt như trước. Chỉ persist cloud winner chưa có local; lỗi persist giữ local fallback. Cleanup chỉ nhìn ID từ snapshot local và không xóa ID trong danh sách được giữ. Không dùng ID cloud để xóa local. Không thay định nghĩa isSameTaxRecord.

Offline replay trước đây chỉ thay theo createdAt, khác online save còn thay theo tên/tháng; ghi đè lúc offline để lại bản cloud cũ. Helper nội bộ `replaceCloudRecord` dùng chung cho hai đường; không tạo API mới.

## Evidence từng file

| File | Review và thay đổi | Giới hạn |
|---|---|---|
| features/tax-calculator/services/taxSyncService.ts | Đọc lại toàn bộ; traced getAll/save/outbox; sửa chọn winner trước persist và dùng chung replacement | Multi-tab race, lỗi localStorage/quota, fallback offline branch và các mutation khác chưa toàn diện |
| features/tax-calculator/services/taxIndexedDbService.ts | Đọc lại toàn bộ để xác nhận overwrite/ID/commit contract; không sửa C6 | delete/updateMonths/clearAll vẫn cần commit/abort tests |
| tests/unit/tax-merge-overwrite.test.ts (mới) |6 test service thật + boundary overwrite model: local/cloud mới/cũ, cloud order, failed save fallback, offline replay | Mock cloud và IDB; không phải production |
| tests/e2e/tax-merge-storage.spec.ts (mới) |4 integration cases service thật + native IDB; chỉ stub modules Firebase qua route; fresh profile và external proxy đóng | Chromium; không Firebase emulator/production; không UI journey |
| tests/e2e/tax-storage-atomicity.spec.ts |Đọc lại, chạy3 test C5 không sửa | save add/put commit/abort, không toàn bộ IDB API |
| tests/unit/audit-gd2c-tax-identity.test.ts |Đọc lại mock append-only để xác định lỗ hổng coverage; chạy4 test cũ | Mock này không đủ riêng cho merge overwrite |

Trace consumer giữ nguyên: taxIndexedDbService.save có2 callsites trong taxSyncService; TaxCalculatorView gọi history refresh/save. Không suy ra UI hoàn tất từ service tests. Design migration không thay trong C6.

## Before/after và regression

- `npx vitest run tests/unit/tax-merge-overwrite.test.ts --reporter=json --outputFile=audit/evidence/c6-before.json`: **1 PASS/5 FAIL**. Bốn ca merge trả winner nhưng local rỗng; retry cloud trả `[2,1]` thay vì chỉ bản mới `[2]`. Giữ đầy đủ evidence FAIL.
- Targeted5 unit files (merge-overwrite, audit-gd2c-tax-identity, audit-d11-tax-hang-cho, tax-sync-giao-dich, tax-deduplicate-overwrite): **23 PASS**, `c6-unit-final.json`.
- `AUDIT_PORT=5197 npx playwright test --config audit/evidence/c6-playwright.config.mjs`: **7 PASS**, `c6-storage.json`. Native IDB4 merge scenarios +3 commit/abort C5. Boundary Firebase được xác nhận interception có hit; không phát sinh kết nối Firebase thật.
- `npm run test:unit -- --reporter=json --outputFile=audit/evidence/c6-full-unit.json`: **1.490 PASS,4 SKIPPED,0 FAIL**. Tổng1.494 tests. Các skip giữ nguyên, không đổi thành PASS. JSON suite count bao gồm describe nesting; số test files lấy từ testResults riêng.
- Safety: tái sử dụng phạm vi local Vitest đã chạy ở C2, config node/exclude functions và scraper; test mới chỉ memory/mock hoặc local browser fixture. Không chạy deploy/check script có tác dụng phụ. Các suite credentials/service/device chưa có môi trường vẫn BLOCKED.
- Typecheck/ESLint/ratchet check-only/build logs C6, kết quả cuối tại test-results.md.

## Remaining

CORR-010 vẫn OPEN cho mutation commit/abort ngoài save; quota/localStorage và multi-tab; privacy UI delta. CORR-009 WebKit journey sau import vẫn OPEN (C5 Option+Tab trước import PASS không thay acceptance sau import). Full file/module/surface, shared controls, design migration, dead-code exports/assets/CSS/dependencies và physical-device/performance vẫn chưa hoàn tất. C6 không xóa dead code hoặc bật dark mode.

Chốt C6:173 file Vitest;1.490 PASS/4 SKIPPED/0 FAIL. Typecheck-final, ESLint, ratchet check-only và build exit0. Source changes chỉ taxSyncService.ts và2 regression files mới; source hash trước/sau tại c6-source-changes.csv. Toàn working tree (kể cả sửa đổi có trước) ở correction-changed-files.txt.
