# Batch C5 — dữ liệu lịch sử thuế và WebKit focus

Toàn dự án PARTIAL. Checkpoint ZIP + manifest `evidence/c5-checkpoint.*`, `c5-checkpoint-manifest.json`. Hash đầu batch của1.358 file khớp C4 (`c5-initial-delta.json` rỗng). Không quét lại generated/dependency trees. Không push/deploy hoặc dùng dữ liệu production.

## CORR-010: hai lỗi kỹ thuật đã tái hiện và sửa

1. `taxSyncService.saveRecord` loại bản cloud theo `r.id !== localId`: hai máy có cùng khóa tự tăng nhưng khác bản ghi. Test mới trên service thật với Firestore/IndexedDB mock chứng minh bản cloud khác biến mất (1 FAIL/3 PASS trước sửa). Loại điều kiện so id cục bộ; giữ nguyên identity createdAt và quy tắc tên/tháng hiện có. Không đổi API, công thức, permissions hoặc quy tắc nghiệp vụ.
2. `taxIndexedDbService.save` resolve từ request success, trước transaction complete. Test trên IndexedDB thật của Chromium, profile mới, abort transaction tại success của add/put: dữ liệu rollback nhưng Promise báo resolved (2 FAIL/1 PASS trước sửa). Chỉ resolve ở `tx.oncomplete`, reject ở abort/error. Sau sửa3/3 PASS gồm thêm mới abort, overwrite abort và overwrite commit giữ ID.

17 unit tests PASS: identity xuyên thiết bị4, hàng chờ3, concurrent transaction4 và helper dedup6. Đây là service test với mock cloud, không xác thực production/Firebase emulator. Native IndexedDB test không import Firebase; fixture local, external proxy đóng. Injection chỉ vào boundary transaction để tạo abort thực, không tạo DOM giả.

## Review theo file

| File | Nội dung đọc và evidence | Còn thiếu |
|---|---|---|
| features/tax-calculator/services/taxSyncService.ts | Đọc toàn bộ; trace save/getAll/outbox/delete/update và ID contract; sửa1 điều kiện cloud filter | Merge dedup load-time deletion; queue overwrite khác createdAt; xác thực cloud thật |
| features/tax-calculator/services/taxIndexedDbService.ts | Đọc toàn bộ; save chỉ có2 callsites trong taxSyncService; sửa completion handlers | delete/updateMonth/updateMonths/clearAll cũng resolve trước commit, chưa test/sửa batch này |
| features/tax-calculator/services/taxHistoryGrouping.ts | Đọc toàn bộ matching/grouping; helper6 test PASS | Tên trùng, tháng malformed/fallback createdAt cần acceptance riêng |
| features/tax-calculator/types/tax.types.ts | Đọc đầy đủ SavedTaxRecord và các input/result types để kiểm contract | Không thẩm định luật/công thức từ type/comment |
| tests/unit/audit-gd2c-tax-identity.test.ts | Đọc đầy đủ mock/3 test cũ; thêm regression save collision | Mock save chỉ append, không tái hiện overwrite thật |
| tests/unit/audit-d11-tax-hang-cho.test.ts | Đọc đầy đủ, cloud offline switch/local memory;3 PASS | Fixture thiếu name nên chưa phủ dedup mới |
| tests/unit/tax-sync-giao-dich.test.ts | Đọc đầy đủ transaction mock;4 PASS | Chưa chứng minh Firebase concurrency thật |
| tests/unit/tax-deduplicate-overwrite.test.ts | Đọc đầy đủ;6 PASS | Chỉ helper, không transaction |
| tests/e2e/tax-storage-atomicity.spec.ts (mới) |3 test native IDB + fault boundary local; before/after | Chromium, chưa engine/device khác |
| tests/e2e/navigation-material.spec.ts | Đọc toàn bộ; bổ sung log/attachment chuỗi phím và AUDIT_FOCUS_KEY cho chẩn đoán | Default vẫn Tab; không bỏ assertion focus/outline/clipping |

Các file source đọc có kiểm tra cục bộ vẫn PARTIAL; không nâng verified YES. TaxCalculatorView/TaxResultPanel và E2E privacy ngoài C4 vẫn chưa full review, không được kế thừa PASS.

## CORR-009 WebKit

Giữ nguyên FAIL C4. C5 lượt Tab có instrumentation bị timeout60s trong page.evaluate, chưa lưu đủ sequence: `c5-webkit-tab.json`. Không gọi lỗi timeout này là cùng root cause với C4, không tăng timeout để che lỗi. Thử riêng Option+Tab bằng phím thật, không programmatic focus, nhằm phân biệt keyboard policy với clipping; kết quả chốt ở test-results.md.

## Commands và evidence

- `npx vitest run tests/unit/audit-gd2c-tax-identity.test.ts --reporter=json --outputFile=audit/evidence/c5-unit-before.json` →3 PASS/1 FAIL.
- `npx vitest run tests/unit/audit-gd2c-tax-identity.test.ts tests/unit/audit-d11-tax-hang-cho.test.ts tests/unit/tax-sync-giao-dich.test.ts tests/unit/tax-deduplicate-overwrite.test.ts --reporter=json --outputFile=audit/evidence/c5-unit-final.json` →17 PASS.
- `AUDIT_PORT=5197 AUDIT_RUN=storage-before|storage-final npx playwright test --config audit/evidence/c5-playwright.config.mjs tax-storage-atomicity.spec.ts` →trước1 PASS/2 FAIL; sau3 PASS.
- `AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit-tab npx playwright test --config audit/evidence/c5-playwright.config.mjs navigation-material.spec.ts -g 'keyboard focus'` →FAIL timeout.
- Lượt Option+Tab đặt thêm `AUDIT_FOCUS_KEY=Alt+Tab`, output riêng `webkit-option-tab`.
- Typecheck/ESLint/ratchet check-only/build logs `c5-*.txt`, kết quả chốt ở test-results.md.

## Remaining acceptance

CORR-010 chỉ giải quyết2 lỗi đã chứng minh; chưa đóng toàn bộ finding. Đáng chú ý getAllRecords gọi save có thể overwrite và sau đó delete removedIds; cần integration với local/cloud cùng tên-tháng và ID survivor trước khi coi an toàn. Queue replay dùng createdAt trong khi online save còn dùng tên/tháng, cần kiểm tính tương đương. Bảo toàn delta ngoài audit; chưa tự quyết thay quy tắc identity/riêng tư. Full regression, dead code, controls/consumer review, performance và physical Safari còn thiếu. Credentials/services/device không có môi trường: BLOCKED.

### C5 WebKit follow-up — kết luận phạm vi
Trước nhập dữ liệu: Tab80 bước đều BODY → FAIL; cùng app/profile setup, Option+Tab đi qua13 controls tới font → PASS outline solid2px offset2px và0 clipping ancestors. `c5-webkit-empty.json` / `c5-webkit-empty-option.json`; screenshot `webkit-empty-option-system-focus.png` đã xem. Kết quả đối chiếu phù hợp với policy keyboard của engine trong môi trường local, không phải bằng chứng nút font không thể nhận focus. Giữ CORR-009 OPEN cho journey sau nhập (export overlay xuất hiện trong ảnh timeout) và Safari thiết bị thật. Không sửa app hay default Tab test để biến FAIL thành PASS. Typecheck-final exit0 sau chỉnh diagnostics; diff-check các file C5 PASS.
