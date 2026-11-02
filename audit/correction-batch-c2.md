# Batch C2 — review nền tảng, PARTIAL

## Evidence theo file

| File | Đã xem xét | Finding / giới hạn |
|---|---|---|
| components/shared/ui/Button.tsx | Toàn file; variants, sizes, disabled/loading, icon, focus | Semantic palette còn Tailwind trực tiếp; size=none là exception mật độ. Chưa verify toàn bộ consumers. |
| components/shared/ui/CapsuleBar.tsx | Toàn file; portal, compact sizes, states | Background/filter/shadow hardcode; role=tablist dùng aria-pressed chưa có tab semantics; không đổi role khi chưa trace caller. |
| components/shared/ui/TopBarActions.tsx | Toàn file; compound exports, portal, variants | Material riêng; Group overflow-hidden cần kiểm focus/touch clipping; icon-only Link cần audit accessible name. |
| components/shared/ui/utils.ts | Toàn file | tailwind-merge nhận semantic radius; giữ nguyên. |
| components/shared/ui/icon/AppIcon.tsx | Toàn file | Size CSS responsive, label/aria-hidden; chưa review toàn registry. |
| components/shared/ui/icon/iconTokens.ts | Toàn file | md laptop16/mobile18; sm14/16. Báo cáo cũ ghi sm16/md18 cố định không chính xác. |
| components/shared/ui/ActionMenu.tsx | Toàn file | Mobile sheet dùng material; callbacks trong user gesture, modal behavior, grouping; desktop focus dùng nền, chưa audit contrast toàn bộ. |
| styles.css | Material, fallback, media, navbar capsule và các phần style đã đọc | material-bg/filter khai token nhưng hardcode; đã nối token. Capsule/Dock vẫn hardcode, chưa migration global. |
| styles/tokens.css | Primitive/semantic/component và material | Thêm material-fallback-bg = surface-primary. Không tạo hệ token song song. |

Đây là focused source review, không deep review toàn nghiệp vụ hoặc verified consumer. Ghi PARTIAL trong ledger để không nâng sai thành full review. Consumer list tĩnh trong matrix; còn barrel/runtime cần reconcile.

## Thay đổi
styles.css dùng --material-bg/--material-filter; fallback đặc qua --material-fallback-bg; reduced transparency và forced colors bỏ blur. Chỉ thay lớp material đang dùng ở MobileNavBar, AppToaster, ActionMenu. Không thay auth, dữ liệu, formulas. Không coi đây là Glass Foundation complete.

## Kiểm thử
Full Vitest trước CSS edit: 171 test files, 1477 PASS, 4 SKIPPED, 0 FAIL (correction-unit.json). 3 skip thuộc LINE destination compatibility, 1 benchmark opt-in; không tự bỏ skip. Typecheck PASS; build sau CSS edit PASS. E2E local batch và kiểm computed style material đang thực thi; không xác nhận iPhone Safari thật.

## Còn lại
Semantic token coverage cho controls; Capsule/Toolbar/Dock; fallback no-backdrop support; contrast/focus-visible keyboard; screenshots mọi consumer; đo chi phí rendering. Phase 4–6 PARTIAL.

Kiểm visual: correction-material-reduced.png đã xem ở 390×844; sheet nền đặc, nhóm hành động tách riêng và nút Huỷ hiện trong viewport. Chỉ là harness Chromium. Test fixture HTML tránh inject trong lúc app khởi tạo; xem failure/retest logs.

C2 viewport follow-up: aggregate harness documentWidth404/innerHeight873 vs visual390x844. Dedicated real ActionMenu fixture yields layout390x844; unchanged viewport assertion PASS. Evidence: correction-material-final-isolated.txt. Aggregate harness overflow remains OPEN CORR-005. Latest screenshot inspected: Cancel fully inside viewport.
