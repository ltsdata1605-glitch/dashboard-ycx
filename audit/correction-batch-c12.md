# C12 — Tooltip keyboard/description/timer — PARTIAL

26/10/2026. Checkpoint C11 còn hợp lệ: 1.363 hash INCLUDED không delta lúc bắt đầu (`evidence/c12-initial-delta.json`). ZIP + SHA manifest giữ Tooltip và materialHarness trước sửa. Thêm một regression spec vào inventory, không quét dependency/generated trees. Không push/deploy hoặc thay nghiệp vụ/auth/dữ liệu.

## Điều tra và thay đổi

Đọc đầy đủ Tooltip.tsx, utils.ts (C11), barrel index.ts; scan tên Tooltip trên file code trong inventory (`evidence/c12-tooltip-references.json`). Shared Tooltip hiện có export barrel và fixture test; RechartsTooltip là component khác, không được tính là consumer của shared Tooltip. Không thấy feature caller trực tiếp trong trace; aliases/dynamic external consumer vẫn chưa loại trừ. Giữ POSSIBLE_DEAD, không xóa và không tính fixture thành bằng chứng dùng production.

Lỗi tái hiện: tooltip không có id/aria-describedby tới trigger; Escape không đóng hoặc hủy show timer; mouseleave đóng dù trigger còn focus. Thêm useId + cloneElement giữ aria-describedby sẵn có, document keydown Escape (bao gồm pending timer), clear timer trước khi schedule lại/cleanup, tách hover/focus refs để không đóng sai. Disabled chặn visibility và hủy timer. Không đổi callback/ref của child; contract child phải là focusable element chuyển tiếp aria-describedby tới DOM. Chưa chứng minh mọi custom child đáp ứng contract này.

## Evidence từng file

| File | Review/thay đổi | Giới hạn |
|---|---|---|
| components/shared/ui/Tooltip.tsx | Đọc toàn bộ; sửa description, Escape, timer và focus/hover | PARTIAL; hover lên tooltip, touch, token material, vị trí mép viewport và disabled/unmount runtime còn thiếu |
| components/shared/ui/index.ts | Đọc toàn bộ barrel; xác nhận export Tooltip/TooltipProps | PARTIAL; không đồng nghĩa review các export khác |
| tests/e2e/helpers/materialHarness.html | Đọc và thêm nhánh tooltip dùng Tooltip + Button React thật, caller description thật | Fixture; không synthetic DOM insertion, không production integration |
| tests/e2e/shared-tooltip.spec.ts | Mới: 6 tests ở390/1366, Tab thật, relation IDs, Escape giữ focus/caller description, pending timer qua clock, mouseleave khi focus | Width390 là viewport hẹp với keyboard/mouse, KHÔNG phải touch emulation hay iPhone thật |

Hash trước/sau: `c12-source-changes.csv`. Các file khác không được nâng review chỉ vì suite chạy qua.

## Kiểm thử

```sh
AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c12-playwright.config.mjs shared-tooltip.spec.ts
AUDIT_PORT=5197 AUDIT_RUN=before-keyboard npx playwright test --config audit/evidence/c12-playwright.config.mjs shared-tooltip.spec.ts -g 'keyboard description'
AUDIT_PORT=5197 AUDIT_RUN=final npx playwright test --config audit/evidence/c12-playwright.config.mjs shared-tooltip.spec.ts
AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit npx playwright test --config audit/evidence/c12-playwright.config.mjs shared-tooltip.spec.ts -g 'pending hover timer'
AUDIT_PORT=5197 AUDIT_RUN=forms AUDIT_SCREENSHOT_PREFIX=c12-forms-regression npx playwright test --config audit/evidence/c12-playwright.config.mjs shared-form-states.spec.ts
npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c12-unit.json
npm run typecheck
npx eslint components/shared/ui/Tooltip.tsx tests/e2e/shared-tooltip.spec.ts
npm run lint:ratchet:ci
npm run build
```

Before6 FAIL: một keyboard test ở390 bấm Tab trước React trigger render (fixture readiness race), các lỗi khác thiếu id/Escape. Sửa test chờ trigger visible, không bỏ assertion; before-keyboard chạy lại2 FAIL đều thiếu id trước sửa component. Giữ nguyên tất cả logs/JSON/trace. Sau sửa6 Chromium Tooltip PASS;2 WebKit pending-timer PASS. WebKit keyboard không được chạy trong batch này; không diễn giải là PASS.

Đã inspect ảnh c12-tooltip-390/1366.png: tooltip một dòng dưới trigger trong viewport, không che focus outline. Không xem là visual acceptance ở mọi side/content/consumer. Typecheck, targeted ESLint, ratchet check-only, build PASS; không thay baseline. Browser chỉ local fresh profiles/closed external proxy. Không test physical Safari/screen reader thực; BLOCKED do thiếu thiết bị/session tương ứng.

## Acceptance còn thiếu

CORR-015 vẫn OPEN: pointer-events-none/margin gap chưa cho hover lên tooltip; long content/viewport-edge/4side/zoom chưa test; touch/disabled/unmount/re-entry states, screen reader thực và token mappings chưa đủ. Không thêm Glass vào tooltip chỉ để hoàn thành phase. Các finding CORR-009/010/014 không bị đóng bởi batch này. Dead-code28 candidates giữ nguyên phân loại, chỉ thêm evidence cho Tooltip. Full module/user journeys, credentials/service/device dependencies vẫn pending/BLOCKED theo matrix.

## C12 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.364 in-scope =1.301 NO +18 PREFLIGHT_ONLY +45 PARTIAL; verified YES=0. Component450 NO/17 PARTIAL;29 modules169 surfaces chưa full review. Thêm shared-tooltip.spec.ts; index.ts từ NO sang PARTIAL có source evidence. Hash/inventory mismatch0; evidence/c12-current-coverage.json và c12-final-reconciliation.json.

Tooltip sửa mô tả liên kết, Escape và timer, giữ focus khi rời chuột. 15 browser PASS (6 Chromium tooltip+2 WebKit timer+7 forms regression);1490 unit PASS/4 SKIPPED; typecheck/targeted ESLint/ratchet/build PASS. Trước sửa6 FAIL (gồm1 readiness race) và2 before-keyboard FAIL giữ nguyên. CORR-015 vẫn OPEN cho hoverable content/touch/placement/consumer acceptance. Dead code28 candidates giữ nguyên, không xóa. Chi tiết file thay đổi/giới hạn: correction-batch-c12.md, c12-source-changes.csv. Không push/deploy.
