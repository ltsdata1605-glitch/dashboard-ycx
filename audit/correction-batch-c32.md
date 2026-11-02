# C32 — Native IndexedDB legacy bonus fallback: PARTIAL

CORR-030 root cause tái hiện: thiếu settings store, callback đóng DB/resolve null nhưng tiếp tục transaction(), gây uncaught error “database connection is closing”. Thêm return sau resolve(null), không đổi công thức hay schema. Đọc lại đầy đủ hook; fetchSupermarketMap guest branch và db/scope snippets được đọc phục vụ safety, không đánh dấu full review các file đó.

Source changes: features/bi-dashboard/hooks/useCheckThuongBonus.ts; tests/e2e/helpers/materialHarness.html; mới tests/e2e/bonus-legacy-fallback.spec.ts. Checkpoint ZIP/SHA evidence/c32-checkpoint.zip/.json; delta c32-source-changes.csv, notes evidence/c32-file-review-notes.json.

Test `AUDIT_PORT=5198 AUDIT_RUN=before npx playwright test --config audit/evidence/c32-playwright.config.mjs`:1FAIL missingstore (uncaught native transaction error),1PASS validstore. Final AUDIT_RUN=chromium và AUDIT_ENGINE=webkit AUDIT_RUN=webkit:2PASS mỗi engine. Hook thật enabled, native IndexedDB, synthetic legacy data. Wrapper close chỉ đếm và gọi nativeClose nguyên bản; chờ lần close thứ2 chứng minh fallback đã chạy; assert source hoặc NO_BONUS và không pageerror. Không fake transaction hoặc synthetic DOM.

Fixture đặt localUID audit-c32/inheritfalse để DBscoped không tự tạo settings trong DBlegacy; không đăng nhập Firebase, guestmap branch không cloudread/write. Browserprofile mới/proxy ngoài chặn. Không production data/schema/auth changes. Thử valid payload không xác nhận công thức thưởng hay migration/account lifecycle.

ESLint hook/spec PASS; tsc --noEmit PASS; npm run build PASS9.27s. Không rerun fullunit C32; latest fullunit C31 là lịch sử1490PASS4SKIPPED. CORR-030 RESOLVED trong2nhánh nativeIDB; versionchange/blocked/quota/privacy/account migration còn pending. Không push/deploy.

Coverage1374=1154NO12PREFLIGHT_ONLY208PARTIAL; verifiedYES0. Module16NO13PARTIAL,component419NO48PARTIAL,screen165NO6PARTIAL. Hash/inventory mismatch0; evidence/c32-current-coverage.json/c32-final-reconciliation.json. Toàn MASTER V6 PARTIAL.
