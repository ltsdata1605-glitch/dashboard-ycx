import { expect, test } from '@playwright/test';

for (const floating of [false, true]) {

for (const width of [390, 1366]) {
    test.describe(`Dropdown ${floating ? 'floating' : 'inline'} ${width}`, () => {
        test.use({ viewport: { width, height: 844 } });
        test('span icon trigger has a name without nested interactive controls', async ({ page }) => {
            await page.goto(`/tests/e2e/helpers/materialHarness.html?dropdown${floating ? '&floating' : ''}`);
            const trigger = page.locator('[data-dropdown-trigger]');
            await expect(trigger).toHaveAccessibleName('Chọn chế độ xem');
            await expect(trigger.locator('button,[role="button"]')).toHaveCount(0);
        });
        test('keyboard selection skips disabled items and restores focus to trigger', async ({ page }) => {
            await page.goto(`/tests/e2e/helpers/materialHarness.html?dropdown${floating ? '&floating' : ''}`);
            const trigger = page.locator('[data-dropdown-trigger]');
            await expect(trigger).toBeVisible();
            await page.keyboard.press('Tab');
            await expect(trigger).toBeFocused();
            await page.keyboard.press('ArrowDown');
            await expect(page.getByRole('button', { name: 'Kỳ này', exact:true })).toBeFocused();
            await page.keyboard.press('End');
            await expect(page.getByRole('button', { name:'Tổng hợp', exact:true })).toBeFocused();
            await page.keyboard.press('Home');
            await page.keyboard.press('ArrowDown');
            await expect(page.getByRole('button', { name:'Kỳ trước', exact:true })).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(page.locator('output')).toHaveText('previous');
            await expect(page.locator('[data-dropdown-panel]')).toHaveCount(0);
            await expect(trigger).toBeFocused();
            await page.keyboard.press('ArrowDown');
            await expect(page.getByRole('button', { name:'Kỳ trước', exact:true })).toBeFocused();
            await page.screenshot({path:`audit/evidence/${process.env.AUDIT_SCREENSHOT_PREFIX || 'c16'}-dropdown-${floating ? 'floating' : 'inline'}-${width}.png`, animations:'disabled'});
        });
        test('Escape returns focus but outside click preserves the destination focus', async ({ page }) => {
            await page.goto(`/tests/e2e/helpers/materialHarness.html?dropdown${floating ? '&floating' : ''}`);
            const trigger = page.locator('[data-dropdown-trigger]');
            await trigger.click();
            await page.getByRole('button', { name:'Kỳ này', exact:true }).hover();
            await page.keyboard.press('Escape');
            await expect(trigger).toBeFocused();
            await expect(trigger).toHaveAttribute('aria-expanded','false');
            await trigger.click();
            const outside = page.getByRole('button', {name:'Bên ngoài'});
            await outside.click();
            await expect(page.locator('[data-dropdown-panel]')).toHaveCount(0);
            await expect(outside).toBeFocused();
        });
    });
}

test.describe(`Dropdown touch emulation ${floating ? 'floating' : 'inline'}`, () => {
    test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    test('tap selects and reopening preserves the current item', async ({ page }) => {
        await page.goto(`/tests/e2e/helpers/materialHarness.html?dropdown${floating ? '&floating' : ''}`);
        const trigger = page.locator('[data-dropdown-trigger]');
        await trigger.tap();
        await page.getByRole('button', {name:'Kỳ trước',exact:true}).tap();
        await expect(page.locator('output')).toHaveText('previous');
        await expect(trigger).toHaveAttribute('aria-expanded','false');
        await trigger.tap();
        await expect(page.getByRole('button', {name:'Kỳ trước',exact:true})).toHaveAttribute('aria-current','true');
    });
});

}

test('floating dropdown follows viewport resize and page scroll', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto('/tests/e2e/helpers/materialHarness.html?dropdown&floating');
    const trigger = page.locator('[data-dropdown-trigger]');
    await trigger.click();
    const panel = page.locator('[data-dropdown-panel]');
    await expect(panel).toBeVisible();
    const anchored = () => panel.evaluate(el => {
        const box=el.getBoundingClientRect();
        const anchor=el.parentElement!.querySelector('[data-dropdown-trigger]')!.getBoundingClientRect();
        return Math.abs(box.top-anchor.bottom-6)<1 && box.left>=7 && box.right<=innerWidth-7;
    });
    await expect.poll(anchored).toBe(true);
    await page.setViewportSize({width:320,height:568});
    await expect.poll(anchored).toBe(true);
    await page.mouse.move(310,550);
    await page.mouse.wheel(0,16);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(16);
    await expect.poll(anchored).toBe(true);
    await page.getByRole('button',{name:'Kỳ trước',exact:true}).click();
    await expect(page.locator('output')).toHaveText('previous');
    await expect(trigger).toBeFocused();
});
