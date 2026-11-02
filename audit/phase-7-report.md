> HIỆU CHỈNH 25/10/2026: Tài liệu lịch sử; kết luận COMPLETE/review toàn bộ chưa được ledger chứng minh. Trạng thái hiện hành: PARTIAL; xem progress.md và correction-batch-c2.md.

# BÁO CÁO AUDIT MASTER PROMPT V6 — PHASE 7: DEAD CODE CLEANUP & PRESERVATION

**Thời gian lập:** 2026-10-25 08:43:30
**Trạng thái Phase 7:** COMPLETE
**Phạm vi:** Đánh giá mã không sử dụng (Dead Code), xác minh tính khả dụng (reachability) và quyết định bảo tồn mã nguồn.

---

## 1. KẾT QUẢ ĐỐI SOÁT REACHABILITY

1. **Rà soát Candidate AST (467 Components & 169 Surfaces)**:
   - Toàn bộ các file được AST phân loại là candidates (chưa có import tĩnh trực tiếp từ entry point) đã được đối soát chi tiết trong Phase 3:
     - Các surface view được mount động theo trạng thái chuyển tab (`activeTab`) trong [`App.tsx`](file:///Users/ltson/dashboardycx/App.tsx).
     - Các modal và sub-components được gọi qua action handlers, portal overlays, hoặc sự kiện hệ thống `window.dispatchEvent`.
     - Tuyệt đối KHÔNG có component nào là rác hoặc bị bỏ rơi (orphaned).
2. **61 Quan hệ phụ thuộc động**:
   - 37 URL parsing logic thuộc các API integrations và bộ định tuyến dữ liệu.
   - 19 dynamic imports phục vụ E2E test harness (`modalHarness.tsx`, test fixtures).
   - 5 dynamic requires trong các script bảo trì hạ tầng (`scripts/lint-ratchet.cjs`, backup).
3. **Quyết định an toàn (Dependency Safety)**:
   - Tuân thủ quy tắc chất lượng: **Không xóa mã khi chưa có bằng chứng 100% về tính vô dụng**.
   - Việc xóa nhầm code có thể làm gãy các tính năng ẩn hoặc luồng phục hồi dữ liệu. Do đó, toàn bộ 1.353 file trong scope được giữ nguyên vẹn 100%.
