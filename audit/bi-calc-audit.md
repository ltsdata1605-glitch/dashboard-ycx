# Đối chiếu tính toán Report BI ↔ nguồn chân lý (2026-10-29)

## Kết luận chính
- **Report BI KHÔNG tự tính DTQĐ / số lượng quy đổi từ dòng dữ liệu thô.** Mọi DT, DTQĐ, số thưởng đều ĐỌC từ báo cáo MWG đã tính sẵn
  (dán vào ô hoặc lấy qua cầu nối userscript). Dò toàn bộ `features/bi-dashboard` (heSo, getHeSoQuyDoi, ×0,3 trả chậm, revenueQD,
  weightedQuantity): 0 chỗ tự quy đổi → không có chỗ nào phải chuyển về `utils/dataUtils.ts → calculateRowMetrics()`.
- Phần Report BI TỰ tính trên số đó đã soát: hiệu quả quy đổi (DTQĐ/DT − 1 — mọi nơi tính trên TỔNG, đúng), dự kiến cuối tháng
  (DT ÷ số ngày đã qua × số ngày tháng — sau sửa AUD-022 mọi chỗ lấy số ngày qua `getMonthProgress`), còn lại/ngày (giống nhau 2 nơi),
  thưởng thi đua siêu thị (`checkThuongBonus.ts` — khớp luật Check thưởng), % trả chậm, mục tiêu mặc định.

## Lỗi tìm thấy và đã sửa
| Mã | Mức | Lỗi | Sửa |
|---|---|---|---|
| AUD-021 | P2 | Check thưởng: nhóm không quỹ vẫn hiện "~thưởng dự kiến" khi ô thừa dấu cách | `khoaNhomThuong()` dùng chung |
| AUD-022 | P2 | So sánh 2 nhân viên: ngày mùng 1 mọi nhóm "không doanh số" | dùng `getMonthProgress()` |
| AUD-023 | P2 | % trả chậm dòng tổng tab Doanh thu = trung bình cộng, lệch tab Trả chậm | có trọng số theo DT siêu thị |
| AUD-024 | P4 | Mục tiêu mặc định 40/45 ở 4 chỗ (chuẩn 60/60) | hằng chung |

## Còn lại
- ~~% Bill BK~~ — XONG (AUD-025): không màn nào hiển thị, bảng bill thật đã đọc dòng tổng của MWG; gỡ phần cộng trung bình.
- ~~Thi đua theo đồng hồ~~ — XONG (AUD-026): 3 màn thi đua dùng ngày của dữ liệu (`useNgayDuLieu`).

### Đã ghi trước khi chủ dự án xác nhận
- `%Bill BK` dòng tổng tab Doanh thu cũng là trung bình cộng % từng người. Không có mẫu số (số bill) trong dữ liệu đang giữ nên chưa
  tính được có trọng số; nếu báo cáo MWG có dòng tổng thì nên đọc thẳng dòng đó.
- Mục tiêu theo ngày cho số realtime: `useDashboardLogic` chỗ chia theo số ngày THÁNG HIỆN TẠI, chỗ theo `getMonthProgress` (ngày mùng 1
  = tháng trước). Chỉ lệch đúng ngày mùng 1 khi hai tháng khác số ngày.
- Thi đua Tổng hợp / So sánh gọi `getMonthProgress()` KHÔNG kèm ngày của dữ liệu (theo đồng hồ), khác tab Doanh thu (theo ngày
  nhận ra trong báo cáo). Chỉ lệch khi xem dữ liệu tháng cũ; dữ liệu thi đua chưa mang ngày nên chưa nối được.
- Trang `public/check-thuong.html` (bản cũ, đã thôi dùng trong app) có cùng lỗi khoá "có quỹ" — không sửa vì không còn được mở.
