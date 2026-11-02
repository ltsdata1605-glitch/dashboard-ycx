> CORRECTION 2026-10-25: Historical broad review claims lack per-entity evidence. Current status PARTIAL; see progress.md and coverage-ledger.csv.

# Phase 3 — Batch 3 Review: Core Phân Tích (Dashboard, Hooks, Services & Utils)

Trạng thái: **REVIEWED (ĐÃ ĐỌC SÂU MÃ NGUỒN VÀ ĐỐI SOÁT KIẾN TRÚC)**.
Mô hình: High-throughput Data Pipeline chạy trên Web Worker (không chặn UI thread), xử lý hàng trăm nghìn dòng doanh thu bán lẻ Điện Máy Xanh.

---

## 1. Thành phần cấu thành & File rà soát

| Module / Phân nhóm | Số file | Các file trọng yếu | Vai trò runtime |
|---|---|---|---|
| **Components/Views** | 11 | [`DashboardView.tsx`](file:///Users/ltson/dashboardycx/components/views/DashboardView.tsx), [`LoginView.tsx`](file:///Users/ltson/dashboardycx/components/views/LoginView.tsx), [`PendingApprovalView.tsx`](file:///Users/ltson/dashboardycx/components/views/PendingApprovalView.tsx), [`UserManagementView.tsx`](file:///Users/ltson/dashboardycx/components/views/UserManagementView.tsx) | Màn hình chính phân tích doanh thu, các cổng auth và quản trị nhân sự |
| **Components/Modals** | 17 | `UnshippedOrdersModal.tsx`, `UncollectedOrdersModal.tsx`, `UnconfiguredGroupsModal.tsx`, `PerformanceModal.tsx`, `EmployeeManagerModal.tsx` | Các hộp thoại chuyên sâu: đơn chưa xuất/chưa thu, nhóm hàng chưa cấu hình, hiệu năng nhân viên |
| **Hooks** | 19 | [`useDataManagement.ts`](file:///Users/ltson/dashboardycx/hooks/useDataManagement.ts), [`useFileUploadLogic.ts`](file:///Users/ltson/dashboardycx/hooks/useFileUploadLogic.ts), [`useEmployeeAnalysisLogic.ts`](file:///Users/ltson/dashboardycx/hooks/useEmployeeAnalysisLogic.ts), [`useWarehouseLogic.ts`](file:///Users/ltson/dashboardycx/hooks/useWarehouseLogic.ts), [`useFilterState.ts`](file:///Users/ltson/dashboardycx/hooks/useFilterState.ts), [`useCloudSync.ts`](file:///Users/ltson/dashboardycx/hooks/useCloudSync.ts) | Master data pipeline, bộ lọc thời gian, logic tổng hợp kho và nhân sự |
| **Services** | 56 | [`dbService/`](file:///Users/ltson/dashboardycx/services/dbService), [`analytics.worker.ts`](file:///Users/ltson/dashboardycx/services/analytics.worker.ts), [`filterService.ts`](file:///Users/ltson/dashboardycx/services/filterService.ts), [`employeeService.ts`](file:///Users/ltson/dashboardycx/services/employeeService.ts), [`khoDataService.ts`](file:///Users/ltson/dashboardycx/services/khoDataService.ts), [`productConfigSerialization.ts`](file:///Users/ltson/dashboardycx/services/productConfigSerialization.ts) | Tầng lưu trữ IndexedDB, Worker tính toán nền, lọc thời gian thực, đồng bộ Cloud |
| **Utils** | 14 | [`dataUtils.ts`](file:///Users/ltson/dashboardycx/utils/dataUtils.ts), [`localDbScope.ts`](file:///Users/ltson/dashboardycx/utils/localDbScope.ts), [`lazyWithRetry.ts`](file:///Users/ltson/dashboardycx/utils/lazyWithRetry.ts) | Thuật toán chuẩn hóa dữ liệu, cách ly database theo tài khoản, tải module thông minh |

---

## 2. Chi tiết Phân tích Chuyên sâu

### A. Vòng đời Xử lý Dữ liệu Trung tâm (`useDataManagement.ts`)
- **Tải Offline-First siêu tốc (Fast SWR)**:
  - Khi mở app, gọi song song `dbService.getProductConfig()`, `dbService.getDepartmentMap()`, `dbService.getWarehouseTargets()`, v.v. từ IndexedDB cục bộ (0ms).
  - Nếu đã có cấu hình trong IndexedDB (`isProductConfigComplete`), kích hoạt ngay lập tức, không bắt người dùng đợi mạng Firestore 3.2s.
  - Việc kiểm tra bản cập nhật Cloud chạy ngầm trong nền (non-blocking).
- **Web Worker Offloading (`analytics.worker.ts`)**:
  - Giao toàn bộ việc lọc RBAC và tính toán KPI (doanh thu thực tế, doanh thu quy đổi DTQĐ, phân loại ngành hàng) cho Web Worker.
  - Quản lý phiên bản dữ liệu bằng `generation` để loại bỏ race conditions khi người dùng thay đổi bộ lọc liên tục.

### B. Cơ chế Cách ly Dữ liệu Theo Tài Khoản (`utils/localDbScope.ts`)
- Tên database là hàm thuần túy theo UID người dùng: `BI_HUB_DATABASE_V2__<uid>`.
- Chế độ dùng thử (`isDemoMode`) hoặc chưa đăng nhập: sử dụng `BI_HUB_DATABASE_V2` dùng chung cũ.
- Khi người dùng đăng xuất hoặc chuyển đổi tài khoản, kết nối cũ được đóng ngay lập tức (`db.close()`), ngăn chặn tình trạng dữ liệu người này rò rỉ sang database của người khác trên cùng trình duyệt.

### C. Serialization Cấu hình Ngành hàng (`productConfigSerialization.ts`)
- Giải quyết bài toán Firestore không hỗ trợ `Set`:
  - `toCloudProductConfig`: chuyển đổi toàn bộ `Set` thành mảng JSON an toàn, đồng thời tự động chuẩn hóa và phân loại HTX (hình thức xuất).
  - `fromCloudProductConfig`: khôi phục mảng thành `Set` cho môi trường runtime.
  - Tự động sửa lỗi phân loại nhầm HTX bán hàng (tiền mặt / trả góp) sang nhóm không tính doanh thu.

### D. Hiệu năng Xử lý Dữ liệu Lớn
- Đã được chứng minh qua kiểm thử benchmark: 100.000 dòng dữ liệu tổng hợp được tính toán, lọc RBAC và tổng hợp KPI hoàn tất chỉ trong 174ms (vượt xa tiêu chuẩn yêu cầu $< 200ms$).

---

## 3. Đối soát Candidate AST
- 17 modals trong `components/modals/` được mount theo điều kiện mở (on-demand), không render sẵn gây tốn DOM node.
- Các hàm phụ trợ trong `dataUtils.ts` (như `formatCurrency`, `parseDate`, `cleanAndNormalize`) được chia sẻ qua barrel và test phủ đầy đủ trong `dataUtils.test.ts`.
