# Chiều cao nút thật vs token — việc 3 (2026-10-28)

## Phát hiện (AUD-008, P3)
`styles/tokens.css` khai `--btn-height-sm/md/lg` = **32 / 40 / 48 px**, nhưng KHÔNG nơi nào đọc các token này. `Button.tsx` vẽ cứng
`h-8 / h-9 / h-11` = **32 / 36 / 44 px**. Token "nói dối" 2/3 cỡ — ai thiết kế theo token sẽ lệch 4px so với app.

## Sửa tại gốc
- Token mang đúng số đang chạy: sm 32 · md 36 · lg 44 · icon 32 (giao diện KHÔNG đổi).
- `Button.tsx` đọc token: `h-[var(--btn-height-*)]` (+ `w-[var(--btn-height-icon)]` cho nút icon). Đổi 1 token = đổi mọi nút.
  `className="h-8"` vẫn đè được (đã kiểm tailwind-merge xếp cùng nhóm `h-*`).
- Vùng chạm điện thoại/cảm ứng giữ `min-h-11` (44).

## Đo thật — `tests/e2e/chieu-cao-nut.spec.ts` (Chromium, Chế độ Dùng Thử, 7 tab: Phân tích, Report BI, Check thưởng, Thuế, Bot LINE, Coupon, Giới thiệu)
| Môi trường | Nút chuẩn đang hiện | Phân bố (cỡ: px × số nút) | Kết luận |
|---|---:|---|---|
| Laptop 1366, chuột | 25 | sm: 32×13 · md: 36×3 · icon: 32×2 · "⋯" ActionMenu: 36×2 · có đè chiều cao: 18/18,5/30/30/32 | 100% nút không đè = đúng token |
| iPhone 390, cảm ứng | 22 | sm: 44×10 · md: 44×3 · icon: 32×2 · "⋯": 44×2, 32×2 (thanh trên — ép 32 nhìn thấy, vùng chạm 44 bằng ::after) · đè: 20/18,5/44 | sm/md/lg ≥ 44 |

"⋯" (`ActionMenu`) cao 36 trên laptop là CHỦ Ý (`lg:min-h-9`) — khớp quy chuẩn "nút thao tác header thẻ/bảng: laptop 36px". Nút icon
chuẩn là 32 → trong cùng một hàng có thể thấy 32 cạnh 36 (vd Bot LINE › Kho mã: nút Làm mới 32 + "⋯" 36). Ghi nhận P4 — cần chủ dự án
chọn một số cho nút icon laptop (32 hay 36) rồi đổi `--btn-height-icon`.

## Nợ thật: nút tự vẽ
| Chỉ số | Số |
|---|---:|
| `<Button>` trong tsx | 1.033 |
| `variant="unstyled"` (tự vẽ toàn bộ) | **582 (56%)** — bi-dashboard 148, line-bot 72, components/employees 62, shared 47, layout 40… |
| `size="none"` | 614 |

Lint-ratchet có chỉ số `unstyledButton` (mốc 582) — chỉ được giảm. Chuyển dần theo module khi đọc sâu (remaining-work).

## Cập nhật 2026-10-28 — chủ dự án chốt nút icon laptop 36px
`--btn-height-icon` = 32 (iPhone/iPad) / 36 (≥ 1024px). 32 `<Button>` icon tự vẽ cứng `h-8 w-8` ở 9 khu vực → 22 đọc thẳng token, 10 nút cỡ theo màn (`h-7 sm:h-8`) thêm mốc `lg:` đọc token (+2 ExportButton cùng hàng ở Thi đua). Khoá: `components/shared/ui/nutIconTheoToken.test.ts` (AST). Đo: Bot LINE › Kho mã — "Làm mới" 36 = "⋯" 36.

## Chuyển nút tự vẽ → kiểu chuẩn, lượt 1 (2026-10-28)
Phân loại AST 582 nút `unstyled`: icon vuông 104 · giống primary 30 · liên kết 33 · mục danh sách 26 · chip 5 · khác 381.
Chuyển **59 nút icon vuông** sang `variant="ghost" size="icon"` — CHỈ nút có class tĩnh tự đặt màu chữ + nền khi rê (nên mọi lớp
của ghost bị className đè, giao diện giữ). So lớp CSS cuối (qua `cn()` thật) trước/sau cho cả 59 nút: chỉ thêm lớp không đổi
hình (font/whitespace trên nút chỉ icon, nền trong suốt/đệm 0 vốn là preflight, viền 1px trong suốt, `active:opacity-80`,
`ycx-hit`) + 11 nút trước tự lấy cỡ từ đệm nay theo token (laptop 36 — khớp quyết định chủ dự án; điện thoại vẫn 44). Nút đóng
toast hoàn lại unstyled (phóng 36 phá bố cục viên toast). Ratchet `unstyledButton` 582 → 524. E2E 33 bài xanh.
Còn: 45 nút icon (class có biểu thức / thiếu màu), 30 giống primary, 33 liên kết — cần xem từng nút; 381 nút "khác" (mục
danh sách, ô bảng, tab tự vẽ…) phần lớn tự vẽ có chủ đích.

