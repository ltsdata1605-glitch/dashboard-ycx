import { test, expect } from '@playwright/test';
import { appPath } from './helpers/appBase';

/**
 * 2026-11-14 (ảnh chủ dự án): bấm dòng trong "Phân Tích & Đề Xuất" (vd "T11 - ĐÈN NĂNG LƯỢNG MẶT TRỜI: cần cải thiện 16 hạng")
 * không hiện Bảng Xếp Hạng — trước đây chỉ lọc bảng rồi cuộn xuống. Nay mở Bảng Xếp Hạng của đúng môn, như bấm dòng trong bảng.
 * Dev server ở /dashboard-ycx/ (vite `base`) nên module test nạp theo đường dẫn đó.
 */
test('bấm dòng "Cơ hội vàng" trong Phân Tích & Đề Xuất → mở Bảng Xếp Hạng của đúng môn đó', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.evaluate(async (duongDan) => (await import(duongDan)).mount(), appPath('/tests/e2e/helpers/checkThuongPhanTichHarness.tsx'));
    const dongPhanTich = page.getByRole('button', { name: /T11 - ĐÈN NĂNG LƯỢNG MẶT TRỜI: cần cải thiện 16 hạng/ });
    await expect(dongPhanTich).toBeVisible({ timeout: 15000 });
    await dongPhanTich.click();
    const bxh = page.getByRole('dialog');
    await expect(bxh).toBeVisible({ timeout: 5000 });
    await expect(bxh).toContainText('Bảng Xếp Hạng: T11 - ĐÈN NĂNG LƯỢNG MẶT TRỜI');
    // đủ 3 siêu thị của môn này
    for (const st of ['910', '911', '912']) await expect(bxh).toContainText(st);
    await page.screenshot({ path: 'test-results/check-thuong-phan-tich-mo-bxh.png' });
    // Đóng → về mặc định (không còn banner lọc)
    await page.keyboard.press('Escape');
    await expect(bxh).toBeHidden();
    await expect(page.getByText('Đang lọc theo môn thi:')).toHaveCount(0);
    // Bấm dòng thứ 2 cũng mở đúng môn
    await page.getByRole('button', { name: /T11 - CAMERA: cần cải thiện 7 hạng/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Bảng Xếp Hạng: T11 - CAMERA');
});

test.describe('iPhone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('chạm dòng phân tích → Bảng Xếp Hạng hiện trên màn điện thoại', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(async (duongDan) => (await import(duongDan)).mount(), appPath('/tests/e2e/helpers/checkThuongPhanTichHarness.tsx'));
        await page.getByRole('button', { name: /T11 - ĐÈN NĂNG LƯỢNG MẶT TRỜI: cần cải thiện 16 hạng/ }).tap();
        const bxh = page.getByRole('dialog');
        await expect(bxh).toBeVisible({ timeout: 5000 });
        await expect(bxh).toContainText('Bảng Xếp Hạng: T11 - ĐÈN NĂNG LƯỢNG MẶT TRỜI');
        await expect(bxh.getByText('910 - ĐML Hùng Vương')).toBeInViewport();
        await page.screenshot({ path: 'test-results/check-thuong-phan-tich-mo-bxh-iphone.png' });
    });
});
