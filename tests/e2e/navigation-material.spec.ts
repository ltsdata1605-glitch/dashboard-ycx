import { expect, test, type Page } from '@playwright/test';
import { moCheckThuong, napFileThuong, taoFileThuong } from './helpers/checkThuongNative';
import { createSalesXlsx, seedProductConfigFixture } from './helpers/salesFixture';

async function openLocalData(page: Page) {
    await page.goto('/?tab=analysis');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click();
    await seedProductConfigFixture(page);
    await page.locator('input[type="file"]').first().setInputFiles(createSalesXlsx());
    await page.locator('[data-modal-overlay]').getByText('Tệp Realtime (Xem nhanh)').click();
    await expect(page.getByText(/chi tiết theo kho/i).first()).toBeVisible();
}

test.describe('navigation material', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('real app dock and navbar respect reduced transparency', async ({ page, context }) => {
        await openLocalData(page);
        // <nav> trong suốt theo thiết kế — kính nằm ở viên GlassSurface bên trong (MobileBottomNav.tsx).
        const dock = page.locator('nav[aria-label="Điều hướng chính"] > .ycx-glass').first();
        const capsule = page.locator('.ycx-navbar [data-navbar-actions]');
        await expect(dock).toBeVisible();
        await expect(capsule).toBeVisible();
        await expect(dock).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.8)');
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
        await expect(dock).toHaveCSS('backdrop-filter', 'none');
        await expect(dock).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.97)');
        await expect(capsule).toHaveCSS('backdrop-filter', 'none');
        await expect(capsule).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.97)');
        await page.screenshot({ path: 'audit/evidence/c4-navigation-mobile.png', animations: 'disabled' });
        await cdp.send('Emulation.setEmulatedMedia', { features: [] });
        await expect(dock).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.8)');
        await page.emulateMedia({ forcedColors: 'active' });
        await expect(dock).toHaveCSS('backdrop-filter', 'none');
        await expect(capsule).toHaveCSS('backdrop-filter', 'none');
    });
});

test.describe('Check thuong capsule', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('data-thay-tieu-de branch uses the same fallback', async ({ page, context }) => {
        await moCheckThuong(page);
        await napFileThuong(page, taoFileThuong());
        await expect(page.locator('#mobile-topbar-actions [data-thay-tieu-de]')).toBeVisible();
        const capsule = page.locator('.ycx-navbar [data-action-capsule]');
        await expect(capsule).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.8)'); // cụm con nhộng thanh trên dùng chung token kính --glass-*
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
        await expect(capsule).toHaveCSS('backdrop-filter', 'none');
        await expect(capsule).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.97)');
        await page.screenshot({ path: 'audit/evidence/c4-check-thuong-capsule.png', animations: 'disabled' });
    });
});

test.describe('system group', () => {
    test.use({ viewport: { width: 1366, height: 900 } });
    test('keyboard focus ring is not clipped by the system group', async ({ page }, testInfo) => {
        if (process.env.AUDIT_FOCUS_EMPTY === '1') {
            await page.goto('/?tab=analysis');
            await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click();
        } else await openLocalData(page);
        const font = page.locator('#global-header-actions button').filter({ has: page.locator('svg[data-icon="font"]') }).first();
        await expect(font).toBeVisible();
        const focusTrace = [];
        const key = process.env.AUDIT_FOCUS_KEY || 'Tab';
        for (let step = 0; step < 80; step++) {
            await page.keyboard.press(key);
            focusTrace.push(await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id, title: document.activeElement?.getAttribute('title') })));
            if (await font.evaluate(el => el === document.activeElement)) break;
        }
        await testInfo.attach('keyboard-sequence', { body: JSON.stringify({ key, focusTrace }), contentType: 'application/json' });
        console.log('keyboard sequence', JSON.stringify({ key, focusTrace }));
        await expect(font).toBeFocused();
        await expect(font).toHaveCSS('outline-style', 'solid');
        await expect(font).toHaveCSS('outline-width', '2px');
        await expect(font).toHaveCSS('outline-offset', '2px');
        const clipping = await font.evaluate(el => {
            const box = el.getBoundingClientRect(), css = getComputedStyle(el);
            const extent = parseFloat(css.outlineWidth) + parseFloat(css.outlineOffset);
            const parents = [];
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
                const style = getComputedStyle(p), rect = p.getBoundingClientRect();
                if (['hidden', 'clip'].includes(style.overflowX) &&
                    (box.left - extent < rect.left || box.right + extent > rect.right || box.top - extent < rect.top || box.bottom + extent > rect.bottom)) {
                    parents.push({ className: p.className, overflow: style.overflowX });
                }
            }
            return parents;
        });
        console.log('focus clipping ancestors', clipping);
        expect(clipping).toEqual([]);
        await page.screenshot({ path: `audit/evidence/${process.env.AUDIT_RUN || 'c4'}-system-focus.png`, animations: 'disabled' });
    });
});