### Lượt 2 (2026-10-28)
- 8 nút giống primary (nền sky-600, class tĩnh tự đặt text-white + nền khi rê, NGOÀI Report BI vì chế độ mật độ gọn bỏ qua nút
  chuẩn) → `variant="primary"`. Khác biệt lớp CSS cuối: viền 1px trong suốt (như mọi nút primary chuẩn), `whitespace-nowrap`
  (chữ trên các nút này ngắn), `active:opacity-80`. Ratchet 524 → 516.
- Thử 20 nút liên kết → `inline-link`: HOÀN LẠI — biến thể thêm `hover:text-sky-700` cho link màu khác (đỏ trong Banner cảnh báo),
  viền 1px làm link trong dòng chữ nhích 2px, và 3 nút thuộc LoginView (màn được bảo vệ hợp đồng hành vi). Cần biến thể
  liên kết không viền/không ép màu nếu muốn chuyển nhóm này.

### Lượt 3 (2026-10-28) — ratchet 516 → 448
- Biến thể mới `link` (không viền, không ép màu, không ép bố cục) → 30 nút liên kết. 3 liên kết của LoginView GIỮ NGUYÊN (màn được
  bảo vệ hợp đồng hành vi).
- Biến thể mới `toolbar` (chuẩn "Card Header Action Buttons": BẬT bằng `aria-pressed`) → 32 nút icon bật/tắt. Đo màu tính toán
  thật: `tests/e2e/nut-toolbar-chuan.spec.ts`.
- 6 nút hành động chính → `primary`; 3 nút "Hủy Bỏ" → `secondary`; 3 nút tab của 2 hộp thoại cấu hình → `<Tabs variant="underline">`.
- **Sửa nhầm nhãn ở lượt trước:** "22 nút giống primary trong Report BI" thật ra là 6 nút hành động chính + 16 nút bật/tắt (đã vào
  nhóm `toolbar`/segment), không phải 22 nút primary.

### Lượt 4 (2026-10-28) — ratchet 448 → 409
Nhóm "chọn một trong N" tự vẽ (khung xám + viên trắng) → `<Tabs variant="segment">` dùng chung: 12 nhóm, 31 nút —
cấu hình cột (Đơn vị đo, Hiển thị, Số lẻ ×3 form), 7 Ngày (Cách tính tổng), Tải tệp (Realtime/Luỹ kế), Thi đua (%HT/Thực hiện),
Coupon (Tất cả/Chưa dùng/Đã dùng), In Sticker (Giá giảm/Giá dịch vụ), Mã sản phẩm (Loại hệ số), KPI ngành (Nhóm/Ngành),
Ảnh đại diện (Icon/Tải ảnh), Nạp PMH (Dán mã/Lịch sử). Lợi ích: trình đọc màn hình đọc được mục đang chọn (`aria-pressed`),
viên trắng trượt, vùng chạm 44px trên điện thoại. Thay đổi nhìn thấy (có chủ đích, theo chuẩn): chữ mục đang chọn slate-900 thay
cho sky/emerald tự chọn; icon trong mục không còn tô màu riêng. Lề/độ rộng khung cũ giữ qua `className`/`fullWidth`.
Kiểm: `tests/e2e/tab-hop-thoai-cau-hinh.spec.ts` (bấm → đúng 1 mục chọn, viên trắng khớp nút < 2px), 18 bài e2e liên quan xanh,
ảnh thật 2 hộp thoại (Ảnh đại diện, Nạp PMH).

### Còn lại 409 — GIỮ có chủ đích (không chuyển máy móc)
- Nhóm chọn GIỮ: thanh Tra cứu/Top thưởng (Check thưởng — chữ co theo bề ngang + nền vàng gradient, chủ dự án chốt "1 thanh bar");
  thẻ lọc KPI Coupon (thẻ số, không phải tab); thẻ chọn vai trò (Duyệt truy cập).
