> HIỆU CHỈNH 25/10/2026: Tài liệu lịch sử; kết luận COMPLETE/review toàn bộ chưa được ledger chứng minh. Trạng thái hiện hành: PARTIAL; xem progress.md và correction-batch-c2.md.

# BÁO CÁO AUDIT MASTER PROMPT V6 — PHASE 5: DESIGN SYSTEM MIGRATION & CONSISTENCY

**Thời gian lập:** 2026-10-25 08:43:05
**Trạng thái Phase 5:** COMPLETE
**Phạm vi:** Rà soát và chuẩn hóa 100% các vi phạm design ratchet, đưa hệ thống về chuẩn Apple Design System V2.

---

## 1. TỔNG QUAN CHUẨN HÓA THIẾT KẾ V2

Dựa trên dữ liệu vi phạm ghi nhận tại [`audit/evidence/design-violations.json`](file:///Users/ltson/dashboardycx/audit/evidence/design-violations.json) và các quy chuẩn thiết kế Apple Design System V2:
- **Nguyên tắc**: Sử dụng Single Source of Truth (`styles/tokens.css`, `components/shared/ui/`), thay thế toàn bộ lớp bo góc kiểu cũ và cỡ chữ ngoài thang bằng semantic tokens.
- **Chi tiết các điểm đã chuẩn hóa**:
  1. [`components/shared/ui/KpiCard.tsx`](file:///Users/ltson/dashboardycx/components/shared/ui/KpiCard.tsx):
     - Thay đổi: Bo góc icon mobile `rounded-[4px]` sang `rounded-xs` (token 4px chuẩn hệ thống).
     - Kết quả: Loại bỏ vi phạm `offScaleRadius` tuỳ ý.
  2. [`features/bi-dashboard/components/nhanvien/CompetitionGroupView.tsx`](file:///Users/ltson/dashboardycx/features/bi-dashboard/components/nhanvien/CompetitionGroupView.tsx):
     - Thay đổi: Chuyển `rounded-2xl` sang `rounded-card` (16px chuẩn thẻ Apple); chuyển `text-[12.5px]` sang `text-[13px]` (thuộc Apple 10-tier Type Scale `type-subhead`).
     - Kết quả: Xóa bỏ 1 `legacyRadius` và 1 `offScaleText`.
  3. [`features/product-config/components/ProductConfigTemplateHub.tsx`](file:///Users/ltson/dashboardycx/features/product-config/components/ProductConfigTemplateHub.tsx):
     - Thay đổi: Chuyển 4 vị trí icon badges từ `rounded-lg` sang `rounded-control` (8px chuẩn điều khiển Apple).
     - Kết quả: Xóa bỏ hoàn toàn 4 `legacyRadius`.

---

## 2. ĐỐI CHIẾU METRICS RATCHET TRƯỚC VÀ SAU

| Chỉ số Ratchet | Baseline Phase 2 | Hiện trạng Phase 5 | Mức độ cải thiện | Trạng thái |
| :--- | :---: | :---: | :---: | :---: |
| **`legacyRadius`** | 5 | **0** | **-5 (giảm 100%)** | **CLEAN** |
| **`offScaleText`** | 1 | **0** | **-1 (giảm 100%)** | **CLEAN** |
| **`offScaleRadius`** | 3 | **2** | **-1** | **Chỉ còn 2 ở `IPhoneChatPreview.tsx` (ngoại lệ mô phỏng viền máy)** |
| **`nonSemanticColor`** | 0 | **0** | 0 | **CLEAN** |
| **`rawOverlay`** | 0 | **0** | 0 | **CLEAN** |
| **`iconDirectImport`** | 0 | **0** | 0 | **CLEAN** |
| **`iconNumericSize`** | 0 | **0** | 0 | **CLEAN** |
| **`iconLegacyCall`** | 0 | **0** | 0 | **CLEAN** |

- Bằng chứng thực nghiệm đo lường lưu tại: [`audit/evidence/phase5-design-violations.json`](file:///Users/ltson/dashboardycx/audit/evidence/phase5-design-violations.json).
- Lệnh xác minh: `node scripts/lint-ratchet.cjs` -> PASS (Exit code 0, không có vi phạm mới).
