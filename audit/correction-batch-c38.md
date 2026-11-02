# C38 — TouchTitleHint gesture cancellation — PARTIAL

## Root cause và thay đổi

Nhấn giữ đặt suppressClick=true. pointercancel dùng chung handler pointerup nên không xóa cờ; gesture bị hủy không sinh click tương thích để tiêu thụ cờ đó. Lần chạm tiếp theo vào một nút React khác bị chặn. Baseline Chromium native CDP touch tái hiện2PASS1FAIL.

Tách onPointerCancel: hủy hold timer, ẩn bubble và xóa suppressClick. Pointerdown mới xóa cờ cũ để mỗi gesture độc lập. Giữ nhấn giữ bình thường chặn đúng click của nó, chạm nhanh hoạt động như cũ. Không thay callback nghiệp vụ.

File sửa: `components/shared/ui/TouchTitleHint.tsx`, `tests/e2e/helpers/materialHarness.html`; mới `tests/e2e/touch-title-gesture.spec.ts`. ZIP/SHA trước sửa `evidence/c38-checkpoint.*`; SHA delta `c38-source-changes.csv`.

Full source review thêm PageActions122lines, BatchShareToast52lines, ShareRetryToast33lines. Notes riêng tại `evidence/c38-file-review-notes.json`, references `evidence/c38-consumers.txt`. Chỉ source review, không nhận runtime/production share coverage cho các file này. Không gọi share API, cloud hoặc thiết bị người dùng.

## Tests

- `AUDIT_PORT=5198 AUDIT_MOBILE=1 AUDIT_RUN=before npx playwright test --config audit/evidence/c38-playwright.config.mjs`:2PASS1FAIL; giữ c38-before.json/.txt.
- Cùng lệnh `AUDIT_RUN=chromium`:3PASS; input touch thật qua CDP trong Chromium emulation, React hook/button/counters thật.
- `AUDIT_ENGINE=webkit AUDIT_RUN=webkit`:3PASS; **PointerEvent boundary tổng hợp**, không coi native WebKit touch/physical Safari PASS. Tooltip DOM là output thật của hook; test không tự chèn DOM để giả behavior React.
- Full `npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c38-unit.json`:1490PASS4SKIPPED,172filesPASS1SKIPPED. Không thay skip.
- ESLint TouchTitleHint/spec, `npx tsc --noEmit`, `npm run build`:PASS;build14.30s. Scoped diff-check PASS.
- Visual acceptance NOT_RUN C38; token/contrast/aria-describedby,visualViewport,scroll/multitouch,all-consumer và physical device còn pending.

## Đối soát và còn lại

CORR-035 resolved theo phạm vi trên. Xem số hiện tại `evidence/c38-current-coverage.json`, hash/inventory reconciliation `evidence/c38-final-reconciliation.json`. Tất cả verified vẫn NO. Shared toast native share/useractivation cần thiết bị phù hợp; PageActions owner transitions/registry runtime còn thiếu. Không xóa candidate, không push/deploy, không production writes. Toàn MASTER PROMPT V6 vẫn PARTIAL.
