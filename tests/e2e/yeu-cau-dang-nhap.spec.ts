import { expect, test } from '@playwright/test';
import { appPath } from './helpers/appBase';

/**
 * 2026-10-30 (chủ dự án): người dùng PHẢI đăng nhập mới dùng được mọi tính năng của dashboard.pro.vn.
 * Chưa đăng nhập (không bấm "Dùng thử"), mọi đường dẫn tính năng đều phải dừng ở màn đăng nhập; trang cũ check-thuong.html
 * chuyển về app. Bài này chạy trên máy chủ phát triển (có nút Dùng thử cho bộ test) nên KHÔNG bấm nút đó.
 */
const duong = ['/?tab=analysis', '/?tab=employees', '/?tab=tools-phanca', '/?tab=tools-print-sticker', '/?tab=check-thuong', '/?tab=tools-line-bot'];

for (const url of duong) {
    test(`chưa đăng nhập: ${url} dừng ở màn đăng nhập`, async ({ page }) => {
        await page.goto(url);
        await expect(page.getByTestId('login-view')).toBeVisible({ timeout: 30_000 });
        await expect(page.getByRole('button', { name: /Tiếp tục với Google/i })).toBeVisible();
        await expect(page.getByText('Lịch Phân Ca', { exact: false })).toHaveCount(0);
        await expect(page.getByText('LỊCH PHÂN CA', { exact: false })).toHaveCount(0);
    });
}

test('trang cũ /check-thuong.html chuyển về app (đăng nhập), không hiện bảng tra cứu', async ({ page }) => {
    await page.goto(appPath('/check-thuong.html'));
    await page.waitForURL(/\?tab=check-thuong/, { timeout: 30_000 });
    await expect(page.getByTestId('login-view')).toBeVisible({ timeout: 30_000 });
});
