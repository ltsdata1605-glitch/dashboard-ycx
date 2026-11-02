# Phase 0 — Preflight & checkpoint

Trạng thái: PASS cho phạm vi Phase 0. Toàn bộ audit V6: PARTIAL, Phase 1–10 chưa thực hiện.

## Quy tắc đã đọc và áp dụng

Đã đọc tài liệu V6 đính kèm, AGENTS.md, .agents/AGENTS.md, .agents/rules/dashboard-ycx-quality.md, CLAUDE.md, AGENT_RULES.md, RULES.md, DESIGN_SYSTEM.md, DESIGN.md, KE_HOACH_GIAO_DIEN_APPLE.md và KE_HOACH_NANG_CAP_MOBILE_APP_IPHONE.md.
Đã đọc package.json, functions/package.json, tsconfig.json, functions/tsconfig.json, vite.config.ts, vitest.config.ts, playwright.config.ts và eslint.config.js phục vụ preflight. Đây chưa phải audit toàn bộ config/source.
Skill planning-with-files được áp dụng với ledger tập trung tại audit/ theo yêu cầu hiện tại.

## Xung đột được xử lý

- CLAUDE.md / kế hoạch Apple cũ yêu cầu tự push/deploy: bị thay thế bởi yêu cầu hiện tại cấm push/deploy khi chưa được cho phép rõ ràng.
- Backup cũ gọi script có push: không chạy. Checkpoint bằng archive cục bộ, không commit hay đổi index.
- Khung dữ liệu vuông trong tài liệu cũ: định hướng V2 mới cho phép/đòi hỏi bo khung phù hợp, giữ mật độ và ô bảng dễ đọc. Chưa sửa UI.
- DESIGN.md nêu Inter và palette/radius riêng: không dùng làm hệ song song. Giữ UTM Avo, Roboto Condensed và token/shared component hiện hữu.
- Mobile plan có đề xuất Capacitor cũ đã được ghi bỏ trong chính tài liệu: không triển khai native hay nâng dependency.
- Các kết quả test/coverage trong tài liệu cũ là lịch sử, không dùng làm bằng chứng cho lượt này.

## Git và checkpoint

Workspace: /Users/ltson/dashboardycx. Nhánh main; HEAD: c4df4d1d5ba30cf3c317cc9c42644d917c557537.
Trước thực thi: chỉ có `?? AGENTS.md`; không có tracked diff hay staged diff.
Checkpoint: /Users/ltson/dashboardycx/archive/phase0-20261024-140610/workspace.tar.gz.
1.346 mục (tracked working-tree + untracked không bị ignore) được lưu; từng mục được đối chiếu SHA-256 sau khi đọc lại archive. Symlink giữ nguyên, hash chuỗi đích liên kết.
manifest.json, HEAD.txt, git-status.txt, staged.patch và unstaged.patch nằm cạnh archive.
Không lưu dependencies, generated outputs, secrets/profile bị ignore; các bản gốc vẫn nguyên vị trí. Đây là snapshot workspace, không phải backup toàn bộ lịch sử Git hay dữ liệu production.
Phục hồi khi cần: giải nén vào thư mục riêng, kiểm manifest rồi so sánh/chọn file cần phục hồi; không giải nén đè workspace hoặc reset --hard.
Lần tạo đầu lỗi khi đọc symlink .claude/skills như file; archive dở không có chứng nhận, không được dùng. Đường dẫn hợp lệ duy nhất ở checkpoint.json.

## Phạm vi bị cấm

Không push/deploy/publish, không chạy backup có push, không reset/clean/stash làm mất thay đổi; không ghi dữ liệu production, đổi Firebase rules/auth/API/công thức nghiệp vụ; không bật Dark Mode; không xoá code chưa truy đủ consumers. Không gọi API gửi LINE hay dịch vụ nhắn tin.

## Baseline và giới hạn

Frontend và Functions typecheck PASS, exit 0 (logs ở evidence/). Chỉ chứng minh kiểm tra kiểu dữ liệu theo cấu hình hiện tại.
Node v22.11.0, npm 10.9.0, macOS arm64. Phiên bản cài thực tế trong evidence/environment.json, không suy ra từ khoảng phiên bản package.json.
Chromium executable tồn tại nhưng chưa chạy. WebKit executable thiếu: BLOCKED cho kiểm WebKit. Safari iPhone vật lý/iOS PWA chưa được kiểm.
Lint, unit, E2E, build, bundle budget và UI/performance baseline: SKIPPED ở Phase 0, chuyển Phase 2 sau kiểm tra side effects của scripts/tests. Không kết luận regression hay bug chức năng.

## Hai ảnh tham chiếu

Ảnh 1: navigation capsule nổi, nền kính mờ, tab chọn có nền riêng và nút tìm kiếm tròn tách biệt. Ảnh 2: action toolbar dạng capsule, icon nét đều, khoảng cách cân bằng. Dùng cho navigation/toolbar/overlay phù hợp, không phủ kính lên bảng/KPI/chart/form dài; không sao chép nền nhiều màu hay thêm chức năng. Phân tích token/fallback/contrast chi tiết thuộc Phase 5.
