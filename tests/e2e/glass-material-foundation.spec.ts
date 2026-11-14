import { expect, test } from '@playwright/test';
import { appPath } from './helpers/appBase';

// React ActionMenu thật, callbacks cục bộ trong appleUiHarness; không chèn DOM giả cho trạng thái.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('Material token và reduced transparency trên action sheet thật', async ({ page, context }) => {
    await page.goto(appPath('/tests/e2e/helpers/materialHarness.html'));
    await page.getByTestId('menu-thu').click();
    const material = page.locator('[data-action-sheet] .ycx-material').first();
    await expect(material).toBeVisible();
    const normal = await material.evaluate(el => {
        const css = getComputedStyle(el);
        return { filter: css.backdropFilter, token: css.getPropertyValue('--material-filter').trim() };
    });
    // Computed style chuẩn hóa 180% thành 1.8; so sánh cùng đơn vị.
    const normalizedToken = normal.token.replace(/saturate\((\d+)%\)/, (_, percent) => `saturate(${Number(percent) / 100})`);
    expect(normal.filter).toBe(normalizedToken);
    expect(normal.filter).toContain('blur(20px)');
    await material.evaluate(el => (el as HTMLElement).style.setProperty('--material-filter', 'blur(12px)'));
    await expect(material).toHaveCSS('backdrop-filter', 'blur(12px)');
    await material.evaluate(el => (el as HTMLElement).style.removeProperty('--material-filter'));
    await expect(material).toHaveCSS('backdrop-filter', normal.filter);
    // CDP chỉ mô phỏng media preference, không giả lập hành vi component.
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    await expect(material).toHaveCSS('backdrop-filter', 'none');
    await expect(material).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    const cancel = page.getByRole('button', { name: 'Huỷ', exact: true });
    console.log('material viewport diagnostics', await cancel.evaluate(el => ({
        innerWidth, innerHeight, visualWidth: visualViewport?.width, visualHeight: visualViewport?.height,
        documentWidth: document.documentElement.scrollWidth,
        cancel: el.getBoundingClientRect().toJSON(),
        sheet: el.closest('[data-action-sheet]')?.getBoundingClientRect().toJSON(),
    })));
    await expect.poll(async () => {
        const box = await cancel.boundingBox();
        return box ? box.y + box.height : Number.POSITIVE_INFINITY;
    }).toBeLessThanOrEqual(844);
    await page.screenshot({ path: 'audit/evidence/correction-material-reduced.png', animations: 'disabled' });
    await page.getByRole('button', { name: 'Huỷ', exact: true }).click();
    await expect(material).toHaveCount(0);
});

for (const width of [320, 390, 440]) {
    test(`Aggregate harness fits ${width}px and keeps cancel in viewport`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?aggregate'));
        await expect(page.getByTestId('menu-thu')).toBeVisible();
        console.log('overflow candidates', await page.evaluate(() =>
            Array.from(document.querySelectorAll('body *')).filter(el => {
                const box = el.getBoundingClientRect();
                return box.width > 0 && box.right > document.documentElement.clientWidth + 1;
            }).map(el => ({ tag: el.tagName, id: el.id, text: el.textContent?.slice(0, 60), className: el.className, right: el.getBoundingClientRect().right }))));
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        await page.getByTestId('menu-thu').click();
        const cancel = page.getByRole('button', { name: 'Huỷ', exact: true });
        await expect.poll(async () => {
            const box = await cancel.boundingBox();
            return box ? box.y + box.height : Infinity;
        }).toBeLessThanOrEqual(844);
        await cancel.click();
        await expect(page.locator('[data-action-sheet]')).toHaveCount(0);
    });
}
