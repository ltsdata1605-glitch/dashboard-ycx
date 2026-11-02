# C14 — Tooltip viewport/long content và review Dropdown — PARTIAL

26/10/2026. Hash đầu batch của1.364 INCLUDED khớp C13; không quét lại dependency/generated trees. ZIP/manifest3 file trước sửa được lưu ở evidence/c14-checkpoint.*. Không thêm nguồn, không thay nghiệp vụ/auth/API/dữ liệu; không push/deploy.

## Root cause và sửa

Tooltip dùng whitespace-nowrap, không giới hạn chiều rộng hoặc xử lý collision.8 baseline tests (4 mép ×390/1366) FAIL với nội dung tiếng Việt dài và chuỗi không có khoảng trắng. Sửa: w-max với max-width min(20rem,100vw−16px), whitespace-normal/overflow-wrap:anywhere, vùng content có max-height/overflow-y-auto cho nội dung rất dài. Đo panel/trigger bằng useLayoutEffect, ưu tiên side yêu cầu rồi hướng đối diện/hướng khác đủ chỗ; clamp8px trong layout viewport. Mũi tên cập nhật theo resolved side và tâm trigger. ResizeObserver đo lại khi kích thước thay đổi; resize và capture scroll cập nhật vị trí; cleanup khi đóng/unmount.

Lần thử đầu24 PASS/2 FAIL: assertion scrollWidth tính cả mũi tên/hover bridge nên không phải phép đo text overflow chính xác. Sửa phép đo vào content child, giữ assertion không tràn trang/viewport; thêm assertion không che trigger. Before-overlap4 FAIL/4 PASS xác nhận clamp trái/phải có thể che trigger khi không bên nào đủ chỗ. Thêm fallback hướng vuông góc có đủ chỗ; không nới timeout hoặc bỏ assertion. Tất cả lịch sử FAIL được giữ.

## Quyết định kiến trúc (ADR C14)

Accepted for scoped correction: giữ absolute DOM con của trigger, cùng nguyên tắc đo/lật/clamp hiện có trong ActionMenu. Dropdown hiện chỉ CSS positioning nên không có helper dùng chung để gọi. CSS wrap-only không xử lý edge; portal/floating library có thể tránh ancestor clipping nhưng cần đổi hover boundary/ref/style và thêm dependency hoặc refactor rộng. Chọn đo local để giữ hover bridge C13 và API hiện tại; không tạo generic overlay framework từ một use case.

Trade-off: có layout reads khi tooltip đang mở và khi scroll/resize; chưa đo performance nhiều instance. Ancestor overflow:hidden/transformed coordinate systems, visualViewport pinch zoom và trigger ra ngoài viewport chưa được bảo đảm. Revisit khi có consumer thực cần clipping/zoom/scroll đặc biệt; không suy diễn test viewport thành acceptance các case đó. Không thêm Glass vào vùng mô tả chỉ để đạt tên phase.

## Evidence từng file/entity

- Tooltip.tsx: đọc đầy đủ trước/sau; thay positioning và wrap ở shared component. Regression keyboard/hover/Escape/disabled/unmount của C12–13 vẫn chạy. Pointer bridge bám resolvedSide. Nội dung vô hạn/scroll accessibility chưa fully verified.
- materialHarness.html: nhánh tooltip thêm edge fixture với position fixed ở4 mép và content dài; React Tooltip/Button thật, không chèn DOM giả. Branch cũ giữ nguyên.
- shared-tooltip.spec.ts: thêm8 edge tests, kiểm tra nằm trong viewport, chữ wrap/no text overflow, không tràn trang/không che trigger; resize xuống320×568 khi còn mở và Escape giữ focus. Sau đối chiếu, WebKit geometry dùng Option+Tab rõ trong source; default Tab WebKit không được coi là PASS.
- Dropdown.tsx: đọc đủ206 dòng, NO→PARTIAL. Trace wrapper div role=button, keyboard Arrow/Home/End, escape/outer click, item disabled/current, max-height scrolling; alignment absolute chỉ left/right không có collision handling. DropdownButton là Button thật. Runtime Dropdown chưa chạy trong C14.
- BonusTab.tsx: chỉ đọc callsite139–174; dùng span trigger có chú thích tránh nested Button, giữ ngoại lệ này. Không full review file và không nâng ledger. ActionMenu.tsx chỉ đọc vùng positioning để đối chiếu, không full review lại.
- DropdownButton: exact-name references ở components/features/tests chỉ declaration + barrel export; POSSIBLE_DEAD candidate, chưa loại trừ aliases/dynamic/external API, không xóa.

