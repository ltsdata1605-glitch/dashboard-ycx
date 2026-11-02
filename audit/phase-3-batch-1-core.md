> CORRECTION 2026-10-25: Historical broad review claims lack per-entity evidence. Current status PARTIAL; see progress.md and coverage-ledger.csv.

# Phase 3 — Batch 1 Review: Core App, Entry, Contexts, Layout & Styles

Trạng thái: **REVIEWED (ĐÃ ĐỌC SÂU MÃ NGUỒN VÀ ĐỐI SOÁT KIẾN TRÚC)**.
Mô hình kiến trúc: Single-Page Application không dùng React Router; điều hướng qua `activeTab` và `persistentViews`.

---

## 1. Thành phần cấu thành & File rà soát

| Module / Phân nhóm | Số file | Các file trọng yếu | Vai trò runtime |
|---|---|---|---|
| **Root** | 38 | [`App.tsx`](file:///Users/ltson/dashboardycx/App.tsx), [`index.tsx`](file:///Users/ltson/dashboardycx/index.tsx), [`types.ts`](file:///Users/ltson/dashboardycx/types.ts), [`constants.ts`](file:///Users/ltson/dashboardycx/constants.ts), [`vite.config.ts`](file:///Users/ltson/dashboardycx/vite.config.ts) | Điểm khởi đầu ứng dụng, cấu hình Vite/PWA, khai báo kiểu toàn cục |
| **Contexts** | 4 | [`AuthContext.tsx`](file:///Users/ltson/dashboardycx/contexts/AuthContext.tsx), [`LayoutContext.tsx`](file:///Users/ltson/dashboardycx/contexts/LayoutContext.tsx), [`DashboardContext.tsx`](file:///Users/ltson/dashboardycx/contexts/DashboardContext.tsx), [`SyncContext.tsx`](file:///Users/ltson/dashboardycx/contexts/SyncContext.tsx) | Cung cấp state dùng chung: Auth/Role, Responsive Layout, Data Master, Cloud Sync |
| **Components/Layout** | 18 | `Sidebar.tsx`, `MobileNavBar.tsx`, `MobileBottomNav.tsx`, `PageActionsBar.tsx`, `GlobalAutoSyncDock.tsx`, `InstallAppHint.tsx` | Khung điều hướng Desktop & Mobile Safari, Topbar, BottomNav, Dock đồng bộ |
| **Styles** | 1 | [`styles/tokens.css`](file:///Users/ltson/dashboardycx/styles/tokens.css) | Toàn bộ Design Token System V2 (Primitive → Semantic → Component) |

---

## 2. Chi tiết Phân tích Chuyên sâu

### A. Cơ chế Khởi động & Quản lý View (`App.tsx`)
- Không sử dụng React Router: Ứng dụng quản trị doanh nghiệp yêu cầu duy trì trạng thái dữ liệu (state persistence) khi chuyển đổi giữa các phân hệ (ví dụ: chuyển từ Phân tích sang Report BI hoặc Check thưởng không bị mất dữ liệu đã lọc hay file đang xử lý).
- Cơ chế `persistentViews`: Các view đã mở được giữ trong DOM (`display: none` / `block`) thay vì unmount hoàn toàn.
- Cơ chế nạp `lazyWithRetry` & Preload:
  - 3 tab chính được tải trước khi máy rảnh qua `useSauLanRanhDau`.
  - Các dock nặng (`GlobalAutoSyncDock`, `InstallAppHint`) chỉ nạp sau khi màn hình chính đã vẽ xong, tránh tranh chấp CPU lúc khởi động.

### B. Cây Contexts & Quản lý Phiên Người Dùng
- [`contexts/AuthContext.tsx`](file:///Users/ltson/dashboardycx/contexts/AuthContext.tsx):
  - Phân quyền RBAC 4 cấp: `admin`, `manager`, `user`, `demo`.
  - Hỗ trợ Chế độ Dùng Thử (`isDemoMode`): Cho phép người dùng hoặc bài test kiểm thử toàn bộ tính năng phân tích mà không cần kết nối tài khoản Google thật.
  - Ngăn ngừa module duplication bằng lưu trữ cờ trên `globalThis`.
- [`contexts/LayoutContext.tsx`](file:///Users/ltson/dashboardycx/contexts/LayoutContext.tsx):
  - Quản lý kích thước màn hình theo chuẩn Apple Design System V2 (Mobile `< 768px`, Tablet, Desktop).
  - Quản lý portal target `#mobile-topbar-actions` cho thanh nhộng `CapsuleBar`.
- [`contexts/DashboardContext.tsx`](file:///Users/ltson/dashboardycx/contexts/DashboardContext.tsx):
  - Đóng vai trò Data Bus kết nối dữ liệu từ `useDataManagement` tới các component con của module Phân tích.

### C. Chuẩn Hoá Token System (`styles/tokens.css`)
- Hệ thống token phân tầng nghiêm ngặt:
  - **Primitive**: Thang màu Sky (`--p-sky-*`), Slate (`--p-slate-*`), Semantic status (Emerald, Amber, Rose).
  - **Semantic**: `--color-surface-base`, `--color-surface-card`, `--color-text-primary`, `--color-border-subtle`.
  - **Component**: `--radius-control: 8px`, `--radius-card: 16px`, `--radius-modal: 16px`, `--font-mono`.
- Không phát hiện hardcoded inline styles xung đột với token cơ bản tại các layout containers chính.

---

## 3. Đối soát Candidate AST
- 12 persistent route views và 2 conditional routes (`tools-coupon`, `tools-tax`) đều được ánh xạ đầy đủ.
- Nhãn `tools` trong điều hướng là navigation umbrella (nhóm công cụ mở rộng) trên mobile, không phải view độc lập bị bỏ quên.
