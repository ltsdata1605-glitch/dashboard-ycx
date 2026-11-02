# Bản đồ entry và module — inventory, chưa deep review

- index.html → index.tsx → App.tsx → AuthProvider / SyncProvider / LayoutProvider / PageActionsProvider.
- App.tsx dùng activeTab/persistentViews, không dùng React Router. 12 persistent route và 2 route conditional tools-coupon/tools-tax; LoginView, PendingApprovalView và ManChoKhoiDong là auth/startup gates. `tools` là nhãn navigation được miễn fallback, chưa thấy route render riêng; giữ để kiểm Phase 3.
- Root Phân tích/check thưởng/cài đặt: components/views + services/hooks/contexts/utils; consumers dùng components/shared/ui và components/shared/export.
- 8 features: bi-dashboard, check-thuong, khai-thac, line-bot, phan-ca, product-config, sticker-event, tax-calculator. product-config có thể được nhúng trong màn cấu hình, không mặc định có route chính riêng.
- Report BI: employees → BiWrapper → dashboard/Dashboard, employee/NhanVien, updater/DataUpdater; tabs/overlay bên trong nằm ở screen-routing.csv.
- Bot LINE: coupons, filtered, schedules, keywords, admins, group-features, syntax, settings; role/auth guard chưa runtime verified.
- functions/src/index.ts re-export 20 callable/HTTP/scheduled entry symbols; chi tiết chính xác ở exports.csv và trigger registrations trong entry-point-inventory.csv (không coi mọi export là deployed).
- firebase.json: functions source functions/, rules firestore.rules cho (default), Hosting auth-hosting/. Không chạy deploy hoặc emulator ghi dữ liệu.
- price-scraper-server/package.json → server.js (Express/Puppeteer); module ngoài frontend phải được audit riêng.
- public scripts, userscripts, auth-hosting HTML, scripts/sw-template.js, worker modules là external/runtime entry bổ sung.
- .github/workflows gồm check, design-audit, e2e-toan-bo; package scripts/deploy/backup là entry có side effect cần review.

Dependency graph máy đọc: dependency-graph.json (file-level); dependency-graph.dot (module-level). Danh sách quan hệ chưa giải tĩnh: dependency-unresolved.csv. Chưa kết luận vòng phụ thuộc/dead code hay lỗi kiến trúc.
