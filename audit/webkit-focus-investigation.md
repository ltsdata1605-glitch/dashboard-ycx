# Điều tra hành vi Focus WebKit vs Chromium trên Modal (A11/A12)

Trạng thái: ĐÃ XÁC ĐỊNH NGUYÊN NHÂN GỐC BẰNG THỰC NGHIỆM (EMPIRICAL EVIDENCE).
Không sửa assertion, không skip test để che giấu lỗi.

## 1. Hiện tượng ghi nhận
Tại `tests/e2e/modal-ngan-xep.spec.ts` (test `a11y: role=dialog + aria-modal + tên; focus vào trong, Tab vòng trong modal, đóng thì trả focus`):
- **Chromium**: PASS (Tab 10 lần liên tục đều nằm trong modal `Hộp thoại A`).
- **WebKit (Playwright WebKit 26.6 / v2359 macOS)**: FAIL ở Tab lần thứ 3 với lỗi:
  `Error: Tab lần 3 thoát khỏi modal. Expected: true, Received: false`.

## 2. Dữ liệu thực nghiệm qua `audit/tools/investigate-webkit-focus.mjs`

### A. Đối chiếu thứ tự `document.activeElement` theo từng lượt Tab

| Lượt | Chromium | WebKit | Nhận xét khác biệt |
|---|---|---|---|
| Khởi tạo | `DIV[tabindex=-1]` (Khung Dialog) | `DIV[tabindex=-1]` (Khung Dialog) | Cả 2 engine đều đưa focus vào khung modal |
| Tab #1 | `BUTTON` (Đóng, `aria-label="Đóng"`) | `BUTTON` (Đóng, `aria-label="Đóng"`) | `useModalBehavior` can thiệp (`!inside \|\| active === root`) -> gọi `first.focus()` |
| Tab #2 | `INPUT#a-input` (Ô nhập A) | `INPUT#a-input` (Ô nhập A) | Tab tuần tự tự nhiên của trình duyệt từ nút Đóng sang ô nhập |
| **Tab #3** | `BUTTON#mo-b` (Xoá / mở B) | **`BODY` (`inside=false`)** | **WebKit bỏ qua button trong điều hướng Tab mặc định, focus thoát ra `body`!** |
| Tab #4 | `BUTTON#mount-c` (Mount C) | `BUTTON` (Đóng) | Do focus ở `body` (ngoài dialog), `!inside` kích hoạt và kéo về `first` (Đóng) |
| Tab #5 | `BUTTON#a-luu` (Lưu A) | `INPUT#a-input` (Ô nhập A) | Lại từ Đóng sang ô nhập |
| **Tab #6** | `BUTTON` (Đóng - quay vòng) | **`BODY` (`inside=false`)** | Lại thoát ra `body` lần thứ hai |
| Tab #7 | `INPUT#a-input` (Ô nhập A) | `BUTTON` (Đóng) | Lại kéo về `first` (Đóng) |
| Tab #8 | `BUTTON#mo-b` (Xoá / mở B) | `INPUT#a-input` (Ô nhập A) | |

### B. Kiểm chứng Shift+Tab và Alt+Tab
1. **Shift+Tab từ nút đầu tiên ('Đóng')**:
   - Chromium: Focus chuyển tới `BUTTON#a-luu` (`Lưu A`) — PASS.
   - WebKit: Focus chuyển tới `BUTTON#a-luu` (`Lưu A`) — PASS.
   - *Lý do*: Nhánh `e.shiftKey && active === first` chủ động gọi phương thức DOM `.focus()` trên phần tử `last`, mà WebKit cho phép `.focus()` có chủ đích trên button.
2. **Alt+Tab (Option+Tab trong macOS WebKit / Safari)**:
   - Từ `INPUT#a-input`, bấm `Alt+Tab`:
   - Kết quả WebKit: `active = BUTTON#mo-b` (`Xoá (mở B)`).
   - Chứng minh: WebKit hỗ trợ điều hướng qua button khi dùng tổ hợp phím đầy đủ `Option+Tab` của Safari macOS.

## 3. Phân tích nguyên nhân gốc (Root Cause)

1. **Cơ chế điều hướng bàn phím mặc định của macOS WebKit / Safari**:
   - Theo thiết kế mặc định của WebKit trên macOS (khi chưa bật "Keyboard navigation" trong System Settings hoặc "Press Tab to highlight each item on a webpage" trong Safari Preferences), phím `Tab` đơn thuần CHỈ duyệt qua các trường nhập liệu văn bản (`input[type=text]`, `textarea`) và liên kết (`a[href]`).
   - Các phần tử `<button>`, `<input type="checkbox">`, `<input type="radio">` bị trình duyệt WebKit bỏ qua trong chuỗi Tab thông thường trừ khi người dùng dùng `Option+Tab`.
2. **Hạn chế trong kiến trúc của hook `useModalBehavior.ts` (dòng 119–137)**:
   - `useModalBehavior` chỉ can thiệp và gọi `e.preventDefault()` trong 3 trường hợp:
     a) Focus đang ở ngoài modal hoặc ở chính root modal: kéo về `first` (hoặc `last` nếu Shift+Tab).
     b) `e.shiftKey && active === first`: nhảy về `last`.
     c) `!e.shiftKey && active === last`: nhảy về `first`.
   - **Hook KHÔNG can thiệp các bước Tab ở giữa** (giả định rằng trình duyệt sẽ tự động duyệt tuần tự qua từng phần tử focusable trong DOM).
   - Trong modal A: sau `INPUT#a-input` chỉ còn lại các `<button>` (`#mo-b`, `#mount-c`, `#a-luu`). Vì `active` đang là `#a-input` (không phải `last`), hook để mặc cho WebKit xử lý Tab tự nhiên.
   - WebKit gặp Tab trên `#a-input`, tìm kiếm form control / link tiếp theo trong document. Do trong modal không còn input nào khác, WebKit điều hướng thẳng ra khỏi modal tới `document.body`!
   - Vì vậy, `dialog.contains(document.activeElement)` trả về `false` tại Tab lần thứ 3.

## 4. Hướng xử lý kiến trúc cho Phase 4 (Foundation/Bug Fix)
- **Không sửa assertion trong test**: Assertion `Tab vòng trong modal` là chuẩn a11y quốc tế (W3C WAI-ARIA Dialog Pattern).
- **Giải pháp đúng ở Source Hook `useModalBehavior.ts` (thực hiện ở Phase 4)**:
  Thay vì chỉ bẫy tại `first` và `last`, `useModalBehavior` có thể chủ động tính toán `nextFocusable` / `prevFocusable` từ danh sách `getFocusable(root)` và tự quản lý focus khi phím `Tab` được nhấn trong modal. Điều này đảm bảo hành vi trap focus nhất quán 100% trên mọi trình duyệt (Chromium, Firefox, WebKit, Safari iOS/macOS) bất kể cài đặt hệ thống của người dùng.
