import { expect, test } from '@playwright/test';
import { chanGhiCloud, dangNhapBangToken, hasCustomToken } from './helpers/customTokenLogin';

/**
 * Tab "Yêu cầu duyệt" của Bot LINE trên web — dữ liệu THẬT của tài khoản test, CHỈ ĐỌC.
 * Mọi lượt ghi lên cloud bị chặn (chanGhiCloud). Không bấm Duyệt/Từ chối để tránh đổi dữ liệu thật.
 * Bỏ qua nếu môi trường không có custom token của tài khoản test.
 */
test.skip(!hasCustomToken(), 'Chưa có custom token của tài khoản test');

test('tab Yêu cầu duyệt mở được, không lỗi trang, và hiển thị đúng trạng thái trống/có dữ liệu', async ({ page }, testInfo) => {
    const loiTrang: string[] = [];
    page.on('pageerror', e => loiTrang.push(e.message));

    await chanGhiCloud(page);
    await dangNhapBangToken(page);
    await page.goto('/?tab=tools-line-bot');

    const app = page.locator('[data-app-chrome]:visible').first();
    await expect(app).toBeVisible({ timeout: 60_000 });

    const tabNut = page.getByRole('button', { name: 'Yêu cầu duyệt' }).first();
    await expect(tabNut).toBeVisible({ timeout: 30_000 });
    await tabNut.click();

    // Một trong ba trạng thái: có bảng, có thông báo trống, hoặc chưa có bot.
    const bang = page.locator('table').filter({ hasText: 'Người xin' });
    const trong = page.getByText(/Chưa có yêu cầu nào|Không có yêu cầu ở trạng thái này|Chưa có Bot LINE/);
    await expect(bang.or(trong)).toBeVisible({ timeout: 30_000 });

    await page.waitForTimeout(800);
    await page.screenshot({ path: testInfo.outputPath('yeu-cau-duyet.png'), fullPage: false });

    const cotTieuDe = bang.isVisible().then(v => (v ? bang.locator('thead th').allInnerTexts() : []));
    const cot = await cotTieuDe;
    if (cot.length) {
        expect(cot).toEqual(['Mã', 'Nội dung', 'Người xin', 'Gửi lúc', 'Trạng thái', 'Người quyết định', 'Thao tác']);
    }
    expect(loiTrang, 'không được có lỗi JavaScript khi mở tab').toEqual([]);
});