- ~~Chip lọc LINE/avatar~~ → ĐÃ CHUYỂN (xem Lượt 5).
- ~20 nút icon có class biểu thức (màu theo trạng thái dữ liệu), mục danh sách (26), ô bảng/đầu cột sắp xếp, ô lịch, thẻ chọn
  ảnh: phần tử tự vẽ đúng vai trò — chuẩn `Button` không có kiểu tương ứng; giữ `unstyled` (vẫn qua `Button`, vẫn bị ratchet chặn tăng).

### Lượt 5 (2026-10-28) — chủ dự án chốt "Chuyển" chip lọc — ratchet 409 → 396
3 nhóm chip lọc (13 nút) → `<Tabs variant="chips">`: Chọn người dùng Bot để lọc PMH (5), Chọn người dùng làm Admin (4),
danh mục avatar Report BI (4). Chip đang chọn nay slate-900 chữ trắng (trước emerald-600 / sky-600 / sky-100); số đếm thành
huy hiệu chuẩn bên phải chữ ("Tất cả 3" thay "Tất cả (3)"); trình đọc màn hình đọc được chip đang chọn.
Kiểm: `tests/e2e/chip-loc-chuan.spec.ts` (render thật 3 hộp thoại với dữ liệu mẫu: số đếm đúng, bấm → đúng chip chọn, màu
tính toán slate-900/trắng); harness `tests/e2e/helpers/modalSizeHarness.tsx` thêm 3 hộp thoại này.

### Lượt 6 (2026-10-29) — chủ dự án "làm" — cỡ xs/icon-xs, ratchet 396 → 268
- **Cỡ mới** `xs` (chữ 11px) và `icon-xs` (icon) — nhìn thấy 24px (token `--btn-height-xs` / `--btn-height-icon-xs`), vùng chạm 44 vô hình
  bằng `ycx-hit` trên màn hẹp/cảm ứng. Dành cho nút trong dòng dữ liệu / đầu thẻ dày đặc để dòng 26px không phình.
- **128 chỗ `variant="unstyled"` chuyển** (đếm `git grep` trước/sau: Report BI 33, khung app + Phân tích + hộp thoại 57, Bot LINE 14,
  In Sticker 9, Phân Ca 5, Khai thác 4, Check thưởng 3, Thuế 2, Cấu hình SP 1 — nhóm `.map()` thành Tabs tính là 1 chỗ): công cụ đề xuất (AST) ánh xạ màu → biến thể (nền sky đặc → primary,
  emerald → success, rose → danger, nền nhạt → tinted/destructive/secondary, chữ màu không nền → link, còn lại → ghost), cỡ theo
  chiều cao thật (≤ 26 → xs/icon-xs, ≤ 33 → sm/icon, ≤ 40 → md, lớn hơn → lg), bỏ lớp mà biến thể/cỡ đã lo; giữ màu riêng, lề, vị trí,
  hình viên `rounded-full`. Cụm nút liền khối (viền một cạnh) thêm `border-0`/`rounded-none` để không hiện viền 4 cạnh. Chuyển tay:
  9 nút icon đầu thẻ → `toolbar` (bật = aria-pressed); nhóm năm, khoảng thưởng, phân loại HTX → Tabs segment; cặp so sánh nhanh → Tabs chips.
- **Thay đổi nhìn thấy:** bo góc 4/6px → 8px (chuẩn nút); nút icon nhỏ 20–28px → 24px; vài nút mất bóng đổ nhẹ; nút "Đã hiểu & Đóng"
  (hướng dẫn tự động) đen → xanh primary; nút "Sao chép link cài đặt" tím indigo → xanh primary.
- **Kiểm:** `npm run check`; 115 bài e2e Chromium (Report BI, Bot LINE, Coupon, In Sticker, Phân Ca, Thuế, Check thưởng, khung app, quét bố
  cục 6 khung màn hình, chiều cao nút, audit icon). `chieu-cao-nut` nay đo cả xs/icon-xs và dùng `offsetHeight` (nút trong menu nổi
  đang ẩn `scale-95` bị đo 30,4px). `bi-auto-sync-xong-dong-modal` đỏ 1/10 lần ở CẢ bản trước khi sửa — chập chờn sẵn (chờ toast 2 s).

