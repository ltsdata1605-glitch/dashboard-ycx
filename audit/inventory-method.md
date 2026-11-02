# Phương pháp kiểm kê Phase 1

Quét os.scandir đệ quy toàn workspace, không prune thư mục, không theo symlink. Mỗi file/symlink có dòng trong file-inventory.csv; mỗi thư mục có dòng trong directory-inventory.csv. Excluded-files.csv ghi từng đường dẫn và lý do. Không đọc nội dung profile, secret hoặc cache bị loại trừ. Các file audit dẫn xuất cũng được đếm, không hash để tránh vòng tự tham chiếu. Script audit/tools được hash. Snapshot chỉ có giá trị tại thời điểm quét; chạy lại sau khi sinh file mới.

Không loại trừ toàn bộ file gitignored: script scratch, server scrape giá và các file local chưa rõ vai trò vẫn trong phạm vi. Bản checkout khác dưới .claude/worktrees được ghi từng mục nhưng loại khỏi source của workspace hiện tại. Dependency/generated/backup không vào mẫu số source review. 1.346 mục checkpoint không phải tổng filesystem.

SHA-256 tính nội dung byte cho file, chuỗi đích cho symlink. Checkpoint-reconciliation.csv ghi riêng UNCHANGED/CHANGED/MISSING/ADDED_SINCE_CHECKPOINT/OUTSIDE_CHECKPOINT_SCOPE. Reconciliation.json đối chiếu hai lượt quét, danh sách lỗi đọc và file thiếu ledger. Không dùng tổng cũ 1.345.

Dependency graph dùng TypeScript AST cho mọi TS/TSX/JS/JSX/MJS/CJS trong phạm vi, không thực thi module. Gồm static import, type import, re-export, require, dynamic import, worker/URL, tham chiếu HTML/CSS; export symbols và runtime registrations ghi riêng. Package scripts, workflows, HTML và Firebase triggers nằm trong entry-point-inventory.csv. Biểu thức động chưa giải được được GIỮ trong dependency-unresolved.csv, không mặc định dead code. Import trong chuỗi HTML/bookmarklet và quan hệ qua network/database không thể chứng minh đầy đủ bằng AST; cần deep review Phase 3. Không đồng nhất danh sách AST với dependency runtime verified.

Component inventory đếm KHAI BÁO component (gồm lazy wrapper, local component, test harness), không phải số component nghiệp vụ duy nhất. UI-file-coverage.csv đối soát mọi TSX/JSX; file chỉ re-export/type/utility vẫn có dòng. Screen inventory liệt kê màn/subscreen/overlay theo symbol; screen-routing.csv bổ sung route, tab/action candidate, conditional render và mount kể cả tên không có hậu tố View (Dashboard/NhanVien/DataUpdater). Candidate không mặc định là route thật. Bảng source entry bên dưới được đối chiếu trực tiếp App.tsx và BiWrapper; kiểm reachability, role, data và mọi state thuộc Phase 3.

Trạng thái độc lập:
- INVENTORIED: có đường dẫn, phân loại, hash nếu trong phạm vi, quan hệ AST khi hỗ trợ.
- REVIEWED: review nội dung/ngữ nghĩa có bằng chứng; PREFLIGHT_ONLY chỉ là rules/config đã đọc Phase 0, không phải deep review.
- TESTED: có bài kiểm thực chạy; NOT_MAPPED nghĩa chưa có coverage per-file, không suy từ typecheck/build.
- VERIFIED: yêu cầu của file/chức năng được xác minh đúng phạm vi. Không tự nâng thành VERIFIED khi AST/lint/typecheck PASS.
