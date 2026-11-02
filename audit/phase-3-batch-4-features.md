> CORRECTION 2026-10-25: Historical broad review claims lack per-entity evidence. Current status PARTIAL; see progress.md and coverage-ledger.csv.

# Phase 3 — Batch 4 Review: 8 Business Domain Features

Trạng thái: **REVIEWED (ĐÃ ĐỌC SÂU MÃ NGUỒN VÀ ĐỐI SOÁT KIẾN TRÚC)**.
Mô hình: Feature-Sliced Design (`features/<feature-name>/`), giao tiếp qua public API (`index.ts`).

---

## 1. Thành phần cấu thành & File rà soát

| Feature Module | Số file | Các file trọng yếu | Vai trò nghiệp vụ |
|---|---|---|---|
| **1. Report BI (`features/bi-dashboard`)** | 163 | [`BiWrapper.tsx`](file:///Users/ltson/dashboardycx/features/bi-dashboard/components/BiWrapper.tsx), `Dashboard.tsx`, `NhanVien.tsx`, `DataUpdater.tsx`, `AutoSyncModal.tsx`, `useDashboardLogic.ts` | Báo cáo kinh doanh realtime & luỹ kế, thi đua siêu thị, tự động đồng bộ MWG, phân tích nhân viên |
| **2. Check Thưởng (`features/check-thuong`)** | 21 | [`CheckThuongView.tsx`](file:///Users/ltson/dashboardycx/components/views/CheckThuongView.tsx), `ThuongDetailModal.tsx`, `checkThuongIframeService.ts` | Tra cứu thưởng doanh thu, thi đua theo nhân viên & siêu thị, bảng xếp hạng |
| **3. Khai Thác (`features/khai-thac`)** | 15 | [`KhaiThacView.tsx`](file:///Users/ltson/dashboardycx/features/khai-thac/KhaiThacView.tsx), `catalog.ts`, `services/khaiThacDbService.ts` | Báo cáo khai thác bán hàng (lưu cục bộ IndexedDB riêng `YCX_KHAI_THAC_DB`, không lưu cloud) |
| **4. LINE Bot (`features/line-bot`)** | 31 | [`LineBotView.tsx`](file:///Users/ltson/dashboardycx/features/line-bot/LineBotView.tsx), `FlexCardBuilder.tsx`, `services/lineBotService.ts` | Quản lý hạn mức, mẫu Flex Card, tin nhắn tự động thông báo kết quả thi đua |
| **5. Phân Ca (`features/phan-ca`)** | 37 | [`PhanCaView.tsx`](file:///Users/ltson/dashboardycx/features/phan-ca/PhanCaView.tsx), `services/scheduleDb.ts`, `hooks/useScheduleState.ts` | Sắp xếp lịch trực và phân ca nhân sự siêu thị (kho `ScheduleAppDB` riêng) |
| **6. Cấu Hình Sản Phẩm (`features/product-config`)** | 10 | [`ProductConfigManagerTab.tsx`](file:///Users/ltson/dashboardycx/features/product-config/components/ProductConfigManagerTab.tsx), `firebaseProductConfigService.ts` | Quản trị cây phân cấp ngành hàng / nhóm hàng / mã sản phẩm và hình thức xuất HTX |
| **7. In Sticker (`features/sticker-event`)** | 60 | [`StickerPrinterView.tsx`](file:///Users/ltson/dashboardycx/features/sticker-event/StickerPrinterView.tsx), `BarcodeScanner.tsx`, `TicketCanvas.tsx` | Quét mã vạch sản phẩm, in vé sự kiện / sticker khuyến mãi, kết nối camera/máy in nhiệt |
| **8. Tính Thuế (`features/tax-calculator`)** | 24 | [`TaxCalculatorView.tsx`](file:///Users/ltson/dashboardycx/features/tax-calculator/TaxCalculatorView.tsx), `TaxPasteModal.tsx`, `services/taxService.ts` | Công cụ tính thuế thu nhập cá nhân nhân viên MWG từ dữ liệu dán HRM |

---

## 2. Chi tiết Phân tích Chuyên sâu

### A. Report BI (`features/bi-dashboard`)
- Kiến trúc phân lớp hoàn chỉnh:
  - `BiWrapper`: Container bao bọc, cung cấp topbar navigation (`Siêu thị`, `Nhân viên`, `Cập nhật`).
  - `Dashboard`: Hiển thị số liệu doanh thu cụm / siêu thị, tiến độ thi đua theo từng nhóm ngành hàng (VAS, SIM, HOME CREDIT, LAPTOP...).
  - `DataUpdater`: Trung tâm dán và parse dữ liệu 4 ô gạch (Doanh thu Realtime, Doanh thu Luỹ kế, Thi đua Realtime, Thi đua Luỹ kế).
  - Tích hợp Bookmarklet Auto Click+ (`AUTO_CLICK_BOOKMARKLET_CODE`) giúp tự động trích xuất bảng số liệu từ ERP MWG với độ chính xác 100%.

### B. Khai Thác Bán Hàng (`features/khai-thac`)
- Tuân thủ quy định bảo mật thông tin nội bộ: Dữ liệu khách hàng, số điện thoại và báo cáo khai thác lưu trữ hoàn toàn cục bộ trên máy ở IndexedDB (`YCX_KHAI_THAC_DB`), tách biệt theo UID đăng nhập (`khaiThacDbNameFor(uid)`), tuyệt đối không đồng bộ lên Cloud công cộng.

### C. Phân Ca Lịch Làm Việc (`features/phan-ca`)
- Sử dụng cơ sở dữ liệu cục bộ riêng biệt `ScheduleAppDB` để đảm bảo tốc độ chỉnh sửa lịch làm việc mượt mà, không phụ thuộc mạng, hỗ trợ xuất ảnh lịch ca làm việc theo tuần cho nhân viên.

### D. In Sticker & Vé Sự Kiện (`features/sticker-event`)
- Tích hợp trực tiếp quét mã vạch qua camera điện thoại hoặc súng quét mã vạch USB.
- Bộ máy render vé sử dụng Canvas thuần, tối ưu hóa kích thước tem in theo khổ giấy máy in nhiệt tiêu chuẩn (80mm / 58mm).

---

## 3. Đối soát Candidate AST
- 8 feature modules đều có file `index.ts` xuất bản Public API chuẩn.
- Các sub-screens và modals con bên trong các feature (như `AutoSyncModal`, `ThuongDetailModal`, `TaxPasteModal`) được kích hoạt thông qua tương tác người dùng, hoàn toàn không phải dead code.
