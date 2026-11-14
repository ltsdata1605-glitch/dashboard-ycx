import { expect, test } from '@playwright/test';
import { appPath } from './helpers/appBase';

for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 900 }]) {
    test.describe(`Shared glass controls ${viewport.width}`, () => {
        const mobile = viewport.width < 1024;
        test.use({ viewport, isMobile: mobile, hasTouch: mobile });

        test('tokens, active/disabled, keyboard focus and transparency fallback', async ({ page, context }) => {
            await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?controls'));
            const capsule = page.getByRole('group', { name: 'Phân hệ', exact: true });
            const first = capsule.getByRole('button', { name: 'Siêu thị' });
            const second = capsule.getByRole('button', { name: 'Nhân viên' });
            await expect(first).toHaveAttribute('aria-pressed', 'true');
            await expect(capsule.getByRole('button', { name: 'Đang đồng bộ' })).toBeDisabled();
            await page.keyboard.press('Tab');
            await expect(first).toBeFocused();
            const ring = await first.evaluate(el => {
                const s = getComputedStyle(el);
                return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset, color: s.outlineColor };
            });
            expect(ring.style).toBe('solid');
            expect(ring.width).toBe('2px');
            expect(ring.offset).toBe('2px');
            expect(ring.color).not.toBe('rgba(0, 0, 0, 0)');
            await page.keyboard.press('Tab');
            await expect(second).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(second).toHaveAttribute('aria-pressed', 'true');
            await expect(first).toHaveAttribute('aria-pressed', 'false');
            expect((await first.boundingBox())?.width).toBe(32);
            expect((await first.boundingBox())?.height).toBe(32);
            // Liquid Glass (CLAUDE.md, 2026-10-30): kính chạy cả trên điện thoại — đây là chất liệu chính của thanh tab nổi iPhone.
            await expect(capsule).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.8)');
            if (mobile) {
                const hit = await first.evaluate(el => {
                    const r = el.getBoundingClientRect(), s = getComputedStyle(el, '::after');
                    return { width: r.width - parseFloat(s.left) - parseFloat(s.right), height: r.height - parseFloat(s.top) - parseFloat(s.bottom) };
                });
                expect(hit.width).toBeGreaterThanOrEqual(44);
                expect(hit.height).toBeGreaterThanOrEqual(44);
            } else {
                await capsule.evaluate(el => (el as HTMLElement).style.setProperty('--glass-bg', 'rgb(240, 245, 250)'));
                await expect(capsule).toHaveCSS('background-color', 'rgb(240, 245, 250)');
                await capsule.evaluate(el => (el as HTMLElement).style.removeProperty('--glass-bg'));
                const toolbar = page.getByRole('toolbar', { name: 'Thao tác' });
                await expect(toolbar).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.8)');
                await expect(toolbar.getByRole('button', { name: 'Khoá' })).toBeDisabled();
                await toolbar.getByRole('button', { name: 'Tăng' }).click();
                await expect(page.getByTestId('count')).toHaveText('1');
            }
            const cdp = await context.newCDPSession(page);
            await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
            await expect(capsule).toHaveCSS('backdrop-filter', 'none');
            await expect(capsule).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.97)');
            if (!mobile) await expect(page.getByRole('toolbar', { name: 'Thao tác' })).toHaveCSS('backdrop-filter', 'none');
            await page.screenshot({ path: `audit/evidence/c3-glass-${viewport.width}.png`, animations: 'disabled' });
            await cdp.send('Emulation.setEmulatedMedia', { features: [] });
            await expect(capsule).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.8)');
            await page.emulateMedia({ forcedColors: 'active' });
            await expect(capsule).toHaveCSS('backdrop-filter', 'none');
        });
    });
}
