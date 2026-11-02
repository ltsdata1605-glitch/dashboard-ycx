# C20 — Shared controls: PARTIAL

Đọc đầy đủ 15 file được ghi riêng trong `evidence/c20-file-review-notes.json` (bao gồm spec mới). Consumer Switch được truy trong `c20-switch-consumers.txt`; đọc ngữ cảnh trong `c20-switch-context.txt`, không coi những đoạn này là full-file review. Giữ inventory/checkpoint cũ; chỉ hash scope INCLUDED. Checkpoint trước sửa: `c20-checkpoint.zip` + SHA manifest.

## Sửa lỗi và phạm vi

CORR-022: `.ycx-switch::after` dùng inset dọc cố định9px, phù hợp md26px nhưng sm20px chỉ có vùng chạm38px. Test React thật click ở tâm±21px tái hiện sm không đổi state. CSS chuyển sang inset tính theo44px, giữ visible sm36×20/md44×26 và quy ước màu hiện tại. Thay đổi lan tới shared consumers; chưa chứng minh mọi ancestor không clip hoặc mọi hàng dày không chồng vùng chạm.

Source thay đổi: `styles.css`, `tests/e2e/helpers/materialHarness.html`; thêm `tests/e2e/shared-selection-controls.spec.ts`. Fixture tạo React state thật, không chèn DOM để thay thế component. Không thay business/auth/backend/API, không gửi LINE, không push/deploy.

CORR-023 OPEN: ProgressBar label chưa nối accessible name, aria value chưa clamp và max0 có thể NaN; Banner disclosure chưa aria-expanded/controls; một số BI Switch consumer thiếu liên kết nhãn. Cần regression/contract review tiếp. SummaryTableHeader Switch chỉ để nhìn (aria-hidden/pointer-events-none/tabIndex-1) là ngoại lệ hợp lệ, giữ nguyên.

## Tests

Chạy `AUDIT_PORT=5198 AUDIT_RUN=<run> [AUDIT_ENGINE=webkit AUDIT_MOBILE=1] npx playwright test --config audit/evidence/c20-playwright.config.mjs`, server cô lập C18, profile mới, external proxy đóng.

- before Chromium:2PASS/1FAIL, lỗi target sm tái hiện.
- chromium sau CSS:3PASS. Hai target case đo390×844; case keyboard dùng desktop preset.
- webkit-390:2PASS/1FAIL tại Tab không focus button; các assertion sau focus chưa được thực thi trong run này.
- webkit-keyboard:3PASS tại390×844 sau dùng native Option+Tab (như Tooltip test đã có). Không `.focus()`, không xóa focus-ring assertion. Giữ log FAIL ban đầu, phân loại là khác biệt keyboard navigation của WebKit mặc định.
- `npx vitest run components/shared/ui/cnBoGoc.test.ts components/shared/ui/khongCongTacTuVe.test.ts`:4PASS/2files.
- targeted ESLint, `npx tsc --noEmit`, scoped `git diff --check`:PASS.
- Không chạy lại production build trong C20; C19 build là lịch sử trước thay CSS này.

Có3logical E2E cases,6final platform-case PASS; không phải6journeys độc lập. Coordinate input là mouse hit-test, WebKit viewport giả lập không phải physical Safari/touch gesture. Chưa có visual screenshot acceptance C20, chưa chạy screen reader hoặc toàn bộ consumer journeys. Không nâng verified YES.

## Checkpoint

Số liệu chính xác: `evidence/c20-current-coverage.json`. Delta: `c20-source-changes.csv`. Đối soát hash/inventory: `evidence/c20-final-reconciliation.json`. Matrix, findings, ledger và tests cập nhật cùng batch. Toàn dự án PARTIAL; Phase4–6/Liquid Glass chưa complete.
