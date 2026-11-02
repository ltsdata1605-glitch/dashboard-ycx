# C16 — BonusTab clipping correction — PARTIAL

26/10/2026.1.365 INCLUDED khớp hash C15 lúc bắt đầu. Checkpoint ZIP/SHA manifest chứa5 file trước sửa; không quét dependency/generated trees. Không push/deploy, đổi auth/nghiệp vụ/dữ liệu production.

## CORR-017: root cause và fix

Regression mới đo hit-testing4 góc bên trong panel thật của BonusTab. Before FAIL: hits=[true,true,false,false]; panel bottom530.875 nhưng ancestor overflow-hidden bottom506.625. Ancestor trace xác nhận khung NhanVien (transform:none). toBeVisible cũ không phát hiện clipping; giữ các assertion chọn chế độ/compare data và thêm assertion hit-testing.

Shared Dropdown thêm tùy chọn escapeClipping (defaultfalse). Khi bật, panel dùng fixed với tọa độ đo từ trigger, căn trái/phải, lật lên khi thiếu chỗ, clamp ngang, cập nhật qua ResizeObserver/resize/capture scroll và cleanup khi đóng. DOM vẫn trong container nên outside-click, focus query và event flow giữ nguyên. BonusTab bật tùy chọn với width240px; không đổi NhanVien overflow/bo góc/border hoặc span trigger. Default absolute behavior của consumer khác giữ nguyên.

ADR C16: chọn tùy chọn fixed thay vì bỏ overflow của toàn card (có thể phá các tab/border khác) hoặc portal (đổi style inheritance/event containment/modal behavior). Ưu tiên correction nhỏ ở shared primitive + consumer xác nhận. Giới hạn có chủ đích: ancestor transform/contain tạo fixed containing block có thể vẫn clip; chưa có consumer thực cần trường hợp đó. Width% đơn giản được tính theo trigger; calc/complex units, viewport cực thấp, visualViewport zoom/offscreen trigger chưa đủ tests. Không claim universal floating-position engine hay full performance acceptance.

After Chromium và WebKit: hits=[true,true,true,true], cùng vị trí panel và ancestor cũ. Đã xem c16-bonus-period-menu.png: dòng mô tả cuối đầy đủ, card bo góc không đổi. CORR-017 RESOLVED cho case đã tái hiện; toàn surface vẫn PARTIAL.

## Evidence từng file

1. components/shared/ui/Dropdown.tsx: đọc đầy đủ; optional fixed branch, panel ref/layout measurement, cleanup; mặc định không đổi. Default/floating keyboard/name/outside/touch và resize/scroll tests.
2. features/bi-dashboard/components/nhanvien/BonusTab.tsx: đọc đầy đủ ở C15; C16 chỉ delta escapeClipping trên Dropdown. Hai local consumer journeys bảo vệ lựa chọn chế độ và bảng so sánh; không đổi tính toán.
3. tests/e2e/bi-bonus-compare.spec.ts: đọc/safety review C15; bổ sung geometry/ancestor trace và hit-testing trong test menu. Test popup Tự động vẫn NOT_RUN trong C16; không gọi dịch vụ ngoài.
4. tests/e2e/helpers/materialHarness.html: cập nhật Dropdown fixture query floating và chiều cao main đủ để native wheel scroll; nhánh khác giữ nguyên.
5. tests/e2e/shared-dropdown.spec.ts: parametrize default/floating, thêm resize320 và wheel scroll16px/anchoring; giữ mọi C15 assertions. Screenshot prefix tách engine/variant.
6. tests/e2e/helpers/uiHarness.tsx: đọc đầy đủ, PARTIAL review; React Modal/Dropdown/DataTable/Button. createElement chỉ tạo mount root cho React thật, không fake HTML như bằng chứng hành vi.
7. tests/e2e/ui-dung-chung-dot-2.spec.ts: review riêng setup và case A15, PARTIAL; chỉ chạy A15. Test cũ dùng programmatic focus để bắt đầu nên chỉ dùng như Escape regression, không làm bằng chứng Tab traversal; spec shared-dropdown mới dùng Tab thật.

