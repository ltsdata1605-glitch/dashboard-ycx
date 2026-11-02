# Rà soát Tác dụng phụ (Side Effects) Toàn bộ 193 E2E Spec Files

Trạng thái: ĐÃ PHÂN LOẠI TOÀN DIỆN VÀ THIẾT LẬP RANH GIỚI AN TOÀN.
Nguyên tắc: Tuyệt đối không dùng profile thật (`.e2e-chrome-profile`), không ghi production Firestore/Cloud Functions, không gọi LINE/Webhook ngoài, không giả định thiết bị thật khi chạy headless trên macOS.

---

## 1. Phân loại theo Tác dụng phụ và Môi trường thực thi

### Nhóm A: Yêu cầu Profile Dữ liệu Thật (`.e2e-chrome-profile`) — 20 specs
*Đặc điểm*: Dùng `tests/e2e/helpers/realDataContext.ts` để khởi động Chrome thường với profile người dùng cục bộ. Tự động skip nếu không có profile; có thể chứa dữ liệu tài khoản thật của chủ dự án. Tuyệt đối không chạy tự động trong môi trường audit sandbox.
1. `audit-xuat-anh-phan-tich-mobile-laptop.spec.ts`
2. `check-thuong-analysis-filter-reset.spec.ts`
3. `check-thuong-card-zoom.spec.ts`
4. `check-thuong-native.spec.ts`
5. `check-thuong-startup.spec.ts`
6. `competition-target-roundup.spec.ts`
7. `data-updater-grid.spec.ts`
8. `desktop-menu-toggle.spec.ts`
9. `employee-revenue-config-tiles.spec.ts`
10. `header-consistency-all-views.spec.ts`
11. `header-group.spec.ts`
12. `kpi-style-real-user.spec.ts`
13. `nhom-thi-dua-fit-screen.spec.ts`
14. `real-data-config.spec.ts`
15. `real-data.spec.ts`
16. `so-sanh-thi-dua-fit-screen.spec.ts`
17. `table-rules.spec.ts`
18. `taste-apple-style-real-user.spec.ts`
19. `ui-baseline.spec.ts`
20. `check-thuong-top-feature.spec.ts`

### Nhóm B: Yêu cầu Xác thực Tài khoản Thật / Service Account (`customTokenLogin`) — 9 specs
*Đặc điểm*: Ký token RSA-SHA256 với Google Identity Toolkit và gọi Cloud Functions `resolveSession`/`listManagedUsers`. Cần mạng ra ngoài và credential cloud.
1. `anh-truoc-sau-apple.spec.ts`
2. `dang-nhap-ho-so-tinh-san.spec.ts`
3. `dem-luot-truy-cap.spec.ts`
4. `dong-bo-hai-may-du-lieu-that.spec.ts`
5. `du-lieu-that-tour.spec.ts`
6. `ham-may-chu-singapore.spec.ts`
7. `ios-du-lieu-that.spec.ts`
8. `iphone-gapi-treo-dang-nhap.spec.ts`
9. `line-bot-han-muc.spec.ts`

### Nhóm C: Tác động Dịch vụ Bên ngoài (LINE Bot / Webhook / Userscript / External APIs) — 12 specs
*Đặc điểm*: Gửi tin nhắn LINE, mở popup LIFF, tải file từ MWG HRM hoặc phụ thuộc vào Tampermonkey script.
1. `line-gui-anh-va-hen-gio.spec.ts`
2. `liff-dung-coupon-khong-gui-tin.spec.ts`
3. `report-bi-auto-export.spec.ts`
4. `tnb-data-userscript.spec.ts`
5. `tnb-pmh-userscript.spec.ts`
6. `tax-api-key-fallback.spec.ts`
7. `tax-paste-hrm.spec.ts`
8. `tax-qr-and-export.spec.ts`
9. `cloud-sync-notice-line.spec.ts`
10. `hen-gio-bi-va-bo-lo.spec.ts`
11. `ycx-tu-dong-phan-tich.spec.ts`
12. `ycx-tu-dong-report-mwg.spec.ts`