### Còn lại 268 — vì sao giữ (đo bằng công cụ, 2026-10-29)
| Nhóm | Số | Lý do |
|---|---|---|
| Bên trong thành phần chung (Tabs, Switch, Modal…) | 23 | Chính là phần dựng nên kiểu chuẩn |
| Ô bảng, đầu cột sắp xếp | 33 | Nút chuẩn có viền/đệm → dòng 26px phình |
| Thẻ chọn, nội dung khối (div/ảnh trong nút), mục rộng hết, mục danh sách | 84 | Là thẻ/dòng, không phải nút |
| Icon nằm trong dòng chữ (< 20px: ×, chevron cây, ✓) | 27 | Nhỏ hơn cả cỡ xs — dùng xs là phình dòng |
| Nút trạng thái tô màu theo dữ liệu/ngữ nghĩa (vàng "Còn lại", xanh lá "đã bật", màu theo loại cột…) | ~36 | Màu là dữ liệu |
| Cỡ theo màn (sm:/lg:), class biểu thức, nền gradient, thanh tab riêng | ~36 | Cần thiết kế lại từng màn, không đổi máy móc |

### Lượt 7 (2026-10-29) — chủ dự án "xử lý hết" — 268 → 0
Thêm kiểu nút theo VAI TRÒ (không ép cỡ/đệm, không gắn `data-ui="shared"` nên chế độ mật độ gọn Report BI vẫn co nội dung):
`cell` (ô bảng, đầu cột sắp xếp, mục thanh tab dưới In Sticker), `row` (dòng danh sách/menu, rộng hết, căn trái), `card` (thẻ chọn,
thẻ KPI lọc, ô màu/icon chọn, ô kéo thả tệp; đang chọn có vòng sáng theo `aria-pressed`), `tab` (dải tab tự dựng có chỉ báo riêng),
cùng `toggle` (viên bật/tắt có chữ — TẮT theo chuẩn trắng viền xám, BẬT theo `aria-pressed` với màu theo nghĩa `aria-pressed:*`),
`warning` (amber đặc) và cỡ `icon-inline` (icon trong dòng chữ, không viền, vùng chạm 44).

| Kiểu | Số chỗ | Gồm |
|---|---|---|
| `ghost` (icon-inline / xs–lg / none) | 73 | 54 icon sửa/xoá/×/chevron trong dòng; nút chữ không nền; nút điều hướng thanh trên nhận lớp từ nơi gọi |
| `tab` | 36 | dải tab tự dựng (Thi đua, Phân tích, Check thưởng, In Sticker…), mục `<Tabs>`/`CapsuleBar`/`TopBarActions`, khung giả lập LINE |
| `row` | 29 | dòng dock Auto Sync, menu ⋯, mục chọn phông, chọn nhiều, ListRow, sheet "Khác" |
| `card` | 28 | thẻ lọc KPI Coupon, thẻ vai trò, thẻ phân loại HTX, ô kéo thả, ô màu/icon chọn, ô chọn dạng in, nút mở dock |
| `toggle` | 23 | "Đang bật/tắt" xuất tự động, so sánh tuần/tháng, ngày trong tuần, "Còn lại"/"Realtime"/"Cùng kỳ", lọc Highlight… |
| `cell` | 20 | đầu cột sắp xếp Thi đua nhóm, tên NV/siêu thị bấm được trong bảng, chấm bước hướng dẫn, công tắc `Switch`, icon trong ô nhập |
| `secondary` / `tinted` / `link` | 20 / 13 / 13 | Huỷ, Trước/Sau, Sao chép…; liên kết trạng thái đồng bộ, liên kết màn đăng nhập (chỉ đổi kiểu, giữ lớp) |
| `warning` / `primary` / `danger` / `success` / `destructive` / `toolbar` | 4 / 2+2 / 2 / 1 / 1 / 1 | nút amber, "Dán phiếu" Thuế (primary khi chưa dán, secondary khi đã dán)… |

**Thay đổi nhìn thấy (theo chuẩn):** viên bật/tắt TẮT nay trắng viền xám ở mọi nơi (trước: xám nhạt, xanh nhạt, viền khác nhau tuỳ màn);
icon trong dòng có nền xám nhạt khi rê chuột; "Hướng dẫn"/"Đồng bộ" dạng liên kết gạch chân khi rê; nút Google ở màn đăng nhập giữ trắng.
**Kiểm:** `npm run check`; `components/shared/ui/buttonVaiTro.test.ts` (6 test: vai trò không ép cỡ/không data-ui, toggle theo aria-pressed,
icon-inline không viền, token xs, **0 chỗ `unstyled` toàn app**); e2e — xem báo cáo phiên.
