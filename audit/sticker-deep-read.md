# In Sticker — đọc hết printService (1.606 dòng) + useStickerPrinterData (1.762 dòng) — 2026-10-29

## Đã sửa
| Mã | Lỗi | Sửa |
|---|---|---|
| AUD-027 (P2) | Tem kiểu "modern" luôn in tên NV + số thưởng dù tắt "Hiện tên NV"/"Hiện thưởng" | đọc 2 công tắc như kiểu mặc định; test |
| AUD-028 (P3) | In máy tính: `fonts.ready` gọi trước khi tệp CSS phông tải → lần in đầu dùng phông dự phòng | chờ tệp CSS (≤5 s), ép bố trí, rồi fonts.ready |
| AUD-029 (P3) | Phiếu rút thăm: đặt 4 phiếu → lần mở sau thành 4000 (bước nâng cấp chạy mãi) | dấu `drawTotalTicketsV`; chỉ nâng cấp dữ liệu cũ |
| AUD-030 (P3) | Lưu danh sách lỗi cloud vẫn báo "thành công" | cảnh báo "chỉ lưu trên máy này" |

## Đọc kỹ, KHÔNG sửa (đúng hoặc cần thiết bị/chủ dự án)
- Tem: chữ từ Excel đều qua `escapeProductText` trước khi chèn HTML (S12) — đúng. QR tạo offline. Nhánh điện thoại dựng trong iframe
  cách ly, dọn iframe trong `finally`, chờ ảnh tối đa 8 s — đúng.
- **Rủi ro chưa kiểm được (cần iPhone thật):** `handlePrint` gọi `window.print()` rồi NGAY LẬP TỨC hiện lại app và gỡ phần in. Trên
  Chrome máy tính `print()` chặn tới khi đóng hộp in nên đúng; trên Safari iPhone `print()` có thể không chặn → có nguy cơ in ra trang
  app thay vì tem. Hướng sửa nếu gặp: dọn trong sự kiện `afterprint`.
- Mỗi lần tải lại, giá ≥ 100.000 (đơn vị nghìn) bị chia 1.000 — bước nâng cấp dữ liệu cũ (giá lưu theo đồng). Chạy mãi nhưng vô hại
  (không có tem giá ≥ 100 tỷ đồng).
- Lưu trạng thái ghi cả mảng phiếu rút thăm (mặc định 4.000 phiếu) mỗi lần sửa (chờ 500 ms) — tốn chỗ nhưng đúng; dựng lại được từ
  phiếu đầu + số bắt đầu nên về sau có thể bỏ khỏi bản lưu.
- Mở "DS đã lưu" đọc Firestore mỗi lần mở (danh sách lớn đã tách chunk, đọc chunk khi cần — quota fix 2026-09-17); danh sách bị xoá ở
  máy khác vẫn còn trong bộ nhớ máy này (gộp chỉ thêm, không bớt).
