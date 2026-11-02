# Package scripts — preflight

Phân loại theo script và cấu hình đã đọc. Test/script con chưa review đầy đủ không được coi là an toàn chỉ vì tên có test.

| Package | Script | Lệnh | Quyết định |
|---|---|---|---|
| package.json | dev | `vite --host 127.0.0.1` | Khởi chạy server; dev mở browser và có proxy LINE, serve mở emulator — chưa chạy |
| package.json | build | `vite build` | Ghi output cục bộ; root Vite sinh dist/sw.js; chưa chạy |
| package.json | preview | `vite preview` | Khởi chạy server; dev mở browser và có proxy LINE, serve mở emulator — chưa chạy |
| package.json | lint | `tsc --noEmit` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | typecheck | `tsc --noEmit` | PASS — đã chạy, noEmit |
| package.json | lint:eslint | `eslint .` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | lint:ratchet | `node scripts/lint-ratchet.cjs` | Có thể ghi violations-baseline.json; ưu tiên bản ci --check-only sau review đầy đủ |
| package.json | lint:ratchet:ci | `node scripts/lint-ratchet.cjs --check-only` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | typecheck:functions | `npm run typecheck --prefix functions` | PASS — đã chạy, noEmit |
| package.json | audit | `npm audit \|\| true` | Không dùng để kết luận PASS: || true che exit code; cần lệnh giữ exit code |
| package.json | check | `npm run typecheck && npm run lint:eslint && npm run test:unit && npm run build && npm run check:budget && npm run lint:ratchet` | Không chạy gộp ở preflight: chứa build và ratchet có ghi baseline |
| package.json | check:budget | `node scripts/kiem-goi-tai-dau.cjs` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | predeploy | `npm run build` | CẤM trong lượt này; predeploy thuộc chuỗi deploy |
| package.json | deploy | `git add -A && git commit -m "chore: sync source code and deploy latest web changes" \|\| echo "No changes to commit" && git push origin main && gh-pages -d dist` | CẤM trong lượt này; predeploy thuộc chuỗi deploy |
| package.json | deploy:rules | `firebase deploy --only firestore` | CẤM trong lượt này; predeploy thuộc chuỗi deploy |
| package.json | deploy:functions | `firebase deploy --only functions` | CẤM trong lượt này; predeploy thuộc chuỗi deploy |
| package.json | deploy:hosting | `firebase deploy --only hosting` | CẤM trong lượt này; predeploy thuộc chuỗi deploy |
| package.json | test:rules | `npx firebase emulators:exec --only firestore "node tests/firestore.rules.test.mjs"` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | test:unit | `vitest run` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | test:unit:watch | `vitest` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | test:unit:coverage | `vitest run --coverage` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | test:related | `vitest related --run` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | test:e2e | `playwright test` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | test:e2e:headed | `playwright test --headed` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| package.json | test:verify-silent | `playwright test tests/e2e/kpi-style-real-user.spec.ts --project=chromium` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| functions/package.json | build | `tsc` | Ghi output cục bộ; root Vite sinh dist/sw.js; chưa chạy |
| functions/package.json | build:watch | `tsc --watch` | SKIPPED — Phase 2; review script/test con trước khi chạy |
| functions/package.json | typecheck | `tsc --noEmit` | PASS — đã chạy, noEmit |
| functions/package.json | serve | `npm run build && firebase emulators:start --only functions,firestore,auth` | Khởi chạy server; dev mở browser và có proxy LINE, serve mở emulator — chưa chạy |
| functions/package.json | deploy | `npm run build && firebase deploy --only functions` | CẤM trong lượt này; predeploy thuộc chuỗi deploy |
