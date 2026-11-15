import type { Page } from '@playwright/test';

/**
 * Lối vào kiểm thử — thay nút "Kích hoạt Chế độ Dùng Thử" (chủ dự án XOÁ Chế độ Dùng Thử 2026-11-15: không nút, không chữ nào trên bản
 * người dùng). Chỉ có trên dev server: contexts/AuthContext.tsx gắn `window.__ycxVaoLoiKiemThu` khi `import.meta.env.DEV`. Gọi ở đúng
 * chỗ spec cũ bấm nút (sau `page.goto(...)`): vào app với vai trò quản lý, không đăng nhập, không ghi cloud. Gọi lại khi đã vào: vô hại.
 *
 * Muốn vào thẳng từ lúc tải trang thì vẫn dùng cờ cũ: `addInitScript(() => localStorage.setItem('ycx_demo_mode', 'true'))`.
 */
export async function vaoLoiKiemThu(page: Page, timeout = 30_000): Promise<void> {
    await choLoiKiemThu(page, timeout);
    await page.evaluate(() => (window as unknown as { __ycxVaoLoiKiemThu: () => void }).__ycxVaoLoiKiemThu());
}

/** Chờ app khởi động tới lúc vào được lối kiểm thử (thay "chờ nút Dùng Thử hiện") — vd để gieo dữ liệu TRƯỚC khi vào app. */
export async function choLoiKiemThu(page: Page, timeout = 30_000): Promise<void> {
    await page.waitForFunction(() => typeof (window as unknown as { __ycxVaoLoiKiemThu?: unknown }).__ycxVaoLoiKiemThu === 'function', null, { timeout });
}
