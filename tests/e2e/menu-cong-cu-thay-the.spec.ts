import { expect, test, type Page } from '@playwright/test';

/**
 * 2026-10-30 (chủ dự án): tắt ô menu chính (Phân tích, Report BI, Check thưởng) thì công cụ đang bật được đưa lên thay —
 * không để trống thanh điều hướng. Công cụ đã lên thì không hiện lại trong sheet "Thêm" / nhóm "Công cụ".
 */
const TAT_CHINH = { analysis: false, employees: false, 'check-thuong': false };

async function moApp(page: Page) {
    await page.goto('/');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
    await page.evaluate(f => localStorage.setItem('ycx_system_menu_config_v1', JSON.stringify({ features: f, updatedAt: new Date().toISOString() })), TAT_CHINH);
    await page.reload();
}

test.describe('điện thoại 390', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('thanh dưới: 3 ô công cụ thay các ô chính đã tắt; sheet Thêm không lặp lại', async ({ page }) => {
        await moApp(page);
        const thanh = page.getByRole('navigation', { name: 'Điều hướng chính' });
        await expect(thanh.getByText('Báo cáo', { exact: true })).toBeVisible({ timeout: 30_000 });
        await expect(thanh.getByText('In Sticker', { exact: true })).toBeVisible();
        await expect(thanh.getByText('Phân ca', { exact: true })).toBeVisible();
        await expect(thanh.getByText('Phân tích', { exact: true })).toHaveCount(0);

        await page.getByRole('button', { name: 'Khác', exact: true }).click();
        const sheet = page.getByRole('dialog');
        await expect(sheet.getByText('Rút gọn Coupon', { exact: true })).toBeVisible();
        await expect(sheet.getByText('Báo cáo', { exact: true })).toHaveCount(0);
        await expect(sheet.getByText('In Sticker', { exact: true })).toHaveCount(0);
    });
});

test.describe('laptop 1366', () => {
    test.use({ viewport: { width: 1366, height: 900 } });
    test('sidebar: công cụ đưa lên cấp ngoài thay mục đã tắt, không lặp trong nhóm Công cụ', async ({ page }) => {
        await moApp(page);
        await expect(page.getByRole('button', { name: 'Phân ca', exact: true }).first()).toBeVisible({ timeout: 30_000 });
        await expect(page.getByRole('button', { name: 'Báo cáo', exact: true })).toHaveCount(1);
        await expect(page.getByRole('button', { name: 'Phân tích YCX', exact: true })).toHaveCount(0);
    });
});
