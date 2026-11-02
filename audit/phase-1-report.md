# Phase 1 — hoàn tất kiểm kê tĩnh và đối soát

Thời điểm: 2026-10-24T14:25:44.534052+07:00. HEAD không đổi. Trạng thái COMPLETE_INVENTORY_ONLY; KHÔNG phải toàn bộ audit hoàn tất.

- Files/symlinks thực tế: 136,946; thư mục: 18,326.
- Thuộc phạm vi review: 1,350; loại trừ có từng path/lý do: 135,596.
- 1.346/1.346 mục checkpoint giữ nguyên SHA-256, 0 mất, 0 đổi. Các mục mới ngoài checkpoint được phân loại riêng trong checkpoint-reconciliation.csv.
- 29 nhóm module/thư mục, gồm 8 feature nghiệp vụ và backend/server/config/docs/tooling.
- 1039 file JS/TS được liệt kê bằng AST, 0 parse diagnostics; 331 file TSX/JSX đối soát đủ.
- 467 khai báo/candidate component, 169 candidate màn/subscreen/overlay, 941 route/mount/conditional/tab-action records. Không gọi đây là số màn runtime duy nhất.
- 4990 dependency/reference edges; 3639 local, 61 biểu thức động giữ nguyên để review. Không có literal local reference bị bỏ sót chưa tìm thấy ở lượt này.
- Không file thiếu ledger, không lỗi đọc, hai lượt quét không lệch paths. Bằng chứng: phase1-closing.json; các invariant AST/UI/file counts đã kiểm bằng script.

Đã tạo File/Directory/Module/Component/Screen Inventory, Graph JSON/DOT, exports/runtime entry list và Coverage Ledger. Mọi file trong phạm vi vẫn INVENTORIED; chỉ 19 file rules/config có PREFLIGHT_ONLY nếu hash còn khớp. Không biến AST thành REVIEWED hoặc build thành VERIFIED. Các bằng chứng test Phase 0 được giữ trong test-results.md; chưa có instrumentation per-file nên coverage TESTED ghi NOT_MAPPED, không suy diễn.

Giới hạn có chủ đích: screen/route candidates cần xác định ngữ nghĩa và reachability ở Phase 3; quan hệ động qua chuỗi script, event, network/database cần deep review. Exclusions và ledger dẫn xuất được đếm nhưng không hash nội dung private/cache hoặc tự hash. Chi tiết inventory-method.md.

Phase 2 được bắt đầu sau mốc đối soát này. File artifacts phát sinh khi test sẽ được quét lại cuối batch.

## Đối soát cuối Phase 2 — 2026-10-24T19:54:17.589397+07:00

Hiện tại: 136980 file/symlink, 18331 thư mục; 1352 thuộc scope, 135628 loại trừ. Không thiếu ledger, không lỗi đọc, không path biến động giữa hai lượt quét. Toàn bộ 1346 mục checkpoint được đối soát: 1345 nguyên SHA-256, 1 thay đổi whitespace đã xác nhận bằng git diff -w (rỗng). Không có mục MISSING. Đây là khác biệt đã giải thích, không phải file chưa đối soát.

AST hiện tại: 1040 file, 467 component candidates, 169 surface candidates, 4992 dependency edges;0 parse diagnostics. File mới là công cụ audit; snapshot Phase1 được giữ riêng. Coverage TESTED đã map test evidence, VERIFIED vẫn không suy diễn cho production.