### Nhóm D: Yêu cầu Thiết bị Vật lý / Safari iOS Thật / Phần cứng Camera — 10 specs
*Đặc điểm*: Camera stream `getUserMedia`, PWA service worker lifecycle trên iOS vật lý, kiểm tra thanh điều hướng Safari di động thật (không thể thay thế bằng Chromium emulation).
1. `ios-pwa-dang-nhap.spec.ts`
2. `pwa-iphone.spec.ts`
3. `pwa-login-khong-gapi.spec.ts`
4. `mobile-iphone-6-module.spec.ts`
5. `ios-report-bi-check-thuong.spec.ts`
6. `ios-xuat-anh-chia-se.spec.ts`
7. `check-thuong-iphone-khong-cat.spec.ts`
8. `audit-iphone-toan-du-an.spec.ts`
9. `sticker-camera-tat-khi-dong.spec.ts`
10. `sticker-am-thanh-quet.spec.ts`

### Nhóm E: Tương tác Cloud Firestore Trực tiếp / Đồng bộ Nền — 16 specs
*Đặc điểm*: Yêu cầu kết nối Firestore cloud thực tế, kiểm tra rate limit ghi hoặc polling liên tục.
1. `bi-manual-cloud-sync.spec.ts`
2. `bi-sync-luy-ke.spec.ts`
3. `bi-sync-realtime-ngay.spec.ts`
4. `bi-sync-cap-nhat-xong-tu-chay-tiep.spec.ts`
5. `bi-sync-chi-tab-lam-viec.spec.ts`
6. `bi-sync-khong-phat-lai-ket-qua-cu.spec.ts`
7. `bi-sync-kiem-phien-ban.spec.ts`
8. `bi-auto-sync-modal-tien-trinh.spec.ts`
9. `bi-auto-sync-xong-dong-modal.spec.ts`
10. `click-plus-auto-toggle.spec.ts`
11. `sticker-firestore-write-rate.spec.ts`
12. `pending-approvals-poll-rate.spec.ts`
13. `dang-nhap-cung-tab-no-popup.spec.ts`
14. `dang-nhap-thiet-bi-moi.spec.ts`
15. `auth-fresh-login-no-flash.spec.ts`
16. `nho-tai-khoan-dang-nhap.spec.ts`

### Nhóm F: NHÓM AN TOÀN CHO LOCAL SANDBOX / ISOLATED HARNESS — 126 specs
*Đặc điểm*: Chạy hoàn toàn trên dữ liệu cục bộ (Chế độ Dùng Thử, IndexedDB fixture, mount harness cách ly, file Excel tạm sinh bằng salesFixture). Không gọi mạng ngoài, không có tác dụng phụ lên database production.
- **Tiêu biểu**:
  - `smoke.spec.ts` (PASS baseline)
  - `modal-ngan-xep.spec.ts` (PASS trên Chromium, FAIL WebKit đã điều tra rõ nguyên nhân)
  - `apple-tuong-thich.spec.ts` (PASS 2/2 với DB fixture, 0 vi phạm layout trên cả 6 khung màn hình và 11 tabs)
  - `chuan-thiet-ke-b.spec.ts`
  - `css-pham-vi-va-vung-cham.spec.ts`
  - `icon-dieu-huong.spec.ts`
  - `icon-audit-modal.spec.ts`, `icon-audit-man-goc.spec.ts`, `icon-audit-bi.spec.ts`
  - `mau-nganh-modal.spec.ts`
  - `toast-thong-nhat.spec.ts`
  - `more-sheet-bao-cao.spec.ts`
  - `dock-position-alignment.spec.ts`
  - `xss-header-sanitization.spec.ts`
  - `quy-thoi-gian-redesign.spec.ts`
  - `check-thuong-xuat-anh-toan-dien.spec.ts`
  - `duong-ke-doc-mong.spec.ts`
  - `lop-apple-gd3.spec.ts`
  - `khung-app-gd4.spec.ts`
  - ... và các bài test tính toán / giao diện thuần túy khác.

---

## 2. Kết luận và Ranh giới an toàn cho Phase 3–10
1. **Chỉ thực thi Nhóm F** khi chạy tự động trong các quality runner hoặc audit script.
2. **Nhóm A, B, C, D, E** phải được ghi nhận rõ ràng là "CẦN MÔI TRƯỜNG ĐẶC BIỆT / AUTH THỰC TẾ / THIẾT BỊ VẬT LÝ", không được cố chạy ép trong sandbox loopback tránh tạo lỗi giả hoặc phát sinh rủi ro ghi dữ liệu ngoài ý muốn.
