import { test, expect, type Page } from '@playwright/test';
import { appPath } from './helpers/appBase';

/**
 * 2026-11-15 (ảnh chủ dự án, khoanh chỗ trống cạnh "Dạng bảng"): "thêm nhận xét dựa vào cột %D.kiến". Dòng nhận xét đổi theo nhóm
 * đang lọc. Logic tính ở features/check-thuong/services/nhanXetDuKien.ts (test đơn vị cạnh file).
 */
async function moHarness(page: Page) {
    await page.goto('/');
    await page.evaluate(async (duongDan) => (await import(duongDan)).mount(), appPath('/tests/e2e/helpers/checkThuongPhanTichHarness.tsx'));
}

test('laptop: nhận xét % D.Kiến nằm trên thanh lọc, đổi theo nhóm đang lọc', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await moHarness(page);
    const nx = page.getByTestId('check-thuong-nhan-xet-du-kien');
    await expect(nx).toBeVisible({ timeout: 15000 });
    // Tất cả: 7 môn của 910 — QUẠT GIÓ 156% đạt; TAI NGHE/BẢO HIỂM sát mốc; ĐÈN 60% dưới 70%
    await expect(nx).toContainText('1 môn ≥ 100%');
    await expect(nx).toContainText('2 môn sát mốc 90–99%, gần nhất TAI NGHE 99.3%');
    await expect(nx).toContainText('1 môn dưới 70%');

    // Bấm "< 100%": không còn môn ≥ 100%, vẫn nêu môn sát mốc
    await page.getByRole('button', { name: '< 100% 6', exact: true }).click(); // chip lọc (không phải thẻ KPI '< 100% 6 86%')
    await expect(nx).not.toContainText('≥ 100%');
    await expect(nx).toContainText('2 môn sát mốc 90–99%');
    // cùng hàng với nút "Dạng bảng" (không trôi đi chỗ khác)
    const hopNx = (await nx.boundingBox())!;
    const hopNut = (await page.getByRole('button', { name: /Dạng bảng/ }).boundingBox())!;
    expect(Math.abs((hopNx.y + hopNx.height / 2) - (hopNut.y + hopNut.height / 2))).toBeLessThan(16);
    expect(hopNx.x + hopNx.width).toBeLessThanOrEqual(hopNut.x);
    // không tràn ngang trang
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await nx.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/check-thuong-nhan-xet-laptop.png' });
});

test.describe('iPhone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('nhận xét xuống một dòng riêng, đọc trọn, không tràn ngang', async ({ page }) => {
        await moHarness(page);
        const nx = page.getByTestId('check-thuong-nhan-xet-du-kien');
        await expect(nx).toBeVisible({ timeout: 15000 });
        await nx.scrollIntoViewIfNeeded();
        const hop = (await nx.boundingBox())!;
        expect(hop.x).toBeGreaterThanOrEqual(0);
        expect(hop.x + hop.width).toBeLessThanOrEqual(390);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({ path: 'test-results/check-thuong-nhan-xet-iphone.png' });
    });
});
