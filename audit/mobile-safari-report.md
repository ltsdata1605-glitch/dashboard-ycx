# Mobile Safari — lượt 2 (2026-10-28)

| Môi trường | Trạng thái | Ghi chú |
|---|---|---|
| Chromium desktop | RUN | `npm run check` + e2e |
| Chromium giả lập điện thoại (viewport + `isMobile` + `hasTouch`) | RUN | `liquid-glass-khung.spec.ts` 320/375/393/440 px; `khung-app-gd4`, `apple-tuong-thich` (6 khung). Đây KHÔNG phải Safari. |
| Playwright WebKit | **BLOCKED** | Container chỉ có Chromium (`/opt/pw-browsers`). CI job `e2e-webkit` chạy `apple-tuong-thich` trên WebKit khi push. |
| Safari iPhone thật | **BLOCKED** | Không có thiết bị. |
| iOS PWA (Màn hình chính) | **BLOCKED** | Không có thiết bị. |

## Checklist kiểm tay trên iPhone thật (sau khi chủ dự án deploy)
1. Mở app (Safari và app ở Màn hình chính): thanh tab nổi là viên kính 3 tab có chữ + nút tròn kính bên phải; nội dung trôi phía
   sau thấy mờ; không đè thanh Home.
2. Bấm từng tab: viên xám chạy theo mục chọn, chữ xanh; nút tròn mở sheet "Khác"; khi đang ở công cụ (Bot LINE, Thuế…) nút tròn xanh.
3. iPhone SE / máy màn 320–375: chữ "Check thưởng" đủ, không bị "…".
4. Cuộn xuống cuối trang Phân tích: dòng "Dashboard YCX…" nằm TRÊN thanh tab, không bị che.
5. Cài đặt → Trợ năng → Màn hình & cỡ chữ → bật **Giảm độ trong suốt**: thanh tab thành nền trắng đặc; bật **Tăng tương phản**:
   viền xám đậm.
6. Nạp tệp YCX khi tài khoản KHÔNG có Bot LINE: không còn hộp "Đang chụp ảnh…" tự hiện (AUD-002). Tài khoản CÓ bot: vẫn tự lưu ảnh
   cho lệnh `bcrt`/`bclk` như cũ.
