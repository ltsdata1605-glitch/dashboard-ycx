import { expect, test, type Page } from '@playwright/test';
import { fileNhanVien } from './helpers/phanCaFixture';

/**
 * Hành trình Phân ca qua GIAO DIỆN (2026-10-28, audit V6 việc 4 — trước đó user-journey-matrix ghi NOT_COVERED: logic có unit test
 * nhưng chưa bài nào bấm qua màn). Chế độ Dùng Thử, không cloud:
 *   nhập Excel nhân viên → modal cấu hình (đủ bộ phận, LOẠI "BP Kế Toán") → đặt tên siêu thị → Lưu → Tạo lịch
 *   → lịch hiện đúng siêu thị, bảng thống kê ca có số, tên nhân viên có trên lịch, không lỗi JS.
 */
async function hanhTrinh(page: Page) {
    const loi: string[] = [];
    page.on('pageerror', e => loi.push(e.message));
    await page.goto('/?tab=tools-phanca');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Tạo lịch' })).toBeVisible({ timeout: 30_000 });

    await page.locator('input[type="file"]').first().setInputFiles(fileNhanVien());
    const modal = page.getByRole('dialog', { name: /Cấu Hình Nhập Nhân Viên/i });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/DANH SÁCH NHÂN VIÊN \(10\)/i)).toBeVisible(); // 8 All In One + 2 Kho, Kế toán bị loại
    await expect(modal.getByText('301 - Kế Toán X')).toHaveCount(0);
    await expect(modal.getByText('201 - Thủ Kho A')).toBeVisible();

    await modal.getByPlaceholder(/VD: 1234/).fill('9999 - ST Thử');
    await modal.getByRole('button', { name: 'Lưu & Tiếp Tục' }).click();
    await expect(modal).toBeHidden();

    await page.getByRole('button', { name: 'Tạo lịch' }).click();
    await expect(page.getByText(/LỊCH PHÂN CA - 9999 - ST Thử/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/THỐNG KÊ NHÂN SỰ THEO CA/i).first()).toBeVisible();
    // Bảng thống kê có ít nhất một ô > 0 (đã xếp người vào ca).
    const coNguoi = await page.locator('table').first().evaluate(t => Array.from(t.querySelectorAll('td')).some(td => /^\s*[1-9]\d*\s*$/.test(td.textContent || '')));
    expect(coNguoi).toBe(true);
    // Lịch hiện tên rút gọn (abbreviateVietnameseName): "100 - Nhân Viên 1" → "100 - V.1".
    await expect(page.getByText('100 - V.1').first()).toBeAttached();
    expect(loi).toEqual([]);
}

test.describe('laptop 1366', () => {
    test.use({ viewport: { width: 1366, height: 900 } });
    test('nhập NV → tạo lịch', async ({ page }) => { await hanhTrinh(page); });
});

test.describe('iPhone 390 (cảm ứng)', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('nhập NV → tạo lịch, không tràn ngang trang', async ({ page }) => {
        await hanhTrinh(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
});
