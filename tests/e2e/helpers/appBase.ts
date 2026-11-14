import { APP_BASE } from '../../../constants/appBase';

/**
 * Đường dẫn module Vite (và trang thử) cho `page.evaluate(() => import(...))` (2026-11-14). Từ aaa1d73 dev server phục vụ dưới `APP_BASE`
 * (vd `/dashboard-ycx/`) → `/services/firebase.ts` trần là 404 ("Không tìm thấy import firebase/auth…"), phải là
 * `/dashboard-ycx/services/firebase.ts`. Nguồn giá trị: constants/appBase.ts (vite.config.ts cũng đọc).
 *
 * Closure của `page.evaluate` chạy trong TRÌNH DUYỆT — không thấy biến ở đây: tính đường dẫn ở phía Node rồi truyền vào làm
 * tham số, vd `page.evaluate(async (p) => import(p), appPath('/services/localDataOwner.ts'))`.
 */
export { APP_BASE };

/** `'/services/x.ts'` (hoặc `'services/x.ts'`) → `'/dashboard-ycx/services/x.ts'`. Dùng cả cho trang: `page.goto(appPath('/tests/e2e/helpers/materialHarness.html?forms'))`
 *  (`page.goto('/')` và `'/?tab=…'` thì KHÔNG cần — dev server tự chuyển hướng gốc về base, các đường dẫn khác là 404). */
export const appPath = (p: string): string => APP_BASE + p.replace(/^\/+/, '');
