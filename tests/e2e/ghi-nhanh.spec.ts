import { expect, test } from '@playwright/test';
import { chanGhiCloud, dangNhapBangToken, hasCustomToken } from './helpers/customTokenLogin';

/**
 * Tab "Ghi nhanh" của Bot LINE trên web — dữ liệu THẬT của tài khoản test, CHỈ ĐỌC.
 * Mọi lượt ghi lên cloud bị chặn (chanGhiCloud); không bấm Xoá để tránh đổi dữ liệu thật.
 */
test.skip(!hasCustomToken(), 'Chưa có custom token của tài khoản test');

test('tab Ghi nhanh mở được, không lỗi trang, hiển thị bảng hoặc trạng thái trống', async ({ page }, testInfo) => {
    const loiTrang: string[] = [];
    page.on('pageerror', e => loiTrang.push(e.message));

    await chanGhiCloud(page);
    await dangNhapBangToken(page);
    await page.goto('/?tab=tools-line-bot');

    const app = page.locator('[data-app-chrome]:visible').first();
    await expect(app).toBeVisible({ timeout: 60_000 });

    const tabNut = page.getByRole('button', { name: 'Ghi nhanh' }).first();
    await expect(tabNut).toBeVisible({ timeout: 30_000 });
    await tabNut.click();

    const bang = page.locator('table').filter({ hasText: 'Người ghi' });
    const trong = page.getByText(/Chưa có ghi nhanh nào|Không có mục khớp tìm kiếm|Chưa có Bot LINE/);
    await expect(bang.or(trong)).toBeVisible({ timeout: 30_000 });

    await page.waitForTimeout(800);
    await page.screenshot({ path: testInfo.outputPath('ghi-nhanh.png'), fullPage: false });

    if (await bang.isVisible()) {
        const cot = await bang.locator('thead th').allInnerTexts();
        expect(cot).toEqual(['Thời gian', 'Người ghi', 'Nhóm', 'Nội dung', 'Thao tác']);
    }
    expect(loiTrang, 'không được có lỗi JavaScript khi mở tab').toEqual([]);
});
