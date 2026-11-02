# Change log Phase 0–2

Phạm vi agent thay đổi: hồ sơ và công cụ audit. Không sửa mã ứng dụng, nghiệp vụ, authentication, rules Firebase hoặc API. Không push/deploy. Các build sinh dist/functions/lib và E2E sinh test-results; chúng được loại trừ có lý do trong ledger.

AGENTS.md đã có trước công việc. tests/unit/session-ownership-claim.test.ts thay đổi whitespace ngoài thao tác agent; giữ nguyên, không rollback. Evidence git cuối phiên ở evidence/final-preservation.txt.

Root cause/fix: Phase này thu baseline, chưa sửa bug. WebKit focus còn cần nguyên nhân gốc; UI fixture cloud chưa thể cung cấp baseline layout. Công cụ quality runner đã sửa race ghi summary bằng flock; 5 dòng đã khôi phục từ output, raw logs nguyên vẹn.

Danh sách đầy đủ file audit tại checkpoint cuối phiên (bao gồm Phase0 được giữ lại; file báo cáo/ledger được tái tạo, evidence gốc được giữ):

- `audit/architecture-map.md`
- `audit/ast-coverage.csv`
- `audit/change-log.md`
- `audit/checkpoint-reconciliation.csv`
- `audit/checkpoint.json`
- `audit/component-inventory.csv`
- `audit/component-usage-map.csv`
- `audit/coverage-ledger.csv`
- `audit/dependency-edges.csv`
- `audit/dependency-graph.dot`
- `audit/dependency-graph.json`
- `audit/dependency-summary.json`
- `audit/dependency-unresolved.csv`
- `audit/directory-inventory.csv`
- `audit/entry-point-inventory.csv`
- `audit/evidence/chromium-focus.txt`
- `audit/evidence/design-violations.json`
- `audit/evidence/e2e-chromium.json`
- `audit/evidence/e2e-webkit.json`
- `audit/evidence/environment.json`
- `audit/evidence/final-ast.txt`
- `audit/evidence/final-preservation.txt`
- `audit/evidence/final-scan.txt`
- `audit/evidence/phase1-ast.txt`
- `audit/evidence/phase1-scan.txt`
- `audit/evidence/phase2-benchmark-measured.txt`
- `audit/evidence/phase2-benchmark.txt`
- `audit/evidence/phase2-budget.txt`
- `audit/evidence/phase2-build-functions.txt`
- `audit/evidence/phase2-build.txt`
- `audit/evidence/phase2-eslint.txt`
- `audit/evidence/phase2-ratchet.txt`
- `audit/evidence/phase2-typecheck-functions.txt`
- `audit/evidence/phase2-typecheck.txt`
- `audit/evidence/phase2-unit.txt`
- `audit/evidence/preservation.txt`
- `audit/evidence/results.json`
- `audit/evidence/typecheck-functions.txt`
- `audit/evidence/typecheck.txt`
- `audit/evidence/unit-results.json`
- `audit/evidence/webkit-focus.txt`
- `audit/excluded-files.csv`
- `audit/exports.csv`
- `audit/file-inventory.csv`
- `audit/findings.csv`
- `audit/inventory-method.md`
- `audit/module-inventory.csv`
- `audit/performance-baseline.md`
- `audit/phase-0-preflight.md`
- `audit/phase-0-read-ledger.csv`
- `audit/phase-1-report.md`
- `audit/phase-2-report.md`
- `audit/phase-2-results.json`
- `audit/phase-2-safety.md`
- `audit/phase1-closing.json`
- `audit/progress.md`
- `audit/reconciliation.json`
- `audit/remaining-work.md`
- `audit/scan-input.json`
- `audit/screen-inventory.csv`
- `audit/screen-routing.csv`
- `audit/script-safety.md`
- `audit/task_plan.md`
- `audit/test-execution-ledger.csv`
- `audit/test-matrix.md`
- `audit/test-results.md`
- `audit/tools/dependencies.mjs`
- `audit/tools/inventory.py`
- `audit/tools/map-test-evidence.py`
- `audit/tools/playwright-baseline.config.mjs`
- `audit/tools/quality.py`
- `audit/ui-file-coverage.csv`
- `audit/webkit-test-followup.md`

## 2026-10-25 — Correction C1
Thu hồi COMPLETE; giữ snapshot báo cáo cũ; đối soát hash scope cũ; tạo migration matrix, regression matrix và dead-code candidate register. Chưa thay source ứng dụng hoặc nâng reviewed/verified.

## 2026-10-25 — C2
styles.css + styles/tokens.css: nối material tokens và reduced-transparency fallback. Thêm glass-material-foundation.spec.ts. Ledger ghi 9 focused reviews PARTIAL, thêm test mới, map 1481 assertions Vitest. Dead-code: 4 intentionally retained, 2 possible dead, 20 unknown. Chưa xóa code.

C2 final: dedicated material HTML fixture; historical failed attempts retained. Final material regression PASS; aggregate fixture overflow OPEN CORR-005. All changed files: correction-changed-files.txt.

## Batch C3 — 25/10/2026
- CORR-005: flex-wrap cho hàng nút aggregate harness; regression320/390/440 và Apple UI Chromium/WebKit.
- CapsuleBar/TopBarActions: dùng shared material + component tokens; mobile fallback đặc; Capsule loại transition-all khỏi focus outline.
- Thêm glass-controls.spec.ts; mở rộng materialHarness và regression; không thay nghiệp vụ/auth/data.
- Cập nhật ledger, findings, matrix, tests, remaining work; source delta và hashes tại c3-source-changes.csv, quan hệ HTML imports tại c3-dependency-delta.csv.
- Checkpoint ZIP có manifest hash; giữ các lần FAIL và chẩn đoán. Không push/deploy.

