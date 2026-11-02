# C7 — transaction completion và dead-code entry points

Trạng thái dự án PARTIAL. Đầu batch1.361 hashes khớp C6 (`c7-initial-delta.json`). Checkpoint trước sửa `c7-checkpoint.zip` + manifest được đối chiếu SHA256. Không push/deploy, không đổi dữ liệu production, auth, permissions hoặc công thức.

## CORR-010: mutation atomicity

Đọc lại toàn bộ taxIndexedDbService và regression C5/C6. delete/clearAll resolve từ request success; updateMonth/updateMonths resolve ngay sau enqueue put. Request success không phải transaction commit, nên rollback vẫn báo thành công và taxSyncService có thể tiếp tục ghi cloud.

Thêm8 cases trên IndexedDB thật:4 methods × commit/abort. Seed2 bản khác tên; updateMonths dùng cả local ID và createdAt; abort sau request đầu xác minh cả2 rows còn nguyên. Before:4 FAIL/7 PASS (3 save tests cũ +4 commit PASS). Sau sửa:15 Chromium PASS gồm4 merge regressions nữa.

Sửa4 methods dùng helper nội bộ transactionDone: resolve ở oncomplete, reject ở onabort/onerror. Không đổi selection theo ID/createdAt, nội dung tháng, quy tắc xóa, kiểu trả về hoặc cloud API. save giữ bản sửa C5; getAll không thay. Các callsites trong taxSyncService dùng await; reject ngăn bước cloud tiếp theo. Kiểm thử service với cloud mock không thay xác thực Firebase thật.

## Evidence theo file

| File | Review/thay đổi | Giới hạn |
|---|---|---|
| features/tax-calculator/services/taxIndexedDbService.ts | Đọc toàn bộ, sửa4 mutation completion handlers | Quota/getAll catch và concurrency nhiều tab còn thiếu |
| tests/e2e/tax-storage-atomicity.spec.ts | Đọc toàn bộ, thêm8 commit/abort cases, giữ3 test cũ | Native IDB profile mới; không dữ liệu production |
| public/userscript-probe.html | Đọc đầy đủ52 dòng bridge; không sửa | Tampermonkey runtime chưa chạy; origin validation OPEN |
| features/bi-dashboard/services/userscriptProbeService.ts | Đọc đầy đủ170 dòng; trace iframe/watchers/cleanup | Chưa review full useBiAutoSync/DataUpdater consumers |

Index HTML/PWA auth chỉ được kiểm entry/URL/hosting; không nâng full review. Large public/check-thuong output bị truncate và LIFF external config chưa có, giữ UNKNOWN. Chi tiết phân loại: evidence/c7-dead-code-entrypoints.md.

## Dead-code

3 candidates UNKNOWN → INTENTIONALLY_RETAINED với tham chiếu cụ thể: index.html, auth-hosting/pwa-login.html, public/userscript-probe.html. Tổng26:7 INTENTIONALLY_RETAINED,2 POSSIBLE_DEAD,17 UNKNOWN. Không xóa source. Không dùng dynamic imports để suy ra mọi code có consumer. Unused exports/assets/CSS/dependencies vẫn chưa audit đầy đủ.

CORR-011 OPEN: static review phát hiện onMessage probe thiếu kiểm origin/source, iframe ping/parent message dùng wildcard. Cần test cô lập thông điệp từ frame khác trước sửa protocol; không claim exploit/runtime verification.

## Commands

- `AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c7-playwright.config.mjs tax-storage-atomicity.spec.ts`:4 FAIL/7 PASS, c7-before.json.
- `AUDIT_PORT=5197 AUDIT_RUN=chromium npx playwright test --config audit/evidence/c7-playwright.config.mjs`:15 PASS, c7-chromium.json.
- `AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit npx playwright test --config audit/evidence/c7-playwright.config.mjs`:kết quả chốt test-results.md; WebKit không phải Safari iPhone thật.
-5 targeted unit files như C6, JSON c7-unit.json. Full unit C6 1.490 PASS/4 SKIPPED là historical; không tự gán PASS mới cho toàn repo.
- `npm run typecheck`, `npm run lint:eslint`, `npm run lint:ratchet:ci`, `npm run build`:logs c7-*.txt; kết quả cuối test-results.md.

## Remaining

CORR-010 còn quota/localStorage, concurrent snapshots/multi-tab, same-createdAt payload và offline fallback; privacy UI. CORR-009 sau import và CORR-011 probe protocol còn mở. Design Foundation/migration/consumer visual, full review/dead code/full journey vẫn PARTIAL. Credentials/services/device chưa có môi trường BLOCKED.

Chốt C7:15 Chromium PASS,15 WebKit PASS,23 unit PASS; typecheck/ESLint/ratchet/build exit0. Ledger1.361 files không thêm source;1.312 NO/19 PREFLIGHT_ONLY/30 PARTIAL, verifiedYES0. Source changes2 files tại c7-source-changes.csv.