Hash delta5 file trong c16-source-changes.csv. Hai file harness/legacy spec từ NO→PARTIAL có giới hạn rõ, không file nào verified YES. Không nâng module/surface thành complete.

## Tests và safety

```sh
AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c16-playwright.config.mjs bi-bonus-compare.spec.ts -g 'bấm nút chế độ xem'
AUDIT_PORT=5197 AUDIT_RUN=consumer npx playwright test --config audit/evidence/c16-playwright.config.mjs bi-bonus-compare.spec.ts -g 'bấm nút chế độ xem|chế độ So sánh cùng kỳ'
AUDIT_PORT=5198 AUDIT_RUN=shared AUDIT_SCREENSHOT_PREFIX=c16-chromium npx playwright test --config audit/evidence/c16-playwright.config.mjs shared-dropdown.spec.ts
AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit-shared AUDIT_SCREENSHOT_PREFIX=c16-webkit npx playwright test --config audit/evidence/c16-playwright.config.mjs shared-dropdown.spec.ts -g 'span icon trigger|keyboard selection|follows viewport'
AUDIT_PORT=5197 AUDIT_RUN=modal npx playwright test --config audit/evidence/c16-playwright.config.mjs ui-dung-chung-dot-2.spec.ts -g 'A15:'
AUDIT_PORT=5197 AUDIT_ENGINE=webkit AUDIT_RUN=webkit-consumer npx playwright test --config audit/evidence/c16-playwright.config.mjs bi-bonus-compare.spec.ts -g 'bấm nút chế độ xem'
npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c16-unit.json
npm run typecheck
npx eslint components/shared/ui/Dropdown.tsx features/bi-dashboard/components/nhanvien/BonusTab.tsx tests/e2e/bi-bonus-compare.spec.ts tests/e2e/shared-dropdown.spec.ts
npm run lint:ratchet:ci
npm run build
```

Before1 FAIL giữ log/trace. After28 browser PASS:15 Chromium shared (gồm2 touch emulation),2 Chromium consumer,9 WebKit shared,1 Chromium Modal,1 WebKit consumer. Full unit1490 PASS/4 SKIPPED (172 files PASS/1 SKIPPED). Typecheck/targeted ESLint/ratchet check-only/build PASS. Không thay lint baseline.

Consumer dùng local trial, IndexedDB data giả và clipboard mock; fresh profiles/closed external proxy. Desktop local journey PASS không xác thực production. Chromium touch390 là emulation, physical Safari/screen reader BLOCKED do thiếu session/device. WebKit consumer mới chỉ menu, không toàn compare/mobile journey. Generated consumer screenshots copy vào evidence/c16-bonus-*.png và c16-webkit-bonus-period-menu.png; chỉ ảnh Chromium menu đã inspect trong C16, các ảnh khác không mặc nhiên được duyệt visual.

## Remaining

Dropdown role/panel semantics, Tab behavior/multi-instance Escape, complex widths, transformed ancestors, zoom/offscreen trigger/performance và mobile consumer còn pending. Tooltip CORR-015, CORR-009/010/014 và full Design System/Glass acceptance vẫn OPEN/PARTIAL. Dead-code29 candidates không đổi, không xóa.

## C16 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.365 in-scope =1.295 NO +18 PREFLIGHT_ONLY +52 PARTIAL; verified YES=0. Component447 NO/20 PARTIAL; module28 NO/1 PARTIAL; surface168 NO/1 PARTIAL.5 source deltas,2 scoped review-only files; hash/inventory mismatch0. Nguồn evidence/c16-current-coverage.json/c16-final-reconciliation.json.

CORR-017 RESOLVED scoped: shared Dropdown escapeClipping bật cho BonusTab; card overflow/rounding không đổi. Before1 clipping FAIL; after28 browser PASS (15 Chromium shared,2 Chromium BI,9 WebKit shared,1 Modal,1 WebKit BI). Full unit1490 PASS/4 SKIPPED; typecheck/targeted ESLint/ratchet/build PASS. Đã inspect consumer Chromium menu cuối, description đầy đủ; không suy rộng mọi platform/journey. Dead-code29 không đổi; không xóa. Chi tiết correction-batch-c16.md và c16-source-changes.csv. Không push/deploy.
