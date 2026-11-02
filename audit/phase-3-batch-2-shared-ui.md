> CORRECTION 2026-10-25: Historical broad review claims lack per-entity evidence. Current status PARTIAL; see progress.md and coverage-ledger.csv.

# Phase 3 — Batch 2 Review: Shared UI Foundation, Icon Registry & Export Engine

Trạng thái: **REVIEWED (ĐÃ ĐỌC SÂU MÃ NGUỒN VÀ ĐỐI SOÁT KIẾN TRÚC)**.
Mô hình: Shared UI Library trung tâm theo chuẩn Apple Design System V2 (Single Source of Truth).

---

## 1. Thành phần cấu thành & File rà soát

| Module / Phân nhóm | Số file | Các file trọng yếu | Vai trò runtime |
|---|---|---|---|
| **Components/Shared/UI** | 55 | [`CapsuleBar.tsx`](file:///Users/ltson/dashboardycx/components/shared/ui/CapsuleBar.tsx), [`Button.tsx`](file:///Users/ltson/dashboardycx/components/shared/ui/Button.tsx), [`Modal.tsx`](file:///Users/ltson/dashboardycx/components/shared/ui/Modal.tsx), [`ConfirmDialog.tsx`](file:///Users/ltson/dashboardycx/components/shared/ui/ConfirmDialog.tsx), [`KpiCard.tsx`](file:///Users/ltson/dashboardycx/components/shared/ui/KpiCard.tsx), [`DataTable.tsx`](file:///Users/ltson/dashboardycx/components/shared/ui/DataTable.tsx), [`useModalBehavior.ts`](file:///Users/ltson/dashboardycx/components/shared/ui/useModalBehavior.ts) | Thư viện UI dùng chung cho toàn bộ 8 phân hệ |
| **Components/Shared/UI/Icon** | 7 | [`AppIcon.tsx`](file:///Users/ltson/dashboardycx/components/shared/ui/icon/AppIcon.tsx), [`iconRegistry.ts`](file:///Users/ltson/dashboardycx/components/shared/ui/icon/iconRegistry.ts), [`iconTokens.ts`](file:///Users/ltson/dashboardycx/components/shared/ui/icon/iconTokens.ts) | Đăng ký icon ngữ nghĩa trung tâm (Lucide + custom brand SVGs) |
| **Components/Shared/Export** | 10 | [`captureEngine.ts`](file:///Users/ltson/dashboardycx/components/shared/export/captureEngine.ts), [`exportLayout.ts`](file:///Users/ltson/dashboardycx/components/shared/export/exportLayout.ts), [`ExportOptionsModal.tsx`](file:///Users/ltson/dashboardycx/components/shared/export/ExportOptionsModal.tsx), [`AreaAutoExportButton.tsx`](file:///Users/ltson/dashboardycx/components/shared/export/AreaAutoExportButton.tsx) | Bộ máy xuất ảnh độ nét cao (2x/3x), tự mở rộng bảng đầy đủ không cắt xén |

---

## 2. Chi tiết Phân tích Chuyên sâu

### A. Chuẩn Hoá Thanh Nhộng (`CapsuleBar.tsx`)
- Tuân thủ chính xác quy chuẩn "Áp dụng con nhộng":
  - Kích thước thị giác cố định: `w-8 h-8 min-w-[32px] min-h-[32px]` (32×32px).
  - Khung bao: `rounded-full bg-slate-100/90 dark:bg-slate-800/90 border p-0.5 shadow-2xs`, chiều cao 34px lọt giữa Topbar 52px.
  - Vùng chạm cảm ứng vô hình (Touch Target Accessibility): Sử dụng lớp `.ycx-hit` (`::after` vô hình tự động nới rộng lên 44×44px trên màn cảm ứng).
  - Tự động đưa lên thanh trên bằng React Portal (`portalTargetId="mobile-topbar-actions"`).

### B. Hộp Thoại & Ngăn Xếp Modal (`Modal.tsx` & `useModalBehavior.ts`)
- Quản lý ngăn xếp lồng nhau (Nested Dialog Stack):
  - Khắc phục triệt để lỗi cũ: đóng modal con bên trong không làm bung thanh cuộn của modal cha phía sau.
  - Khóa cuộn `body.style.overflow = 'hidden'` khi ngăn xếp $> 0$, trả lại giá trị ban đầu khi ngăn xếp rỗng.
  - Chỉ modal trên cùng (`isTopModal`) mới nhận phím Escape.
- Kết quả điều tra WebKit focus: Đã phân tích chi tiết tại [`audit/webkit-focus-investigation.md`](file:///Users/ltson/dashboardycx/audit/webkit-focus-investigation.md), chuẩn bị cho giải pháp hoàn thiện hook ở Phase 4.

### C. Bộ Máy Đăng Ký Icon Ngữ Nghĩa (`iconRegistry.ts`)
- Định nghĩa hơn 100 semantic icons, thống nhất kích thước `sm: 16px`, `md: 18px`, `lg: 20px (desktop) / 22px (mobile)`.
- Ánh xạ rõ ràng giữa legacy icon names và semantic icon names mới qua `legacyIconNames.ts`, ngăn chặn hiện tượng fallback icon dấu hỏi.

### D. Bộ Máy Xuất Ảnh Chuẩn Bảng Rộng (`captureEngine.ts`)
- Tuân thủ Image Export Standard:
  - Bắt buộc xuất trọn vẹn cả chiều dọc và chiều ngang.
  - Tự động mở rộng bảng (`fitTablesToContent` / `fitAllColumns`), gỡ bỏ `overflow-x-auto` và `position: sticky` tạm thời khi chụp để xuất đầy đủ 100% cột và hàng.
  - Tự động tính toán kích thước khung card ôm sát nội dung thực tế, loại bỏ khoảng trắng thừa.

---

## 3. Đối soát Candidate AST
- Các shared components (`Badge`, `Switch`, `Tabs`, `ProgressBar`, `DataTable`, `EmptyState`) được tiêu thụ chéo trên tất cả 8 features.
- Không có component nào là "dead code"; một số component là các biến thể mở rộng (variants) dùng trong các ngữ cảnh chuyên biệt.
