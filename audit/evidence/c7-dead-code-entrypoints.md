# C7 — entry points không có incoming import

Đây là evidence phân loại, không phải deep review/production verification.

- `index.html:153` (entry module; #root tại150): `<script type="module" src="./index.tsx">` và `#root`; package.json dev/build dùng Vite. Root HTML bootstrap là entry point, không cần module khác import. INTENTIONALLY_RETAINED; không xóa. Chỉ kiểm đoạn entry, không nâng full review.
- `auth-hosting/pwa-login.html`: firebase.json hosting.public=`auth-hosting`; services/firebase.ts:167 định nghĩa PWA_LOGIN_URL, :278 tạo URL từ constant; functions/src/pwaHandoff.ts:17 mô tả contract. INTENTIONALLY_RETAINED. Chưa chạy đăng nhập Google/physical iPhone, không sửa auth. Chỉ đọc cấu trúc/đoạn liên quan, không full review HTML.
- `public/userscript-probe.html`: đọc đủ52 dòng, script bridge ping/pong/postMessage. userscriptProbeService.ts:42 tạo iframe URL `/userscript-probe.html?t=...`; useBiAutoSync.tsx:16/99 và DataUpdater.tsx:33/593 import/gọi startUserscriptUpdateWatcher. Đọc đủ170 dòng service; consumer chỉ xem callsites. INTENTIONALLY_RETAINED, runtime Tampermonkey chưa kiểm chứng.

`public/check-thuong.html` rất lớn, output đọc bị cắt; chỉ có references/comment cũ, không đủ xác nhận runtime hiện tại. `public/liff-copy.html` cần external LIFF registration/deep link evidence; comments không đủ. Hai candidate giữ UNKNOWN, không đánh dấu reviewed YES.

Phát hiện cần kiểm riêng: userscriptProbeService onMessage chấp nhận version từ mọi message không kiểm e.origin/e.source; iframe cũng không kiểm nguồn ping và gửi parent bằng targetOrigin='*'. Ghi CORR-011 OPEN (static finding), chưa tuyên bố khai thác được hoặc sửa protocol. Không chạy trang LIFF có thao tác mark-used và không gọi dịch vụ thật.
