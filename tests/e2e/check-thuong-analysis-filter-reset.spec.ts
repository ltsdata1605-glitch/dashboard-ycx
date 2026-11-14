import { test, expect, hasRealDataProfile } from './helpers/realDataContext';
import type { Page } from '@playwright/test';

test.skip(!hasRealDataProfile(), 'Cần profile dữ liệu thật .e2e-chrome-profile');

async function navigateAndEnsureApp(page: Page, url: string) {
    await page.goto(url);
    const trialBtn = page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i });
    if (await trialBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trialBtn.click();
    }
    await page.locator('[data-app-chrome="header"]:visible, [data-app-chrome="topbar"]:visible').first().waitFor({ state: 'visible', timeout: 30_000 });
}

test.describe('Check Thưởng - Thao tác lọc và đưa về trạng thái mặc định', () => {
    test('khi bấm vào thẻ KPI rồi bấm vào môn thi trong Phân tích, bộ lọc thẻ đưa về mặc định và lọc chính xác môn thi', async ({ page }) => {
        await navigateAndEnsureApp(page, '/?tab=check-thuong');

        // 1. Chờ thẻ < 100% xuất hiện
        const cardUnder100 = page.locator('button:has-text("< 100%")').first();
        await expect(cardUnder100).toBeVisible({ timeout: 10_000 });

        // 2. Click vào thẻ < 100% để lọc
        await cardUnder100.click();

        // Xác nhận thẻ đang có trạng thái chọn (ring-2)
        await expect(cardUnder100).toHaveClass(/ring-2/);

        // 3. Trong khối Phân Tích & Đề Xuất, tìm môn thi đầu tiên trong danh sách cảnh báo
        const analysisItemBtn = page.locator('li button:has-text("đang hạng")').first();
        await expect(analysisItemBtn).toBeVisible({ timeout: 5000 });
        const itemText = (await analysisItemBtn.textContent()) || '';
        const categoryName = itemText.split(':')[0]?.trim() || '';

        // 4. Click vào môn thi đó
        await analysisItemBtn.click();

        // 5. Kiểm chứng (2026-11-14: bấm dòng phân tích MỞ Bảng Xếp Hạng của môn đó, không chỉ lọc bảng):
        // - Thẻ < 100% lập tức mất trạng thái ring-2 (được đưa về trạng thái mặc định)
        await expect(cardUnder100).not.toHaveClass(/ring-2/);

        // - Bảng Xếp Hạng của đúng môn hiện ra
        const bxh = page.getByRole('dialog');
        await expect(bxh).toBeVisible({ timeout: 5000 });
        await expect(bxh).toContainText(`Bảng Xếp Hạng: ${categoryName}`);

        // 6. Đóng Bảng Xếp Hạng → toàn bộ trở về trạng thái mặc định (không còn banner lọc)
        await bxh.getByRole('button', { name: 'Đóng' }).click();
        await expect(bxh).toBeHidden();
        await expect(page.locator(':text("Đang lọc theo môn thi:")')).toHaveCount(0);
        await expect(cardUnder100).not.toHaveClass(/ring-2/);
    });
});
