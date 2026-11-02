# C15 — Dropdown focus và BonusTab consumer — PARTIAL

26/10/2026. Checkpoint C14 còn hợp lệ:1.364 INCLUDED khớp hash trước sửa (`evidence/c15-initial-delta.json`). ZIP/manifest giữ Dropdown và materialHarness trước sửa; thêm shared-dropdown.spec.ts vào scope, không quét dependency/generated trees. Không push/deploy hoặc sửa dữ liệu/auth/nghiệp vụ/API.

## Findings và thay đổi

CORR-016 RESOLVED scoped: chọn mục bằng bàn phím gọi onSelect rồi đóng panel nhưng không trả focus; sau unmount item, focus rơi về body. Baseline2 keyboard tests FAIL ở assertion focus trigger. Thêm restoreTriggerFocus dùng chung với Escape và gọi sau selection; outside click chỉ close nên không giành focus của destination. Span icon trigger hiện có tên truy cập đúng trên Chromium/WebKit; không thay thành Button lồng trong div role=button.

CORR-017 OPEN: ảnh consumer c15-bonus-period-menu.png cho thấy phần mô tả cuối menu BonusTab bị cắt ở đáy khung Nhân viên. Source NhanVien.tsx:522 có overflow-hidden bao nội dung BonusView; Dropdown panel absolute. Chưa có runtime geometry trace xác định toàn bộ clipping ancestors; source và ảnh là bằng chứng ban đầu mạnh, cần regression clipping trước sửa. Hai journey chọn chế độ/table PASS không chứng minh toàn panel hiển thị đầy đủ. Không đánh dấu visual acceptance consumer PASS.

## Review từng entity

- components/shared/ui/Dropdown.tsx: đọc đủ206 dòng trước sửa; giữ API, labels, styling, disabled/divider handling, active state và keyboard Arrow/Home/End. Chỉ refactor focus helper và trả focus sau selection. Test7 Chromium (1 touch emulation),4 WebKit được chọn. DropdownButton vẫn POSSIBLE_DEAD, không xóa.
- tests/e2e/helpers/materialHarness.html: thêm nhánh Dropdown React fixture với span/AppIcon trigger, active/disabled/divider items và state onSelect. Không synthetic DOM insertion. Nút outside ban đầu bị panel che; di chuyển mt16→mt64 trong fixture, không sửa sản phẩm để làm test pass.
- tests/e2e/shared-dropdown.spec.ts: mới; accessible name/no nested button; Tab thật→ArrowDown active→End/Home/skip disabled→Enter selection→restore focus→reopen active; Escape và outside click; tap selection/reopen bằng Chromium touch390. Không `.focus()` giả lập đường bàn phím trong spec mới.
- features/bi-dashboard/components/nhanvien/BonusTab.tsx: đọc đầy đủ source (imports, props, useBonusViewData boundary, export callback, period item mapping, title, four table branches). Không đổi source. Chỉ2 journey local được chạy; export/manual HRM/auto sync và các table states khác pending. Component BonusView và surface từ NO→PARTIAL, verified NO.
- tests/e2e/bi-bonus-compare.spec.ts: đọc đủ3 tests, chạy2 tests chọn menu/compare table; test popup Tự động không chạy trong C15. Giữ asserts dấu delta/thiếu kỳ/footer; không sửa expected nghiệp vụ.
- tests/e2e/helpers/seed.ts: đọc đủ181 dòng; review safety openReportBi/pasteIntoTile/seedAnalysisEmployees và các helpers còn lại. Chế độ dùng thử/local IndexedDB/clipboard mock, không credentials hay gọi production. Exact Cập nhật tránh nút auto sync. Helper không được coi là production integration proof.
- NhanVien.tsx chỉ trace vùng ancestor/callsite, không full review/nâng file. Card.tsx đọc để truy wrapper, không đưa vào claimed completed review.

Module features/bi-dashboard chuyển NO→PARTIAL theo evidence2 journey BonusView, không có nghĩa163 file module đã review. Surface BonusView PARTIAL, các surface khác không đổi. Source changes3 paths (2 sửa+1 mới) trong c15-source-changes.csv; source review-only paths giữ hash.

## Safety/test matrix

