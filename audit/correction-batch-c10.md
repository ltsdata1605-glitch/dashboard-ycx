# C10 — token chiều cao shared controls, PARTIAL

Ngày 26/10/2026. Tiếp tục C9, không inventory lại dependency/generated trees. Hash đầu batch của 1.363 file INCLUDED khớp ledger (`evidence/c10-initial-delta.json`). Checkpoint ZIP và SHA256 manifest lưu trước sửa; kiểm tra đủ 8 file trong ZIP khớp manifest.

## Nguyên nhân và sửa đổi

`btn-height-md/lg` khai báo 40/48px và `input-height` 40px nhưng Button/Input/Select dùng class h-9/h-11, tức 36/44px; đổi token không tác động control. Hai test token trước sửa FAIL (giữ evidence/c10-before.json/.txt).

Nối shared controls vào component tokens hiện có; điều chỉnh default md36/lg44/input36 theo giao diện đang dùng, thêm input-height-dense28. Giữ sm32, touch min44, icon32, size-none và className override. Không áp Glass vào form, không sửa nghiệp vụ/auth/API, không bật dark mode. Radius Input vẫn đi qua rounded-control→btn-radius; CORR-014 tiếp tục OPEN cho phần này và consumer acceptance.

## Evidence từng file thay đổi

| File | Review và thay đổi | Evidence / giới hạn |
|---|---|---|
| styles/tokens.css | Review các khai báo component height và tra consumer; sửa md/lg/input, thêm dense | Computed height + override Chromium/WebKit; không tuyên bố full styles review |
| components/shared/ui/Button.tsx | Đọc component, size branches, cn override; nối sm/md/lg | Mặc định sm/md/lg, touch, override50, icon32, size-none20; các consumer còn pending |
| components/shared/ui/Input.tsx | Đọc component; nối normal/dense | Default36/44, override52, dense28, caller48; state/focus regression local |
| components/shared/ui/Select.tsx | Đọc component; nối normal/dense, giữ semantics C9 | Default36/44, override52, dense28, caller48; error/reset regression local |
| components/shared/ui/Select.test.ts | Đọc và đổi assertion class sang token; giữ min-touch/dense/custom assertions | 2 unit PASS; computed dimensions bổ sung bằng browser |
| components/shared/ui/TextareaCheckbox.test.ts | Đọc đầy đủ; chỉ đổi hai assertion Input dense/normal token | 5 unit PASS; không coi đây là full review Textarea/Checkbox |
| tests/e2e/shared-form-states.spec.ts | Thêm 2 test token desktop/mobile và prefix ảnh theo batch | Native React fixture; không synthetic DOM injection; sửa custom property qua DOM để kiểm tra cascade |
| tests/e2e/helpers/materialHarness.html | Review delta forms fixture, thêm small/large/custom/none controls | Real shared React controls; không phải production journey |

Hash trước/sau: `c10-source-changes.csv`. C10 không thêm file nguồn trong scope; TextareaCheckbox.test.ts từ NO→PARTIAL dựa trên review trên. Không đổi file/module/component/surface thành verified YES. Component consumer lists giữ nguyên; matrix chỉ bổ sung mapping và evidence scoped.

## Kiểm thử và giới hạn

Lệnh chạy từ repository root; stdout/stderr và JSON ở `audit/evidence/`.

```sh
AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c10-playwright.config.mjs shared-form-states.spec.ts -g 'height tokens propagate'
AUDIT_PORT=5197 AUDIT_RUN=final AUDIT_SCREENSHOT_PREFIX=c10 npx playwright test --config audit/evidence/c10-playwright.config.mjs shared-form-states.spec.ts glass-controls.spec.ts
AUDIT_PORT=5197 AUDIT_RUN=compatibility npx playwright test --config audit/evidence/c10-playwright.config.mjs apple-tuong-thich.spec.ts
AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit npx playwright test --config audit/evidence/c10-playwright.config.mjs shared-form-states.spec.ts -g 'height tokens propagate'
npm run test:unit
npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c10-unit-final.json
npm run typecheck
npm run lint:eslint
npm run lint:ratchet:ci
npm run build
npx eslint components/shared/ui/TextareaCheckbox.test.ts
```

Before: 2 browser FAIL. Full unit lần đầu 1 FAIL/1489 PASS/4 SKIPPED vì assertion h-7 trong Input dense chưa cập nhật; log `c10-unit.txt` giữ nguyên. Không bỏ assertion: đổi tên class token và giữ đối chứng chiều cao thật trong browser. Final unit 1490 PASS/4 SKIPPED, 172 file PASS/1 SKIPPED. Typecheck/ESLint/ratchet check-only/build PASS. Không sửa lint baseline.

Chromium final: 7 PASS (5 forms/height +2 glass). Đã xem ảnh c10-forms-390.png và c10-forms-1366.png: controls/error text trong viewport, fixture cố ý đặt các size cạnh nhau, không dùng để duyệt visual toàn bộ sản phẩm. WebKit chỉ chọn geometry tests, không tuyên bố giải quyết CORR-009 keyboard. Browser dùng fresh local profile và closed loopback proxy cho traffic ngoài; suite tương thích dùng dữ liệu mẫu local, không xác thực production. Physical Safari/screen reader/device và dịch vụ credentials BLOCKED theo full matrix.

Không xóa dead code: vẫn 27 candidates, mở rộng export/assets/CSS/dependencies pending. CORR-009/010/015 và các acceptance V6 toàn dự án chưa hoàn thành. Không push/deploy.

Kết quả cuối: WebKit geometry 2 PASS; Chromium compatibility 2 PASS (11 tab × 6 viewport, 0 vi phạm khung được suite kiểm tra). Tổng browser cuối 11 PASS, không phải full end-to-end production.

Coverage cuối: 1.363 INCLUDED = 1.304 NO +19 PREFLIGHT_ONLY +40 PARTIAL; verified YES=0. Component452 NO/15 PARTIAL;29 modules và169 surfaces chưa full review. Nguồn: evidence/c10-current-coverage.json. Hash nguồn và trạng thái inventory/ledger đối soát không có mismatch: evidence/c10-final-reconciliation.json.
