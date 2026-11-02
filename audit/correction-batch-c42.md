# C42 — Visible toast timing — PARTIAL

CORR-037: AppToaster render3toast nhưng useToaster của thư viện đặt timer cho mọi toast; finite toast hết hạn trong hàng chờ trước khi người dùng nhìn thấy. Baseline Chromium2PASS1FAIL tái hiện900ms toast chờ1400ms sau3Infinity blockers.

Giữ nguyên public shared toast API/store/metadata, đổi renderer sang useVisibleToasts. Hook chỉ giảm budget khi toast thuộc3slot và không pause; preemption giữ remaining time; cập nhật cùngid reset budget; removeDelay/resurrection và cleanup vẫn được xử lý. Height/offset local, không sửa private store hoặc dependency. ADR/trade-offs: `evidence/c42-toast-timing-adr.md`. Giới hạn store20/newestfirst vẫn giữ, không hứa queue vô hạn.

Files: sửa `components/shared/ui/toast/AppToaster.tsx`, `tests/e2e/helpers/materialHarness.html`; thêm `components/shared/ui/toast/useVisibleToasts.ts`, `tests/e2e/toast-visible-duration.spec.ts`. Checkpoint ZIP/SHA `evidence/c42-checkpoint.*`;delta `c42-source-changes.csv`;source notes `evidence/c42-file-review-notes.json`.

Tests:
- `AUDIT_PORT=5198 AUDIT_RUN=chromium npx playwright test --config audit/evidence/c42-playwright.config.mjs`:4PASS; AUDIT_ENGINE=webkit/AUDIT_RUN=webkit:4PASS.
- Queue budget,hoverpause,loading replacement/resurrection,preemption và mobilegeometry. Không nới assertion baseline, giữ c42-before.json/.txt.
- C40 gesture suite chạy lại `AUDIT_MOBILE=1` với AUDIT_RUN=c42-chromium/c42-webkit:3PASS mỗiengine; JSON c40-c42-*.json, logs c42-gesture-*.txt. Chromiumnative touch/WebKit mouse+syntheticcancel limitations giữ nguyên.
- Fullunit c42-unit.json:1497PASS4SKIPPED;173filesPASS1SKIPPED.
- ESLint3source/spec,tsc --noEmit,buildPASS11.78s; scoped whitespacecheckPASS.
- Đã xem ảnh c42-queue-chromium-390.png/WebKit390:3toast đọc được,không chồng/tràn. Các controls ở dưới chỉ là fixture.

Customtoast,multipletoasters,screenreader/Escape/focus,contrast/materialfallback,allconsumers và native device/performance còn pending. Browser fixture không production. Nguồn library chỉ đọc file mục tiêu, không quét/review dependency tree.

1384 INCLUDED=1125NO12PREFLIGHT_ONLY247PARTIAL;verifiedYES0. Hash/inventory khớp `evidence/c42-final-reconciliation.json`. Component392NO75PARTIAL,module16NO13PARTIAL,screen165NO6PARTIAL. Toàn MASTER PROMPT vẫn PARTIAL. Không push/deploy/production write.