Browser config dùng fresh profiles, Vite loopback và closed proxy cho external traffic. Consumer test seed dữ liệu giả vào local IndexedDB; clipboard được mock. Không click Thủ công hoặc Chạy/Tự động đồng bộ ngoài. External MWG/Tampermonkey/credentials/physical iPhone/screen reader vẫn BLOCKED/chưa đủ evidence.

```sh
AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c15-playwright.config.mjs shared-dropdown.spec.ts
AUDIT_PORT=5197 AUDIT_RUN=final npx playwright test --config audit/evidence/c15-playwright.config.mjs shared-dropdown.spec.ts
AUDIT_PORT=5198 AUDIT_RUN=consumer npx playwright test --config audit/evidence/c15-playwright.config.mjs bi-bonus-compare.spec.ts -g 'bấm nút chế độ xem|chế độ So sánh cùng kỳ'
AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit npx playwright test --config audit/evidence/c15-playwright.config.mjs shared-dropdown.spec.ts -g 'span icon trigger|keyboard selection'
AUDIT_PORT=5197 AUDIT_RUN=touch npx playwright test --config audit/evidence/c15-playwright.config.mjs shared-dropdown.spec.ts -g 'tap selects'
AUDIT_PORT=5197 AUDIT_RUN=verified AUDIT_SCREENSHOT_PREFIX=c15 npx playwright test --config audit/evidence/c15-playwright.config.mjs shared-dropdown.spec.ts
npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c15-unit.json
npm run typecheck
npx eslint components/shared/ui/Dropdown.tsx tests/e2e/shared-dropdown.spec.ts
npm run lint:ratchet:ci
npm run build
```

Baseline2 PASS/4 FAIL:2 thật focus loss +2 fixture outside button bị panel intercept (giữ trace). Sau sửa6 fixture PASS; touch riêng1 PASS; source cuối7 fixture PASS. WebKit4 PASS (name/keyboard selection; native Tab tới div tabindex); outside pointer-focus semantics WebKit không test. Consumer2 PASS (desktop local mock data). Tổng final distinct browser cases13 PASS (7+4+2), không cộng reruns thành coverage. Full unit1490 PASS/4 SKIPPED; typecheck/targeted ESLint/ratchet check-only/build PASS. Giữ mọi log lịch sử; không đổi lint baseline.

Ảnh fixture WebKit ban đầu dùng chung path; đã giữ bản engine này dưới c15-webkit-dropdown-390/1366.png, thêm prefix và chạy lại Chromium source cuối tạo c15-dropdown-390/1366.png. Đã xem bản WebKit390 và consumer menu desktop; chưa tuyên bố inspect tất cả ảnh. Ảnh consumer menu/table copy từ generated test-results vào evidence/c15-bonus-*.png. Visual consumer menu FAIL vì clipping CORR-017. Touch test chỉ Chromium emulation390, không physical Safari.

## Remaining

Ưu tiên CORR-017 clipping regression/ancestor fix phù hợp, rồi Dropdown role semantics/panel relation/Tab behavior/multi-instance Escape/viewport collision/consumer mobile. CORR-015 Tooltip touch/zoom/clipping/tokens/performance và CORR-009/010/014 vẫn OPEN. Dead-code29 candidates giữ nguyên, không xóa. Full audit và Design System/Glass acceptance còn PARTIAL.

## C15 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.365 in-scope =1.297 NO +18 PREFLIGHT_ONLY +50 PARTIAL; verified YES=0. Component447 NO/20 PARTIAL; module28 NO/1 PARTIAL; surface168 NO/1 PARTIAL. Chỉ BonusView/module BI được PARTIAL theo scoped evidence, không full review. Thêm shared-dropdown.spec.ts;3 source delta. Hash/inventory mismatch0; evidence/c15-current-coverage.json và c15-final-reconciliation.json.

CORR-016 focus sau Dropdown selection đã sửa.13 final distinct browser cases PASS (7 Chromium fixture gồm touch +4 WebKit +2 BI local journeys); full unit1490 PASS/4 SKIPPED; typecheck/ESLint/ratchet/build PASS. Before2 PASS/4 FAIL (2 focus thật+2 fixture bị che) giữ nguyên. Visual BonusTab FAIL: CORR-017 description cuối menu bị khung cha cắt; OPEN, không báo global acceptance. Dead-code29 không đổi. Chi tiết correction-batch-c15.md và c15-source-changes.csv. Không push/deploy.
