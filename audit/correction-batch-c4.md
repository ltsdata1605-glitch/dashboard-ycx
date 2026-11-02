# Batch C4 — Floating chrome và focus hệ thống

Trạng thái toàn dự án: **PARTIAL**. Checkpoint trước sửa: `evidence/c4-checkpoint.zip`, hash tại `c4-checkpoint-manifest.json`. Không push/deploy, không chạy backup có side effect. Batch này không sửa nghiệp vụ, auth hoặc dữ liệu production.

## Lỗi tái hiện và sửa

- CORR-007: dock/navbar dùng màu và blur hardcode, không tuân theo reduced transparency. Đưa vật liệu vào token `floating-material-*`, `dock-material-*`, `navbar-capsule-*`; nền đặc khi giảm độ trong suốt/forced colors/không hỗ trợ backdrop. Giữ hai nhánh navbar (thông thường và Check thưởng data-thay-tieu-de), kích thước và vật liệu mặc định. Giữ cấu hình dark cũ, không bật dark mode.
- CORR-008: `overflow-hidden` ở HeaderSystemGroup cắt outline bàn phím. Class shared `ycx-control-group` giữ clipping khi bình thường, cho overflow visible khi focus-within. Áp dụng cho cả HeaderSystemGroup và TopBarGroup. Assertion Tab thật kiểm outline solid 2px, offset2px và ancestor clipping, không gọi focus giả.
- Hai test trước sửa FAIL tại `c4-before.json`; lượt sau sửa4/4 và lượt cuối5/5 Chromium PASS. Không đổi FAIL lịch sử thành PASS.
- WebKit local: 1 FAIL tại bước Tab không đến nút font sau80 bước (`c4-webkit-focus.json`). Chưa tới assertion clipping, nên không kết luận fix clipping thất bại hoặc đã đạt trên WebKit. CORR-009 OPEN: cần phân biệt cấu hình keyboard navigation của engine với lỗi app bằng trace. Không thay assertion, không đánh dấu SKIPPED hay PASS.

## Evidence từng file

| File | Đã đọc/review và thay đổi | Giới hạn |
|---|---|---|
| styles/tokens.css | Thêm component material/fallback token; bảo toàn màu/filter mặc định và dark overrides | Unsupported engine và hiệu năng vật lý chưa đo |
| styles.css | Review dock + cả hai selector navbar và shared group; đổi sang token | Không phải xác thực toàn bộ stylesheet |
| components/layout/MobileBottomNav.tsx | Đọc toàn file; bỏ border/shadow JSX trùng CSS token; nav/callback không đổi | MobileMoreSheet là lazy reference, không full review overlay |
| components/layout/MobileNavBar.tsx | Đọc toàn file, trace PageActionsBar/NotificationBell và hai capsule branch; không sửa JSX | Focus/notifications và toàn bộ page actions pending |
| components/layout/HeaderSystemGroup.tsx | Đọc toàn file, trace FontSelector/NotificationBell; sửa group clipping | Chưa full review FontPickerSheet, notification backend |
| components/shared/ui/TopBarActions.tsx | Đọc shared group; cùng focus-within policy; giữ material outer C3 | Test isolated và app analysis không bao phủ mọi consumer |
| tests/e2e/navigation-material.spec.ts | Test mới dùng app React, Excel fixture, profile mới, proxy ngoài đóng; desktop/mobile | CDP reduced transparency chỉ Chromium; WebKit focus FAIL |

Consumer trace: MobileBottomNav/MobileNavBar được render từ App; HeaderSystemGroup dùng ở TopBarActions (Header có import reference); TopBarActions consumers giữ danh sách C3 trong matrix. NotificationBell được đọc để kiểm ranh giới lazy dropdown, không nâng status toàn file. FontSelector mới đọc phần main button, không nâng review. MobileMoreSheet component/surface vẫn NO.

Ảnh đã xem: `c4-navigation-mobile.png`, `c4-check-thuong-capsule.png`, `c4-system-focus.png`. Mobile nền đặc đúng vùng chrome; desktop outline nút font nằm trọn khung. Ảnh focus chụp lúc nội dung nền đang chuyển trạng thái, chỉ dùng làm bằng chứng focus, không dùng duyệt visual toàn trang.

