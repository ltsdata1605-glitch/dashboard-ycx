import { expect, test, type Page } from '@playwright/test';
import { fileNhanVien } from './helpers/phanCaFixture';

/**
 * 2026-10-30 (chủ dự án): Phân ca trên điện thoại — xem ca từng nhân viên theo từng ngày và xuất ảnh.
 * Máy tính vẫn là bảng; nút chuyển "Bảng | Theo NV" chỉ hiện trên điện thoại.
 */
async function taoLich(page: Page) {
    await page.goto('/?tab=tools-phanca');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Tạo lịch' })).toBeVisible({ timeout: 30_000 });
    await page.locator('input[type="file"]').first().setInputFiles(fileNhanVien());
    const modal = page.getByRole('dialog', { name: /Cấu Hình Nhập Nhân Viên/i });
    await modal.getByPlaceholder(/VD: 1234/).fill('9999 - ST Thử');
    await modal.getByRole('button', { name: 'Lưu & Tiếp Tục' }).click();
    await expect(modal).toBeHidden();
    await page.getByRole('button', { name: 'Tạo lịch' }).click();
    await expect(page.getByText(/LỊCH PHÂN CA - 9999 - ST Thử/i).first()).toBeVisible({ timeout: 20_000 });
}

test.describe('điện thoại 390', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('Theo NV: một dòng mỗi ngày, đổi nhân viên được, xuất ảnh tải về được', async ({ page }) => {
        await taoLich(page);
        await page.getByRole('button', { name: 'Theo NV', exact: true }).click();
        const chon = page.getByLabel('Chọn nhân viên');
        await expect(chon).toBeVisible();
        await expect(chon).toHaveValue(/.+/);
        // Tháng có đủ số ngày của lịch: mỗi ngày một dòng có thứ (T2…CN) và ngày/tháng
        const soNgay = await page.locator('ul li').filter({ hasText: /^(CN|T[2-7])/ }).count();
        expect(soNgay).toBeGreaterThanOrEqual(28);
        const tenKhac = await chon.locator('option').nth(1).getAttribute('value');
        if (tenKhac) await chon.selectOption(tenKhac);

        const [tai] = await Promise.all([
            page.waitForEvent('download', { timeout: 30_000 }),
            page.getByRole('button', { name: 'Xuất ảnh', exact: true }).click(),
        ]);
        expect(tai.suggestedFilename()).toMatch(/^Lịch Cá Nhân - .+ - Tháng \d{1,2}-\d{4}\.png$/);
    });
    test('quay lại Bảng: bảng cả nhóm hiện như cũ', async ({ page }) => {
        await taoLich(page);
        await page.getByRole('button', { name: 'Theo NV', exact: true }).click();
        await page.getByRole('button', { name: 'Bảng', exact: true }).click();
        await expect(page.getByLabel('Chọn nhân viên')).toBeHidden();
        await expect(page.getByText(/THỐNG KÊ NHÂN SỰ THEO CA/i).first()).toBeVisible();
    });
});

test.describe('laptop 1366', () => {
    test.use({ viewport: { width: 1366, height: 900 } });
    test('không có nút Theo NV; bảng vẫn hiện', async ({ page }) => {
        await taoLich(page);
        await expect(page.getByRole('button', { name: 'Theo NV', exact: true })).toBeHidden();
        await expect(page.getByText(/THỐNG KÊ NHÂN SỰ THEO CA/i).first()).toBeVisible();
    });
});
