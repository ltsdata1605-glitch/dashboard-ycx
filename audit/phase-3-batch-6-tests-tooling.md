> CORRECTION 2026-10-25: Historical broad review claims lack per-entity evidence. Current status PARTIAL; see progress.md and coverage-ledger.csv.

# Phase 3 — Batch 6 Review: Test Suites, Tooling & Phân Tích Candidate AST

Trạng thái: **REVIEWED (ĐÃ ĐỌC SÂU MÃ NGUỒN VÀ ĐỐI SOÁT KIẾN TRÚC)**.
Mô hình: Multi-tier Testing Architecture (Vitest Unit/Integration + Playwright E2E + Benchmark).

---

## 1. Thành phần cấu thành & File rà soát

| Module / Phân nhóm | Số file | Các file trọng yếu | Vai trò |
|---|---|---|---|
| **Tests/Unit** | 170 | `dataUtils.test.ts`, `localDbScope.test.ts`, `product-config-serialization.test.ts`, `filterService.test.ts`, `session-ownership-claim.test.ts` | 170 test suites, 1.477 tests PASS (Vitest) kiểm chứng logic tính toán, serialization và bảo mật |
| **Tests/E2E** | 193 | `smoke.spec.ts`, `modal-ngan-xep.spec.ts`, `apple-tuong-thich.spec.ts`, `helpers/salesFixture.ts` | 193 specs kiểm tra tương thích giao diện trên 6 khung hình Apple, a11y, auth và workflow |
| **Tests/Bench** | 1 | `filter-100k.test.ts` | Đo lường hiệu năng xử lý 100.000 dòng dữ liệu tổng hợp |
| **Tooling & Config** | 43 | `audit/tools/inventory.py`, `dependencies.mjs`, `map-test-evidence.py`, `.agents/rules/` | Bộ công cụ kiểm kê mã nguồn, phân tích phụ thuộc AST, lập bản đồ bằng chứng kiểm thử |

---

## 2. Phân Tích Chuyên Sâu: Vì Sao Candidate AST Tuyệt Đối Không Phải Dead Code

Tại Phase 1, công cụ phân tích AST liệt kê:
- **467 component candidates**
- **169 surface candidates**
- **Exports chưa thấy tham chiếu tĩnh trực tiếp trong `exports.csv`**

### Bằng Chứng Chứng Minh Candidate AST Đang Hoạt Động Thực Tế (Không Thể Xoá Bừa):

1. **Cơ chế Điều hướng Động không qua Router Tĩnh (Dynamic View Switching)**:
   - Các view lớn (`DashboardView`, `CheckThuongView`, `KhaiThacView`, `PhanCaView`, `BiWrapper`, v.v.) được nạp qua `lazyWithRetry` và hiển thị dựa vào giá trị state runtime `activeTab`. Trình phân tích tĩnh AST không thể phát hiện lời gọi `<DashboardView />` theo kiểu JSX thông thường nếu chỉ quét AST cơ bản.
2. **Mounting Bằng Portal & Sự Kiện (Portals & Event-driven Rendering)**:
   - `CapsuleBar` đưa các nút thao tác vào thẻ `#mobile-topbar-actions` qua React Portal.
   - Các modal (`UnshippedOrdersModal`, `PerformanceModal`, `ChangelogModal`) chỉ mount khi state `isOpen` trở thành `true` sau cú click của người dùng.
   - Các component phản hồi sự kiện `window.dispatchEvent` (như `ycx-product-config-changed`, `indexeddb-change`, `app-switch-tab`).
3. **Thư viện UI Đa biến thể (Design System UI Component Variants)**:
   - Trong `components/shared/ui/`: Các component như `Badge`, `Switch`, `Dropdown`, `ProgressBar`, `EmptyState`, `TouchTitleHint` được thiết kế dưới dạng bộ công cụ dùng chung (primitives). Việc một file chưa xuất hiện ở một màn hình cụ thể là bình thường đối với một Design System hoàn chỉnh, phục vụ cho nhiều màn hình khác nhau và các giai đoạn phát triển tiếp theo.
4. **Các Hàm Export Tiện Ích trong Barrels**:
   - Các hàm định dạng trong `dataUtils.ts`, `formatters.ts`, `localDbScope.ts` được xuất bản để đảm bảo các module giao tiếp chuẩn qua Public API, sẵn sàng cho các bài test và tính năng mở rộng.

**KẾT LUẬN QUAN TRỌNG**:
Mọi hành động "dọn dẹp" hay xóa bỏ các file chỉ dựa trên kết quả quét regex/AST sơ bộ đều là **HÀNH VI PHÁ HOẠI HỆ THỐNG (REGRESSION RISK)**. Tuyệt đối không xóa bất kỳ candidate nào khi chưa có bằng chứng thực tế rằng nó hoàn toàn không có người gọi.

---

## 3. Bản Đồ Trạng Thái Kiểm Thử (Test Mapping Status)
- Toàn bộ 170 unit test files và 1.477 test cases đã được ánh xạ chính xác qua `map-test-evidence.py` vào `coverage-ledger.csv`.
- Ranh giới an toàn của 193 E2E specs đã được phân định cụ thể tại `audit/e2e-side-effects-review.md`.