## Regression

- `AUDIT_PORT=5195 AUDIT_RUN=final npx playwright test --config audit/evidence/c4-playwright.config.mjs navigation-material.spec.ts glass-controls.spec.ts`: **5 PASS**. Shared controls390/1366; dock/general navbar reduced transparency và forced colors độc lập; Check thưởng reduced transparency; font focus desktop.
- `AUDIT_PORT=5195 AUDIT_RUN=compatibility npx playwright test --config audit/evidence/c4-playwright.config.mjs apple-tuong-thich.spec.ts`: **2 PASS**, mobile/laptop0 vi phạm. Profile và dữ liệu fixture local, không phải production verification.
- `AUDIT_PORT=5196 AUDIT_ENGINE=webkit AUDIT_RUN=webkit-focus npx playwright test --config audit/evidence/c4-playwright.config.mjs navigation-material.spec.ts -g 'keyboard focus'`: **1 FAIL**, nêu trên. WebKit không phải Safari iPhone thật.
- `npm run typecheck`, `npm run lint:eslint`, `npm run lint:ratchet:ci`, `npm run build`: PASS; logs `evidence/c4-{typecheck,eslint,ratchet,build}.txt`. Check-only không sửa baseline. Không chạy full unit lại cho thay đổi chrome CSS này; kết quả C2 là lịch sử, không chứng nhận delta thuế mới.
- Credentials/external services/thiết bị thật: **BLOCKED**, không có môi trường xác thực tương ứng trong batch.

## Hash delta ngoài C4

Reconciliation phát hiện7 file đã thay đổi ngoài5 source C4, không quy chúng thành thay đổi do batch này. Đã đọc đầy đủ git diff từng file dưới đây; giữ nguyên code và status review cũ. Hash hiện hành cập nhật để theo dõi, tested đánh dấu STALE. Diff chỉ là triage, không đủ chứng nhận toàn file.

| File | Delta quan sát | Cần kiểm tiếp |
|---|---|---|
| features/tax-calculator/TaxCalculatorView.tsx | Toast phân biệt overwrite | Hợp đồng kết quả save và lỗi cloud |
| features/tax-calculator/components/TaxResultPanel.tsx | Ba số tiền bỏ maskValue | Xác nhận ngoại lệ privacy và regression chế độ ẩn |
| features/tax-calculator/services/taxHistoryGrouping.ts | Normalize tên và trùng tên/tháng | Người trùng tên, tháng thiếu/không hợp lệ |
| features/tax-calculator/services/taxIndexedDbService.ts | save tìm trùng, put và delete thêm | Promise resolve trước transaction commit; abort/error regression |
| features/tax-calculator/services/taxSyncService.ts | Load khử trùng và delete local; save lọc cloud theo id/tên/tháng | Side effects khi đọc; local id giữa thiết bị; queue/retry và giữ dữ liệu |
| tests/e2e/tax-qr-and-export.spec.ts | Thêm assertion ngoại lệ ẩn số tiền | Safety review toàn suite và chạy local riêng |
| tests/unit/tax-sync-giao-dich.test.ts | Mock getAll trả mảng rỗng | Không chứng minh đường dedup/overwrite |
| tests/unit/tax-deduplicate-overwrite.test.ts (mới) | Đã đọc:6 case helper matching, không import Firebase/DB | Inventory mới NO; chưa chạy, không bao phủ transaction/cloud |

Không thực thi tác vụ thuế có thể tác động dữ liệu thật. CORR-010 OPEN ghi nhận regression cần bổ sung cho delta này; không suy diễn quyền sửa nghiệp vụ từ audit UI. `c4-source-changes.csv` phân biệt authored source và external delta bằng cột evidence. `c4-observed-delta.json` lưu hash trước/sau.

## Acceptance còn thiếu

Full file/module/surface review; shared controls còn lại; semantics/contrast/performance; engine không backdrop; từng consumer/journey; WebKit focus; thuế mới; dead-code26 candidate và exports/assets/CSS/dependency audit. Không xóa code dead trong C4. Không đóng Phase4–6/8 hoặc tuyên bố Liquid Glass complete.
