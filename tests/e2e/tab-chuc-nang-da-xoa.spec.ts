import { test, expect } from '@playwright/test';
import { vaoLoiKiemThu } from './helpers/loiKiemThu';

/**
 * 2026-11-15 (chủ dự án: "Xoá hẳn chức năng so sánh giá"): màn So sánh giá đã gỡ ở cef189e, nhưng link cũ / tab nhớ lần trước
 * (`?tab=tools-price-compare`) rơi vào trang "Tính năng đang được phát triển — Vui lòng quay lại sau" (như hứa sẽ có lại).
 * Tab của chức năng đã xoá (contexts/LayoutContext.tsx → TAB_DA_XOA) phải về Check thưởng và sửa luôn URL.
 */
for (const tabCu of ['tools-price-compare', 'analysis']) {
    test(`link cũ ?tab=${tabCu} → về Check thưởng, không trang "đang phát triển"`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`/?tab=${tabCu}`);
        await vaoLoiKiemThu(page);
        await expect.poll(() => new URL(page.url()).searchParams.get('tab'), { timeout: 15_000 }).toBe('check-thuong');
        await expect(page.getByText('Tính năng đang được phát triển')).toHaveCount(0);
        await expect(page.getByText(/so sánh giá/i)).toHaveCount(0);
    });
}

test('menu không còn mục So sánh giá (laptop + iPhone sheet Khác)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/?tab=check-thuong');
    await vaoLoiKiemThu(page);
    await expect(page.locator('[data-app-chrome]:visible').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /so sánh giá/i })).toHaveCount(0);
    await expect(page.locator('[title*="So sánh giá" i], [aria-label*="So sánh giá" i]')).toHaveCount(0);
});
