# C9 — shared Button/Input/Select/Tooltip review

Ngày26/10/2026. Toàn dự án PARTIAL. Hash1.362 files đầu batch khớp C8. Checkpoint3 files trước sửa tại c9-checkpoint.zip/manifest. Không thay auth/nghiệp vụ/production, không push/deploy, không bật dark mode.

## Sửa có evidence

- CORR-012: Select error chỉ đổi viền và render paragraph; native select vẫn giữ aria-invalid=false từ caller và thiếu liên kết error. Before desktop/mobile2 FAIL tại assertion invalid. Sửa theo pattern Input: useId riêng, merge describedby của caller với error ID, error ưu tiên invalid=true và role=alert; hết error trả lại props ban đầu. Không đổi onChange/value/options hoặc sizing.
- CORR-013: Button isLoading chỉ disable/spinner, thiếu busy state. Test riêng trước sửa FAIL vì không có aria-busy; thêm aria-busy=true khi loading, giữ prop caller khi không loading. Không đổi disabled, icon, type hoặc callbacks.

## Review theo file

| File | Phạm vi | Evidence/giới hạn |
|---|---|---|
| components/shared/ui/Button.tsx | Đọc toàn bộ variants/sizes/loading/focus; thêm busy | Native Tab +2px outline, busy/reset/disabled, icon sizing; variants khác/consumer journeys chưa đủ |
| components/shared/ui/Select.tsx | Đọc toàn bộ; sửa error semantics | Error/reset/link existing description, selectOption change, disabled, dense28/normal36–44 |
| components/shared/ui/Input.tsx | Đọc toàn bộ; pattern error đang đúng, không sửa | Error linkage/runtime size; left icon button thiếu label API nhưng hiện chỉ có declaration, chưa consumer onLeftIconClick |
| components/shared/ui/Tooltip.tsx | Đọc toàn bộ; không sửa khi chưa xác định consumer | Chưa nối describedby, chưa Escape dismiss; no JSX usage found, chỉ barrel export; không xóa |
| components/shared/ui/utils.ts | Đọc toàn bộ cn merge radius/onActivateKey | Giữ conventions và override; cnBoGoc tests chạy |
| components/shared/ui/icon/AppIcon.tsx | Đọc toàn bộ icon wrapper | Decorative aria-hidden/labeled role, CSS viewport sizes; chưa full registry review |
| components/shared/ui/icon/iconTokens.ts | Đọc toàn bộ | md16/18, xs12/14 và fixed px exception được giữ |
| components/shared/ui/Input.test.ts | Đọc đầy đủ2 static tests | Chạy giữ nguyên; không coi static markup là browser verification |
| components/shared/ui/Select.test.ts | Đọc đầy đủ2 static tests | Dense sizing exception giữ nguyên |
| tests/e2e/helpers/materialHarness.html | Thêm nhánh forms React thật | State error/loading/value do callbacks thật; local fixture không production |
| tests/e2e/shared-form-states.spec.ts (mới) |2 viewport cases +1 independent busy | Chromium; Safari thật/Browsers khác chưa chạy trong C9 |

Consumer mapping: giữ list dependency checkpoint trong design-migration-matrix. Thêm lexical JSX candidates tại evidence/c9-consumer-candidates.json:Button236/Input83/Select35/Tooltip0/AppIcon222 files. Đây KHÔNG phải số consumer đã review; alias/barrel/foreign same-name cần semantic resolution. Đã xem callsites TaxHistorySidebar dense month selector và PhanCa Controls normal select. Không nâng whole-feature review.

## Design system và ngoại lệ

Đo computed styles bằng override --btn-radius=17px: Button/Input/Select đều nhận17px qua rounded-control → --radius-control → --btn-radius; khôi phục biến sau test. Không dùng class-name assertion thay token fidelity.

Giữ 36px desktop/44px mobile form control,28px dense,32px icon visual và md icon16/18px. Không áp token --input-height40 hoặc --btn-height-md40/lg48 hàng loạt vì đang khác convention thực tế36/44. CORR-014 OPEN: cần reconcile token architecture và exceptions trước migration toàn cục; input-radius cũng chưa được sử dụng ở đường rounded-control. Không thêm Glass vào long form/data surfaces.

Tooltip thiếu description/Escape và consumer mapping chưa rõ: CORR-015 OPEN. Đưa vào dead-code candidates POSSIBLE_DEAD (barrel API còn tồn tại), không xóa hoặc tuyên bố tất cả shared UI dùng được.

## Tests

- AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c9-playwright.config.mjs shared-form-states.spec.ts →2 FAIL (Select invalid). c9-before.json.
- AUDIT_PORT=5197 AUDIT_RUN=busy-before npx playwright test --config audit/evidence/c9-playwright.config.mjs shared-form-states.spec.ts -g independently →1 FAIL (busy). c9-busy-before.json.
- AUDIT_PORT=5197 AUDIT_RUN=final npx playwright test --config audit/evidence/c9-playwright.config.mjs →5 PASS (2 glass controls cũ +2 forms viewport +1 busy).
- npx vitest run components/shared/ui/Input.test.ts components/shared/ui/Select.test.ts components/shared/ui/cnBoGoc.test.ts --reporter=json --outputFile=audit/evidence/c9-unit.json →7 PASS.
- Typecheck/ESLint/ratchet check-only/build logs c9-*.txt:PASS/exit0. Không chạy lại full unit C6 ngoài phạm vi này.

Ảnh c9-forms-390.png/c9-forms-1366.png đã xem, xác nhận fixture error/loading bố trí gọn, không tràn. Không dùng ảnh này làm visual approval cho tất cả consumers. Consumer-specific dialogs, screen reader và physical Safari:chưa kiểm chứng/BLOCKED thiếu device session. Full Phase4–6 chưa hoàn tất.
