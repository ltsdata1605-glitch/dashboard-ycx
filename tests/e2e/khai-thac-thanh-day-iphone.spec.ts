import { expect, test } from '@playwright/test';

/**
 * Báo cáo khai thác trên iPhone (2026-11-14): thanh thao tác dính đáy dùng kính chung `GlassSurface` (trước: tự viết lớp làm mờ nền
 * của Tailwind — khối tiết kiệm pin tắt nó trên điện thoại), sheet "Xem trước" là `Modal position="bottom"` (trước: tự dựng
 * `fixed inset-0`). Kiểm: thanh có `.ycx-glass`, tràn mép, không bo góc; chạm thanh mở sheet chung (role dialog, có văn bản xem
 * trước); "Đóng" tắt sheet. Màu icon 5 nhóm thuộc 5 họ semantic.
 */
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('iPhone: thanh đáy là kính dùng chung, chạm mở sheet xem trước dùng chung', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).click();
    await page.goto('/?tab=reports');
    await expect(page.getByTestId('khai-thac-view')).toBeVisible({ timeout: 30_000 });

    const thanh = page.locator('.ycx-glass', { has: page.getByRole('button', { name: 'Xem trước tóm tắt báo cáo' }) });
    await expect(thanh).toBeVisible({ timeout: 15_000 });
    const kieu = await thanh.evaluate((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { radius: cs.borderTopLeftRadius, left: r.left, right: r.right, bottom: r.bottom, vw: innerWidth, vh: innerHeight, borderLeft: cs.borderLeftWidth, borderTop: cs.borderTopWidth, position: cs.position };
    });
    expect(kieu.position).toBe('fixed');
    expect(kieu.radius).toBe('0px');
    expect(kieu.left).toBe(0);
    expect(Math.round(kieu.right)).toBe(kieu.vw);
    expect(Math.round(kieu.bottom)).toBe(kieu.vh);
    expect(kieu.borderLeft).toBe('0px');
    expect(kieu.borderTop).toBe('1px');

    // Màu icon nhóm — mọi ô icon của dải nhóm phải thuộc 5 họ semantic (không còn blue/violet/teal/indigo).
    const nenIcon = await page.getByTestId('khai-thac-view').evaluate((root) =>
        [...root.querySelectorAll('[class*="bg-"]')].flatMap((el) => [...el.classList].filter((c) => /^bg-(blue|violet|teal|indigo)-/.test(c))));
    expect(nenIcon).toEqual([]);

    await page.screenshot({ path: test.info().outputPath('thanh-day.png') });

    await page.getByRole('button', { name: 'Xem trước tóm tắt báo cáo' }).tap();
    const sheet = page.getByRole('dialog', { name: 'Xem trước văn bản Zalo/Line' });
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('pre')).toContainText('BÁO CÁO KHAI THÁC');
    await page.screenshot({ path: test.info().outputPath('sheet-xem-truoc.png') });

    // Có 2 nút "Đóng": nút × ở đầu sheet (aria-label) và nút chữ ở chân — bấm nút ở chân.
    await sheet.getByRole('button', { name: 'Đóng', exact: true }).last().tap();
    await expect(sheet).toBeHidden();
});
