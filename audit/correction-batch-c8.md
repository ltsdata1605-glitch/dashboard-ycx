# C8 — probe message origin/source

Ngày26/10/2026. Toàn dự án PARTIAL. Đầu batch1.361 hashes khớp C7; evidence/c8-initial-delta.json rỗng. Checkpoint2 source trong c8-checkpoint.zip có manifest SHA256 đã kiểm tra. Không đổi auth/permissions/nghiệp vụ/dữ liệu production; không push/deploy.

## CORR-011: root cause và sửa

Listener parent chỉ kiểm message payload, nên frame bất kỳ có thể báo version đã cài. Probe cũng chấp nhận ping từ sibling. Before trên Chromium:3 FAIL/1 PASS. Đã tái hiện bằng Window.postMessage thật từ sibling cùng origin và chính WindowProxy của probe sau khi chuyển tới opaque origin; không tạo MessageEvent giả.

Parent nay yêu cầu e.origin khớp location.origin và e.source là contentWindow của probe hiện hành. Truy vấn frame hiện hành ở mỗi event để reload không mất tương thích. Probe yêu cầu cùng origin và nguồn window.parent. Hai chiều dùng targetOrigin cụ thể thay '*'. Giữ nguyên main-window CustomEvent pong, storage updates, callback và reload API.

## Evidence theo file

| File | Review/thay đổi | Giới hạn |
|---|---|---|
| features/bi-dashboard/services/userscriptProbeService.ts | Đọc đủ, thêm origin/source guard và targetOrigin; trace reload/listeners | Chưa audit performance/lifecycle đầy đủ; trusted same-origin JS không thuộc threat model này |
| public/userscript-probe.html | Đọc đủ, thêm parent/origin guard và targetOrigin | Extension injection thật chưa chạy |
| tests/e2e/userscript-probe-boundary.spec.ts (mới) |5 tests browser native messages; actual service + actual HTML probe | CustomEvent pong là fixture extension boundary, không claim Tampermonkey cài thật |
| tests/unit/userscript-probe.test.ts | Đọc đủ4 tests và mocks, chạy giữ nguyên | Node mocks; không test nguồn message |
| features/bi-dashboard/services/biAutoSyncService.version.test.ts | Đọc đủ4 tests; so version và metadata userscript, chạy giữ nguyên | Không deep review toàn biAutoSyncService/userscript |

Consumer callsites: useBiAutoSync.tsx:99 và DataUpdater.tsx:593 gọi watcher khi outdated rồi callback tự chạy sync; xem các đoạn trước/sau để xác định tác động, không nâng toàn2 consumer reviewed. public/scripts/mwg-auto-thu-thap-diem-thuong.user.js:1421–1426 đáp ping bằng CustomEvent pong có source/type/nonce/version; chỉ đọc đoạn giao thức, không full review script.

## Regression

- `AUDIT_PORT=5197 AUDIT_RUN=before npx playwright test --config audit/evidence/c8-playwright.config.mjs`:3 FAIL/1 PASS, c8-before.json. Giữ cả trace/failure; không sửa assertion để xanh.
- `AUDIT_PORT=5197 AUDIT_RUN=chromium npx playwright test --config audit/evidence/c8-playwright.config.mjs`:5 PASS.
- `AUDIT_PORT=5198 AUDIT_ENGINE=webkit AUDIT_RUN=webkit npx playwright test --config audit/evidence/c8-playwright.config.mjs`:5 PASS; không Safari iPhone thật.
- Cases: sibling same-origin version bị từ chối; owned frame opaque-origin bị từ chối; probe sau reload được chấp nhận callback đúng1 lần; ping parent chấp nhận/sibling từ chối; actual HTML probe chuyển tiếp pong tới watcher.
- `npx vitest run tests/unit/userscript-probe.test.ts features/bi-dashboard/services/biAutoSyncService.version.test.ts --reporter=json --outputFile=audit/evidence/c8-unit.json`:8 PASS. Existing storage/version behaviors được giữ.
- `npm run typecheck`, `npm run lint:eslint`, `npm run lint:ratchet:ci`, `npm run build`:PASS/exit0, c8-*.txt. Không gọi check/deploy scripts.

Safety: profile local mới, proxy ngoài đóng. Các iframe được tạo để mô hình hóa nguồn message và chạy HTML probe thật; không dùng DOM giả làm bằng chứng React behavior. Không chạy job thu thập MWG hay gửi tin. Tampermonkey thực/credentials/MWG/physical device:BLOCKED vì chưa có session test.

## Acceptance

CORR-011 RESOLVED cho nguồn postMessage đã tái hiện và regression local; không nâng verified file/entity. Full consumer BI journey và extension compatibility chưa hoàn tất. CORR-009/010, Design Foundation/migration, dead-code/export/assets/CSS/dependencies và1.310 file NO còn tiếp tục. Không xóa code; dead-code classification C7 giữ nguyên.
