import { expect, test } from '@playwright/test';
import { createSalesXlsx } from './helpers/salesFixture';

/**
 * Biến thể Button `toolbar` (2026-10-28) — "Card Header Action Buttons Standard": 32 nút icon bật/tắt ở đầu thẻ/bảng trước tự chép 2
 * chuỗi màu, nay dùng chung. Đo kiểu TÍNH TOÁN thật (Chromium): BẬT (aria-pressed=true) = nền sky-50, chữ sky-700, viền sky-300;
 * TẮT = chữ slate-400, nền trong suốt; laptop 36px. Bấm nút đổi chế độ thì aria-pressed + màu đổi theo.
 */
test.use({ viewport: { width: 1366, height: 900 } });
test('nút toolbar: màu bật/tắt đúng chuẩn, cỡ 36 laptop, bấm đổi trạng thái', async ({ page }) => {
    await page.goto('/?tab=analysis');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
    await page.locator('input[type="file"]').first().setInputFiles(createSalesXlsx());
    await page.locator('[data-modal-overlay]').getByText('Tệp Realtime (Xem nhanh)').click();
    await expect(page.getByText(/chi tiết theo kho/i).first()).toBeVisible({ timeout: 90_000 });
    await page.waitForTimeout(1500);
    const doMau = () => page.evaluate(() => Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-pressed][data-ui]'))
        .filter(b => b.offsetParent && /text-slate-400/.test(b.className))
        .map(b => { const c = getComputedStyle(b); const r = b.getBoundingClientRect();
            return { bat: b.getAttribute('aria-pressed') === 'true', bg: c.backgroundColor, mau: c.color, vien: c.borderTopColor, h: Math.round(r.height), ten: b.getAttribute('title') || b.getAttribute('aria-label') || b.textContent?.trim().slice(0, 15) }; }));
    const ds = await doMau();
    expect(ds.length, 'có nút toolbar trên màn').toBeGreaterThan(3);
    for (const n of ds) {
        if (n.bat) { expect(n.bg, n.ten!).toBe('oklch(0.977 0.013 236.62)'); expect(n.mau, n.ten!).toBe('oklch(0.5 0.134 242.749)'); expect(n.vien, n.ten!).toBe('oklch(0.828 0.111 230.318)'); }
        else { expect(n.bg, n.ten!).toBe('rgba(0, 0, 0, 0)'); expect(n.mau, n.ten!).toBe('oklch(0.704 0.04 256.788)'); }
    }
    expect(ds.filter(n => n.bat).length, 'có ít nhất 1 nút đang bật').toBeGreaterThan(0);
    const vuong = ds.filter(n => n.h >= 30);
    for (const n of vuong) expect(n.h, n.ten!).toBe(36);
    // Bấm một nút đang TẮT → thành BẬT (cặp chế độ xem loại trừ nhau).
    const tat = page.locator('button[aria-pressed="false"][data-ui]').filter({ hasNot: page.locator('[disabled]') }).first();
    const id = await tat.evaluate(b => { b.setAttribute('data-thu', '1'); return b.getAttribute('title'); });
    await tat.click();
    await expect(page.locator('[data-thu="1"]')).toHaveAttribute('aria-pressed', 'true');
    test.info().annotations.push({ type: 'do', description: JSON.stringify({ so: ds.length, bam: id }) });
});
