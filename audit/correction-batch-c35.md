# C35 — ErrorBoundary recovery feedback: PARTIAL

Đọc đủ ErrorBoundary102dòng,taiLaiKhiLoiChunk62dòng và unit111dòng. Root cause CORR-032: chunkerror fallback luôn khẳng định bản mới đã deploy và đangreload, kể cả duocTuTaiLai từ chối vì hết2lượt/5phút. Chỉ đổi nội dung sang “Không tải được một phần ứng dụng. Vui lòng thử tải lại trang.” Không đổi limiter, auto/manual reload, auth hay API.

Source changes: components/shared/ui/ErrorBoundary.tsx; tests/e2e/helpers/materialHarness.html; mới tests/e2e/error-boundary-recovery.spec.ts. ZIP/SHA trước sửa evidence/c35-checkpoint.zip/.json; delta c35-source-changes.csv; notes c35-file-review-notes.json; references c35-recovery-consumers.txt không fullconsumerreview.

`AUDIT_PORT=5198 AUDIT_RUN=before npx playwright test --config audit/evidence/c35-playwright.config.mjs`:1PASS ordinaryretry,1FAIL truthfulmessage. Final AUDIT_RUN=chromium và AUDIT_ENGINE=webkit AUDIT_RUN=webkit:2PASS mỗi engine. React child thật throw lỗi, fixture action đổi props trước khi bấm retry; chunkfailure là controlled Error input cho boundary, KHÔNG native network import failure. Giới hạn session được seed để test exhaustedstate; manual button thật location.reload và session documentcounter tăng. Không syntheticDOM. Không xác nhận actualdeployment/offline/physicalSafari.

`npx vitest run components/shared/ui/taiLaiKhiLoiChunk.test.ts --reporter=default --reporter=json --outputFile=audit/evidence/c35-unit.json`:6PASS,isolated fake timers/window/session; localpublic JS consistency read. Không biến mocked navigation thành browser/devicePASS. ESLint source/spec PASS;tsc --noEmit PASS;build PASS9.11s. Không rerun fullunit; C31fullunit chỉ historical1490PASS4SKIPPED.

CORR-032 resolved scoped message/retry. Actual missingchunk/offline/deploy/cache, malformedstorage, customfallback, bfcache/device, focus/liveannounce, mobile/contrast remain pending. Full Glass/migration notcomplete. Không push/deploy/productionchanges.

Coverage1376=1146NO12PREFLIGHT_ONLY218PARTIAL;component409NO58PARTIAL;module16NO13PARTIAL;screen165NO6PARTIAL;verifiedYES0. Hash/inventorymismatch0;c35-current-coverage.json/c35-final-reconciliation.json. Toàn MASTER V6 PARTIAL.
