# Kết quả Phase 0

| Lệnh/kiểm tra | Trạng thái | Exit | Bằng chứng |
|---|---|---:|---|
| npm run typecheck | PASS | 0 | evidence/typecheck.txt; 15,44 s |
| npm run typecheck:functions | PASS | 0 | evidence/typecheck-functions.txt; 2,31 s |
| Đọc lại archive, đối chiếu 1.346 SHA-256 | PASS | 0 | checkpoint.json + manifest trong archive/phase0-* hợp lệ |
| WebKit | BLOCKED | — | executable không tồn tại; environment.json |
| Chromium / Safari iPhone / PWA | SKIPPED | — | Chưa chạy runtime |
| ESLint, unit, E2E, build, budget, performance | SKIPPED | — | Phase 2, cần kiểm side effects trước |

Không dùng typecheck PASS để khẳng định chức năng hay toàn dự án đã verified.

## Cập nhật sau Phase 0

WebKit đã cài và chạy được (thay thế trạng thái thiếu binary ở trên). 4/5 bài PASS; focus modal FAIL tái hiện 2 lần trên WebKit, cùng bài PASS trên Chromium. Root cause chưa xác định. Xem webkit-test-followup.md và evidence/*-focus.txt.

## Correction batches C1/C2 — 25/10/2026

- `npm run test:unit -- --reporter=json --outputFile=audit/evidence/correction-unit.json`: PASS execution, 171 files, 1477 assertions PASS, 4 SKIPPED, 0 FAIL. Three LINE compatibility skips + opt-in benchmark; not production verification.
- `npm run typecheck`: PASS. `npm run typecheck:functions`: PASS.
- `npm run lint:eslint`: PASS. `npm run build`: PASS, 12.49s, local output only.
- `npx playwright test --config audit/evidence/correction-playwright.config.mjs` at original 4-spec configuration: 17/17 PASS Chromium; canonical correction-e2e.json. Initial sandbox run BLOCKED by listen EPERM, permitted retry completed.
- Material new test initial FAIL: computed CSS normalized 180% to 1.8; fixed unit normalization, added token propagation assertion, retest PASS. Logs retained.
- WebKit current batch NOT_RUN; physical iPhone Safari BLOCKED (no physical device session); production/auth/external integration BLOCKED pending isolated service setup.
- git diff check default reports CRLF CSV lines as trailing whitespace; with repository CSV CRLF interpretation (`git -c core.whitespace=cr-at-eol diff --check`) PASS.

`full-test-matrix.csv`: 29 module groups, 87 journey rows, semantic mapping remains partial. `e2e-test-matrix.csv`: every spec recorded with explicit NOT_RUN/BLOCKED/PASS; source marker scans do not establish safety.

Material follow-up: lần chụp ảnh sau đó FAIL trước assertions vì execution context bị navigation hủy khi inject harness vào app root. Chuyển test sang materialHarness.html nạp cùng React harness và production CSS, không khởi tạo root App: PASS 1/1; log correction-material-isolated.txt. Ảnh đã tắt animation khi chụp. Không suy ra production app có lỗi navigation từ lỗi harness này.

C2 viewport follow-up: aggregate harness documentWidth404/innerHeight873 vs visual390x844. Dedicated real ActionMenu fixture yields layout390x844; unchanged viewport assertion PASS. Evidence: correction-material-final-isolated.txt. Aggregate harness overflow remains OPEN CORR-005. Latest screenshot inspected: Cancel fully inside viewport.

## Batch C3 — 25/10/2026

- `AUDIT_PORT=5192 npx playwright test --config audit/evidence/c3-playwright.config.mjs -g 'Aggregate harness' --reporter=list`: trước sửa 2 FAIL (320/390), 1 PASS (440); c3-overflow-before.txt. Sau flex-wrap: 14/14 PASS gồm 10 Apple UI tests cũ; c3-overflow-after.txt.
- C3 Glass lần đầu: 2 FAIL focus offset/14 PASS; c3-glass-before.json. Giới hạn transition Capsule: 16/16 PASS; c3-e2e.json, c3-glass-retest.txt.
- `AUDIT_ENGINE=webkit ... -g 'Aggregate harness|iPhone 16 Pro Max|laptop'`: 13/13 PASS; c3-webkit.json. Engine WebKit local, không phải thiết bị iPhone.
- Controls final: tắt reduced transparency trước khi kiểm forced colors riêng; 2/2 PASS, c3-chromium.json.
- App compatibility local fixture: mobile PASS, laptop lần đầu FAIL teardown trace ENOENT do chạy đồng thời dùng chung output. Assertions hai phần đều 0 vi phạm. Rerun riêng laptop với `--output test-results/c3-laptop-retest`: 1/1 PASS; c3-app-laptop-retest.txt. Không tính lần teardown lỗi là PASS.
- `npm run test:unit -- components/shared/ui/CapsuleBar.test.ts`: 7/7 PASS.
- `npm run typecheck`: lần đầu FAIL vì checkpoint chứa bản sao TSX thiếu dependencies. Đóng gói ZIP, xác minh hash, bỏ các bản sao khỏi input compiler; giữ tsconfig. Rerun PASS (c3-typecheck-final.txt).
- `npm run lint:eslint`: PASS. `npm run lint:ratchet:ci`: PASS, không ghi lại baseline.
- `npm run build`: PASS sau đóng gói checkpoint, 12.90s (c3-build-clean-checkpoint.txt). Không deploy.
- Ảnh controls390/1366 đã xem: đây là fixture, không phải chứng nhận visual toàn feature. Không có benchmark performance thiết bị hay engine thiếu backdrop support. Physical Safari và dịch vụ cần credentials vẫn BLOCKED.

## C4 — regression local 25/10/2026

| Lượt | Kết quả | Evidence |
|---|---|---|
| Trước sửa | 2 FAIL (fallback + clipping) | c4-before.json |
| Sau sửa đầu | 4 PASS | c4-after.json |
| Cuối Chromium | 5 PASS | c4-final.json |
| App compatibility mobile/laptop | 2 PASS;0 vi phạm | c4-compatibility.json |
| WebKit font keyboard | 1 FAIL: Tab không tới font | c4-webkit-focus.json |
| Typecheck, ESLint, ratchet check-only, build | PASS | c4-typecheck.txt; c4-eslint.txt; c4-ratchet.txt; c4-build.txt |

Command đầy đủ và safety tại correction-batch-c4.md. Không gọi mock/fixture là production. Physical Safari và credentials/services không có môi trường test: BLOCKED. Full unit C2 là lịch sử, không bao phủ delta thuế C4. Mọi assertion trước/sau được giữ trong test-execution-ledger.csv. Không đổi lỗi WebKit thành SKIPPED.

C4 diff-check: source/audit của batch PASS. Toàn working tree FAIL do dòng trống cuối tests/e2e/tax-qr-and-export.spec.ts:287 trong delta ngoài batch; giữ nguyên sửa đổi đó. Không coi đây là lỗi runtime.

## C5 — kết quả theo lượt

- Unit trước sửa:3 PASS/1 FAIL cloud ID collision; sau sửa4 suite17 PASS. c5-unit-before/final.json.
- Native Chromium IndexedDB trước:1 PASS/2 FAIL; sau:3 PASS. c5-storage-before/final.json.
- WebKit data-loaded Tab:FAIL timeout60s; Option+Tab:FAIL timeout60s. c5-webkit-tab/option-tab.json. Chưa xác định root cause; ảnh cho thấy export overlay đang hiện.
- Typecheck/ESLint/ratchet check-only/build:PASS, exit0. c5-typecheck/eslint/ratchet/build.txt.
- Mock cloud không phải production; Firebase thật/physical Safari BLOCKED do thiếu môi trường. Full suite chưa chạy lại; không kế thừa PASS C2 cho mọi delta thuế.
- Giữ test gốc; AUDIT_FOCUS_EMPTY=1 chỉ là lượt cô lập header trước nhập dữ liệu, không thay acceptance sau nhập. Kết quả thêm ghi riêng.

### C5 WebKit follow-up — kết luận phạm vi
Trước nhập dữ liệu: Tab80 bước đều BODY → FAIL; cùng app/profile setup, Option+Tab đi qua13 controls tới font → PASS outline solid2px offset2px và0 clipping ancestors. `c5-webkit-empty.json` / `c5-webkit-empty-option.json`; screenshot `webkit-empty-option-system-focus.png` đã xem. Kết quả đối chiếu phù hợp với policy keyboard của engine trong môi trường local, không phải bằng chứng nút font không thể nhận focus. Giữ CORR-009 OPEN cho journey sau nhập (export overlay xuất hiện trong ảnh timeout) và Safari thiết bị thật. Không sửa app hay default Tab test để biến FAIL thành PASS. Typecheck-final exit0 sau chỉnh diagnostics; diff-check các file C5 PASS.

## C6 — merge/replay regression

- `c6-before.json`:1 PASS/5 FAIL (4 mất durable survivor,1 replay giữ bản cũ).
- `c6-unit-final.json`:23 PASS;5 targeted files.
- `c6-storage.json`:7 PASS Chromium;4 merge cases actual service/native IDB +3 C5 atomicity. Firebase boundary stubbed, không production verification.
- `c6-full-unit.json`:173 files,1.490 PASS/4 SKIPPED/0 FAIL. Không cộng targeted/retest thành coverage mới. Skips giữ nguyên và ghi từng assertion trong test-execution-ledger.csv.
- `c6-typecheck-final.txt`, `c6-eslint.txt`, `c6-ratchet.txt`, `c6-build.txt`:PASS/exit0. Build local không deploy.
- Firebase thật/emulator chưa cấu hình; credentials, external services, thiết bị vật lý:BLOCKED. Chưa gọi full E2E/journey đã hoàn tất.

## C7 — native IDB mutation completion

- c7-before.json:4 FAIL/7 PASS; giữ regression abort thất bại trước sửa.
- c7-chromium.json:15 PASS; c7-webkit.json:15 PASS; cả hai là local fresh profile, Firebase boundary fixture trong merge tests.
- c7-unit.json:23 PASS,5 files targeted. Không chạy lại full unit không liên quan; C6 full result vẫn historical.
- c7-typecheck/c7-eslint/c7-ratchet/c7-build.txt:PASS/exit0.
- Probe/Auth static references không có runtime PASS. Physical Safari/Tampermonkey/real services không có session test:BLOCKED. Không sửa hoặc bỏ assertion để báo xanh.

## C8 — probe protocol
Before3 FAIL/1 PASS (c8-before.json); final5 Chromium PASS +5 WebKit PASS;8 unit PASS. Typecheck/ESLint/ratchet/build exit0. Commands và fixture boundaries: correction-batch-c8.md. Preserve historical failures. Real Tampermonkey/MWG/physical device BLOCKED; không claim full BI E2E.

## C9
Before Select2 FAIL + busy1 FAIL; final5 Chromium PASS (2 glass +3 forms),7 unit PASS. Typecheck/ESLint/ratchet/build exit0. Images390/1366 inspected; only fixtures, not all consumer visual approval. Commands correction-batch-c9.md. Physical Safari/screen reader device not verified; preserve all FAIL records.

## C10 — checkpoint hiện hành, 26/10/2026

PARTIAL: 1.363 in-scope;1.304 NO;19 PREFLIGHT_ONLY;40 PARTIAL; verified YES=0. Component452 NO/15 PARTIAL;29 modules169 surfaces chưa full review. Nguồn evidence/c10-current-coverage.json; hash/inventory mismatch0.

Nối height tokens vào Button/Input/Select, giữ default36/44, dense28, icon32 và caller overrides. CORR-014 còn OPEN cho radius/consumer acceptance. Browser cuối11 PASS (7 Chromium fixture +2 compatibility +2 WebKit geometry); full unit1490 PASS/4 SKIPPED; typecheck/ESLint/ratchet/build PASS. Before2 browserFAIL và unit lần đầu1FAIL giữ nguyên evidence. Xem correction-batch-c10.md và c10-source-changes.csv. Không push/deploy.

## C11 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.363 in-scope =1.302 NO +18 PREFLIGHT_ONLY +43 PARTIAL; verified YES=0. Component450 NO/17 PARTIAL;29 modules169 surfaces chưa full review. Hash và inventory mismatch0. Nguồn evidence/c11-current-coverage.json và evidence/c11-final-reconciliation.json.

Sửa tài liệu radius/height để khớp shared controls và ưu tiên quy tắc V6; giữ rounded-control chung, không sửa production code. Runtime radius/override/reset:7 Chromium +2 WebKit PASS;12 unit PASS; typecheck/targeted ESLint PASS. Legend review source-only, giữ dense/rounded-none và chưa xác thực journey. input-radius POSSIBLE_DEAD;28 candidates, không xóa. CORR-014 OPEN cho consumer acceptance. Chi tiết và 3 file thay đổi: correction-batch-c11.md/c11-source-changes.csv. Không push/deploy.

## C12 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.364 in-scope =1.301 NO +18 PREFLIGHT_ONLY +45 PARTIAL; verified YES=0. Component450 NO/17 PARTIAL;29 modules169 surfaces chưa full review. Thêm shared-tooltip.spec.ts; index.ts từ NO sang PARTIAL có source evidence. Hash/inventory mismatch0; evidence/c12-current-coverage.json và c12-final-reconciliation.json.

Tooltip sửa mô tả liên kết, Escape và timer, giữ focus khi rời chuột. 15 browser PASS (6 Chromium tooltip+2 WebKit timer+7 forms regression);1490 unit PASS/4 SKIPPED; typecheck/targeted ESLint/ratchet/build PASS. Trước sửa6 FAIL (gồm1 readiness race) và2 before-keyboard FAIL giữ nguyên. CORR-015 vẫn OPEN cho hoverable content/touch/placement/consumer acceptance. Dead code28 candidates giữ nguyên, không xóa. Chi tiết file thay đổi/giới hạn: correction-batch-c12.md, c12-source-changes.csv. Không push/deploy.

## C13 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.364 in-scope =1.301 NO +18 PREFLIGHT_ONLY +45 PARTIAL; verified YES=0. Component450 NO/17 PARTIAL;29 modules169 surfaces chưa full review. Không thêm nguồn; chỉ3 hash delta đã review. Hash/inventory mismatch0; evidence/c13-current-coverage.json, c13-final-reconciliation.json.

Sửa Tooltip pointer-events và nối khoảng hover8px ở4 hướng. Before8 FAIL; lifecycle baseline4 PASS. Sau sửa18 Chromium +10 WebKit PASS;12 related shared unit PASS; typecheck/targeted ESLint/ratchet/build PASS. CORR-015 vẫn OPEN cho touch/long text/collision/custom gap/trigger/token/consumer acceptance. Dead-code28 candidates không đổi, không xóa. Xem correction-batch-c13.md và c13-source-changes.csv. Không push/deploy.

## C14 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.364 in-scope =1.300 NO +18 PREFLIGHT_ONLY +46 PARTIAL; verified YES=0. Component448 NO/19 PARTIAL;29 modules169 surfaces chưa full review.3 file hash delta, Dropdown.tsx review source-only. Hash/inventory mismatch0; evidence/c14-current-coverage.json và c14-final-reconciliation.json.

Tooltip long content/viewport collision:26 Chromium +18 WebKit scoped PASS;8 Chromium geometry rerun PASS sau tách key theo engine. Full unit1490 PASS/4 SKIPPED; typecheck/targeted ESLint/ratchet/build PASS. Giữ before8 FAIL, interim24 PASS/2 FAIL (phép đo text tính cả decoration), overlap-before4 FAIL/4 PASS. CORR-015 vẫn OPEN cho touch/zoom/ancestor clipping/custom props/tokens/performance/consumers. Dead-code29:7 INTENTIONALLY_RETAINED/5 POSSIBLE_DEAD/17 UNKNOWN; không xóa. Xem correction-batch-c14.md và c14-source-changes.csv. Không push/deploy.

## C15 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.365 in-scope =1.297 NO +18 PREFLIGHT_ONLY +50 PARTIAL; verified YES=0. Component447 NO/20 PARTIAL; module28 NO/1 PARTIAL; surface168 NO/1 PARTIAL. Chỉ BonusView/module BI được PARTIAL theo scoped evidence, không full review. Thêm shared-dropdown.spec.ts;3 source delta. Hash/inventory mismatch0; evidence/c15-current-coverage.json và c15-final-reconciliation.json.

CORR-016 focus sau Dropdown selection đã sửa.13 final distinct browser cases PASS (7 Chromium fixture gồm touch +4 WebKit +2 BI local journeys); full unit1490 PASS/4 SKIPPED; typecheck/ESLint/ratchet/build PASS. Before2 PASS/4 FAIL (2 focus thật+2 fixture bị che) giữ nguyên. Visual BonusTab FAIL: CORR-017 description cuối menu bị khung cha cắt; OPEN, không báo global acceptance. Dead-code29 không đổi. Chi tiết correction-batch-c15.md và c15-source-changes.csv. Không push/deploy.

## C16 — checkpoint hiện hành, 26/10/2026

PARTIAL:1.365 in-scope =1.295 NO +18 PREFLIGHT_ONLY +52 PARTIAL; verified YES=0. Component447 NO/20 PARTIAL; module28 NO/1 PARTIAL; surface168 NO/1 PARTIAL.5 source deltas,2 scoped review-only files; hash/inventory mismatch0. Nguồn evidence/c16-current-coverage.json/c16-final-reconciliation.json.

CORR-017 RESOLVED scoped: shared Dropdown escapeClipping bật cho BonusTab; card overflow/rounding không đổi. Before1 clipping FAIL; after28 browser PASS (15 Chromium shared,2 Chromium BI,9 WebKit shared,1 Modal,1 WebKit BI). Full unit1490 PASS/4 SKIPPED; typecheck/targeted ESLint/ratchet/build PASS. Đã inspect consumer Chromium menu cuối, description đầy đủ; không suy rộng mọi platform/journey. Dead-code29 không đổi; không xóa. Chi tiết correction-batch-c16.md và c16-source-changes.csv. Không push/deploy.

## C17 — checkpoint hiện hành
PARTIAL:1.365 file =1.266NO +16PREFLIGHT_ONLY +83PARTIAL; verifiedYES0; hash/inventory mismatch0.32file scoped review notes,1test source change. CORR-018 sửa phép đo sai cột;21distinct browser cases có PASS hiện hành (28PASS lượt chạy/1FAIL lịch sử giữ nguyên),25unitPASS, typecheck/ESLintPASS. CORR-019 isolation helper/proxy và CORR-020 unsolicited reload OPEN.31persistent-profile suites BLOCKED. Không push/deploy, không code production change. Xem correction-batch-c17.md.

## C18 — checkpoint hiện hành
PARTIAL. {"coverage-ledger.csv": {"total": 1366, "reviewed": {"PREFLIGHT_ONLY": 15, "NO": 1248, "PARTIAL": 103}, "verified": {"NO": 1366}}, "module-inventory.csv": {"total": 29, "reviewed": {"PARTIAL": 12, "NO": 17}, "verified": {"NO": 29}}, "component-inventory.csv": {"total": 467, "reviewed": {"NO": 447, "PARTIAL": 20}, "verified": {"NO": 467}}, "screen-inventory.csv": {"total": 171, "reviewed": {"NO": 168, "PARTIAL": 3}, "verified": {"NO": 171}}}
11ChromiumPASS, ESLint/typecheckPASS.17dead candidates classified;29total=20retained/8possible/1legacy; không xóa. Thêm1spec audit-only,2standalone HTML surfaces; CORR-021 LIFF false-success OPEN. Chi tiết correction-batch-c18.md. Không push/deploy.

## C19 — checkpoint hiện hành
PARTIAL:1366scope;1247NO/14PREFLIGHT_ONLY/105PARTIAL;verifiedYES0;hash/inventory mismatch0. CORR-021 local LIFF acknowledgement sửa và regression11logicalcases trên Chromium desktop/WebKit desktop/WebKit390 đềuPASS (33platform executions). Giữ before6FAIL và interim1test-raceFAIL. Typecheck/ESLint/build/inline syntaxPASS; actual LINE/deviceBLOCKED. Chi tiết correction-batch-c19.md;không push/deploy.


## C20 — PARTIAL
Shared Switch sm hit target38→44 qua CSS dùng chung; giữ visible geometry. Chromium3/WebKit3903 final PASS, unit4PASS; before và WebKit Tab mismatch FAIL giữ nguyên evidence. Source review15files; CORR-023 accessibility follow-up OPEN. Xem correction-batch-c20.md và evidence/c20-current-coverage.json. Chưa visual/physical-device/consumer/full acceptance; verified YES không tăng.


## C21 — PARTIAL
Sửa shared ProgressBar name/rendering bounds và Banner disclosure; thêm tên cho TimeProgressBar, giữ công thức. Chromium4/WebKit4 PASS390/1366; unit6PASS, lint/typecheck/build PASS. Before4FAIL được giữ. Visual scoped screenshots đã xem. CORR-023 còn BI Switch naming và consumer follow-up. Evidence correction-batch-c21.md; latest counts evidence/c21-current-coverage.json; verified YES0.


## C22 — PARTIAL
49dependency declarations classified:46retained3possible; no removal. Dead candidates32=20retained11possible1legacy. Full local Vitest1490PASS4SKIPPED0FAIL; excludes backend/scraper/E2E. Benchmark executed without measurement output, no200ms claim. No source changes. Evidence correction-batch-c22.md and evidence/c22-current-coverage.json.


## C23 — PARTIAL
47publicassets metadata/refs reviewed;9asset candidates added (3duplicateSHA,5unknownauditimages,1possibleRoboto). CORR-025 public audit images copied into dist, actualproduction unverified; CORR-026 font retry gapOPEN. Startup3ChromiumPASS, pixel mismatch0.209%. No source/deletion/deploy. Evidence correction-batch-c23.md and c23-current-coverage.json.


## C24 — PARTIAL
FontCSS transientfailure retry fixed; pending/success dedup and failedlink cleanup. Before1FAIL; Chromium1/WebKit1PASS; lint/typecheck/buildPASS. Actualfontglyph/consumer/device acceptance pending. Source/hash evidence correction-batch-c24.md and c24-current-coverage.json. No push/deploy.


## C25 — PARTIAL
Tabs underline/pills pressedsemantics +coarse44target fixed; before6FAIL/2PASS; final8Chromium/8WebKitPASS,unit3PASS,lint/typecheck/buildPASS. No fullconsumer/visual/device claim. Evidence correction-batch-c25.md; c25-current-coverage.json.


## C26 — PARTIAL
Theo xác nhận của người dùng,8auditPNGs chuyển khỏi public vào audit/evidence/internal-exports, giữ thêmZIP. BuildPASS;8source/dist paths absent và16SHA copy/archive checksPASS. CORR-025 resolvedlocal; production chưa thay đổi. Scope lineage giữ nguyên, không giảm coverage bằng move. Evidence correction-batch-c26.md/c26-current-coverage.json.

C26 post-change full unit rerun:1490PASS4SKIPPED0FAIL (172filesPASS1SKIPPED),8.63s. Same pre-existing3disabledLINE cases+1opt-in benchmark; no hidden failures. Evidence c26-unit.json/.txt; individual assertions appended test-execution-ledger.csv.

## C27 — Summary filter accessibility

Sửa native label/id cho Switch lọc siêu thị; before2FAIL, after2Chromium+2WebKitPASS,22unitPASS, lint/typecheck/buildPASS. CORR-023 vẫn OPEN cho consumer khác. Evidence correction-batch-c27.md; source changes c27-source-changes.csv. Coverage1.371:1165NO/12PREFLIGHT_ONLY/194PARTIAL, verifiedYES0; project PARTIAL. Không push/deploy.

## C28 — Industry filter labels

Native labels hai cấp ngành/nhóm: before2FAIL, after2Chromium+2WebKitPASS; fullunit1490PASS4SKIPPED,lint/typecheck/buildPASS. Visual390FAIL do popup bị cắt trái: CORR-028 OPEN; CORR-023 các consumer khác vẫn OPEN. Evidence correction-batch-c28.md và c28-source-changes.csv. Coverage1.372:1162NO/12PREFLIGHT_ONLY/198PARTIAL;verifiedYES0. Không push/deploy.

## C29 — Mobile filter shared sheet

CORR-028 resolved scoped via existing Modal; before2FAIL2PASS,final4Chromium4WebKitPASS;lint/typecheck/buildPASS. Source changes c29-source-changes.csv; details correction-batch-c29.md. Project PARTIAL, no push/deploy.

## C30 — Industry tree accessibility

CORR-029 resolved scoped: named tree button+expandedstate; before4PASS1FAIL,final5Chromium5WebKitPASS,lint/typecheckPASS. correction-batch-c30.md và c30-source-changes.csv. Coverage unchanged1372=1157NO12PREFLIGHT_ONLY203PARTIAL; verifiedYES0. Không push/deploy.

## C31 — Competition labels and shared-wrapper consumers

Competition Switch labels fixed; baseline2FAIL,final2PASS/engine. Consumer regression9Chromium9WebKitPASS;1490unitPASS4SKIPPED;lint/typecheck/buildPASS. CORR-023 employee consumers pending; CORR-030 legacyIDB fallback pending. correction-batch-c31.md/c31-source-changes.csv. No push/deploy.

## C32 — Bonus legacy fallback

CORR-030 fixed return after missingstore resolve; nativeIDB before1FAIL1PASS,after2Chromium2WebKitPASS;lint/typecheck/buildPASS. correction-batch-c32.md/c32-source-changes.csv. Full project PARTIAL, no push/deploy.

## C33 — Shared foundation review

5sharedfiles fullsource read with scoped tests; CORR-031 root keyboard bubbling fixed. Before1FAIL,final3Chromium3WebKitPASS;lint/typecheck/buildPASS. Cardtoken/mobileflat exception verified fixture, fullconsumers pending. correction-batch-c33.md/c33-source-changes.csv. No push/deploy.

## C34 — Export audit

9exports binding trace:5retained4possible;sharedCard lexicalname collides with BI Card. No deletion or appsource changes;tests NOT_RUN. Deadregister50=30retained16possible1legacy3duplicate. correction-batch-c34.md/export-audit.csv. Fullscope PARTIAL.

## C35 — Recovery feedback

CORR-032 unsupported deployment/reload claim corrected. Before1FAIL1PASS,after2Chromium2WebKitPASS;6unitPASS,lint/typecheck/buildPASS. correction-batch-c35.md/c35-source-changes.csv. Fullproject PARTIAL, no push/deploy.

## C36 — SearchableSelect

CORR-033 sửa label/keyboard bằng shared Button/Input và nested Escape. Before4FAIL; final5Chromium5WebKitPASS;1490unitPASS4SKIPPED;lint/typecheck/buildPASS. Scope1377=1143NO12PREFLIGHT_ONLY222PARTIAL,verifiedYES0. correction-batch-c36.md/c36-source-changes.csv; actual Gtdh context/save và device pending. Không push/deploy.

## C37 — Table responsive foundation

CORR-034 fixed hidden-column min-width; baseline3PASS1FAIL/engine,final5Chromium5WebKitPASS;lint/typecheck/buildPASS. Scope1378=1138NO12PREFLIGHT_ONLY228PARTIAL;verifiedYES0. correction-batch-c37.md/c37-source-changes.csv; actual BI/device/remaining semantics pending. Không push/deploy.

## C38 — Touch hint cancellation

CORR-035 fixed pointercancel leaking suppression to next gesture. Before2PASS1FAIL;final3Chromium native touchPASS,3WebKit synthetic pointer boundaryPASS;1490unitPASS4SKIPPED;lint/typecheck/buildPASS. Scope1379=1135NO12PREFLIGHT_ONLY232PARTIAL;component401NO66PARTIAL;module16NO13PARTIAL;screen165NO6PARTIAL;verifiedYES0. correction-batch-c38.md/c38-source-changes.csv. Không push/deploy.

## C39 — PageActions

Actual actionbar fixture4Chromium4WebKitPASS;toast unit12PASS;no application code change. correction-batch-c39.md/c39-source-changes.csv. All consumers/toast runtime pending;project PARTIAL.

## C40 — Toast cancellation

CORR-036 fixed cancel incorrectly invoking dismissal;before2PASS1FAIL,after3Chromium3WebKitPASS with input-boundary limits documented. Fullunit1490PASS4SKIPPED;lint/typecheck/buildPASS. correction-batch-c40.md/c40-source-changes.csv. Queue/native share/allconsumers/device still pending.

## C41 — Share boundary regression

7mocked share casesPASS;fullsuite1497PASS4SKIPPED;lint/typecheckPASS. No appsource changes. correction-batch-c41.md/c41-source-changes.csv. Native share/device BLOCKED;scope1382=1125NO12PREFLIGHT_ONLY245PARTIAL;verifiedYES0.

## C42 — Visible toast timing

CORR-037 resolved scoped:queue duration/hover/preemption/update4PASS perengine+gesture3PASS perengine;fullunit1497PASS4SKIPPED;lint/typecheck/buildPASS. New visible-slot timing hook;ADR/checkpoint in correction-batch-c42.md. Fullproject PARTIAL,custom/native/consumers pending.

## C43 — Icon boundaries

CORR-038 own-key guard fixed;before4FAIL2PASS,17targetedunitPASS,2Chromium2WebKitPASS;fullunit1503PASS4SKIPPED;lint/typecheck/buildPASS.239canonical/201legacy preserved;1definite unused import removed;deadregister52. correction-batch-c43.md/c43-source-changes.csv. Allconsumer/device pending;project PARTIAL.
