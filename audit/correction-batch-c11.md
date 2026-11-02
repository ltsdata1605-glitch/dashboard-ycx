# C11 — radius mapping và ngoại lệ consumer — PARTIAL

26/10/2026. Tiếp tục checkpoint C10, hash đầu batch 1.363 INCLUDED khớp ledger. Không quét lại dependency/generated trees. Checkpoint `evidence/c11-checkpoint.zip` và manifest giữ bản trước sửa. Không sửa production component, business logic, authentication, dữ liệu; không push/deploy.

## Kết luận

`styles.css:16` ánh xạ rounded-control → btn-radius → p-radius-lg(8px). Button/Input/Select đều dùng rounded-control; utils.ts đã đăng ký 4 semantic radius với tailwind-merge. Đây là chuẩn chung có chủ đích, không cần tạo rounded-input riêng. Tài liệu DESIGN_SYSTEM.md trước đó gợi ý input-radius đang được dùng và chiều cao button30px, không khớp implementation. Sửa mô tả sang mapping thật và height tokens C10; thêm chú thích ưu tiên quy tắc V6 hiện hành khi mô tả lịch sử về khung dữ liệu vuông mâu thuẫn. Không tuyên bố Liquid Glass complete.

`--input-radius` chỉ tìm thấy khai báo trong các file code/CSS/HTML in-scope. Candidate POSSIBLE_DEAD, giữ nguyên vì chưa chứng minh không có runtime/external consumer. Scan `evidence/c11-radius-reference-scan.json` là exact-name lexical scan trên inventory, không phải full review mọi file hay bằng chứng đủ để xóa CSS.

## Evidence từng entity

- DESIGN_SYSTEM.md: đọc đủ367 dòng trước sửa; sửa mapping radius, height và ưu tiên quy tắc hiện hành. PARTIAL vì các claim lịch sử và mapping còn lại chưa được xác thực toàn bộ.
- Button.tsx, Input.tsx, Select.tsx: đọc đầy đủ, đối chiếu class/cn/thứ tự className. Không sửa source; test actual shared React controls normal/dense/default/caller override.
- utils.ts và cnBoGoc.test.ts: đọc đầy đủ; đăng ký control/card/popup/overlay; 3 assertions groups kiểm tra lớp sau/cạnh/breakpoint và shared cn PASS. Không đổi code.
- tests/e2e/shared-form-states.spec.ts: thêm 2 radius tests390/1366, kiểm tra default8px, đổi btn-radius17/card21/popup13, giữ override Input0, reset8/16/12; giữ nguyên tests states/height trước đó.
- tests/e2e/helpers/materialHarness.html: đọc toàn bộ; chỉ thêm rounded-card/none/popup vào ba controls đã có caller height override; không synthetic DOM insertion.
- features/phan-ca/components/Legend.tsx: đọc đủ221 dòng. Source review PARTIAL: props targets/callbacks, nhánh onboarding, toggles, gender/hour controls, color legend. Select dense h6/rounded-none/border-bottom và Input dense h6 là ngoại lệ control gọn trong dòng36px; Button size-none tự định height/radius. Không đổi công thức/clamp hay mật độ. Consumer được xác nhận tại PhanCaView.tsx:639–652 (chỉ đọc callsite, không full review file cha). Runtime parent integration, contrast/font-black, keyboard/touch nhỏ và onboarding tooltip còn cần kiểm tra; NOT_RUN cho Legend. EditShiftModal.tsx đã đọc output một phần nhưng bị truncate: không nâng trạng thái review.
- styles.css/tokens.css: chỉ trace vùng khai báo radius và reference scan; không coi là full styles review trong C11.

## Tests

```sh
AUDIT_PORT=5197 AUDIT_RUN=chromium AUDIT_SCREENSHOT_PREFIX=c11 npx playwright test --config audit/evidence/c11-playwright.config.mjs shared-form-states.spec.ts
AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit AUDIT_SCREENSHOT_PREFIX=c11-webkit npx playwright test --config audit/evidence/c11-playwright.config.mjs shared-form-states.spec.ts -g 'radius contract'
npx vitest run components/shared/ui/Input.test.ts components/shared/ui/Select.test.ts components/shared/ui/TextareaCheckbox.test.ts components/shared/ui/cnBoGoc.test.ts --reporter=default --reporter=json --outputFile=audit/evidence/c11-unit.json
npm run typecheck
npx eslint tests/e2e/shared-form-states.spec.ts
```

7 Chromium PASS,2 WebKit PASS,12 unit PASS; typecheck/targeted ESLint PASS. Xem JSON/txt cùng prefix c11. Đã inspect ảnh c11-radius-390/1366.png: normal/dense controls trong viewport, override vuông/card/popup hiện đúng; đây là isolated fixture, không duyệt visual mọi consumer. Test focus cũ dùng Tab và computed outline còn nguyên. Không có runtime bug fix nên không tạo test đỏ giả. Không chạy lại full unit/build vì production source không đổi; kết quả C10 giữ tính lịch sử, không gắn nhãn là C11 run. Physical iPhone/screen reader và full production journeys vẫn BLOCKED/chưa đủ evidence theo full matrix.

## Remaining

CORR-014 giữ OPEN cho acceptance từng consumer; height và mapping radius đã đối soát ở shared fixture. CORR-009/010/015 chưa giải quyết trong batch này. Dead code chưa xóa. Tiếp theo: Tooltip consumer/API và accessibility, các control/Modal/Table/Navigation/FloatingAction khác, full styles/material/performance và regression journey theo module.

## C11 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.363 in-scope =1.302 NO +18 PREFLIGHT_ONLY +43 PARTIAL; verified YES=0. Component450 NO/17 PARTIAL;29 modules169 surfaces chưa full review. Hash và inventory mismatch0. Nguồn evidence/c11-current-coverage.json và evidence/c11-final-reconciliation.json.

Sửa tài liệu radius/height để khớp shared controls và ưu tiên quy tắc V6; giữ rounded-control chung, không sửa production code. Runtime radius/override/reset:7 Chromium +2 WebKit PASS;12 unit PASS; typecheck/targeted ESLint PASS. Legend review source-only, giữ dense/rounded-none và chưa xác thực journey. input-radius POSSIBLE_DEAD;28 candidates, không xóa. CORR-014 OPEN cho consumer acceptance. Chi tiết và 3 file thay đổi: correction-batch-c11.md/c11-source-changes.csv. Không push/deploy.
