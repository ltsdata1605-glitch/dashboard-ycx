# C37 — DataTable responsive width — PARTIAL

## Root cause và sửa

Đọc đầy đủ DataTable366lines/tableScrollCue111lines, các test/harness cũ và TouchTitleHint116lines; notes riêng từng file tại `evidence/c37-file-review-notes.json`. Truy consumer tại `evidence/c37-consumers.txt`. Hai consumer ứng dụng tìm thấy: SupermarketConfig và BiSupermarketMapAdmin; chỉ đọc khu vực khai báo/callsite, không nhận full review cho hai file lớn. Chưa tìm thấy hideMobile trong hai consumer đó; lỗi được tái hiện qua tổ hợp props hợp lệ của shared component, không khẳng định đang xảy ra trên màn production.

`fixedMinWidth` cộng cả cột đã bị hideMobile ẩn. Ở390px, bảng800px/ô ghim400px lớn hơn khung356px Chromium hoặc350px WebKit; cuộn cuối khiến ô ghim lệch44/50px. Sửa tổng chỉ gồm cột đang hiện, memo phụ thuộc isDesktop. Sau sửa bảng400px/ô ghim200px, desktop giữ800px. Không sửa dữ liệu/sort business; giữ compact, opaque table và ngoại lệ rounded-none của BiSupermarketMapAdmin.

Files thay đổi: `components/shared/ui/DataTable.tsx`, `tests/e2e/helpers/materialHarness.html`, mới `tests/e2e/data-table-foundation.spec.ts`. SHA: `c37-source-changes.csv`; bản trước sửa ZIP/SHA tại `evidence/c37-checkpoint.*`.

## Kiểm thử và giới hạn

- Baseline Chromium3PASS1FAIL, WebKit3PASS1FAIL. Giữ `c37-before.json/.txt` và `c37-before-webkit.json/.txt`; assertion sticky không bị nới.
- `AUDIT_PORT=5198 AUDIT_RUN=chromium npx playwright test --config audit/evidence/c37-playwright.config.mjs`:5PASS.
- Cùng lệnh với `AUDIT_ENGINE=webkit AUDIT_RUN=webkit`:5PASS.
- Ca kiểm tra: native Tab/Enter/Space sort cycle, group colSpan, loading/empty/data, sticky header/cell, cue bật/tắt theo scroll, không tràn document, chuyển1366→390→1366. Geometry logs trong c37-{chromium,webkit}.txt.
- ESLint DataTable/spec, `npx tsc --noEmit`, `npm run build`:PASS;build11.11s; scoped diff-check PASS.
- Fullunit gần nhất C36:1490PASS4SKIPPED, không chạy lại hoặc đổi nhãn thành C37.
- Đã xem ảnh Chromium390/WebKit1366: bảng nằm trong khung, dữ liệu đọc được, viền bo và cue hiển thị. Nút loading/empty/data bên ngoài chỉ là fixture controls.

React fixture thực với dữ liệu tổng hợp; không production BI, không Safari iPhone thật. Actual BI saves, rowclick keyboard contract, nested header actions, screenreader, contrast/zoom, loading announcement, dynamic reparent của scrollcue, export clone/performance còn pending. Test cũ synthetic DOM touch-hint được ghi nhận không đủ chứng minh React journey; không xóa test/assertion. TouchTitleHint có rủi ro suppression sau cancel cần tái hiện, chưa kết luận bug.

## Đối soát

1378 INCLUDED=1138NO12PREFLIGHT_ONLY228PARTIAL;verifiedYES0;component402NO65PARTIAL;module16NO13PARTIAL;screen165NO6PARTIAL. Hash/inventory mismatches0 (`evidence/c37-final-reconciliation.json`). CORR-034 resolved scoped. Toàn dự án PARTIAL, không push/deploy.