Hash3 file sửa: c14-source-changes.csv. Matrix Dropdown/DropdownButton bổ sung mapping source-only và giữ NOT_RUN. Không đổi module/screen thành reviewed YES.

## Lệnh và kết quả

```sh
AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c14-playwright.config.mjs shared-tooltip.spec.ts -g 'long content at'
AUDIT_PORT=5197 AUDIT_RUN=final AUDIT_SCREENSHOT_PREFIX=c14 npx playwright test --config audit/evidence/c14-playwright.config.mjs shared-tooltip.spec.ts
AUDIT_PORT=5197 AUDIT_RUN=overlap-before npx playwright test --config audit/evidence/c14-playwright.config.mjs shared-tooltip.spec.ts -g 'long content at'
AUDIT_PORT=5197 AUDIT_RUN=verified AUDIT_SCREENSHOT_PREFIX=c14 npx playwright test --config audit/evidence/c14-playwright.config.mjs shared-tooltip.spec.ts
AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit AUDIT_SCREENSHOT_PREFIX=c14-webkit npx playwright test --config audit/evidence/c14-playwright.config.mjs shared-tooltip.spec.ts -g 'long content at|pointer crosses gap|pending hover timer'
AUDIT_PORT=5197 AUDIT_RUN=final-source AUDIT_SCREENSHOT_PREFIX=c14 npx playwright test --config audit/evidence/c14-playwright.config.mjs shared-tooltip.spec.ts -g 'long content at'
npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c14-unit.json
npm run typecheck
npx eslint components/shared/ui/Tooltip.tsx tests/e2e/shared-tooltip.spec.ts
npm run lint:ratchet:ci
npm run build
```

Before8 FAIL; first implementation24 PASS/2 FAIL; overlap-before4 PASS/4 FAIL. Final26 Chromium PASS +18 WebKit PASS;8 Chromium geometry rerun PASS after adding explicit WebKit key selection. Full unit1490 PASS/4 SKIPPED (172 files PASS/1 SKIPPED). Typecheck/targeted ESLint/ratchet check-only/build PASS. Không sửa lint baseline. Logs/JSON c14-* giữ nguyên.

Đã inspect c14-edge-390-right.png và c14-webkit-edge-1366-top.png (ảnh sau resize320×568; WebKit device scale2): nội dung dài có xuống dòng, trong viewport, không che trigger. Các screenshot khác được tạo nhưng không coi là đã inspect thủ công. Geometry/hover tại390/1366 và320 resize là keyboard/mouse, không touch/iPhone thật. WebKit Option+Tab khác default Tab; CORR-009 không được đóng. Browser local fresh profiles/closed external proxy; physical iPhone/screen reader và production journeys vẫn BLOCKED/chưa đủ evidence theo full matrix.

## Remaining

CORR-015 OPEN: touch, visualViewport zoom, ancestor clipping/transforms/scroll, custom props, tooltip token mapping, performance và consumer acceptance. Dropdown collision/a11y runtime cần batch riêng, không tự đổi ngoại lệ span trigger. Full styles/Glass/global migration/module regression/dead code còn PARTIAL.

## C14 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.364 in-scope =1.300 NO +18 PREFLIGHT_ONLY +46 PARTIAL; verified YES=0. Component448 NO/19 PARTIAL;29 modules169 surfaces chưa full review.3 file hash delta, Dropdown.tsx review source-only. Hash/inventory mismatch0; evidence/c14-current-coverage.json và c14-final-reconciliation.json.

Tooltip long content/viewport collision:26 Chromium +18 WebKit scoped PASS;8 Chromium geometry rerun PASS sau tách key theo engine. Full unit1490 PASS/4 SKIPPED; typecheck/targeted ESLint/ratchet/build PASS. Giữ before8 FAIL, interim24 PASS/2 FAIL (phép đo text tính cả decoration), overlap-before4 FAIL/4 PASS. CORR-015 vẫn OPEN cho touch/zoom/ancestor clipping/custom props/tokens/performance/consumers. Dead-code29:7 INTENTIONALLY_RETAINED/5 POSSIBLE_DEAD/17 UNKNOWN; không xóa. Xem correction-batch-c14.md và c14-source-changes.csv. Không push/deploy.
