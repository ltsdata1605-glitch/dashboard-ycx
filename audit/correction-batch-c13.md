# C13 — Tooltip hover và lifecycle — PARTIAL

26/10/2026. Tiếp tục C12; 1.364 file INCLUDED khớp hash lúc bắt đầu (`evidence/c13-initial-delta.json`). Không inventory lại dependency/generated trees. Checkpoint ZIP/manifest chứa3 file trước sửa. Không thêm file nguồn vào scope; không thay nghiệp vụ/auth/API/dữ liệu, không push/deploy.

## Root cause và thay đổi

Tooltip dùng pointer-events-none và margin8px tách trigger khỏi nội dung. Khi con trỏ vượt khoảng hở, wrapper nhận mouseleave và đóng tooltip; người dùng không thể rê lên nội dung để đọc.8 baseline tests (4 hướng ×390/1366) FAIL tại assertion còn visible sau di chuột thật. Không bỏ hoặc nới assertion.

Chuyển tooltip sang pointer-events-auto; thêm pseudo-element trong suốt nối khoảng hở8px theo side. Không đổi kích thước/offset nhìn thấy, không kéo dài thời gian hide để che race. Giữ logic focus/Escape và mô tả của C12. Document content là mô tả không tương tác; API chưa được kiểm chứng với child tùy biến không forward aria hoặc interactive content.

## Evidence từng file

- `components/shared/ui/Tooltip.tsx`: đọc toàn bộ; thêm hoverBridgeClasses4 hướng, pointer-events-auto, comment content contract. Test thực đi từ trigger qua gap vào tooltip (16 bước), assert :hover trên tooltip, rời khỏi đóng và bỏ relation tooltip; keyboard/Escape/state cũ vẫn chạy.
- `tests/e2e/helpers/materialHarness.html`: nhánh tooltip chuyển thành React component có disabled/mounted state và side query. Phím d/u trong fixture cập nhật props/unmount khi trigger còn focus, tránh việc click control khác làm blur trước và tạo test PASS giả. Nút Gắn lại tạo instance mới. Chỉ test harness, không thêm shortcut vào sản phẩm.
- `tests/e2e/shared-tooltip.spec.ts`: đọc toàn bộ; thêm8 hover tests +4 lifecycle tests; giữ6 tests C12. Screenshot prefix tránh ghi đè evidence C12. Disabled được test khi pending và visible; unmount pending/remount kiểm tra không xuất hiện stale tooltip. Không instrument bộ đếm timer hay memory nên không tuyên bố chứng minh không có mọi leak.

Hash delta chỉ3 file trên: `c13-source-changes.csv`. Không nâng review/verified của consumer. Tooltip vẫn POSSIBLE_DEAD cho production usage; fixture không chứng minh có feature caller. Không xóa candidate.

## Kiểm thử và giới hạn

```sh
AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c13-playwright.config.mjs shared-tooltip.spec.ts -g 'pointer crosses gap'
AUDIT_PORT=5198 AUDIT_RUN=lifecycle-baseline npx playwright test --config audit/evidence/c13-playwright.config.mjs shared-tooltip.spec.ts -g 'disabled cancels|unmount while'
AUDIT_PORT=5197 AUDIT_RUN=final AUDIT_SCREENSHOT_PREFIX=c13 npx playwright test --config audit/evidence/c13-playwright.config.mjs shared-tooltip.spec.ts
AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit npx playwright test --config audit/evidence/c13-playwright.config.mjs shared-tooltip.spec.ts -g 'pointer crosses gap|pending hover timer'
npx vitest run components/shared/ui/Input.test.ts components/shared/ui/Select.test.ts components/shared/ui/TextareaCheckbox.test.ts components/shared/ui/cnBoGoc.test.ts --reporter=default --reporter=json --outputFile=audit/evidence/c13-unit.json
npm run typecheck
npx eslint components/shared/ui/Tooltip.tsx tests/e2e/shared-tooltip.spec.ts
npm run lint:ratchet:ci
npm run build
```

Before8 FAIL; lifecycle baseline4 PASS. Final18 Chromium PASS +10 WebKit PASS.12 related shared-control unit PASS (không gọi đây là Tooltip unit suite). Typecheck/targeted ESLint/ratchet check-only/build PASS. Full unit C12 là checkpoint lịch sử1490 PASS/4 SKIPPED; không giả là C13 rerun. Không thay lint baseline.

Viewport390/1366 dùng chuột/bàn phím, không touch emulation. WebKit chỉ hover4 hướng và Escape pending timer; keyboard/disabled/unmount ở WebKit chưa test trong C13. Test đi vào content4 hướng không đồng nghĩa đã kiểm chứng viewport collision/long content4 hướng. Đã inspect ảnh c13-tooltip-390/1366.png cho bottom short text/focus; không mở rộng thành mọi consumer/placement visual acceptance. Mọi browser dùng fresh profile và closed external proxy. Physical iPhone/screen reader thực BLOCKED do thiếu thiết bị/session tương ứng.

## Remaining

CORR-015 OPEN: touch, long text/zoom/viewport collision/scroll clipping, custom className đổi gap, custom child forwarding, mapping tooltip tokens và thực tế consumer chưa hoàn tất.8px bridge chỉ bảo vệ default gap, không bảo đảm tùy biến layout bất kỳ. Shared Tooltip không được coi là toàn bộ tooltip UI dự án (Recharts và các local hints riêng chưa migrate). CORR-009/010/014 vẫn giữ nguyên. Full module journeys và design/performance acceptance còn PARTIAL.

## C13 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.364 in-scope =1.301 NO +18 PREFLIGHT_ONLY +45 PARTIAL; verified YES=0. Component450 NO/17 PARTIAL;29 modules169 surfaces chưa full review. Không thêm nguồn; chỉ3 hash delta đã review. Hash/inventory mismatch0; evidence/c13-current-coverage.json, c13-final-reconciliation.json.

Sửa Tooltip pointer-events và nối khoảng hover8px ở4 hướng. Before8 FAIL; lifecycle baseline4 PASS. Sau sửa18 Chromium +10 WebKit PASS;12 related shared unit PASS; typecheck/targeted ESLint/ratchet/build PASS. CORR-015 vẫn OPEN cho touch/long text/collision/custom gap/trigger/token/consumer acceptance. Dead-code28 candidates không đổi, không xóa. Xem correction-batch-c13.md và c13-source-changes.csv. Không push/deploy.
