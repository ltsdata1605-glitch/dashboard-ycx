import { expect, test, type Page } from '@playwright/test';

/**
 * 2026-10-30 (chủ dự án): tính năng đã tắt → đường dẫn tới nó coi như chưa từng tồn tại: tự chuyển sang Báo cáo Khai thác
 * (?tab=reports), KHÔNG hiện trang 404. Nếu Báo cáo cũng tắt thì sang Giới thiệu.
 */
const KHONG_404 = /Tính năng đã đi nằm chỗ|Tính năng tạm đóng/;

async function tatTinhNang(page: Page, features: Record<string, boolean>) {
    await page.goto('/');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
    await page.evaluate(f => localStorage.setItem('ycx_system_menu_config_v1', JSON.stringify({ features: f, updatedAt: new Date().toISOString() })), features);
}

test('tính năng đã tắt: đường dẫn trực tiếp chuyển sang Báo cáo Khai thác, không hiện 404', async ({ page }) => {
    await tatTinhNang(page, { analysis: false });
    await page.goto('/?tab=analysis');
    await expect(page).toHaveURL(/tab=reports/, { timeout: 30_000 });
    await expect(page.getByText(KHONG_404)).toHaveCount(0);
});

test('Báo cáo cũng tắt: chuyển sang Giới thiệu', async ({ page }) => {
    await tatTinhNang(page, { analysis: false, reports: false });
    await page.goto('/?tab=analysis');
    await expect(page).toHaveURL(/tab=help/, { timeout: 30_000 });
    await expect(page.getByText(KHONG_404)).toHaveCount(0);
});
