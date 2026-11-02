# C27 — Nhãn Switch bộ lọc bảng tổng quan: PARTIAL

Root cause: nhãn siêu thị có onClick riêng nhưng không có htmlFor; Switch cạnh nhãn không có id nên không có accessible name. Shared Switch và BI wrapper đã hỗ trợ id, không cần đổi API. SummaryTableView dùng useId cho prefix riêng instance, nối label htmlFor với Switch id, bỏ handler trùng trên label và giữ callback lọc hiện tại. Không đổi tính toán, hợp đồng API, authentication hoặc dữ liệu production.

Nguồn thay đổi: `features/bi-dashboard/components/dashboard/SummaryTableView.tsx`, `tests/e2e/helpers/materialHarness.html`, thêm `tests/e2e/summary-switch-labels.spec.ts`. Checkpoint trước sửa ZIP+SHA tại evidence/c27-checkpoint.zip/.json. Hash delta từng file: c27-source-changes.csv. Review notes từng file: evidence/c27-file-review-notes.json. Dashboard.tsx 545–592 và DashboardHeader.tsx 150–170 chỉ đọc wiring/portal; không nâng thành full review. Consumer references: evidence/c27-summary-consumers.txt.

## Kiểm thử và giới hạn

- Before: `AUDIT_PORT=5198 AUDIT_RUN=before npx playwright test --config audit/evidence/c27-playwright.config.mjs`: **2 FAIL** đúng thiếu tên Switch, giữ c27-before.json/.txt.
- After: cùng lệnh với AUDIT_RUN=chromium: **2 PASS**; thêm AUDIT_ENGINE=webkit AUDIT_RUN=webkit: **2 PASS**. Hai chiều rộng390/1366, actual React SummaryTableView, dữ liệu giả AUDIT A/B, local IndexedDB trong profile mới, proxy ngoài bị chặn. Native label click ẩn dòng một lần, click Switch hiện lại; for/id trùng và role/name/checked đúng. Không phải full dashboard production E2E.
- `npx vitest run features/bi-dashboard/services/summaryTableCalc.test.ts --reporter=default --reporter=json --outputFile=audit/evidence/c27-unit.json`: **22 PASS**, không skip. Đã đọc đầy đủ 400 dòng test trước chạy. Không đổi công thức; test không thay acceptance nghiệp vụ độc lập.
- `npx eslint features/bi-dashboard/components/dashboard/SummaryTableView.tsx tests/e2e/summary-switch-labels.spec.ts`: PASS.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS11.13s.
- Đã xem ảnh Chromium390 và WebKit1366. Panel trong viewport. Ảnh WebKit ban đầu chụp giữa transition; đổi screenshot animations=disabled và chạy lại cả hai engine, vẫn PASS. Ảnh không chứng minh full table layout, tất cả states, contrast hay screen reader.

Đây là viewport nhỏ trên engine local, không thiết bị iPhone hoặc touch journey. Physical Safari/real services BLOCKED do không có phiên thiết bị/credentials an toàn. CORR-023 vẫn OPEN cho các consumer BI khác. Tiếp tục CompetitionView/IndustryView và các consumer trong migration matrix; token/panel semantics, sort keyboard, search/reorder, column IDs/multiple instances và full lifecycle IndexedDB còn pending. Không xóa dead code trong batch.

## Coverage

1.371 INCLUDED =1.165 NO +12 PREFLIGHT_ONLY +194 PARTIAL; verified YES0. Component426 NO/41 PARTIAL; module16 NO/13 PARTIAL; screen167 NO/4 PARTIAL. Mọi reviewed vẫn PARTIAL theo evidence, không biến unit execution thành full review. Đối soát hash và inventory mismatch0; không quét lại dependency/generated trees. Nguồn evidence/c27-current-coverage.json và c27-final-reconciliation.json. Toàn dự án PARTIAL, không push/deploy.
