# Công việc còn lại — cập nhật 2026-10-28 (sau 5 việc chủ dự án đồng ý)

**Trạng thái tổng thể: PARTIAL** (còn: iPhone thật). Xung đột commit 172fad9 đã xử lý 2026-10-30 (AUD-039).

| Việc | Trạng thái | Ghi chú |
|---|---|---|
| 5. Knip — code chết | XONG (2 lượt) | `dead-code-report.md`; lượt 2 (2026-10-30): bỏ 19 lớp CSS chết trong styles.css (~4,5 KB) + 10 tệp public/ không ai tham chiếu (~1,3 MB: 8 ảnh exports-audit, phông Roboto biến thiên — Roboto Condensed nạp từ Google, `stickerevent/_redirects` kiểu Netlify vô tác dụng trên GitHub Pages) |
| 2. AUD-007 backdrop-blur | XONG | 54 → 38 → 27 (2026-10-30: bỏ 11 chỗ không nổi / hộp 95% trên lớp mờ; còn lại: lớp nền mờ, tooltip, HUD tối, banner màu, mô phỏng LINE — giữ có lý do, `backdrop-blur-classification.csv`), ratchet `backdropBlur` |
| 3. Chiều cao nút | XONG | `button-height-report.md`; AUD-012 chờ chủ dự án chọn 32/36 |
| 4. Hành trình người dùng | XONG bảng + lấp Phân ca | `user-journey-matrix.csv` 47 dòng; khoảng trống xuất Google Sheet / gợi ý AI Phân ca đã lấp 2026-10-30 (`phan-ca-sheet-va-ai`, dịch vụ ngoài thay bằng bản giả) |
| 1. Đọc sâu module | **PARTIAL** | Đã: đồng bộ (lightSync, useCloudSync, khởi động useDataManagement, đường cũ users/{uid}.settings → AUD-014), Check thưởng (AUD-009), Report BI (đọc số dùng chung parseNumber gốc → AUD-009 áp luôn; không tự tính DTQĐ), Bot LINE + functions/lineBotWebhook (chữ ký webhook đúng chuẩn; AUD-016 trạm chuyển tiếp mở — đã sửa + deploy + đo production), Thuế (2 bảng thuế tường minh, không lệch). In Sticker (Firestore qua Cloud Function đúng luật; AUD-017 đọc số lượng), Khai thác (parseTr đọc số triệu người dùng gõ — đúng ngữ cảnh), useDataManagement (AUD-018 Kho áp lại 3 phút/lần, AUD-020 xoá cloud im lặng), quét tự động toàn repo: listener/timer không gỡ (0), promise thiếu catch (đã xét từng chỗ), 8 luật lỗi logic ESLint (0, nay bật chặn). printService + useStickerPrinterData đọc hết 2026-10-29 (`audit/sticker-deep-read.md`, AUD-027…030). Functions đọc hết 2026-10-30: session, admin, claims, approvalSettings, pwaHandoff, stickerEvent, gemini, lineBotScheduler(+Due) → AUD-035…038 (đã sửa + deploy). In Sticker: không lỗ mới (luồng nhân viên không mật khẩu là quyết định của chủ dự án) |

## Batch tiếp theo
1. ~~Report BI đối chiếu `calculateRowMetrics`~~ — XONG 2026-10-29 (`audit/bi-calc-audit.md`): Report BI không tự tính DTQĐ; sửa AUD-021…024.
2. AUD-010 (DONE 2026-10-29): 582 → 0 nút `unstyled`. Phần tử bấm được không mang hình nút dùng kiểu vai trò `cell`/`row`/`card`/`tab`; viên bật/tắt `toggle` + aria-pressed. Khoá: `components/shared/ui/buttonVaiTro.test.ts` + ratchet. Chi tiết: audit/button-height-report.md lượt 7.
3. ~~salesFilesRegistry~~ — XONG (AUD-014): đường cũ có chủ đích (bảng tệp hiện danh sách máy khác), lỗi thật là chép ĐÈ lúc đăng nhập → đã sửa. Lượt ghi thừa mỗi lần mở app (`lanDayCuoi` khởi đầu rỗng) — XONG 2026-10-30 (AUD-033): AuthContext ghi nhận bản cloud vừa kéo về làm mốc, so không phụ thuộc thứ tự khoá.
4. ~~Hỏi chủ dự án~~ — đã chốt 2026-10-28: xoá gửi LINE từ Phân tích (AUD-013, xong), nút icon laptop 36 (AUD-012, xong).
5. WebKit: XONG 2026-10-30 — cài được trong container (`scripts/cai-webkit.sh`, hook SessionStart), đã chạy apple-tuong-thich + liquid-glass-khung + khung-app-gd4 + toast-thong-nhat trên WebKit: 14/14 qua. iPhone thật: vẫn cần thiết bị.

5. AUD-015: e2e `dang-nhap-ho-so-tinh-san` › dọn khoá Kho cũ đỏ cả trước lượt này — cần người có quyền đọc Firestore kiểm hồ sơ tài khoản test.
