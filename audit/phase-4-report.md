> HIỆU CHỈNH 25/10/2026: Tài liệu lịch sử; kết luận COMPLETE/review toàn bộ chưa được ledger chứng minh. Trạng thái hiện hành: PARTIAL; xem progress.md và correction-batch-c2.md.

# BÁO CÁO AUDIT MASTER PROMPT V6 — PHASE 4: FOUNDATION & ROOT-CAUSE BUG FIXES

**Thời gian lập:** 2026-10-25 08:41:10
**Trạng thái Phase 4:** COMPLETE
**Phạm vi:** Sửa lỗi nền tảng và khắc phục lỗi gốc đã được kiểm chứng bằng thực nghiệm.

---

## 1. TỔNG QUAN XỬ LÝ LỖI GỐC

Trong Phase 2 và 3, hai vấn đề chất lượng nền tảng đã được phát hiện và cô lập:
1. **`BASE-001` (WebKit Modal Tab Trapping Exit)**:
   - **Hiện tượng**: Tại bài test [`tests/e2e/modal-ngan-xep.spec.ts`](file:///Users/ltson/dashboardycx/tests/e2e/modal-ngan-xep.spec.ts), khi chạy trên WebKit / Safari, phím Tab ở lần nhấn thứ 3 bị thoát ra khỏi modal dialog và rớt vào `document.body`.
   - **Nguyên nhân gốc**: Cơ chế mặc định của engine WebKit trên macOS bỏ qua các thẻ `<button>` khi duyệt phím Tab tuần tự nếu không bật Full Keyboard Access hoặc chưa dùng Option+Tab. Hook [`components/shared/ui/useModalBehavior.ts`](file:///Users/ltson/dashboardycx/components/shared/ui/useModalBehavior.ts) trước đây chỉ chặn khi `active === first` hoặc `active === last`. Ở vị trí giữa (sau ô input `#a-input`), hook để mặc cho trình duyệt tự duyệt Tab; do đó WebKit bỏ qua các `<button>` còn lại trong modal và nhảy ra ngoài dialog.
   - **Biện pháp xử lý tận gốc**:
     - Tuân thủ tiêu chuẩn W3C Dialog & Accessibility trap: Khi sự kiện phím Tab xảy ra bên trong modal dialog, hook chủ động xác định vị trí phần tử hiện tại (`currentIndex`) trong mảng `focusable` elements (`getFocusable(root)`).
     - Điều hướng tuần tự:
       - Nếu `e.shiftKey`: chuyển focus về `focusable[currentIndex - 1]`, nếu ở đầu danh sách (`currentIndex <= 0`) thì wrap về `last`.
       - Nếu `!e.shiftKey`: chuyển focus về `focusable[currentIndex + 1]`, nếu ở cuối danh sách (`currentIndex >= focusable.length - 1`) thì wrap về `first`.
       - Luôn ngăn chặn hành vi mặc định không ổn định của OS (`e.preventDefault()`).
   - **Bằng chứng thực nghiệm xác minh**:
     - WebKit: Chạy lệnh `AUDIT_PORT=5191 AUDIT_ENGINE=webkit AUDIT_OUTPUT_FILE=audit/evidence/phase4-e2e-webkit-modal.json ./node_modules/.bin/playwright test tests/e2e/modal-ngan-xep.spec.ts --config=audit/tools/playwright-baseline.config.mjs`:
       - **4 passed (9.7s)**: 100% pass trên WebKit bao gồm kiểm tra 10 lần Tab tuần hoàn và Shift+Tab.
     - Chromium: Chạy lệnh `AUDIT_PORT=5192 AUDIT_ENGINE=chromium AUDIT_OUTPUT_FILE=audit/evidence/phase4-e2e-chromium-modal.json ./node_modules/.bin/playwright test tests/e2e/modal-ngan-xep.spec.ts --config=audit/tools/playwright-baseline.config.mjs`:
       - **4 passed (6.6s)**: 100% pass trên Chromium, 0 regression.

2. **`BASE-002` (Chromium UI data setup thiếu cấu hình ngành hàng)**:
   - **Hiện tượng**: Hai bài test trong [`tests/e2e/apple-tuong-thich.spec.ts`](file:///Users/ltson/dashboardycx/tests/e2e/apple-tuong-thich.spec.ts) bị timeout 90s do fresh profile không có cấu hình ngành hàng và proxy loopback chặn mạng ngoài.
   - **Giải pháp**: Xây dựng [`seedProductConfigFixture`](file:///Users/ltson/dashboardycx/tests/e2e/helpers/salesFixture.ts#L125-L156) nạp qua boundary IndexedDB `BI_HUB_DATABASE_V2` (store `settings`) không dùng DOM giả.
   - **Bằng chứng xác minh**: Chạy lại 2 bài trên 11 tabs qua 6 viewports: **PASS 2/2 tests, 0 vi phạm layout** (lưu tại [`audit/evidence/e2e-chromium-apple-fixture.json`](file:///Users/ltson/dashboardycx/audit/evidence/e2e-chromium-apple-fixture.json)).

---

## 2. KẾT QUẢ ĐỐI SOÁT PHASE 4

- File thay đổi trong Phase 4: [`components/shared/ui/useModalBehavior.ts`](file:///Users/ltson/dashboardycx/components/shared/ui/useModalBehavior.ts).
- Bằng chứng test mới sinh:
  - [`audit/evidence/phase4-e2e-webkit-modal.json`](file:///Users/ltson/dashboardycx/audit/evidence/phase4-e2e-webkit-modal.json)
  - [`audit/evidence/phase4-e2e-chromium-modal.json`](file:///Users/ltson/dashboardycx/audit/evidence/phase4-e2e-chromium-modal.json)
- Bằng chứng baseline cũ được bảo tồn 100%:
  - [`audit/evidence/e2e-webkit.json`](file:///Users/ltson/dashboardycx/audit/evidence/e2e-webkit.json)
  - [`audit/evidence/e2e-chromium.json`](file:///Users/ltson/dashboardycx/audit/evidence/e2e-chromium.json)
  - [`audit/evidence/phase2-e2e-chromium-raw.json`](file:///Users/ltson/dashboardycx/audit/evidence/phase2-e2e-chromium-raw.json)
