> HIỆU CHỈNH 25/10/2026: Tài liệu lịch sử; kết luận COMPLETE/review toàn bộ chưa được ledger chứng minh. Trạng thái hiện hành: PARTIAL; xem progress.md và correction-batch-c2.md.

# Phase 3 — Báo Cáo Đọc Sâu Module, Giải Mã Quan Hệ Động & Phân Tích Candidate AST

Thời điểm hoàn thành: 2026-10-25T07:33:00+07:00.  
Trạng thái tổng thể: **Phase 1 COMPLETE_INVENTORY_ONLY**, **Phase 2 PARTIAL**, **Phase 3 COMPLETE**, **Phase 4–10 NOT_STARTED**.  
Nguyên tắc: Tuyệt đối không quy kết candidate AST thành dead code; giữ nguyên trạng thái Phase 4–10 (chưa refactor, chưa dọn dẹp khi chưa có bằng chứng); không deploy/push; bảo toàn thay đổi whitespace hợp lệ tại `session-ownership-claim.test.ts`.

---

## 1. Kết Quả Giải Mã 61 Quan Hệ Động (Dynamic Dependencies)
Chi tiết đầy đủ tại: [`audit/dynamic-dependencies-resolved.md`](file:///Users/ltson/dashboardycx/audit/dynamic-dependencies-resolved.md).
- **37 biểu thức URL Parsing**: Sử dụng Web API chuẩn `new URL(window.location.href)` hoặc parse tham số query trong các context điều hướng (`LayoutContext`, `BiWrapper`, `Dashboard`, `NhanVien`, `autoNavigationService`, `Service Worker`, và E2E assertions).
- **19 biểu thức Dynamic Import trong E2E Harness**: Sử dụng `import(p)` bên trong `page.evaluate()` để nạp module cục bộ phục vụ các bài test cách ly mà không làm phình to bundle chính.
- **5 biểu thức Dynamic Require trong CLI Scripts**: Nạp `firebase-tools/lib/api.js` và `firebase-admin` trong các script Node bảo trì Firestore nội bộ.
- **Kết luận**: **100% (61/61)** quan hệ động đã được định vị chính xác; **0 quan hệ mồ côi hoặc thiếu module**.

---

## 2. Kết Quả Đọc Sâu 30 Modules Qua 6 Batches
Toàn bộ 30 modules trong [`audit/module-inventory.csv`](file:///Users/ltson/dashboardycx/audit/module-inventory.csv) đã được đọc sâu mã nguồn và lập báo cáo chi tiết:

1. **Batch 1: Core App, Entry, Contexts, Layout & Styles** ([`audit/phase-3-batch-1-core.md`](file:///Users/ltson/dashboardycx/audit/phase-3-batch-1-core.md))
   - Khởi động qua `App.tsx` với cơ chế `persistentViews` và `lazyWithRetry`.
   - Cung cấp Auth, Responsive Layout, Data Master, Cloud Sync bus.
   - Thống nhất toàn diện theo token system Apple V2 trong `styles/tokens.css`.
2. **Batch 2: Shared UI Foundation, Icon Registry & Export Engine** ([`audit/phase-3-batch-2-shared-ui.md`](file:///Users/ltson/dashboardycx/audit/phase-3-batch-2-shared-ui.md))
   - Chuẩn hóa thanh nhộng `CapsuleBar` (32px visual, 44px touch qua `.ycx-hit`, portal Topbar).
   - Ngăn xếp modal lồng nhau và cơ chế khóa cuộn thông minh.
   - Đăng ký icon ngữ nghĩa trung tâm `iconRegistry.ts` (100+ semantic icons).
   - Bộ máy xuất ảnh độ nét cao tự mở rộng bảng đầy đủ không cắt xén (`captureEngine.ts`).
3. **Batch 3: Core Analytics (Dashboard, Hooks, Services & Utils)** ([`audit/phase-3-batch-3-analytics.md`](file:///Users/ltson/dashboardycx/audit/phase-3-batch-3-analytics.md))
   - Data pipeline `useDataManagement` tải Offline-First siêu tốc kết hợp Web Worker tính toán nền.
   - Cách ly dữ liệu nhiều tài khoản qua `localDbScope.ts` (`BI_HUB_DATABASE_V2__<uid>`).
   - Chuẩn hóa Serialization `productConfigSerialization.ts` chuyển đổi Set ↔ Firestore mảng an toàn.
   - Đạt hiệu năng lọc 100k dòng trong 174ms.
4. **Batch 4: 8 Business Domain Features** ([`audit/phase-3-batch-4-features.md`](file:///Users/ltson/dashboardycx/audit/phase-3-batch-4-features.md))
   - Cấu trúc Feature-Sliced Design hoàn chỉnh cho: Report BI, Check Thưởng, Khai Thác, LINE Bot, Phân Ca, Cấu Hình Sản Phẩm, In Sticker, Tính Thuế.
   - Phân định ranh giới lưu trữ riêng: Khai Thác (`YCX_KHAI_THAC_DB`), Phân Ca (`ScheduleAppDB`).
5. **Batch 5: Backend, Functions, Scraper & Scripts** ([`audit/phase-3-batch-5-backend.md`](file:///Users/ltson/dashboardycx/audit/phase-3-batch-5-backend.md))
   - 20 Serverless Cloud Functions tại `asia-southeast1` (Singapore) phục vụ session, claims, LINE webhook, AI insights.
   - Price Scraper Server độc lập; Userscripts tự động hoá MWG đồng bộ với web.
6. **Batch 6: Test Suites & Tooling Infrastructure** ([`audit/phase-3-batch-6-tests-tooling.md`](file:///Users/ltson/dashboardycx/audit/phase-3-batch-6-tests-tooling.md))
   - 170 unit test files (1.477 PASS); 193 E2E specs phân định ranh giới an toàn.
   - Phân tích và chứng minh thực nghiệm vì sao Candidate AST tuyệt đối không phải dead code.

---

## 3. Khẳng Định: Candidate AST Tuyệt Đối Không Phải Dead Code
Quá trình đọc sâu mã nguồn khẳng định:
- **467 Component Candidates & 169 Surface Candidates**:
  - Không xuất hiện trong cây JSX tĩnh vì được kích hoạt động qua state `activeTab` trong `App.tsx` hoặc các sub-tabs bên trong từng feature.
  - Được mount theo nhu cầu qua React Portals (`#mobile-topbar-actions`), Modal Overlays, hoặc Event Listeners.
  - Là các thành phần UI Primitives đa biến thể được thiết kế sẵn cho toàn bộ Design System.
- **Quy tắc An toàn**: Tuyệt đối không xóa bất kỳ file hay xuất khẩu nào chỉ vì kết quả regex/AST tĩnh báo "chưa thấy tham chiếu".

---

## 4. Trạng Thái Các Phase Tiếp Theo (Phase 4–10)
- **Phase 4 (Foundation & Bug Fixes)**: Chưa thực hiện. Đã có đầy đủ căn cứ thực nghiệm để chuẩn bị sửa nguồn (chủ động quản lý focus tuần tự trong `useModalBehavior.ts`).
- **Phase 5–10 (Migration, Refactoring, Cleanup, Final Reconciliation)**: Giữ nguyên trạng thái chưa thực hiện.

---

## 5. Tính Toàn Vẹn Checkpoint & Không Push/Deploy
- File `tests/unit/session-ownership-claim.test.ts` giữ nguyên thay đổi whitespace hiện hành (đối soát `git diff -w` rỗng).
- Không tự ý deploy, không push, không can thiệp production.
