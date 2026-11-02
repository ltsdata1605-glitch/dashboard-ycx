import { expect, test } from '@playwright/test';

/**
 * 2026-10-30: quyền XEM chức năng theo vai trò. Chế độ Dùng Thử đăng nhập vai trò quản lý; "Phân tích" chỉ cho quản trị hệ thống
 * → quản lý mở ?tab=analysis phải chuyển sang Báo cáo Khai thác. Quản lý Bật/Tắt không còn nút "Xem 404".
 */
test.use({ viewport: { width: 1366, height: 900 } });
test('chức năng chỉ cho quản trị: vai trò quản lý bị chuyển sang Báo cáo Khai thác', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
    await page.evaluate(() => localStorage.setItem('ycx_system_menu_config_v1', JSON.stringify({
        features: {}, featureRoles: { analysis: [] }, updatedAt: new Date().toISOString(),
    })));
    await page.goto('/?tab=analysis');
    await expect(page).toHaveURL(/tab=reports/, { timeout: 30_000 });
});
