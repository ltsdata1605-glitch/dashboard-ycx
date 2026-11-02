# C40 — Toast gesture cancel — PARTIAL

CORR-036: AppToaster dùng chung onPointerEnd cho pointercancel, nên khi hệ thống hủy một drag vượt ngưỡng, toast biến mất và gọi onDismiss như người dùng chủ ý đóng. Native Chromium CDP touch tái hiện baseline2PASS1FAIL. Tách cancelGesture chỉ reset drag/start/resume timer; completed pointerup vẫn xét ngưỡng dismiss. Không thay business callbacks hay share API.

Files sửa: `components/shared/ui/toast/AppToaster.tsx`, `tests/e2e/helpers/materialHarness.html`; thêm `tests/e2e/toast-gesture-cancel.spec.ts`. Checkpoint ZIP/SHA `evidence/c40-checkpoint.*`;delta `c40-source-changes.csv`;notes source từng file `evidence/c40-file-review-notes.json`. Review bổ sung brandIcons/icon barrel/FeatureLandingLayout, chưa nhận runtime proof; giữ SVG LINE exception,opaque landing và Vietnamese branding hiện hữu.

Tests:
- `AUDIT_PORT=5198 AUDIT_MOBILE=1 AUDIT_RUN=before npx playwright test --config audit/evidence/c40-playwright.config.mjs`:2PASS1FAIL.
- Cùng lệnh AUDIT_RUN=chromium:3PASS native CDP touch emulation.
- AUDIT_ENGINE=webkit/AUDIT_RUN=webkit:3PASS, real mouse drag + synthetic pointercancel boundary. Không native Safari touch/iPhone proof.
- `npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c40-unit.json`:1490PASS4SKIPPED,172filesPASS1SKIPPED.
- ESLint AppToaster/spec,`npx tsc --noEmit`,`npm run build`:PASS;build16.69s;scoped diff-check PASS.

React thật/toast store thật, fixture actions chỉ tăng local counters. Không mock DOM để giả React. Visual acceptance NOT_RUN C40 vì thay gesture; full screenshot/contrast/materialfallback/native share,queue durations,screenreader/Escape,all consumers và device vẫn pending. AppToaster capped queue duration source concern chưa runtime kết luận.

Đối soát tại `evidence/c40-current-coverage.json` và `evidence/c40-final-reconciliation.json`: tất cả hash/inventory khớp,verifiedYES0. Toàn dự án PARTIAL; không push/deploy/production write.
