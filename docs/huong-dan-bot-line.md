# Hướng dẫn sử dụng Bot LINE

Tài liệu này mô tả toàn bộ chức năng của Bot LINE trong Dashboard YCX và cách dùng từng chức năng. Dành cho nhân viên dùng bot trong nhóm LINE và quản lý cấu hình bot trên Dashboard.

Bot nhận lệnh gõ trong nhóm LINE hoặc chat riêng. Một số lệnh bắt đầu bằng `/`, `.`, `!` hoặc `#` đều được, ví dụ `/yc` và `.yc` giống nhau. Chữ hoa, chữ thường đều được.

---

## Mục lục

1. [Chuẩn bị](#1-chuẩn-bị)
2. [Lệnh chung](#2-lệnh-chung)
3. [Tồn kho và xin mã PMH](#3-tồn-kho-và-xin-mã-pmh)
4. [Lọc mã riêng (chat 1-1)](#4-lọc-mã-riêng-chat-1-1)
5. [Ảnh báo cáo](#5-ảnh-báo-cáo)
6. [Xác nhận "Đã nhận"](#6-xác-nhận-đã-nhận)
7. [Phiếu yêu cầu](#7-phiếu-yêu-cầu)
8. [Xin duyệt](#8-xin-duyệt)
9. [Ghi nhanh](#9-ghi-nhanh)
10. [Tag theo nhóm vai trò](#10-tag-theo-nhóm-vai-trò)
11. [Trên Dashboard](#11-trên-dashboard)
12. [Giới hạn và lưu ý](#12-giới-hạn-và-lưu-ý)
13. [Bảng tổng hợp lệnh](#13-bảng-tổng-hợp-lệnh)

---

## 1. Chuẩn bị

- **Thêm bot vào nhóm LINE** như thêm một thành viên bình thường. Bot vào nhóm im lặng, không gửi lời chào.
- **Lấy mã nhóm hoặc mã người dùng**: gõ `id` trong nhóm (hoặc trong chat riêng). Bot trả về Group ID hoặc LINE User ID để dán vào Dashboard khi cần.
- **Quyền dùng bot trên Dashboard** do quản lý cấp. Người không có quyền không thấy tab Bot LINE.

---

## 2. Lệnh chung

| Lệnh | Tác dụng |
|---|---|
| `id` (hoặc `lineid`, `groupid`) | Trong nhóm: hiện tên nhóm và Group ID. Trong chat riêng: hiện LINE User ID của bạn. |
| `hd` (hoặc `help`, `hướng dẫn`) | Bot gửi hướng dẫn ngắn ngay trong chat. |
| `cp` | Danh sách cú pháp đăng ký mã của tất cả sản phẩm. |
| `dsbc` | Danh sách lệnh lấy ảnh báo cáo (xem mục 5). |

---

## 3. Tồn kho và xin mã PMH

Đây là chức năng chính của bot: cho xem tồn kho mã PMH và lấy mã trực tiếp trong chat.

### 3.1. Xem tồn kho

| Lệnh | Tác dụng |
|---|---|
| `tk` | Tồn kho toàn bộ, kèm danh sách loại và cách xem riêng. |
| `tk event` hoặc `tk e` | Tồn kho PMH Event. |
| `tk gvgs` hoặc `tk gv` | Tồn kho PMH Giờ Vàng. |
| `tk [tên loại]` | Xem riêng một loại, ví dụ `tk honor`, `tk vivo`. |

### 3.2. Xin nhận mã

- Gõ `tk` để xem danh sách, rồi **chạm trực tiếp vào sản phẩm** cần lấy trên thẻ bot gửi. Bot cấp mã và gửi thẻ mã.
- Trên thẻ mã có nút **"Chạm để copy"** để mở trang sao chép mã nhanh.

### 3.3. Hủy / trả mã về kho

- Soạn `huy [mã coupon]` (hoặc `huy [mã đơn hàng]`). Mã đã hủy được trả về kho.
- Dùng khi đã xin mã nhưng không dùng đến.

### 3.4. Tra cứu trạng thái mã

- Dán **một mã coupon** vào chat. Bot báo mã đã được ai dùng và dùng lúc nào, hoặc còn chưa dùng.

---

## 4. Lọc mã riêng (chat 1-1)

Dùng khi bạn cần lấy riêng các mã đứng tên mình từ một tin nhắn gộp.

- **Chuyển tiếp** tin nhắn gộp cho bot trong chat riêng. Bot tự lọc các mã có tên bạn và gửi thẻ lọc.
- Thẻ lọc có nút copy như thẻ tồn kho.
- **`csd`**: hiện lại mọi thẻ đã lọc nhưng **chưa sử dụng** trong tháng này.
- Cú pháp nhận diện được cấu hình trên Dashboard, tab **Cú pháp & Lọc**.

> Lưu ý: chức năng lọc chỉ dùng trong chat 1-1. Trong nhóm, bot không lọc.

---

## 5. Ảnh báo cáo

Bot gửi ảnh báo cáo mới nhất ngay trong nhóm, miễn phí.

| Lệnh | Tác dụng |
|---|---|
| `bc` | Ảnh báo cáo tổng quan mới nhất. |
| `bclk` | Ảnh báo cáo lũy kế mới nhất. |
| `bcrt` | Ảnh báo cáo realtime mới nhất. |
| `dsbc` | Danh sách tất cả lệnh báo cáo đang có. |

Ngoài việc gõ lệnh, báo cáo còn được gửi tự động theo lịch quản lý đã cài trong tab **Gửi Notify** trên Dashboard. Gõ lệnh khi cần bản mới nhất ngay.

---

## 6. Xác nhận "Đã nhận"

Dùng khi cần biết ai đã đọc một thông báo quan trọng.

| Lệnh | Tác dụng |
|---|---|
| `/xacnhan <nội dung>` | Bot gửi thông báo kèm nút **✅ Đã nhận**. Thông báo có mã riêng, ví dụ `Ab12Cd3F`. |
| `/xacnhan ds <mã>` | Xem danh sách người đã bấm "Đã nhận". |

**Cách dùng:**
1. Gõ `/xacnhan Họp 8h sáng mai`.
2. Mọi người bấm nút **Đã nhận**. Mỗi người chỉ được tính một lần.
3. Người gửi gõ `/xacnhan ds <mã>` để xem ai đã nhận.

---

## 7. Phiếu yêu cầu

Dùng để giao việc và theo dõi đến khi xong.

| Lệnh | Tác dụng |
|---|---|
| `/yc <việc cần làm>` | Tạo phiếu mới, số tăng dần: YC-0001, YC-0002… |
| `/yc ds` | Xem các phiếu đang mở. |
| `/yc xong <mã>` | Đóng phiếu. Ví dụ `/yc xong 1` hoặc `/yc xong YC-0001`. |

**Cách dùng:**
1. Gõ `/yc Sửa máy lạnh kho 2`. Bot trả về phiếu có mã YC-000x và nút **✔ Hoàn tất**.
2. Khi xong, bấm **Hoàn tất** hoặc gõ `/yc xong <mã>`.
3. Gõ `/yc ds` để xem phiếu còn mở.

> Ai trong nhóm cũng đóng được phiếu.

---

## 8. Xin duyệt

Dùng cho đề nghị cần người có quyền đồng ý, ví dụ nghỉ phép hoặc đổi ca.

| Lệnh | Tác dụng |
|---|---|
| `/xinphep <nội dung>` | Gửi yêu cầu có hai nút **Duyệt** và **Từ chối**. |

**Cách dùng:**
1. Gõ `/xinphep nghỉ 1 ngày 5/11`.
2. Người có quyền duyệt bấm **Duyệt** hoặc **Từ chối**.

**Quy tắc:**
- Chỉ người được quản lý thêm vào danh sách **Admin** của bot với vai trò **Duyệt đơn** hoặc **Toàn quyền** mới duyệt được.
- Bot phải có ít nhất một người duyệt. Nếu chưa có, `/xinphep` sẽ báo chưa có người duyệt và không tạo yêu cầu.
- Không ai tự duyệt yêu cầu của chính mình.
- Mỗi yêu cầu chỉ quyết định một lần.
- Mọi lần bấm (kể cả lần bị từ chối vì không có quyền) đều được ghi nhật ký.
- Quản lý xem và duyệt được trên Dashboard, tab **Yêu cầu duyệt**.

---

## 9. Ghi nhanh

Dùng để ghi lại một việc nhanh, không cần tạo phiếu.

| Lệnh | Tác dụng |
|---|---|
| `/ghi <nội dung>` | Lưu ghi chú kèm người ghi, nhóm và thời gian. Bot trả về mã ghi chú. |
| `/ghi ds` | Xem 10 ghi chú gần nhất ngay trong chat. |

**Ví dụ:** `/ghi Hết pin máy quét` (bot trả "📝 Đã ghi nhanh (mã …)").

Ghi chú xem và xoá được trên Dashboard, tab **Ghi nhanh**.

> Ghi chú không gửi tin ra nhóm nên không ảnh hưởng hạn mức tin LINE.

---

## 10. Tag theo nhóm vai trò

Dùng để gọi cả nhóm người cùng vai trò (ví dụ ca sáng, kho, thu ngân) trong một tin.

| Lệnh | Tác dụng |
|---|---|
| `/nhom vao <tên nhóm>` | Bạn tự tham gia nhóm. Nhóm được tạo khi có người vào đầu tiên. |
| `/nhom ra <tên nhóm>` | Bạn rời nhóm. |
| `/nhom ds` | Xem tất cả nhóm và số người. |
| `/nhom ds <tên nhóm>` | Xem danh sách người trong nhóm. |
| `@<tên nhóm> <nội dung>` | Tag tất cả thành viên nhóm trong một tin, kèm nội dung. |

**Ví dụ:**
1. Mỗi người trong ca sáng gõ `/nhom vao ca-sáng` một lần.
2. Ai đó gõ `@ca-sáng họp 8h nhé`. Bot gửi một tin tag mọi người trong nhóm.

**Quy tắc:**
- Tên nhóm không phân biệt hoa thường và dấu: `@Ca Sáng`, `@ca-sang` là một nhóm.
- Chỉ tag được trong nhóm chat, không tag được trong chat riêng.
- Một tin tag tối đa 50 người.
- Nếu `@tên` không khớp nhóm nào, bot không trả lời (không ảnh hưởng các lệnh khác).

---

## 11. Trên Dashboard

Mở **Bot LINE** trong menu bên trái (trên điện thoại: thanh menu dưới). Các tab:

| Tab | Dùng để |
|---|---|
| **Coupon Event** | Quản lý mã coupon sự kiện: nhập, sửa, xem trạng thái. |
| **Coupon lọc** | Xem các mã đã lọc và trạng thái sử dụng. |
| **Gửi Notify** | Lên lịch gửi thông báo tự động vào nhóm. |
| **Chat BOT** | Thư viện từ khoá và câu trả lời tự động của bot. |
| **Admin** | Thêm người quản trị bot và chọn vai trò: *Toàn quyền*, *Duyệt đơn*, *Chỉ xem báo cáo*. |
| **Yêu cầu duyệt** | Xem và duyệt/từ chối yêu cầu `/xinphep`, kèm nhật ký từng lần tác động. |
| **Ghi nhanh** | Xem, tìm và xoá các ghi chú `/ghi`. |
| **Cấu hình nhóm** | Bật/tắt từng tính năng theo nhóm LINE. |
| **Cú pháp & Lọc** | Cấu hình cú pháp nhận diện mã và lọc. |
| **Cấu hình Bot** | Thông tin kết nối bot với LINE. Token và Secret được lưu an toàn ở máy chủ, không hiển thị lại trên giao diện. |

> Một số thao tác trên Dashboard (duyệt, xoá, sửa) cần đúng quyền. Người không có quyền sẽ nhận thông báo từ chối.

---

## 12. Giới hạn và lưu ý

- **Hạn mức tin LINE**: tin gửi theo lịch (Gửi Notify, báo cáo tự động) và tin broadcast được tính vào hạn mức tin LINE. Các lệnh làm việc (`/xacnhan`, `/yc`, `/xinphep`, `/ghi`, `/nhom`) chỉ trả lời trực tiếp bằng thẻ phản hồi của lệnh nên không tốn hạn mức tin push.
- **Mention và tag**: LINE chỉ tag được người đang ở trong nhóm chat.
- **Cấu hình nhóm**: tab "Cấu hình nhóm" bật/tắt theo từng nhóm các tính năng: lọc coupon, xin mã, tra tồn kho (`tk`), huỷ mã, tra cứu mã, trả lời theo từ khoá, tự động trả lời, và chuyển tiếp PMH. Các lệnh làm việc mới (`/xacnhan`, `/yc`, `/xinphep`, `/ghi`, `/nhom`) **chưa** bị tắt theo nhóm.
- **Dữ liệu**: ghi chú, phiếu, yêu cầu duyệt và nhóm vai trò được lưu trên hệ thống. Không lưu ở máy cá nhân.
- **Tài khoản đăng nhập Dashboard**: đăng xuất khi dùng máy chung.

**Khi bot không trả lời:**
1. Kiểm tra bot còn trong nhóm không (gõ `id` thử).
2. Kiểm tra lệnh đúng cú pháp (xem mục 13).
3. Nếu lệnh đúng mà vẫn không có phản hồi, báo quản lý kiểm tra cấu hình bot trên Dashboard.

---

## 13. Bảng tổng hợp lệnh

| Nhóm | Lệnh | Mục |
|---|---|---|
| Chung | `id`, `hd`, `cp`, `dsbc` | 2 |
| Tồn kho | `tk`, `tk event`, `tk gvgs`, `tk [loại]` | 3.1 |
| Xin mã | chạm sản phẩm trong thẻ `tk` | 3.2 |
| Hủy mã | `huy [mã]` | 3.3 |
| Tra mã | dán mã coupon vào chat | 3.4 |
| Lọc riêng | chuyển tiếp tin gộp (chat 1-1), `csd` | 4 |
| Báo cáo | `bc`, `bclk`, `bcrt`, `dsbc` | 5 |
| Đã nhận | `/xacnhan <nội dung>`, `/xacnhan ds <mã>` | 6 |
| Phiếu | `/yc <việc>`, `/yc ds`, `/yc xong <mã>` | 7 |
| Xin duyệt | `/xinphep <nội dung>` | 8 |
| Ghi nhanh | `/ghi <nội dung>`, `/ghi ds` | 9 |
| Tag nhóm | `/nhom vao|ra|ds [tên]`, `@<tên nhóm> <nội dung>` | 10 |

---

*Tài liệu cập nhật theo các chức năng đã triển khai đến ngày 2026-11-04.*
