import { expect, test } from '@playwright/test';

/**
 * Audit 2026-10-07 (GĐ4):
 *  1. CSS Phân ca không còn ĐÈ kiểu toàn app sau khi mở tab Phân ca (trước: .animate-fade-in toàn app
 *     đổi 0.2s → 0.3s + @keyframes fadeIn bị thay).
 *  2. Vùng chạm 44px theo THIẾT BỊ CẢM ỨNG, không theo bề rộng: iPad ngang có nút ≥44px, laptop chuột giữ cỡ gọn.
 */
const probeFadeIn = (page: import('@playwright/test').Page) => page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'animate-fade-in';
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const r = { duration: cs.animationDuration, name: cs.animationName };
    el.remove();
    return r;
});


/**
 * Chiều cao bố cục (offsetHeight) của các nút dùng chung cỡ sm/md ĐANG HIỆN THẬT. 2026-10-29: bản cũ lấy `[data-ui="shared"]:visible`
 * ĐẦU TIÊN — Playwright coi phần tử mờ 0 là "visible", nên số đo rơi vào menu tài khoản đang ẨN ở thanh bên (opacity-0, scale-95):
 * CI hằng đêm đo ra 24px (nút icon-xs "Đăng xuất" trong menu ẩn) rồi báo đỏ dù nút thật cao 44.
 */
const doNutSmMd = (page: import('@playwright/test').Page) => page.evaluate(() => {
    const an = (el: Element | null): boolean => {
        for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none') return true; }
        return false;
    };
    return Array.from(document.querySelectorAll<HTMLElement>('button[data-ui="shared"]'))
        .filter(b => /h-\[var\(--btn-height-(sm|md)\)\]/.test(b.className) && b.offsetHeight > 0 && !an(b))
        .map(b => ({ h: b.offsetHeight, ten: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 30) }));
});

test('mở Phân ca không làm đổi hiệu ứng .animate-fade-in của cả app', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).click();
    await page.waitForTimeout(1500);
    const before = await probeFadeIn(page);
    await page.goto('/?tab=tools-phanca');
    await page.locator('.phanca-root').first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1000);
    const after = await probeFadeIn(page);
    console.log('animate-fade-in TRƯỚC:', JSON.stringify(before), 'SAU khi mở Phân ca:', JSON.stringify(after));
    expect(after).toEqual(before);
});

test.describe('vùng chạm theo thiết bị cảm ứng', () => {
    test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true });
    test('iPad ngang (cảm ứng, 1024px): nút dùng chung ≥ 44px', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).click();
        await page.waitForTimeout(1500);
        await page.goto('/?tab=tools-phanca');
        await page.locator('.phanca-root').first().waitFor({ timeout: 30_000 });
        await page.waitForTimeout(1500);
        const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
        const nut = await doNutSmMd(page);
        console.log('pointer coarse:', coarse, '| nút sm/md:', JSON.stringify(nut));
        expect(coarse).toBe(true);
        expect(nut.length).toBeGreaterThan(0);
        expect(nut.filter(n => n.h < 44)).toEqual([]);
    });
});

test('laptop dùng chuột (1366px): nút dùng chung giữ cỡ gọn < 44px', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).click();
    await page.waitForTimeout(1500);
    await page.goto('/?tab=tools-phanca');
    await page.locator('.phanca-root').first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    const nut = await doNutSmMd(page);
    console.log('laptop — nút sm/md:', JSON.stringify(nut));
    expect(nut.length).toBeGreaterThan(0);
    expect(nut.filter(n => n.h >= 44)).toEqual([]);
});
