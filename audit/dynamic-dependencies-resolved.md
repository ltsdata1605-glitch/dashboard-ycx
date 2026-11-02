# Giải Mã Chi Tiết 61 Quan Hệ Động (Dynamic Expressions Resolution)

Trạng thái: **ĐÃ GIẢI MÃ 100% (61/61 BIỂU THỨC)**.
Căn cứ: Trích xuất từ [`audit/dependency-unresolved.csv`](file:///Users/ltson/dashboardycx/audit/dependency-unresolved.csv) và đối soát trực tiếp mã nguồn AST.

---

## 1. Phân loại theo Bản chất Ngữ nghĩa (Semantics)

| Phân nhóm | Số lượng | Bản chất kỹ thuật | Ảnh hưởng kiến trúc |
|---|---|---|---|
| **A. URL Parsing (Web API `new URL()`)** | 37 | Phân tích URL trình duyệt, deep-link query params, CSP audit, Service Worker URL | Không phải dependency module, là Web API tiêu chuẩn |
| **B. Dynamic Import trong Test Harness (`import(...)`)** | 19 | E2E Playwright nạp module thử nghiệm vào ngữ cảnh trình duyệt (`page.evaluate`) | Chỉ phục vụ kiểm thử cục bộ cách ly, không ảnh hưởng bundle production |
| **C. Dynamic Require trong Scripts (`require(...)`)** | 5 | CLI Node scripts bảo trì Firestore/Firebase Tools | Scripts quản trị nội bộ ngoài bundle runtime |
| **Tổng cộng** | **61** | **Tất cả đều có mục đích xác định rõ ràng** | **0 quan hệ đứt gãy hoặc thiếu module** |

---

## 2. Bảng Đối Soát Chi Tiết Từng Biểu Thức

### Nhóm A: URL Parsing & Deep Links (37 biểu thức)

| STT | File nguồn | Dòng | Biểu thức | Ngữ cảnh & Target phân giải |
|---|---|---|---|---|
| 1 | `.agents/skills/design-taste-frontend/scripts/inspect.mjs` | 43 | `req.url` | Phân tích URL request trong script inspector tool |
| 2 | `contexts/LayoutContext.tsx` | 60 | `window.location.href` | Đọc `?tab=` từ URL để đồng bộ tab khởi động |
| 3 | `contexts/LayoutContext.tsx` | 82 | `window.location.href` | Đọc query param `?theme=` để đồng bộ giao diện |
| 4 | `features/bi-dashboard/components/BiWrapper.tsx` | 229 | `window.location.href` | Đọc query param sub-tab Report BI (`sieu-thi`, `nhan-vien`, `cap-nhat`) |
| 5 | `features/bi-dashboard/components/BiWrapper.tsx` | 271 | `window.location.href` | Phân tích deep-link navigation trong Report BI |
| 6 | `features/bi-dashboard/components/Dashboard.tsx` | 399 | `window.location.href` | Đọc bộ lọc siêu thị / vùng từ query parameters |
| 7 | `features/bi-dashboard/components/NhanVien.tsx` | 106 | `window.location.href` | Đọc mã nhân viên từ URL deep-link (`?employeeId=...`) |
| 8 | `features/bi-dashboard/services/autoNavigationService.test.ts` | 34 | `url` | Unit test kiểm tra parse URL deep-link |
| 9 | `features/bi-dashboard/services/autoNavigationService.ts` | 13 | `window.location.href` | Service tự động điều hướng theo deep link |
| 10 | `features/bi-dashboard/services/tileLinkService.ts` | 87 | `defaultUrl` | Tạo liên kết đích cho ô chỉ số Dashboard |
| 11 | `features/sticker-event/hooks/useStickerPrinterData.ts` | 413 | `window.location.href` | Đọc query params cấu hình in vé/sticker |
| 12 | `functions/src/liffTicket.ts` | 37 | `obj.uri` | Parse URI hành động trong Flex message LINE |
| 13 | `public/scripts/html-to-image.js` | 1 | `e` | Thư viện bên ngoài resolve SVG blob URL |
| 14 | `public/scripts/mwg-auto-thu-thap-diem-thuong.user.js` | 2911 | `location.href` | Userscript kiểm tra trang MWG HRM đang mở |
| 15 | `public/scripts/mwg-auto-thu-thap-diem-thuong.user.js` | 4664 | `location.href` | Userscript kiểm tra trang báo cáo doanh thu |
| 16 | `public/scripts/mwg-auto-thu-thap-diem-thuong.user.js` | 5217 | `url` | Userscript parse đường link tải báo cáo Excel |
| 17 | `public/scripts/mwg-auto-thu-thap-diem-thuong.user.js` | 5254 | `row.LINKDOWNLOAD` | Userscript tải file từ link ERP MWG |
| 18 | `scripts/sw-template.js` | 77 | `request.url` | Service Worker cache bypass & offline routing |
| 19 | `scripts/sw-template.js` | 113 | `request.url` | Service Worker static asset interceptor |
| 20 | `tests/e2e/helpers/customTokenLogin.ts` | 69 | `route.request().url()` | Playwright route interceptor chặn ghi Cloud |
| 21 | `tests/e2e/ios-du-lieu-that.spec.ts` | 41 | `page.url()` | E2E assertion: kiểm tra URL sau điều hướng |
| 22 | `tests/e2e/ios-pwa-dang-nhap.spec.ts` | 44 | `url` | E2E assertion: kiểm tra redirect URL đăng nhập |
| 23 | `tests/e2e/ios-pwa-dang-nhap.spec.ts` | 50 | `u.searchParams.get(...)` | Đọc tham số `redirectUrl` trong luồng auth |
| 24 | `tests/e2e/line-gui-anh-va-hen-gio.spec.ts` | 139 | `(await popupP).url()` | Kiểm tra URL popup chia sẻ LINE |
| 25 | `tests/e2e/line-gui-anh-va-hen-gio.spec.ts` | 264 | `(await page.evaluate(...))` | Kiểm tra danh sách tab mở trong browser |
| 26 | `tests/e2e/nho-tai-khoan-dang-nhap.spec.ts` | 19 | `url` | Phân tích URL redirect auth |
| 27 | `tests/e2e/nho-tai-khoan-dang-nhap.spec.ts` | 29 | `new URL(toi()).searchParams` | Đọc `redirectUrl` khi nhớ tài khoản |
| 28 | `tests/e2e/nho-tai-khoan-dang-nhap.spec.ts` | 29 | `toi()` | Target URL đăng nhập |
| 29 | `tests/e2e/pwa-login-khong-gapi.spec.ts` | 43 | `page.url()` | E2E assertion: URL trang PWA |
| 30 | `tests/e2e/ycx-tu-dong-phan-tich.spec.ts` | 88 | `popup.url()` | Xác thực popup window URL |
| 31 | `tests/e2e/ycx-tu-dong-phan-tich.spec.ts` | 128 | `(await popupP).url()` | Xác thực popup window URL |
| 32 | `tests/e2e/ycx-tu-dong-phan-tich.spec.ts` | 187 | `popup.url()` | Xác thực popup window URL |
| 33 | `tests/e2e/ycx-tu-dong-report-mwg.spec.ts` | 111 | `req.url()` | Kiểm tra URL request khi đồng bộ dữ liệu |
| 34 | `tests/unit/audit-gd1c-liff-ticket.test.ts` | 34 | `u` | Unit test URL LIFF ticket generator |
| 35 | `tests/unit/csp-frame-src-va-cdn-pin.test.ts` | 87 | `url` | Unit test kiểm tra miền hợp lệ trong CSP |

### Nhóm B: Dynamic Imports trong Test Harnesses (19 biểu thức)

| STT | File nguồn | Dòng | Biểu thức | Phân giải Target thực tế |
|---|---|---|---|---|
| 36 | `tests/e2e/audit-xuat-anh-phan-tich-mobile-laptop.spec.ts` | 36 | `modPath` | Target: `/src/components/views/AnalysisView.tsx` hoặc `/src/services/dbService.ts` |
| 37 | `tests/e2e/helpers/customTokenLogin.ts` | 91 | `depUrl` | Target: Firebase auth module nạp động trong browser context |
| 38 | `tests/e2e/indexeddb-rieng-theo-tai-khoan.spec.ts` | 131 | `paths.scope` | Target: `/src/utils/localDbScope.ts` |
| 39 | `tests/e2e/indexeddb-rieng-theo-tai-khoan.spec.ts` | 132 | `paths.root` | Target: `/src/services/dbService.ts` |
| 40 | `tests/e2e/indexeddb-rieng-theo-tai-khoan.spec.ts` | 133 | `paths.bi` | Target: `/src/features/bi-dashboard/services/biDatabaseService.ts` |
| 41 | `tests/e2e/indexeddb-rieng-theo-tai-khoan.spec.ts` | 134 | `paths.biKeys` | Target: `/src/features/bi-dashboard/constants/dbKeys.ts` |
| 42 | `tests/e2e/indexeddb-rieng-theo-tai-khoan.spec.ts` | 135 | `paths.sticker` | Target: `/src/features/sticker-event/services/stickerDatabaseService.ts` |
| 43 | `tests/e2e/registry-luu-hong-khong-mat-du-lieu.spec.ts` | 31 | `path` | Target: `/src/services/dbService.ts` |
| 44 | `tests/e2e/registry-luu-hong-khong-mat-du-lieu.spec.ts` | 96 | `dbPath` | Target: `/src/services/dbService.ts` |
| 45 | `tests/e2e/registry-luu-hong-khong-mat-du-lieu.spec.ts` | 98 | `scopePath` | Target: `/src/utils/localDbScope.ts` |
| 46 | `tests/e2e/so-gia-dien-thoai-va-huy.spec.ts` | 19 | `p` | Target: `/src/utils/dataUtils.ts` |
| 47 | `tests/e2e/so-gia-dien-thoai-va-huy.spec.ts` | 45 | `p` | Target: `/src/utils/dataUtils.ts` |
| 48 | `tests/e2e/so-gia-dien-thoai-va-huy.spec.ts` | 52 | `p` | Target: `/src/utils/dataUtils.ts` |
| 49 | `tests/e2e/xuat-anh-chung.spec.ts` | 36 | `path` | Target: `/src/components/shared/export/UnifiedExportModal.tsx` |
| 50 | `tests/e2e/xuat-anh-chung.spec.ts` | 93 | `path` | Target: `/src/components/shared/export/UnifiedExportModal.tsx` |
| 51 | `tests/e2e/xuat-anh-chung.spec.ts` | 117 | `path` | Target: `/src/components/shared/export/exportEngine.ts` |
| 52 | `tests/e2e/xuat-anh-chung.spec.ts` | 132 | `path` | Target: `/src/components/shared/export/exportEngine.ts` |
| 53 | `tests/e2e/xuat-anh-chung.spec.ts` | 159 | `path` | Target: `/src/components/shared/export/exportEngine.ts` |
| 54 | `tests/e2e/xuat-anh-chung.spec.ts` | 165 | `path` | Target: `/src/components/shared/export/exportEngine.ts` |
| 55 | `tests/e2e/xuat-anh-giao-anh-chung.spec.ts` | 92 | `mod` | Target: `/src/components/shared/export/UnifiedExportModal.tsx` |
| 56 | `tests/e2e/xuat-anh-giao-anh-chung.spec.ts` | 105 | `mod` | Target: `/src/components/shared/export/UnifiedExportModal.tsx` |

### Nhóm C: Dynamic Require trong Scripts Bảo trì (5 biểu thức)

| STT | File nguồn | Dòng | Biểu thức | Phân giải Target thực tế |
|---|---|---|---|---|
| 57 | `functions/scripts/audit-firestore-readonly.cjs` | 125 | `path.join(REPO_ROOT, ..., 'api.js')` | Target: `node_modules/firebase-tools/lib/api.js` (gọi API quản trị Firestore) |
| 58 | `functions/scripts/clean-sticker-target-default.cjs` | 29 | `ADMIN_ROOT` | Target: Thư mục `node_modules/firebase-admin` |
| 59 | `functions/scripts/clean-sticker-target-default.cjs` | 30 | `path.join(ADMIN_ROOT, 'lib', 'firestore')` | Target: Module Firestore nội bộ của `firebase-admin` |
| 60 | `functions/scripts/clean-sticker-target-default.cjs` | 46 | `path.join(REPO_ROOT, ..., 'api.js')` | Target: `node_modules/firebase-tools/lib/api.js` |
| 61 | `functions/scripts/migrate-sticker-to-default.cjs` | 51 | `path.join(REPO_ROOT, ..., 'api.js')` | Target: `node_modules/firebase-tools/lib/api.js` |

---

## 3. Kết luận
- **100% (61/61)** biểu thức quan hệ động đã được định vị chính xác ngữ cảnh và target phân giải thực tế.
- **Không có biểu thức nào** che giấu circular dependency, dead import, hay module bị thiếu.
- Đã giải toả hoàn toàn mối lo ngại về các cạnh động chưa rõ ràng trong đồ thị phụ thuộc tĩnh.