## Batch C4 — 25/10/2026 (current)

**PARTIAL: 1.358 in-scope; 1.322 NO; 19 PREFLIGHT_ONLY; 17 PARTIAL; verified YES=0.** Components455 NO +12 PARTIAL;29 modules và169 surfaces chưa full review. Nguồn: evidence/c4-current-coverage.json và c4-final-reconciliation.json. Không dùng baseline cũ làm số hiện tại.

Dock/navbar được nối material tokens/fallback; HeaderSystemGroup/TopBarGroup giữ viền focus. Chromium5/5 targeted +2/2 app compatibility PASS; WebKit font Tab1 FAIL (CORR-009 OPEN). Typecheck/ESLint/ratchet check-only/build PASS. Bảy delta thuế ngoài batch và1 unit test mới được ghi nhận riêng, chưa nhận PASS từ lịch sử (CORR-010 OPEN). Chi tiết theo file, commands, giới hạn và ảnh tại correction-batch-c4.md; còn việc tại remaining-work.md. Không push/deploy.

## Batch C5 — hiện hành,25/10/2026

**PARTIAL:1.359 in-scope;1.314 NO;19 PREFLIGHT_ONLY;26 PARTIAL; verified YES=0.** Components455 NO/12 PARTIAL;29 modules và169 surfaces chưa full review. Nguồn evidence/c5-current-coverage.json.

Đã sửa2 lỗi kỹ thuật có before/after evidence: save cloud không xóa bản khác vì trùng ID cục bộ; save IndexedDB chỉ báo thành công sau commit và reject khi abort.17 unit PASS (mock boundaries),3 native IDB Chromium PASS. Typecheck/ESLint/ratchet check-only/build PASS. WebKit diagnostic FAIL, chưa đóng CORR-009; CORR-010 merge/outbox/other writes còn OPEN. Xem correction-batch-c5.md và remaining-work.md. Không push/deploy.

## C6 — checkpoint hiện hành

**PARTIAL:1.361 in-scope;1.314 NO;19 PREFLIGHT_ONLY;28 PARTIAL; verified YES=0.** Component455 NO/12 PARTIAL;29 modules và169 surfaces chưa full review. Nguồn evidence/c6-current-coverage.json.

Sửa merge chọn winner trước persist để tránh xóa ID vừa overwrite; dùng chung cloud replacement cho online/offline replay. Before5 FAIL/1 PASS, targeted23 PASS, native IDB+mock cloud7 PASS. Full unit173 files:1.490 PASS/4 SKIPPED/0 FAIL. Typecheck/ESLint/ratchet check-only/build PASS. CORR-010 còn các mutation atomicity/quota/concurrency/privacy; CORR-009 chưa đóng. Chi tiết correction-batch-c6.md. Không push/deploy.

## C7 — checkpoint hiện hành

**PARTIAL:1.361 in-scope;1.312 NO;19 PREFLIGHT_ONLY;30 PARTIAL; verified YES=0.** Component455 NO/12 PARTIAL;29 modules169 surfaces chưa full review. Nguồn evidence/c7-current-coverage.json.

Sửa delete/updateMonth/updateMonths/clearAll chỉ báo thành công sau transaction commit. Before4 FAIL/7 PASS; sau15 Chromium PASS +15 WebKit PASS +23 unit PASS. Typecheck/ESLint/ratchet check-only/build PASS. Không gọi WebKit là iPhone thật. Dead-code:7 INTENTIONALLY_RETAINED/2 POSSIBLE_DEAD/17 UNKNOWN; không xóa code. CORR-011 probe origin/source validation mới OPEN; CORR-009/010 vẫn còn acceptance. Chi tiết correction-batch-c7.md. Không push/deploy.

## C8 — checkpoint hiện hành,26/10/2026

**PARTIAL:1.362 in-scope;1.310 NO;19 PREFLIGHT_ONLY;33 PARTIAL; verified YES=0.** Component455 NO/12 PARTIAL;29 modules169 surfaces chưa full review. Nguồn evidence/c8-current-coverage.json.

CORR-011 sửa origin/source guards và targetOrigin của probe. Before3 FAIL/1 PASS; sau5 Chromium +5 WebKit +8 unit PASS. Typecheck/ESLint/ratchet check-only/build PASS. Native protocol fixtures không thay Tampermonkey thật hoặc full BI journey. CORR-009/010 và full audit còn PARTIAL. Chi tiết correction-batch-c8.md. Không push/deploy.

## C9 — checkpoint hiện hành,26/10/2026

PARTIAL:1.363 in-scope;1.305 NO;19 PREFLIGHT_ONLY;39 PARTIAL; verified YES0. Component452 NO/15 PARTIAL;29 modules169 surfaces chưa full review. Nguồn evidence/c9-current-coverage.json.

Select error linkage và Button busy đã sửa;5 browser/7 unit PASS; typecheck/ESLint/ratchet/build PASS. Matrix cập nhật shared controls và giới hạn consumer review. Giữ dense28/icon32, không áp height tokens khác convention. CORR-014/015 OPEN; Tooltip thêm POSSIBLE_DEAD nhưng không xóa. Xem correction-batch-c9.md; không push/deploy.

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
