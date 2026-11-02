# C22 — Dependencies và full unit regression: PARTIAL

Đọc9file manifest/config/test, ghi riêng `evidence/c22-file-review-notes.json`. Không sửa source/package/lockfile. Hash scope hiện có, không inventory lại dependency/generated trees.

`dependency-audit.csv` phân loại49declarations ở3manifest:46INTENTIONALLY_RETAINED,3POSSIBLE_DEAD. Đây là lý do giữ qua import/config/type/CLI contract, không phải49package đã được production runtime verification. Graph references dùng checkpoint hiện có; exact-name scan zero-import candidates chỉ đọc file INCLUDED dạng code/config, không quét node_modules/dist hoặc coi mọi file scan là reviewed.

Ba candidate mới: `package.json#papaparse`, `package.json#@types/papaparse`, `package.json#autoprefixer`. Papaparse chỉ thấy manifest và manualChunks predicate; predicate không import thư viện. Autoprefixer manifest-only, không có PostCSS config trong inventory. Chưa có clean-install/removal experiment, transitive/peer/CLI contract đầy đủ nên KHÔNG xóa. Type packages React/Node/Qrcode, ESLint resolver và coverage provider có cơ chế resolution gián tiếp hợp lệ; giữ nguyên. Gh-pages/Firebase CLI có scriptconsumer nhưng không chạy deploy/admin scripts.

Dead-code candidate tổng32:20INTENTIONALLY_RETAINED,11POSSIBLE_DEAD,1LEGACY_ACTIVE. Không DEFINITE_DEAD, không xóa. Unused exports/assets/CSS và graph delta toàn diện còn pending. CORR-024 OPEN.

## Tests

Sau C20/C21 shared changes, chạy lại suite local đã chạy C16 (test definitions không đổi ngoài E2E mới; E2E không nằm trong Vitest include):

`npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c22-unit.json`

**1490PASS,4SKIPPED,0FAIL;172filesPASS/1fileSKIPPED**. Lưu log/json và từng assertion trong executionledger; testexecution không chuyển mọi sourcefile sang reviewed/verified.4skip:3LINE multi-group vì feature tạm tắt (test download fallback vẫn chạy),1benchmark opt-in. Không bật feature để làm mất skip. Suite này không gồm functions/scraper/E2E/rules theo config; không phải full production regression.

Đọc đầy đủ benchmark và thử riêng `BENCH=1 npx vitest run tests/bench/filter-100k.test.ts` (thêm `--silent=false` ở lần2). Runner báo1case executed, nhưng logs không chứa các số đo console dự kiến. Không dùng duration runner làm latency lọc và không kết luận đạt mục tiêu200ms. Measurement evidence còn thiếu; không thay assertion hoặc giả số liệu.

C21 build/typecheck/lint là checkpoint gần nhất, không chạy lại vì C22 không sửa source. Không gọi dịch vụ ngoài/push/deploy. Physical iPhone/LINE/credentials suites tiếp tục BLOCKED theo matrix;1490unitPASS không thay thế các blockers.

Đối soát: `evidence/c22-current-coverage.json`, `evidence/c22-final-reconciliation.json`. Toàn dự án PARTIAL, verifiedYES0.
