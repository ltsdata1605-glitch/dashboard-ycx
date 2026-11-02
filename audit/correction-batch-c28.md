# C28 — Nhãn Switch IndustryView: PARTIAL

Đọc đầy đủ IndustryView902dòng, useIndustryViewLogic232dòng và Card; evidence từng file tại evidence/c28-file-review-notes.json. Đọc wiring Dashboard.tsx595–625 và formatter dashboardHelpers.ts40–60, chỉ là snippets, không nâng full review. Consumer refs: evidence/c28-industry-consumers.txt. Checkpoint ZIP+SHA trước sửa tại evidence/c28-checkpoint.zip/.json.

## Root cause và thay đổi

Hai nhóm filter ngành hàng/nhóm hàng có label onClick riêng nhưng không htmlFor/id, Switch không có accessible name. Nối native label với id có prefix useId riêng instance và loại handler label trùng; giữ nguyên callback lọc và shared Switch/BI wrapper. Bộ chọn cột đã có liên kết label/id nên giữ nguyên. Không thay tính toán, thứ tự doanh thu, dòng tổng, authentication hay API.

Ba source thay đổi: features/bi-dashboard/components/dashboard/IndustryView.tsx; tests/e2e/helpers/materialHarness.html; tests/e2e/industry-switch-labels.spec.ts. Hash và delta: c28-source-changes.csv. Fixture dùng component React thật,8ngành hàng và mỗi ngành1nhóm con, local IndexedDB profile mới, chặn proxy ngoài. Không synthetic DOM, không production data.

## Tests

- `AUDIT_PORT=5198 AUDIT_RUN=before npx playwright test --config audit/evidence/c28-playwright.config.mjs`:2FAIL trước sửa vì thiếu accessible name. Lần đầu locator viết hoa chưa khớp formatter được giữ riêng c28-before-uppercase.json/.txt; baseline chính chạy lại với tên đã format trước sửa production.
- Cùng lệnh AUDIT_RUN=chromium:2PASS; AUDIT_ENGINE=webkit AUDIT_RUN=webkit:2PASS. Viewport390/1366, kiểm tra cả ngành và nhóm con: label for/id, role/name/checked, bấm label ẩn đúng dòng, bấm Switch hiện lại. Không kiểm thử iPhone thật hoặc touch journey.
- `npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c28-unit.json`:1490PASS4SKIPPED0FAIL,172filesPASS1SKIPPED,9.42s. Cùng4skip đã ghi C26:3LINE disabled feature+1benchmark optin. Không nâng reviewed toàn bộ file chỉ vì unit execution.
- `npx eslint features/bi-dashboard/components/dashboard/IndustryView.tsx tests/e2e/industry-switch-labels.spec.ts`:PASS.
- `npx tsc --noEmit`:PASS.
- `npm run build`:PASS11.06s. Chỉ chỉnh indentation sau lần build, không đổi semantics.
- Đã xem ảnh Chromium390 và WebKit1366. **Visual390 FAIL**: popup lệch trái/cắt nội dung. Desktop fixture panel đọc được. CORR-028 OPEN, không coi functional testsPASS là visualPASS. Ảnh evidence/c28-industry-*.png.

## Remaining

CORR-023 vẫn OPEN cho consumer BI khác. CORR-028: điều tra geometry/overflow và sử dụng shared overlay positioning phù hợp; kiểm tra ancestor clipping, cuộn, đóng/mở/focus, chiều cao màn hình nhỏ trước đóng. Sorting header chỉ có click và tree expander chưa có tên/expanded semantics cũng cần regression riêng; giữ trong migration matrix. Null active data phụ thuộc Dashboardguard; multi-instance IDs, duplicate names, search, contrast, screenreader, storage lifecycle, real service/device vẫn pending. Không xóa code hay thay exception hợp lệ.

Coverage1.372 INCLUDED =1162NO+12PREFLIGHT_ONLY+198PARTIAL; verifiedYES0. Module16NO13PARTIAL; component425NO42PARTIAL; screen166NO5PARTIAL. Hash/inventory mismatch0, không quét lại dependency/generated trees. Sources evidence/c28-current-coverage.json và c28-final-reconciliation.json. Toàn dự án PARTIAL. Không push/deploy.
