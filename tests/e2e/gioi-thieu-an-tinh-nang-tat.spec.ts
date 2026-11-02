import { expect, test, type Page } from '@playwright/test';

/**
 * 2026-10-30: trang Giới thiệu — bỏ mục "Dữ liệu và quyền riêng tư" và đoạn mô tả đầu trang; phân hệ đã TẮT trong Quản lý Bật/Tắt
 * thì ẩn dòng của nó (các dòng còn lại vẫn hiện).
 */
async function moGioiThieu(page: Page, features: Record<string, boolean>) {
    await page.goto('/');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
    await page.evaluate(f => localStorage.setItem('ycx_system_menu_config_v1', JSON.stringify({ features: f, updatedAt: new Date().toISOString() })), features);
    await page.goto('/?tab=help');
    await expect(page.getByText('Phân hệ', { exact: true })).toBeVisible({ timeout: 30_000 });
}

test('Giới thiệu: không còn mục quyền riêng tư và đoạn mô tả đầu trang', async ({ page }) => {
    await moGioiThieu(page, {});
    await expect(page.getByText('Dữ liệu và quyền riêng tư')).toHaveCount(0);
    await expect(page.getByText('File Excel xử lý trên máy')).toHaveCount(0);
    await expect(page.getByText('dùng trên laptop và iPhone')).toHaveCount(0);
});

test('Giới thiệu: phân hệ đã tắt bị ẩn, phân hệ khác vẫn hiện', async ({ page }) => {
    await moGioiThieu(page, { analysis: false });
    await expect(page.getByText('Phân tích YCX')).toHaveCount(0);
    await expect(page.getByText('Realtime, luỹ kế, thi đua và thưởng theo siêu thị')).toBeVisible();
    await expect(page.getByText('Xếp lịch làm việc theo ca xoay')).toBeVisible();
});
