import { expect, test } from '@playwright/test';
import { chanGhiCloud, dangNhapBangToken, hasCustomToken } from './helpers/customTokenLogin';

/**
 * Liên kết "Hướng dẫn sử dụng Bot LINE" trong tab Bot LINE — chỉ đọc (chặn ghi cloud).
 * Kiểm tra: liên kết hiện, trỏ đúng file, và file mở được với tiêu đề hướng dẫn.
 */
test.skip(!hasCustomToken(), 'Chưa có custom token của tài khoản test');

test('liên kết hướng dẫn hiện trong Bot LINE và mở được trang hướng dẫn', async ({ page, context }) => {
    await chanGhiCloud(page);
    await dangNhapBangToken(page);
    await page.goto('/?tab=tools-line-bot');

    const app = page.locator('[data-app-chrome]:visible').first();
    await expect(app).toBeVisible({ timeout: 60_000 });

    const lienKet = page.getByRole('link', { name: 'Hướng dẫn sử dụng Bot LINE' });
    await expect(lienKet).toBeVisible({ timeout: 30_000 });
    await expect(lienKet).toHaveAttribute('href', '/dashboard-ycx/huong-dan-bot-line.html');
    await expect(lienKet).toHaveAttribute('target', '_blank');

    const [trang] = await Promise.all([
        context.waitForEvent('page'),
        lienKet.click(),
    ]);
    await trang.waitForLoadState('domcontentloaded');
    expect(trang.url()).toContain('/huong-dan-bot-line.html');
    await expect(trang.locator('h1').first()).toContainText('Bot LINE');
    await expect(trang.getByText('Tồn kho và xin mã PMH').first()).toBeVisible();
});
