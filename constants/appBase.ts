/**
 * ĐƯỜNG DẪN GỐC (base) của app — MỘT nguồn duy nhất (2026-11-14).
 *
 * Từ aaa1d73 app chạy dưới thư mục con của GitHub Pages: https://ltsdata1605-glitch.github.io/dashboard-ycx/ (bỏ tên miền
 * dashboard.pro.vn). Mọi URL Vite sinh ra (gói JS/CSS, module ở dev server) đều có tiền tố này: `/dashboard-ycx/assets/…`,
 * `/dashboard-ycx/services/firebase.ts`. Viết cứng `/assets/` hay `/services/` ở chỗ nào là 404.
 *
 * Ai đọc hằng này:
 *  - `vite.config.ts` — `base` và đường dẫn tải sẵn của service worker.
 *  - `scripts/kiem-goi-tai-dau.cjs` — đọc bằng regex (script CommonJS không import được TS): ĐỔI DẠNG dòng `export const` bên
 *    dưới thì sửa cả regex ở đó.
 *  - `tests/e2e/helpers/appBase.ts` — đường dẫn module Vite trong `page.evaluate` (`import(appModule('/services/x.ts'))`).
 * Code app chạy trong trình duyệt KHÔNG import file này: dùng `import.meta.env.BASE_URL` (Vite tự điền đúng giá trị này).
 *
 * Luôn bắt đầu VÀ kết thúc bằng "/". Đổi nơi deploy (vd quay lại tên miền riêng → "/") chỉ cần sửa ở đây.
 */
export const APP_BASE = '/dashboard-ycx/';
