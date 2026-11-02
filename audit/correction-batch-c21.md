# C21 — Shared feedback accessibility: PARTIAL

## Thay đổi và nguyên nhân

- `components/shared/ui/ProgressBar.tsx`: label nhìn thấy chưa làm tên trợ năng; aria value raw không khớp thanh đã clamp; max0 tạoNaN. Thêm optional `aria-label` để consumer đặt tên khi nhãn nằm ngoài; fallback dùng visible label. Dùng max hữu hạn dương (invalid fallback100), value hữu hạn clamp0..max cho rendering/ARIA. Không thay giá trị caller/công thức nghiệp vụ. Caller không cung cấp label/name vẫn cần review.
- `features/bi-dashboard/components/nhanvien/shared/TimeProgressBar.tsx`: thêm tên Quỹ thời gian, giữ toàn bộ phép tính. Fixture custom15/30 vẫn50%. Phát hiện riêng `||` defaults có thể không nhận giờ/phút0 và realtime label cố định; chưa thay vì cần business-contract review.
- `components/shared/ui/Banner.tsx`: useId nối nút disclosure tới body và aria-expanded phản ánh state; thêm maxLines vào dependency đo clamp. Giữ nội dung/màu/callbacks.
- `tests/e2e/helpers/materialHarness.html`: thêm React feedback fixture và real TimeProgressBar.
- Thêm `tests/e2e/shared-feedback-controls.spec.ts`:4viewport-case kiểm tên/ARIA và2Banner độc lập, Enter/Space thực,390/1366.

Đọc8file đầy đủ +1file metricService chỉ đoạn130–190; ghi từng file trong `evidence/c21-file-review-notes.json`. `DashboardWidgets.ProgressBar` riêng hiển thị phần vượt100%, giữ nguyên, không thay chỉ để giảm duplication. Source consumer refs ở `evidence/c20-feedback-consumers.txt`. Các màn consumer chưa được full runtime verification.

Checkpoint trước sửa4file đã tồn tại trong `evidence/c21-checkpoint.zip` và manifest; spec mới chưa tồn tại. Không push/deploy, không gọi production, không sửa auth/API backend/formulas.

## Test evidence

Command: `AUDIT_PORT=5198 AUDIT_RUN=<run> [AUDIT_ENGINE=webkit] npx playwright test --config audit/evidence/c21-playwright.config.mjs`.

- before:4FAIL ở missing accessible name/aria-expanded; giữ logs/json/trace.
- chromium:4PASS tại390/1366.
- webkit:4PASS tại390/1366. Keyboard dùng Option+Tab, không phải defaultTab acceptance; không programmatic focus.
- `npx vitest run features/bi-dashboard/services/metricService.test.ts`:6PASS, pure local tests.
- ESLint4file, `npx tsc --noEmit`, `npm run build`, scoped diffcheck:PASS; build23.82s, logs lưu cùng prefixC21.
- Đã xem screenshot Chromium390/1366 và WebKit390: nội dung expanded đọc đủ, focus ring nhìn thấy, banner thứ2 vẫncollapsed. Đây là scoped fixture visual, không phải mọi app screen.

8final platform-case executions,4viewport cases/2logical scenarios. WebKit390 không iPhone thật. Screenreader/contrast/touch/zoom và all-consumer journeys chưa xác nhận. C19/C20 test counts không cộng thành số independent journeys.

CORR-023 vẫnOPEN cho BI Switch accessible names và follow-up; ProgressBar/Banner defects đã sửa theo scope này. V6/Phase4–6/LiquidGlass vẫnPARTIAL.

Coverage/hash: `evidence/c21-current-coverage.json`, `evidence/c21-final-reconciliation.json`, `c21-source-changes.csv`. Không nâng verified YES.
