# C43 — Icon registry own-key guard — PARTIAL

## Root cause và sửa

CORR-038: `name in ICON_REGISTRY` và lookup object không kiểm own-key chấp nhận constructor/toString/__proto__/hasOwnProperty như icon. Resolver nhận tên từ config/consumer strings nên phải loại các key kế thừa. Baseline6unitcases:4FAIL2PASS. Thêm isRegisteredIcon dùng hasOwnProperty tại registry; AppIcon/renderIcon/resolveIconName/toast isIconName dùng guard chung. Legacy lookup cũng kiểm own-key. Invalid AppIcon dùng alert fallback, renderIcon vẫn giữ literal text/React node, unknown resolver trảundefined.

Đã đọc đầy đủ registry314lines/legacy226lines và AppIcon/renderIcon/iconTokens/test registry. Giữ239canonical mappings/201legacy aliases,prioritize canonical names,LINE brand exception và size tokens. Không đổi nghiệp vụ hoặc semantic glyph mapping. Bảng riêng `icon-mapping-audit.csv`; references `evidence/c43-consumers.txt` chỉ hỗ trợ truy consumer, không chứng minh mọi màn đã review.

Dead code: import ExternalLink xuất hiện đúng1lần và không nằm trong mapping; đã xóa duy nhất binding này sau kiểm source và regression. Semantic externalLink vẫn map Link như trước. Legacy aliases là LEGACY_ACTIVE do persisted-data contract/consumer hiện hữu, giữ nguyên. Register52=30INTENTIONALLY_RETAINED+16POSSIBLE_DEAD+2LEGACY_ACTIVE+3DUPLICATED+1DEFINITE_DEAD(removed import). Không kết luận toàn bộ code đều được dùng.

## Files và evidence

Sửa icon/iconRegistry.ts,icon/legacyIconNames.ts,icon/AppIcon.tsx,icon/renderIcon.tsx,toast/toast.ts dưới components/shared/ui; sửa tests/e2e/helpers/materialHarness.html. Thêm tests/unit/icon-registry-boundaries.test.ts và tests/e2e/icon-registry-consumer.spec.ts. Paths/SHA đầy đủ `c43-source-changes.csv`; checkpoint ZIP/SHA `evidence/c43-checkpoint.*`; notes từng file `evidence/c43-file-review-notes.json`.

## Tests

- Lần đầu đặt spec.tsx không được Vitest include (**NOT_RUN**, không PASS); giữ c43-discovery-error.txt. Đổi sang .ts/createElement phù hợp config, không bỏ case.
- Before `npx vitest run tests/unit/icon-registry-boundaries.test.ts`:4FAIL2PASS,c43-before.json.
- Targeted new6+toast11:17PASS,c43-unit.json.
- `AUDIT_PORT=5198 AUDIT_RUN=chromium npx playwright test --config audit/evidence/c43-playwright.config.mjs`:2PASS; AUDIT_ENGINE=webkit/AUDIT_RUN=webkit:2PASS. Real Input/AppIcon/renderIcon mount,390/1366,no pageerrors.
- Full `npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c43-full-unit.json`:1503PASS4SKIPPED;174filesPASS1SKIPPED,includes existing icon registry tests.
- ESLint changedsource/specs,tsc --noEmit,buildPASS9.65s. Scoped diff-checkPASS.
- Ảnh Chromium390/WebKit1366 đã xem:Input fallback/icon/text hiển thị,không crash. Không nhận all-screen/physical Safari acceptance.

## Đối soát

1386 INCLUDED=1122NO12PREFLIGHT_ONLY252PARTIAL;verifiedYES0. Component392NO75PARTIAL;module16NO13PARTIAL;screen165NO6PARTIAL. Hash/inventory mismatches0 tại c43-final-reconciliation.json. All consumers/size overrides/export rendering/native device/screenreader vẫn pending. Fullproject PARTIAL; không push/deploy/production writes.
