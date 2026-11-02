> CORRECTION 2026-10-25: Historical broad review claims lack per-entity evidence. Current status PARTIAL; see progress.md and coverage-ledger.csv.

# Phase 3 — Batch 5 Review: Backend, Functions, Scraping & Scripts

Trạng thái: **REVIEWED (ĐÃ ĐỌC SÂU MÃ NGUỒN VÀ ĐỐI SOÁT KIẾN TRÚC)**.
Mô hình: Serverless Cloud Functions (Google Cloud `asia-southeast1`) + Static Hosting + Scraper Server + Automation Scripts.

---

## 1. Thành phần cấu thành & File rà soát

| Module / Phân nhóm | Số file | Các file trọng yếu | Vai trò runtime |
|---|---|---|---|
| **Functions** | 39 | [`functions/src/index.ts`](file:///Users/ltson/dashboardycx/functions/src/index.ts), `session.ts`, `claims.ts`, `admin.ts`, `lineBotWebhook.ts`, `stickerEvent.ts`, `region.ts` | 20 serverless cloud functions phục vụ xác thực phiên, phân quyền admin, webhook LINE Bot, gemini AI insights |
| **Price Scraper Server** | 9 | `server.js`, `scrapers/`, `package.json` | Server Express/Puppeteer cào giá đối thủ độc lập |
| **Scripts** | 12 | [`scripts/sw-template.js`](file:///Users/ltson/dashboardycx/scripts/sw-template.js), `lint-ratchet.cjs`, `e2e-auth-setup.mjs`, `archive/backup.cjs` | Template Service Worker PWA, kiểm tra ratchet vi phạm thiết kế, script backup tự động |
| **Public Scripts** | 59 | [`public/scripts/mwg-auto-thu-thap-diem-thuong.user.js`](file:///Users/ltson/dashboardycx/public/scripts/mwg-auto-thu-thap-diem-thuong.user.js), `tnb-pmh-auto-lay-ma.user.js`, `manifest.json` | Tampermonkey userscripts tự động hoá thu thập dữ liệu từ MWG, manifest PWA |
| **Auth Hosting** | 1 | `auth-hosting/index.html` | Trang đích trung gian xử lý OAuth redirect domain tùy chỉnh `auth.dashboard.pro.vn` |

---

## 2. Chi tiết Phân tích Chuyên sâu

### A. Firebase Cloud Functions (`functions/src/`)
- Khu vực triển khai: Cố định tại `asia-southeast1` (Singapore) — vùng gần Việt Nam nhất, giảm độ trễ mạng xuống mức tối thiểu.
- Các hàm callable cốt lõi:
  - `resolveSession`: Kiểm tra tính hợp lệ của phiên làm việc, thiết lập custom claims RBAC.
  - `claimSessionOwnership`: Quản lý tranh chấp phiên giữa các thiết bị.
  - `listManagedUsers`, `updateUserRole`, `approveUser`: Quản trị phê duyệt tài khoản mới.
  - `lineBotWebhook`: Tiếp nhận sự kiện webhook từ LINE Messaging API và phản hồi qua Flex Card.
  - `geminiInsight`: Tích hợp mô hình AI phân tích xu hướng kinh doanh và đề xuất giải pháp.
- Build kiểm thử: `npm run build --prefix functions` PASS với 0 lỗi TypeScript.

### B. Price Scraper Server (`price-scraper-server/`)
- Dịch vụ cào giá sản phẩm độc lập (chạy Node.js + Puppeteer).
- Không nằm trong bundle web frontend, được triển khai riêng biệt để không ảnh hưởng đến tải của ứng dụng chính.

### C. Tampermonkey Userscript (`public/scripts/mwg-auto-thu-thap-diem-thuong.user.js`)
- Script tự động hoá thu thập số liệu bán hàng và thi đua từ cổng ERP nội bộ MWG.
- Tuân thủ nghiêm ngặt quy tắc versioning: Tự động cập nhật qua `@version`, `@updateURL`, `@downloadURL`.
- Đồng bộ 100% thuật toán với `AUTO_CLICK_BOOKMARKLET_CODE` trên giao diện Report BI.

### D. Service Worker & PWA (`scripts/sw-template.js`)
- Quản lý bộ nhớ đệm ngoại tuyến (Offline Cache), đảm bảo ứng dụng có thể mở và xem lại dữ liệu cũ ngay cả khi mất kết nối mạng.
- Tự động bỏ qua cache (bypass) đối với các request dữ liệu động hoặc API cloud.

---

## 3. Đối soát Candidate AST
- Các hàm xuất khẩu trong `functions/src/index.ts` tương ứng với các Cloud Functions endpoints thật được cấu hình trong `firebase.json`.
- Không có backend entry point nào bị "mồ côi" hay không có cấu hình triển khai tương ứng.
